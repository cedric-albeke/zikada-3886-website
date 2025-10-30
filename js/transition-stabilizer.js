// Transition Stabilizer - Prevents flashing and blackouts during scene transitions
// Ensures smooth, seamless transitions that maintain immersion

class TransitionStabilizer {
    constructor() {
        this.isTransitioning = false;
        this.transitionQueue = [];
        this.currentTransition = null;
        this.transitionHistory = [];
        this.maxHistorySize = 50;
        
        this.transitionConfig = {
            fadeInDuration: 800,
            fadeOutDuration: 600,
            crossfadeDuration: 400,
            minTransitionGap: 1000, // Minimum 1 second between transitions
            maxTransitionTime: 5000, // Maximum 5 seconds for any transition
            blackoutOpacity: 0.95,
            crossfadeOpacity: 0.3
        };
        
        this.overlayElements = {
            blackout: null,
            crossfade: null,
            loading: null
        };
        
        this.transitionStates = {
            IDLE: 'idle',
            FADING_OUT: 'fading_out',
            CROSSFADING: 'crossfading',
            FADING_IN: 'fading_in',
            COMPLETE: 'complete'
        };
        
        this.currentState = this.transitionStates.IDLE;
        
        this.init();
    }
    
    init() {
        this.createOverlayElements();
        this.setupTransitionHandlers();
        this.setupPerformanceMonitoring();
        this.setupErrorRecovery();
        
        console.log('🎬 Transition Stabilizer initialized');
    }
    
    createOverlayElements() {
        // Create blackout overlay
        this.overlayElements.blackout = this.createOverlay('transition-blackout', {
            background: 'rgba(0, 0, 0, 0.95)',
            zIndex: 99998,
            opacity: 0,
            transition: `opacity ${this.transitionConfig.fadeOutDuration}ms ease-in-out`
        });
        
        // Create crossfade overlay
        this.overlayElements.crossfade = this.createOverlay('transition-crossfade', {
            background: 'rgba(0, 0, 0, 0.3)',
            zIndex: 99997,
            opacity: 0,
            transition: `opacity ${this.transitionConfig.crossfadeDuration}ms ease-in-out`
        });
        
        // Create loading indicator
        this.overlayElements.loading = this.createLoadingIndicator();
        
        // Add overlays to DOM
        document.body.appendChild(this.overlayElements.blackout);
        document.body.appendChild(this.overlayElements.crossfade);
        document.body.appendChild(this.overlayElements.loading);
    }
    
