// Lottie Animations Module - Cosmic visual effects system
import intervalManager from './interval-manager.js';
import gsap from 'gsap';

// Ensure GSAP plugins are properly registered
if (typeof window !== 'undefined') {
    // Register background animation category if not already done
    if (!gsap._3886_bgCategoryRegistered) {
        // Add support for background animation category
        gsap.registerEffect = gsap.registerEffect || (() => {});
        gsap._3886_bgCategoryRegistered = true;
        console.log('🔧 GSAP background animation support registered');
    }
}

class LottieAnimations {
    constructor() {
        // Use Maps for better performance and management
        this.animations = new Map();
        this.containers = new Map();
        this.animationInstances = new Map(); // Track actual dotlottie-player instances
        
        this.isInitialized = false;
        this.activeIntervals = []; // Track managed interval handles for cleanup
        
        // Track fade/display timers and visibility per animation to prevent overlaps
        this.displayTimers = new Map();
        this.fadeOutTimers = new Map();
        this.visibleStates = new Map();
        
        // Intersection Observer for deferred loading
        this.intersectionObserver = null;
        this.pendingAnimations = new Set();
        
        // Cache for animation JSON data
        this.animationDataCache = new Map();
        
        // Quality and performance settings
        this.performanceMode = 'high'; // high, medium, low
        this.maxConcurrentAnimations = 2; // Reduced from 3 to 2 to prevent overload
        this.currentActiveCount = 0;
        
        // Interval management with proper owner
        this.intervalOwner = 'lottie-animations';
        
        // Visibility and lifecycle management
        this.isPageVisible = !document.hidden;
        this.isContainerVisible = true;
        
        // Bind methods for event listeners
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.handleIntersection = this.handleIntersection.bind(this);

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

        // Animation names for easier iteration
        this.animationNames = [
            'planetRing', 'planetLogo', 'abstraction', 'morphingParticle', 
            'sacredGeometry', 'transparentDiamond', 'circuitRound', 
            'geometricalLines', 'circularDots'
        ];
        
        // Initialize Maps with animation names
        this.animationNames.forEach(name => {
            this.animations.set(name, null);
            this.containers.set(name, null);
            this.animationInstances.set(name, null);
            this.displayTimers.set(name, null);
            this.fadeOutTimers.set(name, null);
            this.visibleStates.set(name, false);
        });
    }

    async init() {
        // Prevent DOM bloat on re-initialization
        if (this.isInitialized) {
            console.warn('⚠️ LottieAnimations.init() called while already initialized — performing safe destroy to prevent DOM growth');
            try { this.destroy(); } catch (_) {}
        }
        console.log('🌟 Initializing Lottie animations...');

        try {
            // Set up visibility management
            this.setupVisibilityManagement();

            // Create containers for each animation
            this.createContainers();

            // Set up Intersection Observer for deferred loading
            this.setupIntersectionObserver();

            // Load animation data (cached)
            await this.loadAnimationData();

            // Initialize animations using the animationNames array
            this.animationNames.forEach(name => {
                this.initAnimation(name);
            });

            // Set up interaction handlers
            this.setupInteractions();

            // Start animation cycles (deferred if not visible)
            if (this.shouldAnimationsRun()) {
                this.startAnimationCycles();
            } else {
                console.log('🛑 Deferring animation cycles until container becomes visible');
                this.pendingAnimations.add('startCycles');
            }

            // Add to window for debugging
            window.lottieAnimations = this;

            this.isInitialized = true;
            console.log(`✨ Lottie animations initialized (${this.animationNames.length} animations)`);
        } catch (error) {
            console.error('Failed to initialize Lottie animations:', error);
        }
    }

