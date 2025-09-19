// Performance Optimizer Module
// Comprehensive optimization for ZIKADA 3886 website

import gsap from 'gsap';

class PerformanceOptimizer {
    constructor() {
        this.maxActiveAnimations = 30; // Reduced from 50 for better performance
        this.maxTotalAnimations = 75; // Reduced from 100
        this.maxDOMNodes = 500;
        this.minFPS = 45; // Increased from 30 for smoother experience
        this.cleanupInterval = null;
        this.optimizationLevel = 0; // 0: none, 1: light, 2: medium, 3: heavy
        this.fpsHistory = [];
        this.fpsHistorySize = 10;

        console.log('🚀 Performance Optimizer initialized');
    }

    init() {
        this.startMonitoring();
        this.setupEventListeners();
        this.performInitialCleanup();
    }

    startMonitoring() {
        // Monitor every 2 seconds
        this.cleanupInterval = setInterval(() => {
            this.checkAndOptimize();
        }, 2000);
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

        // Determine optimization level needed
        let newOptLevel = 0;

        // More aggressive thresholds
        if (metrics.totalAnimations > 150 || metrics.activeAnimations > 75) {
            newOptLevel = 3; // Heavy optimization needed
        } else if (metrics.totalAnimations > 100 || metrics.activeAnimations > 50) {
            newOptLevel = 2; // Medium optimization
        } else if (metrics.totalAnimations > 75 || metrics.activeAnimations > 30) {
            newOptLevel = 1; // Light optimization
        }

        // FPS-based optimization with average
        if (avgFPS < 30) {
            newOptLevel = 3; // Critical - heavy optimization
        } else if (avgFPS < 45) {
            newOptLevel = Math.max(newOptLevel, 2); // At least medium
        } else if (avgFPS < 55) {
            newOptLevel = Math.max(newOptLevel, 1); // At least light
        }

        if (newOptLevel !== this.optimizationLevel) {
            this.applyOptimization(newOptLevel);
        }

        // Always clean up excess animations
        if (metrics.totalAnimations > this.maxTotalAnimations) {
            this.cleanupAnimations();
        }
    }

    getMetrics() {
        const timeline = gsap.globalTimeline;
        const children = timeline.getChildren();
        let activeCount = 0;

        children.forEach(tween => {
            if (tween.isActive()) activeCount++;
        });

        return {
            totalAnimations: children.length,
            activeAnimations: activeCount,
            domNodes: document.querySelectorAll('*').length,
            fps: window.safePerformanceMonitor?.metrics?.fps || 60,
            memory: {
                used: performance.memory ?
                    Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : 0
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
        // Reduce particle effects
        if (window.chaosEngine?.particles) {
            gsap.set(window.chaosEngine.particles.material, {
                opacity: 0.5,
                size: 0.3
            });
        }

        // Slow down some animations
        gsap.globalTimeline.getChildren().forEach(tween => {
            if (tween._repeat === -1 && tween.duration() < 2) {
                tween.timeScale(0.8);
            }
        });

        // Reduce scanline opacity
        const scanlines = document.querySelector('.scanlines');
        if (scanlines) {
            gsap.set(scanlines, { opacity: 0.0005 });
        }
    }

    applyMediumOptimization() {
        this.applyLightOptimization();

        // Pause non-essential animations
        const nonEssentialSelectors = [
            '.holographic-shimmer',
            '.chromatic-pulse',
            '.energy-field',
            '.quantum-particles'
        ];

        nonEssentialSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                gsap.killTweensOf(el);
                gsap.set(el, { opacity: 0 });
            });
        });

        // Reduce animation complexity
        gsap.globalTimeline.getChildren().forEach(tween => {
            if (tween._repeat === -1) {
                tween.timeScale(0.5);
            }
        });

        // Disable heavy effects
        const staticNoise = document.getElementById('static-noise');
        if (staticNoise) {
            staticNoise.style.display = 'none';
        }
    }

    applyHeavyOptimization() {
        this.applyMediumOptimization();

        console.log('🚨 Heavy optimization - killing most animations');

        // Kill all but essential animations
        const essentialElements = [
            '.logo-text',
            '.image-wrapper',
            '.text-3886',
            '.bg'
        ];

        gsap.globalTimeline.getChildren().forEach(tween => {
            // Safe target extraction
            let targets = [];
            if (typeof tween.targets === 'function') {
                targets = tween.targets();
            } else if (tween.target) {
                targets = [tween.target];
            } else if (tween._targets) {
                targets = tween._targets;
            }

            let isEssential = false;

            if (targets && targets.length > 0) {
                targets.forEach(target => {
                    essentialElements.forEach(selector => {
                        const element = document.querySelector(selector);
                        if (element && target === element) {
                            isEssential = true;
                        }
                    });
                });
            }

            if (!isEssential && !tween.data?.includes('essential')) {
                tween.kill();
            }
        });

        // Stop phase animations
        if (window.chaosInit) {
            window.chaosInit.phaseRunning = false;
        }

        // Hide all particle effects
        const particleContainers = document.querySelectorAll(
            '.data-streams, .glitch-lines, .digital-artifacts'
        );
        particleContainers.forEach(el => el.remove());
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

        // Restore animation speeds
        gsap.globalTimeline.getChildren().forEach(tween => {
            tween.timeScale(1);
        });

        // Restore static noise
        const staticNoise = document.getElementById('static-noise');
        if (staticNoise) {
            staticNoise.style.display = 'block';
        }

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
        const essentialCanvasIds = ['chaos-canvas', 'cyber-grid', 'static-noise'];

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
        window.addEventListener('lowPerformance', () => {
            this.applyOptimization(Math.min(this.optimizationLevel + 1, 3));
        });

        // Listen for manual optimization requests
        window.addEventListener('optimizePerformance', (e) => {
            if (e.detail?.level !== undefined) {
                this.applyOptimization(e.detail.level);
            }
        });
    }

    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        console.log('💀 Performance Optimizer destroyed');
    }

    // Manual control functions
    emergencyStop() {
        console.log('🚨 EMERGENCY STOP - Killing all animations');
        gsap.killTweensOf('*');
        gsap.globalTimeline.clear();

        // Stop all chaos engine systems
        if (window.chaosInit) {
            window.chaosInit.phaseRunning = false;
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