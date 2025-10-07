/**
 * Predictive Performance Alerting System for ZIKADA 3886
 * 
 * Advanced performance intelligence with:
 * - FPS derivative calculations for trend detection
 * - Early warning system before critical performance drops
 * - Pattern recognition for common degradation scenarios
 * - Proactive performance ladder state transitions
 * - Historical performance data analysis
 */

import featureFlags from './feature-flags.js';
import { createLogger } from './utils/logger.js';

// Create namespaced logger
const log = createLogger('alert');

class PredictivePerformanceAlerting {
    constructor() {
        this.isActive = false;
        this.debugMode = featureFlags.isEnabled('debugMetrics');
        
        // FPS derivative tracking
        this.fpsHistory = [];
        this.fpsDerivatives = [];
        this.derivativeWindow = 10; // 10 samples for derivative calculation
        this.maxHistorySize = 300; // 5 minutes at 60 FPS
        
        // Alert thresholds (FPS per second)
        this.alertThresholds = {
            warning: -3,     // -3 FPS/second decline
            critical: -8,    // -8 FPS/second decline
            emergency: -15   // -15 FPS/second decline
        };
        
        // Pattern recognition
        this.performancePatterns = new Map();
        this.patternBuffer = [];
        this.patternBufferSize = 30; // 30 samples for pattern detection
        
        // Anomaly detection
        this.baselineFPS = 60;
        this.fpsVarianceThreshold = 5; // FPS variance threshold
        this.anomalyScore = 0;
        this.maxAnomalyScore = 100;
        
        // Prediction state
        this.currentTrend = 'stable';
        this.predictionConfidence = 0;
        this.timeToDegrade = 0; // Predicted time until performance degrades
        
        // Alert state
        this.lastAlert = { level: 'none', timestamp: 0 };
        this.alertCooldown = 5000; // 5s cooldown between alerts
        this.consecutiveWarnings = 0;
        
        // Statistics
        this.stats = {
            totalPredictions: 0,
            correctPredictions: 0,
            falsePositives: 0,
            alertsTriggered: 0,
            proactiveActions: 0
        };
        
        log.once('alert:init', () => {
            log.info('Predictive Performance Alerting initialized', {
                thresholds: this.alertThresholds,
                derivativeWindow: this.derivativeWindow
            });
        });
    }
    
    /**
     * Start predictive performance monitoring
     */
    start() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.setupPerformanceIntegration();
        
