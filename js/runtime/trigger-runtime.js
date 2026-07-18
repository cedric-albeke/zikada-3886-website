import animationRuntime from './animation-runtime.js';

const MIN_WATCHDOG_DURATION_MS = 30000;
const DEFAULT_WATCHDOG_DURATION_MS = 120000;
let nextRuntimeId = 1;

class TriggerRuntime {
    constructor(options = {}) {
        this.runtime = options.runtime || animationRuntime;
        this.now = typeof options.now === 'function' ? options.now : () => performance.now();
        this.maxConcurrent = Math.max(1, Number(options.maxConcurrent) || 6);
        this.maxNodes = Math.max(1, Number(options.maxNodes) || 64);
        this.maxNodesPerTrigger = Math.max(1, Number(options.maxNodesPerTrigger) || 20);
        this.maxStartsPerWindow = Math.max(1, Number(options.maxStartsPerWindow) || 20);
        this.startWindowMs = Math.max(250, Number(options.startWindowMs) || 5000);
        this.maxQueue = Math.max(1, Number(options.maxQueue) || 24);
        this.active = new Map();
        this.resourceOwners = new Map();
        this.pending = [];
        this.startHistory = [];
        this.sequence = 0;
        this.onChange = null;
        this.rejected = 0;
        this.draining = false;
        this.queueWakeToken = null;
        this.queueOwner = `trigger-runtime:queue:${nextRuntimeId++}`;
    }

    setChangeHandler(handler) {
        this.onChange = typeof handler === 'function' ? handler : null;
        this.notify();
    }

    notify() {
        if (!this.onChange) return;
        try { this.onChange(this.getStats()); } catch (_) {}
    }

    pruneHistory(now = this.now()) {
        const cutoff = now - this.startWindowMs;
        this.startHistory = this.startHistory.filter(timestamp => timestamp >= cutoff);
    }

    canStart() {
        const now = this.now();
        this.pruneHistory(now);
        return this.startHistory.length < this.maxStartsPerWindow;
    }

    recordStart(now = this.now()) {
        this.pruneHistory(now);
        this.startHistory.push(now);
    }

    start(effect, executor, options = {}) {
        const name = String(effect || '').trim();
        if (!name || typeof executor !== 'function') return false;

        const request = {
            name,
            executor,
            options,
            requestedAt: this.now()
        };

        if (!this.canActivate(request) || !this.canStart()) {
            return this.enqueue(request);
        }

        return this.activate(request);
    }

    canActivate(request) {
        if (!request || this.active.has(request.name)) return false;
        if (this.active.size >= this.maxConcurrent) return false;

        const resources = Array.from(new Set(request.options?.resources || []));
        return resources.every(resource => !this.resourceOwners.has(resource));
    }

    enqueue(request) {
        const duplicateIndex = this.pending.findIndex(item => item.name === request.name);
        if (duplicateIndex >= 0) {
            // Coalesce repeated button/MIDI hits while retaining their newest
            // parameters. One pending replay is enough to preserve intent.
            this.pending[duplicateIndex] = request;
            this.notify();
            return true;
        }

        if (this.pending.length >= this.maxQueue) {
            this.rejected++;
            this.notify();
            return false;
        }

        this.pending.push(request);
        this.scheduleQueueWake();
        this.notify();
        return true;
    }

    scheduleQueueWake() {
        if (!this.pending.length || this.queueWakeToken || this.canStart()) return;
        const oldest = this.startHistory[0] || this.now();
        const delay = Math.max(1, oldest + this.startWindowMs - this.now() + 1);
        this.queueWakeToken = this.runtime.scheduleTimeout(this.queueOwner, () => {
            this.queueWakeToken = null;
            this.drainQueue();
        }, delay);
    }

