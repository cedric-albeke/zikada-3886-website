import gsap from 'gsap';

class BackgroundAnimator {
    constructor() {
        this.bgElement = null;
        this.bgOverlay = null;
        this.logoWrapper = null;
        this.imageWrapper = null;
        this.timeline = null;
        this.initialized = false;
    }

    init() {
        // Get elements
        this.bgElement = document.querySelector('.bg');
        this.bgOverlay = document.querySelector('.bg-overlay');
        this.logoWrapper = document.querySelector('.logo-text-wrapper');
        this.imageWrapper = document.querySelector('.image-wrapper');

        if (!this.bgElement) {
            console.warn('Background element not found');
            return;
        }

        // Center the background properly
        this.centerBackground();

        // Initialize animations
        this.setupContinuousRotation();
        this.setupPulsatingEffects();
        this.setupColorShifts();
        this.setupLogoReaction();

        this.initialized = true;
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

        // Dynamic glow color shifts
        const glowColors = [
            'rgba(0, 255, 133, 0.3)',   // Green
            'rgba(0, 200, 255, 0.25)',  // Cyan
            'rgba(150, 100, 255, 0.2)', // Purple
            'rgba(255, 100, 150, 0.2)', // Pink
            'rgba(100, 255, 200, 0.25)' // Mint
        ];

        let colorIndex = 0;
        const shiftGlow = () => {
            gsap.to(this.bgElement, {
                boxShadow: `0 0 100px ${glowColors[colorIndex]}`,
                duration: 4,
                ease: 'power2.inOut'
            });
            colorIndex = (colorIndex + 1) % glowColors.length;
        };

        setInterval(shiftGlow, 4000);
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

    destroy() {
        if (this.timeline) {
            this.timeline.kill();
        }
        gsap.killTweensOf([this.bgElement, this.bgOverlay, this.logoWrapper, this.imageWrapper]);
        this.initialized = false;
    }
}

export default new BackgroundAnimator();