        log.once('alert:start', () => {
            log.info('Predictive Performance Alerting started');
        });
        this.emitEvent('predictive:started', {
            thresholds: this.alertThresholds,
            patternCount: this.performancePatterns.size
        });
    }
    
    /**
     * Stop predictive monitoring
     */
    stop() {
        if (!this.isActive) return;
        
        this.isActive = false;
        log.info('Predictive Performance Alerting stopped');
        this.emitEvent('predictive:stopped', { stats: this.getStats() });
    }
    
    /**
     * Setup integration with performance systems
     */
    setupPerformanceIntegration() {
        // Listen for FPS updates from performance systems
        window.addEventListener('performance:fps:update', (event) => {
            if (this.isActive) {
                this.updateFPS(event.detail.fps, event.detail.timestamp || performance.now());
            }
        });
        
        // Listen for performance state changes
        window.addEventListener('performance:state:changed', (event) => {
            this.recordStateTransition(event.detail);
        });
        
        // Listen for memory warnings
        window.addEventListener('memory:warning', () => {
            this.recordPerformanceEvent('memory_warning');
        });
        
        log.debug('Performance integration initialized');
    }
    
    /**
     * Update FPS and perform predictive analysis
     */
    updateFPS(fps, timestamp = performance.now()) {
        if (!this.isActive || typeof fps !== 'number') return;
        
        // Add to history
        this.fpsHistory.push({ fps, timestamp });
        
        // Maintain history size
        if (this.fpsHistory.length > this.maxHistorySize) {
            this.fpsHistory.shift();
        }
        
        // Calculate derivatives
        this.calculateDerivatives();
        
        // Update pattern buffer
        this.updatePatternBuffer(fps, timestamp);
        
        // Perform predictive analysis
        this.performPredictiveAnalysis();
        
        // Check for alerts
        this.checkAlertConditions(fps, timestamp);
    }
    
    /**
     * Calculate FPS derivatives (rate of change)
     */
    calculateDerivatives() {
        if (this.fpsHistory.length < this.derivativeWindow) return;
        
        const recent = this.fpsHistory.slice(-this.derivativeWindow);
        
        // Calculate average FPS change over time
        let totalChange = 0;
        let totalTime = 0;
        
        for (let i = 1; i < recent.length; i++) {
            const fpsChange = recent[i].fps - recent[i-1].fps;
            const timeChange = (recent[i].timestamp - recent[i-1].timestamp) / 1000; // Convert to seconds
            
            if (timeChange > 0) {
                totalChange += fpsChange;
                totalTime += timeChange;
            }
        }
        
        if (totalTime > 0) {
            const derivative = totalChange / totalTime; // FPS per second
            
            this.fpsDerivatives.push({
                value: derivative,
                timestamp: performance.now()
            });
            
            // Maintain derivatives history
            if (this.fpsDerivatives.length > this.maxHistorySize) {
                this.fpsDerivatives.shift();
            }
            
            // Log FPS derivative occasionally with throttling
            log.throttle('alert:derivative', 5000, () => {
                log.debug(`FPS Derivative: ${derivative.toFixed(2)} FPS/s`);
            });
        }
    }
    
    /**
     * Update pattern buffer for pattern recognition
     */
    updatePatternBuffer(fps, timestamp) {
        this.patternBuffer.push({ fps, timestamp, derivative: this.getCurrentDerivative() });
        
        if (this.patternBuffer.length > this.patternBufferSize) {
            this.patternBuffer.shift();
        }
        
        // Analyze patterns when buffer is full
        if (this.patternBuffer.length === this.patternBufferSize) {
            this.analyzePerformancePatterns();
        }
    }
    
    /**
     * Get current FPS derivative
     */
    getCurrentDerivative() {
        if (this.fpsDerivatives.length === 0) return 0;
        return this.fpsDerivatives[this.fpsDerivatives.length - 1].value;
    }
    
    /**
     * Perform comprehensive predictive analysis
     */
    performPredictiveAnalysis() {
        if (this.fpsHistory.length < 10) return;
        
        // Update trend analysis
        this.updateTrendAnalysis();
        
        // Calculate anomaly score
        this.calculateAnomalyScore();
        
        // Predict time to performance degradation
        this.predictTimeToDegrade();
        
        // Update prediction statistics
        this.stats.totalPredictions++;
    }
    
    /**
     * Update performance trend analysis
     */
    updateTrendAnalysis() {
        const currentDerivative = this.getCurrentDerivative();
        const recentDerivatives = this.fpsDerivatives.slice(-5);
        
        if (recentDerivatives.length < 3) {
            this.currentTrend = 'stable';
            this.predictionConfidence = 0;
            return;
        }
        
        // Calculate average derivative
        const avgDerivative = recentDerivatives.reduce((sum, d) => sum + d.value, 0) / recentDerivatives.length;
        
        // Calculate trend consistency
        const variance = recentDerivatives.reduce((sum, d) => sum + Math.pow(d.value - avgDerivative, 2), 0) / recentDerivatives.length;
        const consistency = Math.max(0, 1 - (variance / 10)); // Lower variance = higher consistency
        
        // Determine trend
        if (avgDerivative < -1) {
            this.currentTrend = 'declining';
            this.predictionConfidence = Math.min(1, Math.abs(avgDerivative) / 10 * consistency);
        } else if (avgDerivative > 1) {
            this.currentTrend = 'improving';
            this.predictionConfidence = Math.min(1, avgDerivative / 10 * consistency);
        } else {
            this.currentTrend = 'stable';
            this.predictionConfidence = consistency;
        }
        
        if (this.debugMode && this.stats.totalPredictions % 60 === 0) {
            console.log(`🔮 Trend: ${this.currentTrend} (confidence: ${(this.predictionConfidence * 100).toFixed(1)}%)`);
        }
    }
    
    /**
     * Calculate anomaly score based on performance patterns
     */
    calculateAnomalyScore() {
        if (this.fpsHistory.length < 30) return;
        
        const recent = this.fpsHistory.slice(-30);
        const currentFPS = recent[recent.length - 1].fps;
        
        // Calculate various anomaly indicators
        let anomalyFactors = 0;
        let factorCount = 0;
        
        // 1. Deviation from baseline
        const baselineDeviation = Math.abs(currentFPS - this.baselineFPS);
        if (baselineDeviation > this.fpsVarianceThreshold) {
            anomalyFactors += Math.min(1, baselineDeviation / 30);
            factorCount++;
        }
        
        // 2. Sudden FPS drops
        const recentDrops = recent.slice(-5);
        for (let i = 1; i < recentDrops.length; i++) {
            const drop = recentDrops[i-1].fps - recentDrops[i].fps;
            if (drop > 10) { // Sudden 10+ FPS drop
                anomalyFactors += Math.min(1, drop / 30);
                factorCount++;
            }
        }
        
        // 3. Derivative magnitude
        const currentDerivative = this.getCurrentDerivative();
        if (Math.abs(currentDerivative) > 2) {
            anomalyFactors += Math.min(1, Math.abs(currentDerivative) / 20);
            factorCount++;
        }
        
        // 4. FPS volatility
        const fpsMean = recent.reduce((sum, h) => sum + h.fps, 0) / recent.length;
        const fpsVariance = recent.reduce((sum, h) => sum + Math.pow(h.fps - fpsMean, 2), 0) / recent.length;
        if (fpsVariance > 25) { // High FPS variance
            anomalyFactors += Math.min(1, fpsVariance / 100);
            factorCount++;
        }
        
        // Calculate final anomaly score
        this.anomalyScore = factorCount > 0 ? 
            Math.min(this.maxAnomalyScore, (anomalyFactors / factorCount) * 100) : 0;
    }
    
    /**
     * Predict time until performance degradation
     */
    predictTimeToDegrade() {
        if (this.currentTrend !== 'declining' || this.predictionConfidence < 0.3) {
            this.timeToDegrade = 0;
            return;
        }
        
        const currentFPS = this.fpsHistory.length > 0 ? 
            this.fpsHistory[this.fpsHistory.length - 1].fps : 60;
        const currentDerivative = this.getCurrentDerivative();
        
        if (currentDerivative >= 0) {
            this.timeToDegrade = 0;
            return;
        }
        
        // Calculate time to reach critical FPS levels
        const criticalFPS = 30; // Consider 30 FPS as critical threshold
        const fpsToDegrade = currentFPS - criticalFPS;
        
        if (fpsToDegrade <= 0) {
            this.timeToDegrade = 0; // Already critical
            return;
        }
        
        // Time = distance / rate
        this.timeToDegrade = Math.abs(fpsToDegrade / currentDerivative) * 1000; // Convert to ms
        
        if (this.debugMode && this.timeToDegrade > 0 && this.timeToDegrade < 30000) {
            console.log(`🔮 Predicted degradation in ${(this.timeToDegrade / 1000).toFixed(1)}s`);
        }
    }
    
    /**
     * Analyze performance patterns for recognition
     */
    analyzePerformancePatterns() {
        if (this.patternBuffer.length < this.patternBufferSize) return;
        
        // Extract pattern features
        const pattern = this.extractPatternFeatures(this.patternBuffer);
        
        // Check against known patterns
        const matchedPattern = this.matchKnownPattern(pattern);
        
        if (matchedPattern) {
            this.handlePatternMatch(matchedPattern, pattern);
        } else {
            // Learn new pattern if it's significant
            if (this.isSignificantPattern(pattern)) {
                this.learnNewPattern(pattern);
            }
        }
    }
    
    /**
     * Extract features from performance pattern
     */
    extractPatternFeatures(buffer) {
        const features = {
            avgFPS: buffer.reduce((sum, b) => sum + b.fps, 0) / buffer.length,
            fpsVariance: 0,
            trendDirection: 0,
            volatility: 0,
            dropCount: 0,
            maxDrop: 0
        };
        
        // Calculate FPS variance
        const fpsMean = features.avgFPS;
        features.fpsVariance = buffer.reduce((sum, b) => sum + Math.pow(b.fps - fpsMean, 2), 0) / buffer.length;
        
        // Calculate trend direction
        const firstHalf = buffer.slice(0, buffer.length / 2);
        const secondHalf = buffer.slice(buffer.length / 2);
        const firstAvg = firstHalf.reduce((sum, b) => sum + b.fps, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, b) => sum + b.fps, 0) / secondHalf.length;
        features.trendDirection = secondAvg - firstAvg;
        
        // Count significant FPS drops
        for (let i = 1; i < buffer.length; i++) {
            const drop = buffer[i-1].fps - buffer[i].fps;
            if (drop > 5) {
                features.dropCount++;
                features.maxDrop = Math.max(features.maxDrop, drop);
            }
        }
        
        // Calculate volatility (derivative variance)
        const derivatives = buffer.map(b => b.derivative || 0);
        const derivMean = derivatives.reduce((sum, d) => sum + d, 0) / derivatives.length;
        features.volatility = derivatives.reduce((sum, d) => sum + Math.pow(d - derivMean, 2), 0) / derivatives.length;
        
        return features;
    }
    
    /**
     * Match pattern against known performance patterns
     */
    matchKnownPattern(pattern) {
        const threshold = 0.8; // Similarity threshold
        let bestMatch = null;
        let bestScore = 0;
        
        for (const [patternName, knownPattern] of this.performancePatterns) {
            const similarity = this.calculatePatternSimilarity(pattern, knownPattern);
            if (similarity > bestScore && similarity >= threshold) {
                bestScore = similarity;
                bestMatch = { name: patternName, pattern: knownPattern, similarity };
            }
        }
        
        return bestMatch;
    }
    
    /**
     * Calculate similarity between two patterns
     */
    calculatePatternSimilarity(pattern1, pattern2) {
        const features = ['avgFPS', 'fpsVariance', 'trendDirection', 'volatility', 'dropCount', 'maxDrop'];
        let totalSimilarity = 0;
        
        for (const feature of features) {
            const val1 = pattern1[feature] || 0;
            const val2 = pattern2[feature] || 0;
            
            // Normalize similarity based on feature range
            let similarity = 1;
            if (val1 !== 0 || val2 !== 0) {
                similarity = 1 - Math.abs(val1 - val2) / Math.max(Math.abs(val1), Math.abs(val2), 1);
            }
            totalSimilarity += similarity;
        }
        
        return totalSimilarity / features.length;
    }
    
    /**
     * Handle when a known pattern is matched
     */
    handlePatternMatch(matchedPattern, currentPattern) {
        if (this.debugMode) {
            console.log(`🔮 Pattern matched: ${matchedPattern.name} (${(matchedPattern.similarity * 100).toFixed(1)}% similarity)`);
        }
        
        // Update pattern statistics
        matchedPattern.pattern.occurrences = (matchedPattern.pattern.occurrences || 0) + 1;
        matchedPattern.pattern.lastSeen = performance.now();
        
        // Emit pattern match event
        this.emitEvent('predictive:pattern:matched', {
            patternName: matchedPattern.name,
            similarity: matchedPattern.similarity,
            features: currentPattern
        });
    }
    
    /**
     * Check if pattern is significant enough to learn
     */
    isSignificantPattern(pattern) {
        return pattern.fpsVariance > 20 || 
               Math.abs(pattern.trendDirection) > 10 || 
               pattern.dropCount > 3 ||
               pattern.volatility > 5;
    }
    
    /**
     * Learn a new performance pattern
     */
    learnNewPattern(pattern) {
        const patternName = `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        this.performancePatterns.set(patternName, {
            ...pattern,
            createdAt: performance.now(),
            occurrences: 1,
            severity: this.calculatePatternSeverity(pattern)
        });
        
        if (this.debugMode) {
            console.log(`🔮 New pattern learned: ${patternName}`);
        }
        
        // Limit pattern storage
        if (this.performancePatterns.size > 20) {
            const oldestPattern = Array.from(this.performancePatterns.entries())
                .sort((a, b) => a[1].createdAt - b[1].createdAt)[0];
            this.performancePatterns.delete(oldestPattern[0]);
        }
    }
    
    /**
     * Calculate severity score for a pattern
     */
    calculatePatternSeverity(pattern) {
        let severity = 0;
        
        if (pattern.trendDirection < -10) severity += 30;
        if (pattern.dropCount > 5) severity += 25;
        if (pattern.maxDrop > 15) severity += 25;
        if (pattern.volatility > 10) severity += 20;
        
        return Math.min(100, severity);
    }
    
    /**
     * Check alert conditions and trigger warnings
     */
    checkAlertConditions(currentFPS, timestamp) {
        const currentDerivative = this.getCurrentDerivative();
        const timeSinceLastAlert = timestamp - this.lastAlert.timestamp;
        
        // Skip if in cooldown period (unless emergency)
        if (timeSinceLastAlert < this.alertCooldown && Math.abs(currentDerivative) < Math.abs(this.alertThresholds.emergency)) {
            return;
        }
        
        let alertLevel = 'none';
        
        // Determine alert level
        if (currentDerivative <= this.alertThresholds.emergency) {
            alertLevel = 'emergency';
        } else if (currentDerivative <= this.alertThresholds.critical) {
            alertLevel = 'critical';
        } else if (currentDerivative <= this.alertThresholds.warning) {
            alertLevel = 'warning';
        }
        
        // Factor in anomaly score
        if (this.anomalyScore > 70 && alertLevel === 'none') {
            alertLevel = 'warning';
        } else if (this.anomalyScore > 90 && alertLevel === 'warning') {
            alertLevel = 'critical';
        }
        
        // Factor in prediction confidence
        if (this.currentTrend === 'declining' && this.predictionConfidence > 0.8) {
            if (alertLevel === 'none') alertLevel = 'warning';
            else if (alertLevel === 'warning') alertLevel = 'critical';
        }
        
        // Trigger alert if level has changed or escalated
        if (alertLevel !== 'none' && (alertLevel !== this.lastAlert.level || timeSinceLastAlert > this.alertCooldown)) {
            this.triggerAlert(alertLevel, currentFPS, currentDerivative, timestamp);
        }
    }
    
    /**
     * Trigger performance alert
     */
    triggerAlert(level, currentFPS, derivative, timestamp) {
        this.lastAlert = { level, timestamp };
        this.stats.alertsTriggered++;
        
        const alertData = {
            level,
            currentFPS,
            derivative: derivative.toFixed(2),
            anomalyScore: this.anomalyScore.toFixed(1),
            trend: this.currentTrend,
            confidence: (this.predictionConfidence * 100).toFixed(1),
            timeToDegrade: this.timeToDegrade,
            timestamp
        };
        
        // Only show critical and emergency alerts as warnings, demote others to debug
        if (level === 'emergency' || level === 'critical') {
            log.warn(`Performance Alert [${level.toUpperCase()}]: FPS declining at ${derivative.toFixed(2)}/s`);
        } else {
            // Use throttling for warning-level alerts to prevent spam
            log.throttle('alert:warning', 10000, () => {
                log.debug(`Performance Alert [WARNING]: FPS declining at ${derivative.toFixed(2)}/s`);
            });
        }
        
        log.debug('Alert details:', alertData);
        
        // Emit alert event
        this.emitEvent(`predictive:alert:${level}`, alertData);
        
        // Trigger proactive actions based on alert level
        this.triggerProactiveActions(level, alertData);
        
        // Update consecutive warnings counter
        if (level === 'warning') {
            this.consecutiveWarnings++;
        } else {
            this.consecutiveWarnings = 0;
        }
    }
    
    /**
     * Trigger proactive performance actions
     */
    triggerProactiveActions(alertLevel, alertData) {
        this.stats.proactiveActions++;
        
        switch (alertLevel) {
            case 'warning':
                // Suggest early performance ladder transition
                this.emitEvent('predictive:action:early-transition', {
                    recommendedAction: 'prepare_degradation',
                    urgency: 'low',
                    alertData
                });
                break;
                
            case 'critical':
                // Trigger immediate performance ladder transition
                this.emitEvent('predictive:action:immediate-transition', {
                    recommendedAction: 'force_degradation',
                    urgency: 'high',
                    alertData
                });
                break;
                
            case 'emergency':
                // Trigger emergency performance measures
                this.emitEvent('predictive:action:emergency', {
                    recommendedAction: 'emergency_measures',
                    urgency: 'critical',
                    alertData
                });
                break;
        }
    }
    
    /**
     * Record performance state transition for learning
     */
    recordStateTransition(transitionData) {
        const { from, to, type, fps } = transitionData;
        
        // Record transition for pattern learning
        if (this.isActive && fps) {
            // Check if our prediction was correct
            if (this.currentTrend === 'declining' && (from === 'S0' || from === 'S1') && to !== 'S0') {
                this.stats.correctPredictions++;
            }
        }
        
        log.debug(`State transition recorded: ${from} → ${to} (${type})`);
    }
    
    /**
     * Record general performance events
     */
    recordPerformanceEvent(eventType, data = {}) {
        log.debug(`Performance event: ${eventType}`, data);
        
        this.emitEvent('predictive:event:recorded', {
            eventType,
            data,
            timestamp: performance.now()
        });
    }
    
    /**
     * Get comprehensive statistics
     */
    getStats() {
        const accuracy = this.stats.totalPredictions > 0 ? 
            (this.stats.correctPredictions / this.stats.totalPredictions) * 100 : 0;
        
        return {
            ...this.stats,
            accuracy: accuracy.toFixed(1),
            currentTrend: this.currentTrend,
            predictionConfidence: (this.predictionConfidence * 100).toFixed(1),
            anomalyScore: this.anomalyScore.toFixed(1),
            timeToDegrade: this.timeToDegrade,
            fpsHistorySize: this.fpsHistory.length,
            derivativesSize: this.fpsDerivatives.length,
            knownPatterns: this.performancePatterns.size,
            consecutiveWarnings: this.consecutiveWarnings,
            lastAlert: this.lastAlert,
            isActive: this.isActive
        };
    }
    
    /**
     * Emit events for system coordination
     */
    emitEvent(eventName, data) {
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            const event = new CustomEvent(eventName, { detail: data });
            window.dispatchEvent(event);
        }
    }
    
    /**
     * Reset system state
     */
    reset() {
        this.fpsHistory = [];
        this.fpsDerivatives = [];
        this.patternBuffer = [];
        this.anomalyScore = 0;
        this.currentTrend = 'stable';
        this.predictionConfidence = 0;
        this.timeToDegrade = 0;
        this.consecutiveWarnings = 0;
        this.lastAlert = { level: 'none', timestamp: 0 };
        
        console.log('🔮 Predictive system reset');
    }
    
    /**
     * Cleanup and destroy
     */
    destroy() {
        this.stop();
        this.performancePatterns.clear();
        this.fpsHistory = [];
        this.fpsDerivatives = [];
        this.patternBuffer = [];
        
        console.log('💀 Predictive Performance Alerting destroyed');
    }
}

// Create singleton instance
const predictivePerformanceAlerting = new PredictivePerformanceAlerting();

// Expose for debugging
if (typeof window !== 'undefined') {
    window.PREDICTIVE_PERFORMANCE_ALERTING = predictivePerformanceAlerting;
}

export default predictivePerformanceAlerting;