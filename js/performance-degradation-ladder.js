/**
 * Progressive Performance Degradation Ladder for ZIKADA 3886
 * 
 * Implements intelligent FPS-based performance degradation with smooth state transitions:
 * - S0 (Full): All features enabled (80+ FPS target)
 * - S1 (Reduced Post-processing): Less bloom, color grading, SSAO
 * - S2 (Fewer Particles): 50% particle count reduction
 * - S3 (Lower Pixel Ratio): Reduce to 1.0 from 1.25
 * - S4 (No Shadows): Disable shadow mapping
 * - S5 (Minimal): Basic geometry only, no effects
 * 
 * Recovery only occurs when 95+ FPS is sustained for 15s (hysteresis prevention)
 */

import featureFlags from './feature-flags.js';

class PerformanceDegradationLadder {
    constructor() {
        this.isActive = false;
        this.debugMode = featureFlags.isEnabled('debugMetrics');
        
        // Performance States (S0 = best, S5 = minimal)
        this.currentState = 'S0';
        this.previousState = 'S0';
        this.stateChangeTimestamp = 0;
        this.lastStateTransition = performance.now();
        
        // FPS Monitoring with EWMA (Exponentially Weighted Moving Average)
        this.fpsHistory = [];
        this.currentFPS = 60; // Start optimistic
        this.ewmaFPS = 60;
        this.ewmaAlpha = 0.1; // Smoothing factor (0.1 = slow response, 0.9 = fast)
        this.fpsWindowSize = 10000; // 10s trailing window (ms)
        this.minFPSSamples = 30; // Minimum samples before state decisions
        
        // Hysteresis and Timing
        this.hysteresisDelay = 15000; // 15s delay before recovery
        this.degradationDelay = 3000; // 3s confirmation before degradation
        this.lastDegradationCheck = 0;
        this.recoveryTimer = null;
        this.isInRecoveryWindow = false;
        
        // State Configuration
        this.stateThresholds = {
            S0: { minFPS: 75, maxFPS: Infinity },  // Full quality
            S1: { minFPS: 60, maxFPS: 75 },       // Reduce post-processing
            S2: { minFPS: 45, maxFPS: 60 },       // Fewer particles
            S3: { minFPS: 30, maxFPS: 45 },       // Lower pixel ratio
            S4: { minFPS: 20, maxFPS: 30 },       // No shadows
            S5: { minFPS: 0, maxFPS: 20 }         // Minimal mode
        };
        
        this.recoveryThreshold = 95; // FPS needed for recovery
        this.degradationBuffer = 5; // FPS buffer to prevent oscillation
        
        // State Implementations
        this.stateImplementations = new Map();
        this.renderer = null;
        this.scene = null;
        this.composer = null; // Post-processing composer
        
        // Performance tracking
        this.stateTransitionHistory = [];
        this.performanceMetrics = {
            totalStateChanges: 0,
            timeInStates: new Map(),
            averageFPSInStates: new Map()
        };
        
        // Initialize state implementations
        this.initializeStateImplementations();
        
        console.log('📊 Performance Degradation Ladder initialized');
        if (this.debugMode) {
            console.log('📊 State thresholds:', this.stateThresholds);
        }
    }
    
    /**
     * Start the performance monitoring and degradation system
     */
    start(renderer = null, scene = null, composer = null) {
        if (this.isActive) return;
        
        this.isActive = true;
        this.renderer = renderer;
        this.scene = scene;
        this.composer = composer;
        
        // Start FPS monitoring
        this.startFPSMonitoring();
        
        // Initialize with current state
        this.applyState(this.currentState, true);
        
        console.log('📊 Performance Degradation Ladder started');
        
        // Emit initialization event
        this.emitPerformanceEvent('performance:ladder:started', {
            initialState: this.currentState,
            thresholds: this.stateThresholds
        });
    }
    
