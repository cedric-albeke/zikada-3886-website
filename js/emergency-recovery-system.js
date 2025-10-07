// Emergency Recovery System - Prevents animation system freeze and implements circuit breaker
// This system detects when cleanup is ineffective and implements more aggressive recovery

class EmergencyRecoverySystem {
    constructor() {
        this.circuitState = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failureCount = 0;
        this.lastFailureTime = 0;
        this.recoveryAttempts = 0;
        
        // Circuit breaker configuration
        this.config = {
            failureThreshold: 3,          // Failures before opening circuit
            recoveryTimeout: 30000,       // 30s before attempting recovery
            maxRecoveryAttempts: 3,       // Max recovery attempts
            memoryThreshold: 900 * 1024 * 1024, // 900MB memory threshold
            domThreshold: 2000,           // DOM node threshold
            cleanupEffectivenessThreshold: 0.1 // At least 10% cleanup effectiveness required
        };
        
        // System state tracking
        this.state = {
            lastCleanupEffectiveness: 0,
            consecutiveIneffectiveCleanups: 0,
            totalDOMGrowth: 0,
            memoryGrowthRate: 0,
            isRecovering: false,
            emergencyMode: false
        };
        
        // Aggressive cleanup selectors
        this.aggressiveSelectors = [
            '.matrix-char',
            '.matrix-overlay',
            '.phase-overlay',
            '.flash-overlay',
            '.glitch-overlay',
            '.energy-field',
            '.quantum-particles',
            '.holographic-shimmer',
            '[data-temp="true"]',
            '[data-animation="true"]',
            '[data-effect="true"]',
            'div[style*="position: fixed"]:not(.pre-loader):not(.control-panel)',
            'canvas:not([data-permanent])',
            '.perf-managed:not([data-permanent])'
        ];
        
        this.setupEventListeners();
        this.startMonitoring();
        
        console.log('🚨 Emergency Recovery System initialized');
    }
    
    setupEventListeners() {
        // Listen for DOM growth events
        window.addEventListener('dom:excessive-growth', (event) => {
            this.handleDOMGrowth(event.detail);
        });
        
        // Listen for memory pressure events
        window.addEventListener('memory:critical', (event) => {
            this.handleMemoryPressure(event.detail);
        });
        
        // Listen for cleanup completion events
        window.addEventListener('cleanup:completed', (event) => {
            this.evaluateCleanupEffectiveness(event.detail);
        });
        
        // Monitor emergency cleanup failures
        const originalEmergencyCleanup = window.performanceElementManager?.emergencyCleanup;
        if (originalEmergencyCleanup) {
            window.performanceElementManager.emergencyCleanup = (...args) => {
                const startNodes = document.querySelectorAll('*').length;
                const result = originalEmergencyCleanup.apply(window.performanceElementManager, args);
                const endNodes = document.querySelectorAll('*').length;
                const effectiveness = (startNodes - endNodes) / startNodes;
                
                this.state.lastCleanupEffectiveness = effectiveness;
                this.evaluateCleanupEffectiveness({ effectiveness, removed: startNodes - endNodes });
                
                return result;
            };
        }
    }
    
    handleDOMGrowth(details) {
        const { growth, currentCount, cleanedCount } = details;
        const effectiveness = cleanedCount / Math.max(growth, 1);
        
        console.log(`🔍 DOM Growth Analysis: ${growth} added, ${cleanedCount} cleaned (${(effectiveness * 100).toFixed(1)}% effective)`);
        
        this.state.totalDOMGrowth = growth;
        this.state.lastCleanupEffectiveness = effectiveness;
        
        // If cleanup was ineffective, increment failure counter
        if (effectiveness < this.config.cleanupEffectivenessThreshold) {
            this.recordFailure('ineffective_cleanup');
            this.state.consecutiveIneffectiveCleanups++;
            
            // Trigger aggressive cleanup if multiple consecutive failures
            if (this.state.consecutiveIneffectiveCleanups >= 2) {
                console.warn('⚠️ Multiple consecutive ineffective cleanups - triggering aggressive recovery');
                this.triggerAggressiveCleanup();
            }
        } else {
            this.state.consecutiveIneffectiveCleanups = 0;
        }
    }
    
