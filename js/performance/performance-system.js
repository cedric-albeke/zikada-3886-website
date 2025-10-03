/**
 * Performance System - Main Coordination Module
 * 
 * Integrates all performance optimization systems
 * - FPS Stabilizer
 * - Quality Scaler  
 * - WebGL Optimizer
 * - Animation Batcher
 * - DOM Scheduler
 * - GPU Compute
 */

import { fpsStabilizer } from './fps-stabilizer.js';
import { qualityScaler } from './quality-scaler.js';
import { webglOptimizer } from './webgl-optimizer.js';
import { animationBatcher } from './animation-batcher.js';
import { domScheduler } from './dom-scheduler.js';
import { gpuCompute } from './gpu-compute.js';

export class PerformanceSystem {
    constructor() {
        this.systems = {
            fpsStabilizer,
            qualityScaler,
            webglOptimizer,
            animationBatcher,
            domScheduler,
            gpuCompute
        };
        
        this.initialized = false;
        this.enabled = true;
        this.panicMode = false;
        
        // Feature flags
        this.features = {
            fpsStabilizer: true,
            qualityScaler: true,
            webglOptimizer: true,
            animationBatcher: true,
            domScheduler: true,
            gpuCompute: true
        };
        
        // Integrated metrics
        this.metrics = {
            totalOptimizations: 0,
            panicActivations: 0,
            frameTime: 16.67,
            quality: 0.8
        };
        
        this.initializeFeatureFlags();
        this.connectSystems();
        
        console.log('✅ Performance System initialized');
    }
    
    /**
     * Initialize feature flag configuration
     */
    initializeFeatureFlags() {
        // Global configuration
        window.ZIKADA_PERF_CONFIG = {
            features: {
                fpsStabilizer: true,
                qualityScaler: true,
                webglOptimizer: true,
                animationBatcher: true,
                domScheduler: true,
                gpuCompute: true
            },
            safety: {
                panicMode: false,
                maxFrameTime: 33.33, // 30 FPS
                memoryLimit: 500, // MB
                fallbackQuality: 'medium'
            },
            debug: {
                showMetrics: false,
                logTelemetry: false,
                enableProfiler: false,
                frameAnalysis: false
            }
        };
        
        // URL parameter overrides
        const urlParams = new URLSearchParams(window.location.search);
        
        // Feature flags: ?perfFlags=stabilizer,scaler,webgl
        if (urlParams.has('perfFlags')) {
            const flags = urlParams.get('perfFlags').split(',');
            Object.keys(this.features).forEach(feature => {
                this.features[feature] = flags.includes(feature.replace(/([A-Z])/g, (match, letter) => 
                    letter.toLowerCase()));
            });
        }
        
        // Debug mode: ?debug=perf
        if (urlParams.has('debug')) {
            const debugFlags = urlParams.get('debug').split(',');
            if (debugFlags.includes('perf')) {
                window.ZIKADA_PERF_CONFIG.debug.showMetrics = true;
                window.ZIKADA_PERF_CONFIG.debug.enableProfiler = true;
            }
        }
        
        // Quality override: ?quality=low
        if (urlParams.has('quality')) {
            qualityScaler.setQualityLevel(urlParams.get('quality'), true);
        }
        
        // Panic mode: ?panic=1
        if (urlParams.has('panic')) {
            this.activatePanicMode();
        }
    }
    
    /**
     * Connect all systems together
     */
    connectSystems() {
        // Connect FPS Stabilizer to Quality Scaler
        fpsStabilizer.setQualityScaler(qualityScaler);
        
        // Set panic mode manager
        fpsStabilizer.setPanicModeManager(this);
        
        console.log('🔗 Performance systems connected');
    }
    
    /**
     * Initialize with Three.js components
     * @param {THREE.WebGLRenderer} renderer - WebGL renderer
     * @param {THREE.Scene} scene - Scene
     * @param {THREE.Camera} camera - Camera
     */
    initialize(renderer, scene, camera) {
        if (this.initialized) return;
        
        try {
            // Initialize WebGL optimizer
            webglOptimizer.initialize(renderer, scene, camera);
            
            // Initialize GPU compute
            if (renderer && renderer.getContext) {
                gpuCompute.initialize(renderer.getContext());
            }
            
            this.initialized = true;
            console.log('🚀 Performance System fully initialized with Three.js');
            
        } catch (error) {
            console.error('Performance System initialization error:', error);
            // Continue with reduced functionality
            this.initialized = true;
        }
    }
    
