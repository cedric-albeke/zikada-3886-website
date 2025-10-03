/**
 * Quality Scaler - Adaptive Performance Management
 * 
 * Dynamic quality adjustment system for maintaining target performance
 * - Quality level presets with smooth transitions
 * - Hysteresis prevention for flickering
 * - System-wide quality parameter updates
 * - Integration with FPS Stabilizer
 * 
 * Quality Levels: Ultra → High → Medium → Low → Emergency
 */

export class QualityScaler {
    constructor() {
        // Quality configuration
        this.currentQuality = 0.8; // Default: 80% quality (High)
        this.targetQuality = 0.8;
        this.qualityRange = { min: 0.3, max: 1.0 }; // 30% to 100%
        
        // Hysteresis settings to prevent flickering
        this.hysteresis = 0.15; // 15% buffer for quality changes
        this.transitionSpeed = 0.05; // Quality change per frame (smooth transitions)
        this.lastTransitionTime = 0;
        this.transitionCooldown = 1000; // 1 second between major transitions
        
        // Quality level presets
        this.qualityPresets = {
            ultra: {
                scalar: 1.0,
                resolution: 1.0,      // Full resolution
                particles: 5000,      // Maximum particle count
                particleQuality: 1.0, // Full particle detail
                postProcessing: 'full', // All post-processing effects
                shadows: 'high',      // High-quality shadows
                antialias: true,      // MSAA enabled
                lodBias: 0.0,         // No LOD bias
                textureQuality: 'high'
            },
            high: {
                scalar: 0.85,
                resolution: 0.9,      // 90% resolution
                particles: 3500,      // Reduced particles
                particleQuality: 0.9, // High particle detail
                postProcessing: 'standard', // Standard effects
                shadows: 'medium',    // Medium shadows
                antialias: true,      // MSAA enabled
                lodBias: 0.2,         // Slight LOD bias
                textureQuality: 'medium'
            },
            medium: {
                scalar: 0.65,
                resolution: 0.75,     // 75% resolution
                particles: 2000,      // Further reduced
                particleQuality: 0.7, // Medium particle detail
                postProcessing: 'basic', // Basic effects only
                shadows: 'low',       // Simple shadows
                antialias: false,     // No MSAA
                lodBias: 0.5,         // Medium LOD bias
                textureQuality: 'medium'
            },
            low: {
                scalar: 0.4,
                resolution: 0.5,      // 50% resolution
                particles: 1000,      // Minimal particles
                particleQuality: 0.5, // Low particle detail
                postProcessing: 'none', // No post-processing
                shadows: 'none',      // No shadows
                antialias: false,     // No MSAA
                lodBias: 1.0,         // High LOD bias
                textureQuality: 'low'
            },
            emergency: {
                scalar: 0.3,
                resolution: 0.4,      // 40% resolution
                particles: 500,       // Very minimal particles
                particleQuality: 0.3, // Minimal particle detail
                postProcessing: 'none', // No post-processing
                shadows: 'none',      // No shadows
                antialias: false,     // No MSAA
                lodBias: 2.0,         // Maximum LOD bias
                textureQuality: 'low'
            }
        };
        
        // Current quality state
        this.currentPreset = 'high'; // Default to high quality
        this.previousPreset = 'high';
        this.isTransitioning = false;
        this.transitionProgress = 0;
        
        // System components that need quality updates
        this.renderers = new Set(); // WebGL renderers
        this.particleSystems = new Set(); // Particle systems
        this.postProcessors = new Set(); // Post-processing effects
        this.animationSystems = new Set(); // Animation systems
        
        // Quality change callbacks
        this.qualityChangeCallbacks = new Set();
        
        // Metrics
        this.metrics = {
            qualityChanges: 0,
            emergencyActivations: 0,
            averageQuality: 0.8,
            qualityHistory: []
        };
        
        // Feature flags
        this.enabled = true;
        this.debug = false;
        this.smoothTransitions = true;
        
        this.initializeFeatureFlags();
        
        console.log('✅ Quality Scaler initialized - Default: High (85% quality)');
    }
    
