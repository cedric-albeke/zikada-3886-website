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

class EnhancedWatchdog {
    constructor() {
        this.isActive = false;
        this.debugMode = featureFlags.isEnabled('debugMetrics');
        
        // RAF Heartbeat Monitoring
        this.lastRAFTime = performance.now();
        this.rafHeartbeatInterval = null;
        this.rafStallCount = 0;
        this.maxRAFStallTime = 250; // ms - alert if no RAF within this window
        
        // Event Loop Lag Monitoring
        this.eventLoopMonitor = null;
        this.lastEventLoopCheck = performance.now();
        this.eventLoopLagThreshold = 50; // ms
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
        
        console.log('🔧 Enhanced Watchdog initialized');
    }
    
    /**
     * Start all watchdog systems
     */
    startWatchdog() {
        if (this.isActive) return;
        
        this.isActive = true;
        
        // Start RAF heartbeat monitoring
        this.startRAFHeartbeat();
        
        // Start event loop lag monitoring
        this.startEventLoopMonitoring();
        
        // Set up WebGL context loss handlers
        this.setupWebGLRecovery();
        
        // Install global error boundary
        this.installGlobalErrorHandler();
        
        console.log('🔧 Enhanced Watchdog systems active');
    }
    
    /**
     * RAF Heartbeat Monitor - Detects animation stalls
     */
    startRAFHeartbeat() {
        const heartbeatCheck = () => {
            if (!this.isActive) return;
            
            const now = performance.now();
            const timeSinceLastRAF = now - this.lastRAFTime;
            
            // Check if RAF hasn't been called within threshold
            if (timeSinceLastRAF > this.maxRAFStallTime && document.visibilityState === 'visible') {
                this.rafStallCount++;
                
                if (this.debugMode) {
                    console.warn(`🔧 RAF stall detected: ${Math.round(timeSinceLastRAF)}ms since last RAF`);
                }
                
                // Progressive response to RAF stalls
                if (this.rafStallCount === 1) {
                    this.handleRAFStall('light');
                } else if (this.rafStallCount >= 3) {
                    this.handleRAFStall('severe');
                }
            } else if (timeSinceLastRAF <= this.maxRAFStallTime) {
                // RAF is healthy, reset stall count
                this.rafStallCount = 0;
            }
        };
        
        this.rafHeartbeatInterval = setInterval(heartbeatCheck, 100); // Check every 100ms
        
        // Track RAF calls
        this.patchRAF();
    }
    
    patchRAF() {
        if (window._originalRAF) return; // Already patched
        
        window._originalRAF = window.requestAnimationFrame;
        window.requestAnimationFrame = (callback) => {
            this.lastRAFTime = performance.now();
            return window._originalRAF(callback);
        };
    }
    
    /**
     * Event Loop Lag Monitor - Detects main thread blocking
     */
    startEventLoopMonitoring() {
        const checkEventLoopLag = () => {
            if (!this.isActive) return;
            
            const now = performance.now();
            const expectedInterval = 100; // We schedule every 100ms
            const actualInterval = now - this.lastEventLoopCheck;
            const lag = actualInterval - expectedInterval;
            
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
        
        this.eventLoopMonitor = setInterval(checkEventLoopLag, 100);
    }
    
    /**
     * WebGL Context Loss and Recovery
     */
    setupWebGLRecovery() {
        // Find WebGL canvas
        this.webglCanvas = document.querySelector('canvas');
        if (!this.webglCanvas) {
            setTimeout(() => this.setupWebGLRecovery(), 1000); // Retry in 1s
            return;
        }
        
        this.webglContext = this.webglCanvas.getContext('webgl') || this.webglCanvas.getContext('webgl2');
        
        if (this.webglContext) {
            // Listen for context loss
            this.webglCanvas.addEventListener('webglcontextlost', (e) => {
                e.preventDefault();
                this.handleWebGLContextLoss();
            });
            
            // Listen for context restoration
            this.webglCanvas.addEventListener('webglcontextrestored', () => {
                this.handleWebGLContextRestore();
            });
            
            console.log('🔧 WebGL context recovery handlers installed');
        }
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
        
        window.addEventListener('error', this.globalErrorHandler);
        window.addEventListener('unhandledrejection', this.globalErrorHandler);
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
        
        setTimeout(() => {
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
        
        // Try to get new context
        if (this.webglCanvas) {
            this.webglContext = this.webglCanvas.getContext('webgl', { antialias: false }) || 
                              this.webglCanvas.getContext('webgl2', { antialias: false });
            
            if (this.webglContext) {
                console.log('🔧 WebGL context recovered manually');
                this.handleWebGLContextRestore();
            }
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
        setTimeout(() => {
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
            clearTimeout(this.recoveryTimer);
        }
        
        this.recoveryTimer = setTimeout(() => {
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
            this.recoveryTimer = setTimeout(() => {
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
        console.log('🔧 Triggering soft restart due to critical failures');
        
        const restartEvent = new CustomEvent('app:soft-restart');
        window.dispatchEvent(restartEvent);
        
        // If soft restart doesn't work, hard reload as last resort
        setTimeout(() => {
            if (this.isRecovering || this.rafStallCount > 5) {
                console.log('🔧 Soft restart failed - performing hard reload');
                window.location.reload();
            }
        }, 5000);
    }
    
    /**
     * Stop watchdog systems
     */
    stopWatchdog() {
        this.isActive = false;
        
        if (this.rafHeartbeatInterval) {
            clearInterval(this.rafHeartbeatInterval);
        }
        
        if (this.eventLoopMonitor) {
            clearInterval(this.eventLoopMonitor);
        }
        
        if (this.recoveryTimer) {
            clearTimeout(this.recoveryTimer);
        }
        
        if (this.globalErrorHandler) {
            window.removeEventListener('error', this.globalErrorHandler);
            window.removeEventListener('unhandledrejection', this.globalErrorHandler);
        }
        
        console.log('🔧 Enhanced Watchdog stopped');
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