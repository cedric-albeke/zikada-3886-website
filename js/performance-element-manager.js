// Performance-Optimized Element Manager
// Tracks and manages all dynamically created DOM elements with lifecycle management

class PerformanceElementManager {
    constructor() {
        this.elements = new Map(); // Track all managed elements
        this.maxElements = 100; // Maximum concurrent elements
        this.cleanupAge = 30000; // Clean up elements older than 30 seconds
        this.elementCounter = 0;
        this.performanceMode = 'auto';
        
        // Categories for different element types
        this.categories = {
            'effect': { maxElements: 20, cleanupAge: 15000 },
            'particle': { maxElements: 50, cleanupAge: 10000 },
            'overlay': { maxElements: 5, cleanupAge: 20000 },
            'stream': { maxElements: 30, cleanupAge: 8000 },
            'artifact': { maxElements: 15, cleanupAge: 5000 }
        };

        // Start periodic cleanup
        this.startCleanupTimer();
        
        console.log('🧹 Performance Element Manager initialized');
    }

    /**
     * Create and track a managed element
     * @param {string} type - Element type (div, canvas, etc.)
     * @param {string} category - Category for limits (effect, particle, overlay, etc.)
     * @param {Object} styles - CSS styles object
     * @param {Object} options - Additional options
     * @returns {HTMLElement} The created element
     */
    createElement(type = 'div', category = 'effect', styles = {}, options = {}) {
        // Check if we're at limits for this category
        this.enforceElementLimits(category);
        
        const element = document.createElement(type);
        const elementId = `perf-${category}-${++this.elementCounter}`;
        
        // Add tracking data
        const elementData = {
            id: elementId,
            element: element,
            category: category,
            createdAt: Date.now(),
            lastUsed: Date.now(),
            animations: new Set(),
            intervals: new Set(),
            isActive: true
        };

        // Apply styles
        this.applyStyles(element, styles);
        
        // Add performance tracking class
        element.classList.add('perf-managed', `perf-${category}`);
        element.setAttribute('data-perf-id', elementId);
        
        // Store in registry
        this.elements.set(elementId, elementData);
        
        // Auto-append to body unless specified otherwise
        if (options.autoAppend !== false) {
            document.body.appendChild(element);
        }
        
        console.log(`✨ Created ${category} element: ${elementId} (Total: ${this.elements.size})`);
        
        return element;
    }

    /**
     * Apply styles efficiently
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
     * Convert camelCase to kebab-case
     */
    camelToKebab(str) {
        return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    }

    /**
     * Register a GSAP animation with an element
     */
    registerAnimation(elementId, animationTween) {
        const elementData = this.elements.get(elementId);
        if (elementData) {
            elementData.animations.add(animationTween);
            elementData.lastUsed = Date.now();
        }
    }

    /**
     * Register an interval with an element
     */
    registerInterval(elementId, intervalId) {
        const elementData = this.elements.get(elementId);
        if (elementData) {
            elementData.intervals.add(intervalId);
        }
    }

    /**
     * Clean up a specific element and all its resources
     */
    removeElement(elementIdOrElement) {
        let elementData;
        let elementId;

        if (typeof elementIdOrElement === 'string') {
            elementId = elementIdOrElement;
            elementData = this.elements.get(elementId);
        } else {
            // Find by element reference
            elementId = elementIdOrElement.getAttribute('data-perf-id');
            elementData = elementId ? this.elements.get(elementId) : null;
        }

        if (!elementData) return false;

        // Kill all GSAP animations
        elementData.animations.forEach(tween => {
            if (tween && tween.kill) {
                tween.kill();
            }
        });

        // Clear all intervals
        elementData.intervals.forEach(intervalId => {
            clearInterval(intervalId);
        });

        // Remove from DOM
        if (elementData.element && elementData.element.parentNode) {
            elementData.element.parentNode.removeChild(elementData.element);
        }

        // Remove from registry
        this.elements.delete(elementId);
        
        console.log(`🗑️ Removed element: ${elementId} (Remaining: ${this.elements.size})`);
        return true;
    }

    /**
     * Enforce element limits per category
     */
    enforceElementLimits(category) {
        const categoryConfig = this.categories[category] || { maxElements: 20 };
        const categoryElements = Array.from(this.elements.values())
            .filter(data => data.category === category);

        if (categoryElements.length >= categoryConfig.maxElements) {
            // Remove oldest elements in this category
            const oldestElements = categoryElements
                .sort((a, b) => a.createdAt - b.createdAt)
                .slice(0, categoryElements.length - categoryConfig.maxElements + 1);

            oldestElements.forEach(elementData => {
                this.removeElement(elementData.id);
            });
        }
    }

    /**
     * Start periodic cleanup timer
     */
    startCleanupTimer() {
        this.cleanupInterval = setInterval(() => {
            this.performPeriodicCleanup();
        }, 5000); // Clean every 5 seconds
    }

