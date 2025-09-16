import gsap from 'gsap';

class LogoAnimator {
    constructor() {
        this.logo = null;
        this.logoWrapper = null;
        this.textElements = { zikada: null, text3886: null };
        this.timeline = null;
        this.breathTimeline = null;
        this.glowElement = null;
        this.pulseTimeline = null;
        this.minOpacity = 1.0; // Never reduce opacity
        this.isInitialized = false;
    }

    init() {
        this.logo = document.querySelector('.image-wrapper img');
        this.logoWrapper = document.querySelector('.logo-text-wrapper');
        this.textElements.zikada = document.querySelector('.zikada-text');
        this.textElements.text3886 = document.querySelector('.text-3886');

        if (!this.logo) {
            console.warn('Logo element not found');
            return;
        }

        // Remove any existing glow elements first (in case of restart)
        const existingGlow = document.querySelector('.logo-glow');
        if (existingGlow) {
            existingGlow.remove();
        }

        // Force initial opacity and ensure no distortion
        gsap.set(this.logo, {
            opacity: 1,
            scale: 1,
            rotation: 0,
            scaleX: 1,
            scaleY: 1
        });

        // Create glow element
        this.createGlowEffect();

        // Start all animations
        this.startBreathingAnimation();
        this.startPulseAnimation();
        this.startReactiveAnimations();
        this.startLogoRotation();
        this.startTextAnimations();
        this.protectOpacity();

        this.isInitialized = true;
        console.log('🎯 Logo Animator initialized');
    }

    createGlowEffect() {
        // Create a glow div behind the logo - use fixed size to keep it circular
        const logoSize = this.logo ? this.logo.offsetWidth : 200;
        const glowSize = logoSize * 1.2;

        this.glowElement = document.createElement('div');
        this.glowElement.className = 'logo-glow';
        this.glowElement.style.cssText = `
            position: absolute;
            width: ${glowSize}px;
            height: ${glowSize}px;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: radial-gradient(circle, rgba(0, 255, 133, 0.3), transparent 70%);
            filter: blur(40px);
            z-index: -1;
            pointer-events: none;
            opacity: 0.5;
            border-radius: 50%;
            aspect-ratio: 1;
        `;

        if (this.logo.parentElement) {
            this.logo.parentElement.style.position = 'relative';
            this.logo.parentElement.appendChild(this.glowElement);
        }
    }

    startBreathingAnimation() {
        // Main breathing animation - subtle scale and glow
        this.breathTimeline = gsap.timeline({ repeat: -1, yoyo: true });

        this.breathTimeline
            .to(this.logo, {
                scale: 1.05,
                duration: 4,
                ease: 'sine.inOut'
            })
            .to(this.glowElement, {
                opacity: 0.8,
                scale: 1.1, // Reduced scale to avoid distortion
                duration: 4,
                ease: 'sine.inOut'
            }, '<');

        // Secondary breath for the wrapper
        if (this.logoWrapper) {
            gsap.to(this.logoWrapper, {
                scale: 1.02,
                duration: 3,
                yoyo: true,
                repeat: -1,
                ease: 'power1.inOut'
            });
        }
    }

    startPulseAnimation() {
        // Energy pulse that travels through the logo
        this.pulseTimeline = gsap.timeline({ repeat: -1 });

        this.pulseTimeline
            .to(this.logo, {
                filter: 'brightness(1.05) contrast(1.02)',  // Further reduced to prevent washing out
                duration: 0.5,
                ease: 'power2.in'
            })
            .to(this.logo, {
                filter: 'brightness(1) contrast(1)',
                duration: 1.5,
                ease: 'power2.out'
            })
            .to(this.glowElement, {
                opacity: 0.9,
                duration: 0.5,
                ease: 'power2.in'
            }, '<')
            .to(this.glowElement, {
                opacity: 0.5,
                duration: 1.5,
                ease: 'power2.out'
            })
            .to({}, { duration: 3 }); // Pause between pulses
    }

    startReactiveAnimations() {
        // Make logo react to global animation events
        window.addEventListener('animationPhase', (e) => {
            this.reactToPhase(e.detail.phase);
        });

        // React to matrix messages
        window.addEventListener('matrixMessage', () => {
            this.matrixReaction();
        });

        // React to glitch events
        window.addEventListener('glitchEvent', () => {
            this.glitchReaction();
        });
    }

