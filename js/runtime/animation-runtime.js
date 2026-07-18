import { registerDisposer } from './teardown.js';

class AnimationRuntime {
    constructor() {
        this.owners = new Map();
        this.cadenceTasks = new Set();
        this.cadenceTimer = null;
        this.cadenceTimerDue = 0;
        this.cadenceTaskCounter = 0;
    }

    now() {
        return typeof performance !== 'undefined' && typeof performance.now === 'function'
            ? performance.now()
            : Date.now();
    }

    getOwnerBucket(owner) {
        const ownerId = owner || 'default';
        if (!this.owners.has(ownerId)) {
            this.owners.set(ownerId, {
                timeouts: new Set(),
                intervals: new Set(),
                rafLoops: new Set(),
                animations: new Set(),
                nodes: new Set(),
                disposers: new Set(),
                createdAt: Date.now()
            });
        }
        return this.owners.get(ownerId);
    }

    releaseOwnerIfIdle(owner, bucket) {
        if (!bucket) return false;
        const idle = bucket.timeouts.size === 0 &&
            bucket.intervals.size === 0 &&
            bucket.rafLoops.size === 0 &&
            bucket.animations.size === 0 &&
            bucket.nodes.size === 0 &&
            bucket.disposers.size === 0;
        if (idle && this.owners.get(owner || 'default') === bucket) {
            this.owners.delete(owner || 'default');
        }
        return idle;
    }

    scheduleTimeout(owner, callback, delay) {
        const bucket = this.getOwnerBucket(owner);
        const token = {
            owner,
            type: 'timeout',
            handle: null,
            clear: () => {
                if (bucket.timeouts.delete(token)) {
                    clearTimeout(token.handle);
                    this.releaseOwnerIfIdle(owner, bucket);
                }
            }
        };

        token.handle = setTimeout(() => {
            bucket.timeouts.delete(token);
            try { callback(); } catch (error) {
                console.error(`[AnimationRuntime] timeout failed for ${owner}:`, error);
            } finally {
                this.releaseOwnerIfIdle(owner, bucket);
            }
        }, delay);

        bucket.timeouts.add(token);
        return token;
    }

    scheduleInterval(owner, callback, delay) {
        const bucket = this.getOwnerBucket(owner);
        const cadence = Math.max(1, Number(delay) || 1);
        const token = {
            owner,
            type: 'interval',
            id: ++this.cadenceTaskCounter,
            handle: null,
            delay: cadence,
            nextDue: this.now() + cadence,
            active: true,
            callback,
            clear: () => {
                if (bucket.intervals.delete(token)) {
                    token.active = false;
                    this.cadenceTasks.delete(token);
                    this.stopCadenceDriverIfIdle();
                    this.releaseOwnerIfIdle(owner, bucket);
                }
            }
        };

        // `handle` remains a stable compatibility reference, but all periodic
        // work shares one deadline driver instead of allocating one browser
        // timer per subsystem/effect family.
        token.handle = token;
        bucket.intervals.add(token);
        this.cadenceTasks.add(token);
        this.scheduleCadenceDriver();
        return token;
    }

    scheduleCadenceDriver() {
        if (this.cadenceTasks.size === 0) {
            this.stopCadenceDriverIfIdle();
            return;
        }

        let earliest = Infinity;
        this.cadenceTasks.forEach(task => {
            if (task.active && task.nextDue < earliest) earliest = task.nextDue;
        });
        if (!Number.isFinite(earliest)) return;

        // Keep the existing wake-up when it is already early enough. New
        // earlier deadlines reschedule the one shared timer.
        if (this.cadenceTimer !== null && this.cadenceTimerDue <= earliest + 1) return;
        if (this.cadenceTimer !== null) clearTimeout(this.cadenceTimer);

        const wait = Math.max(0, earliest - this.now());
        this.cadenceTimerDue = earliest;
        this.cadenceTimer = setTimeout(() => this.runCadenceTasks(), wait);
    }

    runCadenceTasks() {
        this.cadenceTimer = null;
        this.cadenceTimerDue = 0;
        const now = this.now();

        // A throttled/background tab executes each due task once. Missed
        // periods are skipped rather than replayed in a CPU-spiking burst.
        Array.from(this.cadenceTasks).forEach(token => {
            if (!token.active || now + 0.5 < token.nextDue) return;
            const periodsElapsed = Math.max(1, Math.floor((now - token.nextDue) / token.delay) + 1);
            token.nextDue += periodsElapsed * token.delay;
            try { token.callback(); } catch (error) {
                console.error(`[AnimationRuntime] interval failed for ${token.owner}:`, error);
            }
        });

        this.scheduleCadenceDriver();
    }

    stopCadenceDriverIfIdle() {
        if (this.cadenceTasks.size > 0) return;
        if (this.cadenceTimer !== null) clearTimeout(this.cadenceTimer);
        this.cadenceTimer = null;
        this.cadenceTimerDue = 0;
    }

