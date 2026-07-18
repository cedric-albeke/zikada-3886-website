// Longevity Monitor - Ensures stable, smooth, diverse operation for hours
// Monitors animation system health, prevents degradation, and maintains variety

import animationRuntime from './runtime/animation-runtime.js';
import performanceBus from './performance-bus.js';

class LongevityMonitor {
    constructor() {
        this.runtimeOwner = 'longevity-monitor';
        animationRuntime.disposeOwner(this.runtimeOwner);
        this.startTime = Date.now();
        this.runtime = 0;
        this.healthScore = 100;
        this.performanceHistory = [];
        this.animationVariety = new Map();
        this.lastCleanup = Date.now();
        this.cleanupInterval = 30000; // 30 seconds
        this.healthCheckInterval = 10000; // 10 seconds
        this.varietyCheckInterval = 60000; // 1 minute
        this.lastFpsDegradationAction = 0;
        this.fpsDegradationCooldownMs = 60000;
        this.lastCorrectiveAction = 0;
        this.correctiveActionCooldownMs = 60000;
        
        this.thresholds = {
            fps: { target: 60, warning: 45, critical: 30 },
            memory: { warning: 800, critical: 1000 }, // MB - Significantly increased for animations
            domNodes: { warning: 10000, critical: 15000 }, // Increased for animations
            animations: { warning: 100, critical: 200 }, // Increased for visual effects
            healthScore: { warning: 70, critical: 50 }
        };
        
        this.diversityStrategies = {
            rotation: {
                enabled: true,
                interval: 300000, // 5 minutes
                lastRotation: 0,
                currentSet: 0,
                sets: [
                    ['logo-pulse', 'matrix-flash', 'bg-warp'],
                    ['logo-spin', 'matrix-rain', 'bg-shake'],
                    ['logo-glow', 'matrix-glitch', 'bg-zoom'],
                    ['text-scramble', 'text-wave', 'full-chaos']
                ]
            },
            intensity: {
                enabled: true,
                levels: ['low', 'medium', 'high'],
                currentLevel: 'medium',
                lastChange: 0,
                changeInterval: 180000 // 3 minutes
            },
            effects: {
                enabled: true,
                cooldown: 5000, // 5 seconds between effects
                lastTrigger: 0,
                maxConcurrent: 3
            }
        };
        
        this.init();
    }
    
    init() {
        this.setupMonitoring();
        this.setupDiversitySystem();
        this.setupHealthChecks();
        this.setupPerformanceTracking();
        
        console.log('🕐 Longevity Monitor initialized');
    }
    
    setupMonitoring() {
        // Monitor system health every 10 seconds
        animationRuntime.scheduleInterval(this.runtimeOwner, () => {
            this.performHealthCheck();
        }, this.healthCheckInterval);
        
        // Check animation variety every minute
        animationRuntime.scheduleInterval(this.runtimeOwner, () => {
            this.checkAnimationVariety();
        }, this.varietyCheckInterval);
        
        // Cleanup stale data every 30 seconds
        animationRuntime.scheduleInterval(this.runtimeOwner, () => {
            this.performMaintenance();
        }, this.cleanupInterval);
    }
    
    setupDiversitySystem() {
        // Rotate animation sets every 5 minutes
        animationRuntime.scheduleInterval(this.runtimeOwner, () => {
            this.rotateAnimationSets();
        }, this.diversityStrategies.rotation.interval);
        
        // Change intensity level every 3 minutes
        animationRuntime.scheduleInterval(this.runtimeOwner, () => {
            this.adjustIntensityLevel();
        }, this.diversityStrategies.intensity.changeInterval);
        
        // Trigger random effects for variety
        animationRuntime.scheduleInterval(this.runtimeOwner, () => {
            this.triggerVarietyEffect();
        }, 30000); // Every 30 seconds
    }
    
    setupHealthChecks() {
        // Monitor FPS stability
        this.fpsMonitor = {
            samples: [],
            maxSamples: 60, // 1 minute of samples
            lastCheck: 0
        };
        
        // Monitor memory usage
        this.memoryMonitor = {
            samples: [],
            maxSamples: 30, // 5 minutes of samples
            lastCheck: 0
        };
        
        // Monitor DOM health
        this.domMonitor = {
            samples: [],
            maxSamples: 30,
            lastCheck: 0
        };
    }
    
