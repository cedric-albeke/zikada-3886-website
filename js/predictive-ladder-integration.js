/**
 * Predictive Performance Ladder Integration for ZIKADA 3886
 * 
 * Proactive performance management through:
 * - Early warning system integration with performance ladder
 * - Preemptive state transitions before critical thresholds
 * - Smart transition timing based on predicted degradation
 * - Coordination between predictive alerts and performance states
 * - Rollback mechanisms for false positive predictions
 */

import featureFlags from './feature-flags.js';

class PredictiveLadderIntegration {
    constructor() {
        this.isActive = false;
        this.debugMode = featureFlags.isEnabled('debugMetrics');
        
        // Integration state
        this.currentLadderState = 'S0';
        this.predictedTransitions = [];
        this.transitionHistory = [];
        this.rollbackQueue = [];
        
        // Proactive transition configuration
        this.config = {
            // Early transition thresholds
            earlyWarningBuffer: 5000,    // 5s buffer before predicted critical
            preemptiveThreshold: 0.7,    // 70% confidence required
            maxEarlyTransitions: 3,      // Max early transitions per minute
            
            // Rollback settings
            rollbackWindow: 10000,       // 10s window for rollback validation
            falsePositiveThreshold: 0.3, // 30% threshold for false positive
            rollbackCooldown: 15000,     // 15s cooldown after rollback
            
            // State transition mappings
            stateTransitions: {
                'S0': { next: 'S1', early: 'S1', emergency: 'S2' },
                'S1': { next: 'S2', early: 'S2', emergency: 'S3' },
                'S2': { next: 'S3', early: 'S3', emergency: 'S4' },
                'S3': { next: 'S4', early: 'S4', emergency: 'S5' },
                'S4': { next: 'S5', early: 'S5', emergency: 'S5' },
                'S5': { next: 'S5', early: 'S5', emergency: 'S5' }
            },
            
            // FPS thresholds for validation
            fpsThresholds: {
                'S0': 55, 'S1': 45, 'S2': 35, 
                'S3': 25, 'S4': 20, 'S5': 15
            }
        };
        
        // Transition statistics
        this.stats = {
            proactiveTransitions: 0,
            successfulPredictions: 0,
            falsePositives: 0,
            rollbacks: 0,
            preventedCritical: 0,
            averageEarlyWarning: 0
        };
        
        // Timing analysis
        this.transitionTiming = {
            lastTransition: 0,
            transitionCount: 0,
            earlyTransitionCount: 0,
            transitionRate: 0
        };
        
        console.log('🎯 Predictive Ladder Integration initialized');
    }
    
    /**
     * Start predictive ladder integration
     */
    start() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.setupEventListeners();
        
