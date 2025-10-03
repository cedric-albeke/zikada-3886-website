/**
 * FPS Stabilizer - Core Performance Foundation
 * 
 * Real-time frame rate monitoring and stabilization system
 * - Frame timing analysis and prediction
 * - Performance threshold detection
 * - Quality adjustment recommendations
 * - Panic mode trigger conditions
 * 
 * Target: 60 FPS sustained performance
 * Frame Budget: 16.67ms per frame
 */

export class FPSStabilizer {
    constructor() {
        // Target performance metrics
        this.targetFPS = 60;
        this.frameBudget = 16.67; // ms per frame at 60 FPS
        this.criticalFrameTime = 33.33; // 30 FPS - panic threshold
        
        // Frame timing history (rolling window)
        this.frameHistory = [];
        this.historySize = 60; // 1 second at 60 FPS
        this.currentFPS = 60;
        this.averageFrameTime = 16.67;
        
        // Performance thresholds for quality scaling
        this.performanceThresholds = {
            excellent: { fps: 55, frameTime: 18.0 },  // High quality
            good: { fps: 40, frameTime: 25.0 },       // Standard quality
            fair: { fps: 25, frameTime: 40.0 },       // Medium quality  
            poor: { fps: 15, frameTime: 66.0 }        // Low quality
        };
        
        // Quality adjustment state
        this.currentQualityLevel = 'excellent';
        this.qualityScaler = null; // Will be injected
        this.lastQualityAdjustment = 0;
        this.qualityAdjustmentCooldown = 2000; // 2 seconds
        
        // Panic mode state
        this.panicMode = false;
        this.panicTriggerCount = 0;
        this.panicThreshold = 5; // Consecutive poor frames before panic
        this.panicModeManager = null; // Will be injected
        
        // Performance prediction
        this.trendWindow = 10; // Frames to analyze for trends
        this.degradationTrend = false;
        
        // Metrics for monitoring
        this.metrics = {
            framesAnalyzed: 0,
            qualityAdjustments: 0,
            panicActivations: 0,
            averageFrameTime: 16.67,
            p95FrameTime: 16.67,
            p99FrameTime: 16.67
        };
        
        this.enabled = false; // DISABLED BY DEFAULT
        this.debug = false;
        
        // Initialize feature flag support
        this.initializeFeatureFlags();
        
        console.log('✅ FPS Stabilizer initialized - Target: 60 FPS (16.67ms budget)');
    }
    
