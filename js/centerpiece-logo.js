// CENTERPIECE LOGO ANIMATION SYSTEM
// Advanced animation system for the ZIKADA SVG logo as the visual centerpiece
import gsap from 'gsap';

class CenterpieceLogo {
    constructor() {
        this.logo = null;
        this.wrapper = null;
        this.isInitialized = false;

        // Animation states
        this.currentAnimation = null;
        this.animationQueue = [];
        this.isAnimating = false;

        // Core timelines
        this.breathingTimeline = null;
        this.pulseTimeline = null;
        this.ambientTimeline = null;

        // Animation settings - MUCH MORE VISIBLE
        this.settings = {
            breathScale: { min: 0.8, max: 1.3 },  // MUCH BIGGER range
            pulseScale: { min: 0.9, max: 1.2 },  // MUCH MORE visible pulse
            rotationSpeed: 0.5,
            glowIntensity: 1.0,
            animationSpeed: 1.0
        };

        // Easing functions for snappy animations
        this.eases = {
            bounce: "bounce.out",
            snap: "power4.inOut",
            elastic: "elastic.out(1.2, 0.3)",
            rubberBand: "elastic.out(1, 0.3)",
            wobble: "elastic.inOut(1, 0.5)"
        };

        // Glow colors for different moods
        this.glowColors = {
            electric: '#00ffff',
            neon: '#ff00ff',
            plasma: '#ffff00',
            matrix: '#00ff00',
            fire: '#ff6600',
            ice: '#00ccff',
            toxic: '#00ff85',
            royal: '#9900ff'
        };

        // Animation library
        this.animations = {
            // Bouncy animations
            bounceIn: () => this.bounceIn(),
            bounceRotate: () => this.bounceRotate(),
            rubberBand: () => this.rubberBand(),

            // Snap animations
            snapScale: () => this.snapScale(),
            snapRotate: () => this.snapRotate(),
            snapShake: () => this.snapShake(),

            // 3D animations
            flip3D: () => this.flip3D(),
            spin3D: () => this.spin3D(),
            tumble: () => this.tumble(),

            // Glow and illumination
            glowPulse: () => this.glowPulse(),
            rainbowGlow: () => this.rainbowGlow(),
            electricSurge: () => this.electricSurge(),

            // Special effects
            heartbeat: () => this.heartbeat(),
            earthquake: () => this.earthquake(),
            levitate: () => this.levitate(),
            morphing: () => this.morphing(),

            // Physics-based
            jello: () => this.jello(),
            pendulum: () => this.pendulum(),
            springBounce: () => this.springBounce()
        };
    }

    init() {
        if (this.isInitialized) {
            console.log('🎯 Centerpiece already initialized');
            return;
        }

        // Try multiple selectors to find the logo - INCLUDING image-2!
        this.logo = document.querySelector('.image-2') ||
                    document.querySelector('img[src*="c01n"]') ||
                    document.querySelector('.image-wrapper img') ||
                    document.querySelector('.logo-container img') ||
                    document.querySelector('img[src*="zikada"]');
        this.wrapper = document.querySelector('.image-wrapper') ||
                       document.querySelector('.logo-container') ||
                       this.logo?.parentElement;

        if (!this.logo) {
            console.error('🎯 Centerpiece: Logo element not found!');
            return;
        }

        // Setup initial state
        this.setupInitialState();

        // Create glow container
        this.createGlowSystem();

        // Start ambient animations
        this.startAmbientAnimations();

        // Start reactive system
        this.startReactiveSystem();

        // Start continuous animation cycle
        this.startAnimationCycle();

        this.isInitialized = true;
    }

    setupInitialState() {
        // CRITICAL: Remove inline scale: none style that's blocking animations
        if (this.logo.style.scale === 'none') {
            this.logo.style.scale = '';
        }

        // Clear any transform that might have scale in it
        const currentTransform = this.logo.style.transform;
        if (currentTransform && !currentTransform.includes('scale')) {
            // Keep the existing transform but ensure scale can be animated
            this.logo.style.transform = currentTransform;
        }

        // Set transform origin for proper rotation
        gsap.set(this.logo, {
            transformOrigin: 'center center',
            transformPerspective: 1000,
            force3D: true,
            scale: 1,  // Start at scale 1
            clearProps: 'scale'  // Clear the scale: none
        });

        // Ensure wrapper is positioned properly
        if (this.wrapper) {
            gsap.set(this.wrapper, {
                transformOrigin: 'center center',
                perspective: 1000
            });
        }
    }

