/**
 * Enhanced Watchdog and Self-Healing System for ZIKADA 3886
 * 
 * Provides robust monitoring and automatic recovery from:
 * - Animation stalls (RAF heartbeat monitoring)  
 * - Event loop lag detection
 * - WebGL context loss and restoration
 * - Scene/timeline failures with error quarantine
 * - Automatic performance degradation and recovery
 */

import featureFlags from './feature-flags.js';
import performanceLadder from './performance-degradation-ladder.js';
import animationRuntime from './runtime/animation-runtime.js';
import performanceBus from './performance-bus.js';

class EnhancedWatchdog {
    constructor() {
        this.runtimeOwner = 'enhanced-watchdog';
        this.isActive = false;
        this.debugMode = featureFlags.isEnabled('debugMetrics');
        
        // RAF Heartbeat Monitoring
        this.lastRAFTime = performance.now();
        this.rafHeartbeatInterval = null;
        this.rafStallCount = 0;
        this.maxRAFStallTime = 2000; // central FPS bus publishes once per second
        
        // Event Loop Lag Monitoring
        this.eventLoopMonitor = null;
        this.lastEventLoopCheck = performance.now();
        this.eventLoopLagThreshold = 250; // ms beyond the 500ms health cadence
        this.eventLoopLagCount = 0;
        
        // WebGL Context Recovery
        this.webglCanvas = null;
        this.webglContext = null;
        this.webglRecoveryAttempts = 0;
        this.maxRecoveryAttempts = 3;
        this.recoveryBackoffTimes = [1000, 2000, 5000]; // 1s, 2s, 5s backoff
        this.isRecovering = false;
        
        // Error Quarantine System
        this.quarantinedScenes = new Set();
        this.errorCounts = new Map();
        this.maxErrorsPerComponent = 3;
        this.globalErrorHandler = null;
        
        // Performance State
        this.performanceState = 'S0'; // S0-S5 degradation levels
        this.stateTransitionHistory = [];
        this.recoveryTimer = null;
        this.isRecoveringPerformance = false;
        
        console.log('🔧 Enhanced Watchdog initialized');
    }
    
    /**
     * Start all watchdog systems
     */
    startWatchdog() {
        if (this.isActive) return;

        animationRuntime.disposeOwner(this.runtimeOwner);
        this.isActive = true;
        
        // Start RAF heartbeat monitoring
        this.startRAFHeartbeat();
        
        // Start event loop lag monitoring
        this.startEventLoopMonitoring();
        
        // Set up WebGL context loss handlers
        this.setupWebGLRecovery();
        
        // Install global error boundary
        this.installGlobalErrorHandler();
        
        // Coordinate with performance ladder
        this.coordinateWithPerformanceLadder();
        
        console.log('🔧 Enhanced Watchdog systems active');
    }
    
    /**
     * RAF Heartbeat Monitor - Detects animation stalls
     */
    startRAFHeartbeat() {
        const unsubscribe = performanceBus.subscribe(() => {
            if (this.isActive) this.lastRAFTime = performance.now();
        });
        animationRuntime.trackDisposer(this.runtimeOwner, unsubscribe);
        this.lastRAFTime = performance.now();
        this.rafHeartbeatInterval = null;
        this.rafHeartbeatLoop = null;
    }
    
    patchRAF() {
        // Intentionally empty: watchdogs must observe RAF, never replace it.
    }
    
