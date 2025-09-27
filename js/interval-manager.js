// Interval Manager - Tracks and manages all setInterval calls to prevent memory leaks

class IntervalManager {
    constructor() {
        this.intervals = new Map(); // Track all managed intervals
        this.intervalCounter = 0;
        this.maxIntervals = 15; // Tighter maximum concurrent intervals
        
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
        // Check if we're at maximum intervals
        if (this.intervals.size >= this.maxIntervals) {
            console.warn(`⚠️ Maximum intervals reached (${this.maxIntervals}). Cleaning up oldest intervals.`);
            this.cleanupOldestIntervals(5);
        }

        const intervalId = ++this.intervalCounter;
        const intervalName = `${name}-${intervalId}`;
        
        // Create the actual interval
        const nativeIntervalId = setInterval(() => {
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
            nativeId: nativeIntervalId,
            name: intervalName,
            delay: delay,
            callback: callback,
            createdAt: Date.now(),
            lastExecuted: Date.now(),
            executionCount: 0,
            category: options.category || 'general',
            maxExecutions: options.maxExecutions || null,
            maxAge: options.maxAge || null,
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
        clearInterval(intervalData.nativeId);
        
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

        clearInterval(intervalData.nativeId);
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

        // Recreate the interval
        intervalData.nativeId = setInterval(() => {
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
        const sortedIntervals = Array.from(this.intervals.values())
            .sort((a, b) => a.createdAt - b.createdAt)
            .slice(0, count);

        sortedIntervals.forEach(intervalData => {
            this.clearInterval(intervalData.id);
        });

        console.log(`🧹 Cleaned up ${sortedIntervals.length} oldest intervals`);
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

            // Check if stale (no execution in last 2 minutes)
            if ((now - data.lastExecuted) > 120000) {
                shouldRemove = true;
                console.log(`💀 Interval ${data.name} appears stale (no execution in 2 minutes)`);
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
        this.autoCleanupInterval = this.createInterval(
            () => this.performAutoCleanup(),
            cleanupInterval,
            'auto-cleanup',
            { category: 'system' }
        );
        
        console.log(`🧹 Auto-cleanup started (every ${cleanupInterval}ms)`);
    }

    /**
     * Destroy the interval manager
     */
    destroy() {
        this.emergencyStop();
        
        if (this.autoCleanupInterval) {
            this.autoCleanupInterval.clear();
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