    setupPerformanceTracking() {
        // Track performance metrics over time
        this.performanceTracker = {
            fps: [],
            memory: [],
            domNodes: [],
            animations: [],
            healthScore: [],
            maxSamples: 3600 // 1 hour of data
        };
        
        const updateFromBus = () => {
            this.runtime = Date.now() - this.startTime;
            this.updatePerformanceHistory();
        };
        const unsubscribe = performanceBus.subscribe(updateFromBus);
        animationRuntime.trackDisposer(this.runtimeOwner, unsubscribe);
        updateFromBus();
    }
    
    performHealthCheck() {
        const now = Date.now();
        const metrics = this.gatherCurrentMetrics();
        
        // Update health score
        this.updateHealthScore(metrics);
        
        // Check for performance degradation
        this.checkPerformanceDegradation(metrics);
        
        // Trigger corrective actions if needed
        this.triggerCorrectiveActions(metrics);
        
        // Log health status
        this.logHealthStatus(metrics);
    }
    
    gatherCurrentMetrics() {
        const metrics = {
            fps: this.getCurrentFPS(),
            memory: this.getCurrentMemoryUsage(),
            domNodes: this.getCurrentDOMNodes(),
            animations: this.getCurrentAnimationCount(),
            timestamp: Date.now()
        };
        
        return metrics;
    }
    
    getCurrentFPS() {
        if (performanceBus.metrics?.fps) {
            return performanceBus.metrics.fps;
        }
        if (window.performanceOptimizerV2) {
            return window.performanceOptimizerV2.getPerformanceMetrics().fps || 60;
        }
        return 60; // Fallback
    }
    
    getCurrentMemoryUsage() {
        return Math.round(Number(performanceBus.metrics.memoryMB) || 0);
    }
    
    getCurrentDOMNodes() {
        return Number(performanceBus.metrics.domNodes) || 0;
    }
    
    getCurrentAnimationCount() {
        return Number(performanceBus.metrics.activeAnimations) || 0;
    }
    
    updateHealthScore(metrics) {
        let score = 100;
        
        // FPS impact (40% weight): 60 target, 45 action, 30 floor.
        if (metrics.fps < this.thresholds.fps.critical) {
            score -= 40;
        } else if (metrics.fps < this.thresholds.fps.warning) {
            score -= 15;
        }
        
        // Memory impact (25% weight)
        if (metrics.memory > this.thresholds.memory.critical) {
            score -= 25;
        } else if (metrics.memory > this.thresholds.memory.warning) {
            score -= 12;
        }
        
        // DOM nodes impact (20% weight)
        if (metrics.domNodes > this.thresholds.domNodes.critical) {
            score -= 20;
        } else if (metrics.domNodes > this.thresholds.domNodes.warning) {
            score -= 10;
        }
        
        // Animation count impact (15% weight)
        if (metrics.animations > this.thresholds.animations.critical) {
            score -= 15;
        } else if (metrics.animations > this.thresholds.animations.warning) {
            score -= 7;
        }
        
        this.healthScore = Math.max(0, Math.min(100, score));
    }
    
    checkPerformanceDegradation(metrics) {
        // Check for FPS degradation trend
        this.fpsMonitor.samples.push(metrics.fps);
        if (this.fpsMonitor.samples.length > this.fpsMonitor.maxSamples) {
            this.fpsMonitor.samples.shift();
        }
        
        if (this.fpsMonitor.samples.length >= 10) {
            const avgFPS = this.fpsMonitor.samples.reduce((a, b) => a + b, 0) / this.fpsMonitor.samples.length;
            if (avgFPS < this.thresholds.fps.warning) {
                this.handleFPSDegradation(avgFPS);
            }
        }
        
        // Check for memory growth trend
        this.memoryMonitor.samples.push(metrics.memory);
        if (this.memoryMonitor.samples.length > this.memoryMonitor.maxSamples) {
            this.memoryMonitor.samples.shift();
        }
        
        if (this.memoryMonitor.samples.length >= 5) {
            const recent = this.memoryMonitor.samples.slice(-5);
            const older = this.memoryMonitor.samples.slice(-10, -5);
            if (recent.length === 5 && older.length === 5) {
                const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
                const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
                // Only warn if significant growth OR absolute high memory
                // 100MB growth OR total over 400MB is concerning
                if ((recentAvg > olderAvg + 100 || recentAvg > 400)) {
                    this.handleMemoryGrowth(recentAvg, olderAvg);
                }
            }
        }
    }
    
    handleFPSDegradation(avgFPS) {
        const now = Date.now();
        if (now - this.lastFpsDegradationAction < this.fpsDegradationCooldownMs) {
            return;
        }
        this.lastFpsDegradationAction = now;
        console.warn(`⚠️ FPS degradation detected: ${avgFPS.toFixed(1)} FPS`);

        // Delegate FPS-only degradation to the soft optimizer. Do not permanently
        // reduce visual density from FPS alone, especially under software WebGL.
        if (window.performanceOptimizerV2) {
            window.performanceOptimizerV2.triggerLowFPSOptimizations();
        }
    }
    
