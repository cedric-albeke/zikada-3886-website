// Performance Optimizer Module
// Comprehensive optimization for ZIKADA 3886 website

import gsap from 'gsap';
import performanceBus from './performance-bus.js';
import animationRuntime from './runtime/animation-runtime.js';

class PerformanceOptimizer {
    constructor() {
        this.runtimeOwner = 'performance-optimizer-compat';
        this.maxActiveAnimations = 60;
        this.maxTotalAnimations = 125;
        this.maxDOMNodes = 500;
        this.minFPS = 45; // Increased from 30 for smoother experience
        this.cleanupInterval = null;
        this.lastMetricEvaluationAt = 0;
        this.optimizationLevel = 0; // 0: none, 1: light, 2: medium, 3: heavy
        this.fpsHistory = [];
        this.fpsHistorySize = 10;
        this.startedAt = performance.now();
        this.startupGraceMs = 15000;
        this.autoMaxOptimizationLevel = 2;
        this.optimizationRecoveryHoldMs = 12000;
        this.pendingOptimizationLevel = null;
        this.pendingOptimizationSince = 0;
        this.lastOptimizationChangeAt = 0;
        this.nonEssentialSelectors = [
            '.holographic-shimmer',
            '.chromatic-pulse',
            '.energy-field',
            '.quantum-particles'
        ];

        console.log('🚀 Performance Optimizer initialized');
    }

    init() {
        this.startMonitoring();
        this.setupEventListeners();
        this.performInitialCleanup();
    }

    startMonitoring() {
        animationRuntime.disposeOwner(this.runtimeOwner);
        const unsubscribe = performanceBus.subscribe(() => {
            const now = performance.now();
            if (now - this.lastMetricEvaluationAt < 2000) return;
            this.lastMetricEvaluationAt = now;
            this.checkAndOptimize();
        });
        animationRuntime.trackDisposer(this.runtimeOwner, unsubscribe);
    }

    checkAndOptimize() {
        const metrics = this.getMetrics();

        // Track FPS history
        this.fpsHistory.push(metrics.fps);
        if (this.fpsHistory.length > this.fpsHistorySize) {
            this.fpsHistory.shift();
        }

        // Get average FPS
        const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;

        // Only log periodically to reduce console spam
        if (Math.random() < 0.1) { // 10% chance to log
            console.log(`📊 Performance: FPS:${Math.round(avgFPS)} Animations:${metrics.totalAnimations} Memory:${metrics.memory.used}MB`);
        }

        // The central profile manager owns automatic quality. This legacy
        // facade remains for diagnostics/manual API compatibility only.
        if (window.__3886_PROFILE_MANAGER_ENABLED === true || window.performanceProfileManager) {
            return;
        }

        // Determine optimization level needed
        let newOptLevel = 0;

        // Automatic optimization must remain recoverable; level 3 is manual/emergency only.
        if (metrics.totalAnimations > 190 || metrics.activeAnimations > 105) {
            newOptLevel = 2;
        } else if (metrics.totalAnimations > 150 || metrics.activeAnimations > 85) {
            newOptLevel = 1;
        } else if (metrics.totalAnimations > this.maxTotalAnimations || metrics.activeAnimations > this.maxActiveAnimations) {
            newOptLevel = 1;
        }

        // FPS-based optimization only after startup warmup and enough samples.
        const fpsReady = (performance.now() - this.startedAt) >= this.startupGraceMs &&
            this.fpsHistory.length >= Math.min(5, this.fpsHistorySize);
        if (fpsReady) {
            if (avgFPS < 28) {
                newOptLevel = Math.max(newOptLevel, 2);
            } else if (avgFPS < 38) {
                newOptLevel = Math.max(newOptLevel, 1);
            }
        }
        newOptLevel = Math.min(newOptLevel, this.autoMaxOptimizationLevel);

        const stableOptLevel = this.getStableOptimizationLevel(newOptLevel);
        if (stableOptLevel !== this.optimizationLevel) {
            this.applyOptimization(stableOptLevel);
        }

        if (metrics.totalAnimations > this.maxTotalAnimations) {
            window.dispatchEvent(new CustomEvent('performance:capacity-pressure', {
                detail: { resource: 'gsap-animations', count: metrics.totalAnimations, limit: this.maxTotalAnimations }
            }));
        }
    }

