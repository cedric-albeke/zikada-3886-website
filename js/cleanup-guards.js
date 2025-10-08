// Cleanup Guards - Safe utilities for all cleanup operations
// This module provides guarded versions of cleanup operations that never throw

class CleanupGuards {
    constructor() {
        this.validSelectorCache = new Map();
        this.totalOperations = 0;
        this.failedOperations = 0;
        this.guardedSelectors = [
            '.matrix-char',
            '[data-managed="true"]',
            '[data-animation-orphaned="true"]',
            '[data-remove-pending="true"]',
            '[data-temp="true"]',
            '.perf-managed:not([data-permanent])',
            '.matrix-overlay',
            '.phase-overlay',
            '.flash-overlay',
            '.glitch-overlay'
        ];
        
        console.log('🛡️ Cleanup Guards initialized');
    }
    
    /**
     * Safe querySelector wrapper that never throws
     * @param {string} selector - CSS selector to query
     * @param {Element} root - Root element to query from (default: document)
     * @returns {NodeList} - Empty NodeList if selector is invalid
     */
    safeQueryAll(selector, root = document) {
        if (!selector || typeof selector !== 'string') {
            console.warn('[cleanup] Invalid selector provided:', selector);
            return [];
        }
        
        // Check cache first
        if (this.validSelectorCache.has(selector)) {
            const isValid = this.validSelectorCache.get(selector);
            if (!isValid) {
                return [];
            }
        }
        
        try {
            this.totalOperations++;
            const result = root.querySelectorAll(selector);
            
            // Cache as valid if we got here
            this.validSelectorCache.set(selector, true);
            return result;
            
        } catch (e) {
            this.failedOperations++;
            console.warn('[cleanup] Invalid selector, returning empty result:', selector, e.message);
            
            // Cache as invalid
            this.validSelectorCache.set(selector, false);
            return [];
        }
    }
    
    /**
     * Safe element removal that handles edge cases
     * @param {Element} element - Element to remove
     * @returns {boolean} - True if removed successfully
     */
    safeRemoveElement(element) {
        if (!element || !element.nodeType) {
            return false;
        }
        
        try {
            // Check if element is still connected to DOM
            if (!element.isConnected) {
                return true; // Already removed
            }
            
            // Skip elements marked as permanent
            if (element.hasAttribute('data-permanent')) {
                return false;
            }
            
            // Skip critical elements
            const criticalClasses = ['pre-loader', 'control-panel', 'logo-text', 'image-2'];
            if (criticalClasses.some(cls => element.classList?.contains(cls))) {
                return false;
            }
            
            // Remove from DOM
            if (element.remove) {
                element.remove();
            } else if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            
            return true;
            
        } catch (error) {
            console.warn('[cleanup] Failed to remove element:', error);
            return false;
        }
    }
    
    /**
     * Safe interval/timeout clearing
     * @param {number} id - Timer ID to clear
     * @param {string} type - 'interval', 'timeout', or 'raf'
     * @returns {boolean} - True if cleared successfully
     */
    safeClearTimer(id, type = 'timeout') {
        if (!id || typeof id !== 'number') {
            return false;
        }
        
        try {
            switch (type) {
                case 'interval':
                    clearInterval(id);
                    break;
                case 'timeout':
                    clearTimeout(id);
                    break;
                case 'raf':
                    cancelAnimationFrame(id);
                    break;
                default:
                    console.warn('[cleanup] Unknown timer type:', type);
                    return false;
            }
            return true;
        } catch (error) {
            console.warn('[cleanup] Failed to clear timer:', type, id, error);
            return false;
        }
    }
    
    /**
     * Safe cleanup summary that never throws
     * @param {Function} cleanupFunction - Cleanup function to execute
     * @param {string} context - Context description for logging
     * @returns {Object} - Cleanup results summary
     */
    safeCleanupSummary(cleanupFunction, context = 'unknown') {
        const summary = {
            context,
            success: false,
            error: null,
            result: null,
            timestamp: Date.now()
        };
        
        if (!cleanupFunction || typeof cleanupFunction !== 'function') {
            summary.error = 'Invalid cleanup function provided';
            console.warn('[cleanup]', summary.error);
            return summary;
        }
        
        try {
            summary.result = cleanupFunction();
            summary.success = true;
            console.info(`[cleanup] ${context}: success`);
        } catch (error) {
            summary.error = error.message;
            summary.success = false;
            console.error(`[cleanup] ${context}: failed:`, error);
        }
        
        return summary;
    }
    