    handleMemoryPressure(details) {
        const { growthPercent, currentHeap } = details;
        
        if (currentHeap > this.config.memoryThreshold) {
            console.error('🚨 Critical memory threshold exceeded - entering emergency mode');
            this.enterEmergencyMode();
        }
    }
    
    evaluateCleanupEffectiveness(details) {
        const { effectiveness, removed = 0 } = details;
        
        if (effectiveness < this.config.cleanupEffectivenessThreshold && removed < 5) {
            this.recordFailure('ineffective_cleanup');
            
            // If circuit is closed and we have too many failures, open it
            if (this.circuitState === 'CLOSED' && this.failureCount >= this.config.failureThreshold) {
                this.openCircuit();
            }
        } else {
            // Reset failure count on successful cleanup
            this.failureCount = Math.max(0, this.failureCount - 1);
        }
        
        // Emit effectiveness event
        window.dispatchEvent(new CustomEvent('emergency:cleanup-evaluated', {
            detail: { effectiveness, removed, state: this.circuitState }
        }));
    }
    
    recordFailure(reason) {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        
        console.warn(`⚠️ System failure recorded: ${reason} (${this.failureCount}/${this.config.failureThreshold})`);
        
        // Emit failure event
        window.dispatchEvent(new CustomEvent('emergency:failure', {
            detail: { reason, count: this.failureCount, threshold: this.config.failureThreshold }
        }));
    }
    
    openCircuit() {
        if (this.circuitState !== 'OPEN') {
            this.circuitState = 'OPEN';
            console.error('🚨 CIRCUIT BREAKER OPEN - System protection activated');
            
            // Stop all non-essential animations
            this.stopNonEssentialAnimations();
            
            // Schedule recovery attempt
            setTimeout(() => {
                this.attemptRecovery();
            }, this.config.recoveryTimeout);
            
            // Emit circuit open event
            window.dispatchEvent(new CustomEvent('emergency:circuit-open'));
        }
    }
    
    attemptRecovery() {
        if (this.circuitState === 'OPEN' && this.recoveryAttempts < this.config.maxRecoveryAttempts) {
            this.circuitState = 'HALF_OPEN';
            this.recoveryAttempts++;
            this.state.isRecovering = true;
            
            console.log(`🔄 Attempting system recovery (${this.recoveryAttempts}/${this.config.maxRecoveryAttempts})`);
            
            // Perform comprehensive cleanup
            this.performComprehensiveCleanup().then((success) => {
                if (success) {
                    this.closeCircuit();
                } else {
                    // Recovery failed, wait longer before next attempt
                    this.circuitState = 'OPEN';
                    setTimeout(() => {
                        this.attemptRecovery();
                    }, this.config.recoveryTimeout * Math.pow(2, this.recoveryAttempts)); // Exponential backoff
                }
            });
        } else if (this.recoveryAttempts >= this.config.maxRecoveryAttempts) {
            console.error('🚨 Maximum recovery attempts exceeded - entering safe mode');
            this.enterSafeMode();
        }
    }
    