    createGlowSystem() {
        // Create multiple glow layers for complex effects
        this.glowLayers = [];

        for (let i = 0; i < 3; i++) {
            const glowLayer = document.createElement('div');
            glowLayer.className = `logo-glow-layer logo-glow-${i}`;
            glowLayer.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 120%;
                height: 120%;
                pointer-events: none;
                z-index: ${-1 - i};
                border-radius: 50%;
                opacity: 0;
            `;

            if (this.wrapper) {
                this.wrapper.style.position = 'relative';
                this.wrapper.appendChild(glowLayer);
            }

            this.glowLayers.push(glowLayer);
        }
    }

    // AMBIENT ANIMATIONS (always running)
    startAmbientAnimations() {

        // MORE VISIBLE breathing
        this.breathingTimeline = gsap.timeline({ repeat: -1 });
        this.breathingTimeline
            .to(this.logo, {
                scale: this.settings.breathScale.max,
                duration: 3,  // Faster for visibility
                ease: 'power2.inOut'
            })
            .to(this.logo, {
                scale: this.settings.breathScale.min,
                duration: 3,
                ease: 'power2.inOut'
            });

        // More visible rotation
        gsap.to(this.logo, {
            rotation: 360,
            duration: 120,  // Faster rotation
            repeat: -1,
            ease: 'none'
        });

        // MORE VISIBLE 3D tilt
        gsap.to(this.logo, {
            rotationY: 20,  // Increased tilt
            rotationX: 10,   // Increased tilt
            duration: 5,     // Faster
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });

        // Add visible bounce effect
        gsap.to(this.logo, {
            y: -10,
            duration: 2,
            yoyo: true,
            repeat: -1,
            ease: 'power2.inOut'
        });
    }

    // BOUNCY ANIMATIONS
    bounceIn() {
        const tl = gsap.timeline();
        tl.fromTo(this.logo, {
            scale: 0.3,
            rotation: -180
        }, {
            scale: 1,
            rotation: 0,
            duration: 1.2,
            ease: this.eases.bounce
        });
        return tl;
    }

    bounceRotate() {
        const tl = gsap.timeline();
        tl.to(this.logo, {
            rotation: '+=360',
            scale: 1.2,
            duration: 0.6,
            ease: 'power2.in'
        })
        .to(this.logo, {
            scale: 1,
            duration: 0.8,
            ease: this.eases.bounce
        });
        return tl;
    }

    rubberBand() {
        const tl = gsap.timeline();
        tl.to(this.logo, {
            scaleX: 1.25,
            scaleY: 0.75,
            duration: 0.3,
            ease: 'power2.out'
        })
        .to(this.logo, {
            scaleX: 0.75,
            scaleY: 1.25,
            duration: 0.3,
            ease: 'power2.inOut'
        })
        .to(this.logo, {
            scaleX: 1.15,
            scaleY: 0.85,
            duration: 0.3,
            ease: 'power2.inOut'
        })
        .to(this.logo, {
            scaleX: 1,
            scaleY: 1,
            duration: 0.3,
            ease: this.eases.elastic
        });
        return tl;
    }

    // SNAP ANIMATIONS
    snapScale() {
        const tl = gsap.timeline();
        tl.to(this.logo, {
            scale: 1.3,
            duration: 0.2,
            ease: this.eases.snap
        })
        .to(this.logo, {
            scale: 1,
            duration: 0.3,
            ease: 'power4.out'
        });
        return tl;
    }

    snapRotate() {
        const tl = gsap.timeline();
        tl.to(this.logo, {
            rotation: '+=90',
            duration: 0.15,
            ease: this.eases.snap
        });
        return tl;
    }

    snapShake() {
        const tl = gsap.timeline();
        for (let i = 0; i < 6; i++) {
            tl.to(this.logo, {
                x: (i % 2 === 0 ? 10 : -10) * (1 - i/6),
                rotation: (i % 2 === 0 ? 5 : -5) * (1 - i/6),
                duration: 0.05,
                ease: 'none'
            });
        }
        tl.to(this.logo, {
            x: 0,
            rotation: 0,
            duration: 0.2,
            ease: this.eases.elastic
        });
        return tl;
    }

    // 3D ANIMATIONS
    flip3D() {
        const tl = gsap.timeline();
        tl.to(this.logo, {
            rotationY: 180,
            scale: 1.1,
            duration: 0.6,
            ease: 'power2.inOut'
        })
        .to(this.logo, {
            rotationY: 360,
            scale: 1,
            duration: 0.6,
            ease: 'power2.out',
            onComplete: () => {
                gsap.set(this.logo, { rotationY: 0 });
            }
        });
        return tl;
    }

    spin3D() {
        const tl = gsap.timeline();
        tl.to(this.logo, {
            rotationX: 360,
            rotationY: 180,
            duration: 1.5,
            ease: 'power2.inOut'
        })
        .to(this.logo, {
            rotationX: 0,
            rotationY: 0,
            duration: 0.5,
            ease: this.eases.bounce
        });
        return tl;
    }

    tumble() {
        const tl = gsap.timeline();
        tl.to(this.logo, {
            rotation: 720,
            rotationX: 360,
            rotationY: 180,
            scale: 0.8,
            duration: 2,
            ease: 'power2.inOut'
        })
        .to(this.logo, {
            rotation: 0,
            rotationX: 0,
            rotationY: 0,
            scale: 1,
            duration: 1,
            ease: this.eases.elastic
        });
        return tl;
    }

    // GLOW AND ILLUMINATION
    glowPulse() {
        const tl = gsap.timeline();

        this.glowLayers.forEach((layer, i) => {
            const delay = i * 0.1;
            const color = Object.values(this.glowColors)[Math.floor(Math.random() * 8)];

            tl.to(layer, {
                opacity: 0.8 - i * 0.2,
                scale: 1 + i * 0.2,
                background: `radial-gradient(circle, ${color}, transparent 70%)`,
                filter: `blur(${20 + i * 10}px)`,
                duration: 0.5,
                ease: 'power2.out'
            }, delay)
            .to(layer, {
                opacity: 0,
                scale: 1.5 + i * 0.2,
                duration: 1,
                ease: 'power2.in'
            }, delay + 0.5);
        });

        // Also pulse the logo
        tl.to(this.logo, {
            scale: 1.1,
            duration: 0.5,
            ease: 'power2.out'
        }, 0)
        .to(this.logo, {
            scale: 1,
            duration: 1,
            ease: 'power2.in'
        }, 0.5);

        return tl;
    }

    rainbowGlow() {
        const tl = gsap.timeline();
        const colors = Object.values(this.glowColors);

        colors.forEach((color, i) => {
            tl.to(this.glowLayers[0], {
                background: `radial-gradient(circle, ${color}, transparent 70%)`,
                opacity: 0.6,
                duration: 0.2,
                ease: 'none'
            }, i * 0.2);
        });

        tl.to(this.glowLayers[0], {
            opacity: 0,
            duration: 0.5,
            ease: 'power2.out'
        });

        return tl;
    }

    electricSurge() {
        const tl = gsap.timeline();

        // Create electric effect with rapid scale changes
        for (let i = 0; i < 10; i++) {
            tl.to(this.logo, {
                scale: 1 + Math.random() * 0.1,
                rotation: Math.random() * 10 - 5,
                duration: 0.05,
                ease: 'none'
            });
        }

        // Big surge
        tl.to(this.logo, {
            scale: 1.3,
            duration: 0.2,
            ease: 'power4.out'
        })
        .to(this.glowLayers[0], {
            opacity: 1,
            scale: 2,
            background: 'radial-gradient(circle, #00ffff, transparent 70%)',
            filter: 'blur(30px)',
            duration: 0.2,
            ease: 'power4.out'
        }, '<')
        .to([this.logo, this.glowLayers[0]], {
            scale: 1,
            opacity: 0,
            duration: 0.5,
            ease: 'power2.inOut'
        });

        return tl;
    }

    // SPECIAL EFFECTS
    heartbeat() {
        const tl = gsap.timeline({ repeat: 2 });

        tl.to(this.logo, {
            scale: 1.1,
            duration: 0.15,
            ease: 'power2.out'
        })
        .to(this.logo, {
            scale: 1,
            duration: 0.15,
            ease: 'power2.in'
        })
        .to(this.logo, {
            scale: 1.15,
            duration: 0.15,
            ease: 'power2.out'
        })
        .to(this.logo, {
            scale: 1,
            duration: 0.35,
            ease: 'power2.in'
        });

        return tl;
    }

    earthquake() {
        const tl = gsap.timeline();
        const intensity = 15;

        for (let i = 0; i < 20; i++) {
            const factor = 1 - i/20;
            tl.to(this.logo, {
                x: (Math.random() - 0.5) * intensity * factor,
                y: (Math.random() - 0.5) * intensity * factor,
                rotation: (Math.random() - 0.5) * 10 * factor,
                duration: 0.02,
                ease: 'none'
            });
        }

        tl.to(this.logo, {
            x: 0,
            y: 0,
            rotation: 0,
            duration: 0.3,
            ease: this.eases.elastic
        });

        return tl;
    }

    levitate() {
        const tl = gsap.timeline();

        tl.to(this.logo, {
            y: -30,
            scale: 1.1,
            duration: 1,
            ease: 'power2.out'
        })
        .to(this.logo, {
            y: -25,
            duration: 2,
            yoyo: true,
            repeat: 2,
            ease: 'sine.inOut'
        })
        .to(this.logo, {
            y: 0,
            scale: 1,
            duration: 0.5,
            ease: this.eases.bounce
        });

        return tl;
    }

    morphing() {
        const tl = gsap.timeline();

        tl.to(this.logo, {
            scaleX: 1.5,
            scaleY: 0.5,
            rotation: 45,
            duration: 0.5,
            ease: 'power2.inOut'
        })
        .to(this.logo, {
            scaleX: 0.5,
            scaleY: 1.5,
            rotation: -45,
            duration: 0.5,
            ease: 'power2.inOut'
        })
        .to(this.logo, {
            scaleX: 1.2,
            scaleY: 1.2,
            rotation: 180,
            duration: 0.5,
            ease: 'power2.inOut'
        })
        .to(this.logo, {
            scaleX: 1,
            scaleY: 1,
            rotation: 360,
            duration: 0.5,
            ease: this.eases.elastic,
            onComplete: () => {
                gsap.set(this.logo, { rotation: 0 });
            }
        });

        return tl;
    }

    // PHYSICS-BASED ANIMATIONS
    jello() {
        const tl = gsap.timeline();

        tl.to(this.logo, {
            skewX: 20,
            scaleX: 0.9,
            duration: 0.3,
            ease: 'power2.out'
        })
        .to(this.logo, {
            skewX: -15,
            scaleX: 1.1,
            duration: 0.3,
            ease: 'power2.inOut'
        })
        .to(this.logo, {
            skewX: 10,
            scaleX: 0.95,
            duration: 0.3,
            ease: 'power2.inOut'
        })
        .to(this.logo, {
            skewX: -5,
            scaleX: 1.05,
            duration: 0.3,
            ease: 'power2.inOut'
        })
        .to(this.logo, {
            skewX: 0,
            scaleX: 1,
            duration: 0.3,
            ease: this.eases.elastic
        });

        return tl;
    }

    pendulum() {
        const tl = gsap.timeline();

        gsap.set(this.logo, { transformOrigin: 'center top' });

        tl.to(this.logo, {
            rotation: 30,
            duration: 1,
            ease: 'power2.inOut'
        })
        .to(this.logo, {
            rotation: -30,
            duration: 2,
            yoyo: true,
            repeat: 3,
            ease: 'power2.inOut'
        })
        .to(this.logo, {
            rotation: 0,
            duration: 1,
            ease: 'power2.out',
            onComplete: () => {
                gsap.set(this.logo, { transformOrigin: 'center center' });
            }
        });

        return tl;
    }

    springBounce() {
        const tl = gsap.timeline();

        // Simulate spring physics with keyframes
        tl.to(this.logo, {
            y: -100,
            scale: 0.8,
            duration: 0.5,
            ease: 'power2.out'
        })
        .to(this.logo, {
            y: 0,
            scale: 1.3,
            duration: 0.3,
            ease: 'power2.in'
        })
        .to(this.logo, {
            y: -30,
            scale: 0.9,
            duration: 0.2,
            ease: 'power2.out'
        })
        .to(this.logo, {
            y: 0,
            scale: 1.1,
            duration: 0.2,
            ease: 'power2.in'
        })
        .to(this.logo, {
            scale: 1,
            duration: 0.3,
            ease: this.eases.elastic
        });

        return tl;
    }

    // REACTIVE SYSTEM
    startReactiveSystem() {
        // CRITICAL: Monitor for scale: none being reapplied and remove it
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    if (this.logo.style.scale === 'none') {
                        this.logo.style.scale = '';  // Remove scale: none immediately
                    }
                }
            });
        });

        observer.observe(this.logo, {
            attributes: true,
            attributeFilter: ['style']
        });

        // React to global animation events
        window.addEventListener('animationPhase', (e) => {
            this.reactToPhase(e.detail.phase);
        });

        // Random special animations - removed since we have animation cycle
    }

    startAnimationCycle() {
        const runNextAnimation = () => {
            if (!this.isInitialized) {
                return;
            }

            // Only trigger new animation if not already animating
            if (!this.isAnimating) {
                const animationNames = Object.keys(this.animations);
                const randomAnimation = animationNames[Math.floor(Math.random() * animationNames.length)];
                // console.log(`🎯 Running animation: ${randomAnimation}`);
                this.triggerAnimation(randomAnimation);
            }

            // Schedule next animation (3-8 seconds randomly)
            const delay = 3000 + Math.random() * 5000;
            setTimeout(runNextAnimation, delay);
        };

        // Start first animation after 2 seconds
        setTimeout(runNextAnimation, 2000);
    }

    reactToPhase(phase) {
        switch(phase) {
            case 'intense':
                this.settings.animationSpeed = 1.5;
                this.settings.breathScale.max = 1.1;
                this.triggerAnimation('electricSurge');
                break;

            case 'calm':
                this.settings.animationSpeed = 0.8;
                this.settings.breathScale.max = 1.03;
                this.triggerAnimation('levitate');
                break;

            case 'glitch':
                this.triggerAnimation('earthquake');
                break;

            case 'techno':
                this.triggerAnimation('heartbeat');
                break;

            case 'vaporwave':
                this.triggerAnimation('morphing');
                break;

            case 'cyberpunk':
                this.triggerAnimation('glowPulse');
                break;
        }
    }

    triggerRandomAnimation() {
        const animationNames = Object.keys(this.animations);
        const randomAnimation = animationNames[Math.floor(Math.random() * animationNames.length)];
        this.triggerAnimation(randomAnimation);
    }

    triggerAnimation(animationName) {
        if (!this.animations[animationName]) {
            return;
        }

        this.isAnimating = true;
        const animation = this.animations[animationName]();

        // Some animations might not return a timeline
        if (animation && animation.eventCallback) {
            animation.eventCallback('onComplete', () => {
                this.isAnimating = false;
            });
        } else {
            // If no timeline returned, reset flag after expected duration
            setTimeout(() => {
                this.isAnimating = false;
            }, 2000);
        }
    }

    // Public API
    play(animationName) {
        if (this.animations[animationName]) {
            this.triggerAnimation(animationName);
        }
    }

    setSpeed(speed) {
        this.settings.animationSpeed = speed;
        gsap.globalTimeline.timeScale(speed);
    }

    setGlowIntensity(intensity) {
        this.settings.glowIntensity = intensity;
    }

    destroy() {
        if (this.breathingTimeline) this.breathingTimeline.kill();
        if (this.pulseTimeline) this.pulseTimeline.kill();
        if (this.ambientTimeline) this.ambientTimeline.kill();

        gsap.killTweensOf([this.logo, ...this.glowLayers]);

        this.glowLayers.forEach(layer => layer.remove());

        this.isInitialized = false;
    }
}

export default new CenterpieceLogo();