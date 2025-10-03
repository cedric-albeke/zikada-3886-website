// Timer Instrumentation - Dev-only monitoring for unmanaged timers
// Load only when ?debug=timers or window.__3886_DEBUG.timers is true

class TimerInstrumentation {
    constructor() {
        this.intervals = new Map();
        this.timeouts = new Map();
        this.rafs = new Map();
        this.idCounter = 0;
        this.enabled = false;
        this.metricsInterval = null;
        
        console.log('🔍 Timer Instrumentation initialized (not yet enabled)');
    }

    enable() {
        if (this.enabled) {
            console.log('⚠️ Timer instrumentation already enabled');
            return;
        }

        this.enabled = true;
        this.patchTimerAPIs();
        this.startMetricsSampler();
        console.log('✅ Timer instrumentation ENABLED - tracking all timers');
    }

    disable() {
        if (!this.enabled) return;
        
        this.enabled = false;
        this.restoreOriginalAPIs();
        this.stopMetricsSampler();
        console.log('🛑 Timer instrumentation DISABLED');
    }

    patchTimerAPIs() {
        // Store originals
        this._originals = {
            setInterval: window.setInterval,
            setTimeout: window.setTimeout,
            requestAnimationFrame: window.requestAnimationFrame,
            clearInterval: window.clearInterval,
            clearTimeout: window.clearTimeout,
            cancelAnimationFrame: window.cancelAnimationFrame
        };

        const self = this;

        // Patch setInterval
        window.setInterval = function(...args) {
            const id = self._originals.setInterval.apply(this, args);
            const stack = new Error().stack;
            const callsite = self._extractCallsite(stack);
            
            self.intervals.set(id, {
                id,
                type: 'interval',
                createdAt: Date.now(),
                delay: args[1] || 0,
                callsite,
                managed: false,
                label: null,
                active: true
            });
            
            return id;
        };

        // Patch setTimeout
        window.setTimeout = function(...args) {
            const id = self._originals.setTimeout.apply(this, args);
            const stack = new Error().stack;
            const callsite = self._extractCallsite(stack);
            
            self.timeouts.set(id, {
                id,
                type: 'timeout',
                createdAt: Date.now(),
                delay: args[1] || 0,
                callsite,
                managed: false,
                label: null,
                active: true
            });
            
            return id;
        };

        // Patch requestAnimationFrame
        window.requestAnimationFrame = function(...args) {
            const id = self._originals.requestAnimationFrame.apply(this, args);
            const stack = new Error().stack;
            const callsite = self._extractCallsite(stack);
            
            self.rafs.set(id, {
                id,
                type: 'raf',
                createdAt: Date.now(),
                callsite,
                managed: false,
                label: null,
                active: true
            });
            
            return id;
        };

        // Patch clearInterval
        window.clearInterval = function(id) {
            const record = self.intervals.get(id);
            if (record) {
                record.active = false;
                record.clearedAt = Date.now();
                record.lifetime = Date.now() - record.createdAt;
            }
            return self._originals.clearInterval.call(this, id);
        };

        // Patch clearTimeout
        window.clearTimeout = function(id) {
            const record = self.timeouts.get(id);
            if (record) {
                record.active = false;
                record.clearedAt = Date.now();
                record.lifetime = Date.now() - record.createdAt;
            }
            return self._originals.clearTimeout.call(this, id);
        };

        // Patch cancelAnimationFrame
        window.cancelAnimationFrame = function(id) {
            const record = self.rafs.get(id);
            if (record) {
                record.active = false;
                record.clearedAt = Date.now();
                record.lifetime = Date.now() - record.createdAt;
            }
            return self._originals.cancelAnimationFrame.call(this, id);
        };
    }

    restoreOriginalAPIs() {
        if (!this._originals) return;

        window.setInterval = this._originals.setInterval;
        window.setTimeout = this._originals.setTimeout;
        window.requestAnimationFrame = this._originals.requestAnimationFrame;
        window.clearInterval = this._originals.clearInterval;
        window.clearTimeout = this._originals.clearTimeout;
        window.cancelAnimationFrame = this._originals.cancelAnimationFrame;
    }