    /**
     * Start FPS monitoring (called internally by start())
     */
    startFPSMonitoring() {
        // FPS monitoring is external - this method exists for consistency
        // The actual FPS values are fed via updateFPS() by the main animation loop
        console.log('📊 FPS monitoring ready - waiting for updateFPS() calls');
    }
    
    /**
     * Update FPS and check for state transitions
     */
    updateFPS(fps) {
        if (!this.isActive) return;
        
        const now = performance.now();
        this.currentFPS = fps;
        
        // Add to history with timestamp
        this.fpsHistory.push({ fps, timestamp: now });
        
        // Clean old entries (older than window)
        this.cleanOldFPSHistory(now);
        
        // Update EWMA
        this.updateEWMA(fps);
        
        // Check for state transitions
        this.checkStateTransition(now);
        
        // Update metrics
        this.updateMetrics(now);
    }
    
    /**
     * Clean FPS history older than window size
     */
    cleanOldFPSHistory(now) {
        const cutoff = now - this.fpsWindowSize;
        this.fpsHistory = this.fpsHistory.filter(entry => entry.timestamp > cutoff);
    }
    
    /**
     * Update Exponentially Weighted Moving Average FPS
     */
    updateEWMA(fps) {
        this.ewmaFPS = (this.ewmaAlpha * fps) + ((1 - this.ewmaAlpha) * this.ewmaFPS);
    }
    
    /**
     * Get current average FPS over the window
     */
    getAverageFPS() {
        if (this.fpsHistory.length < this.minFPSSamples) {
            return this.ewmaFPS; // Use EWMA if insufficient samples
        }
        
        const sum = this.fpsHistory.reduce((acc, entry) => acc + entry.fps, 0);
        return sum / this.fpsHistory.length;
    }
    
    /**
     * Check if state transition is needed
     */
    checkStateTransition(now) {
        if (this.fpsHistory.length < this.minFPSSamples) {
            return; // Need more samples
        }
        
        const avgFPS = this.getAverageFPS();
        const ewmaFPS = this.ewmaFPS;
        const effectiveFPS = Math.min(avgFPS, ewmaFPS); // Use more conservative estimate
        
        if (this.debugMode && now - this.lastDegradationCheck > 1000) {
            console.log(`📊 FPS Check: avg=${avgFPS.toFixed(1)}, ewma=${ewmaFPS.toFixed(1)}, effective=${effectiveFPS.toFixed(1)}, state=${this.currentState}`);
            this.lastDegradationCheck = now;
        }
        
        // Check if we need to degrade
        const needsDegradation = this.shouldDegrade(effectiveFPS, now);
        
        // Check if we can recover
        const canRecover = this.shouldRecover(effectiveFPS, now);
        
        if (needsDegradation && !this.isInRecoveryWindow) {
            this.considerDegradation(effectiveFPS, now);
        } else if (canRecover && !needsDegradation) {
            this.considerRecovery(effectiveFPS, now);
        }
    }
    
    /**
     * Determine if degradation is needed
     */
    shouldDegrade(fps, now) {
        const currentThreshold = this.stateThresholds[this.currentState];
        if (!currentThreshold) return false;
        
        // Add buffer to prevent oscillation
        return fps < (currentThreshold.minFPS - this.degradationBuffer);
    }
    
    /**
     * Determine if recovery is possible
     */
    shouldRecover(fps, now) {
        // Must exceed recovery threshold and be in a degraded state
        return fps > this.recoveryThreshold && this.currentState !== 'S0';
    }
    
    /**
     * Consider degrading to next worse state
     */
    considerDegradation(fps, now) {
        // Add confirmation delay to prevent rapid switching
        if (now - this.lastStateTransition < this.degradationDelay) {
            return;
        }
        
        const nextState = this.getNextDegradedState();
        if (nextState && nextState !== this.currentState) {
            this.transitionToState(nextState, 'degradation', { fps, reason: 'fps_below_threshold' });
        }
    }
    