    /**
     * Initialize feature flag configuration
     */
    initializeFeatureFlags() {
        const config = window.ZIKADA_PERF_CONFIG;
        if (config) {
            this.enabled = config.features?.fpsStabilizer !== false;
            this.debug = config.debug?.frameAnalysis === true;
            
            // Override panic threshold if configured
            if (config.safety?.maxFrameTime) {
                this.criticalFrameTime = config.safety.maxFrameTime;
            }
        }
        
        // URL parameter overrides
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('debug') && urlParams.get('debug').includes('fps')) {
            this.debug = true;
        }
    }
    
    /**
     * Analyze current frame performance and return quality recommendations
     * @param {number} frameStartTime - Performance.now() at frame start
     * @returns {object} Analysis results with quality recommendations
     */
    analyzeFrame(frameStartTime = performance.now()) {
        if (!this.enabled || this.panicMode) {
            return {
                fps: this.currentFPS,
                qualityLevel: this.panicMode ? 'emergency' : this.currentQualityLevel,
                shouldAdjustQuality: false,
                panicMode: this.panicMode
            };
        }
        
        // Calculate frame timing from previous frame
        if (this.lastFrameTime) {
            const frameTime = frameStartTime - this.lastFrameTime;
            this.recordFrameTiming(frameTime);
        }
        
        this.lastFrameTime = frameStartTime;
        this.metrics.framesAnalyzed++;
        
        // Update current performance metrics
        this.updatePerformanceMetrics();
        
        // Detect performance trends
        this.detectPerformanceTrends();
        
        // Check for panic conditions
        const shouldPanic = this.checkPanicConditions();
        if (shouldPanic && !this.panicMode) {
            this.activatePanicMode();
        }
        
        // Determine if quality adjustment is needed
        const shouldAdjustQuality = this.shouldAdjustQuality();
        const recommendedQuality = this.getRecommendedQualityLevel();
        
        if (this.debug) {
            this.logFrameAnalysis(frameStartTime, recommendedQuality);
        }
        
        return {
            fps: this.currentFPS,
            frameTime: this.averageFrameTime,
            qualityLevel: recommendedQuality,
            shouldAdjustQuality,
            panicMode: this.panicMode,
            trend: this.degradationTrend ? 'degrading' : 'stable',
            metrics: { ...this.metrics }
        };
    }
    
    /**
     * Record frame timing data
     * @param {number} frameTime - Time taken for frame in milliseconds
     */
    recordFrameTiming(frameTime) {
        // Add to rolling history
        this.frameHistory.push(frameTime);
        if (this.frameHistory.length > this.historySize) {
            this.frameHistory.shift();
        }
        
        // Update current FPS calculation
        if (frameTime > 0) {
            this.currentFPS = Math.min(60, 1000 / frameTime);
        }
    }
    
    /**
     * Update performance metrics from frame history
     */
    updatePerformanceMetrics() {
        if (this.frameHistory.length === 0) return;
        
        // Calculate average frame time
        const sum = this.frameHistory.reduce((a, b) => a + b, 0);
        this.averageFrameTime = sum / this.frameHistory.length;
        
        // Calculate percentiles
        const sorted = [...this.frameHistory].sort((a, b) => a - b);
        const len = sorted.length;
        
        if (len > 0) {
            this.metrics.p95FrameTime = sorted[Math.floor(len * 0.95)];
            this.metrics.p99FrameTime = sorted[Math.floor(len * 0.99)];
            this.metrics.averageFrameTime = this.averageFrameTime;
        }
    }
    
    /**
     * Detect performance degradation trends
     */
    detectPerformanceTrends() {
        if (this.frameHistory.length < this.trendWindow) return;
        
        // Analyze recent frames for degradation trend
        const recentFrames = this.frameHistory.slice(-this.trendWindow);
        const firstHalf = recentFrames.slice(0, this.trendWindow / 2);
        const secondHalf = recentFrames.slice(this.trendWindow / 2);
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        // Consider degrading if recent frames are 20% slower
        this.degradationTrend = secondAvg > firstAvg * 1.2;
    }
    
    /**
     * Check if panic conditions are met
     * @returns {boolean} True if panic mode should be activated
     */
    checkPanicConditions() {
        if (this.panicMode) return false;
        
        // Check for consistently poor performance
        const recentFrames = this.frameHistory.slice(-5); // Last 5 frames
        const poorFrames = recentFrames.filter(ft => ft > this.criticalFrameTime).length;
        
        if (poorFrames >= 4) { // 4 out of 5 frames are poor
            this.panicTriggerCount++;
            return this.panicTriggerCount >= this.panicThreshold;
        }
        
        // Reset panic trigger if performance recovers
        this.panicTriggerCount = Math.max(0, this.panicTriggerCount - 1);
        return false;
    }
    
    /**
     * Activate panic mode - emergency fallback
     */
    activatePanicMode() {
        this.panicMode = true;
        this.metrics.panicActivations++;
        
        console.warn('🚨 PANIC MODE ACTIVATED - Performance critically low');
        console.warn(`Current FPS: ${this.currentFPS.toFixed(1)}, Frame Time: ${this.averageFrameTime.toFixed(1)}ms`);
        
        // Notify panic mode manager if available
        if (this.panicModeManager) {
            this.panicModeManager.activatePanic('fps-critical');
        }
        
        // Trigger immediate quality reduction
        if (this.qualityScaler) {
            this.qualityScaler.emergencyReduction();
        }
        
        // Log panic event for debugging
        this.logPanicEvent();
    }
    
    /**
     * Deactivate panic mode when performance recovers
     */
    deactivatePanicMode() {
        if (!this.panicMode) return;
        
        // Check if performance has sufficiently recovered
        const recentAverage = this.frameHistory.slice(-10).reduce((a, b) => a + b, 0) / 10;
        if (recentAverage < this.frameBudget * 1.5) { // Under 25ms average
            this.panicMode = false;
            this.panicTriggerCount = 0;
            
            console.log('✅ Panic mode deactivated - Performance recovered');
            
            if (this.panicModeManager) {
                this.panicModeManager.deactivatePanic();
            }
        }
    }
    
    /**
     * Determine if quality adjustment is needed
     * @returns {boolean} True if quality should be adjusted
     */
    shouldAdjustQuality() {
        if (this.panicMode) return false; // Quality already at minimum
        
        const now = performance.now();
        if (now - this.lastQualityAdjustment < this.qualityAdjustmentCooldown) {
            return false; // Still in cooldown
        }
        
        const recommendedLevel = this.getRecommendedQualityLevel();
        return recommendedLevel !== this.currentQualityLevel;
    }
    
    /**
     * Get recommended quality level based on current performance
     * @returns {string} Quality level ('excellent', 'good', 'fair', 'poor')
     */
    getRecommendedQualityLevel() {
        if (this.panicMode) return 'emergency';
        
        const fps = this.currentFPS;
        const frameTime = this.averageFrameTime;
        
        // Determine quality based on performance thresholds
        if (fps >= this.performanceThresholds.excellent.fps && 
            frameTime <= this.performanceThresholds.excellent.frameTime) {
            return 'excellent';
        } else if (fps >= this.performanceThresholds.good.fps && 
                   frameTime <= this.performanceThresholds.good.frameTime) {
            return 'good';
        } else if (fps >= this.performanceThresholds.fair.fps && 
                   frameTime <= this.performanceThresholds.fair.frameTime) {
            return 'fair';
        } else {
            return 'poor';
        }
    }
    
    /**
     * Record quality adjustment
     * @param {string} newQualityLevel - The new quality level applied
     */
    recordQualityAdjustment(newQualityLevel) {
        this.currentQualityLevel = newQualityLevel;
        this.lastQualityAdjustment = performance.now();
        this.metrics.qualityAdjustments++;
        
        if (this.debug) {
            console.log(`🎯 Quality adjusted to: ${newQualityLevel} (FPS: ${this.currentFPS.toFixed(1)})`);
        }
    }
    
    /**
     * Set external components for integration
     */
    setQualityScaler(qualityScaler) {
        this.qualityScaler = qualityScaler;
    }
    
    setPanicModeManager(panicModeManager) {
        this.panicModeManager = panicModeManager;
    }
    
    /**
     * Get current performance metrics
     * @returns {object} Performance metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            currentFPS: this.currentFPS,
            averageFrameTime: this.averageFrameTime,
            currentQualityLevel: this.currentQualityLevel,
            panicMode: this.panicMode,
            enabled: this.enabled
        };
    }
    
    /**
     * Reset stabilizer state (for testing)
     */
    reset() {
        this.frameHistory = [];
        this.currentFPS = 60;
        this.averageFrameTime = 16.67;
        this.currentQualityLevel = 'excellent';
        this.panicMode = false;
        this.panicTriggerCount = 0;
        this.degradationTrend = false;
        this.lastQualityAdjustment = 0;
        
        console.log('🔄 FPS Stabilizer reset to defaults');
    }
    
    /**
     * Debug logging for frame analysis
     */
    logFrameAnalysis(frameStartTime, recommendedQuality) {
        const logData = {
            timestamp: frameStartTime,
            fps: this.currentFPS.toFixed(1),
            frameTime: this.averageFrameTime.toFixed(1),
            qualityLevel: recommendedQuality,
            panicMode: this.panicMode,
            trend: this.degradationTrend ? 'degrading' : 'stable'
        };
        
        console.log(`[FPS-Stabilizer] ${JSON.stringify(logData)}`);
    }
    
    /**
     * Log panic mode activation for debugging
     */
    logPanicEvent() {
        const panicData = {
            timestamp: performance.now(),
            trigger: 'fps-critical',
            currentFPS: this.currentFPS.toFixed(1),
            averageFrameTime: this.averageFrameTime.toFixed(1),
            recentFrames: this.frameHistory.slice(-10)
        };
        
        console.error(`[PANIC-EVENT] ${JSON.stringify(panicData)}`);
    }
    
    /**
     * Enable/disable the stabilizer
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        console.log(`FPS Stabilizer ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Destroy the stabilizer and cleanup
     */
    destroy() {
        this.enabled = false;
        this.frameHistory = [];
        this.qualityScaler = null;
        this.panicModeManager = null;
        
        console.log('🧹 FPS Stabilizer destroyed');
    }
}

// Export singleton instance for global access
export const fpsStabilizer = new FPSStabilizer();

// Make available globally for debugging
if (typeof window !== 'undefined') {
    window.ZIKADA_FPS_STABILIZER = fpsStabilizer;
}