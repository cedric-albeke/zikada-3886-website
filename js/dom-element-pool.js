/**
 * DOM Element Pool - Reuse DOM elements instead of creating/destroying
 * 
 * This prevents excessive DOM growth by recycling elements for animations
 */

class DOMElementPool {
    constructor() {
        this.pools = new Map();
        this.maxPoolSize = 100; // Max elements per type
        this.activeElements = new WeakMap(); // Track which elements are in use
        
        console.log('♻️ DOM Element Pool initialized');
    }
    
    /**
     * Get an element from the pool or create new one
     */
    acquire(type = 'div', initialStyle = {}) {
        const poolKey = type;
        
        // Initialize pool for this type if needed
        if (!this.pools.has(poolKey)) {
            this.pools.set(poolKey, []);
        }
        
        const pool = this.pools.get(poolKey);
        
        // Try to reuse an element from the pool
        if (pool.length > 0) {
            const element = pool.pop();
            this._resetElement(element);
            this._applyStyle(element, initialStyle);
            this.activeElements.set(element, true);
            return element;
        }
        
        // Create new element if pool is empty
        const element = document.createElement(type);
        this._applyStyle(element, initialStyle);
        this.activeElements.set(element, true);
        return element;
    }
    
    /**
     * Return an element to the pool for reuse
     */
    release(element) {
        if (!element || !element.parentNode) return false;
        
        // Remove from DOM
        element.parentNode.removeChild(element);
        
        // Get element type
        const type = element.tagName.toLowerCase();
        const poolKey = type;
        
        // Initialize pool if needed
        if (!this.pools.has(poolKey)) {
            this.pools.set(poolKey, []);
        }
        
        const pool = this.pools.get(poolKey);
        
        // Only return to pool if we haven't exceeded max size
        if (pool.length < this.maxPoolSize) {
            this._resetElement(element);
            pool.push(element);
            this.activeElements.delete(element);
            return true;
        }
        
        // Pool is full, let element be garbage collected
        this.activeElements.delete(element);
        return false;
    }
    
    /**
     * Reset element to clean state
     */
    _resetElement(element) {
        // Clear content
        element.textContent = '';
        element.innerHTML = '';
        
        // Reset style
        element.removeAttribute('style');
        
        // Clear classes
        element.className = '';
        
        // Clear data attributes
        Array.from(element.attributes).forEach(attr => {
            if (attr.name.startsWith('data-')) {
                element.removeAttribute(attr.name);
            }
        });
        
        // Kill any GSAP animations
        if (window.gsap) {
            window.gsap.killTweensOf(element);
        }
    }
    
    /**
     * Apply styles to element
     */
    _applyStyle(element, styleObj) {
        if (typeof styleObj === 'string') {
            element.style.cssText = styleObj;
        } else if (typeof styleObj === 'object') {
            Object.assign(element.style, styleObj);
        }
    }
    
    /**
     * Create a self-releasing element (auto-returns to pool after animation)
     */
    acquireAutoRelease(type, initialStyle, duration = 1000) {
        const element = this.acquire(type, initialStyle);
        
        // Auto-release after duration
        setTimeout(() => {
            this.release(element);
        }, duration);
        
        return element;
    }
    
    /**
     * Get pool statistics
     */
    getStats() {
        const stats = {};
        this.pools.forEach((pool, type) => {
            stats[type] = {
                available: pool.length,
                maxSize: this.maxPoolSize
            };
        });
        return stats;
    }
    
    /**
     * Clear all pools
     */
    clearAll() {
        this.pools.forEach(pool => {
            pool.length = 0;
        });
        this.pools.clear();
        console.log('♻️ All DOM element pools cleared');
    }
    
    /**
     * Trim pools to reduce memory
     */
    trim(targetSize = 10) {
        this.pools.forEach(pool => {
            if (pool.length > targetSize) {
                pool.length = targetSize;
            }
        });
        console.log(`♻️ DOM pools trimmed to max ${targetSize} elements each`);
    }
}

// Global instance
const domElementPool = new DOMElementPool();

// Expose for debugging
if (typeof window !== 'undefined') {
    window.domElementPool = domElementPool;
    window.poolStats = () => console.table(domElementPool.getStats());
}

export default domElementPool;