    reactToPhase(phase) {
        switch(phase) {
            case 'intense':
                gsap.to(this.logo, {
                    rotationY: 15,
                    rotationX: 5,
                    duration: 2,
                    ease: 'power2.inOut'
                });
                gsap.to(this.glowElement, {
                    filter: 'hue-rotate(20deg)',
                    opacity: 0.7,  // Changed from scale to opacity to maintain circle
                    duration: 2
                });
                break;

            case 'calm':
                gsap.to(this.logo, {
                    rotationY: 0,
                    rotationX: 0,
                    duration: 3,
                    ease: 'power2.inOut'
                });
                gsap.to(this.glowElement, {
                    filter: 'hue-rotate(0deg)',
                    opacity: 0.5,  // Reset opacity instead of scale
                    duration: 3
                });
                break;

            case 'glitch':
                this.glitchReaction();
                break;

            case 'techno':
                this.technoReaction();
                break;
        }
    }

    matrixReaction() {
        // Logo reacts to matrix messages
        const tl = gsap.timeline();

        tl.to(this.logo, {
            filter: 'brightness(1.05) saturate(0.7)',  // Much lower brightness to prevent white
            duration: 0.2,
            ease: 'power4.in'
        })
        .to(this.logo, {
            filter: 'brightness(1) saturate(1)',
            duration: 0.8,
            ease: 'power4.out'
        })
        .to(this.glowElement, {
            opacity: 1,
            backgroundColor: 'rgba(0, 255, 0, 0.2)',
            duration: 0.2,
            ease: 'power4.in'
        }, '<')
        .to(this.glowElement, {
            opacity: 0.5,
            backgroundColor: 'rgba(0, 255, 133, 0.4)',
            duration: 0.8,
            ease: 'power4.out'
        });
    }

    glitchReaction() {
        // Quick glitch effect
        const tl = gsap.timeline();

        tl.to(this.logo, {
            x: () => Math.random() * 10 - 5,
            y: () => Math.random() * 10 - 5,
            duration: 0.05
        })
        .to(this.logo, {
            x: () => Math.random() * 10 - 5,
            y: () => Math.random() * 10 - 5,
            filter: 'hue-rotate(180deg)',
            duration: 0.05
        })
        .to(this.logo, {
            x: 0,
            y: 0,
            filter: 'hue-rotate(0deg)',
            duration: 0.1,
            ease: 'power2.out'
        });
    }

    technoReaction() {
        // Techno strobe effect
        const tl = gsap.timeline({ repeat: 3 });

        tl.to(this.logo, {
            filter: 'brightness(1.05) contrast(1.05)',  // Lower brightness to prevent washing out
            duration: 0.1
        })
        .to(this.logo, {
            filter: 'brightness(0.8) contrast(0.9)',
            duration: 0.1
        });
    }

    startLogoRotation() {
        // Very slow, subtle rotation
        gsap.to(this.logo, {
            rotation: 360,
            duration: 180,
            repeat: -1,
            ease: 'none'
        });

        // Subtle 3D rotation
        gsap.to(this.logo, {
            rotationY: 5,
            rotationX: 5,
            duration: 10,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });
    }

    startTextAnimations() {
        // Animate ZIKADA text
        if (this.textElements.zikada) {
            // Breathing glow
            gsap.to(this.textElements.zikada, {
                textShadow: '0 0 20px rgba(0, 255, 133, 0.8), 0 0 40px rgba(0, 255, 133, 0.4)',
                duration: 3,
                yoyo: true,
                repeat: -1,
                ease: 'sine.inOut'
            });

            // Subtle letter spacing animation
            gsap.to(this.textElements.zikada, {
                letterSpacing: '0.1em',
                duration: 5,
                yoyo: true,
                repeat: -1,
                ease: 'power1.inOut'
            });
        }

        // Animate 3886 text - more prominent and always visible
        if (this.textElements.text3886) {
            // Ensure minimum brightness
            gsap.set(this.textElements.text3886, {
                filter: 'brightness(1.2)',
                textShadow: '0 0 10px rgba(0, 255, 133, 0.5), 0 0 20px rgba(0, 255, 133, 0.3)'
            });

            // Pulsing size
            gsap.to(this.textElements.text3886, {
                scale: 1.08,  // Increased from 1.05
                duration: 2,
                yoyo: true,
                repeat: -1,
                ease: 'power2.inOut'
            });

            // Enhanced glow animation
            gsap.to(this.textElements.text3886, {
                textShadow: '0 0 20px rgba(0, 255, 133, 0.8), 0 0 40px rgba(0, 255, 133, 0.5)',
                filter: 'brightness(1.3) contrast(1.1)',
                duration: 3,
                yoyo: true,
                repeat: -1,
                ease: 'sine.inOut'
            });
        }
    }

