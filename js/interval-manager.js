// Interval Manager - Tracks and manages all setInterval calls to prevent memory leaks

import animationRuntime from './runtime/animation-runtime.js';

class IntervalManager {
    constructor() {
        this.intervals = new Map(); // Track all managed intervals
        this.intervalCounter = 0;
        this.maxIntervals = 64; // Diagnostic soft budget; never evicts live work
        
        console.log('⏰ Interval Manager initialized');
    }

    /**
     * Create a managed interval that will be automatically tracked and cleaned up
     * @param {Function} callback - Function to execute
     * @param {number} delay - Delay in milliseconds
     * @param {string} name - Optional name for debugging
     * @param {Object} options - Additional options
     * @returns {Object} Interval control object
     */
    createInterval(callback, delay, name = 'unnamed', options = {}) {
        // Capacity is telemetry only. Deleting the oldest interval can sever
        // a fully admitted visual halfway through its authored lifetime.
        if (this.intervals.size >= this.maxIntervals) {
            console.warn(`⚠️ Managed interval soft budget reached (${this.maxIntervals}); preserving active owners.`);
        }

        const intervalId = ++this.intervalCounter;
        const intervalName = `${name}-${intervalId}`;
        
        const runtimeOwner = `interval-manager:${intervalName}`;
        const runtimeToken = animationRuntime.scheduleInterval(runtimeOwner, () => {
            try {
                // Update last execution time
                const intervalData = this.intervals.get(intervalId);
                if (intervalData) {
                    intervalData.lastExecuted = Date.now();
                    intervalData.executionCount++;
                }
                
                // Execute callback
                callback();
            } catch (error) {
                console.error(`❌ Error in interval ${intervalName}:`, error);
                // Optionally stop interval on error
                if (options.stopOnError) {
                    this.clearInterval(intervalId);
                }
            }
        }, delay);

        // Store interval data
        const intervalData = {
            id: intervalId,
            nativeId: runtimeToken,
            runtimeOwner,
            name: intervalName,
            delay: delay,
            callback: callback,
            createdAt: Date.now(),
            lastExecuted: Date.now(),
            executionCount: 0,
            category: options.category || 'general',
            maxExecutions: options.maxExecutions || null,
            // Wall-clock age is not a cleanup signal. A finite lifetime must
            // be an explicit authored contract, otherwise ambient producers
            // remain alive until their owner is disposed.
            maxAge: options.finiteLifetime === true && Number.isFinite(options.maxAge)
                ? options.maxAge
                : null,
            requestedMaxAge: options.maxAge ?? null,
            essential: options.essential === true,
            isActive: true
        };

        this.intervals.set(intervalId, intervalData);
        
        console.log(`⏰ Created interval: ${intervalName} (${delay}ms) - Total: ${this.intervals.size}`);

        // Return control object
        return {
            id: intervalId,
            name: intervalName,
            clear: () => this.clearInterval(intervalId),
            pause: () => this.pauseInterval(intervalId),
            resume: () => this.resumeInterval(intervalId),
            isActive: () => {
                const data = this.intervals.get(intervalId);
                return data ? data.isActive : false;
            }
        };
    }

    /**
     * Clear a specific interval
     */
    clearInterval(intervalId) {
        const intervalData = this.intervals.get(intervalId);
        if (!intervalData) return false;

        // Clear the native interval
        animationRuntime.disposeOwner(intervalData.runtimeOwner);
        
        // Remove from tracking
        this.intervals.delete(intervalId);
        
        console.log(`🗑️ Cleared interval: ${intervalData.name} (Remaining: ${this.intervals.size})`);
        return true;
    }

    /**
     * Pause an interval (clear but keep tracking data)
     */
    pauseInterval(intervalId) {
        const intervalData = this.intervals.get(intervalId);
        if (!intervalData || !intervalData.isActive) return false;

        animationRuntime.disposeOwner(intervalData.runtimeOwner);
        intervalData.isActive = false;
        
        console.log(`⏸️ Paused interval: ${intervalData.name}`);
        return true;
    }

    /**
     * Resume a paused interval
     */
    resumeInterval(intervalId) {
        const intervalData = this.intervals.get(intervalId);
        if (!intervalData || intervalData.isActive) return false;

        // Recreate the interval on the shared cadence driver.
        intervalData.nativeId = animationRuntime.scheduleInterval(intervalData.runtimeOwner, () => {
            try {
                intervalData.lastExecuted = Date.now();
                intervalData.executionCount++;
                intervalData.callback();
            } catch (error) {
                console.error(`❌ Error in resumed interval ${intervalData.name}:`, error);
            }
        }, intervalData.delay);

        intervalData.isActive = true;
        
        console.log(`▶️ Resumed interval: ${intervalData.name}`);
        return true;
    }

    /**
     * Clear all intervals in a specific category
     */
    clearCategory(category) {
        const cleared = [];
        
        this.intervals.forEach((data, id) => {
            if (data.category === category) {
                this.clearInterval(id);
                cleared.push(data.name);
            }
        });
        
        if (cleared.length > 0) {
            console.log(`🗑️ Cleared ${cleared.length} intervals in category '${category}':`, cleared);
        }
        
        return cleared.length;
    }

    /**
     * Clean up oldest intervals
     */
    cleanupOldestIntervals(count = 5) {
        console.warn('cleanupOldestIntervals() is now non-destructive; active intervals retain their authored lifetime.');
        const removed = this.performAutoCleanup();
        return Math.min(count, removed);
    }

