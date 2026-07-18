// Lottie Animations Module - Cosmic visual effects system
import animationRuntime from './runtime/animation-runtime.js';
import { createManagedLottieCanvas } from './lottie-player-factory.js';

const RUNTIME_OWNER = 'lottie-animations';

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
        this.scheduledTasks = new Map();
        this.schedulerToken = null;
        // Track fade/display timers and visibility per animation to prevent overlaps
        this.displayTimers = {};
        this.fadeOutTimers = {};
        this.visibleStates = {};
        this.startupTimers = [];
        this.playerReadyStates = {};
        this.pendingAnimations = [];
        this.eventController = null;
        this.maxVisibleByProfile = {
            high: 2,
            medium: 1,
            low: 1
        };

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
                cycleDurationMs: 5030,
                minCycles: 3,
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
                cycleDurationMs: 2500,
                minCycles: 6,
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
                cycleDurationMs: 9580,
                minCycles: 2,
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
                cycleDurationMs: 3000,
                minCycles: 5,
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
                cycleDurationMs: 4000,
                minCycles: 4,
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
                cycleDurationMs: 1000,
                minCycles: 12,
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
                cycleDurationMs: 2040,
                minCycles: 7,
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
                cycleDurationMs: 75000,
                minCycles: 1,
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
                cycleDurationMs: 2530,
                minCycles: 5,
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
        // Prevent DOM bloat on re-initialization
        if (this.isInitialized) {
            console.warn('⚠️ LottieAnimations already initialized, skipping duplicate initialization');
            return; // Don't destroy and re-create, just skip
        }
        animationRuntime.disposeOwner(RUNTIME_OWNER);
        this.eventController?.abort();
        this.eventController = new AbortController();
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
        animationRuntime.trackNode(RUNTIME_OWNER, mainContainer);

        // Create lightweight canvas shells. The local player is loaded lazily
        // only when the clip wins an admission slot.
        ['planetRing', 'planetLogo', 'abstraction', 'morphingParticle', 'sacredGeometry', 'transparentDiamond', 'circuitRound', 'geometricalLines', 'circularDots'].forEach(name => {
            const config = this.config[name];
            const container = createManagedLottieCanvas({
                src: config.path,
                loop: config.loop,
                speed: 1,
                profile: this.getPerformanceProfile()
            });
            container.className = `lottie-${name}`;
            container.id = `lottie-${name}`;
            container.setAttribute('speed', '1');
            // Don't autoplay - we'll control this with chaos engine
            this.playerReadyStates[name] = false;
            ['ready', 'load', 'loaded', 'complete'].forEach(eventName => {
                container.addEventListener(eventName, () => {
                    this.playerReadyStates[name] = true;
                }, { signal: this.eventController.signal });
            });
            
            // Add error handler to suppress console spam for missing files
            container.addEventListener('error', (e) => {
                // Silently handle missing Lottie files - they're optional resources
                const wrapper = container.parentElement;
                if (wrapper) {
                    wrapper.style.display = 'none';
                }
            }, { once: true, signal: this.eventController.signal });

            const wrapperDiv = document.createElement('div');
            wrapperDiv.className = `lottie-wrapper-${name}`;
            wrapperDiv.style.cssText = `
                position: absolute;
                ${Object.entries(config.position).map(([key, value]) => `${key}: ${value}`).join('; ')};
                opacity: 0;
                display: none;
                transition: opacity 1.5s ease-in-out;  /* Smoother, slower transitions */
                mix-blend-mode: ${this.getPerformanceProfile() === 'low' || window.chaosEngine?.softwareRenderer ? 'normal' : config.blendMode};
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
        }, { signal: this.eventController.signal });
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
        }, { signal: this.eventController.signal });
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
        }, { signal: this.eventController.signal });
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
        }, { signal: this.eventController.signal });
        wrapper.addEventListener('mouseleave', () => {
            wrapper.style.transform = this.config.circuitRound.position.transform || '';
        }, { signal: this.eventController.signal });
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
        }, { signal: this.eventController.signal });
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
            this.scheduleTimeout(() => {
                wrapper.style.animation = '';
            }, 1000);
        }, { signal: this.eventController.signal });

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
        }, { signal: this.eventController.signal });
    }

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

    scheduleTimeout(callback, delay) {
        return animationRuntime.scheduleTimeout(RUNTIME_OWNER, callback, delay);
    }

    clearTimer(timer) {
        timer?.clear?.();
    }

    getDisplayDuration(name) {
        const config = this.config[name] || {};
        const cycleDurationMs = Math.max(0, Number(config.cycleDurationMs) || 0);
        const minCycles = Math.max(1, Number(config.minCycles) || 1);
        return Math.max(12000, cycleDurationMs * minCycles, Number(config.displayDuration) || 0);
    }

    queueAnimation(name) {
        if (!this.config[name] || this.pendingAnimations.includes(name)) return;
        if (this.pendingAnimations.length >= Object.keys(this.config).length) return;
        this.pendingAnimations.push(name);
    }

    drainAnimationQueue() {
        while (this.pendingAnimations.length && this.getVisibleAnimationNames().length < this.getMaxVisibleAnimations()) {
            const name = this.pendingAnimations.shift();
            this.showAnimation(name, { fromQueue: true });
        }
    }

    // Fade in utility with timer coordination
    fadeInAnimation(name, targetOpacity, durationMs) {
        const player = this.animations[name];
        if (!player || !player.parentElement) return;
        const wrapper = player.parentElement;

        if (this.fadeOutTimers[name]) {
            this.clearTimer(this.fadeOutTimers[name]);
            this.fadeOutTimers[name] = null;
        }

        // Opacity-zero canvas trees can remain large compositor surfaces. Keep
        // dormant clips out of layout/compositing, then mount only the admitted
        // clip. The forced read happens once per presentation, not per frame.
        wrapper.style.display = 'block';
        wrapper.style.opacity = '0';
        void wrapper.offsetWidth;
        wrapper.style.transition = `opacity ${durationMs}ms ease-in-out, filter ${Math.max(600, durationMs)}ms ease-in-out`;
        wrapper.style.opacity = String(targetOpacity);

        wrapper.style.filter = this.getWrapperFilter(name);

        this.visibleStates[name] = true;
    }

    // Fade out utility; stops playback after the fade completes and emits end event
    fadeOutAnimation(name, durationMs) {
        const player = this.animations[name];
        if (!player || !player.parentElement || !this.visibleStates[name]) return;
        const wrapper = player.parentElement;

        wrapper.style.transition = `opacity ${durationMs}ms ease-in-out, filter ${Math.max(600, durationMs)}ms ease-in-out`;
        wrapper.style.opacity = '0';
        wrapper.style.filter = 'none';

        this.fadeOutTimers[name] = this.scheduleTimeout(() => {
            try { this.safeStopPlayer(name, player); } catch (_) {}
            wrapper.style.display = 'none';
            this.visibleStates[name] = false;
            this.fadeOutTimers[name] = null;
            this.displayTimers[name] = null;
            window.dispatchEvent(new CustomEvent('lottieAnimationEnd', { detail: { name } }));
            this.drainAnimationQueue();
        }, durationMs + 50);
    }

    safeStopPlayer(name, player = this.animations[name]) {
        if (!player) return;
        if (player.dataset?.lottieManaged === 'true') {
            try { player.pause?.(); } catch (_) {}
            return;
        }
        if (String(player.tagName || '').toLowerCase() === 'dotlottie-player') {
            try {
                if (typeof player.pause === 'function') player.pause();
            } catch (_) {}
            return;
        }

        const state = String(player.currentState || player.state || '').toLowerCase();
        const ready = this.playerReadyStates[name] === true ||
            (state && state !== 'loading' && state !== 'idle');

        try {
            if (ready && typeof player.stop === 'function') player.stop();
            else if (typeof player.pause === 'function') player.pause();
        } catch (_) {}
    }

    getWrapperFilter(name) {
        if (name !== 'planetLogo') return 'none';
        const lowCost = this.performanceProfile === 'low' || window.chaosEngine?.softwareRenderer;
        if (lowCost) return 'none';
        if (this.performanceProfile === 'medium') return 'saturate(1.1) brightness(1.025)';
        return 'saturate(1.2) brightness(1.05) contrast(1.05) drop-shadow(0 0 15px rgba(0, 255, 200, 0.15))';
    }

    scheduleLottieCycle(name, initialDelayMs, intervalMs = this.config[name]?.displayInterval) {
        if (!this.config[name] || !this.animations[name]) return;
        this.registerScheduledTask(`cycle:${name}`, initialDelayMs, intervalMs, () => {
            this.showAnimation(name);
        });
    }

    registerScheduledTask(id, initialDelayMs, intervalMs, callback) {
        this.scheduledTasks.set(id, {
            dueAt: performance.now() + Math.max(0, initialDelayMs),
            intervalMs,
            callback
        });
        this.ensureSchedulerLoop();
    }

    ensureSchedulerLoop() {
        if (this.schedulerToken) return;
        this.schedulerToken = animationRuntime.scheduleInterval(RUNTIME_OWNER, () => {
            const now = performance.now();
            this.scheduledTasks.forEach((task) => {
                if (now < task.dueAt) return;
                try { task.callback(); } catch (error) {
                    console.error('Lottie scheduler task failed:', error);
                }
                const nextDelay = typeof task.intervalMs === 'function'
                    ? task.intervalMs()
                    : task.intervalMs;
                task.dueAt = now + Math.max(1000, Number(nextDelay) || 1000);
            });
        }, 1000);
    }

    startAnimationCycles() {
        console.log('🎬 Starting Lottie animation cycles');

        this.scheduleLottieCycle('planetLogo', 12000);
        this.scheduleLottieCycle('circuitRound', 24000);
        this.scheduleLottieCycle('planetRing', 36000);
        this.scheduleLottieCycle('abstraction', 48000);
        this.scheduleLottieCycle('transparentDiamond', 56000, this.config.transparentDiamond.displayInterval * 1.4);
        this.scheduleLottieCycle('morphingParticle', 64000, this.config.morphingParticle.displayInterval * 1.3);
        this.scheduleLottieCycle('geometricalLines', 72000);
        this.scheduleLottieCycle('circularDots', 82000);
        this.scheduleLottieCycle('sacredGeometry', 92000);
    }

    showAnimation(name, options = {}) {
        const player = this.animations[name];
        const config = this.config[name];
        if (!player || !player.parentElement) return false;
        if (this.visibleStates[name]) return true;

        if (!this.canShowAnimation(name)) {
            if (!options.fromQueue) this.queueAnimation(name);
            return false;
        }

        window.dispatchEvent(new CustomEvent('lottieAnimationStart', { detail: { name } }));
        const { fadeInMs, fadeOutMs } = this.getFadeDurations(name);

        if (this.fadeOutTimers[name]) {
            this.clearTimer(this.fadeOutTimers[name]);
            this.fadeOutTimers[name] = null;
        }
        if (this.displayTimers[name]) {
            this.clearTimer(this.displayTimers[name]);
            this.displayTimers[name] = null;
        }

        this.fadeInAnimation(name, config.opacity, fadeInMs);
        try { if (player.play) player.play(); } catch (_) {}

        // Profiles control admission and rendering cost, never clip lifetime.
        // The fade starts only after complete source cycles were visible.
        this.displayTimers[name] = this.scheduleTimeout(() => {
            this.fadeOutAnimation(name, fadeOutMs);
        }, fadeInMs + this.getDisplayDuration(name));
        return true;
    }

    getPerformanceProfile() {
        return window.performanceProfile ||
            window.performanceProfileManager?.currentProfile ||
            'high';
    }

    getMaxVisibleAnimations() {
        const profile = this.getPerformanceProfile();
        return this.maxVisibleByProfile[profile] ?? this.maxVisibleByProfile.high;
    }

    getVisibleAnimationNames() {
        return Object.keys(this.visibleStates).filter(name => this.visibleStates[name]);
    }

    canShowAnimation(name) {
        if (this.visibleStates[name]) return true;
        return this.getVisibleAnimationNames().length < this.getMaxVisibleAnimations();
    }

    enforceConcurrencyLimit() {
        // A lower profile applies to future admission. Existing clips retain
        // their visual contract and drain naturally.
        this.drainAnimationQueue();
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
            this.registerScheduledTask('rotation-reversal', Math.random() * 10000 + 10000, () => {
                return Math.random() * 10000 + 10000;
            }, () => {
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
                        this.scheduleTimeout(() => {
                            wrapper.style.transition = '';  // Remove transition after
                        }, 2000);
                    }
                }
            });
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
        }, { signal: this.eventController.signal });

        // Performance mode integration
        window.addEventListener('performanceModeChange', (event) => {
            const mode = event.detail.mode;
            this.setPerformanceProfile(mode);
        }, { signal: this.eventController.signal });

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
        }, { signal: this.eventController.signal });
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
        this.scheduleTimeout(() => sparkle.remove(), 800);
    }

    triggerCosmicBurst(scope = null) {
        console.log('🌌 Cosmic burst triggered!');

        // Create burst effect
        const burst = document.createElement('div');
        burst.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            width: 180px;
            height: 180px;
            background: radial-gradient(circle,
                rgba(255, 255, 255, 0.4) 0%,  /* White center */
                rgba(255, 0, 255, 0.3) 20%,   /* Magenta */
                rgba(0, 255, 255, 0.3) 40%,   /* Cyan */
                rgba(0, 255, 0, 0.2) 60%,     /* Green */
                rgba(255, 255, 0, 0.2) 80%,   /* Yellow */
                transparent 100%);
            border-radius: 50%;
            transform: translate(-50%, -50%) scale(0.45);
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
                        transform: translate(-50%, -50%) scale(0.45);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(12);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        if (scope?.append) scope.append(burst);
        else document.body.appendChild(burst);
        if (scope?.timeout) scope.timeout(() => burst.remove(), 1000);
        else this.scheduleTimeout(() => burst.remove(), 1000);

        // Speed up all animations temporarily
        const previousSpeeds = new Map();
        Object.values(this.animations).forEach(player => {
            if (player) {
                previousSpeeds.set(player, player.getAttribute('speed') || '1');
                player.setAttribute('speed', '3');
            }
        });
        const restoreSpeeds = () => {
            previousSpeeds.forEach((speed, player) => {
                try { player.setAttribute('speed', speed); } catch (_) {}
            });
        };
        if (scope?.cleanup) scope.cleanup(restoreSpeeds);
        else this.scheduleTimeout(restoreSpeeds, 2000);
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
        this.scheduleTimeout(() => glow.remove(), 5000);
    }

    setPerformanceProfile(profile) {
        this.performanceProfile = ['high', 'medium', 'low'].includes(profile) ? profile : 'high';
        const lowCostCompositor = this.performanceProfile === 'low' || window.chaosEngine?.softwareRenderer;
        Object.entries(this.animations).forEach(([name, player]) => {
            try { player?.setPerformanceProfile?.(this.performanceProfile); } catch (_) {}
            const wrapper = player?.parentElement;
            if (wrapper) {
                wrapper.style.mixBlendMode = lowCostCompositor ? 'normal' : (this.config[name]?.blendMode || 'normal');
                if (this.visibleStates[name]) wrapper.style.filter = this.getWrapperFilter(name);
            }
        });
        // Profile changes adjust admission limits only. Players already on
        // screen keep running at authored speed until their complete-cycle
        // contract ends.
        this.resumeAll();
        this.enforceConcurrencyLimit();
    }

    pauseAll() {
        Object.entries(this.animations).forEach(([name, player]) => {
            if (player && player.pause) {
                try { player.pause(); } catch (_) {}
            }
            if (this.visibleStates[name]) {
                this.fadeOutAnimation(name, 300);
            }
        });
    }

    resumeAll() {
        Object.entries(this.animations).forEach(([name, player]) => {
            if (this.visibleStates[name] && player && player.play) {
                try { player.play(); } catch (_) {}
            }
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
        console.log('🧿 LottieAnimations cleanup initiated');
        
        // Clear all managed intervals
        if (this.startupTimers && this.startupTimers.length > 0) {
            this.startupTimers.forEach(timer => this.clearTimer(timer));
            this.startupTimers = [];
        }

        Object.values(this.displayTimers).forEach(timer => this.clearTimer(timer));
        Object.values(this.fadeOutTimers).forEach(timer => this.clearTimer(timer));
        this.displayTimers = {};
        this.fadeOutTimers = {};
        this.pendingAnimations = [];

        this.scheduledTasks.clear();
        this.schedulerToken = null;
        
        this.eventController?.abort();
        this.eventController = null;
        animationRuntime.disposeOwner(RUNTIME_OWNER);

        // Stop and destroy all animations
        Object.values(this.animations).forEach(player => {
            if (player) {
                try {
                    const name = Object.keys(this.animations).find(key => this.animations[key] === player);
                    this.safeStopPlayer(name, player);
                    if (player.destroy) player.destroy();
                } catch (e) {
                    // Ignore errors during cleanup
                }
            }
        });

        // Remove containers
        const mainContainer = document.querySelector('.lottie-container');
        if (mainContainer) mainContainer.remove();
        
        // Reset state
        this.isInitialized = false;
        this.animations = {};
        this.containers = {};
        
        console.log('✅ LottieAnimations cleanup complete');
    }
}

export default new LottieAnimations();