    createContainers() {
        // Check if main container already exists to prevent duplication
        let mainContainer = document.querySelector('.lottie-container');
        if (mainContainer) {
            console.warn('⚠️ Main lottie container already exists, removing to prevent duplication');
            mainContainer.remove();
        }

        // Create main Lottie container
        mainContainer = document.createElement('div');
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

        // Create individual animation containers using animationNames array
        this.animationNames.forEach(name => {
            // Skip if instance already exists to prevent duplication
            if (this.containers.get(name)) {
                console.warn(`⚠️ Animation instance '${name}' already exists, skipping creation`);
                return;
            }

            const container = document.createElement('dotlottie-player');
            container.className = `lottie-${name}`;
            container.id = `lottie-${name}`;

            // Set attributes for dotlottie-player
            const config = this.config[name];
            container.setAttribute('src', config.path);
            container.setAttribute('background', 'transparent');
            container.setAttribute('speed', '1');
            container.setAttribute('style', `width: 100%; height: 100%;`);

            if (config.loop) {
                container.setAttribute('loop', '');
            }
            
            // Don't autoplay - we'll control this with chaos engine
            // Use canvas renderer where specified for better performance
            if (config.renderer === 'canvas') {
                container.setAttribute('renderer', 'canvas');
            }

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
                will-change: opacity, transform;
                backface-visibility: hidden;
                overflow: hidden;
            `;

            wrapperDiv.appendChild(container);
            mainContainer.appendChild(wrapperDiv);
            
            // Store in Map for better management
            this.containers.set(name, container);
            this.animationInstances.set(name, container);
        });
    }

    setupVisibilityManagement() {
        // Page visibility API
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Performance mode listeners
        window.addEventListener('performanceModeChange', (event) => {
            this.performanceMode = event.detail.mode;
            this.adjustPerformanceSettings(event.detail.mode);
        });
    }

    setupIntersectionObserver() {
        // Create intersection observer for the main container
        this.intersectionObserver = new IntersectionObserver(this.handleIntersection, {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        });

        // Observe the main container once it's created
        const mainContainer = document.querySelector('.lottie-container');
        if (mainContainer) {
            this.intersectionObserver.observe(mainContainer);
        }
    }

    handleVisibilityChange() {
        this.isPageVisible = !document.hidden;
        
        if (this.isPageVisible) {
            // Resume animations when page becomes visible
            if (this.shouldAnimationsRun()) {
                this.resumeAllAnimations();
                // Process any pending animations
                this.processPendingAnimations();
            }
        } else {
            // Pause animations when page is hidden
            this.pauseAllAnimations();
        }
    }

    // Define pause/resume methods first (called by handleIntersection)
    pauseAllAnimations() {
        this.animations.forEach((player, name) => {
            if (player && player.pause) {
                try {
                    player.pause();
                } catch (e) {
                    console.warn(`⚠️ Error pausing animation '${name}':`, e);
                }
            }
        });
        if (console.log) console.log('⏸️ All Lottie animations paused');
    }

    resumeAllAnimations() {
        this.animations.forEach((player, name) => {
            if (player && player.play && this.visibleStates.get(name)) {
                try {
                    player.play();
                } catch (e) {
                    console.warn(`⚠️ Error resuming animation '${name}':`, e);
                }
            }
        });
        if (console.log) console.log('▶️ Visible Lottie animations resumed');
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.target.classList.contains('lottie-container')) {
                this.isContainerVisible = entry.isIntersecting;
                
                if (this.isContainerVisible && this.shouldAnimationsRun()) {
                    this.processPendingAnimations();
                } else if (!this.isContainerVisible) {
                    // Optionally pause animations when container is not visible
                    this.pauseAllAnimations();
                }
            }
        });
    }

    shouldAnimationsRun() {
        return this.isPageVisible && this.isContainerVisible && this.performanceMode !== 'low';
    }

    processPendingAnimations() {
        if (this.pendingAnimations.has('startCycles')) {
            this.startAnimationCycles();
            this.pendingAnimations.delete('startCycles');
        }
    }

    adjustPerformanceSettings(mode) {
        switch (mode) {
            case 'low':
                this.maxConcurrentAnimations = 1;
                this.pauseAllAnimations();
                break;
            case 'medium':
                this.maxConcurrentAnimations = 2;
                break;
            case 'high':
            default:
                this.maxConcurrentAnimations = 3;
                if (this.shouldAnimationsRun()) {
                    this.resumeAllAnimations();
                }
                break;
        }
        console.log(`🎮 Performance mode: ${mode}, max concurrent: ${this.maxConcurrentAnimations}`);
    }

    async loadAnimationData() {
        // Use file paths directly - dotlottie-player handles loading
        // This could be enhanced to cache animation JSON data if needed
        console.log('🎯 Using .lottie files directly from disk');
        
        // Optional: Preload critical animations
        const criticalAnimations = ['planetLogo', 'planetRing'];
        criticalAnimations.forEach(name => {
            if (this.config[name]) {
                this.animationDataCache.set(name, { 
                    path: this.config[name].path,
                    loaded: false 
                });
            }
        });
    }

    // Generic animation initializer
    initAnimation(name) {
        const container = this.containers.get(name);
        const config = this.config[name];
        
        if (!container || !config) {
            console.warn(`⚠️ Cannot initialize animation '${name}': missing container or config`);
            return;
        }

        const wrapper = container.parentElement;
        this.animations.set(name, container);

        // Start hidden - will be shown by animation cycles
        wrapper.style.opacity = '0';

        // Add specific interactions based on animation type
        this.setupAnimationInteractions(name, wrapper, container);
    }

    setupAnimationInteractions(name, wrapper, container) {
        const config = this.config[name];

        switch (name) {
            case 'planetRing':
                this.setupPlanetRingInteractions(wrapper, container);
                break;
            case 'planetLogo':
                this.setupPlanetLogoInteractions(wrapper, container);
                break;
            case 'transparentDiamond':
                this.setupTransparentDiamondInteractions(wrapper, container);
                break;
            case 'circuitRound':
                this.setupCircuitRoundInteractions(wrapper, container);
                break;
            case 'geometricalLines':
                this.setupGeometricalLinesInteractions(wrapper, container);
                break;
            case 'circularDots':
                this.setupCircularDotsInteractions(wrapper, container);
                break;
            case 'sacredGeometry':
                this.setupSacredGeometryInteractions(wrapper, container);
                break;
            // Default case: no special interactions
            default:
                break;
        }
    }

    // Individual init methods removed - replaced by generic initAnimation() method
    // which uses setupAnimationInteractions() for specific behavior

    // Compute per-animation fade durations with sensible defaults
    getFadeDurations(name) {
        const defaults = { fadeInMs: 1000, fadeOutMs: 1200 };
        switch (name) {
            case 'planetLogo':
                return { fadeInMs: 1200, fadeOutMs: 1400 };
            case 'circuitRound':
                return { fadeInMs: 900, fadeOutMs: 1100 };
            case 'planetRing':
                return { fadeInMs: 1000, fadeOutMs: 1200 };
            default:
                return defaults;
        }
    }

    // Add specific interaction setup methods
    setupPlanetRingInteractions(wrapper, container) {
        wrapper.addEventListener('mousemove', (e) => {
            if (!container) return;
            const rect = wrapper.getBoundingClientRect();
            const distance = Math.sqrt(
                Math.pow(e.clientX - (rect.left + rect.width / 2), 2) +
                Math.pow(e.clientY - (rect.top + rect.height / 2), 2)
            );
            if (distance < 300) {
                container.setAttribute('speed', '1.2');
                wrapper.style.opacity = '0.15';
                wrapper.style.filter = 'brightness(1.05)';
            } else {
                container.setAttribute('speed', '1');
                wrapper.style.opacity = this.config.planetRing.opacity.toString();
                wrapper.style.filter = 'brightness(1)';
            }
        });
    }

    setupPlanetLogoInteractions(wrapper, container) {
        wrapper.style.cursor = 'pointer';
        wrapper.addEventListener('click', () => {
            this.triggerCosmicBurst();
        });
    }

    setupTransparentDiamondInteractions(wrapper, container) {
        wrapper.style.cursor = 'pointer';
        wrapper.addEventListener('click', () => {
            this.createSparkleEffect(wrapper);
        });
    }

    setupCircuitRoundInteractions(wrapper, container) {
        wrapper.addEventListener('mouseenter', () => {
            wrapper.style.transition = 'transform 1s ease-in-out';
            wrapper.style.transform = `${this.config.circuitRound.position.transform || ''} rotate(5deg)`;
        });
        wrapper.addEventListener('mouseleave', () => {
            wrapper.style.transform = this.config.circuitRound.position.transform || '';
        });
    }

    setupGeometricalLinesInteractions(wrapper, container) {
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

    setupCircularDotsInteractions(wrapper, container) {
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

    setupSacredGeometryInteractions(wrapper, container) {
        // Trigger on scroll
        window.addEventListener('scroll', () => {
            if (window.scrollY > 800 && !this.sacredGeometryTriggered) {
                this.showAnimation('sacredGeometry');
                this.sacredGeometryTriggered = true;
            }
        });
    }

    // Fade in utility with timer coordination (updated for Maps)
    fadeInAnimation(name, targetOpacity, durationMs) {
        const player = this.animations.get(name);
        if (!player || !player.parentElement) return;
        const wrapper = player.parentElement;

        // Cancel any pending fade-out to avoid fighting transitions
        const fadeOutTimer = this.fadeOutTimers.get(name);
        if (fadeOutTimer) {
            clearTimeout(fadeOutTimer);
            this.fadeOutTimers.set(name, null);
        }

        wrapper.style.transition = `opacity ${durationMs}ms ease-in-out, filter ${Math.max(600, durationMs)}ms ease-in-out`;
        wrapper.style.opacity = String(targetOpacity);

        // Subtle enhancement for planetLogo as before
        if (name === 'planetLogo') {
            wrapper.style.filter = 'saturate(1.2) brightness(1.05) contrast(1.05) drop-shadow(0 0 15px rgba(0, 255, 200, 0.15))';
        }

        this.visibleStates.set(name, true);
    }

    // Fade out utility; stops playback after the fade completes and emits end event (updated for Maps)
    fadeOutAnimation(name, durationMs) {
        const player = this.animations.get(name);
        if (!player || !player.parentElement) return;
        const wrapper = player.parentElement;

        wrapper.style.transition = `opacity ${durationMs}ms ease-in-out, filter ${Math.max(600, durationMs)}ms ease-in-out`;
        wrapper.style.opacity = '0';
        wrapper.style.filter = 'none';

        // Delay stopping playback until after fade completes
        const timer = setTimeout(() => {
            try { if (player.stop) player.stop(); } catch (e) { /* no-op */ }
            this.visibleStates.set(name, false);
            this.currentActiveCount = Math.max(0, this.currentActiveCount - 1);
            window.dispatchEvent(new CustomEvent('lottieAnimationEnd', { detail: { name } }));
        }, durationMs + 50);
        this.fadeOutTimers.set(name, timer);
    }

    startAnimationCycles() {
        console.log('🎬 Starting Lottie animation cycles');

        // Limit to 2-3 animations maximum at once
        // Stagger them more to reduce overlap

        // Planet Logo - main animation
        setTimeout(() => {
            this.showAnimation('planetLogo');
            const handle = intervalManager.createInterval(() => {
                this.showAnimation('planetLogo');
            }, this.config.planetLogo.displayInterval, 'lottie-planetLogo', {
                owner: this.intervalOwner,
                category: 'animation',
                maxAge: Infinity // Keep running until explicitly cleared
            });
            this.activeIntervals.push(handle);
        }, 15000); // Start after 15 seconds

        // Planet Ring - secondary animation
        setTimeout(() => {
            this.showAnimation('planetRing');
            const handle = intervalManager.createInterval(() => {
                this.showAnimation('planetRing');
            }, this.config.planetRing.displayInterval, 'lottie-planetRing', {
                owner: this.intervalOwner,
                category: 'animation',
                maxAge: Infinity
            });
            this.activeIntervals.push(handle);
        }, 45000); // Start after 45 seconds (increased gap)

        // Abstraction - with very low opacity
        setTimeout(() => {
            this.showAnimation('abstraction');
            const handle = intervalManager.createInterval(() => {
                this.showAnimation('abstraction');
            }, this.config.abstraction.displayInterval, 'lottie-abstraction', {
                owner: this.intervalOwner,
                category: 'animation',
                maxAge: Infinity
            });
            this.activeIntervals.push(handle);
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
            const handle = intervalManager.createInterval(() => {
                this.showAnimation('morphingParticle');
            }, this.config.morphingParticle.displayInterval * 1.5, 'lottie-morphingParticle', {
                owner: this.intervalOwner,
                category: 'animation',
                maxAge: Infinity
            });
            this.activeIntervals.push(handle);
        }, 135000); // Start after 135 seconds

        // Sacred Geometry is triggered by scroll

        // Transparent Diamond - reduced frequency
        setTimeout(() => {
            this.showAnimation('transparentDiamond');
            const handle = intervalManager.createInterval(() => {
                this.showAnimation('transparentDiamond');
            }, this.config.transparentDiamond.displayInterval * 2, 'lottie-transparentDiamond', {
                owner: this.intervalOwner,
                category: 'animation',
                maxAge: Infinity
            });
            this.activeIntervals.push(handle);
        }, 165000); // Start after 165 seconds

        // Circuit Round animation
        setTimeout(() => {
            this.showAnimation('circuitRound');
            const handle = intervalManager.createInterval(() => {
                this.showAnimation('circuitRound');
            }, this.config.circuitRound.displayInterval, 'lottie-circuitRound', {
                owner: this.intervalOwner,
                category: 'animation',
                maxAge: Infinity
            });
            this.activeIntervals.push(handle);
        }, 30000); // Start after 30 seconds

        // Geometrical Lines animation
        setTimeout(() => {
            this.showAnimation('geometricalLines');
            const handle = intervalManager.createInterval(() => {
                this.showAnimation('geometricalLines');
            }, this.config.geometricalLines.displayInterval, 'lottie-geometricalLines', {
                owner: this.intervalOwner,
                category: 'animation',
                maxAge: Infinity
            });
            this.activeIntervals.push(handle);
        }, 90000); // Start after 90 seconds

        // Circular Dots animation
        setTimeout(() => {
            this.showAnimation('circularDots');
            const handle = intervalManager.createInterval(() => {
                this.showAnimation('circularDots');
            }, this.config.circularDots.displayInterval, 'lottie-circularDots', {
                owner: this.intervalOwner,
                category: 'animation',
                maxAge: Infinity
            });
            this.activeIntervals.push(handle);
        }, 120000); // Start after 120 seconds
    }

    showAnimation(name) {
        // Check if we've reached max concurrent animations
        if (this.currentActiveCount >= this.maxConcurrentAnimations) {
            console.log(`🚦 Skipping '${name}' - max concurrent animations (${this.maxConcurrentAnimations}) reached`);
            return;
        }

        const player = this.animations.get(name);
        const config = this.config[name];
        if (!player || !player.parentElement || !config) return;

        // Check if animations should run (visibility/performance)
        if (!this.shouldAnimationsRun()) {
            console.log(`🛑 Deferring '${name}' animation - not ready to run`);
            this.pendingAnimations.add(`show-${name}`);
            return;
        }

        const wrapper = player.parentElement;

        // Notify other systems (e.g., direct-logo-animation)
        window.dispatchEvent(new CustomEvent('lottieAnimationStart', { detail: { name } }));

        // Determine fade timings
        const { fadeInMs, fadeOutMs } = this.getFadeDurations(name);

        // Cancel any pending fade-out or display timers to avoid overlaps
        const fadeOutTimer = this.fadeOutTimers.get(name);
        if (fadeOutTimer) {
            clearTimeout(fadeOutTimer);
            this.fadeOutTimers.set(name, null);
        }
        const displayTimer = this.displayTimers.get(name);
        if (displayTimer) {
            clearTimeout(displayTimer);
            this.displayTimers.set(name, null);
        }

        // Increment active count
        this.currentActiveCount++;

        // Fade in and start playback
        this.fadeInAnimation(name, config.opacity, fadeInMs);
        try { 
            if (player.play) player.play(); 
        } catch (e) { 
            console.warn(`⚠️ Error playing animation '${name}':`, e);
        }

        // Schedule fade out after the configured display duration
        const timer = setTimeout(() => {
            this.fadeOutAnimation(name, fadeOutMs);
        }, config.displayDuration);
        this.displayTimers.set(name, timer);
    }

    setupInteractions() {
        // Scroll-based triggers
        let lastScrollY = window.scrollY;
        let rotationDirections = {};  // Track rotation direction for each animation
        let rotationValues = {};  // Track current rotation values

        // Initialize rotation values using animation names array
        this.animationNames.forEach(name => {
            rotationValues[name] = 0;
            rotationDirections[name] = 1;  // 1 = forward, -1 = reverse
        });

        // Create reverse rotation scenes
        const createRotationReversal = () => {
            // Every 10-20 seconds, randomly reverse some animations
            const handle = intervalManager.createInterval(() => {
                // Randomly select 2-3 animations to reverse
                const animations = this.animationNames;
                const numToReverse = Math.floor(Math.random() * 2) + 2;

                for (let i = 0; i < numToReverse; i++) {
                    const randomAnim = animations[Math.floor(Math.random() * animations.length)];
                    rotationDirections[randomAnim] *= -1;  // Reverse direction

                    // Smooth transition when reversing
                    const container = this.containers.get(randomAnim);
                    const wrapper = container?.parentElement;
                    if (wrapper) {
                        wrapper.style.transition = 'transform 2s cubic-bezier(0.4, 0, 0.2, 1)';
                        setTimeout(() => {
                            wrapper.style.transition = '';  // Remove transition after
                        }, 2000);
                    }
                }
            }, Math.random() * 10000 + 10000, 'lottie-rotationReversal', { // 10-20 seconds
                owner: this.intervalOwner,
                category: 'animation',
                maxAge: Infinity
            });
            this.activeIntervals.push(handle);
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

            this.animationNames.forEach(name => {
                const container = this.containers.get(name);
                const wrapper = container?.parentElement;
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
                rgba(255, 255, 255, 0.4) 0%,  /* White center */
                rgba(255, 0, 255, 0.3) 20%,   /* Magenta */
                rgba(0, 255, 255, 0.3) 40%,   /* Cyan */
                rgba(0, 255, 0, 0.2) 60%,     /* Green */
                rgba(255, 255, 0, 0.2) 80%,   /* Yellow */
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


    // Legacy method names for compatibility
    pauseAll() { this.pauseAllAnimations(); }
    resumeAll() { this.resumeAllAnimations(); }

    // Public methods for integration (updated to use Maps)
    play(name) {
        const player = this.animations.get(name);
        if (player && player.play) {
            try {
                player.play();
                this.visibleStates.set(name, true);
            } catch (e) {
                console.warn(`⚠️ Error playing animation '${name}':`, e);
            }
        }
    }

    pause(name) {
        const player = this.animations.get(name);
        if (player && player.pause) {
            try {
                player.pause();
            } catch (e) {
                console.warn(`⚠️ Error pausing animation '${name}':`, e);
            }
        }
    }

    setSpeed(name, speed) {
        const player = this.animations.get(name);
        if (player) {
            try {
                player.setAttribute('speed', speed.toString());
            } catch (e) {
                console.warn(`⚠️ Error setting speed for animation '${name}':`, e);
            }
        }
    }

    // Diagnostic methods for debugging
    getActiveAnimationsCount() {
        return this.currentActiveCount;
    }

    getAnimationStatus() {
        const status = {};
        this.animations.forEach((player, name) => {
            status[name] = {
                visible: this.visibleStates.get(name) || false,
                hasDisplayTimer: !!this.displayTimers.get(name),
                hasFadeOutTimer: !!this.fadeOutTimers.get(name),
                isPlaying: player && typeof player.currentFrame !== 'undefined'
            };
        });
        return status;
    }

    destroy() {
        console.log('🧿 LottieAnimations cleanup initiated');
        
        // Clean up visibility management
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
            this.intersectionObserver = null;
        }
        
        // Clear all managed intervals
        if (this.activeIntervals && this.activeIntervals.length > 0) {
            this.activeIntervals.forEach(handle => {
                if (handle && typeof handle.clear === 'function') {
                    handle.clear();
                }
            });
            this.activeIntervals = [];
            console.log('✅ Lottie intervals cleared');
        }
        
        // Clear all timers
        this.displayTimers.forEach((timer, name) => {
            if (timer) {
                clearTimeout(timer);
                console.log(`✅ Cleared display timer for '${name}'`);
            }
        });
        this.fadeOutTimers.forEach((timer, name) => {
            if (timer) {
                clearTimeout(timer);
                console.log(`✅ Cleared fade timer for '${name}'`);
            }
        });
        
        // Stop and destroy all animations
        this.animations.forEach((player, name) => {
            if (player) {
                try {
                    if (player.stop) player.stop();
                    if (player.destroy) player.destroy();
                    console.log(`✅ Destroyed animation '${name}'`);
                } catch (e) {
                    console.warn(`⚠️ Error destroying animation '${name}':`, e);
                }
            }
        });

        // Remove containers from DOM
        const mainContainer = document.querySelector('.lottie-container');
        if (mainContainer) {
            mainContainer.remove();
            console.log('✅ Main container removed from DOM');
        }
        
        // Reset all state using Maps
        this.isInitialized = false;
        this.animations.clear();
        this.containers.clear();
        this.animationInstances.clear();
        this.displayTimers.clear();
        this.fadeOutTimers.clear();
        this.visibleStates.clear();
        this.pendingAnimations.clear();
        this.animationDataCache.clear();
        this.currentActiveCount = 0;
        
        // Remove from window debug object
        if (window.lottieAnimations === this) {
            delete window.lottieAnimations;
        }
        
        console.log('✅ LottieAnimations cleanup complete');
    }
}

export default new LottieAnimations();