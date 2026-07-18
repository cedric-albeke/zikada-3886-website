// Safe PerformanceElementManager with proper purge method and lifecycle management
import animationRuntime from './runtime/animation-runtime.js';

class PerformanceElementManager {
    constructor() {
        this.monitorOwner = 'performance-element-manager:monitor';
        this.actionOwner = 'performance-element-manager:actions';
        this.trackedElements = new Set(); // Changed from WeakSet to Set for enumeration
        this.elementMetadata = new WeakMap(); // Store metadata without preventing GC
        this.orphanCheckInterval = null;
        this.memoryUsage = { current: 0, peak: 0, threshold: 50000 }; // DOM node count thresholds
        this.performanceState = 'optimal'; // optimal, degraded, emergency
        this.cleanupHistory = [];
        this.maxHistorySize = 100;
        
        // Performance monitoring
        this.stats = {
            totalTracked: 0,
            totalCleaned: 0,
            emergencyCleanups: 0,
            lastCleanup: null,
            averageAge: 0
        };
        
        // Mutation observer for automatic cleanup
        this.observer = new MutationObserver((mutations) => {
            let removedCount = 0;
            mutations.forEach((mutation) => {
                mutation.removedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (this.trackedElements.has(node)) {
                            this.untrack(node);
                            removedCount++;
                        }
                    }
                });
            });
            
