/**
 * Performance Monitoring Integration - Safe Version
 * 
 * Integrates the safe performance monitor with feature flags and provides
 * automatic performance degradation when thresholds are exceeded.
 * 
 * Features:
 * - Works with safe feature flags system
 * - Non-intrusive monitoring (no animation patching)
 * - Automatic degradation based on thresholds
 * - Manual override controls
 * - Emergency brake functionality
 */

class PerformanceMonitoringIntegration {
    constructor() {
        this.thresholds = {
            fps: {
                warning: 24,
                critical: 12,
                emergency: 8
            },
            memory: {
                warning: 500 * 1024 * 1024,  // 500MB
                critical: 700 * 1024 * 1024, // 700MB
                emergency: 900 * 1024 * 1024 // 900MB
            },
            domNodes: {
                warning: 4000,
                critical: 7000,
                emergency: 10000
            }
        };

        // Smoothing: require consecutive confirmations before applying degradations or recoveries
        this._lastComputedLevel = 'normal';
        this._levelStreak = 0;
        this._streakThresholdDegrade = 3; // require 3 consecutive evaluations (~6s) before degrading
        this._streakThresholdRecover = 2; // require 2 consecutive evaluations (~4s) before recovering
        
        this.degradationLevel = 'normal'; // normal, warning, critical, emergency
        this.monitoring = false;
        this.emergencyBrakeActive = false;
        
        // Performance history for trend analysis
        this.performanceHistory = [];
        this.maxHistorySize = 60; // Keep 60 seconds of data
        
        // Degradation state tracking
        this.degradationActions = new Set();
        
        console.log('🔧 Performance Monitoring Integration initialized');
    }
    
    /**
     * Start integrated performance monitoring
     */
    startMonitoring() {
        if (this.monitoring) return;
        
        // Ensure safe performance monitor is available
        if (!window.safePerformanceMonitor) {
            console.warn('⚠️ Safe performance monitor not found, initializing basic monitoring');
            this.initBasicMonitoring();
            return;
        }
        
        this.monitoring = true;
        
        // Start periodic performance evaluation
        this.evaluationInterval = setInterval(() => {
            this.evaluatePerformance();
        }, 2000); // Every 2 seconds
        
        // Listen for performance events from safe monitor
        this.setupPerformanceEventListeners();
        
        console.log('📊 Performance monitoring integration started');
    }
    
    /**
     * Setup event listeners for performance monitoring
     */
    setupPerformanceEventListeners() {
        // Listen for emergency events from the safe monitor
        window.addEventListener('performance:emergency', (event) => {
            console.log('🚨 Performance emergency detected by safe monitor');
            this.handleEmergency(event.detail);
        });
        
        // Listen for memory warnings
        window.addEventListener('memory:warning', (event) => {
            console.log('⚠️ Memory warning detected');
            this.handleMemoryWarning(event.detail);
        });
        
        // Listen for DOM growth warnings
        window.addEventListener('dom:excessive-growth', (event) => {
            console.log('🌳 Excessive DOM growth detected');
            this.handleDOMGrowth(event.detail);
        });
    }
    
    /**
     * Evaluate current performance and apply degradation if needed
     */
    evaluatePerformance() {
        if (!window.safePerformanceMonitor) return;
        
        const report = window.safePerformanceMonitor.getReport();
        
        // Add to performance history
        this.performanceHistory.push({
            timestamp: Date.now(),
            fps: report.fps.current,
            memory: report.memory.usage,
            domNodes: report.dom.totalNodes
        });
        
        // Trim history to max size
        if (this.performanceHistory.length > this.maxHistorySize) {
            this.performanceHistory.shift();
        }
        
        // Determine new degradation level
        const computedLevel = this.calculateDegradationLevel(report);

        // Update streaks
        if (computedLevel === this._lastComputedLevel) {
            this._levelStreak++;
        } else {
            this._lastComputedLevel = computedLevel;
            this._levelStreak = 1;
        }

        // Decide when to apply
        const isImproving = this.isLevelBetter(computedLevel, this.degradationLevel);
        const requiredStreak = isImproving ? this._streakThresholdRecover : this._streakThresholdDegrade;

        if (computedLevel !== this.degradationLevel && this._levelStreak >= requiredStreak) {
            this.applyDegradation(computedLevel, report);
        }
    }
    