    _extractCallsite(stack) {
        if (!stack) return 'unknown';
        
        const lines = stack.split('\n');
        // Skip first 2 lines (Error and this function)
        const relevantLine = lines[3] || lines[2] || 'unknown';
        
        // Extract file:line from stack trace
        const match = relevantLine.match(/(?:at\s+)?(?:.*?\s+)?\(?([^)]+)\)?$/);
        if (match) {
            const location = match[1];
            // Shorten paths for readability
            return location.replace(/^.*\/js\//, 'js/').replace(/^.*\/node_modules\//, 'node_modules/');
        }
        
        return relevantLine.trim();
    }

    // Tag a timer as managed by interval-manager
    tagAsManaged(id, label, type = 'interval') {
        let record;
        switch (type) {
            case 'interval':
                record = this.intervals.get(id);
                break;
            case 'timeout':
                record = this.timeouts.get(id);
                break;
            case 'raf':
                record = this.rafs.get(id);
                break;
        }
        
        if (record) {
            record.managed = true;
            record.label = label;
        }
    }

    startMetricsSampler() {
        if (this.metricsInterval) return;
        
        // Sample every 1 second
        this.metricsInterval = this._originals.setInterval(() => {
            this.sampleMetrics();
        }, 1000);
    }

    stopMetricsSampler() {
        if (this.metricsInterval) {
            this._originals.clearInterval(this.metricsInterval);
            this.metricsInterval = null;
        }
    }

    sampleMetrics() {
        const now = Date.now();
        
        // Count active vs cleared
        const activeIntervals = Array.from(this.intervals.values()).filter(r => r.active);
        const activeTimeouts = Array.from(this.timeouts.values()).filter(r => r.active);
        const activeRAFs = Array.from(this.rafs.values()).filter(r => r.active);
        
        // Count managed vs unmanaged
        const managedIntervals = activeIntervals.filter(r => r.managed).length;
        const unmanagedIntervals = activeIntervals.length - managedIntervals;
        
        const managedTimeouts = activeTimeouts.filter(r => r.managed).length;
        const unmanagedTimeouts = activeTimeouts.length - managedTimeouts;
        
        const managedRAFs = activeRAFs.filter(r => r.managed).length;
        const unmanagedRAFs = activeRAFs.length - managedRAFs;
        
        // Top 5 longest-running intervals by age
        const oldestIntervals = activeIntervals
            .sort((a, b) => a.createdAt - b.createdAt)
            .slice(0, 5)
            .map(r => ({
                age: Math.round((now - r.createdAt) / 1000),
                delay: r.delay,
                managed: r.managed,
                label: r.label || 'unlabeled',
                callsite: r.callsite
            }));
        
        const metrics = {
            timestamp: now,
            intervals: {
                total: activeIntervals.length,
                managed: managedIntervals,
                unmanaged: unmanagedIntervals
            },
            timeouts: {
                total: activeTimeouts.length,
                managed: managedTimeouts,
                unmanaged: unmanagedTimeouts
            },
            rafs: {
                total: activeRAFs.length,
                managed: managedRAFs,
                unmanaged: unmanagedRAFs
            },
            oldestIntervals
        };
        
        // Log as JSONL for scraping
        console.log(`[metrics] ${JSON.stringify(metrics)}`);
        
        // Expose to performance bus if available
        if (window.performanceBus) {
            window.performanceBus.updateMetrics({
                timerInstrumentation: metrics
            });
        }
        
        // Warn if too many unmanaged timers
        if (unmanagedIntervals > 5) {
            console.warn(`⚠️ ${unmanagedIntervals} unmanaged intervals detected!`);
        }
        
        if (activeIntervals.length > 15) {
            console.warn(`⚠️ Total ${activeIntervals.length} active intervals (target: ≤15)`);
        }
    }

