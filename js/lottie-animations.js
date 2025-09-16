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
                zIndex: 101
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
                zIndex: 103
            },
            planetLogo: {
                path: '/animations/lottie/Planet-Logo.lottie',
                loop: true,
                autoplay: true,
                renderer: 'svg',
                size: 'calc(min(60vw, 60vh))',  // Smaller inner circle
                position: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
                opacity: 0.2,
                triggerOnScroll: false,
                blendMode: 'overlay',
                zIndex: 102
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
            z-index: 100;
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
            if (this.config[name].autoplay) {
                container.setAttribute('autoplay', '');
            }

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
                z-index: ${config.zIndex || 100};
                width: ${config.size};
                height: ${config.size};
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

        // Fade in the container
        setTimeout(() => {
            wrapper.style.opacity = this.config.planetRing.opacity;
        }, 100);

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

        // Fade in
        setTimeout(() => {
            wrapper.style.opacity = this.config.planetLogo.opacity;
        }, 500);

        // Click interaction
        wrapper.style.cursor = 'pointer';
        wrapper.addEventListener('click', () => {
            this.triggerCosmicBurst();
        });
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
    }

    playSunReveal() {
        if (!this.animations.sunReveal) return;

        const wrapper = this.animations.sunReveal.parentElement;
        wrapper.style.opacity = this.config.sunReveal.opacity;
        this.animations.sunReveal.play();

        // Create glow effect
        this.createGlowEffect(wrapper);

        // Hide after animation completes
        this.animations.sunReveal.addEventListener('complete', () => {
            setTimeout(() => {
                wrapper.style.opacity = '0';
            }, 1000);
        });
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