    getStableOptimizationLevel(targetLevel) {
        if (targetLevel === this.optimizationLevel) {
            this.pendingOptimizationLevel = null;
            this.pendingOptimizationSince = 0;
            return this.optimizationLevel;
        }

        // Escalation protects frame rate and can happen immediately.
        if (targetLevel > this.optimizationLevel) {
            this.pendingOptimizationLevel = null;
            this.pendingOptimizationSince = 0;
            return targetLevel;
        }

        // Recovery is intentionally slower so level 1/2 does not flap every sample.
        const now = performance.now();
        if (this.pendingOptimizationLevel !== targetLevel) {
            this.pendingOptimizationLevel = targetLevel;
            this.pendingOptimizationSince = now;
            return this.optimizationLevel;
        }

        const stableLongEnough = now - this.pendingOptimizationSince >= this.optimizationRecoveryHoldMs;
        const changeCooldownElapsed = now - this.lastOptimizationChangeAt >= this.optimizationRecoveryHoldMs;

        if (stableLongEnough && changeCooldownElapsed) {
            this.pendingOptimizationLevel = null;
            this.pendingOptimizationSince = 0;
            return targetLevel;
        }

        return this.optimizationLevel;
    }

    getMetrics() {
        const timeline = gsap.globalTimeline;
        const children = timeline.getChildren();
        const busMetrics = performanceBus.metrics;
        let activeCount = 0;

        children.forEach(tween => {
            if (tween.isActive()) activeCount++;
        });

        return {
            totalAnimations: children.length,
            activeAnimations: activeCount,
            domNodes: Number(busMetrics.domNodes) || 0,
            fps: Number(busMetrics.fps) || 60,
            memory: {
                used: Math.round((Number(busMetrics.memoryBytes) || 0) / 1024 / 1024)
            }
        };
    }

    cleanupAnimations() {
        // Remove console log to reduce spam

        const timeline = gsap.globalTimeline;
        const children = timeline.getChildren();
        let removed = 0;

        // Sort by progress and priority
        const tweens = children.filter(t => !t.isActive() && t.progress() >= 1);

        // Remove completed animations
        tweens.forEach(tween => {
            if (removed < children.length - this.maxTotalAnimations) {
                tween.kill();
                removed++;
            }
        });

        // Kill duplicate animations on same target
        const targetMap = new Map();
        children.forEach(tween => {
            // Check if tween has targets method (GSAP specific)
            let targets = [];
            if (typeof tween.targets === 'function') {
                targets = tween.targets();
            } else if (tween.target) {
                // Fallback for tweens with single target property
                targets = [tween.target];
            } else if (tween._targets) {
                // Another fallback for internal targets
                targets = tween._targets;
            }

            if (targets && targets.length > 0) {
                targets.forEach(target => {
                    if (target && typeof target === 'object') {
                        const key = target.id || target.className || target;
                        if (!targetMap.has(key)) {
                            targetMap.set(key, []);
                        }
                        targetMap.get(key).push(tween);
                    }
                });
            }
        });

        targetMap.forEach((tweens, key) => {
            if (tweens.length > 3) {
                // Keep only the 3 most recent animations per target
                tweens.sort((a, b) => b._startTime - a._startTime);
                tweens.slice(3).forEach(tween => {
                    if (!tween.isActive()) {
                        tween.kill();
                        removed++;
                    }
                });
            }
        });

        // Only log if significant cleanup happened
        if (removed > 15) {
            console.log(`🧹 Removed ${removed} animations`);
        }
    }

    applyOptimization(level) {
        console.log(`⚙️ Applying optimization level ${level}`);
        this.pendingOptimizationLevel = null;
        this.pendingOptimizationSince = 0;
        this.lastOptimizationChangeAt = performance.now();
        this.optimizationLevel = level;

        switch(level) {
            case 0: // No optimization
                this.restoreFullEffects();
                break;
            case 1: // Light
                this.applyLightOptimization();
                break;
            case 2: // Medium
                this.applyMediumOptimization();
                break;
            case 3: // Heavy
                this.applyHeavyOptimization();
                break;
        }
    }

    applyLightOptimization() {
        window.performanceProfileManager?.applyProfile?.('medium', {
            reason: 'legacy-optimizer-manual-light'
        });
    }

    applyMediumOptimization() {
        window.performanceProfileManager?.applyProfile?.('low', {
            reason: 'legacy-optimizer-manual-medium'
        });
    }