    /**
     * Calculate appropriate degradation level based on performance metrics
     */
    calculateDegradationLevel(report) {
        const { fps, memory, domNodes } = {
            fps: report.fps.current,
            memory: report.memory.usage,
            domNodes: report.dom.totalNodes
        };
        
        // Check for emergency conditions (multiple metrics failing)
        const emergencyConditions = [
            fps < this.thresholds.fps.emergency,
            memory > this.thresholds.memory.emergency,
            domNodes > this.thresholds.domNodes.emergency
        ].filter(Boolean).length;
        
        if (emergencyConditions >= 2) {
            return 'emergency';
        }
        
        // Check for critical conditions
        if (fps < this.thresholds.fps.critical || 
            memory > this.thresholds.memory.critical || 
            domNodes > this.thresholds.domNodes.critical) {
            return 'critical';
        }
        
        // Check for warning conditions
        if (fps < this.thresholds.fps.warning || 
            memory > this.thresholds.memory.warning || 
            domNodes > this.thresholds.domNodes.warning) {
            return 'warning';
        }
        
        return 'normal';
    }
    
    /**
     * Apply performance degradation based on level
     */
    applyDegradation(newLevel, report) {
        const previousLevel = this.degradationLevel;
        this.degradationLevel = newLevel;
        
        console.log(`📊 Performance level changed: ${previousLevel} → ${newLevel}`);
        
        // Clear previous degradations if going to a better level
        if (this.isLevelBetter(newLevel, previousLevel)) {
            this.clearDegradations();
        }
        
        // Apply new degradations
        switch (newLevel) {
            case 'warning':
                this.applyWarningDegradation();
                break;
            case 'critical':
                this.applyCriticalDegradation();
                break;
            case 'emergency':
                this.applyEmergencyDegradation();
                break;
            case 'normal':
                this.clearAllDegradations();
                break;
        }
        
        // Emit custom event for other systems
        window.dispatchEvent(new CustomEvent('performance:degradation-level-changed', {
            detail: { level: newLevel, previousLevel, report }
        }));
    }
    
    /**
     * Apply warning level degradation
     */
    applyWarningDegradation() {
        this.addDegradationAction('reduce-text-effects', () => {
            if (window.SAFE_FLAGS) {
                window.SAFE_FLAGS.override('TEXT_EFFECTS_ENABLED', false);
            }
        });
        
        this.addDegradationAction('reduce-particle-count', () => {
            if (window.chaosEngine?.particles) {
                window.chaosEngine.particles.material.size *= 0.8;
            }
        });
        
        console.log('⚠️ Warning degradation applied: reduced text effects and particles');
    }
    
    /**
     * Apply critical level degradation
     */
    applyCriticalDegradation() {
        this.applyWarningDegradation(); // Include warning degradations
        
        this.addDegradationAction('disable-heavy-effects', () => {
            const style = document.createElement('style');
            style.id = 'performance-critical-degradation';
            style.textContent = `
                .holographic-shimmer { display: none !important; }
                .quantum-particles { display: none !important; }
                .energy-field { display: none !important; }
                #static-noise { opacity: 0.001 !important; }
            `;
            document.head.appendChild(style);
        });
        
        this.addDegradationAction('emergency-cleanup', () => {
            if (window.safePerformanceMonitor) {
                window.safePerformanceMonitor.safeCleanup();
            }
        });
        
        console.log('🔥 Critical degradation applied: disabled heavy effects, cleanup performed');
    }
    
    /**
     * Apply emergency level degradation
     */
    applyEmergencyDegradation() {
        this.applyCriticalDegradation(); // Include critical degradations
        
        this.addDegradationAction('emergency-brake', () => {
            if (window.safePerformanceMonitor) {
                window.safePerformanceMonitor.emergencyBrake();
            }
            this.emergencyBrakeActive = true;
        });
        
        this.addDegradationAction('disable-all-fx', () => {
            if (window.SAFE_FLAGS) {
                window.SAFE_FLAGS.override('FX_ENABLED', false);
                window.SAFE_FLAGS.override('CHROMA_ENABLED', false);
                window.SAFE_FLAGS.override('SPOTLIGHT_ENABLED', false);
                window.SAFE_FLAGS.override('SHIMMER_ENABLED', false);
            }
        });
        
        console.log('🚨 Emergency degradation applied: all effects disabled, emergency brake active');
    }
    
    /**
     * Add a degradation action
     */
    addDegradationAction(name, action) {
        if (this.degradationActions.has(name)) return; // Already applied
        
        try {
            action();
            this.degradationActions.add(name);
        } catch (error) {
            console.warn(`⚠️ Failed to apply degradation action ${name}:`, error);
        }
    }
    
    /**
     * Clear specific degradations when improving performance level
     */
    clearDegradations() {
        // Remove degradation styles
        const degradationStyle = document.getElementById('performance-critical-degradation');
        if (degradationStyle) {
            degradationStyle.remove();
            this.degradationActions.delete('disable-heavy-effects');
        }
        
        // Restore effects if emergency brake was active
        if (this.emergencyBrakeActive && window.safePerformanceMonitor) {
            window.safePerformanceMonitor.restoreEffects();
            this.emergencyBrakeActive = false;
            this.degradationActions.delete('emergency-brake');
        }
    }
    
