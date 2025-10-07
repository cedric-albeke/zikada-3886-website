/**
 * WebGL Resource Management and Renderer Hygiene
 * 
 * Advanced WebGL resource lifecycle management for stable long-term performance
 * - Precompile shaders for hot scenes to avoid frame drops
 * - Periodic renderer cleanup and render list disposal
 * - Monitor renderer.info for resource leaks and growth
 * - Clamp device pixel ratio with configurable degradation
 * - Track and manage render targets, textures, programs
 * - Implement resource recycling and pooling
 * 
 * Target: Stable program/texture counts, no VRAM creep during 24h soak
 */

import * as THREE from 'three';

export class WebGLResourceManager {
    constructor() {
        this.renderer = null;
        this.gl = null;
        
        // Resource tracking
        this.resourceCounts = {
            programs: 0,
            textures: 0,
            geometries: 0,
            renderTargets: 0,
            vertexArrayObjects: 0
        };
        
        this.resourceHistory = [];
        this.maxHistoryLength = 100; // Keep last 100 samples
        
        // Render target pool for reuse
        this.renderTargetPool = new Map();
        this.activeRenderTargets = new Set();
        
        // Shader precompilation cache
        this.precompiledShaders = new Map();
        this.shaderWarmupQueue = [];
        
        // Configuration
        this.config = {
            maxDevicePixelRatio: 1.25, // Configurable ceiling
            cleanupInterval: 30000, // 30 seconds
            resourceCheckInterval: 10000, // 10 seconds
            historyCheckInterval: 60000, // 1 minute
            resourceLeakThreshold: 10, // Alert if resources grow by >10 in period
            precompileDelay: 100 // ms delay between shader precompilations
        };
        
        // State management
        this.lastCleanupTime = 0;
        this.lastResourceCheck = 0;
        this.lastHistoryCheck = 0;
        this.devicePixelRatio = 1.0;
        this.basePixelRatio = 1.0;
        this.cleanupIntervalId = null;
        
        // Performance metrics
        this.metrics = {
            cleanupsPerformed: 0,
            renderTargetsRecycled: 0,
            shadersPrecompiled: 0,
            resourceLeaksDetected: 0,
            pixelRatioAdjustments: 0
        };
        
        this.enabled = true;
        
        console.log('🔧 WebGL Resource Manager initialized');
    }
    
    /**
     * Initialize with WebGL renderer
     */
    initialize(renderer) {
        if (!renderer) {
            console.warn('⚠️ No renderer provided to WebGL Resource Manager');
            return;
        }
        
        this.renderer = renderer;
        this.gl = renderer.getContext();
        
        // Set up base pixel ratio
        this.basePixelRatio = Math.min(
            window.devicePixelRatio || 1,
            this.config.maxDevicePixelRatio
        );
        this.devicePixelRatio = this.basePixelRatio;
        renderer.setPixelRatio(this.devicePixelRatio);
        
        // Initial resource count baseline
        this.updateResourceCounts();
        
        // Start periodic cleanup
        this.startPeriodicMaintenance();
        
        console.log(`🎮 WebGL Resource Manager initialized with pixel ratio: ${this.devicePixelRatio}`);
        console.log('📊 Initial resource counts:', this.resourceCounts);
    }
    
    /**
     * Start periodic maintenance tasks
     */
    startPeriodicMaintenance() {
        if (this.cleanupIntervalId) {
            clearInterval(this.cleanupIntervalId);
        }
        
        this.cleanupIntervalId = setInterval(() => {
            if (!this.enabled || document.hidden) return;
            
            const now = performance.now();
            
            // Periodic renderer cleanup
            if (now - this.lastCleanupTime > this.config.cleanupInterval) {
                this.performRendererCleanup();
                this.lastCleanupTime = now;
            }
            
            // Resource monitoring
            if (now - this.lastResourceCheck > this.config.resourceCheckInterval) {
                this.checkResourceCounts();
                this.lastResourceCheck = now;
            }
            
            // Historical analysis
            if (now - this.lastHistoryCheck > this.config.historyCheckInterval) {
                this.analyzeResourceHistory();
                this.lastHistoryCheck = now;
            }
            
        }, Math.min(this.config.cleanupInterval, this.config.resourceCheckInterval) / 3);
    }
    
