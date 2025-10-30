import gsap from 'gsap';
import perfConfig from './perf-config.js';
import intervalManager from './interval-manager.js';

class BackgroundAnimator {
    constructor() {
        this.bgElement = null;
        this.bgOverlay = null;
        this.logoWrapper = null;
        this.imageWrapper = null;
        this.timeline = null;
        this.initialized = false;
        
        // Performance tracking
        this.activeAnimations = new Map(); // Change to Map for better tracking
        this.activeTweens = new Map(); // Track individual tweens by name
        this._warnedMissingElement = false;
        
        // GSAP context for proper cleanup
        this.ctx = null;
        
        // Visibility observer for pausing animations
        this.observer = null;
        this.pageVisibilityObserver = null;
        this.isElementVisible = true;
        this.isPageVisible = !document.hidden;
        this.isPaused = false;
        this.isDegraded = false;
        
        // Managed intervals
        this.managedIntervals = new Map();
        
        // Performance state
        this.performanceState = {
            qualityLevel: 1.0, // 0.0 = disabled, 1.0 = full quality
            effectsEnabled: true,
            glowEnabled: true
        };
        
        // Bind methods to maintain context
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.handleSoftDegrade = this.handleSoftDegrade.bind(this);
        this.handleRestore = this.handleRestore.bind(this);
        this.handleEmergencyStop = this.handleEmergencyStop.bind(this);
    }

    init() {
        if (this.initialized) {
            console.warn('BackgroundAnimator already initialized');
            return;
        }
        
        // Get elements with existence checks
        this.bgElement = this.findElement('.bg');
        this.bgOverlay = this.findElement('.bg-overlay');
        this.logoWrapper = this.findElement('.logo-text-wrapper');
        this.imageWrapper = this.findElement('.image-wrapper');

        if (!this.bgElement) {
            if (!this._warnedMissingElement) {
                console.warn('🎨 Background element (.bg) not found - animations disabled');
                this._warnedMissingElement = true;
            }
            return;
        }
        
        // Initialize page visibility state
        this.isPageVisible = !document.hidden;
        
        // Create GSAP context for proper cleanup
        this.ctx = gsap.context(() => {
            // All GSAP animations will be created within this context
            this.initializeAnimations();
        }, this.bgElement);
        
        // Set up visibility observers
        this.setupVisibilityObserver();
        this.setupPageVisibilityObserver();
        
        // Listen for performance events
        window.addEventListener('perf:soft-degrade', this.handleSoftDegrade);
        window.addEventListener('perf:restore', this.handleRestore);
        window.addEventListener('perf:emergency-stop', this.handleEmergencyStop);
        
        // Listen for GSAP animation registry pause/resume events
        window.addEventListener('perf:pause-background', () => this.pauseGlow());
        window.addEventListener('perf:resume-background', () => this.resumeGlow());

        this.initialized = true;
        
        if (perfConfig.shouldLog()) {
            console.log('🎨 BackgroundAnimator initialized with enhanced visibility controls');
        }
    }
    
    findElement(selector) {
        try {
            return document.querySelector(selector);
        } catch (e) {
            console.warn(`Invalid selector: ${selector}`);
            return null;
        }
    }
    
    initializeAnimations() {
        if (!perfConfig.isFeatureEnabled('enableBackgroundGlow')) {
            if (perfConfig.shouldLog()) {
                console.log('💤 Background animations disabled by feature flag');
            }
            return;
        }
        
        // Center the background properly
        this.centerBackground();

        // Initialize animations only if elements exist
        this.setupContinuousRotation();
        this.setupPulsatingEffects();
        this.setupColorShifts();
        this.setupLogoReaction();
    }