    handleMemoryGrowth(recentAvg, olderAvg) {
        console.warn(`⚠️ Memory growth detected: ${olderAvg.toFixed(1)}MB → ${recentAvg.toFixed(1)}MB`);
        window.performanceProfileManager?.applyProfile?.('low', {
            reason: 'longevity-memory-growth',
            memoryMB: recentAvg
        });
    }
    
    reduceAnimationQuality() {
        window.performanceProfileManager?.applyProfile?.('low', {
            reason: 'longevity-quality-pressure'
        });
    }
    
    cleanupExcessAnimations() {
        // Clean up GSAP animations
        if (window.gsap && window.gsap.globalTimeline) {
            const timeline = window.gsap.globalTimeline;
            const children = timeline.getChildren();
            
            children
                .filter(animation => !animation.isActive?.() && animation.progress?.() >= 1)
                .forEach(animation => {
                    try { animation.kill(); } catch (_) {}
                });
        }
        
        // Clean up anime.js animations
        if (window.animeManager && window.animeManager.instances) {
            const instances = window.animeManager.instances;
            for (const instance of instances) {
                if (instance?.completed === true) instances.delete(instance);
            }
        }
    }
    
    cleanupOldElements() {
        // Only explicit completion markers authorize removal. DOM age and a
        // class-name prefix do not describe an effect's authored lifetime.
        const tempElements = document.querySelectorAll(
            '[data-temp][data-lifecycle-state="complete"], [data-temp][data-effect-complete="true"]'
        );
        tempElements.forEach(el => {
            try { el.remove(); } catch (_) {}
        });
    }
    
    triggerCorrectiveActions(metrics) {
        const hasStructuralIssue =
            metrics.memory > this.thresholds.memory.warning ||
            metrics.domNodes > this.thresholds.domNodes.warning ||
            metrics.animations > this.thresholds.animations.critical;

        if (!hasStructuralIssue && metrics.fps < this.thresholds.fps.warning) {
            this.restoreVisualIntensity();
            this.handleFPSDegradation(metrics.fps);
            return;
        }

        const now = Date.now();
        if (now - this.lastCorrectiveAction < this.correctiveActionCooldownMs) {
            return;
        }

        if (this.healthScore < this.thresholds.healthScore.critical) {
            this.triggerEmergencyActions();
        } else if (this.healthScore < this.thresholds.healthScore.warning) {
            this.triggerWarningActions();
        } else {
            return;
        }

        this.lastCorrectiveAction = now;
    }
    
    triggerEmergencyActions() {
        console.error('🚨 Emergency actions triggered - Health score critical');
        window.performanceProfileManager?.applyProfile?.('low', {
            reason: 'longevity-critical-health',
            score: this.healthScore
        });
        window.dispatchEvent(new CustomEvent('3886:health-alert', {
            detail: { level: 'critical', score: this.healthScore }
        }));
    }
    
    triggerWarningActions() {
        console.warn('⚠️ Warning actions triggered - Health score low');
        window.performanceProfileManager?.applyProfile?.('medium', {
            reason: 'longevity-warning-health',
            score: this.healthScore
        });
    }
    
    pauseNonEssentialAnimations() {
        // Pause background animations
        const bgAnims = document.querySelectorAll('[data-bg-animation]');
        bgAnims.forEach(el => {
            el.style.animationPlayState = 'paused';
        });
        
        // Pause particle systems
        const particles = document.querySelectorAll('.particle-system');
        particles.forEach(el => {
            el.style.animationPlayState = 'paused';
        });
    }
    
    aggressiveCleanup() {
        // Emergency-only compatibility hook. Even here, connected visuals
        // need an explicit completion marker before DOM removal.
        const tempElements = document.querySelectorAll(
            '[data-temp][data-lifecycle-state="complete"], [data-temp][data-effect-complete="true"]'
        );
        tempElements.forEach(el => {
            try {
                el.remove();
            } catch (e) {
                // Ignore removal errors
            }
        });
        
        // Clear all caches
        if (window.performanceOptimizerV2) {
            window.performanceOptimizerV2.emergencyCleanup();
        }
    }
    
    enableMinimalMode() {
        // Disable heavy effects
        document.documentElement.style.setProperty('--effects-enabled', 'false');
        document.documentElement.style.setProperty('--particles-enabled', 'false');
        
        // Keep only essential animations
        const essentialAnims = document.querySelectorAll('[data-essential]');
        essentialAnims.forEach(el => {
            el.style.animationPlayState = 'running';
        });
    }
    