    /**
     * Perform automatic cleanup based on age and execution limits
     */
    performAutoCleanup() {
        const now = Date.now();
        const toRemove = [];

        this.intervals.forEach((data, id) => {
            let shouldRemove = false;

            // Check age limit
            if (data.maxAge && (now - data.createdAt) > data.maxAge) {
                shouldRemove = true;
                console.log(`⏰ Interval ${data.name} exceeded max age (${data.maxAge}ms)`);
            }

            // Check execution limit
            if (data.maxExecutions && data.executionCount >= data.maxExecutions) {
                shouldRemove = true;
                console.log(`🔢 Interval ${data.name} exceeded max executions (${data.maxExecutions})`);
            }

            if (shouldRemove) {
                toRemove.push(id);
            }
        });

        // Remove identified intervals
        toRemove.forEach(id => this.clearInterval(id));

        if (toRemove.length > 0) {
            console.log(`🧹 Auto-cleanup removed ${toRemove.length} intervals`);
        }

        return toRemove.length;
    }

    /**
     * Get statistics about managed intervals
     */
    getStats() {
        const stats = {
            totalIntervals: this.intervals.size,
            byCategory: {},
            byStatus: { active: 0, paused: 0 },
            averageDelay: 0,
            oldestInterval: null,
            newestInterval: null
        };

        let totalDelay = 0;
        let oldestTime = Infinity;
        let newestTime = 0;

        this.intervals.forEach(data => {
            // Count by category
            if (!stats.byCategory[data.category]) {
                stats.byCategory[data.category] = 0;
            }
            stats.byCategory[data.category]++;

            // Count by status
            if (data.isActive) {
                stats.byStatus.active++;
            } else {
                stats.byStatus.paused++;
            }

            // Calculate averages and extremes
            totalDelay += data.delay;
            
            if (data.createdAt < oldestTime) {
                oldestTime = data.createdAt;
                stats.oldestInterval = data.name;
            }
            
            if (data.createdAt > newestTime) {
                newestTime = data.createdAt;
                stats.newestInterval = data.name;
            }
        });

        if (this.intervals.size > 0) {
            stats.averageDelay = Math.round(totalDelay / this.intervals.size);
        }

        return stats;
    }

    /**
     * List all active intervals with details
     */
    listIntervals() {
        console.log(`📋 Active Intervals (${this.intervals.size}):`);
        
        this.intervals.forEach(data => {
            const age = Date.now() - data.createdAt;
            const lastExecAge = Date.now() - data.lastExecuted;
            
            console.log(`  ${data.name}:`);
            console.log(`    - Delay: ${data.delay}ms`);
            console.log(`    - Category: ${data.category}`);
            console.log(`    - Age: ${Math.round(age / 1000)}s`);
            console.log(`    - Executions: ${data.executionCount}`);
            console.log(`    - Last executed: ${Math.round(lastExecAge / 1000)}s ago`);
            console.log(`    - Status: ${data.isActive ? 'Active' : 'Paused'}`);
        });
    }

    /**
     * Emergency stop - clear all intervals
     */
    emergencyStop() {
        console.log('🚨 EMERGENCY STOP: Clearing all intervals');
        
        const intervalIds = Array.from(this.intervals.keys());
        intervalIds.forEach(id => this.clearInterval(id));
        
        console.log(`🛑 Emergency stop completed: ${intervalIds.length} intervals cleared`);
    }

    /**
     * Start automatic cleanup timer
     */
    startAutoCleanup(cleanupInterval = 30000) { // Default: 30 seconds
        if (this.autoCleanupInterval?.isActive?.()) {
            return this.autoCleanupInterval;
        }
        this.autoCleanupInterval = this.createInterval(
            () => this.performAutoCleanup(),
            cleanupInterval,
            'auto-cleanup',
            { category: 'system', essential: true }
        );
        
        console.log(`🧹 Auto-cleanup started (every ${cleanupInterval}ms)`);
        return this.autoCleanupInterval;
    }

    /**
     * Legacy compatibility method - alias for createInterval
     * @param {string} name - Name for the interval
     * @param {Function} callback - Function to execute
     * @param {number} delay - Delay in milliseconds
     * @param {Object} options - Additional options
     * @returns {string} Interval ID for clearing
     */
    set(name, callback, delay, options = {}) {
        const intervalHandle = this.createInterval(callback, delay, name, options);
        
        // Store the handle for the legacy clear method
        this.legacyHandles = this.legacyHandles || new Map();
        this.legacyHandles.set(intervalHandle.id, intervalHandle);
        
        // Return the ID for legacy clear() calls
        return intervalHandle.id;
    }
    
    /**
     * Legacy compatibility method - clear by ID or name
     * @param {string|number} identifier - Interval ID or name
     * @returns {boolean} Success status
     */
    clear(identifier) {
        // Try to clear by ID first
        if (typeof identifier === 'number' || !isNaN(identifier)) {
            const id = parseInt(identifier);
            const handle = this.legacyHandles?.get(id);
            if (handle) {
                const success = handle.clear();
                this.legacyHandles?.delete(id);
                return success;
            }
            return this.clearInterval(id);
        }
        
        // Try to clear by name
        for (const [id, data] of this.intervals.entries()) {
            if (data.name.includes(identifier)) {
                return this.clearInterval(id);
            }
        }
        
        return false;
    }
    
    /**
     * Destroy the interval manager
     */
    destroy() {
        this.emergencyStop();
        
        if (this.autoCleanupInterval) {
            this.autoCleanupInterval.clear();
        }
        
        // Clear legacy handles
        if (this.legacyHandles) {
            this.legacyHandles.clear();
        }
        
        console.log('💀 Interval Manager destroyed');
    }
}

// Create global instance
const intervalManager = new IntervalManager();

// Start auto-cleanup
intervalManager.startAutoCleanup();

// Make it globally available
window.intervalManager = intervalManager;

export default intervalManager;