    softenNonEssentialEffects() {
        // Retained as a compatibility no-op. Quality profiles reduce render
        // cost without dimming or hiding an admitted effect family.
    }

    applyHeavyOptimization() {
        window.performanceProfileManager?.applyProfile?.('low', {
            reason: 'legacy-optimizer-manual-heavy'
        });
    }

    restoreFullEffects() {
        console.log('✨ Restoring full effects');

        // Restore particles
        if (window.chaosEngine?.particles) {
            gsap.to(window.chaosEngine.particles.material, {
                opacity: 0.7,
                size: 0.5,
                duration: 2
            });
        }

        window.performanceProfileManager?.applyProfile?.('high', {
            reason: 'legacy-optimizer-manual-restore'
        });

        // Resume the bounded shared ambient renderer without recreating layers.
        window.ambientCanvasRenderer?.start?.();

        // Restart phase animations if stopped
        if (window.chaosInit && !window.chaosInit.phaseRunning) {
            window.chaosInit.phaseRunning = true;
            window.chaosInit.startAnimationPhases();
        }
    }

    performInitialCleanup() {
        console.log('🧹 Performing initial cleanup...');

        // Remove duplicate elements
        const duplicateSelectors = [
            '.matrix-blackout',
            '.phase-overlay',
            '.glitch-overlay',
            '.vhs-overlay'
        ];

        duplicateSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 1) {
                for (let i = 1; i < elements.length; i++) {
                    elements[i].remove();
                }
            }
        });

        // Clean up orphaned canvases
        const canvases = document.querySelectorAll('canvas');
        const essentialCanvasIds = ['chaos-canvas', 'cyber-grid', 'static-noise', 'ambient-effects-canvas'];

        canvases.forEach(canvas => {
            if (!canvas.id || !essentialCanvasIds.includes(canvas.id)) {
                if (canvas.width === 0 || canvas.height === 0) {
                    canvas.remove();
                }
            }
        });

        this.cleanupAnimations();
    }

    setupEventListeners() {
        // Listen for performance warnings
        const onLowPerformance = () => {
            this.applyOptimization(Math.min(this.optimizationLevel + 1, 2));
        };
        window.addEventListener('lowPerformance', onLowPerformance);
        animationRuntime.trackDisposer(this.runtimeOwner, () => window.removeEventListener('lowPerformance', onLowPerformance));

        // Listen for manual optimization requests
        const onOptimizePerformance = (e) => {
            if (e.detail?.level !== undefined) {
                this.applyOptimization(e.detail.level);
            }
        };
        window.addEventListener('optimizePerformance', onOptimizePerformance);
        animationRuntime.trackDisposer(this.runtimeOwner, () => window.removeEventListener('optimizePerformance', onOptimizePerformance));
    }

    destroy() {
        animationRuntime.disposeOwner(this.runtimeOwner);
        console.log('💀 Performance Optimizer destroyed');
    }

    // Manual control functions
    emergencyStop() {
        console.log('🚨 EMERGENCY STOP - Killing all animations');
        gsap.killTweensOf('*');
        gsap.globalTimeline.clear();

        // Stop all chaos engine systems
        if (window.chaosInit) {
            window.chaosInit.stopAnimationPhases?.();
        }

        // Hide all effects
        const effectElements = document.querySelectorAll(
            '[class*="effect"], [class*="particle"], [class*="glitch"]'
        );
        effectElements.forEach(el => el.style.display = 'none');
    }

    getStatus() {
        const metrics = this.getMetrics();
        return {
            optimizationLevel: this.optimizationLevel,
            metrics: metrics,
            health: metrics.fps > 30 ? 'good' : metrics.fps > 15 ? 'fair' : 'poor'
        };
    }
}

// Create and initialize global instance
const performanceOptimizer = new PerformanceOptimizer();
performanceOptimizer.init();

// Expose to window for debugging
window.performanceOptimizer = performanceOptimizer;

// Add global control functions
window.OPTIMIZE = (level) => performanceOptimizer.applyOptimization(level);
window.EMERGENCY_STOP = () => performanceOptimizer.emergencyStop();
window.PERF_STATUS = () => console.table(performanceOptimizer.getStatus());

console.log('🎯 Performance Optimizer ready - use OPTIMIZE(0-3), EMERGENCY_STOP(), PERF_STATUS()');

export default performanceOptimizer;