    /**
     * Perform periodic cleanup of old elements
     */
    performPeriodicCleanup() {
        const now = Date.now();
        const elementsToRemove = [];

        this.elements.forEach((elementData, elementId) => {
            const categoryConfig = this.categories[elementData.category] || { cleanupAge: this.cleanupAge };
            const age = now - elementData.createdAt;
            
            // Remove if too old or if element is no longer in DOM
            if (age > categoryConfig.cleanupAge || !document.contains(elementData.element)) {
                elementsToRemove.push(elementId);
            }
        });

        // Clean up old elements
        elementsToRemove.forEach(elementId => {
            this.removeElement(elementId);
        });

        // Log cleanup if significant
        if (elementsToRemove.length > 0) {
            console.log(`🧹 Periodic cleanup: removed ${elementsToRemove.length} elements`);
        }

        // Performance mode adjustment
        this.adjustPerformanceMode();
    }

    removeOrphanedElements() {
        const toRemove = [];
        this.elements.forEach((data, id) => {
            if (!document.contains(data.element)) toRemove.push(id);
        });
        toRemove.forEach(id => this.removeElement(id));
        if (toRemove.length) {
            console.log(`🧹 Removed ${toRemove.length} orphaned elements`);
        }
    }

    removeAllByCategory(category) {
        const ids = [];
        this.elements.forEach((data, id) => {
            if (data.category === category) ids.push(id);
        });
        ids.forEach(id => this.removeElement(id));
        if (ids.length) console.log(`🗑️ Removed ${ids.length} elements in category '${category}'`);
    }

    /**
     * Adjust performance mode based on element count
     */
    adjustPerformanceMode() {
        const elementCount = this.elements.size;
        
        if (elementCount > 80) {
            this.setPerformanceMode('aggressive');
        } else if (elementCount > 50) {
            this.setPerformanceMode('conservative');
        } else if (elementCount < 20) {
            this.setPerformanceMode('normal');
        }
    }

    /**
     * Set performance mode
     */
    setPerformanceMode(mode) {
        if (this.performanceMode === mode) return;
        
        this.performanceMode = mode;
        
        switch (mode) {
            case 'aggressive':
                // Reduce limits and cleanup age
                Object.keys(this.categories).forEach(cat => {
                    this.categories[cat].maxElements = Math.floor(this.categories[cat].maxElements * 0.5);
                    this.categories[cat].cleanupAge = Math.floor(this.categories[cat].cleanupAge * 0.5);
                });
                console.log('🚨 Performance mode: AGGRESSIVE - reducing element limits');
                break;
                
            case 'conservative':
                // Moderate reduction
                Object.keys(this.categories).forEach(cat => {
                    this.categories[cat].maxElements = Math.floor(this.categories[cat].maxElements * 0.7);
                    this.categories[cat].cleanupAge = Math.floor(this.categories[cat].cleanupAge * 0.7);
                });
                console.log('⚠️ Performance mode: CONSERVATIVE - moderate reduction');
                break;
                
            case 'normal':
                // Reset to defaults
                this.resetCategoryDefaults();
                console.log('✅ Performance mode: NORMAL - default limits restored');
                break;
        }
    }

    /**
     * Reset category defaults
     */
    resetCategoryDefaults() {
        this.categories = {
            'effect': { maxElements: 20, cleanupAge: 15000 },
            'particle': { maxElements: 50, cleanupAge: 10000 },
            'overlay': { maxElements: 5, cleanupAge: 20000 },
            'stream': { maxElements: 30, cleanupAge: 8000 },
            'artifact': { maxElements: 15, cleanupAge: 5000 }
        };
    }

    /**
     * Emergency cleanup - remove all non-essential elements
     */
    emergencyCleanup() {
        console.log('🚨 EMERGENCY CLEANUP: Removing all managed elements');
        
        const elementIds = Array.from(this.elements.keys());
        elementIds.forEach(elementId => {
            this.removeElement(elementId);
        });
        
        // Force garbage collection hint
        if (window.gc) {
            window.gc();
        }
    }

    /**
     * Get performance statistics
     */
    getStats() {
        const stats = {
            totalElements: this.elements.size,
            byCategory: {},
            performanceMode: this.performanceMode,
            memoryUsage: this.estimateMemoryUsage()
        };

        // Count by category
        this.elements.forEach(elementData => {
            const category = elementData.category;
            if (!stats.byCategory[category]) {
                stats.byCategory[category] = 0;
            }
            stats.byCategory[category]++;
        });

        return stats;
    }

    /**
     * Estimate memory usage of tracked elements
     */
    estimateMemoryUsage() {
        // Rough estimate: each element ~1KB
        return Math.round(this.elements.size * 1024);
    }

    /**
     * Destroy the manager and clean up everything
     */
    destroy() {
        // Clear cleanup timer
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        // Remove all elements
        this.emergencyCleanup();
        
        console.log('💀 Performance Element Manager destroyed');
    }
}

// Create global instance
const performanceElementManager = new PerformanceElementManager();

// Make it globally available
window.performanceElementManager = performanceElementManager;

export default performanceElementManager;