    async performComprehensiveCleanup() {
        console.log('🧹 Performing comprehensive system cleanup...');
        
        const startTime = performance.now();
        const startNodes = document.querySelectorAll('*').length;
        const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
        
        let totalRemoved = 0;
        
        try {
            // Step 1: Aggressive DOM cleanup
            totalRemoved += this.performAggressiveDOMCleanup();
            
            // Step 2: Clear all timers and intervals
            if (window.intervalManager) {
                const timerResult = window.intervalManager.cleanup();
                console.log('🔧 Timer cleanup:', timerResult);
            }
            
            // Step 3: Force garbage collection if available
            if (window.gc) {
                console.log('🗑️ Forcing garbage collection...');
                window.gc();
            }
            
            // Step 4: Clear animation registries
            if (window.gsap) {
                window.gsap.killTweensOf('*');
                console.log('🎬 All GSAP animations killed');
            }
            
            // Step 5: Reset Lottie animations
            totalRemoved += this.cleanupLottieAnimations();
            
            // Wait for cleanup to take effect
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const endNodes = document.querySelectorAll('*').length;
            const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            const endTime = performance.now();
            
            const nodesRemoved = startNodes - endNodes;
            const memoryFreed = startMemory - endMemory;
            const effectiveness = nodesRemoved / Math.max(startNodes * 0.1, 1); // At least 10% cleanup expected
            
            console.log(`✅ Comprehensive cleanup completed:
                Duration: ${Math.round(endTime - startTime)}ms
                Nodes removed: ${nodesRemoved}
                Memory freed: ${this.formatBytes(memoryFreed)}
                Effectiveness: ${(effectiveness * 100).toFixed(1)}%`);
            
            // Consider cleanup successful if we removed at least 10 nodes or 10% effectiveness
            const success = nodesRemoved >= 10 || effectiveness >= 0.1;
            
            return success;
            
        } catch (error) {
            console.error('❌ Comprehensive cleanup failed:', error);
            return false;
        }
    }
    