    scheduleRafLoop(owner, callback, options = {}) {
        const bucket = this.getOwnerBucket(owner);
        const maxFps = Number(options.maxFps || options.fps || 0);
        const minFrameMs = maxFps > 0 ? 1000 / maxFps : 0;
        const token = {
            owner,
            type: 'raf',
            handle: null,
            active: true,
            lastRun: 0,
            clear: () => {
                token.active = false;
                if (bucket.rafLoops.delete(token) && token.handle !== null) {
                    cancelAnimationFrame(token.handle);
                }
                this.releaseOwnerIfIdle(owner, bucket);
            }
        };

        const tick = (time) => {
            if (!token.active) return;
            if (!minFrameMs || time - token.lastRun >= minFrameMs) {
                const delta = token.lastRun ? time - token.lastRun : 0;
                token.lastRun = time;
                try { callback(time, delta); } catch (error) {
                    console.error(`[AnimationRuntime] RAF failed for ${owner}:`, error);
                }
            }
            if (token.active) token.handle = requestAnimationFrame(tick);
        };

        token.handle = requestAnimationFrame(tick);
        bucket.rafLoops.add(token);
        return token;
    }

    trackDisposer(owner, disposer) {
        const bucket = this.getOwnerBucket(owner);
        const token = {
            owner,
            type: 'disposer',
            clear: () => {
                if (bucket.disposers.delete(token)) {
                    try { disposer(); } finally {
                        this.releaseOwnerIfIdle(owner, bucket);
                    }
                }
            }
        };
        bucket.disposers.add(token);
        return token;
    }

    trackAnimation(owner, animation) {
        if (!animation || typeof animation.kill !== 'function') return null;
        const bucket = this.getOwnerBucket(owner);
        const token = {
            owner,
            type: 'animation',
            animation,
            clear: () => {
                if (!bucket.animations.delete(token)) return;
                try { animation.kill(); } catch (_) {}
                this.releaseOwnerIfIdle(owner, bucket);
            }
        };
        bucket.animations.add(token);

        // Completed finite GSAP animations must release their bookkeeping
        // token. Infinite timelines never complete and remain owner-managed.
        if (typeof animation.eventCallback === 'function') {
            const runtime = this;
            const releaseOn = (eventName) => {
                const previous = animation.eventCallback(eventName);
                animation.eventCallback(eventName, function(...args) {
                    bucket.animations.delete(token);
                    if (typeof previous === 'function') previous.apply(this, args);
                    runtime.releaseOwnerIfIdle(owner, bucket);
                });
            };
            releaseOn('onComplete');
            releaseOn('onInterrupt');
        }
        return token;
    }

    pauseOwnerAnimations(owner) {
        const bucket = this.owners.get(owner);
        if (!bucket) return 0;
        let paused = 0;
        bucket.animations.forEach(token => {
            try {
                token.animation?.pause?.();
                paused++;
            } catch (_) {}
        });
        return paused;
    }

    resumeOwnerAnimations(owner) {
        const bucket = this.owners.get(owner);
        if (!bucket) return 0;
        let resumed = 0;
        bucket.animations.forEach(token => {
            try {
                token.animation?.resume?.();
                resumed++;
            } catch (_) {}
        });
        return resumed;
    }

    trackNode(owner, node, options = {}) {
        if (!node) return null;
        const bucket = this.getOwnerBucket(owner);
        const remove = options.remove !== false;
        const token = {
            owner,
            type: 'node',
            clear: () => {
                if (!bucket.nodes.delete(token)) return;
                if (remove) {
                    try { node.remove(); } catch (_) {}
                }
                this.releaseOwnerIfIdle(owner, bucket);
            }
        };
        bucket.nodes.add(token);
        return token;
    }

    disposeOwner(owner) {
        const bucket = this.owners.get(owner);
        if (!bucket) return 0;

        const tokens = [
            ...bucket.animations,
            ...bucket.timeouts,
            ...bucket.intervals,
            ...bucket.rafLoops,
            ...bucket.disposers,
            ...bucket.nodes
        ];

        tokens.forEach(token => {
            try { token.clear(); } catch (_) {}
        });
        this.owners.delete(owner);
        return tokens.length;
    }

    disposeAll() {
        Array.from(this.owners.keys()).forEach(owner => this.disposeOwner(owner));
        this.stopCadenceDriverIfIdle();
    }

    getStats() {
        const owners = {};
        this.owners.forEach((bucket, owner) => {
            owners[owner] = {
                timeouts: bucket.timeouts.size,
                intervals: bucket.intervals.size,
                rafLoops: bucket.rafLoops.size,
                animations: bucket.animations.size,
                nodes: bucket.nodes.size,
                disposers: bucket.disposers.size
            };
        });
        return {
            owners,
            sharedCadence: {
                tasks: this.cadenceTasks.size,
                drivers: this.cadenceTimer === null ? 0 : 1
            }
        };
    }
}

const animationRuntime = new AnimationRuntime();

if (typeof window !== 'undefined') {
    window.animationRuntime = animationRuntime;
}

registerDisposer(() => animationRuntime.disposeAll());

export { AnimationRuntime };
export default animationRuntime;
