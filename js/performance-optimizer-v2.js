// Performance Optimizer V2 - Comprehensive performance improvements for ZIKADA 3886
// Addresses memory leaks, DOM bloat, animation performance, and system stability

import animationRuntime from './runtime/animation-runtime.js';
import performanceBus from './performance-bus.js';

class PerformanceOptimizerV2 {
    constructor() {
        this.runtimeOwner = 'performance-optimizer-v2';
        animationRuntime.disposeOwner(this.runtimeOwner);
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
            fps: 45,
            minimumAcceptableFPS: 30,
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
        this.performanceUnsubscribe = null;
        this.elementCleanupToken = null;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fpsHistory = [];
        this.startedAt = performance.now();
        this.startupGraceMs = 15000;
        this.lowFpsSampleCount = 0;
        this.criticalLowFpsSampleCount = 0;
        this.requiredLowFpsSamples = 5;
        this.requiredCriticalLowFpsSamples = 3;
        this.lastRequestedProfile = 'medium';
        this.lastStructuralMetricCheckAt = 0;
        
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
        
        // Listen for performance mode changes
        this.performanceModeHandler = (e) => {
            this.setMode(e.detail.mode || 'balanced');
        };
        window.addEventListener('performanceModeChange', this.performanceModeHandler);
        animationRuntime.trackDisposer(this.runtimeOwner, () => {
            window.removeEventListener('performanceModeChange', this.performanceModeHandler);
        });
        
        console.log('📊 Performance monitoring started');
    }
    
    startFPSMonitoring() {
        if (this.performanceUnsubscribe) return;

        const onMetrics = ({ fps, memoryMB, memoryBytes, memoryLimitBytes, domNodes, activeAnimations }) => {
            if (!Number.isFinite(fps)) return;
            this.performanceMetrics.fps = fps;
            this.performanceMetrics.memory = Number.isFinite(memoryMB)
                ? Math.round(memoryMB)
                : Math.round((Number(memoryBytes) || 0) / (1024 * 1024));
            this.performanceMetrics.domNodes = Number(domNodes) || 0;
            this.performanceMetrics.activeAnimations = Number(activeAnimations) || 0;
            this.fpsHistory.push(fps);
            if (this.fpsHistory.length > 60) this.fpsHistory.shift();

            const now = performance.now();
            if (now - this.lastStructuralMetricCheckAt < 5000) return;
            this.lastStructuralMetricCheckAt = now;

            const usagePercent = memoryLimitBytes > 0
                ? ((Number(memoryBytes) || 0) / memoryLimitBytes) * 100
                : 0;
            if (usagePercent > 80) this.triggerMemoryOptimizations();
            else if (usagePercent > 60) this.triggerModerateMemoryOptimizations();
            if (this.performanceMetrics.domNodes > this.cleanupThresholds.domNodes) {
                this.triggerDOMOptimizations();
            }
        };

        onMetrics(performanceBus.metrics);
        this.performanceUnsubscribe = performanceBus.subscribe(onMetrics);
        animationRuntime.trackDisposer(this.runtimeOwner, () => {
            this.performanceUnsubscribe?.();
            this.performanceUnsubscribe = null;
        });
    }

    isPastStartupGrace() {
        return performance.now() - this.startedAt >= this.startupGraceMs;
    }
    
    startMemoryMonitoring() {
        // Structural metrics are supplied by PerformanceBus. Kept as a
        // compatibility hook for integrations that called this method.
    }
    
