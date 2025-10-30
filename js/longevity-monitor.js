// Longevity Monitor - Ensures stable, smooth, diverse operation for hours
// Monitors animation system health, prevents degradation, and maintains variety

class LongevityMonitor {
    constructor() {
        this.startTime = Date.now();
        this.runtime = 0;
        this.healthScore = 100;
        this.performanceHistory = [];
        this.animationVariety = new Map();
        this.lastCleanup = Date.now();
        this.cleanupInterval = 30000; // 30 seconds
        this.healthCheckInterval = 10000; // 10 seconds
        this.varietyCheckInterval = 60000; // 1 minute
        
        this.thresholds = {
            fps: { warning: 45, critical: 30 },
            memory: { warning: 150, critical: 200 }, // MB
            domNodes: { warning: 6000, critical: 8000 },
            animations: { warning: 40, critical: 60 },
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
        setInterval(() => {
            this.performHealthCheck();
        }, this.healthCheckInterval);
        
        // Check animation variety every minute
        setInterval(() => {
            this.checkAnimationVariety();
        }, this.varietyCheckInterval);
        
        // Cleanup stale data every 30 seconds
        setInterval(() => {
            this.performMaintenance();
        }, this.cleanupInterval);
    }
    
    setupDiversitySystem() {
        // Rotate animation sets every 5 minutes
        setInterval(() => {
            this.rotateAnimationSets();
        }, this.diversityStrategies.rotation.interval);
        
        // Change intensity level every 3 minutes
        setInterval(() => {
            this.adjustIntensityLevel();
        }, this.diversityStrategies.intensity.changeInterval);
        
        // Trigger random effects for variety
        setInterval(() => {
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
        
        // Update runtime every second
        setInterval(() => {
            this.runtime = Date.now() - this.startTime;
            this.updatePerformanceHistory();
        }, 1000);
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
        if (window.performanceOptimizerV2) {
            return window.performanceOptimizerV2.getPerformanceMetrics().fps || 60;
        }
        return 60; // Fallback
    }
    
    getCurrentMemoryUsage() {
        if (performance.memory) {
            return Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
        }
        return 0;
    }
    
    getCurrentDOMNodes() {
        return document.querySelectorAll('*').length;
    }
    
    getCurrentAnimationCount() {
        let count = 0;
        
        // Count GSAP animations
        if (window.gsap && window.gsap.globalTimeline) {
            count += window.gsap.globalTimeline.getChildren().length;
        }
        
        // Count anime.js animations
        if (window.animeManager && window.animeManager.instances) {
            count += window.animeManager.instances.size;
        }
        
        return count;
    }
    
    updateHealthScore(metrics) {
        let score = 100;
        
        // FPS impact (40% weight)
        if (metrics.fps < this.thresholds.fps.critical) {
            score -= 40;
        } else if (metrics.fps < this.thresholds.fps.warning) {
            score -= 20;
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
                if (recentAvg > olderAvg + 20) { // 20MB growth
                    this.handleMemoryGrowth(recentAvg, olderAvg);
                }
            }
        }
    }
    
    handleFPSDegradation(avgFPS) {
        console.warn(`⚠️ FPS degradation detected: ${avgFPS.toFixed(1)} FPS`);
        
        // Reduce animation quality
        this.reduceAnimationQuality();
        
        // Clean up excess animations
        this.cleanupExcessAnimations();
        
        // Trigger performance optimizations
        if (window.performanceOptimizerV2) {
            window.performanceOptimizerV2.triggerLowFPSOptimizations();
        }
    }
    
    handleMemoryGrowth(recentAvg, olderAvg) {
        console.warn(`⚠️ Memory growth detected: ${olderAvg.toFixed(1)}MB → ${recentAvg.toFixed(1)}MB`);
        
        // Trigger memory cleanup
        if (window.performanceOptimizerV2) {
            window.performanceOptimizerV2.triggerMemoryOptimizations();
        }
        
        // Clean up old elements
        this.cleanupOldElements();
    }
    
    reduceAnimationQuality() {
        // Reduce particle count
        const particles = document.querySelectorAll('.particle, .anime-particle');
        const maxParticles = Math.max(20, particles.length * 0.7);
        
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
        document.documentElement.style.setProperty('--particle-count', '0.5');
    }
    
    cleanupExcessAnimations() {
        // Clean up GSAP animations
        if (window.gsap && window.gsap.globalTimeline) {
            const timeline = window.gsap.globalTimeline;
            const children = timeline.getChildren();
            
            if (children.length > 30) {
                // Remove oldest animations
                const toRemove = children.length - 30;
                for (let i = 0; i < toRemove; i++) {
                    try {
                        children[i].kill();
                    } catch (e) {
                        // Ignore cleanup errors
                    }
                }
            }
        }
        
        // Clean up anime.js animations
        if (window.animeManager && window.animeManager.instances) {
            const instances = window.animeManager.instances;
            if (instances.size > 20) {
                const toRemove = instances.size - 20;
                let removed = 0;
                
                for (const instance of instances) {
                    if (removed >= toRemove) break;
                    try {
                        instance.pause();
                        instances.delete(instance);
                        removed++;
                    } catch (e) {
                        // Ignore cleanup errors
                    }
                }
            }
        }
    }
    
    cleanupOldElements() {
        const now = Date.now();
        const maxAge = 300000; // 5 minutes
        
        // Clean up old temporary elements (no wildcard class selectors)
        const tempElements = document.querySelectorAll(
            '[data-temp], [class^="anime-"], [class*=" anime-"], [class^="glitch-"], [class*=" glitch-"]'
        );
        tempElements.forEach(el => {
            const created = el.dataset.created || el.getAttribute('data-created');
            if (created && (now - parseInt(created)) > maxAge) {
                try {
                    el.remove();
                } catch (e) {
                    // Ignore removal errors
                }
            }
        });
    }
    
    triggerCorrectiveActions(metrics) {
        if (this.healthScore < this.thresholds.healthScore.critical) {
            this.triggerEmergencyActions();
        } else if (this.healthScore < this.thresholds.healthScore.warning) {
            this.triggerWarningActions();
        }
    }
    
    triggerEmergencyActions() {
        console.error('🚨 Emergency actions triggered - Health score critical');
        
        // Stop all non-essential animations
        this.pauseNonEssentialAnimations();
        
        // Aggressive cleanup
        this.aggressiveCleanup();
        
        // Reduce to minimal effects
        this.enableMinimalMode();
    }
    
    triggerWarningActions() {
        console.warn('⚠️ Warning actions triggered - Health score low');
        
        // Moderate cleanup
        this.moderateCleanup();
        
        // Reduce animation intensity
        this.reduceAnimationIntensity();
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
        // Remove all temporary elements (no wildcard class selectors)
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
        // Clean up intervals
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        if (this.varietyCheckInterval) {
            clearInterval(this.varietyCheckInterval);
        }
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        
        console.log('🧹 Longevity Monitor destroyed');
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.longevityMonitor = new LongevityMonitor();
}

export default LongevityMonitor;