    /**
     * Main performance update loop - call this every frame
     * @param {THREE.Scene} scene - Scene to render
     * @param {THREE.Camera} camera - Camera
     * @param {THREE.WebGLRenderer} renderer - Renderer
     */
    update(scene, camera, renderer) {
        if (!this.enabled || this.panicMode) {
            // Fallback rendering
            if (renderer) {
                renderer.render(scene, camera);
            }
            return;
        }
        
        const frameStart = performance.now();
        
        try {
            // 1. FPS analysis and quality adjustment
            const fpsAnalysis = fpsStabilizer.analyzeFrame(frameStart);
            
            // 2. Quality adjustment based on performance
            const qualityResult = qualityScaler.adjustQuality(
                60, // Target FPS
                fpsAnalysis.fps,
                { frameTime: fpsAnalysis.frameTime }
            );
            
            // 3. Update quality for all systems
            const currentQuality = qualityScaler.getCurrentSettings();
            
            // 4. Optimized rendering
            if (webglOptimizer.enabled) {
                webglOptimizer.render(scene, camera, currentQuality);
            } else if (renderer) {
                renderer.render(scene, camera);
            }
            
            // 5. Record frame timing
            const frameTime = performance.now() - frameStart;
            fpsStabilizer.recordFrameTiming(frameTime);
            
            // 6. Update metrics
            this.updateMetrics(fpsAnalysis, qualityResult, frameTime);
            
        } catch (error) {
            console.error('Performance System update error:', error);
            
            // Emergency fallback
            if (renderer) {
                renderer.render(scene, camera);
            }
        }
    }
    
    /**
     * Update integrated metrics
     */
    updateMetrics(fpsAnalysis, qualityResult, frameTime) {
        this.metrics.frameTime = frameTime;
        this.metrics.quality = qualityResult.quality;
        
        if (qualityResult.adjusted) {
            this.metrics.totalOptimizations++;
        }
    }
    
    /**
     * Activate panic mode - emergency fallback
     */
    activatePanicMode(reason = 'unknown') {
        this.panicMode = true;
        this.metrics.panicActivations++;
        
        console.warn(`🚨 PANIC MODE ACTIVATED: ${reason}`);
        
        // Disable all advanced optimizations
        Object.values(this.systems).forEach(system => {
            if (system.setEnabled) {
                system.setEnabled(false);
            }
        });
        
        // Set emergency quality
        qualityScaler.emergencyReduction();
        
        // Log panic event
        this.logPanicEvent(reason);
    }
    
    /**
     * Deactivate panic mode when performance recovers
     */
    deactivatePanicMode() {
        if (!this.panicMode) return;
        
        this.panicMode = false;
        console.log('✅ Panic mode deactivated - Performance recovered');
        
        // Re-enable systems
        Object.entries(this.systems).forEach(([name, system]) => {
            if (this.features[name] && system.setEnabled) {
                system.setEnabled(true);
            }
        });
    }
    
    /**
     * Log panic event for debugging
     */
    logPanicEvent(reason) {
        const panicData = {
            timestamp: performance.now(),
            reason,
            metrics: this.getMetrics(),
            userAgent: navigator.userAgent
        };
        
        console.error(`[PANIC-EVENT] ${JSON.stringify(panicData)}`);
    }
    
    /**
     * Get comprehensive metrics from all systems
     */
    getMetrics() {
        const allMetrics = {
            system: { ...this.metrics },
            fpsStabilizer: fpsStabilizer.getMetrics(),
            qualityScaler: qualityScaler.getMetrics(),
            webglOptimizer: webglOptimizer.getMetrics(),
            animationBatcher: animationBatcher.getMetrics(),
            domScheduler: domScheduler.getMetrics(),
            gpuCompute: gpuCompute.getMetrics()
        };
        
        return allMetrics;
    }
    
    /**
     * Enable/disable entire performance system
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        
        Object.entries(this.systems).forEach(([name, system]) => {
            if (this.features[name] && system.setEnabled) {
                system.setEnabled(enabled);
            }
        });
        
        console.log(`Performance System ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Enable/disable specific feature
     */
    setFeatureEnabled(featureName, enabled) {
        if (this.features.hasOwnProperty(featureName)) {
            this.features[featureName] = enabled;
            
            const system = this.systems[featureName];
            if (system && system.setEnabled) {
                system.setEnabled(enabled);
            }
            
            console.log(`Feature ${featureName} ${enabled ? 'enabled' : 'disabled'}`);
        }
    }
    
    /**
     * Destroy all systems and cleanup
     */
    destroy() {
        this.enabled = false;
        
        Object.values(this.systems).forEach(system => {
            if (system.destroy) {
                system.destroy();
            }
        });
        
        console.log('🧹 Performance System destroyed');
    }
}

// Create and export singleton
export const performanceSystem = new PerformanceSystem();

// Make available globally for debugging
if (typeof window !== 'undefined') {
    window.ZIKADA_PERFORMANCE_SYSTEM = performanceSystem;
    
    // Global helper functions
    window.PERF_STATS = () => performanceSystem.getMetrics();
    window.PERF_PANIC = () => performanceSystem.activatePanicMode('manual-trigger');
    window.PERF_RECOVER = () => performanceSystem.deactivatePanicMode();
}