    /**
     * Consider recovering to better state
     */
    considerRecovery(fps, now) {
        // Start recovery timer if not already running
        if (!this.recoveryTimer && !this.isInRecoveryWindow) {
            this.startRecoveryTimer(fps);
            return;
        }
        
        // If in recovery window and FPS drops, cancel recovery
        if (this.isInRecoveryWindow && fps < this.recoveryThreshold) {
            this.cancelRecovery('fps_dropped');
        }
    }
    
    /**
     * Start recovery timer (15s sustained high FPS required)
     */
    startRecoveryTimer(fps) {
        this.isInRecoveryWindow = true;
        
        if (this.debugMode) {
            console.log(`📊 Starting recovery timer: ${fps.toFixed(1)} FPS sustained needed for 15s`);
        }
        
        this.recoveryTimer = setTimeout(() => {
            // Check if FPS is still high enough
            const currentAvgFPS = this.getAverageFPS();
            if (currentAvgFPS >= this.recoveryThreshold) {
                const betterState = this.getNextBetterState();
                if (betterState) {
                    this.transitionToState(betterState, 'recovery', { 
                        fps: currentAvgFPS, 
                        reason: 'sustained_high_fps' 
                    });
                }
            }
            
            this.isInRecoveryWindow = false;
            this.recoveryTimer = null;
        }, this.hysteresisDelay);
        
        // Emit recovery start event
        this.emitPerformanceEvent('performance:recovery:started', {
            currentFPS: fps,
            currentState: this.currentState,
            timeToWait: this.hysteresisDelay
        });
    }
    
    /**
     * Cancel recovery timer
     */
    cancelRecovery(reason) {
        if (this.recoveryTimer) {
            clearTimeout(this.recoveryTimer);
            this.recoveryTimer = null;
            this.isInRecoveryWindow = false;
            
            if (this.debugMode) {
                console.log(`📊 Recovery cancelled: ${reason}`);
            }
            
            this.emitPerformanceEvent('performance:recovery:cancelled', {
                reason,
                currentState: this.currentState
            });
        }
    }
    
    /**
     * Get next more degraded state
     */
    getNextDegradedState() {
        const stateOrder = ['S0', 'S1', 'S2', 'S3', 'S4', 'S5'];
        const currentIndex = stateOrder.indexOf(this.currentState);
        return currentIndex < stateOrder.length - 1 ? stateOrder[currentIndex + 1] : null;
    }
    
    /**
     * Get next better state (for recovery)
     */
    getNextBetterState() {
        const stateOrder = ['S0', 'S1', 'S2', 'S3', 'S4', 'S5'];
        const currentIndex = stateOrder.indexOf(this.currentState);
        return currentIndex > 0 ? stateOrder[currentIndex - 1] : null;
    }
    
    /**
     * Transition to new performance state
     */
    transitionToState(newState, transitionType, context = {}) {
        if (newState === this.currentState) return;
        
        const now = performance.now();
        this.previousState = this.currentState;
        this.currentState = newState;
        this.lastStateTransition = now;
        
        // Cancel any active recovery
        this.cancelRecovery('state_transition');
        
        // Apply the new state
        this.applyState(newState);
        
        // Record transition
        const transition = {
            from: this.previousState,
            to: newState,
            timestamp: now,
            type: transitionType,
            context,
            fps: context.fps || this.getAverageFPS()
        };
        
        this.stateTransitionHistory.push(transition);
        this.performanceMetrics.totalStateChanges++;
        
        // Keep history manageable
        if (this.stateTransitionHistory.length > 100) {
            this.stateTransitionHistory = this.stateTransitionHistory.slice(-50);
        }
        
        console.log(`📊 Performance state transition: ${this.previousState} → ${newState} (${transitionType}) at ${context.fps?.toFixed(1) || '?'} FPS`);
        
        // Emit state change event
        this.emitPerformanceEvent('performance:state:changed', transition);
    }
    