    moderateCleanup() {
        // Remove old elements
        this.cleanupOldElements();
        
        // Reduce particle count
        this.reduceAnimationQuality();
    }
    
    reduceAnimationIntensity() {
        // Reduce animation speed
        document.documentElement.style.setProperty('--animation-speed', '0.7');
        
        // Reduce particle density
        document.documentElement.style.setProperty('--particle-density', '0.5');
    }

    restoreVisualIntensity() {
        document.documentElement.style.removeProperty('--animation-speed');
        document.documentElement.style.removeProperty('--particle-density');
        document.documentElement.style.removeProperty('--effects-enabled');
        document.documentElement.style.removeProperty('--particles-enabled');
    }
    
    checkAnimationVariety() {
        // Track which animations have been used recently
        const recentAnimations = this.getRecentAnimations();
        
        // Check if we need more variety
        if (recentAnimations.size < 5) {
            this.triggerVarietyEffect();
        }
        
        // Update variety tracking
        this.updateVarietyTracking(recentAnimations);
    }
    
    getRecentAnimations() {
        const recent = new Set();
        const now = Date.now();
        const recentWindow = 300000; // 5 minutes
        
        // Check animation manager
        if (window.animationManager && window.animationManager.activeAnimations) {
            for (const [id, anim] of window.animationManager.activeAnimations) {
                if (now - anim.startTime < recentWindow) {
                    recent.add(id);
                }
            }
        }
        
        return recent;
    }
    
    updateVarietyTracking(recentAnimations) {
        recentAnimations.forEach(animId => {
            if (!this.animationVariety.has(animId)) {
                this.animationVariety.set(animId, { count: 0, lastUsed: 0 });
            }
            
            const data = this.animationVariety.get(animId);
            data.count++;
            data.lastUsed = Date.now();
        });
    }
    
    rotateAnimationSets() {
        if (!this.diversityStrategies.rotation.enabled) return;
        
        const now = Date.now();
        if (now - this.diversityStrategies.rotation.lastRotation < this.diversityStrategies.rotation.interval) {
            return;
        }
        
        this.diversityStrategies.rotation.currentSet = 
            (this.diversityStrategies.rotation.currentSet + 1) % this.diversityStrategies.rotation.sets.length;
        
        this.diversityStrategies.rotation.lastRotation = now;
        
        console.log(`🔄 Rotated to animation set ${this.diversityStrategies.rotation.currentSet + 1}`);
    }
    
    adjustIntensityLevel() {
        if (!this.diversityStrategies.intensity.enabled) return;
        
        const now = Date.now();
        if (now - this.diversityStrategies.intensity.lastChange < this.diversityStrategies.intensity.changeInterval) {
            return;
        }
        
        const levels = this.diversityStrategies.intensity.levels;
        const currentIndex = levels.indexOf(this.diversityStrategies.intensity.currentLevel);
        const nextIndex = (currentIndex + 1) % levels.length;
        
        this.diversityStrategies.intensity.currentLevel = levels[nextIndex];
        this.diversityStrategies.intensity.lastChange = now;
        
        this.applyIntensityLevel(this.diversityStrategies.intensity.currentLevel);
        
        console.log(`🎚️ Adjusted intensity to: ${this.diversityStrategies.intensity.currentLevel}`);
    }
    
    applyIntensityLevel(level) {
        switch (level) {
            case 'low':
                document.documentElement.style.setProperty('--animation-intensity', '0.5');
                document.documentElement.style.setProperty('--particle-intensity', '0.3');
                break;
            case 'medium':
                document.documentElement.style.setProperty('--animation-intensity', '1.0');
                document.documentElement.style.setProperty('--particle-intensity', '0.7');
                break;
            case 'high':
                document.documentElement.style.setProperty('--animation-intensity', '1.5');
                document.documentElement.style.setProperty('--particle-intensity', '1.0');
                break;
        }
    }
    
    triggerVarietyEffect() {
        if (!this.diversityStrategies.effects.enabled) return;
        
        const now = Date.now();
        if (now - this.diversityStrategies.effects.lastTrigger < this.diversityStrategies.effects.cooldown) {
            return;
        }
        
        // Get current animation set
        const currentSet = this.diversityStrategies.rotation.sets[this.diversityStrategies.rotation.currentSet];
        const availableEffects = currentSet.filter(effect => 
            !this.isEffectCurrentlyActive(effect)
        );
        
        if (availableEffects.length > 0) {
            const randomEffect = availableEffects[Math.floor(Math.random() * availableEffects.length)];
            this.triggerEffect(randomEffect);
            this.diversityStrategies.effects.lastTrigger = now;
        }
    }
    