    /**
     * Precompile shaders for hot scenes
     */
    precompileSceneShaders(scene, camera) {
        if (!this.enabled || !this.renderer || !scene || !camera) return;
        
        try {
            console.log('⚡ Precompiling shaders for scene...');
            const startTime = performance.now();
            
            // Use Three.js built-in shader compilation
            this.renderer.compile(scene, camera);
            
            const compileTime = performance.now() - startTime;
            this.metrics.shadersPrecompiled++;
            
            console.log(`✅ Shader precompilation completed in ${compileTime.toFixed(2)}ms`);
            
        } catch (error) {
            console.error('Shader precompilation failed:', error);
        }
    }
    
    /**
     * Queue scene for shader precompilation with delay
     */
    queueShaderPrecompilation(scene, camera, priority = 'normal') {
        if (!scene || !camera) return;
        
        const task = {
            scene,
            camera,
            priority,
            timestamp: performance.now()
        };
        
        // Insert based on priority
        if (priority === 'high') {
            this.shaderWarmupQueue.unshift(task);
        } else {
            this.shaderWarmupQueue.push(task);
        }
        
        // Start processing queue if not already running
        this.processShaderQueue();
    }
    
    /**
     * Process shader precompilation queue with delays
     */
    async processShaderQueue() {
        if (this.shaderWarmupQueue.length === 0 || !this.enabled) return;
        
        const task = this.shaderWarmupQueue.shift();
        
        try {
            await new Promise(resolve => setTimeout(resolve, this.config.precompileDelay));
            this.precompileSceneShaders(task.scene, task.camera);
        } catch (error) {
            console.error('Queued shader precompilation failed:', error);
        }
        
        // Continue processing queue
        if (this.shaderWarmupQueue.length > 0) {
            requestIdleCallback(() => this.processShaderQueue());
        }
    }
    
    /**
     * Perform comprehensive renderer cleanup
     */
    performRendererCleanup() {
        if (!this.renderer) return;
        
        try {
            console.log('🧹 Performing renderer cleanup...');
            
            // Dispose render lists
            if (this.renderer.renderLists && this.renderer.renderLists.dispose) {
                this.renderer.renderLists.dispose();
            }
            
            // Clean up unused render targets
            this.cleanupRenderTargetPool();
            
            // Force WebGL resource cleanup
            if (this.gl && this.gl.finish) {
                this.gl.finish();
            }
            
            // Clean up composer render targets if available
            this.cleanupComposerTargets();
            
            this.metrics.cleanupsPerformed++;
            console.log('✅ Renderer cleanup completed');
            
        } catch (error) {
            console.error('Renderer cleanup failed:', error);
        }
    }
    
    /**
     * Clean up render target pool
     */
    cleanupRenderTargetPool() {
        const now = performance.now();
        const maxAge = 60000; // 60 seconds
        
        this.renderTargetPool.forEach((targets, key) => {
            // Filter out old unused targets
            const filtered = targets.filter(target => {
                const age = now - (target.lastUsed || 0);
                if (age > maxAge && !this.activeRenderTargets.has(target)) {
                    // Dispose old target
                    if (target.dispose) target.dispose();
                    return false;
                }
                return true;
            });
            
            if (filtered.length === 0) {
                this.renderTargetPool.delete(key);
            } else {
                this.renderTargetPool.set(key, filtered);
            }
        });
    }
    
    /**
     * Clean up composer render targets
     */
    cleanupComposerTargets() {
        // Clean up EffectComposer render targets if available globally
        if (window.chaosEngine && window.chaosEngine.composer) {
            const composer = window.chaosEngine.composer;
            
            // Dispose unused passes and their render targets
            composer.passes.forEach(pass => {
                if (pass.enabled === false && pass.dispose) {
                    pass.dispose();
                }
            });
        }
    }
    
