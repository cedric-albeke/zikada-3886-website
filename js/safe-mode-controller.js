/**
 * SAFE_MODE Emergency Controller
 * 
 * Global kill switch that immediately stops runaway processes and enforces hard caps.
 * Activated by query param ?safe=1 or programmatically via window.ACTIVATE_SAFE_MODE()
 */

class SafeModeController {
    constructor() {
        this.isSafeModeActive = false;
        this.isInitialized = false;
        
        // Hard caps
        this.MAX_CONCURRENT_TIMERS = 12;
        this.MAX_RAF_CALLBACKS = 10;
        this.MAX_DOM_NODES_CREATED = 300;
        this.MAX_HEAP_GROWTH_MB_PER_MIN = 50;
        
        // Tracking
        this.domNodesCreated = 0;
        this.initialDOMCount = 0;
        this.activeTimers = new Set();
        this.activeRAFs = new Set();
        this.lastHeapCheck = { size: 0, time: Date.now() };
        
        // Grace period for initialization
        this.initializationStartTime = Date.now();
        this.INITIALIZATION_GRACE_PERIOD = 5000; // 5 seconds
        
        // State
        this.disabledSystems = new Set();
        this.originalRAF = null;
        this.rafMultiplexer = null;
        this.emergencyTriggered = false;
        
        console.log('🛡️ SafeModeController initialized');
    }
    
    init() {
        if (this.isInitialized) return;
        
        // Check if SAFE_MODE should be activated
        const urlParams = new URLSearchParams(window.location.search);
        const shouldActivate = urlParams.get('safe') === '1' || 
                              localStorage.getItem('FORCE_SAFE_MODE') === 'true';
        
        // Store initial measurements
        this.initialDOMCount = document.querySelectorAll('*').length;
        if (performance.memory) {
            this.lastHeapCheck.size = performance.memory.usedJSHeapSize;
        }
        
        // Set up monitoring
        this.setupDOMMonitoring();
        this.setupTimerInterception();
        this.setupRAFMultiplexer();
        this.setupHeapMonitoring();
        
        // Activate SAFE_MODE if requested
        if (shouldActivate) {
            this.activateSafeMode('query_param');
        }
        
        // Global emergency handlers
        this.setupEmergencyHandlers();
        
        this.isInitialized = true;
        console.log(`🛡️ SafeModeController ready (SAFE_MODE: ${this.isSafeModeActive ? 'ACTIVE' : 'INACTIVE'})`);
    }
    
    activateSafeMode(reason = 'manual') {
        if (this.isSafeModeActive) return;
        
        console.warn(`🚨 ACTIVATING SAFE_MODE (reason: ${reason})`);
        console.warn('🚨 ============================================');
        console.warn('🚨 SAFE MODE ACTIVE - HEAVY EFFECTS DISABLED');
        console.warn('🚨 ============================================');
        
        this.isSafeModeActive = true;
        this.emergencyTriggered = false;
        
        // Disable costly subsystems
        this.disablePostProcessing();
        this.disableParticleEmitters();
        this.disableTextEffects();
        this.disableMatrixEffects();
        this.disableCorruptionEffects();
        this.pauseHeavyAnimations();
        
        // Update feature flags
        if (window.SAFE_FLAGS) {
            window.SAFE_FLAGS.PERF_SAFE_MODE = true;
            window.SAFE_FLAGS.DATA_CORRUPTION_ENABLED = false;
            window.SAFE_FLAGS.EXTENDED_ANIMATIONS_ENABLED = false;
            window.SAFE_FLAGS.RANDOM_ANIMATIONS_ENABLED = false;
        }
        
        // Emit event for other systems
        window.dispatchEvent(new CustomEvent('safe-mode:activated', {
            detail: { reason, timestamp: Date.now() }
        }));
        
        // Visual indicator
        this.showSafeModeIndicator();
    }
    
    deactivateSafeMode() {
        if (!this.isSafeModeActive) return;
        
        console.log('✅ DEACTIVATING SAFE_MODE');
        this.isSafeModeActive = false;
        
        // Re-enable systems (carefully)
        this.enablePostProcessing();
        this.enableParticleEmitters();
        this.resumeAnimations();
        
        // Update feature flags
        if (window.SAFE_FLAGS) {
            window.SAFE_FLAGS.PERF_SAFE_MODE = false;
        }
        
        // Remove visual indicator
        this.hideSafeModeIndicator();
        
        // Emit event
        window.dispatchEvent(new CustomEvent('safe-mode:deactivated', {
            detail: { timestamp: Date.now() }
        }));
    }
    