    performAggressiveDOMCleanup() {
        console.log('🧹 Performing aggressive DOM cleanup...');
        let totalRemoved = 0;
        
        // Use our aggressive selectors
        this.aggressiveSelectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                console.log(`🔍 Found ${elements.length} elements for selector: ${selector}`);
                
                elements.forEach(element => {
                    // Additional safety checks
                    if (this.isSafeToRemove(element)) {
                        try {
                            // Remove from tracking first
                            if (window.performanceElementManager) {
                                window.performanceElementManager.untrack(element);
                            }
                            
                            element.remove();
                            totalRemoved++;
                        } catch (e) {
                            console.warn('Failed to remove element:', e);
                        }
                    }
                });
                
            } catch (error) {
                console.warn(`Invalid selector or error: ${selector}`, error);
            }
        });
        
        console.log(`🧹 Aggressive cleanup removed ${totalRemoved} elements`);
        return totalRemoved;
    }
    
    cleanupLottieAnimations() {
        console.log('🎬 Cleaning up Lottie animations...');
        let cleaned = 0;
        
        // Find all Lottie containers and players
        const lottieContainers = document.querySelectorAll('[data-lottie], .lottie-player, dotlottie-player');
        
        lottieContainers.forEach(container => {
            try {
                // Try to destroy Lottie instance
                if (container.lottie && typeof container.lottie.destroy === 'function') {
                    container.lottie.destroy();
                    cleaned++;
                }
                
                // Remove from DOM if not permanent
                if (!container.hasAttribute('data-permanent') && this.isSafeToRemove(container)) {
                    container.remove();
                    cleaned++;
                }
                
            } catch (error) {
                console.warn('Error cleaning Lottie animation:', error);
            }
        });
        
        console.log(`🎬 Cleaned up ${cleaned} Lottie animations`);
        return cleaned;
    }
    
    isSafeToRemove(element) {
        // Never remove critical elements
        const criticalClasses = ['pre-loader', 'control-panel', 'logo-text', 'image-2'];
        const criticalSelectors = ['body', 'html', 'head', 'script', 'style'];
        
        if (criticalClasses.some(cls => element.classList?.contains(cls))) {
            return false;
        }
        
        if (criticalSelectors.includes(element.tagName?.toLowerCase())) {
            return false;
        }
        
        if (element.hasAttribute('data-permanent')) {
            return false;
        }
        
        // Don't remove elements that contain critical content
        if (element.querySelector('.logo-text, .image-2, .pre-loader')) {
            return false;
        }
        
        return true;
    }
    
    stopNonEssentialAnimations() {
        console.log('⏸️ Stopping non-essential animations...');
        
        // Stop all GSAP animations except critical ones
        if (window.gsap) {
            const criticalElements = document.querySelectorAll('.logo-text, .image-2, .pre-loader');
            const allElements = document.querySelectorAll('*');
            
            allElements.forEach(el => {
                let isCritical = false;
                criticalElements.forEach(critical => {
                    if (critical === el || critical.contains(el)) {
                        isCritical = true;
                    }
                });
                
                if (!isCritical) {
                    window.gsap.killTweensOf(el);
                }
            });
        }
        
        // Pause extended animations
        if (window.extendedAnimations && window.extendedAnimations.destroy) {
            window.extendedAnimations.destroy();
        }
        
        // Emit event for other systems to pause
        window.dispatchEvent(new CustomEvent('emergency:animations-paused'));
    }
    
    closeCircuit() {
        this.circuitState = 'CLOSED';
        this.failureCount = 0;
        this.recoveryAttempts = 0;
        this.state.isRecovering = false;
        this.state.emergencyMode = false;
        this.state.consecutiveIneffectiveCleanups = 0;
        
        console.log('✅ Circuit breaker closed - System recovered');
        
        // Gradually restart animations
        this.restartAnimations();
        
        // Emit recovery event
        window.dispatchEvent(new CustomEvent('emergency:recovered'));
    }
    
    restartAnimations() {
        console.log('🔄 Gradually restarting animations...');
        
        // Restart with reduced intensity first
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('emergency:restart-animations', {
                detail: { intensity: 0.3 }
            }));
        }, 1000);
        
        // Increase to normal intensity after delay
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('emergency:restart-animations', {
                detail: { intensity: 1.0 }
            }));
        }, 5000);
    }
    
    enterEmergencyMode() {
        this.state.emergencyMode = true;
        console.error('🚨 ENTERING EMERGENCY MODE');
        
        // Immediate aggressive cleanup
        this.triggerAggressiveCleanup();
        
        // Open circuit breaker
        this.openCircuit();
        
        // Emit emergency event
        window.dispatchEvent(new CustomEvent('emergency:mode-active'));
    }
    
    enterSafeMode() {
        console.error('🛡️ ENTERING SAFE MODE - All animations disabled');
        
        // Kill all animations permanently
        if (window.gsap) {
            window.gsap.killTweensOf('*');
        }
        
        // Clear all intervals
        if (window.intervalManager) {
            window.intervalManager.emergencyStop();
        }
        
        // Show safe mode indicator
        this.showSafeModeIndicator();
        
        // Emit safe mode event
        window.dispatchEvent(new CustomEvent('emergency:safe-mode'));
    }
    
    triggerAggressiveCleanup() {
        console.log('🚨 Triggering aggressive cleanup...');
        
        // Perform immediate aggressive cleanup
        setTimeout(() => {
            this.performAggressiveDOMCleanup();
        }, 100);
        
        // Schedule periodic aggressive cleanup
        const aggressiveInterval = setInterval(() => {
            if (this.state.emergencyMode) {
                this.performAggressiveDOMCleanup();
            } else {
                clearInterval(aggressiveInterval);
            }
        }, 5000);
    }
    
    showSafeModeIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'safe-mode-indicator';
        indicator.innerHTML = '🛡️ SAFE MODE - Animations Disabled';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(255, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            pointer-events: none;
        `;
        
        if (!document.getElementById('safe-mode-indicator')) {
            document.body.appendChild(indicator);
        }
    }
    
    startMonitoring() {
        // Monitor system state every 5 seconds
        setInterval(() => {
            this.monitorSystemHealth();
        }, 5000);
    }
    
    monitorSystemHealth() {
        const currentNodes = document.querySelectorAll('*').length;
        const currentMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
        
        // Check if we're approaching critical thresholds
        if (currentNodes > this.config.domThreshold * 0.8) {
            console.warn(`⚠️ Approaching DOM threshold: ${currentNodes}/${this.config.domThreshold}`);
        }
        
        if (currentMemory > this.config.memoryThreshold * 0.8) {
            console.warn(`⚠️ Approaching memory threshold: ${this.formatBytes(currentMemory)}/${this.formatBytes(this.config.memoryThreshold)}`);
        }
    }
    
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    getState() {
        return {
            circuitState: this.circuitState,
            failureCount: this.failureCount,
            recoveryAttempts: this.recoveryAttempts,
            state: this.state,
            config: this.config
        };
    }
}

// Create and expose global instance
window.emergencyRecoverySystem = new EmergencyRecoverySystem();

export default EmergencyRecoverySystem;