    /**
     * Get or create render target from pool
     */
    getRenderTarget(width, height, options = {}) {
        const key = `${width}x${height}_${JSON.stringify(options)}`;
        
        if (!this.renderTargetPool.has(key)) {
            this.renderTargetPool.set(key, []);
        }
        
        const pool = this.renderTargetPool.get(key);
        let target = null;
        
        // Try to reuse existing target
        for (let i = 0; i < pool.length; i++) {
            const candidate = pool[i];
            if (!this.activeRenderTargets.has(candidate)) {
                target = candidate;
                pool.splice(i, 1); // Remove from pool
                break;
            }
        }
        
        // Create new target if none available
        if (!target) {
            target = new THREE.WebGLRenderTarget(width, height, {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat,
                type: THREE.UnsignedByteType,
                ...options
            });
        }
        
        target.lastUsed = performance.now();
        this.activeRenderTargets.add(target);
        this.metrics.renderTargetsRecycled++;
        
        return target;
    }
    
    /**
     * Return render target to pool
     */
    returnRenderTarget(target) {
        if (!target || !this.activeRenderTargets.has(target)) return;
        
        this.activeRenderTargets.delete(target);
        target.lastUsed = performance.now();
        
        // Find matching pool
        const key = `${target.width}x${target.height}_${JSON.stringify({
            minFilter: target.texture.minFilter,
            magFilter: target.texture.magFilter,
            format: target.texture.format,
            type: target.texture.type
        })}`;
        
        if (this.renderTargetPool.has(key)) {
            const pool = this.renderTargetPool.get(key);
            if (pool.length < 5) { // Limit pool size
                pool.push(target);
            } else {
                target.dispose(); // Dispose if pool is full
            }
        } else {
            target.dispose(); // Dispose if no matching pool
        }
    }
    
    /**
     * Update and track resource counts
     */
    updateResourceCounts() {
        if (!this.renderer) return;
        
        const info = this.renderer.info;
        
        this.resourceCounts = {
            programs: info.programs?.length || 0,
            textures: info.memory?.textures || 0,
            geometries: info.memory?.geometries || 0,
            renderTargets: this.activeRenderTargets.size,
            vertexArrayObjects: this.renderTargetPool.size
        };
        
        // Add to history
        this.resourceHistory.push({
            timestamp: performance.now(),
            ...this.resourceCounts
        });
        
        // Trim history
        if (this.resourceHistory.length > this.maxHistoryLength) {
            this.resourceHistory.shift();
        }
    }
    
    /**
     * Check current resource counts for leaks
     */
    checkResourceCounts() {
        this.updateResourceCounts();
        
        const current = this.resourceCounts;
        
        // Check for resource leaks
        if (this.resourceHistory.length > 10) {
            const baseline = this.resourceHistory[this.resourceHistory.length - 10];
            
            Object.keys(current).forEach(key => {
                const growth = current[key] - baseline[key];
                if (growth > this.config.resourceLeakThreshold) {
                    console.warn(`🚨 Potential ${key} leak detected: +${growth} in 10 samples`);
                    this.metrics.resourceLeaksDetected++;
                    
                    // Emit warning event
                    window.dispatchEvent(new CustomEvent('webgl:resource-leak', {
                        detail: { resource: key, growth }
                    }));
                }
            });
        }
    }
    
    /**
     * Analyze resource history for trends
     */
    analyzeResourceHistory() {
        if (this.resourceHistory.length < 20) return;
        
        const recent = this.resourceHistory.slice(-20);
        const baseline = this.resourceHistory.slice(-40, -20);
        
        Object.keys(this.resourceCounts).forEach(key => {
            const recentAvg = recent.reduce((sum, entry) => sum + entry[key], 0) / recent.length;
            const baselineAvg = baseline.reduce((sum, entry) => sum + entry[key], 0) / baseline.length;
            
            const growthRate = (recentAvg - baselineAvg) / baselineAvg;
            
            if (growthRate > 0.1) { // 10% growth
                console.warn(`📈 Resource growth trend detected for ${key}: ${(growthRate * 100).toFixed(1)}%`);
            }
        });
    }
    