    /**
     * Gracefully clean up DOM elements with registry-based approach
     * @param {Object} options - Cleanup options
     * @returns {Object} - Cleanup results
     */
    performRegistryCleanup(options = {}) {
        const {
            maxAgeMs = 60000,
            removeDisconnected = true,
            skipPermanent = true
        } = options;
        
        const results = {
            total: 0,
            removed: 0,
            skipped: 0,
            errors: 0
        };
        
        // Strategy 1: Use performance element manager if available
        if (window.performanceElementManager && window.performanceElementManager.trackedElements) {
            return this.safeCleanupSummary(() => {
                const tracked = Array.from(window.performanceElementManager.trackedElements);
                results.total = tracked.length;
                
                tracked.forEach(element => {
                    if (!element) return;
                    
                    const metadata = window.performanceElementManager.elementMetadata?.get(element);
                    const age = metadata ? (Date.now() - metadata.trackedAt) : 0;
                    const isStale = maxAgeMs && age > maxAgeMs;
                    const isDisconnected = removeDisconnected && !element.isConnected;
                    
                    if (isStale || isDisconnected) {
                        if (this.safeRemoveElement(element)) {
                            window.performanceElementManager.untrack(element);
                            results.removed++;
                        } else {
                            results.skipped++;
                        }
                    }
                });
                
                return results;
            }, 'registry-cleanup-managed');
        }
        
        // Strategy 2: Fallback to safe selector-based cleanup
        return this.safeCleanupSummary(() => {
            this.guardedSelectors.forEach(selector => {
                const elements = this.safeQueryAll(selector);
                results.total += elements.length;
                
                elements.forEach(element => {
                    if (removeDisconnected && !element.isConnected) {
                        return; // Skip already disconnected elements
                    }
                    
                    if (this.safeRemoveElement(element)) {
                        results.removed++;
                    } else {
                        results.skipped++;
                    }
                });
            });
            
            return results;
        }, 'registry-cleanup-fallback');
    }
    
    /**
     * Check if managers are available and functional
     * @returns {Object} - Manager availability status
     */
    checkManagerAvailability() {
        const status = {
            intervalManager: {
                available: !!window.intervalManager,
                hasCleanup: !!(window.intervalManager?.cleanup),
                hasEmergencyStop: !!(window.intervalManager?.emergencyStop)
            },
            performanceElementManager: {
                available: !!window.performanceElementManager,
                hasPurge: !!(window.performanceElementManager?.purge),
                hasEmergencyCleanup: !!(window.performanceElementManager?.emergencyCleanup),
                trackedCount: window.performanceElementManager?.trackedElements?.size || 0
            },
            lifecycleManager: {
                available: !!window.lifecycleManager,
                isVisible: window.lifecycleManager?.isVisible,
                isPaused: window.lifecycleManager?.isPaused
            }
        };
        
        console.log('[cleanup] Manager availability:', status);
        return status;
    }
    
    /**
     * Comprehensive system cleanup with graceful degradation
     * @param {Object} options - Cleanup options
     * @returns {Object} - Complete cleanup results
     */
    performSystemCleanup(options = {}) {
        const {
            skipTimers = false,
            skipElements = false,
            skipMemory = false,
            force = false
        } = options;
        
        const results = {
            managers: this.checkManagerAvailability(),
            timers: { intervals: 0, timeouts: 0, raf: 0 },
            elements: { removed: 0, remaining: 0 },
            memory: null,
            errors: []
        };
        
        // Timer cleanup
        if (!skipTimers && results.managers.intervalManager.available) {
            const timerCleanup = this.safeCleanupSummary(() => {
                if (results.managers.intervalManager.hasCleanup) {
                    return window.intervalManager.cleanup();
                } else if (results.managers.intervalManager.hasEmergencyStop) {
                    window.intervalManager.emergencyStop();
                    return { intervals: 0, timeouts: 0, raf: 0 };
                }
                return { intervals: 0, timeouts: 0, raf: 0 };
            }, 'timer-cleanup');
            
            if (timerCleanup.success) {
                results.timers = timerCleanup.result || results.timers;
            } else {
                results.errors.push(timerCleanup.error);
            }
        }
        
        // Element cleanup
        if (!skipElements) {
            if (results.managers.performanceElementManager.available && 
                results.managers.performanceElementManager.hasPurge) {
                
                const elementCleanup = this.safeCleanupSummary(() => {
                    const removed = window.performanceElementManager.purge();
                    return {
                        removed: removed,
                        remaining: window.performanceElementManager.trackedElements?.size || 0
                    };
                }, 'element-cleanup-managed');
                
                if (elementCleanup.success) {
                    results.elements = elementCleanup.result || results.elements;
                } else {
                    results.errors.push(elementCleanup.error);
                }
            } else {
                // Fallback cleanup
                const fallbackCleanup = this.performRegistryCleanup();
                if (fallbackCleanup.success) {
                    results.elements = {
                        removed: fallbackCleanup.result.removed,
                        remaining: fallbackCleanup.result.total - fallbackCleanup.result.removed
                    };
                } else {
                    results.errors.push(fallbackCleanup.error);
                }
            }
        }
        
        // Memory info collection
        if (!skipMemory && performance.memory) {
            try {
                results.memory = {
                    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                    limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
                };
            } catch (error) {
                results.errors.push(`Memory info collection failed: ${error.message}`);
            }
        }
        
        console.info('[cleanup] System cleanup completed:', {
            timers: results.timers,
            elements: results.elements,
            memory: results.memory,
            errors: results.errors.length
        });
        
        return results;
    }
    
    /**
     * Get cleanup statistics
     * @returns {Object} - Statistics about cleanup operations
     */
    getStats() {
        return {
            totalOperations: this.totalOperations,
            failedOperations: this.failedOperations,
            successRate: this.totalOperations > 0 ? 
                ((this.totalOperations - this.failedOperations) / this.totalOperations * 100).toFixed(2) : 
                '100.00',
            cachedSelectors: this.validSelectorCache.size,
            guardedSelectors: this.guardedSelectors.length
        };
    }
}

// Create and expose global instance
window.cleanupGuards = new CleanupGuards();

export default CleanupGuards;