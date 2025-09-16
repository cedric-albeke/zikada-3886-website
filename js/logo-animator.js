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

        // Store references for cleanup
        this.eventListeners = [];
        this.observer = null;
        this.animationFrameId = null;
    }

    init() {
        console.log('🎬 LogoAnimator.init() called');

        // Target the correct logo element - image-2 with c01n.svg
        this.logo = document.querySelector('.image-2') ||
                    document.querySelector('img[src*="c01n"]') ||
                    document.querySelector('.image-wrapper img');
        this.logoWrapper = document.querySelector('.logo-text-wrapper');
        this.textElements.zikada = document.querySelector('.zikada-text');
        this.textElements.text3886 = document.querySelector('.text-3886');

        console.log('🔍 Logo search results:', {
            logo: this.logo,
            logoSrc: this.logo?.src,
            logoClass: this.logo?.className,
            logoWrapper: this.logoWrapper,
            zikadaText: this.textElements.zikada,
            text3886: this.textElements.text3886
        });

        if (!this.logo) {
            console.error('❌ Logo element not found! Aborting initialization.');

            // Try to find ANY image element for debugging
            const allImages = document.querySelectorAll('img');
            console.log('All images on page:', allImages.length);
            allImages.forEach((img, index) => {
                console.log(`  Image ${index}: src="${img.src}", class="${img.className}"`);
            });

            return;
        }

        console.log('✅ Logo element found! Continuing with animation setup...');

        // Listen for Webflow override completion
        window.addEventListener('webflowOverridden', (event) => {
            console.log('🎉 Webflow has been overridden! Re-initializing animations...');
            // Re-trigger test animations
            setTimeout(() => {
                this.triggerWobble();
                setTimeout(() => this.triggerPump(), 500);
            }, 500);
        });

        // Remove any existing glow elements first (in case of restart)
        const existingGlow = document.querySelector('.logo-glow');
        if (existingGlow) {
            existingGlow.remove();
        }

        // Force initial opacity and ensure no distortion or filters
        gsap.set(this.logo, {
            opacity: 1,
            scale: 1,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            filter: 'none',  // Remove ALL filters
            clearProps: 'filter'  // Clear any existing filter properties
        });

        // Also set important styles directly
        this.logo.style.opacity = '1 !important';
        this.logo.style.filter = 'none !important';

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

        // DEBUGGING: Trigger a test animation after 3 seconds
        console.log('⏱️ Setting up test animation in 3 seconds...');
        setTimeout(() => {
            console.log('🧪 RUNNING TEST ANIMATIONS NOW!');

            // Test 1: Direct GSAP animation
            console.log('Test 1: Direct scale animation');
            gsap.to(this.logo, {
                scale: 1.5,
                duration: 1,
                ease: 'power2.inOut',
                onStart: () => console.log('Scale animation started'),
                onComplete: () => {
                    console.log('Scale animation completed');
                    gsap.to(this.logo, { scale: 1, duration: 1 });
                }
            });

            // Test 2: Trigger wobble after 2 seconds
            setTimeout(() => {
                console.log('Test 2: Triggering wobble');
                this.triggerWobble();
            }, 2000);

            // Test 3: Trigger pump after 4 seconds
            setTimeout(() => {
                console.log('Test 3: Triggering pump');
                this.triggerPump();
            }, 4000);

        }, 3000);

        // Also expose to window for manual testing
        window.testLogoAnimation = () => {
            console.log('Manual test triggered!');
            this.triggerWobble();
            setTimeout(() => this.triggerPump(), 1000);
            setTimeout(() => this.triggerSquish(), 2000);
        };
        console.log('💡 You can also run: window.testLogoAnimation()');
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
                scale: 1.08,  // Increased for more visible breathing
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
            // Removed filter animations to prevent white washing
            .to(this.logo, {
                scale: 1.02,  // Only scale, no filters
                duration: 0.5,
                ease: 'power2.in'
            })
            .to(this.logo, {
                scale: 1,
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
        const phaseHandler = (e) => this.reactToPhase(e.detail.phase);
        const matrixHandler = () => this.matrixReaction();
        const glitchHandler = () => this.glitchReaction();
        const lottieHandler = (e) => this.reactToLottieAnimation(e.detail.name);
        const vhsHandler = () => this.vhsDistortion();

        window.addEventListener('animationPhase', phaseHandler);
        window.addEventListener('matrixMessage', matrixHandler);
        window.addEventListener('glitchEvent', glitchHandler);
        window.addEventListener('lottieAnimationStart', lottieHandler);
        window.addEventListener('vhsGlitch', vhsHandler);

        // Store for cleanup
        this.eventListeners.push(
            { type: 'animationPhase', handler: phaseHandler },
            { type: 'matrixMessage', handler: matrixHandler },
            { type: 'glitchEvent', handler: glitchHandler },
            { type: 'lottieAnimationStart', handler: lottieHandler },
            { type: 'vhsGlitch', handler: vhsHandler }
        );
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

        // Removed filter effects - use scale only
        tl.to(this.logo, {
            scale: 1.03,
            duration: 0.2,
            ease: 'power4.in'
        })
        .to(this.logo, {
            scale: 1,
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
        // Gentle glitch effect (reduced intensity)
        const tl = gsap.timeline();

        tl.to(this.logo, {
            x: () => Math.random() * 10 - 5,
            y: () => Math.random() * 10 - 5,
            duration: 0.05
        })
        .to(this.logo, {
            x: () => Math.random() * 10 - 5,
            y: () => Math.random() * 10 - 5,
            // Removed filter to prevent color changes
            duration: 0.05
        })
        .to(this.logo, {
            x: 0,
            y: 0,
            // Removed filter reset
            duration: 0.1,
            ease: 'power2.out'
        });
    }

    technoReaction() {
        // Gentle techno pulse (removed strobe)
        const tl = gsap.timeline({ repeat: 1 });  // Reduced repeats

        // Slower, gentler pulse
        tl.to(this.logo, {
            scale: 1.01,  // Reduced scale change
            duration: 0.3   // Much slower
        })
        .to(this.logo, {
            scale: 0.99,
            duration: 0.3
        });
    }

    // New reactive animations for Lottie events
    reactToLottieAnimation(animationName) {
        console.log('🎬 Logo reacting to Lottie:', animationName);

        switch(animationName) {
            case 'planetRing':
                this.triggerWobble();
                break;
            case 'planetLogo':
                this.triggerPump();
                break;
            case 'morphingParticle':
                this.triggerBreathe();
                break;
            case 'transparentDiamond':
                this.triggerSquish();
                break;
            case 'circuitRound':
                this.triggerRotateWobble();
                break;
            case 'geometricalLines':
                this.triggerGlitchWave();
                break;
            case 'circularDots':
                this.triggerPulse();
                break;
            case 'abstraction':
            case 'sacredGeometry':
                this.triggerSubtleReaction();
                break;
        }
    }

    // Wobble effect
    triggerWobble() {
        console.log('🌊 triggerWobble called!', {
            logo: this.logo,
            isInitialized: this.isInitialized,
            isTweening: gsap.isTweening(this.logo)
        });

        if (!this.logo) {
            console.error('❌ Cannot wobble: logo is null');
            return;
        }

        const tl = gsap.timeline({
            onStart: () => console.log('Wobble animation started'),
            onComplete: () => console.log('Wobble animation completed')
        });

        tl.to(this.logo, {
            rotation: '+=3',
            duration: 0.1,
            ease: 'power2.inOut'
        })
        .to(this.logo, {
            rotation: '-=6',
            duration: 0.2,
            ease: 'power2.inOut'
        })
        .to(this.logo, {
            rotation: '+=5',
            duration: 0.2,
            ease: 'power2.inOut'
        })
        .to(this.logo, {
            rotation: '-=3',
            duration: 0.15,
            ease: 'power2.inOut'
        })
        .to(this.logo, {
            rotation: '+=1',
            duration: 0.1,
            ease: 'power2.out'
        });
    }

    // Pump effect
    triggerPump() {
        const tl = gsap.timeline();

        tl.to(this.logo, {
            scale: 1.15,
            duration: 0.2,
            ease: 'power2.out'
        })
        .to(this.logo, {
            scale: 0.95,
            duration: 0.1,
            ease: 'power2.in'
        })
        .to(this.logo, {
            scale: 1.08,
            duration: 0.15,
            ease: 'power2.out'
        })
        .to(this.logo, {
            scale: 1,
            duration: 0.2,
            ease: 'elastic.out(1, 0.3)'
        });
    }

    // Enhanced breathe effect
    triggerBreathe() {
        gsap.to(this.logo, {
            scale: 1.1,
            duration: 2,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: 2
        });
    }

    // Squish effect
    triggerSquish() {
        const tl = gsap.timeline();

        tl.to(this.logo, {
            scaleY: 0.8,
            scaleX: 1.2,
            duration: 0.15,
            ease: 'power2.in'
        })
        .to(this.logo, {
            scaleY: 1.2,
            scaleX: 0.8,
            duration: 0.15,
            ease: 'power2.out'
        })
        .to(this.logo, {
            scaleY: 0.95,
            scaleX: 1.05,
            duration: 0.1,
            ease: 'power2.inOut'
        })
        .to(this.logo, {
            scaleY: 1,
            scaleX: 1,
            duration: 0.2,
            ease: 'elastic.out(1, 0.3)'
        });
    }

    // Rotate wobble
    triggerRotateWobble() {
        const tl = gsap.timeline();

        tl.to(this.logo, {
            rotation: '+=360',
            scale: 1.1,
            duration: 0.8,
            ease: 'power2.inOut'
        })
        .to(this.logo, {
            rotation: '+=5',
            scale: 0.95,
            duration: 0.2,
            ease: 'power2.out'
        })
        .to(this.logo, {
            rotation: '-=5',
            scale: 1,
            duration: 0.3,
            ease: 'elastic.out(1, 0.5)'
        });
    }

    // Glitch wave
    triggerGlitchWave() {
        const tl = gsap.timeline();

        for (let i = 0; i < 5; i++) {
            tl.to(this.logo, {
                x: gsap.utils.random(-5, 5),
                y: gsap.utils.random(-5, 5),
                skewX: gsap.utils.random(-3, 3),
                skewY: gsap.utils.random(-3, 3),
                duration: 0.05,
                ease: 'none'
            });
        }

        tl.to(this.logo, {
            x: 0,
            y: 0,
            skewX: 0,
            skewY: 0,
            duration: 0.1,
            ease: 'power2.out'
        });
    }

    // Rhythmic pulse
    triggerPulse() {
        const tl = gsap.timeline();

        for (let i = 0; i < 3; i++) {
            tl.to(this.logo, {
                scale: 1.08,
                duration: 0.15,
                ease: 'power2.out'
            })
            .to(this.logo, {
                scale: 1,
                duration: 0.15,
                ease: 'power2.in'
            });
        }
    }

    // VHS distortion
    vhsDistortion() {
        gsap.to(this.logo, {
            skewX: gsap.utils.random(-5, 5),
            scaleY: gsap.utils.random(0.98, 1.02),
            duration: 0.1,
            ease: 'none',
            yoyo: true,
            repeat: 3
        });
    }

    // Subtle reaction
    triggerSubtleReaction() {
        gsap.to(this.logo, {
            scale: 1.02,
            rotation: '+=1',
            duration: 0.3,
            ease: 'power2.inOut',
            yoyo: true,
            repeat: 1
        });
    }

    startLogoRotation() {
        console.log('🔄 startLogoRotation called');

        // TEMPORARILY SIMPLIFIED FOR DEBUGGING
        // Just do a simple rotation to test
        gsap.to(this.logo, {
            rotation: 360,
            duration: 10,  // Much faster for testing
            repeat: -1,
            ease: 'none',
            onStart: () => console.log('✅ Rotation animation started'),
            onRepeat: () => console.log('🔄 Rotation loop')
        });

        // Comment out 3D rotation for now
        /*
        // Subtle 3D rotation
        gsap.to(this.logo, {
            rotationY: 5,
            rotationX: 5,
            duration: 10,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });
        */
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

        // Animate 3886 text - SUBTLE animations only
        if (this.textElements.text3886) {
            // Ensure minimum brightness
            gsap.set(this.textElements.text3886, {
                filter: 'brightness(1.2)',
                textShadow: '0 0 10px rgba(0, 255, 133, 0.5), 0 0 20px rgba(0, 255, 133, 0.3)'
            });

            // REMOVED scale pulsing - was too aggressive
            // Only keep subtle glow animation
            gsap.to(this.textElements.text3886, {
                textShadow: '0 0 15px rgba(0, 255, 133, 0.6), 0 0 30px rgba(0, 255, 133, 0.3)',
                filter: 'brightness(1.25) contrast(1.05)',
                duration: 4,
                yoyo: true,
                repeat: -1,
                ease: 'sine.inOut'
            });
        }
    }

    protectOpacity() {
        // Re-enabled now that Webflow is blocked
        console.log('🛡️ protectOpacity enabled');

        // ULTRA aggressive opacity and filter protection
        const protectLogo = () => {
            if (!this.isInitialized) return; // Stop if destroyed

            if (this.logo) {
                // Check computed styles
                const computed = window.getComputedStyle(this.logo);
                const currentOpacity = parseFloat(computed.opacity);
                const currentFilter = computed.filter;

                // Fix opacity if needed
                if (currentOpacity < this.minOpacity || isNaN(currentOpacity)) {
                    this.logo.style.opacity = '1';
                    this.logo.style.setProperty('opacity', '1', 'important');
                    gsap.set(this.logo, { opacity: 1 });
                }

                // Remove ANY filters that could cause whitening
                if (currentFilter && currentFilter !== 'none') {
                    this.logo.style.filter = 'none';
                    this.logo.style.setProperty('filter', 'none', 'important');
                    gsap.set(this.logo, { filter: 'none', clearProps: 'filter' });
                }
            }
            this.animationFrameId = requestAnimationFrame(protectLogo);
        };

        protectLogo();

        // Ultra aggressive MutationObserver
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    // Force opacity to 1
                    if (this.logo.style.opacity !== '1') {
                        this.logo.style.opacity = '1';
                        this.logo.style.setProperty('opacity', '1', 'important');
                    }

                    // Force remove all filters
                    if (this.logo.style.filter && this.logo.style.filter !== 'none') {
                        this.logo.style.filter = 'none';
                        this.logo.style.setProperty('filter', 'none', 'important');
                    }
                }
            });
        });

        this.observer.observe(this.logo, {
            attributes: true,
            attributeFilter: ['style', 'class']
        });

        // Note: Opacity and filter protection is handled by CSS and MutationObserver
        // Animations are allowed for scale, rotation, and position
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

        // Shard effect without filters
        tl.to(this.logo, {
            scale: 1.02,
            duration: 0.2
        })
        .to(this.logo, {
            scale: 1,
            duration: 0.5,
            ease: 'elastic.out(1, 0.5)'
        });
    }

    holographicFlicker() {
        const tl = gsap.timeline({ repeat: 2 });

        // Holographic flicker without filters or opacity changes
        tl.to(this.logo, {
            scaleX: 1.01,
            scaleY: 0.99,
            duration: 0.1
        })
        .to(this.logo, {
            scaleX: 1,
            scaleY: 1,
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
        this.isInitialized = false;

        // Cancel animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        // Disconnect observer
        if (this.observer) {
            this.observer.disconnect();
        }

        // Remove event listeners
        this.eventListeners.forEach(({ type, handler }) => {
            window.removeEventListener(type, handler);
        });
        this.eventListeners = [];

        // Kill GSAP animations
        if (this.breathTimeline) this.breathTimeline.kill();
        if (this.pulseTimeline) this.pulseTimeline.kill();
        gsap.killTweensOf([this.logo, this.logoWrapper, this.glowElement, this.textElements.zikada, this.textElements.text3886]);

        // Remove DOM elements
        if (this.glowElement && this.glowElement.parentElement) {
            this.glowElement.remove();
        }
    }
}

export default new LogoAnimator();