    activate(request) {
        const { name, executor, options = {} } = request;
        const resources = Array.from(new Set(options.resources || []));
        const owner = `trigger:${name}:${++this.sequence}`;
        const record = {
            effect: name,
            owner,
            resources,
            startedAt: this.now(),
            nodeCount: 0,
            maxNodes: Math.min(
                this.maxNodesPerTrigger,
                options.maxNodes == null
                    ? this.maxNodesPerTrigger
                    : Math.max(0, Number(options.maxNodes) || 0)
            ),
            reason: 'active'
        };
        this.recordStart();
        this.active.set(name, record);
        resources.forEach(resource => this.resourceOwners.set(resource, name));

        const isActive = () => this.active.get(name)?.owner === owner;
        const scope = {
            effect: name,
            owner,
            isActive,
            append: (node, parent = document.body) => {
                if (!isActive() || !node) return null;
                const totalNodes = Array.from(this.active.values()).reduce((sum, entry) => sum + entry.nodeCount, 0);
                if (record.nodeCount >= record.maxNodes || totalNodes >= this.maxNodes) {
                    throw new Error(`Trigger DOM budget exceeded for ${name}`);
                }
                if (node.dataset) {
                    node.dataset.triggerFx = name;
                    node.dataset.created = String(Date.now());
                }
                parent.appendChild(node);
                record.nodeCount++;
                this.runtime.trackNode(owner, node);
                return node;
            },
            timeout: (callback, delay) => this.runtime.scheduleTimeout(owner, () => {
                if (isActive()) callback();
            }, Math.max(0, Number(delay) || 0)),
            trackAnimation: animation => this.runtime.trackAnimation(owner, animation),
            cleanup: disposer => this.runtime.trackDisposer(owner, disposer),
            completeAfter: delay => this.runtime.scheduleTimeout(owner, () => this.stop(name, 'complete'), Math.max(0, Number(delay) || 0)),
            finish: () => this.stop(name, 'complete')
        };

        // This is a leak watchdog, never an authored duration or a quality
        // control. A deliberately large floor prevents effect manifests from
        // turning the safety net into a two-to-three-second visual cutoff.
        const watchdogDuration = Math.min(
            600000,
            Math.max(
                MIN_WATCHDOG_DURATION_MS,
                Number(options.watchdogDuration) || DEFAULT_WATCHDOG_DURATION_MS
            )
        );
        this.runtime.scheduleTimeout(owner, () => this.stop(name, 'watchdog-timeout'), watchdogDuration);

        try {
            executor(scope);
        } catch (error) {
            console.error(`[TriggerRuntime] ${name} failed:`, error);
            this.stop(name, 'error');
            return false;
        }

        this.notify();
        return true;
    }

    drainQueue() {
        if (this.draining || !this.pending.length) return;
        this.queueWakeToken?.clear?.();
        this.queueWakeToken = null;
        this.draining = true;
        try {
            let activated = true;
            while (activated && this.pending.length && this.active.size < this.maxConcurrent && this.canStart()) {
                activated = false;
                const nextIndex = this.pending.findIndex(request => this.canActivate(request));
                if (nextIndex >= 0) {
                    const [request] = this.pending.splice(nextIndex, 1);
                    this.activate(request);
                    activated = true;
                }
            }
        } finally {
            this.draining = false;
            this.scheduleQueueWake();
            this.notify();
        }
    }

    stop(effect, reason = 'manual') {
        const name = String(effect || '');
        const record = this.active.get(name);
        if (!record) return false;

        this.active.delete(name);
        record.resources.forEach(resource => {
            if (this.resourceOwners.get(resource) === name) this.resourceOwners.delete(resource);
        });
        record.reason = reason;
        this.runtime.disposeOwner(record.owner);
        this.notify();
        this.drainQueue();
        return true;
    }

    stopAll(reason = 'manual') {
        this.draining = true;
        this.pending.length = 0;
        this.queueWakeToken?.clear?.();
        this.queueWakeToken = null;
        this.runtime.disposeOwner?.(this.queueOwner);
        Array.from(this.active.keys()).forEach(effect => this.stop(effect, reason));
        this.draining = false;
        this.notify();
    }

    getStats() {
        this.pruneHistory();
        return {
            active: this.active.size,
            effects: Array.from(this.active.keys()),
            pending: this.pending.length,
            queuedEffects: this.pending.map(request => request.name),
            nodes: Array.from(this.active.values()).reduce((sum, entry) => sum + entry.nodeCount, 0),
            startsInWindow: this.startHistory.length,
            rejected: this.rejected,
            limits: {
                maxConcurrent: this.maxConcurrent,
                maxQueue: this.maxQueue,
                maxNodes: this.maxNodes,
                maxStartsPerWindow: this.maxStartsPerWindow,
                startWindowMs: this.startWindowMs
            }
        };
    }
}

const triggerRuntime = new TriggerRuntime();

if (typeof window !== 'undefined') {
    window.triggerRuntime = triggerRuntime;
}

export { TriggerRuntime };
export default triggerRuntime;
