import gsap from 'gsap';
import animationRuntime from './runtime/animation-runtime.js';

const RUNTIME_OWNER = 'background-animator';

class BackgroundAnimator {
    constructor() {
        this.bgElement = null;
        this.bgOverlay = null;
        this.logoWrapper = null;
        this.imageWrapper = null;
        this.timeline = null;
        this.initialized = false;
        this.glowInterval = null; // Track the glow interval
        this.glitchInterval = null; // Track the glitch interval
        // Boot conservatively until renderer capability and sustained FPS are
        // known. Hardware profiles can promote this after initialization.
        this.performanceProfile = 'low';
        this.surfaceMotionAnimations = [];
        this.rotationAnimation = null;
        this.depthAnimation = null;
    }

    init() {
        if (this.initialized) return;
        animationRuntime.disposeOwner(RUNTIME_OWNER);
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
        // Keep the compositor allocation close to the viewport in every
        // profile. HIGH increases detail inside the scene; it must not revive
        // the former multi-million-pixel oversized transform surface.
        gsap.set(this.bgElement, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            width: '100vw',
            height: '100vh',
            xPercent: -50,
            yPercent: -50,
            scale: 1.09,
            rotation: -2,
            rotationX: 0,
            rotationY: 0,
            transformOrigin: 'center center'
        });
    }

    setupContinuousRotation() {
        // A small pendulum preserves texture drift without rotating a giant
        // square through 360 degrees and expanding its paint bounds.
        const rotation = gsap.to(this.bgElement, {
            rotation: 2,
            duration: 45,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });
        this.surfaceMotionAnimations.push(rotation);
        this.rotationAnimation = rotation;
        animationRuntime.trackAnimation(RUNTIME_OWNER, rotation);

        // Very subtle z-axis rotation for depth
        const depth = gsap.to(this.bgElement, {
            rotationY: 1.5,
            rotationX: 1.5,
            duration: 20, // Slower
            yoyo: true,
            repeat: -1,
            ease: 'power2.inOut'
        });
        this.surfaceMotionAnimations.push(depth);
        this.depthAnimation = depth;
        animationRuntime.trackAnimation(RUNTIME_OWNER, depth);
    }

    setupPulsatingEffects() {
        // Create master timeline for pulsating
        const pulseTimeline = gsap.timeline({ repeat: -1 });
        animationRuntime.trackAnimation(RUNTIME_OWNER, pulseTimeline);
        this.surfaceMotionAnimations.push(pulseTimeline);

        // Very subtle scale pulsing
        pulseTimeline
            .to(this.bgElement, {
                scale: 1.1,
                duration: 10, // Slower
                ease: 'power2.inOut'
            })
            .to(this.bgElement, {
                scale: 1.08,
                duration: 10,
                ease: 'power2.inOut'
            });

        // Very subtle opacity breathing for background
        animationRuntime.trackAnimation(RUNTIME_OWNER, gsap.to(this.bgElement, {
            opacity: 0.06, // More subtle
            duration: 6, // Slower
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        }));

        // Set initial opacity
        gsap.set(this.bgElement, { opacity: 0.05 });

        // Removed blur pulsing - too distracting
    }

    setupColorShifts() {
        if (!this.bgOverlay) return;

        // A full-viewport backdrop/filter animation forces an expensive
        // filtered repaint on every frame. A translucent color layer retains
        // the authored hue movement while remaining a cheap composited wash.
        this.bgOverlay.style.backdropFilter = 'none';
        this.bgOverlay.style.webkitBackdropFilter = 'none';
        const lowCostCompositor = this.performanceProfile === 'low' || window.chaosEngine?.softwareRenderer;
        this.bgOverlay.style.mixBlendMode = lowCostCompositor ? 'normal' : 'color';
        this.bgOverlay.style.willChange = 'opacity, background-color';

        const colorTimeline = gsap.timeline({ repeat: -1 });
        animationRuntime.trackAnimation(RUNTIME_OWNER, colorTimeline);

        colorTimeline
            .to(this.bgOverlay, {
                backgroundColor: 'rgba(0, 255, 133, 0.025)',
                opacity: 0.65,
                duration: 0
            })
            .to(this.bgOverlay, {
                backgroundColor: 'rgba(72, 70, 255, 0.045)',
                opacity: 0.8,
                duration: 12,
                ease: 'sine.inOut'
            })
            .to(this.bgOverlay, {
                backgroundColor: 'rgba(0, 210, 255, 0.04)',
                opacity: 0.7,
                duration: 10,
                ease: 'sine.inOut'
            })
            .to(this.bgOverlay, {
                backgroundColor: 'rgba(255, 64, 180, 0.035)',
                opacity: 0.78,
                duration: 14,
                ease: 'sine.inOut'
            })
            .to(this.bgOverlay, {
                backgroundColor: 'rgba(0, 255, 190, 0.04)',
                opacity: 0.72,
                duration: 11,
                ease: 'sine.inOut'
            })
            .to(this.bgOverlay, {
                backgroundColor: 'rgba(255, 180, 80, 0.025)',
                opacity: 0.68,
                duration: 9,
                ease: 'sine.inOut'
            })
            .to(this.bgOverlay, {
                backgroundColor: 'rgba(0, 255, 133, 0.025)',
                opacity: 0.65,
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
            // Defensive check: ensure element exists before animating
            if (!this.bgElement || !document.body.contains(this.bgElement)) {
                console.warn('⚠️ Background element not available for glow animation, skipping');
                return;
            }
            
            try {
                animationRuntime.trackAnimation(RUNTIME_OWNER, gsap.to(this.bgElement, {
                    opacity: 0.045 + (colorIndex * 0.002),
                    duration: 4,
                    ease: 'power2.inOut'
                }));
                colorIndex = (colorIndex + 1) % glowColors.length;
            } catch (e) {
                console.warn('⚠️ Error in shiftGlow animation:', e);
            }
        };

        // Clear any existing interval before creating a new one
        this.glowInterval?.clear?.();
        this.glowInterval = animationRuntime.scheduleInterval(RUNTIME_OWNER, shiftGlow, 4000);
        shiftGlow();
    }

    setupLogoReaction() {
        if (!this.logoWrapper || !this.imageWrapper) return;

        // Very subtle synchronized breathing effect
        const syncTimeline = gsap.timeline({ repeat: -1 });
        animationRuntime.trackAnimation(RUNTIME_OWNER, syncTimeline);

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
        animationRuntime.trackAnimation(RUNTIME_OWNER, gsap.to(this.imageWrapper, {
            rotation: -360,
            duration: 120, // Much slower
            repeat: -1,
            ease: 'none'
        }));

        // Very subtle glow pulse
        const glowElement = document.querySelector('.glow');
        if (glowElement) {
            animationRuntime.trackAnimation(RUNTIME_OWNER, gsap.to(glowElement, {
                opacity: 0.6,
                scale: 1.05, // Even smaller scale
                duration: 6, // Slower
                yoyo: true,
                repeat: -1,
                ease: 'sine.inOut'
            }));
        }

        // Removed brightness filter - too flashy
    }

    // Method to add glitch bursts
    triggerGlitchBurst() {
        if (!this.bgElement) return;

        animationRuntime.trackAnimation(RUNTIME_OWNER, gsap.to(this.bgElement, {
            skewX: Math.random() * 10 - 5,
            skewY: Math.random() * 10 - 5,
            duration: 0.1,
            yoyo: true,
            repeat: 3,
            ease: 'power4.inOut',
            onComplete: () => {
                gsap.set(this.bgElement, { skewX: 0, skewY: 0 });
            }
        }));
    }

    // Periodic glitch triggers
    startGlitchSequence() {
        // Clear any existing interval before creating a new one
        this.glitchInterval?.clear?.();
        this.glitchInterval = animationRuntime.scheduleInterval(RUNTIME_OWNER, () => {
            if (Math.random() > 0.7) {
                this.triggerGlitchBurst();
            }
        }, 8000);
    }

    resolveSurfaceScale(authoredScale = 1) {
        const scale = Number(authoredScale) || 1;
        const lowCost = this.performanceProfile === 'low' || window.chaosEngine?.softwareRenderer;
        if (lowCost) return Math.min(1.1, Math.max(1.06, 1.06 + ((scale - 1) * 0.02)));
        if (this.performanceProfile === 'medium') {
            return Math.min(1.14, Math.max(1.1, 1.1 + ((scale - 1) * 0.02)));
        }
        return Math.min(1.16, Math.max(1.12, 1.12 + ((scale - 1) * 0.02)));
    }

    setPerformanceProfile(profile) {
        this.performanceProfile = profile || 'high';
        const lowCostCompositor = this.performanceProfile === 'low' || window.chaosEngine?.softwareRenderer;
        if (this.bgOverlay) {
            this.bgOverlay.style.mixBlendMode = lowCostCompositor ? 'normal' : 'color';
        }
        if (this.bgElement) {
            const surfaceProps = {
                width: '100vw',
                height: '100vh',
                scale: this.resolveSurfaceScale(3)
            };
            if (lowCostCompositor) {
                this.rotationAnimation?.pause?.();
                this.depthAnimation?.pause?.();
                surfaceProps.rotation = 0;
                surfaceProps.rotationX = 0;
                surfaceProps.rotationY = 0;
            } else {
                this.rotationAnimation?.resume?.();
                this.depthAnimation?.resume?.();
            }
            gsap.set(this.bgElement, surfaceProps);
        }
    }

    destroy() {
        animationRuntime.disposeOwner(RUNTIME_OWNER);
        this.glowInterval = null;
        this.glitchInterval = null;
        this.timeline = null;
        this.surfaceMotionAnimations = [];
        this.rotationAnimation = null;
        this.depthAnimation = null;
        gsap.killTweensOf([this.bgElement, this.bgOverlay, this.logoWrapper, this.imageWrapper]);
        this.initialized = false;
    }
}

export default new BackgroundAnimator();