    /**
     * Event Loop Lag Monitor - Detects main thread blocking
     */
    startEventLoopMonitoring() {
        const checkEventLoopLag = () => {
            if (!this.isActive) return;
            
            const now = performance.now();
            const expectedInterval = 500;
            const actualInterval = now - this.lastEventLoopCheck;
            const lag = actualInterval - expectedInterval;
            const timeSinceLastRAF = now - this.lastRAFTime;

            if (timeSinceLastRAF > this.maxRAFStallTime && document.visibilityState === 'visible') {
                this.rafStallCount++;
                if (this.debugMode) {
                    console.warn(`🔧 RAF stall detected: ${Math.round(timeSinceLastRAF)}ms since last metric frame`);
                }
                if (this.rafStallCount === 1) this.handleRAFStall('light');
                else if (this.rafStallCount >= 3) this.handleRAFStall('severe');
            } else {
                this.rafStallCount = 0;
            }
            
            if (lag > this.eventLoopLagThreshold) {
                this.eventLoopLagCount++;
                
                if (this.debugMode) {
                    console.warn(`🔧 Event loop lag: ${Math.round(lag)}ms`);
                }
                
                if (this.eventLoopLagCount >= 3) {
                    this.handleEventLoopLag(lag);
                }
            } else {
                this.eventLoopLagCount = Math.max(0, this.eventLoopLagCount - 1);
            }
            
            this.lastEventLoopCheck = now;
        };
        
        this.eventLoopMonitor = animationRuntime.scheduleInterval(this.runtimeOwner, checkEventLoopLag, 500);
    }
    
    /**
     * WebGL Context Loss and Recovery
     */
    setupWebGLRecovery() {
        // Observe the renderer's real canvas. Creating a sentinel WebGL context
        // consumed an extra GPU context per page and made headless pressure worse.
        this.webglCanvas = window.chaosEngine?.renderer?.domElement || document.querySelector('#chaos-canvas, canvas[data-engine-canvas]');
        
        if (this.webglCanvas) {
            this.webglContext = window.chaosEngine?.renderer?.getContext?.() || null;
            this.listen('webglcontextlost', (e) => {
                e.preventDefault();
                this.handleWebGLContextLoss();
            }, this.webglCanvas);
            
            this.listen('webglcontextrestored', () => {
                this.handleWebGLContextRestore();
            }, this.webglCanvas);
            
            console.log('🔧 WebGL context recovery handlers installed on renderer canvas');
        } else {
            this.setupFallbackWebGLMonitoring();
        }
    }

    listen(type, handler, target = window) {
        target.addEventListener(type, handler);
        animationRuntime.trackDisposer(this.runtimeOwner, () => target.removeEventListener(type, handler));
        return handler;
    }
    
    /**
     * Fallback monitoring when WebGL is not available
     */
    setupFallbackWebGLMonitoring() {
        // Use rAF for frame timing analysis when WebGL unavailable
        if (typeof PerformanceObserver !== 'undefined') {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    for (const entry of entries) {
                        if (entry.entryType === 'measure' || entry.entryType === 'mark') {
                            // Basic performance monitoring via Performance API
                            if (entry.duration && entry.duration > 16.67) { // 60 FPS threshold
                                this.handlePerformanceIssue('frame-overrun', entry.duration);
                            }
                        }
                    }
                });
                
