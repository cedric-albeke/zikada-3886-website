import gsap from 'gsap';
import perfConfig from './perf-config.js';

class BackgroundAnimator {
    constructor() {
        this.bgElement = null;
        this.bgOverlay = null;
        this.logoWrapper = null;
        this.imageWrapper = null;
        this.timeline = null;
        this.initialized = false;
        
        // Performance tracking
        this.activeAnimations = new Set();
        this._glowTween = null;
        this._glowInterval = null;
        this._warnedMissingElement = false;
        
        // GSAP context for proper cleanup
        this.ctx = null;
        
        // Visibility observer for pausing animations
        this.observer = null;
        this.isVisible = true;
        
        // Page visibility handling
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
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
        
        // Create GSAP context for proper cleanup
        this.ctx = gsap.context(() => {
            // All GSAP animations will be created within this context
            this.initializeAnimations();
        }, this.bgElement);
        
        // Set up visibility observers
        this.setupVisibilityObserver();
        
        // Listen for page visibility changes
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Listen for performance events
        window.addEventListener('perf:soft-degrade', this.handleSoftDegrade.bind(this));
        window.addEventListener('perf:restore', this.handleRestore.bind(this));
        window.addEventListener('perf:emergency-stop', this.handleEmergencyStop.bind(this));

        this.initialized = true;
        
        if (perfConfig.shouldLog()) {
            console.log('🎨 BackgroundAnimator initialized with performance controls');
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
        // Very slow continuous rotation
        gsap.to(this.bgElement, {
            rotation: 360,
            duration: 240, // Doubled - much slower
            repeat: -1,
            ease: 'none'
        });

        // Very subtle z-axis rotation for depth
        gsap.to(this.bgElement, {
            rotationY: 5, // Reduced from 15
            rotationX: 5, // Reduced from 15
            duration: 20, // Slower
            yoyo: true,
            repeat: -1,
            ease: 'power2.inOut'
        });
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
        // Enhanced color variations - more subtle transitions
        const colorTimeline = gsap.timeline({ repeat: -1 });

        colorTimeline
            .to(this.bgOverlay, {
                filter: 'hue-rotate(0deg) brightness(100%) saturate(100%)',
                duration: 0
            })
            .to(this.bgOverlay, {
                filter: 'hue-rotate(15deg) brightness(105%) saturate(110%)',  // Subtle purple tint
                duration: 12,
                ease: 'sine.inOut'
            })
            .to(this.bgOverlay, {
                filter: 'hue-rotate(-10deg) brightness(95%) saturate(120%)',  // Slight cyan shift
                duration: 10,
                ease: 'sine.inOut'
            })
            .to(this.bgOverlay, {
                filter: 'hue-rotate(25deg) brightness(102%) saturate(115%)',  // Soft magenta
                duration: 14,
                ease: 'sine.inOut'
            })
            .to(this.bgOverlay, {
                filter: 'hue-rotate(-20deg) brightness(98%) saturate(125%)',  // Cool blue-green
                duration: 11,
                ease: 'sine.inOut'
            })
            .to(this.bgOverlay, {
                filter: 'hue-rotate(8deg) brightness(103%) saturate(108%)',   // Warm tint
                duration: 9,
                ease: 'sine.inOut'
            })
            .to(this.bgOverlay, {
                filter: 'hue-rotate(0deg) brightness(100%) saturate(100%)',
                duration: 8,
                ease: 'sine.inOut'
            });

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
            if (!this.bgElement || !this.bgElement.isConnected) {
                if (perfConfig.shouldLog()) {
                    console.warn('🎨 bgElement missing or disconnected, skipping glow animation');
                }
                return;
            }
            
            // Kill previous glow tween to prevent stacking
            if (this._glowTween) {
                this._glowTween.kill();
            }
            
            this._glowTween = gsap.to(this.bgElement, {
                boxShadow: `0 0 100px ${glowColors[colorIndex]}`,
                duration: 4,
                ease: 'power2.inOut',
                overwrite: 'auto', // Prevent tween stacking
                onComplete: () => {
                    this._glowTween = null;
                    perfConfig.decrementCounter('animations');
                },
                onStart: () => {
                    perfConfig.incrementCounter('animations');
                }
            });
            
            colorIndex = (colorIndex + 1) % glowColors.length;
        };

        // Use managed interval instead of raw setInterval
        this._glowInterval = setInterval(shiftGlow, 4000);
        perfConfig.incrementCounter('intervals');
        
        shiftGlow();
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
        setInterval(() => {
            if (Math.random() > 0.7) {
                this.triggerGlitchBurst();
            }
        }, 8000);
    }