            if (removedCount > 0 && window.SAFE_FLAGS?.DEBUG_FX) {
                console.log(`🧹 Auto-cleaned ${removedCount} removed elements`);
            }
        });
        
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        this.startMonitoring();
        
        console.log('✅ SafePerformanceElementManager initialized');
    }

    track(element, metadata = {}) {
        if (!element || !(element instanceof Element)) {
            console.warn('⚠️ Invalid element passed to track()');
            return;
        }

        if (this.trackedElements.has(element)) {
            if (window.SAFE_FLAGS?.DEBUG_FX) {
                console.log('⚠️ Element already tracked, updating metadata');
            }
        } else {
            this.trackedElements.add(element);
            this.stats.totalTracked++;
        }

        // Store metadata
        const elementData = {
            ...metadata,
            trackedAt: Date.now(),
            type: element.tagName?.toLowerCase() || 'unknown',
            className: element.className || '',
            id: element.id || '',
            source: metadata.source || 'unknown'
        };
        
        this.elementMetadata.set(element, elementData);
        
        // Add tracking attribute for debugging
        if (window.SAFE_FLAGS?.DEBUG_FX) {
            element.setAttribute('data-perf-tracked', Date.now());
        }
        
        this.updateMemoryUsage();
        
        if (window.SAFE_FLAGS?.DEBUG_FX) {
            console.log(`📍 Tracking element: ${elementData.type}${elementData.id ? '#' + elementData.id : ''}${elementData.className ? '.' + elementData.className.split(' ')[0] : ''}`);
        }
    }

    untrack(element) {
        if (this.trackedElements.has(element)) {
            this.trackedElements.delete(element);
            this.elementMetadata.delete(element);
            this.stats.totalCleaned++;
            
            // Remove tracking attribute
            if (element.hasAttribute && element.hasAttribute('data-perf-tracked')) {
                element.removeAttribute('data-perf-tracked');
            }
            
            if (window.SAFE_FLAGS?.DEBUG_FX) {
                console.log('📍 Untracked element:', element.tagName?.toLowerCase());
            }
            
            return true;
        }
        return false;
    }

    // CRITICAL: This is the missing purge method that was causing errors
    purge(selector = null) {
        console.log(`🧹 Starting purge operation${selector ? ' with selector: ' + selector : ' (all tracked elements)'}`);
        
        let purgedCount = 0;
        const elementsToRemove = [];
        
        this.trackedElements.forEach(element => {
            let shouldPurge = false;
            
            if (selector) {
                // Purge elements matching selector
                try {
                    shouldPurge = element.matches && element.matches(selector);
                } catch (e) {
                    console.warn('⚠️ Invalid selector in purge:', selector);
                    shouldPurge = false;
                }
            } else {
                // Default purge is bookkeeping-only. Connected elements need
                // an explicit completion marker or an explicit selector.
                shouldPurge = this.isOrphaned(element) ||
                    element.dataset?.lifecycleState === 'complete' ||
                    element.dataset?.effectComplete === 'true';
            }
            
            if (shouldPurge) {
                elementsToRemove.push(element);
            }
        });
        
        // Remove elements
        elementsToRemove.forEach(element => {
            try {
                // Remove from DOM if it's still attached and safe to remove
                if (element.parentNode && !element.hasAttribute('data-permanent')) {
                    element.remove();
                }
                this.untrack(element);
                purgedCount++;
            } catch (error) {
                console.warn('⚠️ Error removing element during purge:', error);
                // Still untrack it
                this.untrack(element);
                purgedCount++;
            }
        });
        
        this.recordCleanup('purge', purgedCount);
        this.updateMemoryUsage();
        
        console.log(`✅ Purge completed: ${purgedCount} elements removed`);
        return purgedCount;
    }

    emergencyCleanup() {
        console.log('🚨 Emergency cleanup initiated');
        
        const beforeCount = this.trackedElements.size;
        let cleanedCount = 0;
        
        // Phase 1: Remove orphaned elements
        cleanedCount += this.removeOrphanedElements();
        
        // Phase 2: remove only explicitly completed effect elements.
        const completedElements = [];
        this.trackedElements.forEach(element => {
            if (element.dataset?.lifecycleState === 'complete' || element.dataset?.effectComplete === 'true') {
                completedElements.push(element);
            }
        });
        
        completedElements.forEach(element => {
            try {
                if (element.parentNode) {
                    element.remove();
                }
                this.untrack(element);
                cleanedCount++;
            } catch (error) {
                console.warn('⚠️ Error in emergency cleanup:', error);
                this.untrack(element);
                cleanedCount++;
            }
        });
        
        // Phase 3: report unresolved pressure. Arbitrary class names and age
        // are not permission to terminate a connected visual.
        if (this.trackedElements.size > this.memoryUsage.threshold * 0.8) {
            window.dispatchEvent(new CustomEvent('performance:capacity-pressure', {
                detail: {
                    resource: 'tracked-elements',
                    count: this.trackedElements.size,
                    limit: this.memoryUsage.threshold,
                    emergency: true
                }
            }));
        }
        
        this.stats.emergencyCleanups++;
        this.recordCleanup('emergency', cleanedCount);
        this.updateMemoryUsage();
        
        console.log(`🚨 Emergency cleanup completed: ${cleanedCount} elements removed (${beforeCount} → ${this.trackedElements.size})`);
        return cleanedCount;
    }

    removeOrphanedElements() {
        let orphanCount = 0;
        const orphanedElements = [];
        
        this.trackedElements.forEach(element => {
            if (this.isOrphaned(element)) {
                orphanedElements.push(element);
            }
        });
        
        orphanedElements.forEach(element => {
            this.untrack(element);
            orphanCount++;
        });
        
        if (orphanCount > 0) {
            console.log(`🧹 Removed ${orphanCount} orphaned elements`);
            this.recordCleanup('orphan', orphanCount);
        }
        
        return orphanCount;
    }

    isOrphaned(element) {
        // Element is orphaned if it's not connected to the DOM
        return !element.isConnected;
    }

    isStale(element, maxAge = 300000) { // 5 minutes default
        const metadata = this.elementMetadata.get(element);
        if (!metadata) return true;
        
        const age = Date.now() - metadata.trackedAt;
        return age > maxAge;
    }

    updateMemoryUsage() {
        const currentCount = this.trackedElements.size;
        this.memoryUsage.current = currentCount;
        
        if (currentCount > this.memoryUsage.peak) {
            this.memoryUsage.peak = currentCount;
        }
        
        // Update performance state
        const previousState = this.performanceState;
        
        if (currentCount > this.memoryUsage.threshold) {
            this.performanceState = 'emergency';
        } else if (currentCount > this.memoryUsage.threshold * 0.7) {
            this.performanceState = 'degraded';
        } else {
            this.performanceState = 'optimal';
        }
        
        if (previousState !== this.performanceState) {
            console.log(`📊 Performance state changed: ${previousState} → ${this.performanceState} (${currentCount} elements)`);
            
            // Trigger cleanup based on state
            if (this.performanceState === 'emergency') {
                animationRuntime.disposeOwner(this.actionOwner);
                animationRuntime.scheduleTimeout(this.actionOwner, () => this.emergencyCleanup(), 100);
            } else if (this.performanceState === 'degraded') {
                animationRuntime.disposeOwner(this.actionOwner);
                animationRuntime.scheduleTimeout(this.actionOwner, () => this.removeOrphanedElements(), 500);
            }
        }
    }

    recordCleanup(type, count) {
        const record = {
            type,
            count,
            timestamp: Date.now(),
            totalTracked: this.trackedElements.size
        };
        
        this.cleanupHistory.push(record);
        this.stats.lastCleanup = record;
        
        // Trim history
        if (this.cleanupHistory.length > this.maxHistorySize) {
            this.cleanupHistory = this.cleanupHistory.slice(-this.maxHistorySize);
        }
    }

    startMonitoring() {
        animationRuntime.disposeOwner(this.monitorOwner);
        if (document.body) {
            this.observer.observe(document.body, { childList: true, subtree: true });
        }
        // Regular orphan cleanup every 30 seconds
        this.orphanCheckInterval = animationRuntime.scheduleInterval(this.monitorOwner, () => {
            if (window.SAFE_FLAGS?.CLEANUP_ENABLED !== false) {
                this.removeOrphanedElements();
            }
        }, 30000);
        
        console.log('📊 Performance monitoring started');
    }

    stopMonitoring() {
        animationRuntime.disposeOwner(this.monitorOwner);
        animationRuntime.disposeOwner(this.actionOwner);
        this.orphanCheckInterval = null;
        
        this.observer.disconnect();
        console.log('📊 Performance monitoring stopped');
    }

    getStats() {
        const totalAge = Array.from(this.trackedElements).reduce((sum, element) => {
            const metadata = this.elementMetadata.get(element);
            if (metadata) {
                return sum + (Date.now() - metadata.trackedAt);
            }
            return sum;
        }, 0);
        
        this.stats.averageAge = this.trackedElements.size > 0 ? Math.round(totalAge / this.trackedElements.size) : 0;
        
        return {
            ...this.stats,
            currentTracked: this.trackedElements.size,
            memoryUsage: this.memoryUsage,
            performanceState: this.performanceState,
            recentCleanups: this.cleanupHistory.slice(-10)
        };
    }

    // Get detailed information about tracked elements
    getTrackedElements() {
        const elements = [];
        this.trackedElements.forEach(element => {
            const metadata = this.elementMetadata.get(element);
            elements.push({
                element,
                metadata: metadata || {},
                age: metadata ? Date.now() - metadata.trackedAt : 0,
                isConnected: element.isConnected,
                tagName: element.tagName?.toLowerCase()
            });
        });
        
        return elements.sort((a, b) => b.age - a.age); // Sort by age, oldest first
    }

    // Force cleanup of specific element types
    cleanupByType(type) {
        let cleanedCount = 0;
        const elementsToClean = [];
        
        this.trackedElements.forEach(element => {
            if (element.tagName?.toLowerCase() === type.toLowerCase()) {
                elementsToClean.push(element);
            }
        });
        
        elementsToClean.forEach(element => {
            try {
                if (element.parentNode) {
                    element.remove();
                }
                this.untrack(element);
                cleanedCount++;
            } catch (error) {
                console.warn(`⚠️ Error cleaning ${type}:`, error);
                this.untrack(element);
                cleanedCount++;
            }
        });
        
        if (cleanedCount > 0) {
            console.log(`🧹 Cleaned up ${cleanedCount} elements of type: ${type}`);
            this.recordCleanup(`type-${type}`, cleanedCount);
        }
        
        return cleanedCount;
    }

    // Full system reset
    reset() {
        console.log('🔄 Resetting SafePerformanceElementManager...');
        
        // Stop monitoring
        this.stopMonitoring();
        
        // Clean up all tracked elements
        const allElements = Array.from(this.trackedElements);
        let cleanedCount = 0;
        
        allElements.forEach(element => {
            try {
                if (element.parentNode && !element.hasAttribute('data-permanent')) {
                    element.remove();
                }
                cleanedCount++;
            } catch (error) {
                // Ignore removal errors
            }
        });
        
        // Clear all collections
        this.trackedElements.clear();
        this.cleanupHistory = [];
        this.stats = {
            totalTracked: 0,
            totalCleaned: cleanedCount,
            emergencyCleanups: 0,
            lastCleanup: null,
            averageAge: 0
        };
        
        // Reset state
        this.performanceState = 'optimal';
        this.memoryUsage.current = 0;
        
        // Restart monitoring
        this.startMonitoring();
        
        console.log(`✅ Reset completed: ${cleanedCount} elements removed`);
        return cleanedCount;
    }

    // Destroy the manager
    destroy() {
        console.log('🧹 Destroying PerformanceElementManager...');
        this.stopMonitoring();
        this.trackedElements.clear();
        this.cleanupHistory = [];
        console.log('✅ PerformanceElementManager destroyed');
    }

    // BACKWARD COMPATIBILITY METHODS for existing API
    
    /**
     * Create and track a managed element (backward compatibility)
     * @param {string} type - Element type (div, canvas, etc.)
     * @param {string} category - Category for limits (effect, particle, overlay, etc.)
     * @param {Object} styles - CSS styles object
     * @param {Object} options - Additional options
     * @returns {HTMLElement} The created element
     */
    createElement(type = 'div', category = 'effect', styles = {}, options = {}) {
        const element = document.createElement(type);
        const elementId = `perf-${category}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Apply styles
        this.applyStyles(element, styles);
        
        // Add performance tracking class
        element.classList.add('perf-managed', `perf-${category}`);
        element.setAttribute('data-perf-id', elementId);
        
        // Track the element
        this.track(element, { category, source: 'createElement' });
        
        // Auto-append to body unless specified otherwise
        if (options.autoAppend !== false) {
            document.body.appendChild(element);
        }
        
        console.log(`✨ Created ${category} element: ${elementId} (Total: ${this.trackedElements.size})`);
        
        return element;
    }

    /**
     * Apply styles efficiently (backward compatibility)
     */
    applyStyles(element, styles) {
        // Convert object styles to cssText for better performance
        const cssText = Object.entries(styles)
            .map(([key, value]) => `${this.camelToKebab(key)}: ${value}`)
            .join('; ');
        
        if (cssText) {
            element.style.cssText = cssText;
        }
    }

    /**
     * Convert camelCase to kebab-case (backward compatibility)
     */
    camelToKebab(str) {
        return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    }

    /**
     * Register a GSAP animation with an element (backward compatibility)
     */
    registerAnimation(elementId, animationTween) {
        // Find element by ID
        const element = document.querySelector(`[data-perf-id="${elementId}"]`);
        if (element && this.trackedElements.has(element)) {
            const metadata = this.elementMetadata.get(element);
            if (metadata) {
                if (!metadata.animations) metadata.animations = new Set();
                metadata.animations.add(animationTween);
                metadata.lastUsed = Date.now();
            }
        }
    }

    /**
     * Register an interval with an element (backward compatibility)
     */
    registerInterval(elementId, intervalId) {
        // Find element by ID
        const element = document.querySelector(`[data-perf-id="${elementId}"]`);
        if (element && this.trackedElements.has(element)) {
            const metadata = this.elementMetadata.get(element);
            if (metadata) {
                if (!metadata.intervals) metadata.intervals = new Set();
                metadata.intervals.add(intervalId);
            }
        }
    }

    /**
     * Remove element (backward compatibility)
     */
    removeElement(elementIdOrElement) {
        let element;
        
        if (typeof elementIdOrElement === 'string') {
            // Find by ID
            element = document.querySelector(`[data-perf-id="${elementIdOrElement}"]`);
        } else {
            // Direct element reference
            element = elementIdOrElement;
        }
        
        if (!element) return false;
        
        // Clean up animations and intervals
        const metadata = this.elementMetadata.get(element);
        if (metadata) {
            // Kill all GSAP animations
            if (metadata.animations) {
                metadata.animations.forEach(tween => {
                    if (tween && tween.kill) {
                        tween.kill();
                    }
                });
            }
            
            // Clear all intervals
            if (metadata.intervals) {
                metadata.intervals.forEach(intervalId => {
                    clearInterval(intervalId);
                });
            }
        }
        
        // Remove from DOM and untrack
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
        
        return this.untrack(element);
    }

    /**
     * Alias for removeOrphanedElements for backward compatibility
     */
    performPeriodicCleanup() {
        return this.removeOrphanedElements();
    }
}

// Create global instance for backward compatibility
if (typeof window !== 'undefined') {
    window.performanceElementManager = new PerformanceElementManager();
}

export default PerformanceElementManager;
