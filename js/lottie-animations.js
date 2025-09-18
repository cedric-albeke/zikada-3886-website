// Lottie Animations Module - Cosmic visual effects system
class LottieAnimations {
    constructor() {
        this.animations = {
            planetRing: null,
            planetLogo: null,
            abstraction: null,
            hexagon: null,
            morphingParticle: null,
            sacredGeometry: null,
            transparentDiamond: null,
            circuitRound: null,
            geometricalLines: null,
            circularDots: null
        };

        this.containers = {};
        this.isInitialized = false;

        // Animation configurations - centered and full-width circular animations
        this.config = {
            planetRing: {
                path: '/animations/lottie/planet-ring.lottie',
                loop: true,
                autoplay: false,
                renderer: 'svg',
                size: 'calc(min(90vw, 90vh))',  // Scaled up
                position: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
                opacity: 0.08,  // Further reduced opacity (was 0.15)
                triggerOnScroll: false,
                blendMode: 'screen',
                zIndex: 2,  // Lower z-index
                displayDuration: 6000,  // Show for 6 seconds
                displayInterval: 75000  // Every 75 seconds
            },
            planetLogo: {
                path: '/animations/lottie/Planet-Logo.lottie',
                loop: true,
                autoplay: false,  // Don't autoplay initially
                renderer: 'svg',
                size: 'calc(min(95vw, 95vh))',  // Scaled up
                position: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
                opacity: 0.2,  // Reduced opacity
                triggerOnScroll: false,
                blendMode: 'screen',  // Better color blending
                zIndex: 3,  // Lower z-index
                displayDuration: 8000,  // Show for 8 seconds
                displayInterval: 60000  // Every 60 seconds
            },
            abstraction: {
                path: '/animations/lottie/Abstraction.lottie',
                loop: true,
                autoplay: false,
                renderer: 'svg',
                size: 'calc(min(150vw, 150vh))',
                position: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
                opacity: 0.02,  // DRASTICALLY reduced opacity (was 0.06)
                triggerOnScroll: false,
                blendMode: 'multiply',
                zIndex: 1,
                displayDuration: 7000,
                displayInterval: 85000
            },
            // REMOVED - hexagon animation disabled per request
            /*
            hexagon: {
                path: '/animations/lottie/Impossible-Hexagon-black.lottie',
                loop: true,
                autoplay: false,
                renderer: 'svg',
                size: 'calc(min(106vw, 106vh))',
                position: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
                opacity: 0.15,
                triggerOnScroll: false,
                blendMode: 'screen',
                zIndex: 2,
                displayDuration: 5000,
                displayInterval: 65000
            },
            */
            morphingParticle: {
                path: '/animations/lottie/Morphing-Particle-Loader.lottie',
                loop: true,
                autoplay: false,
                renderer: 'canvas',
                size: 'calc(min(80vw, 80vh))',  // Scaled up
                position: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
                opacity: 0.22,  // Reduced opacity
                triggerOnScroll: false,
                blendMode: 'add',
                zIndex: 2,  // Lower z-index
                displayDuration: 4000,
                displayInterval: 55000
            },
            sacredGeometry: {
                path: '/animations/lottie/Sacred-Geometry.lottie',
                loop: true,
                autoplay: false,
                renderer: 'svg',
                size: 'calc(min(110vw, 110vh))',  // Scaled up more for dramatic effect
                position: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
                opacity: 0.1,  // Very subtle
                triggerOnScroll: true,
                blendMode: 'overlay',
                zIndex: 1,  // Lowest z-index
                displayDuration: 9000,
                displayInterval: 95000
            },
            transparentDiamond: {
                path: '/animations/lottie/transparent-diamond-dark.lottie',
                loop: true,
                autoplay: false,
                renderer: 'svg',
                size: 'calc(min(70vw, 70vh))',  // Scaled up significantly
                position: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
                opacity: 0.25,  // Reduced opacity
                triggerOnScroll: false,
                blendMode: 'screen',
                zIndex: 3,  // Lower z-index
                displayDuration: 3500,
                displayInterval: 45000
            },
            circuitRound: {
                path: '/animations/lottie/circuit-round-ani.lottie',
                loop: true,
                autoplay: false,
                renderer: 'svg',
                size: 'calc(min(100vw, 100vh))',  // Full coverage
                position: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
                opacity: 0.15,  // Subtle opacity
                triggerOnScroll: false,
                blendMode: 'overlay',
                zIndex: 2,
                displayDuration: 6000,
                displayInterval: 70000  // Every 70 seconds
            },
            geometricalLines: {
                path: '/animations/lottie/geometrical-lines.lottie',
                loop: true,
                autoplay: false,
                renderer: 'svg',
                size: 'calc(min(120vw, 120vh))',  // Larger for dramatic effect
                position: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
                opacity: 0.08,  // Very subtle
                triggerOnScroll: false,
                blendMode: 'add',
                zIndex: 1,
                displayDuration: 8000,
                displayInterval: 80000  // Every 80 seconds
            },
            circularDots: {
                path: '/animations/lottie/circular-dots.lottie',
                loop: true,
                autoplay: false,
                renderer: 'canvas',  // Canvas for better performance with dots
                size: 'calc(min(85vw, 85vh))',
                position: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
                opacity: 0.18,  // Medium opacity
                triggerOnScroll: false,
                blendMode: 'screen',
                zIndex: 2,
                displayDuration: 5000,
                displayInterval: 65000  // Every 65 seconds
            }
        };

        // Store JSON data locally for better performance
        this.animationData = {
            planetRing: null,
            planetLogo: null,
            abstraction: null,  // Re-enabled with low opacity
            // hexagon: null,  // REMOVED
            morphingParticle: null,
            sacredGeometry: null,
            transparentDiamond: null,
            circuitRound: null,
            geometricalLines: null,
            circularDots: null
        };
    }