                observer.observe({ entryTypes: ['measure', 'mark'] });
                animationRuntime.trackDisposer(this.runtimeOwner, () => observer.disconnect());
                console.log('🔧 Fallback WebGL monitoring via PerformanceObserver');
            } catch (error) {
                console.log('🔧 PerformanceObserver not available, minimal fallback mode');
            }
        }
    }
    
    /**
     * Handle performance issues in fallback mode
     */
    handlePerformanceIssue(type, data) {
        if (this.debugMode) {
            console.warn(`🔧 Performance issue detected (fallback): ${type}`, data);
        }
        
        // Emit performance warning event
        const performanceEvent = new CustomEvent('performance:issue', {
            detail: { type, data, source: 'fallback-watchdog' }
        });
        window.dispatchEvent(performanceEvent);
    }
    
    /**
     * Global Error Handler with Component Quarantine
     */
    installGlobalErrorHandler() {
        this.globalErrorHandler = (event) => {
            const error = event.error || event.reason;
            const source = event.filename || event.source || 'unknown';
            
            if (this.debugMode) {
                console.error('🔧 Global error caught:', error);
            }
            
            // Track error counts per source/component
            const errorKey = this.categorizeError(error, source);
            const count = (this.errorCounts.get(errorKey) || 0) + 1;
            this.errorCounts.set(errorKey, count);
            
            // Quarantine component if too many errors
            if (count >= this.maxErrorsPerComponent) {
                this.quarantineComponent(errorKey);
            }
            
            // Don't block default error handling
            return false;
        };
        
        this.listen('error', this.globalErrorHandler);
        this.listen('unhandledrejection', this.globalErrorHandler);
    }
    
    /**
     * Handle RAF stall with progressive response
     */
    handleRAFStall(severity) {
        if (this.debugMode) {
            console.log(`🔧 Handling RAF stall (${severity})`);
        }
        
        if (severity === 'light') {
            // Try to restart RAF loop
            this.restartRAFLoop();
        } else if (severity === 'severe') {
            // More aggressive recovery
            this.emergencyPerformanceReduction();
            this.restartRAFLoop();
        }
    }
    
    /**
     * Handle event loop lag
     */
    handleEventLoopLag(lagTime) {
        if (this.debugMode) {
            console.log(`🔧 Handling event loop lag: ${Math.round(lagTime)}ms`);
        }
        
        // Reduce animation complexity temporarily
        this.temporaryPerformanceReduction();
    }
    
    /**
     * Handle WebGL context loss
     */
    handleWebGLContextLoss() {
        console.warn('🔧 WebGL context lost - preparing for recovery');
        this.isRecovering = true;
        
        // Schedule recovery with backoff
        const backoffTime = this.recoveryBackoffTimes[Math.min(this.webglRecoveryAttempts, this.recoveryBackoffTimes.length - 1)];
        
        animationRuntime.scheduleTimeout(this.runtimeOwner, () => {
            this.attemptWebGLRecovery();
        }, backoffTime);
    }
    
    /**
     * Handle WebGL context restoration
     */
    handleWebGLContextRestore() {
        console.log('🔧 WebGL context restored - rebuilding scene');
        this.isRecovering = false;
        this.webglRecoveryAttempts = 0;
        
        // Trigger scene rebuild
        this.rebuildWebGLScene();
    }
    
    /**
     * Attempt WebGL recovery
     */
    attemptWebGLRecovery() {
        this.webglRecoveryAttempts++;
        
        if (this.webglRecoveryAttempts > this.maxRecoveryAttempts) {
            console.error('🔧 WebGL recovery failed - triggering soft restart');
            this.triggerSoftRestart();
            return;
        }
        
        this.webglCanvas = window.chaosEngine?.renderer?.domElement || this.webglCanvas;
        this.webglContext = window.chaosEngine?.renderer?.getContext?.() || null;

        if (this.webglCanvas?.isConnected) {
            console.log('🔧 WebGL renderer canvas available for scene rebuild');
            this.handleWebGLContextRestore();
        } else {
            console.log('🔧 WebGL context recovery failed, continuing in fallback mode');
            this.setupFallbackWebGLMonitoring();
        }
    }
    
    /**
     * Rebuild WebGL scene after context restoration
     */
    rebuildWebGLScene() {
        // Emit event for other systems to rebuild their WebGL resources
        const rebuildEvent = new CustomEvent('webgl:rebuild', {
            detail: { context: this.webglContext }
        });
        window.dispatchEvent(rebuildEvent);
        
        // Give systems time to rebuild, then resume normal operation
        animationRuntime.scheduleTimeout(this.runtimeOwner, () => {
            console.log('🔧 WebGL scene rebuild complete');
        }, 1000);
    }
    
    /**
     * Restart RAF animation loop
     */
    restartRAFLoop() {
        // Emit event to restart main animation loop
        const restartEvent = new CustomEvent('raf:restart');
        window.dispatchEvent(restartEvent);
        
        // Reset RAF tracking
        this.lastRAFTime = performance.now();
        this.rafStallCount = 0;
    }
    
    /**
     * Emergency performance reduction
     */
    emergencyPerformanceReduction() {
        console.log('🔧 Emergency performance reduction activated');
        
        // Emit event to reduce performance
        const emergencyEvent = new CustomEvent('performance:emergency', {
            detail: { level: 'critical' }
        });
        window.dispatchEvent(emergencyEvent);
        
        // Schedule recovery check
        if (this.recoveryTimer) {
            this.recoveryTimer.clear?.();
        }
        
        this.recoveryTimer = animationRuntime.scheduleTimeout(this.runtimeOwner, () => {
            this.checkRecoveryConditions();
        }, 10000); // Check recovery in 10 seconds
    }
    
    /**
     * Temporary performance reduction
     */
    temporaryPerformanceReduction() {
        console.log('🔧 Temporary performance reduction');
        
        const tempEvent = new CustomEvent('performance:reduce', {
            detail: { level: 'temporary', duration: 5000 }
        });
        window.dispatchEvent(tempEvent);
    }
    
    /**
     * Check if we can recover from performance reduction
     */
    checkRecoveryConditions() {
        // Simple recovery check - if RAF is stable for 5 seconds
        if (this.rafStallCount === 0) {
            console.log('🔧 Performance conditions improved - restoring normal operation');
            
            const recoveryEvent = new CustomEvent('performance:restore');
            window.dispatchEvent(recoveryEvent);
        } else {
            // Schedule another check
            this.recoveryTimer = animationRuntime.scheduleTimeout(this.runtimeOwner, () => {
                this.checkRecoveryConditions();
            }, 5000);
        }
    }
    
    /**
     * Categorize errors for quarantine tracking
     */
    categorizeError(error, source) {
        const errorMessage = error?.message || error?.toString() || 'unknown';
        
        // Categorize by error type and source
        if (errorMessage.includes('GSAP')) return 'gsap-animations';
        if (errorMessage.includes('Three') || errorMessage.includes('WebGL')) return 'webgl-rendering';
        if (source.includes('chaos-engine')) return 'chaos-engine';
        if (source.includes('matrix')) return 'matrix-effects';
        if (source.includes('random-animations')) return 'random-effects';
        
        return 'general';
    }
    
    /**
     * Quarantine a failing component
     */
    quarantineComponent(componentKey) {
        console.warn(`🔧 Quarantining component: ${componentKey}`);
        this.quarantinedScenes.add(componentKey);
        
        // Emit quarantine event
        const quarantineEvent = new CustomEvent('component:quarantine', {
            detail: { component: componentKey }
        });
        window.dispatchEvent(quarantineEvent);
    }
    
    /**
     * Trigger soft restart (reload without full page refresh)
     */
    triggerSoftRestart() {
        console.log('🔧 Requesting scoped recovery due to critical failures');
        
        const restartEvent = new CustomEvent('app:soft-restart');
        window.dispatchEvent(restartEvent);

        // Recovery must never create a reload loop or discard authored visual
        // work. Continue observing; the profile manager lowers per-frame cost
        // while explicit renderer owners handle their own rebuilds.
        this.recoveryTimer?.clear?.();
        this.recoveryTimer = animationRuntime.scheduleTimeout(this.runtimeOwner, () => {
            this.checkRecoveryConditions();
        }, 5000);
    }
    
    /**
     * Stop watchdog systems
     */
    stopWatchdog() {
        this.isActive = false;
        animationRuntime.disposeOwner(this.runtimeOwner);
        this.rafHeartbeatInterval = null;
        this.rafHeartbeatLoop = null;
        this.eventLoopMonitor = null;
        this.recoveryTimer = null;
        
        console.log('🔧 Enhanced Watchdog stopped');
    }
    
    /**
     * Coordinate with Performance Degradation Ladder
     */
    coordinateWithPerformanceLadder() {
        // Listen for performance events from the ladder
        this.listen('performance:state:changed', (event) => {
            const { from, to, type, fps } = event.detail;
            
            if (this.debugMode) {
                console.log(`🔧 Watchdog: Performance state changed ${from} → ${to} (${fps?.toFixed(1)} FPS)`);
            }
            
            // Update internal performance state tracking
            this.performanceState = to;
            
            // Adjust watchdog sensitivity based on performance state
            this.adjustWatchdogSensitivity(to);
        });
        
        // Listen for recovery events
        this.listen('performance:recovery:started', (event) => {
            if (this.debugMode) {
                console.log('🔧 Watchdog: Performance recovery started - reducing monitoring sensitivity');
            }
            this.isRecoveringPerformance = true;
        });
        
        this.listen('performance:recovery:cancelled', (event) => {
            if (this.debugMode) {
                console.log('🔧 Watchdog: Performance recovery cancelled - resuming normal monitoring');
            }
            this.isRecoveringPerformance = false;
        });
        
        // Send FPS data to performance ladder
        this.setupFPSReporting();
    }
    
    /**
     * Adjust watchdog sensitivity based on performance state
     */
    adjustWatchdogSensitivity(performanceState) {
        // In degraded states, be more lenient with RAF stalls and event loop lag
        // to avoid cascading performance issues
        
        const baseSensitivity = {
            S0: { rafStallTime: 2000, eventLoopThreshold: 250 },
            S1: { rafStallTime: 2250, eventLoopThreshold: 300 },
            S2: { rafStallTime: 2500, eventLoopThreshold: 350 },
            S3: { rafStallTime: 3000, eventLoopThreshold: 450 },
            S4: { rafStallTime: 4000, eventLoopThreshold: 600 },
            S5: { rafStallTime: 5000, eventLoopThreshold: 800 }
        };
        
        const sensitivity = baseSensitivity[performanceState] || baseSensitivity.S0;
        
        this.maxRAFStallTime = sensitivity.rafStallTime;
        this.eventLoopLagThreshold = sensitivity.eventLoopThreshold;
        
        if (this.debugMode) {
            console.log(`🔧 Watchdog sensitivity adjusted for ${performanceState}: RAF=${sensitivity.rafStallTime}ms, EventLoop=${sensitivity.eventLoopThreshold}ms`);
        }
    }
    
    /**
     * Set up FPS reporting to performance ladder
     */
    setupFPSReporting() {
        const reportFPS = ({ fps }) => {
            if (!this.isActive) return;
            if (window.__3886_PROFILE_MANAGER_ENABLED === true) return;
            performanceLadder?.updateFPS?.(Math.min(Number(fps) || 0, 120));
        };

        const unsubscribe = performanceBus.subscribe(reportFPS);
        animationRuntime.trackDisposer(this.runtimeOwner, unsubscribe);
        this.fpsReportingLoop = null;
        
        if (this.debugMode) {
            console.log('🔧 FPS reporting to performance ladder started');
        }
    }
    
    /**
     * Get watchdog status report
     */
    getStatus() {
        return {
            isActive: this.isActive,
            rafStallCount: this.rafStallCount,
            eventLoopLagCount: this.eventLoopLagCount,
            webglRecoveryAttempts: this.webglRecoveryAttempts,
            isRecovering: this.isRecovering,
            quarantinedComponents: Array.from(this.quarantinedScenes),
            errorCounts: Object.fromEntries(this.errorCounts),
            lastRAFTime: this.lastRAFTime,
            performanceState: this.performanceState
        };
    }
}

// Global instance
let enhancedWatchdog = null;

// Initialize on load
if (typeof window !== 'undefined') {
    enhancedWatchdog = new EnhancedWatchdog();
    window.enhancedWatchdog = enhancedWatchdog;
    
    // Auto-start watchdog
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            enhancedWatchdog.startWatchdog();
        });
    } else {
        enhancedWatchdog.startWatchdog();
    }
}

export default enhancedWatchdog;