    getStats() {
        const now = Date.now();
        
        const activeIntervals = Array.from(this.intervals.values()).filter(r => r.active);
        const activeTimeouts = Array.from(this.timeouts.values()).filter(r => r.active);
        const activeRAFs = Array.from(this.rafs.values()).filter(r => r.active);
        
        return {
            intervals: {
                total: activeIntervals.length,
                managed: activeIntervals.filter(r => r.managed).length,
                unmanaged: activeIntervals.filter(r => !r.managed).length,
                byLabel: this._groupByLabel(activeIntervals)
            },
            timeouts: {
                total: activeTimeouts.length,
                managed: activeTimeouts.filter(r => r.managed).length,
                unmanaged: activeTimeouts.filter(r => !r.managed).length
            },
            rafs: {
                total: activeRAFs.length,
                managed: activeRAFs.filter(r => r.managed).length,
                unmanaged: activeRAFs.filter(r => !r.managed).length
            },
            allIntervals: activeIntervals.map(r => ({
                id: r.id,
                age: Math.round((now - r.createdAt) / 1000),
                delay: r.delay,
                managed: r.managed,
                label: r.label || 'unlabeled',
                callsite: r.callsite
            }))
        };
    }

    _groupByLabel(records) {
        const grouped = {};
        records.forEach(r => {
            const label = r.label || 'unlabeled';
            grouped[label] = (grouped[label] || 0) + 1;
        });
        return grouped;
    }

    logSummary() {
        const stats = this.getStats();
        
        console.group('📊 Timer Instrumentation Summary');
        console.log('Intervals:', stats.intervals);
        console.log('Timeouts:', stats.timeouts);
        console.log('RAFs:', stats.rafs);
        
        if (stats.intervals.unmanaged > 0) {
            console.group('⚠️ Unmanaged Intervals:');
            stats.allIntervals
                .filter(i => !i.managed)
                .forEach(i => {
                    console.log(`  - ID ${i.id}: ${i.age}s old, ${i.delay}ms delay, from ${i.callsite}`);
                });
            console.groupEnd();
        }
        
        console.groupEnd();
    }

    clearAllUnmanaged() {
        console.log('🗑️ Clearing all unmanaged timers...');
        
        let cleared = 0;
        
        // Clear unmanaged intervals
        this.intervals.forEach((record, id) => {
            if (record.active && !record.managed) {
                this._originals.clearInterval(id);
                record.active = false;
                cleared++;
            }
        });
        
        // Clear unmanaged timeouts
        this.timeouts.forEach((record, id) => {
            if (record.active && !record.managed) {
                this._originals.clearTimeout(id);
                record.active = false;
                cleared++;
            }
        });
        
        console.log(`✅ Cleared ${cleared} unmanaged timers`);
    }
}

// Create global instance but don't enable by default
const timerInstrumentation = new TimerInstrumentation();
window.__timerInstrumentation = timerInstrumentation;

// Auto-enable if debug flag is set
const urlParams = new URLSearchParams(window.location.search);
const debugTimers = urlParams.get('debug') === 'timers' || 
                    urlParams.get('timers') === '1' ||
                    (window.__3886_DEBUG && window.__3886_DEBUG.timers);

if (debugTimers) {
    timerInstrumentation.enable();
    
    // Add global helper functions
    window.TIMER_STATS = () => timerInstrumentation.getStats();
    window.TIMER_SUMMARY = () => timerInstrumentation.logSummary();
    window.TIMER_CLEAR_UNMANAGED = () => timerInstrumentation.clearAllUnmanaged();
    
    console.log('🔍 Timer debug mode enabled. Use:');
    console.log('  - TIMER_STATS() - Get detailed statistics');
    console.log('  - TIMER_SUMMARY() - Log summary to console');
    console.log('  - TIMER_CLEAR_UNMANAGED() - Clear all unmanaged timers');
}

export default timerInstrumentation;