        console.log('🎯 Predictive Ladder Integration started');
        this.emitEvent('predictive-ladder:started', {
            config: this.config,
            currentState: this.currentLadderState
        });
    }
    
    /**
     * Stop predictive integration
     */
    stop() {
        if (!this.isActive) return;
        
        this.isActive = false;
        console.log('🎯 Predictive Ladder Integration stopped');
        this.emitEvent('predictive-ladder:stopped', { stats: this.getStats() });
    }
    
    /**
     * Setup event listeners for predictive alerts and performance state changes
     */
    setupEventListeners() {
        // Listen for predictive alerts
        window.addEventListener('predictive:alert:warning', (event) => {
            if (this.isActive) {
                this.handlePredictiveAlert('warning', event.detail);
            }
        });
        
        window.addEventListener('predictive:alert:critical', (event) => {
            if (this.isActive) {
                this.handlePredictiveAlert('critical', event.detail);
            }
        });
        
        window.addEventListener('predictive:alert:emergency', (event) => {
            if (this.isActive) {
                this.handlePredictiveAlert('emergency', event.detail);
            }
        });
        
        // Listen for proactive action requests
        window.addEventListener('predictive:action:early-transition', (event) => {
            if (this.isActive) {
                this.handleEarlyTransitionRequest(event.detail);
            }
        });
        
        window.addEventListener('predictive:action:immediate-transition', (event) => {
            if (this.isActive) {
                this.handleImmediateTransitionRequest(event.detail);
            }
        });
        
        window.addEventListener('predictive:action:emergency', (event) => {
            if (this.isActive) {
                this.handleEmergencyTransitionRequest(event.detail);
            }
        });
        
        // Listen for performance state changes
        window.addEventListener('performance:state:changed', (event) => {
            this.recordStateTransition(event.detail);
        });
        
        // Listen for performance ladder updates
        window.addEventListener('performance:ladder:update', (event) => {
            this.updateLadderState(event.detail);
        });
        
        // Listen for FPS updates for validation
        window.addEventListener('performance:fps:update', (event) => {
            if (this.isActive) {
                this.validatePredictions(event.detail.fps, event.detail.timestamp);
            }
        });
        
        if (this.debugMode) {
            console.log('🎯 Event listeners initialized');
        }
    }
    
    /**
     * Handle predictive alerts and determine proactive actions
     */
    handlePredictiveAlert(alertLevel, alertData) {
        const currentTime = performance.now();
        const { timeToDegrade, confidence, currentFPS, trend } = alertData;
        
        if (this.debugMode) {
            console.log(`🎯 Handling ${alertLevel} alert:`, alertData);
        }
        
        // Check if we should take proactive action
        const shouldAct = this.shouldTakeProactiveAction(alertLevel, alertData);
        
        if (!shouldAct) {
            if (this.debugMode) {
                console.log('🎯 No proactive action needed');
            }
            return;
        }
        
        // Determine transition type and target state
        const transitionPlan = this.planProactiveTransition(alertLevel, alertData);
        
        if (transitionPlan) {
            this.executeProactiveTransition(transitionPlan, alertData);
        }
    }
    
    /**
     * Determine if proactive action should be taken
     */
    shouldTakeProactiveAction(alertLevel, alertData) {
        const currentTime = performance.now();
        const { confidence, timeToDegrade } = alertData;
        
        // Check confidence threshold
        if (confidence < this.config.preemptiveThreshold * 100) {
            return false;
        }
        
        // Check if we're in cooldown period
        if (this.isInTransitionCooldown()) {
            return false;
        }
        
        // Check rate limiting
        if (this.isTransitionRateLimited()) {
            return false;
        }
        
        // Check time buffer
        if (timeToDegrade > 0 && timeToDegrade < this.config.earlyWarningBuffer) {
            return true;
        }
        
        // Emergency alerts should always trigger action
        if (alertLevel === 'emergency') {
            return true;
        }
        
        // Critical alerts with high confidence
        if (alertLevel === 'critical' && confidence > 80) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Check if we're in transition cooldown
     */
    isInTransitionCooldown() {
        const timeSinceLastTransition = performance.now() - this.transitionTiming.lastTransition;
        const timeSinceLastRollback = this.rollbackQueue.length > 0 ? 
            performance.now() - this.rollbackQueue[this.rollbackQueue.length - 1].timestamp : 
            Infinity;
        
        return timeSinceLastTransition < 3000 || // 3s cooldown between transitions
               timeSinceLastRollback < this.config.rollbackCooldown;
    }
    
    /**
     * Check if transition rate is limited
     */
    isTransitionRateLimited() {
        const oneMinuteAgo = performance.now() - 60000;
        const recentEarlyTransitions = this.transitionHistory.filter(
            t => t.timestamp > oneMinuteAgo && t.type === 'early'
        ).length;
        
        return recentEarlyTransitions >= this.config.maxEarlyTransitions;
    }
    
    /**
     * Plan proactive transition based on alert data
     */
    planProactiveTransition(alertLevel, alertData) {
        const { timeToDegrade, confidence, currentFPS } = alertData;
        const currentTransitions = this.config.stateTransitions[this.currentLadderState];
        
        if (!currentTransitions) {
            console.warn(`🎯 No transitions defined for state: ${this.currentLadderState}`);
            return null;
        }
        
        let targetState;
        let transitionType;
        let urgency;
        
        switch (alertLevel) {
            case 'warning':
                // Early transition to next state
                targetState = currentTransitions.early;
                transitionType = 'early';
                urgency = 'low';
                break;
                
            case 'critical':
                // Immediate transition, potentially skipping one state
                targetState = timeToDegrade < 2000 ? 
                    currentTransitions.emergency : 
                    currentTransitions.next;
                transitionType = 'immediate';
                urgency = 'high';
                break;
                
            case 'emergency':
                // Emergency transition to safe state
                targetState = currentTransitions.emergency;
                transitionType = 'emergency';
                urgency = 'critical';
                break;
                
            default:
                return null;
        }
        
        // Validate target state
        if (targetState === this.currentLadderState) {
            if (this.debugMode) {
                console.log('🎯 Already in target state, no transition needed');
            }
            return null;
        }
        
        return {
            targetState,
            transitionType,
            urgency,
            alertLevel,
            confidence,
            timeToDegrade,
            currentFPS,
            timestamp: performance.now(),
            reason: `Predictive ${alertLevel} alert`
        };
    }
    
    /**
     * Execute proactive transition
     */
    executeProactiveTransition(plan, alertData) {
        const { targetState, transitionType, urgency, reason } = plan;
        
        console.log(`🎯 Executing ${transitionType} transition: ${this.currentLadderState} → ${targetState}`);
        
        // Record planned transition
        this.predictedTransitions.push({
            ...plan,
            executed: performance.now(),
            validated: false
        });
        
        // Update statistics
        this.stats.proactiveTransitions++;
        this.transitionTiming.earlyTransitionCount++;
        
        // Emit transition request
        this.emitEvent('predictive-ladder:transition-request', {
            from: this.currentLadderState,
            to: targetState,
            type: transitionType,
            urgency,
            reason,
            confidence: plan.confidence,
            timeToDegrade: plan.timeToDegrade,
            timestamp: plan.timestamp
        });
        
        // Schedule rollback validation
        this.scheduleRollbackValidation(plan, alertData);
        
        // Update timing
        this.transitionTiming.lastTransition = performance.now();
        this.transitionTiming.transitionCount++;
        this.updateTransitionRate();
    }
    
    /**
     * Handle specific transition request types
     */
    handleEarlyTransitionRequest(requestData) {
        if (this.debugMode) {
            console.log('🎯 Early transition requested:', requestData);
        }
        
        const plan = this.planProactiveTransition('warning', requestData.alertData);
        if (plan) {
            this.executeProactiveTransition(plan, requestData.alertData);
        }
    }
    
    handleImmediateTransitionRequest(requestData) {
        if (this.debugMode) {
            console.log('🎯 Immediate transition requested:', requestData);
        }
        
        const plan = this.planProactiveTransition('critical', requestData.alertData);
        if (plan) {
            this.executeProactiveTransition(plan, requestData.alertData);
        }
    }
    
    handleEmergencyTransitionRequest(requestData) {
        console.log('🎯 Emergency transition requested:', requestData);
        
        const plan = this.planProactiveTransition('emergency', requestData.alertData);
        if (plan) {
            this.executeProactiveTransition(plan, requestData.alertData);
        }
    }
    
    /**
     * Schedule rollback validation for proactive transitions
     */
    scheduleRollbackValidation(plan, alertData) {
        const validationTimeout = setTimeout(() => {
            this.validateAndRollback(plan, alertData);
        }, this.config.rollbackWindow);
        
        this.rollbackQueue.push({
            plan,
            alertData,
            timeout: validationTimeout,
            timestamp: performance.now(),
            validated: false
        });
        
        // Clean up old rollback entries
        this.cleanupRollbackQueue();
    }
    
    /**
     * Validate predictions and potentially rollback
     */
    validateAndRollback(plan, alertData) {
        const currentTime = performance.now();
        const timeSinceTransition = currentTime - plan.timestamp;
        
        // Find the rollback entry
        const rollbackIndex = this.rollbackQueue.findIndex(r => 
            r.plan.timestamp === plan.timestamp && !r.validated
        );
        
        if (rollbackIndex === -1) return;
        
        const rollbackEntry = this.rollbackQueue[rollbackIndex];
        rollbackEntry.validated = true;
        
        // Check if prediction was accurate
        const wasAccurate = this.validatePredictionAccuracy(plan, alertData);
        
        if (wasAccurate) {
            this.stats.successfulPredictions++;
            this.stats.preventedCritical++;
            
            if (this.debugMode) {
                console.log('🎯 Proactive transition validated as successful');
            }
        } else {
            this.stats.falsePositives++;
            
            console.log('🎯 False positive detected, considering rollback');
            
            // Check if we should rollback
            if (this.shouldRollback(plan, alertData)) {
                this.performRollback(plan, rollbackEntry);
            }
        }
        
        // Update early warning average
        this.updateEarlyWarningStats(plan, wasAccurate);
    }
    
    /**
     * Validate prediction accuracy
     */
    validatePredictionAccuracy(plan, alertData) {
        const currentTime = performance.now();
        const { timeToDegrade, currentFPS } = alertData;
        const { targetState, confidence } = plan;
        
        // Get current FPS threshold for validation
        const expectedThreshold = this.config.fpsThresholds[targetState];
        
        // Check recent FPS data
        const recentFPSData = this.getRecentFPSData(5000); // Last 5 seconds
        
        if (recentFPSData.length === 0) {
            return true; // Assume accurate if no data
        }
        
        const avgRecentFPS = recentFPSData.reduce((sum, d) => sum + d.fps, 0) / recentFPSData.length;
        const minRecentFPS = Math.min(...recentFPSData.map(d => d.fps));
        
        // Prediction was accurate if:
        // 1. Average FPS dropped below threshold
        // 2. Minimum FPS dropped significantly
        // 3. FPS trend continued downward
        
        const fpsDropped = avgRecentFPS < expectedThreshold + 5; // 5 FPS buffer
        const significantDrop = currentFPS - minRecentFPS > 10;
        const trendContinued = this.checkTrendContinuation(plan.timestamp);
        
        return fpsDropped || significantDrop || trendContinued;
    }
    
    /**
     * Check if downward trend continued after transition
     */
    checkTrendContinuation(transitionTime) {
        // This would integrate with the trend analysis system
        // For now, return true as a placeholder
        return true;
    }
    
    /**
     * Get recent FPS data for validation
     */
    getRecentFPSData(windowMs) {
        // This would integrate with the FPS monitoring system
        // Return mock data for now
        return [];
    }
    
    /**
     * Determine if rollback is needed
     */
    shouldRollback(plan, alertData) {
        const { confidence, currentFPS } = alertData;
        const { targetState } = plan;
        
        // Don't rollback emergency transitions
        if (plan.transitionType === 'emergency') {
            return false;
        }
        
        // Don't rollback if confidence was very high
        if (confidence > 90) {
            return false;
        }
        
        // Check if current performance is actually good
        const currentThreshold = this.config.fpsThresholds[this.currentLadderState];
        const targetThreshold = this.config.fpsThresholds[targetState];
        
        // Rollback if current FPS is well above target threshold
        return currentFPS > targetThreshold + 15;
    }
    
    /**
     * Perform rollback to previous state
     */
    performRollback(plan, rollbackEntry) {
        const previousState = this.findPreviousState(plan.targetState);
        
        if (!previousState) {
            console.warn('🎯 Cannot determine previous state for rollback');
            return;
        }
        
        console.log(`🎯 Rolling back transition: ${plan.targetState} → ${previousState}`);
        
        this.stats.rollbacks++;
        
        // Emit rollback request
        this.emitEvent('predictive-ladder:rollback-request', {
            from: plan.targetState,
            to: previousState,
            reason: 'False positive prediction',
            originalTransition: plan,
            timestamp: performance.now()
        });
        
        // Update rollback entry
        rollbackEntry.rolledBack = true;
        rollbackEntry.rollbackTime = performance.now();
    }
    
    /**
     * Find previous state in ladder hierarchy
     */
    findPreviousState(currentState) {
        const stateOrder = ['S5', 'S4', 'S3', 'S2', 'S1', 'S0'];
        const currentIndex = stateOrder.indexOf(currentState);
        
        if (currentIndex > 0 && currentIndex < stateOrder.length) {
            return stateOrder[currentIndex + 1];
        }
        
        return null;
    }
    
    /**
     * Update early warning statistics
     */
    updateEarlyWarningStats(plan, wasAccurate) {
        const earlyWarningTime = plan.timeToDegrade || 0;
        
        if (wasAccurate && earlyWarningTime > 0) {
            // Update running average
            const currentAvg = this.stats.averageEarlyWarning;
            const count = this.stats.successfulPredictions;
            
            this.stats.averageEarlyWarning = count > 0 ? 
                ((currentAvg * (count - 1)) + earlyWarningTime) / count : 
                earlyWarningTime;
        }
    }
    
    /**
     * Clean up old rollback queue entries
     */
    cleanupRollbackQueue() {
        const cutoffTime = performance.now() - (this.config.rollbackWindow * 2);
        
        this.rollbackQueue = this.rollbackQueue.filter(entry => {
            if (entry.timestamp < cutoffTime) {
                if (entry.timeout) {
                    clearTimeout(entry.timeout);
                }
                return false;
            }
            return true;
        });
    }
    
    /**
     * Record state transition from performance ladder
     */
    recordStateTransition(transitionData) {
        const { from, to, type } = transitionData;
        
        // Update current state
        this.currentLadderState = to;
        
        // Record in history
        this.transitionHistory.push({
            from,
            to,
            type,
            timestamp: performance.now(),
            predictive: type === 'predictive' || type === 'early' || type === 'emergency'
        });
        
        // Maintain history size
        if (this.transitionHistory.length > 100) {
            this.transitionHistory.shift();
        }
        
        // Update timing
        this.transitionTiming.lastTransition = performance.now();
        this.updateTransitionRate();
        
        if (this.debugMode) {
            console.log(`🎯 State transition recorded: ${from} → ${to} (${type})`);
        }
    }
    
    /**
     * Update ladder state from external source
     */
    updateLadderState(ladderData) {
        if (ladderData.state && ladderData.state !== this.currentLadderState) {
            this.currentLadderState = ladderData.state;
            
            if (this.debugMode) {
                console.log(`🎯 Ladder state updated: ${ladderData.state}`);
            }
        }
    }
    
    /**
     * Update transition rate statistics
     */
    updateTransitionRate() {
        const fiveMinutesAgo = performance.now() - 300000;
        const recentTransitions = this.transitionHistory.filter(
            t => t.timestamp > fiveMinutesAgo
        ).length;
        
        this.transitionTiming.transitionRate = recentTransitions / 5; // Transitions per minute
    }
    
    /**
     * Validate current predictions against actual FPS
     */
    validatePredictions(currentFPS, timestamp) {
        // Find recent predictions to validate
        const recentPredictions = this.predictedTransitions.filter(
            p => !p.validated && (timestamp - p.timestamp) < this.config.rollbackWindow
        );
        
        for (const prediction of recentPredictions) {
            const expectedThreshold = this.config.fpsThresholds[prediction.targetState];
            
            if (currentFPS < expectedThreshold) {
                // Prediction was accurate
                prediction.validated = true;
                prediction.accuracy = 'correct';
                this.stats.successfulPredictions++;
            }
        }
    }
    
    /**
     * Get comprehensive statistics
     */
    getStats() {
        const totalPredictions = this.stats.successfulPredictions + this.stats.falsePositives;
        const accuracy = totalPredictions > 0 ? 
            (this.stats.successfulPredictions / totalPredictions) * 100 : 0;
        
        return {
            ...this.stats,
            accuracy: accuracy.toFixed(1),
            currentState: this.currentLadderState,
            transitionRate: this.transitionTiming.transitionRate.toFixed(2),
            rollbackRate: this.stats.rollbacks > 0 ? 
                ((this.stats.rollbacks / this.stats.proactiveTransitions) * 100).toFixed(1) : '0',
            pendingRollbacks: this.rollbackQueue.filter(r => !r.validated).length,
            recentTransitions: this.transitionHistory.slice(-5),
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
     * Reset integration state
     */
    reset() {
        // Clear timeouts
        this.rollbackQueue.forEach(entry => {
            if (entry.timeout) {
                clearTimeout(entry.timeout);
            }
        });
        
        this.predictedTransitions = [];
        this.transitionHistory = [];
        this.rollbackQueue = [];
        
        this.stats = {
            proactiveTransitions: 0,
            successfulPredictions: 0,
            falsePositives: 0,
            rollbacks: 0,
            preventedCritical: 0,
            averageEarlyWarning: 0
        };
        
        this.transitionTiming = {
            lastTransition: 0,
            transitionCount: 0,
            earlyTransitionCount: 0,
            transitionRate: 0
        };
        
        console.log('🎯 Predictive Ladder Integration reset');
    }
    
    /**
     * Cleanup and destroy
     */
    destroy() {
        this.stop();
        this.reset();
        
        console.log('💀 Predictive Ladder Integration destroyed');
    }
}

// Create singleton instance
const predictiveLadderIntegration = new PredictiveLadderIntegration();

// Expose for debugging
if (typeof window !== 'undefined') {
    window.PREDICTIVE_LADDER_INTEGRATION = predictiveLadderIntegration;
}

export default predictiveLadderIntegration;