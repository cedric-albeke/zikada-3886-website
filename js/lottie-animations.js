// Lottie Animations Module - Cosmic visual effects system
class LottieAnimations {
    constructor() {
        this.animations = {
            planetRing: null,
            sunReveal: null,
            planetLogo: null
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
                size: 'calc(min(80vw, 80vh))',  // Responsive size
                position: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
                opacity: 0.3,
                triggerOnScroll: false,
                blendMode: 'screen',
                zIndex: 3,  // Behind main logo (26)
                displayDuration: 8000,  // Show for 8 seconds
                displayInterval: 45000  // Every 45 seconds
            },
            sunReveal: {
                path: '/animations/lottie/sun-reveal.lottie',
                loop: false,
                autoplay: false,
                renderer: 'canvas',
                size: 'calc(min(90vw, 90vh))',  // Larger for dramatic effect
                position: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
                opacity: 0.6,
                triggerOnScroll: true,
                blendMode: 'add',
                zIndex: 2,  // Behind main logo (26)
                displayDuration: 5000,  // Show for 5 seconds
                displayInterval: 60000  // Every 60 seconds
            },
            planetLogo: {
                path: '/animations/lottie/Planet-Logo.lottie',
                loop: true,
                autoplay: false,  // Don't autoplay initially
                renderer: 'svg',
                size: 'calc(min(75vw, 75vh))',  // Bigger - 75% of viewport
                position: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
                opacity: 0.5,  // More visible
                triggerOnScroll: false,
                blendMode: 'screen',  // Better color blending
                zIndex: 4,  // Behind main logo (26)
                displayDuration: 12000,  // Show for 12 seconds
                displayInterval: 25000  // Every 25 seconds - more frequent
            }
        };

        // Store JSON data locally for better performance
        this.animationData = {
            planetRing: null,
            sunReveal: null,
            planetLogo: null
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
            this.initSunReveal();
            this.initPlanetLogo();

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
            z-index: 10;  /* Lower than main logo (26) */
        `;
        document.body.appendChild(mainContainer);

        // Create individual animation containers with dotlottie-player elements
        ['planetRing', 'sunReveal', 'planetLogo'].forEach(name => {
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
                transition: opacity 0.5s ease-in-out;
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
                player.setAttribute('speed', '2');
                wrapper.style.opacity = '0.5';  // Brighten on hover
                wrapper.style.filter = 'brightness(1.3)';
            } else {
                player.setAttribute('speed', '1');
                wrapper.style.opacity = this.config.planetRing.opacity.toString();
                wrapper.style.filter = 'brightness(1)';
            }
        });
    }

    initSunReveal() {
        if (!this.containers.sunReveal) return;

        const wrapper = this.containers.sunReveal.parentElement;
        this.animations.sunReveal = this.containers.sunReveal;

        // Don't autoplay initially
        this.containers.sunReveal.removeAttribute('autoplay');

        // Trigger on matrix message or special events
        window.addEventListener('matrixMessageStart', () => {
            this.playSunReveal();
        });
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

        // Planet Logo - shows more frequently with enhanced visuals
        setTimeout(() => {
            this.showAnimation('planetLogo');
            setInterval(() => {
                this.showAnimation('planetLogo');
            }, this.config.planetLogo.displayInterval);
        }, 3000); // Start after 3 seconds - sooner

        // Planet Ring - shows every 45 seconds
        setTimeout(() => {
            this.showAnimation('planetRing');
            setInterval(() => {
                this.showAnimation('planetRing');
            }, this.config.planetRing.displayInterval);
        }, 18000); // Start after 18 seconds

        // Sun Reveal is triggered by events, not cycle
    }

    showAnimation(name) {
        const animation = this.animations[name];
        const config = this.config[name];
        if (!animation || !animation.parentElement) return;

        const wrapper = animation.parentElement;

        // Fade in with enhanced effects for planet-logo
        wrapper.style.transition = 'opacity 0.5s ease-in-out, filter 0.5s ease-in-out';
        wrapper.style.opacity = config.opacity.toString();

        // Special enhancement for planet-logo
        if (name === 'planetLogo') {
            // Use drop-shadow for circular glow that follows the content shape
            wrapper.style.filter = 'saturate(1.8) brightness(1.3) contrast(1.2) hue-rotate(10deg) drop-shadow(0 0 30px rgba(0, 255, 200, 0.6))';
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
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            const scrollDelta = currentScrollY - lastScrollY;

            // Rotation effect on scroll for all animations with different speeds
            const rotationSpeeds = {
                planetRing: 0.05,
                sunReveal: 0.02,
                planetLogo: -0.08  // Negative for opposite direction
            };

            Object.keys(this.containers).forEach(name => {
                const wrapper = this.containers[name]?.parentElement;
                if (wrapper) {
                    // Different rotation speeds for variety
                    const rotation = (currentScrollY * (rotationSpeeds[name] || 0.1)) % 360;
                    wrapper.style.transform =
                        `${this.config[name].position.transform || ''} rotate(${rotation}deg)`;
                }
            });

            // Trigger sun reveal at certain scroll point
            if (this.config.sunReveal.triggerOnScroll && currentScrollY > 500 && !this.sunRevealTriggered) {
                this.playSunReveal();
                this.sunRevealTriggered = true;
            }

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
                    // Trigger sun reveal during matrix
                    if (Math.random() > 0.5) {
                        this.playSunReveal();
                    }
                    break;
            }
        });
    }

    playSunReveal() {
        if (!this.animations.sunReveal) return;

        const wrapper = this.animations.sunReveal.parentElement;
        wrapper.style.opacity = this.config.sunReveal.opacity;
        this.animations.sunReveal.play();

        // Create glow effect
        this.createGlowEffect(wrapper);

        // Hide after animation completes
        setTimeout(() => {
            wrapper.style.opacity = '0';
            this.animations.sunReveal.stop();
        }, this.config.sunReveal.displayDuration);
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
                rgba(255, 255, 255, 0.8) 0%,
                rgba(255, 200, 0, 0.6) 30%,
                rgba(255, 100, 0, 0.4) 60%,
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