    centerBackground() {
        // Ensure background is centered while preserving original scale
        gsap.set(this.bgElement, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            xPercent: -50,
            yPercent: -50,
            scale: 3, // Preserve original CSS scale
            transformOrigin: 'center center'
        });
    }

    setupContinuousRotation() {
        // Kill any existing rotation tweens
        this.killTween('bgRotation');
        this.killTween('bgDepthRotation');
        
        // Very slow continuous rotation - single tween management
        const rotationTween = gsap.to(this.bgElement, {
            rotation: 360,
            duration: 240 * this.performanceState.qualityLevel, // Adjust speed based on quality
            repeat: -1,
            ease: 'none',
            _regCategory: 'background',
            _regSoftCap: true
        });
        this.activeTweens.set('bgRotation', rotationTween);

        // Very subtle z-axis rotation for depth - only at high quality
        if (this.performanceState.qualityLevel > 0.5) {
            const depthTween = gsap.to(this.bgElement, {
                rotationY: 5 * this.performanceState.qualityLevel,
                rotationX: 5 * this.performanceState.qualityLevel,
                duration: 20,
                yoyo: true,
                repeat: -1,
                ease: 'power2.inOut',
                _regCategory: 'background',
                _regSoftCap: true
            });
            this.activeTweens.set('bgDepthRotation', depthTween);
        }
    }

    setupPulsatingEffects() {
        // Create master timeline for pulsating
        const pulseTimeline = gsap.timeline({ repeat: -1 });

        // Very subtle scale pulsing
        pulseTimeline
            .to(this.bgElement, {
                scale: 3.02, // Even smaller range
                duration: 10, // Slower
                ease: 'power2.inOut'
            })
            .to(this.bgElement, {
                scale: 2.98,
                duration: 10,
                ease: 'power2.inOut'
            });

        // Very subtle opacity breathing for background
        gsap.to(this.bgElement, {
            opacity: 0.06, // More subtle
            duration: 6, // Slower
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });

        // Set initial opacity
        gsap.set(this.bgElement, { opacity: 0.05 });

        // Removed blur pulsing - too distracting
    }

    setupColorShifts() {
        // Kill existing color and glow tweens
        this.killTween('bgColorShift');
        this.killTween('bgGlow');
        
        // Only run color shifts at medium quality or higher
        if (this.performanceState.qualityLevel >= 0.5 && this.bgOverlay) {
            // Replace expensive filter animations with opacity/scale alternatives where possible
            // Use more efficient transforms instead of filters when visually equivalent
            const colorTimeline = gsap.timeline({ 
                repeat: -1,
                _regCategory: 'background',
                _regSoftCap: true
            });

            // Use opacity and scale instead of expensive filters for performance
            colorTimeline
                .to(this.bgOverlay, {
                    opacity: 0.8,
                    scale: 1.01,
                    duration: 12,
                    ease: 'sine.inOut'
                })
                .to(this.bgOverlay, {
                    opacity: 0.6,
                    scale: 0.99,
                    duration: 10,
                    ease: 'sine.inOut'
                })
                .to(this.bgOverlay, {
                    opacity: 0.9,
                    scale: 1.02,
                    duration: 14,
                    ease: 'sine.inOut'
                })
                .to(this.bgOverlay, {
                    opacity: 0.7,
                    scale: 0.98,
                    duration: 11,
                    ease: 'sine.inOut'
                })
                .to(this.bgOverlay, {
                    opacity: 0.85,
                    scale: 1.0,
                    duration: 8,
                    ease: 'sine.inOut'
                });
                
            this.activeTweens.set('bgColorShift', colorTimeline);
        }

        // Setup managed glow effect
        this.setupManagedGlow();
    }
    
    setupManagedGlow() {
        if (!this.performanceState.glowEnabled) {
            return;
        }
        
        // Clear any existing glow interval
        this.clearManagedInterval('bgGlow');
        
        // Dynamic glow color shifts with proper lifecycle management
        const glowColors = [
            'rgba(0, 255, 133, 0.3)',   // Green
            'rgba(0, 200, 255, 0.25)',  // Cyan
            'rgba(150, 100, 255, 0.2)', // Purple
            'rgba(255, 100, 150, 0.2)', // Pink
            'rgba(100, 255, 200, 0.25)' // Mint
        ];

        let colorIndex = 0;
        const shiftGlow = () => {
            // Guard: ensure element still exists and is connected
            if (!this.bgElement || !this.bgElement.isConnected || !this.shouldAnimate()) {
                return;
            }
            
            // Kill previous glow tween to prevent stacking
            this.killTween('bgGlow');
            
            const glowTween = gsap.to(this.bgElement, {
                boxShadow: `0 0 ${100 * this.performanceState.qualityLevel}px ${glowColors[colorIndex]}`,
                duration: 4,
                ease: 'power2.inOut',
                overwrite: 'auto',
                _regCategory: 'background',
                _regSoftCap: true,
                onComplete: () => {
                    this.activeTweens.delete('bgGlow');
                },
                onStart: () => {
                    perfConfig.incrementCounter('animations');
                },
                onKill: () => {
                    perfConfig.decrementCounter('animations');
                }
            });
            
            this.activeTweens.set('bgGlow', glowTween);
            colorIndex = (colorIndex + 1) % glowColors.length;
        };

        // Use managed interval with proper cleanup
        const glowInterval = intervalManager.createInterval(
            shiftGlow,
            4000,
            'background-glow',
            {
                owner: 'background-animator',
                category: 'background',
                maxAge: Infinity // Runs until explicitly cleared
            }
        );
        
        this.managedIntervals.set('bgGlow', glowInterval);
        shiftGlow(); // Initial call
    }

    setupLogoReaction() {
        if (!this.logoWrapper || !this.imageWrapper) return;

        // Very subtle synchronized breathing effect
        const syncTimeline = gsap.timeline({ repeat: -1 });

        // Very subtle logo scale reaction
        syncTimeline
            .to(this.logoWrapper, {
                scale: 1.01, // Even smaller range
                duration: 10, // Slower
                ease: 'power2.inOut'
            }, 0)
            .to(this.logoWrapper, {
                scale: 0.99,
                duration: 10,
                ease: 'power2.inOut'
            }, 10);

        // Slower image wrapper rotation
        gsap.to(this.imageWrapper, {
            rotation: -360,
            duration: 120, // Much slower
            repeat: -1,
            ease: 'none'
        });

        // Very subtle glow pulse
        const glowElement = document.querySelector('.glow');
        if (glowElement) {
            gsap.to(glowElement, {
                opacity: 0.6,
                scale: 1.05, // Even smaller scale
                duration: 6, // Slower
                yoyo: true,
                repeat: -1,
                ease: 'sine.inOut'
            });
        }

        // Removed brightness filter - too flashy
    }

    // Method to add glitch bursts
    triggerGlitchBurst() {
        if (!this.bgElement) return;

        gsap.to(this.bgElement, {
            skewX: Math.random() * 10 - 5,
            skewY: Math.random() * 10 - 5,
            duration: 0.1,
            yoyo: true,
            repeat: 3,
            ease: 'power4.inOut',
            onComplete: () => {
                gsap.set(this.bgElement, { skewX: 0, skewY: 0 });
            }
        });
    }

    // Periodic glitch triggers
    startGlitchSequence() {
        // Use managed interval instead of raw setInterval
        const glitchInterval = intervalManager.createInterval(
            () => {
                if (Math.random() > 0.7 && this.shouldAnimate()) {
                    this.triggerGlitchBurst();
                }
            },
            8000,
            'background-glitch',
            {
                owner: 'background-animator',
                category: 'background',
                maxAge: Infinity
            }
        );
        this.managedIntervals.set('bgGlitch', glitchInterval);
    }

    setupVisibilityObserver() {
        if (!this.bgElement || !('IntersectionObserver' in window)) {
            return;
        }
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const wasVisible = this.isElementVisible;
                this.isElementVisible = entry.isIntersecting;
                
                if (wasVisible !== this.isElementVisible) {
                    if (perfConfig.shouldLog()) {
                        console.log(`🎨 Background element visibility: ${this.isElementVisible ? 'visible' : 'hidden'}`);
                    }
                    this.updateAnimationState();
                }
            });
        }, {
            threshold: 0.1, // Trigger when 10% visible
            rootMargin: '50px' // Add some buffer for smoother transitions
        });
        
        this.observer.observe(this.bgElement);
    }
    
    handleVisibilityChange() {
        // This method is now handled by setupPageVisibilityObserver
        // Keeping for backward compatibility
        this.updateAnimationState();
    }
    
    pauseAnimations() {
        if (this.isPaused) return;
        
        this.isPaused = true;
        
        // Pause all active tweens
        this.activeTweens.forEach((tween, name) => {
            if (tween && typeof tween.pause === 'function') {
                tween.pause();
            }
        });
        
        // Pause GSAP context animations
        if (this.ctx) {
            gsap.globalTimeline.getChildren(true, true, false).forEach(tween => {
                if (tween.vars && (tween.vars._regCategory === 'background' || tween.vars._backgroundAnimator)) {
                    tween.pause();
                }
            });
        }
        
        if (perfConfig.shouldLog()) {
            console.log('⏸️ Background animations paused');
        }
    }
    
    resumeAnimations() {
        if (!this.isPaused || !this.shouldAnimate()) {
            return;
        }
        
        this.isPaused = false;
        
        // Resume all paused tweens
        this.activeTweens.forEach((tween, name) => {
            if (tween && typeof tween.resume === 'function' && tween.paused()) {
                tween.resume();
            }
        });
        
        // Resume GSAP context animations
        if (this.ctx) {
            gsap.globalTimeline.getChildren(true, true, false).forEach(tween => {
                if (tween.vars && (tween.vars._regCategory === 'background' || tween.vars._backgroundAnimator) && tween.paused()) {
                    tween.resume();
                }
            });
        }
        
        if (perfConfig.shouldLog()) {
            console.log('▶️ Background animations resumed');
        }
    }
    
    handleSoftDegrade(event) {
        const level = event?.detail?.level || 1;
        this.isDegraded = true;
        
        // Progressive degradation based on level
        switch (level) {
            case 1:
                // Light degradation - reduce quality to 70%
                this.setQualityLevel(0.7);
                break;
            case 2:
                // Moderate degradation - reduce quality to 40%, pause glow
                this.setQualityLevel(0.4);
                this.pauseGlow();
                break;
            case 3:
                // Aggressive degradation - minimal quality, pause all effects
                this.setQualityLevel(0.1);
                this.performanceState.effectsEnabled = false;
                this.pauseAnimations();
                break;
            default:
                this.pauseAnimations();
        }
        
        if (perfConfig.shouldLog()) {
            console.log(`📉 Background animator: soft degrade level ${level}`);
        }
    }
    
    handleRestore(event) {
        const fromLevel = event?.detail?.fromLevel || 0;
        this.isDegraded = false;
        
        // Restore to full quality
        this.performanceState.effectsEnabled = true;
        this.setQualityLevel(1.0);
        this.resumeGlow();
        this.updateAnimationState();
        
        if (perfConfig.shouldLog()) {
            console.log(`📈 Background animator: restored from level ${fromLevel}`);
        }
    }
    
    handleEmergencyStop() {
        this.performanceState.effectsEnabled = false;
        this.destroy();
        
        if (perfConfig.shouldLog()) {
            console.log('🛑 Background animator: emergency stop - complete shutdown');
        }
    }
    
    // Utility Methods
    
    shouldAnimate() {
        return this.initialized && 
               this.isElementVisible && 
               this.isPageVisible && 
               !this.isPaused && 
               this.performanceState.effectsEnabled;
    }
    
    updateAnimationState() {
        if (this.shouldAnimate()) {
            this.resumeAnimations();
        } else {
            this.pauseAnimations();
        }
    }
    
    killTween(name) {
        const tween = this.activeTweens.get(name);
        if (tween) {
            tween.kill();
            this.activeTweens.delete(name);
        }
    }
    
    clearManagedInterval(name) {
        const interval = this.managedIntervals.get(name);
        if (interval) {
            interval.clear();
            this.managedIntervals.delete(name);
        }
    }
    
    setQualityLevel(level) {
        this.performanceState.qualityLevel = Math.max(0, Math.min(1, level));
        
        // Restart animations with new quality settings
        if (this.initialized) {
            this.setupContinuousRotation();
            this.setupColorShifts();
        }
        
        if (perfConfig.shouldLog()) {
            console.log(`🎨 Background quality level set to ${(level * 100).toFixed(0)}%`);
        }
    }
    
    pauseGlow() {
        this.performanceState.glowEnabled = false;
        this.clearManagedInterval('bgGlow');
        this.killTween('bgGlow');
    }
    
    resumeGlow() {
        if (this.shouldAnimate()) {
            this.performanceState.glowEnabled = true;
            this.setupManagedGlow();
        }
    }
    
    setupPageVisibilityObserver() {
        // Enhanced page visibility handling
        const handlePageVisibilityChange = () => {
            const wasVisible = this.isPageVisible;
            this.isPageVisible = !document.hidden;
            
            if (wasVisible !== this.isPageVisible) {
                if (perfConfig.shouldLog()) {
                    console.log(`🎨 Page visibility: ${this.isPageVisible ? 'visible' : 'hidden'}`);
                }
                this.updateAnimationState();
            }
        };
        
        document.addEventListener('visibilitychange', handlePageVisibilityChange);
        
        // Also listen for focus/blur events for better coverage
        window.addEventListener('focus', () => {
            if (!this.isPageVisible) {
                this.isPageVisible = true;
                this.updateAnimationState();
            }
        });
        
        window.addEventListener('blur', () => {
            if (this.isPageVisible) {
                this.isPageVisible = false;
                this.updateAnimationState();
            }
        });
    }
    
    destroy() {
        // Clear all managed intervals
        this.managedIntervals.forEach((interval, name) => {
            interval.clear();
        });
        this.managedIntervals.clear();
        
        // Kill all active tweens
        this.activeTweens.forEach((tween, name) => {
            tween.kill();
        });
        this.activeTweens.clear();
        
        // Kill GSAP context (cleans up all animations within)
        if (this.ctx) {
            this.ctx.kill();
            this.ctx = null;
        }
        
        // Disconnect all observers
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        
        if (this.pageVisibilityObserver) {
            this.pageVisibilityObserver.disconnect();
            this.pageVisibilityObserver = null;
        }
        
        // Remove all event listeners with proper binding
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        window.removeEventListener('perf:soft-degrade', this.handleSoftDegrade);
        window.removeEventListener('perf:restore', this.handleRestore);
        window.removeEventListener('perf:emergency-stop', this.handleEmergencyStop);
        window.removeEventListener('perf:pause-background', this.pauseGlow);
        window.removeEventListener('perf:resume-background', this.resumeGlow);
        window.removeEventListener('focus', this.handleVisibilityChange);
        window.removeEventListener('blur', this.handleVisibilityChange);
        
        // Clear all references
        this.bgElement = null;
        this.bgOverlay = null;
        this.logoWrapper = null;
        this.imageWrapper = null;
        this.timeline = null;
        this.activeAnimations.clear();
        
        // Reset state
        this.initialized = false;
        this.isPaused = false;
        this.isDegraded = false;
        this.isElementVisible = true;
        this.isPageVisible = true;
        
        if (perfConfig.shouldLog()) {
            console.log('💠 BackgroundAnimator destroyed with complete cleanup');
        }
    }
}

export default new BackgroundAnimator();