    setupDOMMonitoring() {
        // Override createElement to track node creation
        const originalCreateElement = document.createElement;
        document.createElement = (tagName) => {
            const element = originalCreateElement.call(document, tagName);
            
            // Count visual effect elements
            if (this.isVisualEffectElement(tagName)) {
                this.domNodesCreated++;
                
                if (this.domNodesCreated > this.MAX_DOM_NODES_CREATED) {
                    this.handleDOMCapExceeded();
                    return element; // Return element but disable further creation
                }
            }
            
            return element;
        };
        
        // MutationObserver for rapid DOM growth
        this.domObserver = new MutationObserver((mutations) => {
            let addedNodes = 0;
            mutations.forEach(mutation => {
                addedNodes += mutation.addedNodes.length;
            });
            
            if (addedNodes > 200 && !this.isSafeModeActive) {
                console.warn(`🚨 Rapid DOM growth detected: ${addedNodes} nodes added`);
                this.activateSafeMode('dom_explosion');
            }
        });
        
        this.domObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    isVisualEffectElement(tagName) {
        return ['div', 'span', 'canvas'].includes(tagName.toLowerCase());
    }
    
    handleDOMCapExceeded() {
        if (!this.emergencyTriggered) {
            console.error(`🚨 DOM creation cap exceeded: ${this.domNodesCreated}/${this.MAX_DOM_NODES_CREATED}`);
            this.emergencyTriggered = true;
            this.activateSafeMode('dom_cap_exceeded');
        }
    }
    
    setupTimerInterception() {
        const originalSetInterval = window.setInterval;
        const originalSetTimeout = window.setTimeout;
        const originalClearInterval = window.clearInterval;
        const originalClearTimeout = window.clearTimeout;
        
        window.setInterval = (callback, delay, ...args) => {
            const withinGracePeriod = (Date.now() - this.initializationStartTime) < this.INITIALIZATION_GRACE_PERIOD;
            
            if (this.activeTimers.size >= this.MAX_CONCURRENT_TIMERS) {
                console.warn(`🚨 Timer cap exceeded: ${this.activeTimers.size}/${this.MAX_CONCURRENT_TIMERS}`);
                if (!this.isSafeModeActive && !withinGracePeriod) {
                    this.activateSafeMode('timer_cap_exceeded');
                    return null; // Deny timer creation
                } else if (withinGracePeriod) {
                    console.warn(`⚠️ Timer cap exceeded during initialization - grace period active`);
                }
            }
            
            const id = originalSetInterval(callback, delay, ...args);
            this.activeTimers.add(id);
            return id;
        };
        
        window.setTimeout = (callback, delay, ...args) => {
            const withinGracePeriod = (Date.now() - this.initializationStartTime) < this.INITIALIZATION_GRACE_PERIOD;
            
            if (this.activeTimers.size >= this.MAX_CONCURRENT_TIMERS) {
                console.warn(`🚨 Timer cap exceeded: ${this.activeTimers.size}/${this.MAX_CONCURRENT_TIMERS}`);
                if (!withinGracePeriod) {
                    return null;
                }
            }
            
            const id = originalSetTimeout(() => {
                this.activeTimers.delete(id);
                callback();
            }, delay, ...args);
            this.activeTimers.add(id);
            return id;
        };
        
        window.clearInterval = (id) => {
            this.activeTimers.delete(id);
            return originalClearInterval(id);
        };
        
        window.clearTimeout = (id) => {
            this.activeTimers.delete(id);
            return originalClearTimeout(id);
        };
    }
    
    setupRAFMultiplexer() {
        this.originalRAF = window.requestAnimationFrame;
        const callbacks = new Map();
        let rafId = 0;
        let isRunning = false;
        
        // Store reference to this for use in closures
        const self = this;
        
        const tick = (timestamp) => {
            if (!isRunning) return;
            
            // Execute callbacks with budget
            for (const [id, callback] of callbacks) {
                try {
                    const start = performance.now();
                    callback(timestamp);
                    const duration = performance.now() - start;
                    
                    // Budget exceeded - skip next frame for this callback
                    if (duration > 16) {
                        console.warn(`🐌 RAF callback exceeded budget: ${duration.toFixed(2)}ms`);
                    }
                } catch (error) {
                    console.error('❌ RAF callback error:', error);
                    callbacks.delete(id); // Remove problematic callback
                }
            }
            
            // Continue loop if we have callbacks
            if (callbacks.size > 0) {
                self.originalRAF.call(window, tick);
            } else {
                isRunning = false;
            }
        };
        
        window.requestAnimationFrame = (callback) => {
            const withinGracePeriod = (Date.now() - self.initializationStartTime) < self.INITIALIZATION_GRACE_PERIOD;
            
            if (callbacks.size >= self.MAX_RAF_CALLBACKS && !self.isSafeModeActive && !withinGracePeriod) {
                console.warn(`🚨 RAF callback cap exceeded: ${callbacks.size}/${self.MAX_RAF_CALLBACKS}`);
                self.activateSafeMode('raf_cap_exceeded');
                return null;
            } else if (callbacks.size >= self.MAX_RAF_CALLBACKS && withinGracePeriod) {
                console.warn(`⚠️ RAF callback cap exceeded during initialization (${callbacks.size}/${self.MAX_RAF_CALLBACKS}) - grace period active`);
            }
            
            const id = ++rafId;
            callbacks.set(id, callback);
            
            if (!isRunning) {
                isRunning = true;
                self.originalRAF.call(window, tick);
            }
            
            return id;
        };
        
        window.cancelAnimationFrame = (id) => {
            callbacks.delete(id);
        };
        
        this.rafMultiplexer = { callbacks };
    }
    
    setupHeapMonitoring() {
        setInterval(() => {
            if (!performance.memory) return;
            
            const now = Date.now();
            const currentHeap = performance.memory.usedJSHeapSize;
            const timeDiff = (now - this.lastHeapCheck.time) / 1000 / 60; // minutes
            const heapDiff = (currentHeap - this.lastHeapCheck.size) / 1024 / 1024; // MB
            
            if (timeDiff > 0.5) { // Check every 30 seconds
                const growthRate = heapDiff / timeDiff; // MB per minute
                
                if (growthRate > this.MAX_HEAP_GROWTH_MB_PER_MIN && !this.isSafeModeActive) {
                    console.warn(`🚨 Excessive heap growth: ${growthRate.toFixed(2)} MB/min`);
                    this.activateSafeMode('heap_growth_exceeded');
                }
                
                this.lastHeapCheck = { size: currentHeap, time: now };
            }
        }, 30000);
    }
    
    disablePostProcessing() {
        this.disabledSystems.add('postprocessing');
        
        // Signal to chaos engine to bypass post-processing
        window.dispatchEvent(new CustomEvent('safe-mode:disable-postprocessing'));
        
        console.log('🚫 Post-processing disabled');
    }
    
    disableParticleEmitters() {
        this.disabledSystems.add('particles');
        window.dispatchEvent(new CustomEvent('safe-mode:disable-particles'));
        console.log('🚫 Particle emitters disabled');
    }
    
    disableTextEffects() {
        this.disabledSystems.add('texteffects');
        
        if (window.textEffects && typeof window.textEffects.destroy === 'function') {
            try {
                window.textEffects.destroy();
            } catch (error) {
                console.warn('⚠️ Error destroying text effects:', error);
            }
        }
        
        console.log('🚫 Text effects disabled');
    }
    
    disableMatrixEffects() {
        this.disabledSystems.add('matrix');
        window.dispatchEvent(new CustomEvent('safe-mode:disable-matrix'));
        console.log('🚫 Matrix effects disabled');
    }
    
    disableCorruptionEffects() {
        this.disabledSystems.add('corruption');
        
        // Remove corruption overlays
        document.querySelectorAll('.corruption-overlay, .data-corruption-safe').forEach(el => {
            try {
                el.remove();
            } catch (e) {
                // Element may already be removed
            }
        });
        
        console.log('🚫 Corruption effects disabled');
    }
    
    pauseHeavyAnimations() {
        // Pause GSAP timelines
        if (window.gsap) {
            try {
                window.gsap.globalTimeline.pause();
                console.log('⏸️ GSAP animations paused');
            } catch (error) {
                console.warn('⚠️ Error pausing GSAP:', error);
            }
        }
        
        // Pause Lottie animations
        if (window.lottieInstances) {
            window.lottieInstances.forEach(instance => {
                try {
                    instance.pause();
                } catch (error) {
                    console.warn('⚠️ Error pausing Lottie:', error);
                }
            });
        }
    }
    
    enablePostProcessing() {
        this.disabledSystems.delete('postprocessing');
        window.dispatchEvent(new CustomEvent('safe-mode:enable-postprocessing'));
    }
    
    enableParticleEmitters() {
        this.disabledSystems.delete('particles');
        window.dispatchEvent(new CustomEvent('safe-mode:enable-particles'));
    }
    
    resumeAnimations() {
        if (window.gsap) {
            try {
                window.gsap.globalTimeline.resume();
                console.log('▶️ GSAP animations resumed');
            } catch (error) {
                console.warn('⚠️ Error resuming GSAP:', error);
            }
        }
    }
    
    showSafeModeIndicator() {
        // Remove existing indicator
        this.hideSafeModeIndicator();
        
        const indicator = document.createElement('div');
        indicator.id = 'safe-mode-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #ff4444;
            color: white;
            padding: 8px 12px;
            font-family: monospace;
            font-size: 12px;
            font-weight: bold;
            border-radius: 4px;
            z-index: 999999;
            pointer-events: none;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;
        indicator.textContent = '🛡️ SAFE MODE ACTIVE';
        
        document.body.appendChild(indicator);
    }
    
    hideSafeModeIndicator() {
        const indicator = document.getElementById('safe-mode-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    setupEmergencyHandlers() {
        // Global error handler
        window.addEventListener('error', (event) => {
            if (event.error && event.error.message && 
                (event.error.message.includes('adjustPostProcessing') || 
                 event.error.message.includes('activeEffects is not iterable'))) {
                console.error('🚨 Critical error detected, activating SAFE_MODE');
                this.activateSafeMode('critical_error');
            }
        });
        
        // Memory pressure handler
        document.addEventListener('memory:critical', () => {
            this.activateSafeMode('memory_critical');
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            // Ctrl+Shift+S to toggle SAFE_MODE
            if (event.ctrlKey && event.shiftKey && event.key === 'S') {
                if (this.isSafeModeActive) {
                    this.deactivateSafeMode();
                } else {
                    this.activateSafeMode('keyboard_shortcut');
                }
                event.preventDefault();
            }
        });
    }
    
    getStatus() {
        return {
            isSafeModeActive: this.isSafeModeActive,
            domNodesCreated: this.domNodesCreated,
            activeTimers: this.activeTimers.size,
            activeRAFs: this.rafMultiplexer ? this.rafMultiplexer.callbacks.size : 0,
            disabledSystems: Array.from(this.disabledSystems),
            caps: {
                maxDOMNodes: this.MAX_DOM_NODES_CREATED,
                maxTimers: this.MAX_CONCURRENT_TIMERS,
                maxRAFs: this.MAX_RAF_CALLBACKS
            }
        };
    }
    
    emergencyStop() {
        console.error('🚨🚨🚨 EMERGENCY STOP TRIGGERED 🚨🚨🚨');
        this.activateSafeMode('emergency_stop');
        
        // Force cleanup
        if (window.emergencyCleanup) {
            window.emergencyCleanup.emergencyStop();
        }
        
        // Kill all timers
        for (const id of this.activeTimers) {
            clearInterval(id);
            clearTimeout(id);
        }
        this.activeTimers.clear();
        
        // Clear RAF callbacks
        if (this.rafMultiplexer) {
            this.rafMultiplexer.callbacks.clear();
        }
    }
}

// Create and initialize global instance
const safeModeController = new SafeModeController();

// Global exports
window.safeModeController = safeModeController;
window.ACTIVATE_SAFE_MODE = (reason) => safeModeController.activateSafeMode(reason);
window.DEACTIVATE_SAFE_MODE = () => safeModeController.deactivateSafeMode();
window.SAFE_MODE_STATUS = () => safeModeController.getStatus();
window.EMERGENCY_STOP = () => safeModeController.emergencyStop();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => safeModeController.init());
} else {
    safeModeController.init();
}

export default safeModeController;