    isEffectCurrentlyActive(effectId) {
        if (window.animationManager && window.animationManager.activeAnimations) {
            for (const [id, anim] of window.animationManager.activeAnimations) {
                if (id.includes(effectId)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    triggerEffect(effectId) {
        if (window.animationManager) {
            window.animationManager.trigger(effectId);
        } else if (window.vjMessaging) {
            window.vjMessaging.send('anime_trigger', { animationId: effectId });
        }
    }
    
    performMaintenance() {
        const now = Date.now();
        
        // Clean up old variety tracking data
        for (const [animId, data] of this.animationVariety.entries()) {
            if (now - data.lastUsed > 600000) { // 10 minutes
                this.animationVariety.delete(animId);
            }
        }
        
        // Clean up performance history
        if (this.performanceTracker.fps.length > this.performanceTracker.maxSamples) {
            this.performanceTracker.fps.shift();
        }
        if (this.performanceTracker.memory.length > this.performanceTracker.maxSamples) {
            this.performanceTracker.memory.shift();
        }
        if (this.performanceTracker.domNodes.length > this.performanceTracker.maxSamples) {
            this.performanceTracker.domNodes.shift();
        }
        if (this.performanceTracker.animations.length > this.performanceTracker.maxSamples) {
            this.performanceTracker.animations.shift();
        }
        if (this.performanceTracker.healthScore.length > this.performanceTracker.maxSamples) {
            this.performanceTracker.healthScore.shift();
        }
    }
    
    updatePerformanceHistory() {
        const metrics = this.gatherCurrentMetrics();
        
        this.performanceTracker.fps.push(metrics.fps);
        this.performanceTracker.memory.push(metrics.memory);
        this.performanceTracker.domNodes.push(metrics.domNodes);
        this.performanceTracker.animations.push(metrics.animations);
        this.performanceTracker.healthScore.push(this.healthScore);
    }
    
    logHealthStatus(metrics) {
        const runtimeMinutes = Math.round(this.runtime / 60000);
        
        if (this.healthScore < this.thresholds.healthScore.critical) {
            console.error(`🚨 Health Critical - Runtime: ${runtimeMinutes}m, Score: ${this.healthScore}, FPS: ${metrics.fps}, Memory: ${metrics.memory}MB`);
        } else if (this.healthScore < this.thresholds.healthScore.warning) {
            console.warn(`⚠️ Health Warning - Runtime: ${runtimeMinutes}m, Score: ${this.healthScore}, FPS: ${metrics.fps}, Memory: ${metrics.memory}MB`);
        } else if (runtimeMinutes % 10 === 0) { // Log every 10 minutes
            console.log(`✅ Health Good - Runtime: ${runtimeMinutes}m, Score: ${this.healthScore}, FPS: ${metrics.fps}, Memory: ${metrics.memory}MB`);
        }
    }
    
    getLongevityReport() {
        const runtimeMinutes = Math.round(this.runtime / 60000);
        const avgFPS = this.performanceTracker.fps.length > 0 ? 
            this.performanceTracker.fps.reduce((a, b) => a + b, 0) / this.performanceTracker.fps.length : 0;
        const avgMemory = this.performanceTracker.memory.length > 0 ? 
            this.performanceTracker.memory.reduce((a, b) => a + b, 0) / this.performanceTracker.memory.length : 0;
        
        return {
            runtime: {
                total: this.runtime,
                minutes: runtimeMinutes,
                hours: Math.round(runtimeMinutes / 60 * 10) / 10
            },
            health: {
                score: this.healthScore,
                status: this.healthScore >= this.thresholds.healthScore.warning ? 'good' : 
                       this.healthScore >= this.thresholds.healthScore.critical ? 'warning' : 'critical'
            },
            performance: {
                avgFPS: Math.round(avgFPS),
                avgMemory: Math.round(avgMemory),
                currentFPS: this.getCurrentFPS(),
                currentMemory: this.getCurrentMemoryUsage()
            },
            variety: {
                uniqueAnimations: this.animationVariety.size,
                currentSet: this.diversityStrategies.rotation.currentSet + 1,
                intensityLevel: this.diversityStrategies.intensity.currentLevel
            },
            thresholds: this.thresholds
        };
    }
    
    destroy() {
        animationRuntime.disposeOwner(this.runtimeOwner);
        console.log('🧹 Longevity Monitor destroyed');
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.longevityMonitor = new LongevityMonitor();
}

export default LongevityMonitor;