    /**
     * Apply performance state configurations
     */
    applyState(state, isInitial = false) {
        const impl = this.stateImplementations.get(state);
        if (!impl) {
            console.warn(`📊 No implementation found for state: ${state}`);
            return;
        }
        
        try {
            impl.apply(this.renderer, this.scene, this.composer);
            
            if (!isInitial && this.debugMode) {
                console.log(`📊 Applied state ${state}:`, impl.description);
            }
        } catch (error) {
            console.error(`📊 Error applying state ${state}:`, error);
            
            // Emit error event
            this.emitPerformanceEvent('performance:state:error', {
                state,
                error: error.message,
                fallback: true
            });
        }
    }
    
    /**
     * Initialize state implementations
     */
    initializeStateImplementations() {
        // S0: Full Quality - All features enabled
        this.stateImplementations.set('S0', {
            description: 'Full quality - all features enabled',
            apply: (renderer, scene, composer) => {
                if (renderer) {
                    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
                    renderer.shadowMap.enabled = true;
                    renderer.shadowMap.type = window.THREE?.PCFSoftShadowMap || 2;
                }
                
                if (composer && composer.passes) {
                    // Enable all post-processing passes
                    composer.passes.forEach(pass => {
                        if (pass.enabled !== undefined) {
                            pass.enabled = true;
                        }
                    });
                }
                
                // Full particle count (handled by particle optimizer)
                this.emitPerformanceEvent('particles:quality:set', { level: 'high', multiplier: 1.0 });
            }
        });
        
        // S1: Reduced Post-processing
        this.stateImplementations.set('S1', {
            description: 'Reduced post-processing effects',
            apply: (renderer, scene, composer) => {
                if (renderer) {
                    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
                    renderer.shadowMap.enabled = true;
                }
                
                if (composer && composer.passes) {
                    // Disable expensive post-processing
                    composer.passes.forEach(pass => {
                        if (pass.name === 'BloomPass' || pass.name === 'SSAOPass') {
                            pass.enabled = false;
                        }
                    });
                }
                
                this.emitPerformanceEvent('particles:quality:set', { level: 'high', multiplier: 0.9 });
            }
        });
        
        // S2: Fewer Particles
        this.stateImplementations.set('S2', {
            description: 'Reduced particle count (50%)',
            apply: (renderer, scene, composer) => {
                if (renderer) {
                    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
                    renderer.shadowMap.enabled = true;
                }
                
                // Reduce particle count significantly
                this.emitPerformanceEvent('particles:quality:set', { level: 'medium', multiplier: 0.5 });
            }
        });
        
        // S3: Lower Pixel Ratio
        this.stateImplementations.set('S3', {
            description: 'Reduced pixel ratio (1.0)',
            apply: (renderer, scene, composer) => {
                if (renderer) {
                    renderer.setPixelRatio(1.0); // Reduce from 1.25
                    renderer.shadowMap.enabled = true;
                }
                
                this.emitPerformanceEvent('particles:quality:set', { level: 'medium', multiplier: 0.4 });
            }
        });
        
        // S4: No Shadows
        this.stateImplementations.set('S4', {
            description: 'Disabled shadow mapping',
            apply: (renderer, scene, composer) => {
                if (renderer) {
                    renderer.setPixelRatio(1.0);
                    renderer.shadowMap.enabled = false; // Major performance save
                }
                
                // Disable shadow-casting lights
                if (scene) {
                    scene.traverse(object => {
                        if (object.isLight) {
                            object.castShadow = false;
                        }
                        if (object.receiveShadow !== undefined) {
                            object.receiveShadow = false;
                        }
                    });
                }
                
                this.emitPerformanceEvent('particles:quality:set', { level: 'low', multiplier: 0.3 });
            }
        });
        
        // S5: Minimal Mode
        this.stateImplementations.set('S5', {
            description: 'Minimal rendering - basic geometry only',
            apply: (renderer, scene, composer) => {
                if (renderer) {
                    renderer.setPixelRatio(0.75); // Even lower resolution
                    renderer.shadowMap.enabled = false;
                }
                
                // Disable post-processing entirely
                if (composer && composer.passes) {
                    composer.passes.forEach(pass => {
                        if (pass.enabled !== undefined && pass.name !== 'RenderPass') {
                            pass.enabled = false;
                        }
                    });
                }
                
                // Minimal particle count
                this.emitPerformanceEvent('particles:quality:set', { level: 'minimal', multiplier: 0.1 });
            }
        });
    }
    