    startDOMMonitoring() {
        // Structural metrics are supplied by PerformanceBus.
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
        // Do not monkey-patch document.querySelector/querySelectorAll.
        // The previous implementation shared one selector cache for single-node
        // and NodeList lookups, so a querySelector() cache hit could make a later
        // querySelectorAll() return undefined. Dynamic animation layers must see
        // the live DOM; global selector overrides caused stale/frozen effects.
        const cache = this.elementCache;
        const CACHE_TTL = 5000; // 5 seconds

        animationRuntime.scheduleInterval(this.runtimeOwner, () => {
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

        if (this.elementCleanupToken) this.elementCleanupToken.clear();
        this.elementCleanupToken = animationRuntime.scheduleInterval(this.runtimeOwner, () => {
            this.performElementCleanup();
        }, strategy.domCleanupInterval);
    }
    
    performElementCleanup() {
        const now = Date.now();
        if (now - this.performanceMetrics.lastCleanup < 5000) return; // Throttle cleanup

        // Automatic maintenance is audit-only. Connected visuals remain owned
        // by their effect lifecycle for their complete authored duration.
        window.performanceElementManager?.removeOrphanedElements?.();
        window.gsapAnimationRegistry?.performPeriodicCleanup?.();
        this.performanceMetrics.lastCleanup = now;
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
        // Global RAF monkey-patching used to drop callbacks from unrelated
        // render loops. Throttling is now owner-scoped via AnimationRuntime.
    }
    
    setupAnimationCleanup() {
        // Monitor active animations
        animationRuntime.scheduleInterval(this.runtimeOwner, () => {
            this.cleanupStaleAnimations();
        }, 30000); // Every 30 seconds
    }
    
    cleanupStaleAnimations() {
        // Registries know completion state and ownership; wall-clock age alone
        // must never terminate a visual.
        window.gsapAnimationRegistry?.performPeriodicCleanup?.();
        window.animeManager?.cleanupCompleted?.();
    }
    
    isAnimationStale(animation, maxAge = 300000) { // 5 minutes default
        const createdAt = this.getAnimationWallClockCreatedAt(animation);
        if (!createdAt) return false;

        const age = Date.now() - createdAt;
        return age > maxAge;
    }

    getAnimationWallClockCreatedAt(animation) {
        const now = Date.now();
        const oldestReasonableTimestamp = Date.UTC(2020, 0, 1);
        const newestReasonableTimestamp = now + 60000;
        const candidates = [
            animation?.createdAt,
            animation?._createdAt,
            animation?.vars?.createdAt,
            animation?.vars?._createdAt,
            animation?.vars?.created,
            animation?.data?.createdAt
        ];

        try {
            const targets = typeof animation?.targets === 'function'
                ? animation.targets()
                : animation?._targets;

            if (Array.isArray(targets)) {
                targets.forEach(target => {
                    const created = target?.dataset?.created || target?.dataset?.createdAt;
                    if (created) candidates.push(created);
                });
            }
        } catch (_) {
            // Missing/foreign animation targets are simply not age-cleaned.
        }

        const timestamps = candidates
            .map(value => Number(value))
            .filter(value => Number.isFinite(value))
            .filter(value => value >= oldestReasonableTimestamp && value <= newestReasonableTimestamp);

        if (timestamps.length === 0) return 0;
        return Math.min(...timestamps);
    }
    
    setupMemoryOptimizations() {
        // Setup garbage collection hints
        this.setupGCHints();
    }
    
    setupMemoryPressureHandling() {
        // PerformanceBus owns memory sampling and pressure dispatch.
    }
    
    setupGCHints() {
        // Suggest garbage collection when appropriate
        if (window.gc) {
            animationRuntime.scheduleInterval(this.runtimeOwner, () => {
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
        console.log('⚡ Requesting lower-cost visual profile');
        this.applyAdaptivePerformanceProfile();
    }

    applyAdaptivePerformanceProfile() {
        const fps = this.performanceMetrics.fps || 60;
        const profile = this.lastRequestedProfile === 'low' ? 'low' : 'medium';

        try {
            if (window.performanceProfileManager && typeof window.performanceProfileManager.applyProfile === 'function') {
                window.performanceProfileManager.applyProfile(profile, {
                    reason: 'soft-low-fps-optimizer',
                    fps
                });
            }
        } catch (_) {}

        try {
            if (window.chaosEngine) {
                if (typeof window.chaosEngine.adjustPostProcessing === 'function') {
                    window.chaosEngine.adjustPostProcessing(profile === 'low' ? 'low' : 'medium');
                }
                if (typeof window.chaosEngine.setPixelRatio === 'function') {
                    window.chaosEngine.setPixelRatio(profile === 'low' ? 0.65 : 0.85);
                }
                if (typeof window.chaosEngine.updateFrequency === 'number') {
                    window.chaosEngine.updateFrequency = profile === 'low' ? 6 : 4;
                }
            }
        } catch (_) {}

        try {
            window.dispatchEvent(new CustomEvent('performance:profile-request', {
                detail: {
                    profile,
                    fps,
                    targetFPS: 60,
                    actionFPS: this.cleanupThresholds.fps,
                    minimumAcceptableFPS: this.cleanupThresholds.minimumAcceptableFPS
                }
            }));
        } catch (_) {}
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
        // Quality is applied to future sampling/density decisions. Existing
        // particles and timelines retain their authored lifetime.
        document.documentElement.style.setProperty('--animation-quality', 'low');
        this.lastRequestedProfile = 'low';
        this.applyAdaptivePerformanceProfile();
    }
    
    softenNonEssentialAnimations() {
        this.applyAdaptivePerformanceProfile();
    }
    
    cleanupEventListeners() {
        // Event listeners are disposed by their owning modules. Cloning live
        // elements would destroy state and is never a valid automatic cleanup.
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
        
        // Global RAF throttling is intentionally disabled.
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
        
        // Remove all temporary elements (but preserve permanent ones)
        const tempElements = document.querySelectorAll(
            '[data-temp], [class^="anime-"], [class*=" anime-"], [class^="glitch-"], [class*=" glitch-"], [class^="corruption-"], [class*=" corruption-"]'
        );
        let removedCount = 0;
        tempElements.forEach(el => {
            // Skip permanent elements
            if (el.hasAttribute('data-permanent')) {
                return;
            }
            
            try {
                el.remove();
                removedCount++;
            } catch (e) {
                // Ignore removal errors
            }
        });
        
        if (removedCount > 0) {
            console.log(`🧹 Removed ${removedCount} temporary elements (preserved permanent elements)`);
        }
        
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
        animationRuntime.disposeOwner(this.runtimeOwner);
        this.performanceUnsubscribe = null;
        this.elementCleanupToken = null;
        
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