    createOverlay(id, styles) {
        const overlay = document.createElement('div');
        overlay.id = id;
        overlay.className = 'transition-overlay';
        
        // Apply base styles
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        });
        
        // Apply custom styles
        Object.assign(overlay.style, styles);
        
        return overlay;
    }
    
    createLoadingIndicator() {
        const loading = document.createElement('div');
        loading.id = 'transition-loading';
        loading.className = 'transition-loading';
        
        loading.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner-ring"></div>
                <div class="spinner-ring"></div>
                <div class="spinner-ring"></div>
            </div>
        `;
        
        // Apply styles
        Object.assign(loading.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 99999,
            opacity: 0,
            transition: 'opacity 300ms ease-in-out',
            color: '#00ff00',
            fontFamily: 'Courier New, monospace',
            fontSize: '14px'
        });
        
        // Add CSS for spinner
        this.addSpinnerStyles();
        
        return loading;
    }
    
    addSpinnerStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .loading-spinner {
                position: relative;
                width: 40px;
                height: 40px;
            }
            
            .spinner-ring {
                position: absolute;
                width: 100%;
                height: 100%;
                border: 2px solid transparent;
                border-top: 2px solid #00ff00;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            .spinner-ring:nth-child(2) {
                width: 80%;
                height: 80%;
                top: 10%;
                left: 10%;
                animation-delay: -0.3s;
                border-top-color: #00ff85;
            }
            
            .spinner-ring:nth-child(3) {
                width: 60%;
                height: 60%;
                top: 20%;
                left: 20%;
                animation-delay: -0.6s;
                border-top-color: #00ff00;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    setupTransitionHandlers() {
        // Override existing transition methods
        this.patchExistingTransitions();
        
        // Setup transition event listeners
        this.setupTransitionEvents();
    }
    
    patchExistingTransitions() {
        // Patch chaos-init transition executor
        if (window.chaosInit && window.chaosInit._installPhaseController) {
            const originalMethod = window.chaosInit._installPhaseController;
            window.chaosInit._installPhaseController = () => {
                originalMethod.call(window.chaosInit);
                
                // Override the transition executor
                if (window.chaosInit.phaseController) {
                    window.chaosInit.phaseController.setTransitionExecutor(async ({ prev, next, signal }) => {
                        return this.executeStableTransition(prev, next, signal);
                    });
                }
            };
        }
        
        // Patch VJ receiver scene switching
        if (window.vjReceiver && window.vjReceiver.switchScene) {
            const originalSwitchScene = window.vjReceiver.switchScene;
            window.vjReceiver.switchScene = (sceneName) => {
                return this.executeStableSceneSwitch(sceneName, originalSwitchScene);
            };
        }
    }
    
    setupTransitionEvents() {
        // Listen for transition requests
        window.addEventListener('transition-request', (event) => {
            this.queueTransition(event.detail);
        });
        
        // Listen for scene change requests
        window.addEventListener('scene-change-request', (event) => {
            this.queueSceneChange(event.detail);
        });
    }
    
    setupPerformanceMonitoring() {
        // Monitor transition performance
        this.performanceMonitor = {
            transitionTimes: [],
            maxSamples: 20,
            lastTransition: 0
        };
        
        // Monitor for stuck transitions
        setInterval(() => {
            this.checkForStuckTransitions();
        }, 1000);
    }
    
    setupErrorRecovery() {
        // Setup error recovery for failed transitions
        this.errorRecovery = {
            maxRetries: 3,
            retryDelay: 1000,
            currentRetries: 0
        };
        
        // Listen for transition errors
        window.addEventListener('transition-error', (event) => {
            this.handleTransitionError(event.detail);
        });
    }
    
    async executeStableTransition(prev, next, signal) {
        if (this.isTransitioning) {
            console.warn('Transition already in progress, queuing...');
            return this.queueTransition({ prev, next, signal });
        }
        
        this.isTransitioning = true;
        this.currentTransition = { prev, next, signal, startTime: Date.now() };
        
        try {
            // Check if transition is too soon after last one
            const timeSinceLastTransition = Date.now() - this.performanceMonitor.lastTransition;
            if (timeSinceLastTransition < this.transitionConfig.minTransitionGap) {
                await this.delay(this.transitionConfig.minTransitionGap - timeSinceLastTransition);
            }
            
            // Execute the transition
            await this.performTransition(prev, next, signal);
            
            // Record performance
            this.recordTransitionPerformance();
            
        } catch (error) {
            console.error('Transition failed:', error);
            this.handleTransitionError({ error, prev, next });
        } finally {
            this.isTransitioning = false;
            this.currentTransition = null;
        }
    }
    
    async performTransition(prev, next, signal) {
        const startTime = Date.now();
        
        try {
            // Phase 1: Fade out current scene
            this.currentState = this.transitionStates.FADING_OUT;
            await this.fadeOutCurrentScene();
            
            if (signal?.aborted) return;
            
            // Phase 2: Show loading indicator
            this.showLoadingIndicator();
            
            // Phase 3: Cleanup previous scene
            await this.cleanupPreviousScene(prev);
            
            if (signal?.aborted) return;
            
            // Phase 4: Prepare new scene
            await this.prepareNewScene(next);
            
            if (signal?.aborted) return;
            
            // Phase 5: Crossfade to new scene
            this.currentState = this.transitionStates.CROSSFADING;
            await this.crossfadeToNewScene();
            
            if (signal?.aborted) return;
            
            // Phase 6: Fade in new scene
            this.currentState = this.transitionStates.FADING_IN;
            await this.fadeInNewScene();
            
            // Phase 7: Complete transition
            this.currentState = this.transitionStates.COMPLETE;
            this.hideLoadingIndicator();
            this.hideAllOverlays();
            
            // Notify completion
            this.notifyTransitionComplete(prev, next);
            
        } catch (error) {
            // Emergency recovery
            this.emergencyRecovery();
            throw error;
        }
    }
    
    async fadeOutCurrentScene() {
        return new Promise((resolve) => {
            // Fade out blackout overlay
            this.overlayElements.blackout.style.opacity = this.transitionConfig.blackoutOpacity;
            
            // Fade out current scene elements
            const sceneElements = document.querySelectorAll('[data-phase], .scene-element');
            sceneElements.forEach(el => {
                el.style.transition = `opacity ${this.transitionConfig.fadeOutDuration}ms ease-in-out`;
                el.style.opacity = '0';
            });
            
            setTimeout(resolve, this.transitionConfig.fadeOutDuration);
        });
    }
    
    async cleanupPreviousScene(prev) {
        // Clean up previous scene elements
        const prevElements = document.querySelectorAll(`[data-phase="${prev}"], .scene-${prev}`);
        prevElements.forEach(el => {
            try {
                el.remove();
            } catch (e) {
                // Ignore removal errors
            }
        });
        
        // Clean up animations
        if (window.gsap && window.gsap.globalTimeline) {
            const timeline = window.gsap.globalTimeline;
            const children = timeline.getChildren();
            children.forEach(child => {
                if (child.vars && child.vars.scene === prev) {
                    child.kill();
                }
            });
        }
        
        // Small delay to ensure cleanup is complete
        await this.delay(100);
    }
    
    async prepareNewScene(next) {
        // Trigger new scene preparation
        if (window.chaosInit && window.chaosInit._phaseMap && window.chaosInit._phaseMap.has(next)) {
            try {
                await window.chaosInit._phaseMap.get(next)();
            } catch (e) {
                console.warn('Phase preparation error:', next, e);
            }
        }
        
        // Prepare scene elements
        const nextElements = document.querySelectorAll(`[data-phase="${next}"], .scene-${next}`);
        nextElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transition = `opacity ${this.transitionConfig.fadeInDuration}ms ease-in-out`;
        });
    }
    
    async crossfadeToNewScene() {
        return new Promise((resolve) => {
            // Show crossfade overlay
            this.overlayElements.crossfade.style.opacity = this.transitionConfig.crossfadeOpacity;
            
            setTimeout(resolve, this.transitionConfig.crossfadeDuration);
        });
    }
    
    async fadeInNewScene() {
        return new Promise((resolve) => {
            // Fade in new scene elements
            const nextElements = document.querySelectorAll('[data-phase], .scene-element');
            nextElements.forEach(el => {
                el.style.opacity = '1';
            });
            
            // Fade out crossfade overlay
            this.overlayElements.crossfade.style.opacity = '0';
            
            // Fade out blackout overlay
            this.overlayElements.blackout.style.opacity = '0';
            
            setTimeout(resolve, this.transitionConfig.fadeInDuration);
        });
    }
    
    showLoadingIndicator() {
        this.overlayElements.loading.style.opacity = '1';
    }
    
    hideLoadingIndicator() {
        this.overlayElements.loading.style.opacity = '0';
    }
    
    hideAllOverlays() {
        this.overlayElements.blackout.style.opacity = '0';
        this.overlayElements.crossfade.style.opacity = '0';
        this.overlayElements.loading.style.opacity = '0';
    }
    
    async executeStableSceneSwitch(sceneName, originalMethod) {
        if (this.isTransitioning) {
            console.warn('Scene switch queued - transition in progress');
            return this.queueSceneChange({ sceneName, originalMethod });
        }
        
        this.isTransitioning = true;
        
        try {
            // Execute the scene switch with stable transition
            const result = await this.executeStableTransition(null, sceneName, null);
            
            // Call original method if needed
            if (originalMethod) {
                originalMethod.call(window.vjReceiver, sceneName);
            }
            
            return result;
        } finally {
            this.isTransitioning = false;
        }
    }
    
    queueTransition(transitionData) {
        this.transitionQueue.push(transitionData);
        this.processTransitionQueue();
    }
    
    queueSceneChange(sceneData) {
        this.transitionQueue.push({
            type: 'scene_change',
            ...sceneData
        });
        this.processTransitionQueue();
    }
    
    async processTransitionQueue() {
        if (this.isTransitioning || this.transitionQueue.length === 0) {
            return;
        }
        
        const nextTransition = this.transitionQueue.shift();
        
        if (nextTransition.type === 'scene_change') {
            await this.executeStableSceneSwitch(nextTransition.sceneName, nextTransition.originalMethod);
        } else {
            await this.executeStableTransition(nextTransition.prev, nextTransition.next, nextTransition.signal);
        }
    }
    
    checkForStuckTransitions() {
        if (!this.isTransitioning || !this.currentTransition) return;
        
        const elapsed = Date.now() - this.currentTransition.startTime;
        if (elapsed > this.transitionConfig.maxTransitionTime) {
            console.error('Transition stuck, forcing recovery');
            this.emergencyRecovery();
        }
    }
    
    emergencyRecovery() {
        console.error('🚨 Emergency transition recovery');
        
        // Hide all overlays
        this.hideAllOverlays();
        
        // Reset state
        this.isTransitioning = false;
        this.currentTransition = null;
        this.currentState = this.transitionStates.IDLE;
        
        // Clear transition queue
        this.transitionQueue = [];
        
        // Notify recovery
        window.dispatchEvent(new CustomEvent('transition-recovery'));
    }
    
    handleTransitionError(errorData) {
        console.error('Transition error:', errorData);
        
        if (this.errorRecovery.currentRetries < this.errorRecovery.maxRetries) {
            this.errorRecovery.currentRetries++;
            console.log(`Retrying transition (${this.errorRecovery.currentRetries}/${this.errorRecovery.maxRetries})`);
            
            setTimeout(() => {
                this.emergencyRecovery();
            }, this.errorRecovery.retryDelay);
        } else {
            console.error('Max retries exceeded, forcing recovery');
            this.emergencyRecovery();
        }
    }
    
    recordTransitionPerformance() {
        if (this.currentTransition) {
            const duration = Date.now() - this.currentTransition.startTime;
            this.performanceMonitor.transitionTimes.push(duration);
            
            if (this.performanceMonitor.transitionTimes.length > this.performanceMonitor.maxSamples) {
                this.performanceMonitor.transitionTimes.shift();
            }
            
            this.performanceMonitor.lastTransition = Date.now();
            
            // Add to history
            this.transitionHistory.push({
                from: this.currentTransition.prev,
                to: this.currentTransition.next,
                duration: duration,
                timestamp: Date.now()
            });
            
            if (this.transitionHistory.length > this.maxHistorySize) {
                this.transitionHistory.shift();
            }
        }
    }
    
    notifyTransitionComplete(prev, next) {
        // Dispatch completion event
        window.dispatchEvent(new CustomEvent('transition-complete', {
            detail: { from: prev, to: next, timestamp: Date.now() }
        }));
        
        // Notify VJ receiver
        if (window.vjReceiver && window.vjReceiver.sendMessage) {
            window.vjReceiver.sendMessage({
                type: 'scene_changed',
                scene: next,
                timestamp: Date.now()
            });
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    getTransitionStats() {
        const avgTransitionTime = this.performanceMonitor.transitionTimes.length > 0 ?
            this.performanceMonitor.transitionTimes.reduce((a, b) => a + b, 0) / this.performanceMonitor.transitionTimes.length : 0;
        
        return {
            isTransitioning: this.isTransitioning,
            currentState: this.currentState,
            queueLength: this.transitionQueue.length,
            avgTransitionTime: Math.round(avgTransitionTime),
            totalTransitions: this.transitionHistory.length,
            recentTransitions: this.transitionHistory.slice(-5)
        };
    }
    
    destroy() {
        // Remove overlay elements
        Object.values(this.overlayElements).forEach(el => {
            if (el && el.parentNode) {
                el.parentNode.removeChild(el);
            }
        });
        
        // Clear state
        this.isTransitioning = false;
        this.transitionQueue = [];
        this.currentTransition = null;
        
        console.log('🧹 Transition Stabilizer destroyed');
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.transitionStabilizer = new TransitionStabilizer();
}

export default TransitionStabilizer;