    /**
     * Update performance metrics
     */
    updateMetrics(now) {
        const currentState = this.currentState;
        
        // Track time in states
        if (!this.performanceMetrics.timeInStates.has(currentState)) {
            this.performanceMetrics.timeInStates.set(currentState, 0);
            this.performanceMetrics.averageFPSInStates.set(currentState, []);
        }
        
        // Simple time tracking (approximate)
        this.performanceMetrics.timeInStates.set(
            currentState, 
            this.performanceMetrics.timeInStates.get(currentState) + 16 // ~60 FPS call rate
        );
        
        // FPS tracking per state
        const fpsArray = this.performanceMetrics.averageFPSInStates.get(currentState);
        fpsArray.push(this.currentFPS);
        
        // Keep arrays manageable
        if (fpsArray.length > 100) {
            fpsArray.splice(0, 50);
        }
    }
    
    /**
     * Get current performance statistics
     */
    getPerformanceStats() {
        const stats = {
            currentState: this.currentState,
            currentFPS: this.currentFPS,
            ewmaFPS: this.ewmaFPS,
            averageFPS: this.getAverageFPS(),
            fpsHistorySize: this.fpsHistory.length,
            isInRecoveryWindow: this.isInRecoveryWindow,
            totalStateChanges: this.performanceMetrics.totalStateChanges,
            recentTransitions: this.stateTransitionHistory.slice(-5),
            timeInCurrentState: performance.now() - this.lastStateTransition,
            stateDistribution: {}
        };
        
        // Calculate time distribution across states
        const totalTime = Array.from(this.performanceMetrics.timeInStates.values())
            .reduce((sum, time) => sum + time, 0);
        
        for (const [state, time] of this.performanceMetrics.timeInStates) {
            stats.stateDistribution[state] = {
                timeMs: time,
                percentage: totalTime > 0 ? (time / totalTime) * 100 : 0,
                averageFPS: this.calculateAverageFPS(this.performanceMetrics.averageFPSInStates.get(state))
            };
        }
        
        return stats;
    }
    
    calculateAverageFPS(fpsArray) {
        if (!fpsArray || fpsArray.length === 0) return 0;
        return fpsArray.reduce((sum, fps) => sum + fps, 0) / fpsArray.length;
    }
    
    /**
     * Emit performance events for coordination with other systems
     */
    emitPerformanceEvent(eventName, data) {
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            const event = new CustomEvent(eventName, { detail: data });
            window.dispatchEvent(event);
        }
    }
    
    /**
     * Stop the performance monitoring system
     */
    stop() {
        if (!this.isActive) return;
        
        this.isActive = false;
        this.cancelRecovery('system_stopped');
        
        console.log('📊 Performance Degradation Ladder stopped');
        this.emitPerformanceEvent('performance:ladder:stopped', {
            finalState: this.currentState,
            totalTransitions: this.performanceMetrics.totalStateChanges
        });
    }
    
    /**
     * Force a specific state (for testing)
     */
    forceState(state, reason = 'manual') {
        if (!this.stateImplementations.has(state)) {
            console.warn(`📊 Cannot force unknown state: ${state}`);
            return false;
        }
        
        this.transitionToState(state, 'forced', { 
            fps: this.getAverageFPS(), 
            reason 
        });
        return true;
    }
}

// Create singleton instance
const performanceLadder = new PerformanceDegradationLadder();

// Expose for debugging
if (typeof window !== 'undefined') {
    window.PERFORMANCE_LADDER = performanceLadder;
}

export default performanceLadder;