    /**
     * Initialize feature flag configuration
     */
    initializeFeatureFlags() {
        const config = window.ZIKADA_PERF_CONFIG;
        if (config) {
            this.enabled = config.features?.qualityScaler !== false;
            this.debug = config.debug?.showMetrics === true;
            this.smoothTransitions = config.features?.smoothTransitions !== false;
            
            // Override quality settings if configured
            if (config.quality?.default) {
                this.setQualityLevel(config.quality.default);
            }
        }
        
        // URL parameter overrides
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('quality')) {
            this.setQualityLevel(urlParams.get('quality'));
        }
        if (urlParams.has('debug') && urlParams.get('debug').includes('quality')) {
            this.debug = true;
        }
    }
    
    /**
     * Adjust quality based on target FPS and current performance
     * @param {number} targetFPS - Target FPS to maintain
     * @param {number} currentFPS - Current measured FPS
     * @param {object} performanceMetrics - Additional performance data
     * @returns {object} Quality adjustment result
     */
    adjustQuality(targetFPS, currentFPS, performanceMetrics = {}) {
        if (!this.enabled) {
            return { adjusted: false, quality: this.currentQuality, preset: this.currentPreset };
        }
        
        const now = performance.now();
        
        // Calculate performance ratio
        const performanceRatio = currentFPS / targetFPS;
        
        // Determine target quality based on performance
        let targetQuality = this.calculateTargetQuality(performanceRatio, performanceMetrics);
        
        // Apply hysteresis to prevent flickering
        targetQuality = this.applyHysteresis(targetQuality);
        
        // Check if significant adjustment is needed
        const qualityDelta = Math.abs(targetQuality - this.currentQuality);
        const shouldAdjust = qualityDelta > 0.1 || (now - this.lastTransitionTime > this.transitionCooldown);
        
        if (shouldAdjust) {
            this.targetQuality = targetQuality;
            this.lastTransitionTime = now;
            
            // Determine target preset
            const targetPreset = this.getPresetForQuality(targetQuality);
            
            if (targetPreset !== this.currentPreset) {
                this.startQualityTransition(targetPreset);
            }
        }
        
        // Update smooth transitions
        if (this.smoothTransitions && this.isTransitioning) {
            this.updateSmoothTransition();
        }
        
        // Record metrics
        this.recordQualityMetrics();
        
        if (this.debug) {
            this.logQualityAdjustment(currentFPS, targetFPS, targetQuality);
        }
        
        return {
            adjusted: shouldAdjust,
            quality: this.currentQuality,
            preset: this.currentPreset,
            isTransitioning: this.isTransitioning,
            targetQuality: this.targetQuality
        };
    }
    
    /**
     * Calculate target quality based on performance ratio
     * @param {number} performanceRatio - currentFPS / targetFPS
     * @param {object} metrics - Additional performance metrics
     * @returns {number} Target quality scalar (0.0 to 1.0)
     */
    calculateTargetQuality(performanceRatio, metrics) {
        let targetQuality = this.currentQuality;
        
        // Performance-based adjustment
        if (performanceRatio < 0.8) {
            // Performance below 80% of target - reduce quality
            const reduction = Math.pow(1 - performanceRatio, 2) * 0.3; // Up to 30% reduction
            targetQuality = Math.max(this.qualityRange.min, this.currentQuality - reduction);
        } else if (performanceRatio > 1.1) {
            // Performance above 110% of target - increase quality
            const increase = (performanceRatio - 1.0) * 0.2; // Up to 20% increase
            targetQuality = Math.min(this.qualityRange.max, this.currentQuality + increase);
        }
        
        // Consider additional metrics
        if (metrics.memoryPressure && metrics.memoryPressure > 0.8) {
            targetQuality *= 0.9; // Reduce quality under memory pressure
        }
        
        if (metrics.gpuUtilization && metrics.gpuUtilization > 0.9) {
            targetQuality *= 0.85; // Reduce quality under high GPU utilization
        }
        
        return Math.max(this.qualityRange.min, Math.min(this.qualityRange.max, targetQuality));
    }
    
    /**
     * Apply hysteresis to prevent quality flickering
     * @param {number} targetQuality - Desired target quality
     * @returns {number} Adjusted quality with hysteresis
     */
    applyHysteresis(targetQuality) {
        const currentQuality = this.currentQuality;
        const delta = targetQuality - currentQuality;
        
        // Only adjust if change is significant enough
        if (Math.abs(delta) < this.hysteresis) {
            return currentQuality; // Stay at current quality
        }
        
        // Apply hysteresis buffer
        if (delta > 0) {
            return Math.min(targetQuality, currentQuality + this.hysteresis);
        } else {
            return Math.max(targetQuality, currentQuality - this.hysteresis);
        }
    }
    
    /**
     * Get quality preset name for a given quality scalar
     * @param {number} quality - Quality scalar (0.0 to 1.0)
     * @returns {string} Preset name
     */
    getPresetForQuality(quality) {
        if (quality >= 0.9) return 'ultra';
        if (quality >= 0.7) return 'high';
        if (quality >= 0.5) return 'medium';
        if (quality >= 0.35) return 'low';
        return 'emergency';
    }
    
    /**
     * Start transition to new quality preset
     * @param {string} targetPreset - Target quality preset name
     */
    startQualityTransition(targetPreset) {
        if (targetPreset === this.currentPreset) return;
        
        this.previousPreset = this.currentPreset;
        this.currentPreset = targetPreset;
        this.targetQuality = this.qualityPresets[targetPreset].scalar;
        this.isTransitioning = this.smoothTransitions;
        this.transitionProgress = 0;
        
        // Immediate application if smooth transitions disabled
        if (!this.smoothTransitions) {
            this.applyQualitySettings(this.qualityPresets[targetPreset]);
        }
        
        this.metrics.qualityChanges++;
        if (targetPreset === 'emergency') {
            this.metrics.emergencyActivations++;
        }
        
        console.log(`🎯 Quality transition: ${this.previousPreset} → ${targetPreset} (${(this.targetQuality * 100).toFixed(0)}%)`);
        
        // Notify callbacks
        this.notifyQualityChange(targetPreset, this.qualityPresets[targetPreset]);
    }
    
    /**
     * Update smooth quality transition
     */
    updateSmoothTransition() {
        if (!this.isTransitioning) return;
        
        this.transitionProgress += this.transitionSpeed;
        
        if (this.transitionProgress >= 1.0) {
            // Transition complete
            this.transitionProgress = 1.0;
            this.isTransitioning = false;
            this.currentQuality = this.targetQuality;
            
            // Apply final quality settings
            this.applyQualitySettings(this.qualityPresets[this.currentPreset]);
        } else {
            // Interpolate between current and target quality
            const prevSettings = this.qualityPresets[this.previousPreset];
            const targetSettings = this.qualityPresets[this.currentPreset];
            const t = this.transitionProgress;
            
            // Create interpolated settings
            const interpolatedSettings = this.interpolateQualitySettings(prevSettings, targetSettings, t);
            this.currentQuality = prevSettings.scalar + (targetSettings.scalar - prevSettings.scalar) * t;
            
            // Apply interpolated settings
            this.applyQualitySettings(interpolatedSettings);
        }
    }
    
    /**
     * Interpolate between two quality setting objects
     * @param {object} from - Source quality settings
     * @param {object} to - Target quality settings
     * @param {number} t - Interpolation factor (0.0 to 1.0)
     * @returns {object} Interpolated quality settings
     */
    interpolateQualitySettings(from, to, t) {
        const interpolated = {};
        
        // Interpolate numeric values
        const numericKeys = ['scalar', 'resolution', 'particles', 'particleQuality', 'lodBias'];
        numericKeys.forEach(key => {
            if (typeof from[key] === 'number' && typeof to[key] === 'number') {
                interpolated[key] = from[key] + (to[key] - from[key]) * t;
            }
        });
        
        // Use target values for discrete settings at 50% transition
        const discreteKeys = ['postProcessing', 'shadows', 'antialias', 'textureQuality'];
        discreteKeys.forEach(key => {
            interpolated[key] = t >= 0.5 ? to[key] : from[key];
        });
        
        return interpolated;
    }
    
    /**
     * Apply quality settings to all registered systems
     * @param {object} settings - Quality settings to apply
     */
    applyQualitySettings(settings) {
        // Update renderers
        this.renderers.forEach(renderer => {
            if (renderer.setPixelRatio) {
                renderer.setPixelRatio(window.devicePixelRatio * settings.resolution);
            }
            if (renderer.antialias !== undefined) {
                renderer.antialias = settings.antialias;
            }
        });
        
        // Update particle systems
        this.particleSystems.forEach(system => {
            if (system.setMaxParticles) {
                system.setMaxParticles(settings.particles);
            }
            if (system.setQuality) {
                system.setQuality(settings.particleQuality);
            }
        });
        
        // Update post-processing
        this.postProcessors.forEach(processor => {
            if (processor.setQuality) {
                processor.setQuality(settings.postProcessing);
            }
        });
        
        // Update animation systems
        this.animationSystems.forEach(system => {
            if (system.setQuality) {
                system.setQuality(settings.scalar);
            }
        });
    }
    
    /**
     * Emergency quality reduction for panic mode
     */
    emergencyReduction() {
        console.warn('🚨 Emergency quality reduction activated');
        this.setQualityLevel('emergency', true);
    }
    
    /**
     * Set specific quality level
     * @param {string} presetName - Quality preset name
     * @param {boolean} immediate - Apply immediately without smooth transition
     */
    setQualityLevel(presetName, immediate = false) {
        if (!this.qualityPresets[presetName]) {
            console.warn(`Unknown quality preset: ${presetName}`);
            return;
        }
        
        const wasSmooth = this.smoothTransitions;
        if (immediate) {
            this.smoothTransitions = false;
        }
        
        this.startQualityTransition(presetName);
        
        if (immediate) {
            this.isTransitioning = false;
            this.currentQuality = this.qualityPresets[presetName].scalar;
            this.applyQualitySettings(this.qualityPresets[presetName]);
            this.smoothTransitions = wasSmooth;
        }
    }
    
    /**
     * Register system component for quality updates
     */
    registerRenderer(renderer) {
        this.renderers.add(renderer);
    }
    
    registerParticleSystem(system) {
        this.particleSystems.add(system);
    }
    
    registerPostProcessor(processor) {
        this.postProcessors.add(processor);
    }
    
    registerAnimationSystem(system) {
        this.animationSystems.add(system);
    }
    
    /**
     * Register callback for quality changes
     * @param {function} callback - Function to call on quality change
     */
    onQualityChange(callback) {
        this.qualityChangeCallbacks.add(callback);
    }
    
    /**
     * Notify all callbacks of quality change
     */
    notifyQualityChange(preset, settings) {
        this.qualityChangeCallbacks.forEach(callback => {
            try {
                callback(preset, settings, this.currentQuality);
            } catch (error) {
                console.error('Quality change callback error:', error);
            }
        });
    }
    
    /**
     * Record quality metrics for monitoring
     */
    recordQualityMetrics() {
        this.metrics.qualityHistory.push(this.currentQuality);
        if (this.metrics.qualityHistory.length > 100) {
            this.metrics.qualityHistory.shift();
        }
        
        // Calculate average quality
        if (this.metrics.qualityHistory.length > 0) {
            this.metrics.averageQuality = this.metrics.qualityHistory.reduce((a, b) => a + b, 0) / this.metrics.qualityHistory.length;
        }
    }
    
    /**
     * Get current quality metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            currentQuality: this.currentQuality,
            currentPreset: this.currentPreset,
            targetQuality: this.targetQuality,
            isTransitioning: this.isTransitioning,
            enabled: this.enabled
        };
    }
    
    /**
     * Get current quality settings
     */
    getCurrentSettings() {
        return { ...this.qualityPresets[this.currentPreset] };
    }
    
    /**
     * Debug logging for quality adjustments
     */
    logQualityAdjustment(currentFPS, targetFPS, targetQuality) {
        const logData = {
            timestamp: performance.now(),
            currentFPS: currentFPS.toFixed(1),
            targetFPS,
            currentQuality: this.currentQuality.toFixed(2),
            targetQuality: targetQuality.toFixed(2),
            preset: this.currentPreset,
            isTransitioning: this.isTransitioning
        };
        
        console.log(`[Quality-Scaler] ${JSON.stringify(logData)}`);
    }
    
    /**
     * Enable/disable the quality scaler
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        console.log(`Quality Scaler ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Destroy the quality scaler and cleanup
     */
    destroy() {
        this.enabled = false;
        this.renderers.clear();
        this.particleSystems.clear();
        this.postProcessors.clear();
        this.animationSystems.clear();
        this.qualityChangeCallbacks.clear();
        
        console.log('🧹 Quality Scaler destroyed');
    }
}

// Export singleton instance for global access
export const qualityScaler = new QualityScaler();

// Make available globally for debugging
if (typeof window !== 'undefined') {
    window.ZIKADA_QUALITY_SCALER = qualityScaler;
}