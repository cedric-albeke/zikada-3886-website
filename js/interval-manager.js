// Interval Manager - Tracks and manages all setInterval calls to prevent memory leaks

import perfConfig from './perf-config.js';

class IntervalManager {
    constructor() {
        this.intervals = new Map(); // Track all managed intervals
        this.intervalsByOwner = new Map(); // Track by owner for targeted cleanup
        this.intervalCounter = 0;
        this.maxIntervals = perfConfig?.getLimit('maxIntervalsGlobal') || 24;
        this.maxIntervalsPerOwner = perfConfig?.getLimit('maxIntervalsPerOwner') || 4;
        
        // Performance tracking
        this.totalCreated = 0;
        this.totalCleared = 0;
        this.ownerWarnings = new Set();
        
        console.log('⏰ Enhanced Interval Manager initialized');
        
        // Expose to performance counters
        if (perfConfig) {
            perfConfig.updateCounter('intervals', 0);
        }
    }

    /**
     * Create a managed interval that will be automatically tracked and cleaned up
     * @param {Function} callback - Function to execute
     * @param {number} delay - Delay in milliseconds
     * @param {string} name - Optional name for debugging
     * @param {Object} options - Additional options: { owner, category, ttl, maxExecutions }
     * @returns {Object} Interval control object
     */
    createInterval(callback, delay, name = 'unnamed', options = {}) {
        const owner = options.owner || 'unknown';
        const category = options.category || 'general';
        
        // Check global limits
        if (this.intervals.size >= this.maxIntervals) {
            console.warn(`⚠️ Maximum intervals reached (${this.maxIntervals}). Cleaning up oldest intervals.`);
            this.cleanupOldestIntervals(5);
        }
        
        // Check per-owner limits
        const ownerIntervals = this.intervalsByOwner.get(owner) || new Set();
        if (ownerIntervals.size >= this.maxIntervalsPerOwner) {
            if (!this.ownerWarnings.has(owner)) {
                console.warn(`⚠️ Owner "${owner}" has reached max intervals (${this.maxIntervalsPerOwner}). Cleaning up oldest.`);
                this.ownerWarnings.add(owner);
            }
            this.cleanupOldestByOwner(owner, 2);
        }

        const intervalId = ++this.intervalCounter;
        const intervalName = `${name}-${intervalId}`;
        
        // TTL calculations
        const ttl = options.ttl || null; // Time to live in milliseconds
        const maxExecutions = options.maxExecutions || null;
        const expiresAt = ttl ? Date.now() + ttl : null;
        
        // Create the actual interval with enhanced tracking
        const nativeIntervalId = setInterval(() => {
            try {
                // Update execution data
                const intervalData = this.intervals.get(intervalId);
                if (!intervalData) {
                    // Interval was cleared, stop execution
                    clearInterval(nativeIntervalId);
                    return;
                }
                
                intervalData.lastExecuted = Date.now();
                intervalData.executionCount++;
                
                // Check TTL expiration
                if (expiresAt && intervalData.lastExecuted > expiresAt) {
                    console.log(`⏱️ Interval ${intervalName} expired (TTL: ${ttl}ms)`);
                    this.clearInterval(intervalId);
                    return;
                }
                
                // Check max executions
                if (maxExecutions && intervalData.executionCount >= maxExecutions) {
                    console.log(`🔢 Interval ${intervalName} completed max executions (${maxExecutions})`);
                    this.clearInterval(intervalId);
                    return;
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

        // Store interval data with enhanced tracking
        const intervalData = {
            id: intervalId,
            nativeId: nativeIntervalId,
            name: intervalName,
            delay: delay,
            callback: callback,
            createdAt: Date.now(),
            lastExecuted: Date.now(),
            executionCount: 0,
            category: category,
            owner: owner,
            ttl: ttl,
            expiresAt: expiresAt,
            maxExecutions: maxExecutions,
            maxAge: options.maxAge || null,
            isActive: true
        };

        // Store in main registry
        this.intervals.set(intervalId, intervalData);
        
        // Track by owner
        if (!this.intervalsByOwner.has(owner)) {
            this.intervalsByOwner.set(owner, new Set());
        }
        this.intervalsByOwner.get(owner).add(intervalId);
        
        // Update counters
        this.totalCreated++;
        if (perfConfig) {
            perfConfig.incrementCounter('intervals');
        }
        
        if (perfConfig?.shouldLog()) {
            console.log(`⏰ Created interval: ${intervalName} (${delay}ms, owner: ${owner}) - Total: ${this.intervals.size}`);
        }

        // Return control object
        return {
            id: intervalId,
            name: intervalName,
            owner: owner,
            clear: () => this.clearInterval(intervalId),
            pause: () => this.pauseInterval(intervalId),
            resume: () => this.resumeInterval(intervalId),
            isActive: () => {
                const data = this.intervals.get(intervalId);
                return data ? data.isActive : false;
            },
            getStats: () => {
                const data = this.intervals.get(intervalId);
                return data ? {
                    executionCount: data.executionCount,
                    age: Date.now() - data.createdAt,
                    timeSinceLastExecution: Date.now() - data.lastExecuted
                } : null;
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
        
        // Remove from owner tracking
        if (intervalData.owner && this.intervalsByOwner.has(intervalData.owner)) {
            this.intervalsByOwner.get(intervalData.owner).delete(intervalId);
            if (this.intervalsByOwner.get(intervalData.owner).size === 0) {
                this.intervalsByOwner.delete(intervalData.owner);
            }
        }
        
        // Remove from main tracking
        this.intervals.delete(intervalId);
        
        // Update counters
        this.totalCleared++;
        if (perfConfig) {
            perfConfig.decrementCounter('intervals');
        }
        
        if (perfConfig?.shouldLog()) {
            console.log(`🗑️ Cleared interval: ${intervalData.name} (Remaining: ${this.intervals.size})`);
        }
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
     * Clear all intervals by owner
     */
    clearByOwner(owner) {
        const ownerIntervals = this.intervalsByOwner.get(owner);
        if (!ownerIntervals) {
            return 0;
        }
        
        const cleared = [];
        const intervalIds = Array.from(ownerIntervals);
        
        intervalIds.forEach(id => {
            const data = this.intervals.get(id);
            if (data) {
                this.clearInterval(id);
                cleared.push(data.name);
            }
        });
        
        if (cleared.length > 0 && perfConfig?.shouldLog()) {
            console.log(`🗑️ Cleared ${cleared.length} intervals for owner '${owner}':`, cleared);
        }
        
        return cleared.length;
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
        
        if (cleared.length > 0 && perfConfig?.shouldLog()) {
            console.log(`🗑️ Cleared ${cleared.length} intervals in category '${category}':`, cleared);
        }
        
        return cleared.length;
    }
    
    /**
     * Clean up oldest intervals by owner
     */
    cleanupOldestByOwner(owner, count = 2) {
        const ownerIntervals = this.intervalsByOwner.get(owner);
        if (!ownerIntervals) {
            return 0;
        }
        
        const sortedIntervals = Array.from(ownerIntervals)
            .map(id => this.intervals.get(id))
            .filter(data => data) // Remove any null entries
            .sort((a, b) => a.createdAt - b.createdAt)
            .slice(0, count);
        
        sortedIntervals.forEach(intervalData => {
            this.clearInterval(intervalData.id);
        });
        
        if (sortedIntervals.length > 0 && perfConfig?.shouldLog()) {
            console.log(`🧹 Cleaned up ${sortedIntervals.length} oldest intervals for owner '${owner}'`);
        }
        
        return sortedIntervals.length;
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
            totalCreated: this.totalCreated,
            totalCleared: this.totalCleared,
            byCategory: {},
            byOwner: {},
            byStatus: { active: 0, paused: 0, expired: 0 },
            averageDelay: 0,
            oldestInterval: null,
            newestInterval: null,
            memoryEstimate: 0
        };

        let totalDelay = 0;
        let oldestTime = Infinity;
        let newestTime = 0;

        const now = Date.now();
        
        this.intervals.forEach(data => {
            // Count by category
            if (!stats.byCategory[data.category]) {
                stats.byCategory[data.category] = 0;
            }
            stats.byCategory[data.category]++;
            
            // Count by owner
            if (!stats.byOwner[data.owner]) {
                stats.byOwner[data.owner] = 0;
            }
            stats.byOwner[data.owner]++;

            // Count by status
            if (data.expiresAt && now > data.expiresAt) {
                stats.byStatus.expired++;
            } else if (data.isActive) {
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
     * Clear all intervals (alias for emergency stop)
     */
    clearAll(reason = 'Manual request') {
        if (perfConfig?.shouldLog()) {
            console.log(`🗑️ Clearing all intervals: ${reason}`);
        }
        
        const intervalIds = Array.from(this.intervals.keys());
        const clearedCount = intervalIds.length;
        
        intervalIds.forEach(id => this.clearInterval(id));
        
        // Clear tracking maps
        this.intervalsByOwner.clear();
        this.ownerWarnings.clear();
        
        if (perfConfig?.shouldLog()) {
            console.log(`✅ Clear all completed: ${clearedCount} intervals cleared`);
        }
        
        return clearedCount;
    }
    
    /**
     * Emergency stop - clear all intervals
     */
    emergencyStop() {
        console.log('🚨 EMERGENCY STOP: Clearing all intervals');
        return this.clearAll('Emergency stop');
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