    /**
     * Adjust device pixel ratio with degradation
     */
    adjustPixelRatio(targetFPS, currentFPS) {
        if (!this.renderer) return;
        
        const fpsRatio = currentFPS / targetFPS;
        let newRatio = this.devicePixelRatio;
        
        if (fpsRatio < 0.8) { // Performance is poor
            newRatio = Math.max(0.5, this.devicePixelRatio * 0.9);
        } else if (fpsRatio > 1.2) { // Performance is good
            newRatio = Math.min(this.config.maxDevicePixelRatio, this.devicePixelRatio * 1.05);
        }
        
        if (Math.abs(newRatio - this.devicePixelRatio) > 0.01) {
            console.log(`🎯 Adjusting pixel ratio: ${this.devicePixelRatio.toFixed(2)} → ${newRatio.toFixed(2)}`);
            
            this.devicePixelRatio = newRatio;
            this.renderer.setPixelRatio(newRatio);
            this.metrics.pixelRatioAdjustments++;
            
            // Trigger resize to update render targets
            this.triggerResize();
        }
    }
    
    /**
     * Force pixel ratio to specific value
     */
    setPixelRatio(ratio) {
        if (!this.renderer) return;
        
        const clampedRatio = Math.max(0.25, Math.min(this.config.maxDevicePixelRatio, ratio));
        
        if (Math.abs(clampedRatio - this.devicePixelRatio) > 0.01) {
            console.log(`🎯 Setting pixel ratio to: ${clampedRatio.toFixed(2)}`);
            
            this.devicePixelRatio = clampedRatio;
            this.renderer.setPixelRatio(clampedRatio);
            this.metrics.pixelRatioAdjustments++;
            
            this.triggerResize();
        }
    }
    
    /**
     * Trigger resize to update render targets
     */
    triggerResize() {
        if (window.chaosEngine && typeof window.chaosEngine.handleResize === 'function') {
            requestAnimationFrame(() => {
                window.chaosEngine.handleResize();
            });
        }
    }
    
    /**
     * Get renderer info and resource status
     */
    getRendererInfo() {
        if (!this.renderer) return null;
        
        return {
            info: this.renderer.info,
            resourceCounts: this.resourceCounts,
            devicePixelRatio: this.devicePixelRatio,
            renderTargetPoolSize: this.renderTargetPool.size,
            activeRenderTargets: this.activeRenderTargets.size,
            metrics: this.metrics
        };
    }
    
    /**
     * Get performance metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            resourceHistory: this.resourceHistory.slice(-10), // Last 10 samples
            currentResources: this.resourceCounts,
            devicePixelRatio: this.devicePixelRatio
        };
    }
    
    /**
     * Enable/disable resource manager
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        console.log(`WebGL Resource Manager ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Dispose and cleanup all resources
     */
    dispose() {
        this.enabled = false;
        
        // Clear periodic maintenance
        if (this.cleanupIntervalId) {
            clearInterval(this.cleanupIntervalId);
            this.cleanupIntervalId = null;
        }
        
        // Dispose all render targets
        this.renderTargetPool.forEach(targets => {
            targets.forEach(target => {
                if (target.dispose) target.dispose();
            });
        });
        this.renderTargetPool.clear();
        
        this.activeRenderTargets.forEach(target => {
            if (target.dispose) target.dispose();
        });
        this.activeRenderTargets.clear();
        
        // Clear shader queue
        this.shaderWarmupQueue = [];
        this.precompiledShaders.clear();
        
        // Clear history
        this.resourceHistory = [];
        
        console.log('🧹 WebGL Resource Manager disposed');
    }
}

// Export singleton instance
export const webglResourceManager = new WebGLResourceManager();

// Make available globally for debugging
if (typeof window !== 'undefined') {
    window.WEBGL_RESOURCE_MANAGER = webglResourceManager;
}