    /**
     * Clear all degradations and restore normal state
     */
    clearAllDegradations() {
        this.clearDegradations();
        
        // Restore feature flags to defaults
        if (window.SAFE_FLAGS) {
            window.SAFE_FLAGS.reset('FX_ENABLED');
            window.SAFE_FLAGS.reset('TEXT_EFFECTS_ENABLED');
            window.SAFE_FLAGS.reset('CHROMA_ENABLED');
            window.SAFE_FLAGS.reset('SPOTLIGHT_ENABLED');
            window.SAFE_FLAGS.reset('SHIMMER_ENABLED');
        }
        
        this.degradationActions.clear();
        console.log('✅ All performance degradations cleared');
    }
    
    /**
     * Check if new level is better than previous level
     */
    isLevelBetter(newLevel, oldLevel) {
        const levels = ['emergency', 'critical', 'warning', 'normal'];
        return levels.indexOf(newLevel) > levels.indexOf(oldLevel);
    }
    
    /**
     * Handle emergency events from safe monitor
     */
    handleEmergency(details) {
        console.log('🚨 Emergency handler triggered:', details);
        this.applyEmergencyDegradation();
    }
    
    /**
     * Handle memory warning events
     */
    handleMemoryWarning(details) {
        console.log('🧠 Memory warning handler:', details);
        if (this.degradationLevel === 'normal') {
            this.applyDegradation('warning', details);
        }
    }
    
    /**
     * Handle DOM growth events
     */
    handleDOMGrowth(details) {
        console.log('🌳 DOM growth handler:', details);
        // Trigger cleanup regardless of degradation level
        if (window.safePerformanceMonitor) {
            window.safePerformanceMonitor.safeCleanup();
        }
    }
    
    /**
     * Basic monitoring fallback when safe monitor isn't available
     */
    initBasicMonitoring() {
        let fps = 60;
        let lastTime = performance.now();
        let frameCount = 0;
        
        const measureFPS = () => {
            const now = performance.now();
            frameCount++;
            
            if (now >= lastTime + 1000) {
                fps = (frameCount * 1000) / (now - lastTime);
                frameCount = 0;
                lastTime = now;
                
                // Basic threshold checking
                if (fps < 15) {
                    console.warn('🚨 Critical FPS detected:', fps);
                    this.applyEmergencyDegradation();
                } else if (fps < 30) {
                    console.warn('⚠️ Low FPS detected:', fps);
                    this.applyWarningDegradation();
                }
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        measureFPS();
        console.log('📊 Basic performance monitoring started');
    }
    
    /**
     * Get current performance report
     */
    getReport() {
        return {
            degradationLevel: this.degradationLevel,
            emergencyBrakeActive: this.emergencyBrakeActive,
            degradationActions: Array.from(this.degradationActions),
            performanceHistory: this.performanceHistory.slice(-10), // Last 10 samples
            thresholds: this.thresholds
        };
    }
    
    /**
     * Manual controls for testing and debugging
     */
    manualOverride(level) {
        console.log(`🔧 Manual override: forcing degradation level to ${level}`);
        this.applyDegradation(level, { manual: true });
    }
    
    /**
     * Reset to normal state
     */
    reset() {
        this.degradationLevel = 'normal';
        this.clearAllDegradations();
        console.log('🔄 Performance monitoring integration reset');
    }
    
    /**
     * Stop monitoring
     */
    stopMonitoring() {
        this.monitoring = false;
        if (this.evaluationInterval) {
            clearInterval(this.evaluationInterval);
            this.evaluationInterval = null;
        }
        console.log('⏹️ Performance monitoring integration stopped');
    }
    
    /**
     * Cleanup and destroy
     */
    destroy() {
        this.stopMonitoring();
        this.reset();
        this.performanceHistory = [];
        console.log('💀 Performance monitoring integration destroyed');
    }
}

// Create global instance
const performanceMonitoringIntegration = new PerformanceMonitoringIntegration();

// Auto-start monitoring
performanceMonitoringIntegration.startMonitoring();

// Make it globally available
window.performanceMonitoringIntegration = performanceMonitoringIntegration;

// Add global debugging functions
window.PERF_OVERRIDE = (level) => performanceMonitoringIntegration.manualOverride(level);
window.PERF_RESET = () => performanceMonitoringIntegration.reset();
window.PERF_REPORT = () => {
    const report = performanceMonitoringIntegration.getReport();
    console.table(report);
    return report;
};

console.log('📊 Performance Monitoring Integration loaded');
console.log('🔧 Debug commands: PERF_OVERRIDE(level), PERF_RESET(), PERF_REPORT()');

export default performanceMonitoringIntegration;