    async init() {
        console.log('🌟 Initializing Lottie animations...');

        try {
            // Create containers for each animation
            this.createContainers();

            // Load animation data
            await this.loadAnimationData();

            // Initialize all animations
            this.initPlanetRing();
            this.initPlanetLogo();
            this.initAbstraction();  // Re-enabled with low opacity
            // this.initHexagon();  // REMOVED
            this.initMorphingParticle();
            this.initSacredGeometry();
            this.initTransparentDiamond();
            this.initCircuitRound();
            this.initGeometricalLines();
            this.initCircularDots();

            // Set up interaction handlers
            this.setupInteractions();

            // Start animation cycles
            this.startAnimationCycles();

            // Add to window for debugging
            window.lottieAnimations = this;

            this.isInitialized = true;
            console.log('✨ Lottie animations initialized');
        } catch (error) {
            console.error('Failed to initialize Lottie animations:', error);
        }
    }

    createContainers() {
        // Create main Lottie container
        const mainContainer = document.createElement('div');
        mainContainer.className = 'lottie-container';
        mainContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1 !important;  /* Ensure animations stay behind everything */
        `;
        document.body.appendChild(mainContainer);

        // Create individual animation containers with dotlottie-player elements
        ['planetRing', 'planetLogo', 'abstraction', 'morphingParticle', 'sacredGeometry', 'transparentDiamond', 'circuitRound', 'geometricalLines', 'circularDots'].forEach(name => {
            const container = document.createElement('dotlottie-player');
            container.className = `lottie-${name}`;
            container.id = `lottie-${name}`;

            // Set attributes for dotlottie-player
            container.setAttribute('src', this.config[name].path);
            container.setAttribute('background', 'transparent');
            container.setAttribute('speed', '1');
            container.setAttribute('style', `width: 100%; height: 100%;`);

            if (this.config[name].loop) {
                container.setAttribute('loop', '');
            }
            // Don't autoplay - we'll control this with chaos engine

            const config = this.config[name];
            const wrapperDiv = document.createElement('div');
            wrapperDiv.className = `lottie-wrapper-${name}`;
            wrapperDiv.style.cssText = `
                position: absolute;
                ${Object.entries(config.position).map(([key, value]) => `${key}: ${value}`).join('; ')};
                opacity: 0;
                transition: opacity 1.5s ease-in-out;  /* Smoother, slower transitions */
                mix-blend-mode: ${config.blendMode};
                pointer-events: none;
                z-index: ${config.zIndex || 5};  /* Default to 5 if not specified */
                width: ${config.size};
                height: ${config.size};
                border-radius: 50%;
                overflow: hidden;
            `;

            wrapperDiv.appendChild(container);
            mainContainer.appendChild(wrapperDiv);
            this.containers[name] = container;
        });
    }

    async loadAnimationData() {
        // No need to load animation data anymore - we'll use file paths directly
        // The Lottie library will handle loading the .lottie files
        console.log('🎯 Using .lottie files directly from disk');
    }

    initPlanetRing() {
        if (!this.containers.planetRing) return;

        const wrapper = this.containers.planetRing.parentElement;
        this.animations.planetRing = this.containers.planetRing;

        // Start hidden - will be shown by chaos engine
        wrapper.style.opacity = '0';

        // Add hover effect
        wrapper.addEventListener('mousemove', (e) => {
            const player = this.containers.planetRing;
            if (!player) return;

            const rect = wrapper.getBoundingClientRect();
            const distance = Math.sqrt(
                Math.pow(e.clientX - (rect.left + rect.width / 2), 2) +
                Math.pow(e.clientY - (rect.top + rect.height / 2), 2)
            );

            if (distance < 300) {
                player.setAttribute('speed', '1.2');  // Less dramatic speed change
                wrapper.style.opacity = '0.15';  // More subtle brighten on hover
                wrapper.style.filter = 'brightness(1.05)';  // Gentler brightness
            } else {
                player.setAttribute('speed', '1');
                wrapper.style.opacity = this.config.planetRing.opacity.toString();
                wrapper.style.filter = 'brightness(1)';
            }
        });
    }

    initAbstraction() {
        if (!this.containers.abstraction) return;

        const wrapper = this.containers.abstraction.parentElement;
        this.animations.abstraction = this.containers.abstraction;

        // Start hidden - will be shown by chaos engine
        wrapper.style.opacity = '0';
    }

    // REMOVED - hexagon animation disabled
    /*
    initHexagon() {
        if (!this.containers.hexagon) return;

        const wrapper = this.containers.hexagon.parentElement;
        this.animations.hexagon = this.containers.hexagon;

        // Start hidden
        wrapper.style.opacity = '0';

        // Subtle pulsing effect on hover
        wrapper.addEventListener('mouseenter', () => {
            wrapper.style.filter = 'brightness(1.15) saturate(1.2)';
        });
        wrapper.addEventListener('mouseleave', () => {
            wrapper.style.filter = 'brightness(1)';
        });
    }
    */

    initMorphingParticle() {
        if (!this.containers.morphingParticle) return;

        const wrapper = this.containers.morphingParticle.parentElement;
        this.animations.morphingParticle = this.containers.morphingParticle;

        // Start hidden
        wrapper.style.opacity = '0';
    }

    initSacredGeometry() {
        if (!this.containers.sacredGeometry) return;

        const wrapper = this.containers.sacredGeometry.parentElement;
        this.animations.sacredGeometry = this.containers.sacredGeometry;

        // Start hidden
        wrapper.style.opacity = '0';

        // Trigger on scroll
        window.addEventListener('scroll', () => {
            if (window.scrollY > 800 && !this.sacredGeometryTriggered) {
                this.showAnimation('sacredGeometry');
                this.sacredGeometryTriggered = true;
            }
        });
    }

    initTransparentDiamond() {
        if (!this.containers.transparentDiamond) return;

        const wrapper = this.containers.transparentDiamond.parentElement;
        this.animations.transparentDiamond = this.containers.transparentDiamond;

        // Start hidden
        wrapper.style.opacity = '0';

        // Sparkle effect on click
        wrapper.style.cursor = 'pointer';
        wrapper.addEventListener('click', () => {
            this.createSparkleEffect(wrapper);
        });
    }

    initCircuitRound() {
        if (!this.containers.circuitRound) return;

        const wrapper = this.containers.circuitRound.parentElement;
        this.animations.circuitRound = this.containers.circuitRound;

        // Start hidden - will be shown by animation cycles
        wrapper.style.opacity = '0';

        // Add subtle rotation on hover
        wrapper.addEventListener('mouseenter', () => {
            wrapper.style.transition = 'transform 1s ease-in-out';
            wrapper.style.transform = `${this.config.circuitRound.position.transform || ''} rotate(5deg)`;
        });
        wrapper.addEventListener('mouseleave', () => {
            wrapper.style.transform = this.config.circuitRound.position.transform || '';
        });
    }

    initGeometricalLines() {
        if (!this.containers.geometricalLines) return;

        const wrapper = this.containers.geometricalLines.parentElement;
        this.animations.geometricalLines = this.containers.geometricalLines;

        // Start hidden
        wrapper.style.opacity = '0';

        // Subtle brightness effect on proximity
        document.addEventListener('mousemove', (e) => {
            const rect = wrapper.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const distance = Math.sqrt(
                Math.pow(e.clientX - centerX, 2) +
                Math.pow(e.clientY - centerY, 2)
            );

            if (distance < 400) {
                const proximity = 1 - (distance / 400);
                wrapper.style.filter = `brightness(${1 + proximity * 0.1})`;
            } else {
                wrapper.style.filter = 'brightness(1)';
            }
        });
    }

    initCircularDots() {
        if (!this.containers.circularDots) return;

        const wrapper = this.containers.circularDots.parentElement;
        this.animations.circularDots = this.containers.circularDots;

        // Start hidden
        wrapper.style.opacity = '0';

        // Pulsing effect on click
        wrapper.style.cursor = 'pointer';
        wrapper.addEventListener('click', () => {
            wrapper.style.animation = 'dotsPulse 1s ease-out';
            setTimeout(() => {
                wrapper.style.animation = '';
            }, 1000);
        });

        // Add the pulse animation if it doesn't exist
        if (!document.querySelector('#dots-pulse-style')) {
            const style = document.createElement('style');
            style.id = 'dots-pulse-style';
            style.textContent = `
                @keyframes dotsPulse {
                    0%, 100% {
                        transform: translate(-50%, -50%) scale(1);
                    }
                    50% {
                        transform: translate(-50%, -50%) scale(1.1);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    initPlanetLogo() {
        if (!this.containers.planetLogo) return;

        const wrapper = this.containers.planetLogo.parentElement;
        this.animations.planetLogo = this.containers.planetLogo;

        // Start hidden - will be shown by chaos engine
        wrapper.style.opacity = '0';

        // Click interaction
        wrapper.style.cursor = 'pointer';
        wrapper.addEventListener('click', () => {
            this.triggerCosmicBurst();
        });
    }

    startAnimationCycles() {
        console.log('🎬 Starting Lottie animation cycles');

        // Limit to 2-3 animations maximum at once
        // Stagger them more to reduce overlap

        // Planet Logo - main animation
        setTimeout(() => {
            this.showAnimation('planetLogo');
            setInterval(() => {
                this.showAnimation('planetLogo');
            }, this.config.planetLogo.displayInterval);
        }, 15000); // Start after 15 seconds

        // Planet Ring - secondary animation
        setTimeout(() => {
            this.showAnimation('planetRing');
            setInterval(() => {
                this.showAnimation('planetRing');
            }, this.config.planetRing.displayInterval);
        }, 45000); // Start after 45 seconds (increased gap)

        // Abstraction - with very low opacity
        setTimeout(() => {
            this.showAnimation('abstraction');
            setInterval(() => {
                this.showAnimation('abstraction');
            }, this.config.abstraction.displayInterval);
        }, 75000); // Start after 75 seconds

        // REMOVED - hexagon animation disabled
        /*
        setTimeout(() => {
            this.showAnimation('hexagon');
            setInterval(() => {
                this.showAnimation('hexagon');
            }, this.config.hexagon.displayInterval * 1.5);
        }, 105000);
        */

        // Morphing Particle - reduced frequency
        setTimeout(() => {
            this.showAnimation('morphingParticle');
            setInterval(() => {
                this.showAnimation('morphingParticle');
            }, this.config.morphingParticle.displayInterval * 1.5); // Increase interval
        }, 135000); // Start after 135 seconds

        // Sacred Geometry is triggered by scroll

        // Transparent Diamond - reduced frequency
        setTimeout(() => {
            this.showAnimation('transparentDiamond');
            setInterval(() => {
                this.showAnimation('transparentDiamond');
            }, this.config.transparentDiamond.displayInterval * 2); // Double interval
        }, 165000); // Start after 165 seconds

        // Circuit Round animation
        setTimeout(() => {
            this.showAnimation('circuitRound');
            setInterval(() => {
                this.showAnimation('circuitRound');
            }, this.config.circuitRound.displayInterval);
        }, 30000); // Start after 30 seconds

        // Geometrical Lines animation
        setTimeout(() => {
            this.showAnimation('geometricalLines');
            setInterval(() => {
                this.showAnimation('geometricalLines');
            }, this.config.geometricalLines.displayInterval);
        }, 90000); // Start after 90 seconds

        // Circular Dots animation
        setTimeout(() => {
            this.showAnimation('circularDots');
            setInterval(() => {
                this.showAnimation('circularDots');
            }, this.config.circularDots.displayInterval);
        }, 120000); // Start after 120 seconds
    }

    showAnimation(name) {
        const animation = this.animations[name];
        const config = this.config[name];
        if (!animation || !animation.parentElement) return;

        const wrapper = animation.parentElement;

        // Dispatch event for logo animations to react
        window.dispatchEvent(new CustomEvent('lottieAnimationStart', {
            detail: { name: name }
        }));

        // Fade in with smoother transitions
        wrapper.style.transition = 'opacity 2s ease-in-out, filter 2s ease-in-out';
        wrapper.style.opacity = config.opacity.toString();

        // Special enhancement for planet-logo
        if (name === 'planetLogo') {
            // Very subtle enhancement with minimal glow
            wrapper.style.filter = 'saturate(1.2) brightness(1.05) contrast(1.05) drop-shadow(0 0 15px rgba(0, 255, 200, 0.15))';
        }

        animation.play();

        // Fade out after display duration
        setTimeout(() => {
            wrapper.style.opacity = '0';
            wrapper.style.filter = 'none';
            setTimeout(() => {
                animation.stop();
            }, 500);
        }, config.displayDuration);
    }

    setupInteractions() {
        // Scroll-based triggers
        let lastScrollY = window.scrollY;
        let rotationDirections = {};  // Track rotation direction for each animation
        let rotationValues = {};  // Track current rotation values

        // Initialize rotation values
        Object.keys(this.containers).forEach(name => {
            rotationValues[name] = 0;
            rotationDirections[name] = 1;  // 1 = forward, -1 = reverse
        });

        // Create reverse rotation scenes
        const createRotationReversal = () => {
            // Every 10-20 seconds, randomly reverse some animations
            setInterval(() => {
                // Randomly select 2-3 animations to reverse
                const animations = Object.keys(this.containers);
                const numToReverse = Math.floor(Math.random() * 2) + 2;

                for (let i = 0; i < numToReverse; i++) {
                    const randomAnim = animations[Math.floor(Math.random() * animations.length)];
                    rotationDirections[randomAnim] *= -1;  // Reverse direction

                    // Smooth transition when reversing
                    const wrapper = this.containers[randomAnim]?.parentElement;
                    if (wrapper) {
                        wrapper.style.transition = 'transform 2s cubic-bezier(0.4, 0, 0.2, 1)';
                        setTimeout(() => {
                            wrapper.style.transition = '';  // Remove transition after
                        }, 2000);
                    }
                }
            }, Math.random() * 10000 + 10000);  // 10-20 seconds
        };

        createRotationReversal();

        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            const scrollDelta = currentScrollY - lastScrollY;

            // Rotation effect on scroll for all animations with different speeds
            const rotationSpeeds = {
                planetRing: 0.05,
                planetLogo: -0.08,  // Negative for opposite direction
                abstraction: 0.03,
                hexagon: -0.06,
                morphingParticle: 0.07,
                sacredGeometry: -0.04,
                transparentDiamond: 0.09,
                circuitRound: -0.05,
                geometricalLines: 0.04,
                circularDots: -0.07
            };

            Object.keys(this.containers).forEach(name => {
                const wrapper = this.containers[name]?.parentElement;
                if (wrapper) {
                    // Apply rotation with direction multiplier
                    const speed = rotationSpeeds[name] || 0.1;
                    rotationValues[name] += scrollDelta * speed * rotationDirections[name] * 0.1;

                    wrapper.style.transform =
                        `${this.config[name].position.transform || ''} rotate(${rotationValues[name]}deg)`;
                }
            });


            lastScrollY = currentScrollY;
        });

        // Performance mode integration
        window.addEventListener('performanceModeChange', (event) => {
            const mode = event.detail.mode;
            if (mode === 'low') {
                this.pauseAll();
            } else if (mode === 'high') {
                this.resumeAll();
            }
        });

        // Integration with chaos engine phases
        window.addEventListener('chaosPhase', (event) => {
            const phase = event.detail.phase;
            console.log('🌀 Lottie reacting to chaos phase:', phase);

            switch(phase) {
                case 'intense':
                    // Show planet ring during intense phase
                    this.showAnimation('planetRing');
                    break;
                case 'glitch':
                    // Show planet logo during glitch
                    this.showAnimation('planetLogo');
                    break;
                case 'matrix':
                    // Show multiple animations during matrix phase
                    if (Math.random() > 0.5) {
                        this.showAnimation('abstraction');
                    }
                    if (Math.random() > 0.6) {
                        this.showAnimation('transparentDiamond');
                    }
                    break;
            }
        });
    }

    createSparkleEffect(container) {
        const sparkle = document.createElement('div');
        sparkle.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 300px;
            height: 300px;
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 1000;
        `;

        // Create sparkle particles
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            const angle = (i / 12) * Math.PI * 2;
            const distance = Math.random() * 100 + 50;

            particle.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                width: 4px;
                height: 4px;
                background: white;
                box-shadow: 0 0 6px white, 0 0 12px rgba(255, 255, 255, 0.8);
                border-radius: 50%;
                animation: sparkleMove 0.8s ease-out forwards;
                transform: translate(-50%, -50%);
                --end-x: ${Math.cos(angle) * distance}px;
                --end-y: ${Math.sin(angle) * distance}px;
            `;
            sparkle.appendChild(particle);
        }

        // Add animation
        if (!document.querySelector('#sparkle-style')) {
            const style = document.createElement('style');
            style.id = 'sparkle-style';
            style.textContent = `
                @keyframes sparkleMove {
                    0% {
                        transform: translate(-50%, -50%);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(calc(-50% + var(--end-x)), calc(-50% + var(--end-y)));
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        container.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 800);
    }

    triggerCosmicBurst() {
        console.log('🌌 Cosmic burst triggered!');

        // Create burst effect
        const burst = document.createElement('div');
        burst.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            width: 100px;
            height: 100px;
            background: radial-gradient(circle,
                rgba(255, 255, 255, 0.4) 0%,  /* Reduced from 0.8 */
                rgba(255, 200, 0, 0.3) 30%,   /* Reduced from 0.6 */
                rgba(255, 100, 0, 0.2) 60%,   /* Reduced from 0.4 */
                transparent 100%);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 10000;
            animation: cosmicBurst 1s ease-out forwards;
        `;

        // Add CSS animation
        if (!document.querySelector('#cosmic-burst-style')) {
            const style = document.createElement('style');
            style.id = 'cosmic-burst-style';
            style.textContent = `
                @keyframes cosmicBurst {
                    0% {
                        width: 100px;
                        height: 100px;
                        opacity: 1;
                    }
                    100% {
                        width: 2000px;
                        height: 2000px;
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(burst);
        setTimeout(() => burst.remove(), 1000);

        // Speed up all animations temporarily
        Object.values(this.animations).forEach(player => {
            if (player) {
                player.setAttribute('speed', '3');
                setTimeout(() => player.setAttribute('speed', '1'), 2000);
            }
        });
    }

    createGlowEffect(container) {
        const glow = document.createElement('div');
        glow.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle,
                rgba(255, 255, 100, 0.4) 0%,
                rgba(255, 200, 0, 0.2) 40%,
                transparent 70%);
            transform: translate(-50%, -50%);
            pointer-events: none;
            animation: pulse 2s ease-in-out infinite;
        `;

        container.appendChild(glow);
        setTimeout(() => glow.remove(), 5000);
    }

    pauseAll() {
        Object.values(this.animations).forEach(player => {
            if (player && player.pause) player.pause();
        });
    }

    resumeAll() {
        Object.values(this.animations).forEach(player => {
            if (player && player.play) player.play();
        });
    }

    // Public methods for integration
    play(name) {
        if (this.animations[name] && this.animations[name].play) {
            this.animations[name].play();
        }
    }

    pause(name) {
        if (this.animations[name] && this.animations[name].pause) {
            this.animations[name].pause();
        }
    }

    setSpeed(name, speed) {
        if (this.animations[name]) {
            this.animations[name].setAttribute('speed', speed.toString());
        }
    }

    destroy() {
        Object.values(this.animations).forEach(player => {
            if (player && player.destroy) player.destroy();
        });

        // Remove containers
        const mainContainer = document.querySelector('.lottie-container');
        if (mainContainer) mainContainer.remove();
    }
}

export default new LottieAnimations();