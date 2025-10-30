// Performance Optimizer V2 - Comprehensive performance improvements for ZIKADA 3886
// Addresses memory leaks, DOM bloat, animation performance, and system stability

class PerformanceOptimizerV2 {
    constructor() {
        this.optimizations = new Map();
        this.performanceMetrics = {
            fps: 60,
            memory: 0,
            domNodes: 0,
            activeAnimations: 0,
            lastCleanup: 0
        };
        
        this.cleanupThresholds = {
            domNodes: 5000,
            memory: 100, // MB
            fps: 30,
            animationCount: 50
        };
        
        this.optimizationStrategies = {
            aggressive: {
                domCleanupInterval: 10000, // 10 seconds
                memoryCleanupThreshold: 50, // MB
                maxAnimations: 20,
                maxParticles: 50,
                enableRAFThrottling: true
            },
            balanced: {
                domCleanupInterval: 30000, // 30 seconds
                memoryCleanupThreshold: 80, // MB
                maxAnimations: 50,
                maxParticles: 100,
                enableRAFThrottling: false
            },
            performance: {
                domCleanupInterval: 60000, // 60 seconds
                memoryCleanupThreshold: 120, // MB
                maxAnimations: 100,
                maxParticles: 200,
                enableRAFThrottling: false
            }
        };
        
        this.currentMode = 'balanced';
        this.isMonitoring = false;
        this.rafId = null;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fpsHistory = [];
        
        this.init();
    }
    
    init() {
        this.setupPerformanceMonitoring();
        this.setupDOMOptimizations();
        this.setupAnimationOptimizations();
        this.setupMemoryOptimizations();
        this.setupRAFThrottling();
        
        console.log('🚀 Performance Optimizer V2 initialized');
    }
    
    setupPerformanceMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        this.startFPSMonitoring();
        this.startMemoryMonitoring();
        this.startDOMMonitoring();
        
        // Listen for performance mode changes
        window.addEventListener('performanceModeChange', (e) => {
            this.setMode(e.detail.mode || 'balanced');
        });
        