    protectOpacity() {
        // Aggressive opacity protection
        const protectLogo = () => {
            if (this.logo) {
                const currentOpacity = parseFloat(window.getComputedStyle(this.logo).opacity);
                if (currentOpacity < this.minOpacity || isNaN(currentOpacity)) {
                    gsap.set(this.logo, { opacity: 1, clearProps: 'opacity' });
                    console.log('🛡️ Logo opacity protected');
                }
            }
            requestAnimationFrame(protectLogo);
        };

        protectLogo();

        // Also use MutationObserver as backup
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const opacity = parseFloat(this.logo.style.opacity);
                    if (opacity < this.minOpacity || isNaN(opacity)) {
                        this.logo.style.opacity = '1';
                    }
                }
            });
        });

        observer.observe(this.logo, {
            attributes: true,
            attributeFilter: ['style']
        });
    }

    triggerSpecialAnimation() {
        // Special animations that can be triggered randomly
        const animations = [
            () => this.spiralAnimation(),
            () => this.shatterReform(),
            () => this.holographicFlicker(),
            () => this.energyBurst()
        ];

        const randomAnim = animations[Math.floor(Math.random() * animations.length)];
        randomAnim();
    }

    spiralAnimation() {
        const tl = gsap.timeline();

        tl.to(this.logo, {
            rotation: '+=720',
            scale: 0.8,
            duration: 2,
            ease: 'power2.in'
        })
        .to(this.logo, {
            scale: 1.1,
            duration: 0.5,
            ease: 'back.out(2)'
        })
        .to(this.logo, {
            scale: 1,
            duration: 0.5,
            ease: 'power2.out'
        });
    }

    shatterReform() {
        // Create shard effect
        const tl = gsap.timeline();

        tl.to(this.logo, {
            filter: 'blur(2px) brightness(1.05)',  // Much lower brightness
            scale: 1.02,
            duration: 0.2
        })
        .to(this.logo, {
            filter: 'blur(0px) brightness(1)',
            scale: 1,
            duration: 0.5,
            ease: 'elastic.out(1, 0.5)'
        });
    }

    holographicFlicker() {
        const tl = gsap.timeline({ repeat: 2 });

        tl.to(this.logo, {
            opacity: 0.95,  // Increased from 0.9 to maintain visibility
            filter: 'hue-rotate(180deg) brightness(1.0)',  // No brightness increase at all
            duration: 0.1
        })
        .to(this.logo, {
            opacity: 1,
            filter: 'hue-rotate(0deg) brightness(1)',
            duration: 0.1
        });
    }

    energyBurst() {
        // Create expanding energy ring
        const ring = document.createElement('div');
        ring.style.cssText = `
            position: absolute;
            width: 100%;
            height: 100%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            border: 2px solid rgba(0, 255, 133, 0.8);
            border-radius: 50%;
            pointer-events: none;
            z-index: 10;
        `;

        if (this.logo.parentElement) {
            this.logo.parentElement.appendChild(ring);

            gsap.fromTo(ring, {
                scale: 1,
                opacity: 1
            }, {
                scale: 2,
                opacity: 0,
                duration: 1,
                ease: 'power2.out',
                onComplete: () => ring.remove()
            });
        }

        // Logo reaction
        gsap.to(this.logo, {
            scale: 1.1,
            duration: 0.2,
            yoyo: true,
            repeat: 1,
            ease: 'power2.inOut'
        });
    }

    destroy() {
        if (this.breathTimeline) this.breathTimeline.kill();
        if (this.pulseTimeline) this.pulseTimeline.kill();
        gsap.killTweensOf([this.logo, this.logoWrapper, this.glowElement, this.textElements.zikada, this.textElements.text3886]);
        if (this.glowElement && this.glowElement.parentElement) {
            this.glowElement.remove();
        }
        this.isInitialized = false;
    }
}

export default new LogoAnimator();