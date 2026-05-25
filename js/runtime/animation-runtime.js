import { registerDisposer } from './teardown.js';

class AnimationRuntime {
    constructor() {
        this.owners = new Map();
    }

    getOwnerBucket(owner) {
        const ownerId = owner || 'default';
        if (!this.owners.has(ownerId)) {
            this.owners.set(ownerId, {
                timeouts: new Set(),
                intervals: new Set(),
                rafLoops: new Set(),
                disposers: new Set()
            });
        }
        return this.owners.get(ownerId);
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
                }
            }
        };

        token.handle = setTimeout(() => {
            bucket.timeouts.delete(token);
            callback();
        }, delay);

        bucket.timeouts.add(token);
        return token;
    }

    scheduleInterval(owner, callback, delay) {
        const bucket = this.getOwnerBucket(owner);
        const token = {
            owner,
            type: 'interval',
            handle: setInterval(callback, delay),
            clear: () => {
                if (bucket.intervals.delete(token)) {
                    clearInterval(token.handle);
                }
            }
        };

        bucket.intervals.add(token);
        return token;
    }

    scheduleRafLoop(owner, callback) {
        const bucket = this.getOwnerBucket(owner);
        const token = {
            owner,
            type: 'raf',
            handle: null,
            active: true,
            clear: () => {
                token.active = false;
                if (bucket.rafLoops.delete(token) && token.handle !== null) {
                    cancelAnimationFrame(token.handle);
                }
            }
        };

        const tick = (time) => {
            if (!token.active) return;
            callback(time);
            token.handle = requestAnimationFrame(tick);
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
                    disposer();
                }
            }
        };
        bucket.disposers.add(token);
        return token;
    }

    disposeOwner(owner) {
        const bucket = this.owners.get(owner);
        if (!bucket) return 0;

        const tokens = [
            ...bucket.timeouts,
            ...bucket.intervals,
            ...bucket.rafLoops,
            ...bucket.disposers
        ];

        tokens.forEach(token => token.clear());
        this.owners.delete(owner);
        return tokens.length;
    }

    disposeAll() {
        Array.from(this.owners.keys()).forEach(owner => this.disposeOwner(owner));
    }

    getStats() {
        const owners = {};
        this.owners.forEach((bucket, owner) => {
            owners[owner] = {
                timeouts: bucket.timeouts.size,
                intervals: bucket.intervals.size,
                rafLoops: bucket.rafLoops.size,
                disposers: bucket.disposers.size
            };
        });
        return { owners };
    }
}

const animationRuntime = new AnimationRuntime();

if (typeof window !== 'undefined') {
    window.animationRuntime = animationRuntime;
}

registerDisposer(() => animationRuntime.disposeAll());

export { AnimationRuntime };
export default animationRuntime;