        console.log('📊 Performance monitoring started');
    }
    
    startFPSMonitoring() {
        const measureFPS = (currentTime) => {
            if (this.lastFrameTime === 0) {
                this.lastFrameTime = currentTime;
                this.frameCount = 0;
            }
            
            this.frameCount++;
            const deltaTime = currentTime - this.lastFrameTime;
            
            if (deltaTime >= 1000) { // Update every second
                const fps = Math.round((this.frameCount * 1000) / deltaTime);
                this.performanceMetrics.fps = fps;
                
                // Keep FPS history for trend analysis
                this.fpsHistory.push(fps);
                if (this.fpsHistory.length > 60) { // Keep 60 seconds of history
                    this.fpsHistory.shift();
                }
                
                // Trigger optimizations if FPS is low
                if (fps < this.cleanupThresholds.fps) {
                    this.triggerLowFPSOptimizations();
                }
                
                this.frameCount = 0;
                this.lastFrameTime = currentTime;
            }
            
            this.rafId = requestAnimationFrame(measureFPS);
        };
        
        this.rafId = requestAnimationFrame(measureFPS);
    }
    
    startMemoryMonitoring() {
        setInterval(() => {
            if (performance.memory) {
                const memUsed = performance.memory.usedJSHeapSize / (1024 * 1024);
                this.performanceMetrics.memory = Math.round(memUsed);
                
                if (memUsed > this.cleanupThresholds.memory) {
                    this.triggerMemoryOptimizations();
                }
            }
        }, 5000); // Check every 5 seconds
    }
    
    startDOMMonitoring() {
        setInterval(() => {
            const domCount = document.querySelectorAll('*').length;
            this.performanceMetrics.domNodes = domCount;
            
            if (domCount > this.cleanupThresholds.domNodes) {
                this.triggerDOMOptimizations();
            }
        }, 10000); // Check every 10 seconds
    }
    
    setupDOMOptimizations() {
        // Optimize DOM queries with caching
        this.elementCache = new Map();
        this.lastCacheCleanup = Date.now();
        
        // Override common DOM methods with optimized versions
        this.optimizeDOMQueries();
        
        // Setup automatic cleanup of unused elements
        this.setupElementCleanup();
    }
    
    optimizeDOMQueries() {
        const originalQuerySelector = document.querySelector;
        const originalQuerySelectorAll = document.querySelectorAll;
        
        // Cache frequently used selectors
        const cache = this.elementCache;
        const CACHE_TTL = 5000; // 5 seconds
        
        document.querySelector = function(selector) {
            const now = Date.now();
            const cached = cache.get(selector);
            
            if (cached && (now - cached.timestamp) < CACHE_TTL) {
                return cached.element;
            }
            
            const element = originalQuerySelector.call(this, selector);
            if (element) {
                cache.set(selector, { element, timestamp: now });
            }
            
            return element;
        };
        
        document.querySelectorAll = function(selector) {
            const now = Date.now();
            const cached = cache.get(selector);
            
            if (cached && (now - cached.timestamp) < CACHE_TTL) {
                return cached.elements;
            }
            
            const elements = originalQuerySelectorAll.call(this, selector);
            if (elements.length > 0) {
                cache.set(selector, { elements, timestamp: now });
            }
            
            return elements;
        };
        
        // Clean cache periodically
        setInterval(() => {
            const now = Date.now();
            for (const [key, value] of cache.entries()) {
                if ((now - value.timestamp) > CACHE_TTL) {
                    cache.delete(key);
                }
            }
        }, 10000);
    }
    
    setupElementCleanup() {
        const strategy = this.optimizationStrategies[this.currentMode];
        
        setInterval(() => {
            this.performElementCleanup();
        }, strategy.domCleanupInterval);
    }
    
    performElementCleanup() {
        const now = Date.now();
        if (now - this.performanceMetrics.lastCleanup < 5000) return; // Throttle cleanup
        
        let cleanedCount = 0;
        
        // Clean up orphaned elements
        // querySelectorAll doesn't support wildcard class selectors like .anime-*;
        // use class attribute substring/prefix selectors instead.
        const orphanedElements = document.querySelectorAll(
            '[data-temp], [data-effect], [class^="anime-"], [class*=" anime-"], [class^="glitch-"], [class*=" glitch-"], [class^="corruption-"], [class*=" corruption-"]'
        );
        orphanedElements.forEach(el => {
            if (!el.isConnected || this.isElementStale(el)) {
                try {
                    el.remove();
                    cleanedCount++;
                } catch (e) {
                    // Ignore removal errors
                }
            }
        });
        
        // Clean up old canvas elements
        const canvases = document.querySelectorAll('canvas');
        canvases.forEach(canvas => {
            if (this.isElementStale(canvas, 30000)) { // 30 seconds
                try {
                    canvas.remove();
                    cleanedCount++;
                } catch (e) {
                    // Ignore removal errors
                }
            }
        });
        
        // Clean up old style elements
        const styles = document.querySelectorAll('style[data-temp]');
        styles.forEach(style => {
            if (this.isElementStale(style, 60000)) { // 1 minute
                try {
                    style.remove();
                    cleanedCount++;
                } catch (e) {
                    // Ignore removal errors
                }
            }
        });
        
        if (cleanedCount > 0) {
            this.performanceMetrics.lastCleanup = now;
            console.log(`🧹 Cleaned up ${cleanedCount} elements`);
        }
    }
    
    isElementStale(element, maxAge = 300000) { // 5 minutes default
        const created = element.dataset.created || element.getAttribute('data-created');
        if (!created) return false;
        
        const age = Date.now() - parseInt(created);
        return age > maxAge;
    }
    
    setupAnimationOptimizations() {
        // Throttle animation frame requests
        this.animationThrottle = new Map();
        
        // Override requestAnimationFrame for better performance
        this.optimizeRAF();
        
        // Setup animation cleanup
        this.setupAnimationCleanup();
    }
    
    optimizeRAF() {
        const originalRAF = window.requestAnimationFrame;
        const strategy = this.optimizationStrategies[this.currentMode];
        
        if (strategy.enableRAFThrottling) {
            let lastCall = 0;
            const throttleMs = 16; // ~60fps max
            
            window.requestAnimationFrame = (callback) => {
                const now = performance.now();
                if (now - lastCall >= throttleMs) {
                    lastCall = now;
                    return originalRAF(callback);
                }
                return originalRAF(() => {
                    // Skip this frame
                });
            };
        }
    }
    
    setupAnimationCleanup() {
        // Monitor active animations
        setInterval(() => {
            this.cleanupStaleAnimations();
        }, 30000); // Every 30 seconds
    }
    
    cleanupStaleAnimations() {
        // Clean up GSAP animations
        if (window.gsap && window.gsap.globalTimeline) {
            const timeline = window.gsap.globalTimeline;
            const children = timeline.getChildren();
            
            let cleanedCount = 0;
            children.forEach(child => {
                if (child.isActive && this.isAnimationStale(child)) {
                    child.kill();
                    cleanedCount++;
                }
            });
            
            if (cleanedCount > 0) {
                console.log(`🎬 Cleaned up ${cleanedCount} stale GSAP animations`);
            }
        }
        
        // Clean up anime.js animations
        if (window.animeManager && window.animeManager.instances) {
            const instances = window.animeManager.instances;
            let cleanedCount = 0;
            
            instances.forEach(instance => {
                if (this.isAnimationStale(instance)) {
                    try {
                        instance.pause();
                        instances.delete(instance);
                        cleanedCount++;
                    } catch (e) {
                        // Ignore cleanup errors
                    }
                }
            });
            
            if (cleanedCount > 0) {
                console.log(`🎬 Cleaned up ${cleanedCount} stale anime.js animations`);
            }
        }
    }
    
    isAnimationStale(animation, maxAge = 300000) { // 5 minutes default
        const startTime = animation._startTime || animation.startTime || 0;
        if (!startTime) return false;
        
        const age = Date.now() - startTime;
        return age > maxAge;
    }
    
    setupMemoryOptimizations() {
        // Setup memory pressure handling
        if ('memory' in performance) {
            this.setupMemoryPressureHandling();
        }
        
        // Setup garbage collection hints
        this.setupGCHints();
    }
    
    setupMemoryPressureHandling() {
        let lastMemoryCheck = 0;
        
        setInterval(() => {
            const now = Date.now();
            if (now - lastMemoryCheck < 10000) return; // Check every 10 seconds
            
            const memInfo = performance.memory;
            const usedMB = memInfo.usedJSHeapSize / (1024 * 1024);
            const totalMB = memInfo.totalJSHeapSize / (1024 * 1024);
            const limitMB = memInfo.jsHeapSizeLimit / (1024 * 1024);
            
            const usagePercent = (usedMB / limitMB) * 100;
            
            if (usagePercent > 80) {
                this.triggerMemoryOptimizations();
            } else if (usagePercent > 60) {
                this.triggerModerateMemoryOptimizations();
            }
            
            lastMemoryCheck = now;
        }, 10000);
    }
    
    setupGCHints() {
        // Suggest garbage collection when appropriate
        if (window.gc) {
            setInterval(() => {
                const memInfo = performance.memory;
                const usedMB = memInfo.usedJSHeapSize / (1024 * 1024);
                const limitMB = memInfo.jsHeapSizeLimit / (1024 * 1024);
                
                if ((usedMB / limitMB) > 0.7) {
                    try {
                        window.gc();
                        console.log('🗑️ Triggered garbage collection');
                    } catch (e) {
                        // GC not available
                    }
                }
            }, 30000); // Every 30 seconds
        }
    }
    
    setupRAFThrottling() {
        // Throttle high-frequency operations
        this.throttledOperations = new Map();
    }
    
    throttle(operation, delay = 16) {
        if (!this.throttledOperations.has(operation)) {
            let lastCall = 0;
            this.throttledOperations.set(operation, () => {
                const now = performance.now();
                if (now - lastCall >= delay) {
                    lastCall = now;
                    operation();
                }
            });
        }
        
        return this.throttledOperations.get(operation);
    }
    
    triggerLowFPSOptimizations() {
        console.log('⚡ Triggering low FPS optimizations');
        
        // Reduce animation quality
        this.reduceAnimationQuality();
        
        // Clean up DOM
        this.performElementCleanup();
        
        // Pause non-essential animations
        this.pauseNonEssentialAnimations();
    }
    
    triggerMemoryOptimizations() {
        console.log('🧠 Triggering memory optimizations');
        
        // Aggressive cleanup
        this.performElementCleanup();
        this.cleanupStaleAnimations();
        
        // Clear caches
        this.elementCache.clear();
        
        // Force garbage collection if available
        if (window.gc) {
            try {
                window.gc();
            } catch (e) {
                // GC not available
            }
        }
    }
    
    triggerModerateMemoryOptimizations() {
        console.log('🧠 Triggering moderate memory optimizations');
        
        // Moderate cleanup
        this.performElementCleanup();
        
        // Clear old cache entries
        const now = Date.now();
        for (const [key, value] of this.elementCache.entries()) {
            if ((now - value.timestamp) > 10000) { // 10 seconds
                this.elementCache.delete(key);
            }
        }
    }
    
    triggerDOMOptimizations() {
        console.log('🌳 Triggering DOM optimizations');
        
        // Aggressive DOM cleanup
        this.performElementCleanup();
        
        // Remove unused event listeners
        this.cleanupEventListeners();
    }
    
    reduceAnimationQuality() {
        // Reduce particle count
        const particles = document.querySelectorAll('.particle, .anime-particle');
        const maxParticles = this.optimizationStrategies[this.currentMode].maxParticles;
        
        if (particles.length > maxParticles) {
            const toRemove = particles.length - maxParticles;
            for (let i = 0; i < toRemove; i++) {
                try {
                    particles[i].remove();
                } catch (e) {
                    // Ignore removal errors
                }
            }
        }
        
        // Reduce animation complexity
        document.documentElement.style.setProperty('--animation-quality', 'low');
    }
    
    pauseNonEssentialAnimations() {
        // Pause background animations
        const backgroundAnims = document.querySelectorAll('[data-bg-animation]');
        backgroundAnims.forEach(el => {
            el.style.animationPlayState = 'paused';
        });
        
        // Pause particle systems
        const particles = document.querySelectorAll('.particle-system');
        particles.forEach(el => {
            el.style.animationPlayState = 'paused';
        });
    }
    
    cleanupEventListeners() {
        // This is a simplified cleanup - in a real implementation,
        // you'd need to track event listeners more carefully
        const elements = document.querySelectorAll('[data-temp]');
        elements.forEach(el => {
            // Clone element to remove all event listeners
            const newEl = el.cloneNode(true);
            if (el.parentNode) {
                el.parentNode.replaceChild(newEl, el);
            }
        });
    }
    
    setMode(mode) {
        if (this.optimizationStrategies[mode]) {
            this.currentMode = mode;
            console.log(`🎛️ Performance mode changed to: ${mode}`);
            
            // Apply mode-specific optimizations
            this.applyModeOptimizations();
        }
    }
    
    applyModeOptimizations() {
        const strategy = this.optimizationStrategies[this.currentMode];
        
        // Update cleanup intervals
        this.setupElementCleanup();
        
        // Update animation limits
        if (window.gsapAnimationRegistry) {
            window.gsapAnimationRegistry.maxAnimations = strategy.maxAnimations;
        }
        
        // Update RAF throttling
        this.optimizeRAF();
    }
    
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            averageFPS: this.calculateAverageFPS(),
            mode: this.currentMode,
            cacheSize: this.elementCache.size,
            throttledOperations: this.throttledOperations.size
        };
    }
    
    calculateAverageFPS() {
        if (this.fpsHistory.length === 0) return 0;
        
        const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
        return Math.round(sum / this.fpsHistory.length);
    }
    
    // Emergency cleanup for critical situations
    emergencyCleanup() {
        console.log('🚨 Emergency cleanup initiated');
        
        // Stop all animations
        if (window.gsap) {
            window.gsap.killTweensOf('*');
        }
        
        if (window.animeManager) {
            window.animeManager.killAll();
        }
        
        // Clear all caches
        this.elementCache.clear();
        this.throttledOperations.clear();
        
        // Remove all temporary elements
        const tempElements = document.querySelectorAll(
            '[data-temp], [class^="anime-"], [class*=" anime-"], [class^="glitch-"], [class*=" glitch-"], [class^="corruption-"], [class*=" corruption-"]'
        );
        tempElements.forEach(el => {
            try {
                el.remove();
            } catch (e) {
                // Ignore removal errors
            }
        });
        
        // Force garbage collection
        if (window.gc) {
            try {
                window.gc();
            } catch (e) {
                // GC not available
            }
        }
        
        console.log('✅ Emergency cleanup completed');
    }
    
    // Cleanup method
    destroy() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
        
        this.elementCache.clear();
        this.throttledOperations.clear();
        this.isMonitoring = false;
        
        console.log('🧹 Performance Optimizer V2 destroyed');
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.performanceOptimizerV2 = new PerformanceOptimizerV2();
}

export default PerformanceOptimizerV2;