    setupVisibilityObserver() {
        if (!this.bgElement || !('IntersectionObserver' in window)) {
            return;
        }
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const wasVisible = this.isVisible;
                this.isVisible = entry.isIntersecting;
                
                if (wasVisible !== this.isVisible) {
                    if (this.isVisible) {
                        this.resumeAnimations();
                    } else {
                        this.pauseAnimations();
                    }
                }
            });
        }, {
            threshold: 0.1 // Trigger when 10% visible
        });
        
        this.observer.observe(this.bgElement);
    }
    
    handleVisibilityChange() {
        if (!perfConfig.isFeatureEnabled('pauseOnHidden')) {
            return;
        }
        
        if (document.visibilityState === 'hidden') {
            this.pauseAnimations();
        } else if (document.visibilityState === 'visible') {
            this.resumeAnimations();
        }
    }
    
    pauseAnimations() {
        if (this.ctx) {
            // Pause all GSAP animations in this context
            gsap.globalTimeline.getChildren(true, true, false).forEach(tween => {
                if (tween.vars && tween.vars._backgroundAnimator) {
                    tween.pause();
                }
            });
        }
        
        if (perfConfig.shouldLog()) {
            console.log('⏸️ Background animations paused (not visible)');
        }
    }
    
    resumeAnimations() {
        if (!this.initialized || !this.isVisible) {
            return;
        }
        
        if (this.ctx) {
            // Resume all paused GSAP animations in this context
            gsap.globalTimeline.getChildren(true, true, false).forEach(tween => {
                if (tween.vars && tween.vars._backgroundAnimator && tween.paused()) {
                    tween.resume();
                }
            });
        }
        
        if (perfConfig.shouldLog()) {
            console.log('▶️ Background animations resumed');
        }
    }
    
    handleSoftDegrade() {
        this.pauseAnimations();
        if (perfConfig.shouldLog()) {
            console.log('📉 Background animator: soft degrade mode');
        }
    }
    
    handleRestore() {
        this.resumeAnimations();
        if (perfConfig.shouldLog()) {
            console.log('📈 Background animator: performance restored');
        }
    }
    
    handleEmergencyStop() {
        this.destroy();
        if (perfConfig.shouldLog()) {
            console.log('🛑 Background animator: emergency stop');
        }
    }
    
    destroy() {
        // Clean up managed interval
        if (this._glowInterval) {
            clearInterval(this._glowInterval);
            this._glowInterval = null;
            perfConfig.decrementCounter('intervals');
        }
        
        // Kill active glow tween
        if (this._glowTween) {
            this._glowTween.kill();
            this._glowTween = null;
        }
        
        // Kill GSAP context (cleans up all animations within)
        if (this.ctx) {
            this.ctx.kill();
            this.ctx = null;
        }
        
        // Disconnect intersection observer
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        
        // Remove event listeners
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        window.removeEventListener('perf:soft-degrade', this.handleSoftDegrade.bind(this));
        window.removeEventListener('perf:restore', this.handleRestore.bind(this));
        window.removeEventListener('perf:emergency-stop', this.handleEmergencyStop.bind(this));
        
        // Clear references
        this.bgElement = null;
        this.bgOverlay = null;
        this.logoWrapper = null;
        this.imageWrapper = null;
        this.timeline = null;
        this.activeAnimations.clear();
        
        this.initialized = false;
        
        if (perfConfig.shouldLog()) {
            console.log('💀 BackgroundAnimator destroyed');
        }
    }
}

export default new BackgroundAnimator();