// Professional Animation Manager for ZIKADA 3886
// Handles all animation triggers with proper state management and cleanup

// NOTE: Import-safe: no DOM access or instantiation at import time. Use initAnimationManager() or
// rely on the DOMContentLoaded bootstrap below (browser-only) to create the singleton.

import animationRuntime from './runtime/animation-runtime.js';

const MANAGER_RUNTIME_OWNER = 'animation-manager';
const MUTATED_STYLE_PROPERTIES = [
    'transform',
    'transition',
    'opacity',
    'filter',
    'animation',
    'animation-delay',
    'transform-style',
    'perspective'
];

class AnimationManager {
    constructor() {
        this.activeAnimations = new Map();
        this.animationQueue = [];
        this.isProcessingQueue = false;
        this.elementStates = new WeakMap();
        this.animationDefaults = new Map();
        this.maxQueueSize = 12;
        this.maxActiveAnimations = 4;
        this.defaultMaxQueueSize = this.maxQueueSize;
        this.defaultMaxActiveAnimations = this.maxActiveAnimations;
        this.generation = 0;
        this.destroyed = false;
        this.paused = false;
        this.safeMode = false;

        // Animation configurations
        this.animations = {
            'logo-pulse': {
                target: '.anime-logo-container svg, .image-2',
                fallbackTarget: null, // Don't fallback if logo elements not found
                type: 'scale',
                duration: 600,
                easing: 'easeOutElastic',
                scale: 1.2,
                repeat: 1,
                yoyo: true,
                cleanup: true
            },
'logo-spin': {
                target: '.anime-logo-container svg, .image-2',
                type: 'rotation',
                duration: 1000,
                easing: 'easeInOutCubic',
                rotation: 360,
                cleanup: true,
                resetAfter: true
            },
'logo-glow': {
                target: '.anime-logo-container svg, .image-2',
                type: 'filter',
                duration: 1000,
                filter: 'drop-shadow(0 0 30px #00ff41) drop-shadow(0 0 60px #00ff41)',
                cleanup: true
            },
'matrix-flash': {
                target: '.matrix-rain, .chaos-matrix, #data-streams-overlay, .data-streams',
                fallbackTarget: null, // Don't fallback to body for matrix effects
                type: 'opacity',
                duration: 200,
                opacitySequence: [1, 0, 1, 0, 1],
                cleanup: true
            },
'matrix-rain': {
                target: '.matrix-rain, .chaos-matrix, #data-streams-overlay, .data-streams',
                fallbackTarget: null, // Don't fallback to body for matrix effects
                type: 'composite',
                duration: 2000,
                effects: ['opacity', 'scale'],
                opacity: [1, 0.5, 1],
                scale: [1, 1.1, 1],
                cleanup: true
            },
'matrix-glitch': {
                target: '.matrix-rain, .chaos-matrix, #data-streams-overlay, .data-streams',
                fallbackTarget: null, // Don't fallback to body for matrix effects
                type: 'glitch',
                duration: 1000,
                cleanup: true
            },
            'bg-warp': {
                target: 'body',
                type: 'perspective',
                duration: 2000,
                perspective: 800,
                rotateY: 5,
                cleanup: true,
                resetAfter: true
            },
            'bg-shake': {
                target: 'body',
                type: 'shake',
                duration: 500,
                intensity: 10,
                cleanup: true,
                resetAfter: true,
                preserveTransform: true
            },
            'bg-zoom': {
                target: 'body',
                type: 'zoom',
                duration: 1000,
                scale: 1.3,
                cleanup: true,
                resetAfter: true,
                preserveTransform: true
            },
'text-scramble': {
                target: '.text-26, .text-25, .text-3886, .logo-text, h1, h2, h3',
                type: 'scramble',
                duration: 2000,
                cleanup: false
            },
            'text-wave': {
                target: '.text-26, .text-25, .text-3886',
                type: 'wave',
                duration: 2000,
                amplitude: 20,
                cleanup: true
            },
            'full-chaos': {
                type: 'sequence',
                animations: ['logo-pulse', 'matrix-flash', 'bg-shake', 'text-scramble'],
                stagger: 200
            }
        };

        this.init();
    }

    init() {
        // Store initial states of elements
        this.captureInitialStates();

        // Setup animation frame for smooth animations
        this.setupAnimationFrame();

        console.log('🎬 Professional Animation Manager initialized');
    }

    captureInitialStates() {
        // Capture initial transform states for all potential targets
        const targets = [
            'body',
            '.image-2',
            '.matrix-rain',
            '.chaos-matrix',
            '.text-26',
            '.text-25'
        ];

        targets.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (!this.elementStates.has(el)) {
                    const computedStyle = window.getComputedStyle(el);
                    this.elementStates.set(el, {
                        transform: computedStyle.transform || 'none',
                        opacity: computedStyle.opacity || '1',
                        filter: computedStyle.filter || 'none',
                        position: {
                            x: el.offsetLeft,
                            y: el.offsetTop
                        }
                    });
                }
            });
        });
    }

    setupAnimationFrame() {
        this.frameId = null;
        this.lastFrameTime = performance.now();
    }

    async ensureElementsExist(animationId, config, instance) {
        // For matrix animations, ensure matrix overlays exist
        if (animationId.includes('matrix')) {
            await this.ensureMatrixOverlays(instance);
        }
        
        // For logo animations, ensure logo container exists
        if (animationId.includes('logo')) {
            this.ensureLogoContainer();
        }
        
        // For background animations, ensure background element exists
        if (animationId.includes('bg-')) {
            this.ensureBackgroundElement();
        }
    }

    ensureMatrixOverlays(instance) {
        return new Promise((resolve) => {
            // Check if matrix overlays already exist
            let matrixRain = document.querySelector('.matrix-rain');
            let chaosMatrix = document.querySelector('.chaos-matrix');
            let dataStreams = document.querySelector('.data-streams');
            
            if (matrixRain || chaosMatrix || dataStreams) {
                resolve();
                return;
            }
            
            console.log('🌧️ Creating matrix overlay for animation');
            
            // Create a visible matrix-style overlay
            const overlay = document.createElement('div');
            overlay.className = 'chaos-matrix';
            overlay.id = 'chaos-matrix-temp';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 100;
                background: linear-gradient(180deg,
                    rgba(0, 255, 65, 0.1) 0%,
                    rgba(0, 255, 65, 0.05) 50%,
                    rgba(0, 255, 65, 0.1) 100%);
                opacity: 0;
                transition: opacity 0.3s ease;
            `;

            // REMOVED: Centered "MATRIX" text (user requested removal)
            // Keeping just the green gradient overlay for ambiance
            
            document.body.appendChild(overlay);
            animationRuntime.trackNode(instance.owner, overlay);
            
            // Mark as temporary for cleanup
            overlay.setAttribute('data-temporary', 'true');
            
            // Fade in
            animationRuntime.scheduleTimeout(instance.owner, () => {
                overlay.style.opacity = '1';
            }, 10);
            
            // Small delay to ensure DOM is updated
            this.delay(100, instance).then(resolve);
        });
    }

    ensureLogoContainer() {
        // Check if logo elements exist
        let logoContainer = document.querySelector('.anime-logo-container');
        let logoImage = document.querySelector('.image-2');
        
        if (logoContainer || logoImage) {
            return; // Elements already exist
        }
        
        // If neither exists, we can't create them as they're part of the page structure
        // But we can log a helpful message
        console.warn('⚠️ Logo elements not found - logo animations require the main logo to be present');
    }

    ensureBackgroundElement() {
        let bgElement = document.querySelector('.bg');
        
        if (bgElement) {
            return; // Element already exists
        }
        
        // Background element is part of the page structure, can't be created dynamically
        console.warn('⚠️ Background element not found - background animations require .bg element');
    }

    trigger(animationId, options = {}) {
        console.log(`🎭 Triggering animation: ${animationId}`);

        if (this.destroyed) {
            return Promise.resolve(false);
        }

        // Check if animation exists
        const config = this.animations[animationId];
        if (!config) {
            console.warn(`Animation ${animationId} not found`);
            return Promise.resolve(false);
        }

        // A paused manager remains receptive but never starts new work. This
        // keeps operator intent ordered without leaving orphaned timers.
        if (this.paused) {
            return this.queueAnimation(animationId, options);
        }

        // Handle sequence animations
        if (config.type === 'sequence') {
            return this.triggerSequence(config, options);
        }

        // Bound concurrency even when animations target different surfaces.
        if (this.isTargetBusy(config.target) || this.activeAnimations.size >= this.maxActiveAnimations) {
            return this.queueAnimation(animationId, options);
        }

        // Execute animation
        return this.executeAnimation(animationId, config, options);
    }

    isTargetBusy(targetSelector) {
        if (!targetSelector) return false;

        for (const [id, animation] of this.activeAnimations) {
            if (animation.target === targetSelector && !animation.completed) {
                return true;
            }
        }
        return false;
    }

    queueAnimation(animationId, options) {
        return new Promise((resolve) => {
            const config = this.animations[animationId];
            const duplicateIndex = this.animationQueue.findIndex(item =>
                item.animationId === animationId || this.animations[item.animationId]?.target === config?.target
            );
            if (duplicateIndex >= 0) {
                const [replaced] = this.animationQueue.splice(duplicateIndex, 1);
                replaced.resolve(false);
            }
            if (this.animationQueue.length >= this.maxQueueSize) {
                const dropped = this.animationQueue.shift();
                dropped?.resolve(false);
            }
            this.animationQueue.push({ animationId, options, resolve });
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.isProcessingQueue || this.animationQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;
        const generation = this.generation;

        while (this.animationQueue.length > 0 && generation === this.generation && !this.destroyed && !this.paused) {
            const { animationId, options, resolve } = this.animationQueue.shift();
            const config = this.animations[animationId];

            if (config && !this.isTargetBusy(config.target) && this.activeAnimations.size < this.maxActiveAnimations) {
                const result = await this.executeAnimation(animationId, config, options);
                resolve(result);
            } else {
                // Put it back and wait
                this.animationQueue.unshift({ animationId, options, resolve });
                const continued = await this.delay(50);
                if (!continued) break;
            }
        }

        this.isProcessingQueue = false;
    }

    pauseAll() {
        this.paused = true;
        try { window.animeManager?.pauseAll?.(); } catch (_) {}
        return this.getStats();
    }

    resumeAll() {
        if (this.destroyed) return this.getStats();
        this.paused = false;
        try { window.animeManager?.resumeAll?.(); } catch (_) {}
        void this.processQueue();
        return this.getStats();
    }

    clearQueue() {
        const cleared = this.animationQueue.length;
        this.animationQueue.splice(0).forEach(item => item.resolve(false));
        return cleared;
    }

    setSafeMode(enabled = true) {
        this.safeMode = Boolean(enabled);
        this.maxActiveAnimations = this.safeMode ? 1 : this.defaultMaxActiveAnimations;
        this.maxQueueSize = this.safeMode ? 4 : this.defaultMaxQueueSize;
        if (this.safeMode) {
            while (this.animationQueue.length > this.maxQueueSize) {
                this.animationQueue.shift()?.resolve(false);
            }
        }
        return this.getStats();
    }

    async executeAnimation(animationId, config, options = {}) {
        const animationInstance = {
            id: `${animationId}-${Date.now()}`,
            owner: `animation-manager:${animationId}:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`,
            target: config.target,
            startTime: performance.now(),
            completed: false,
            controller: new AbortController(),
            config: config,
            elements: [],
            elementSnapshots: new Map()
        };

        // Store animation instance
        this.activeAnimations.set(animationInstance.id, animationInstance);

        try {
            // Ensure required elements exist before animating
            await this.ensureElementsExist(animationId, config, animationInstance);
            if (animationInstance.controller.signal.aborted) {
                this.cleanupAnimation(animationInstance, true);
                return false;
            }
            
            // Get target elements
            let elements = document.querySelectorAll(config.target);
            if (elements.length === 0 && config.fallbackTarget) {
                console.warn(`No elements found for selector: ${config.target}, trying fallback ${config.fallbackTarget}`);
                elements = document.querySelectorAll(config.fallbackTarget);
            }
            if (elements.length === 0) {
                console.warn(`No elements found for selector: ${config.target} (and no fallback)`);
                try { window.dispatchEvent(new CustomEvent('triggerResult', { detail: { id: animationId, success: false, target: config.target, count: 0, error: 'no-target-elements' } })); } catch {}
                return false;
            }

            animationInstance.elements = Array.from(elements);

            // Store current states before animation
            this.storeCurrentStates(animationInstance);

            // Execute based on animation type
            switch (config.type) {
                case 'scale':
                    await this.animateScale(animationInstance);
                    break;
                case 'rotation':
                    await this.animateRotation(animationInstance);
                    break;
                case 'filter':
                    await this.animateFilter(animationInstance);
                    break;
                case 'opacity':
                    await this.animateOpacity(animationInstance);
                    break;
                case 'shake':
                    await this.animateShake(animationInstance);
                    break;
                case 'zoom':
                    await this.animateZoom(animationInstance);
                    break;
                case 'scramble':
                    await this.animateScramble(animationInstance);
                    break;
                case 'wave':
                    await this.animateWave(animationInstance);
                    break;
                case 'glitch':
                    await this.animateGlitch(animationInstance);
                    break;
                case 'composite':
                    await this.animateComposite(animationInstance);
                    break;
                case 'perspective':
                    await this.animatePerspective(animationInstance);
                    break;
            }
            if (animationInstance.controller.signal.aborted) {
                this.cleanupAnimation(animationInstance, true);
                return false;
            }

            // Cleanup if needed
            if (config.cleanup) {
                this.cleanupAnimation(animationInstance);
            }
            
            // Cleanup temporary matrix overlays
            if (animationId.includes('matrix')) {
                await this.cleanupTemporaryMatrixOverlays(animationInstance);
            }

            // Only release the target after every delayed cleanup completed.
            animationInstance.completed = true;

            // Emit diagnostic event
            try {
                window.dispatchEvent(new CustomEvent('triggerResult', { detail: { id: animationId, success: true, target: config.target, count: animationInstance.elements?.length || 0 } }));
            } catch {}

            return true;
        } catch (error) {
            console.error(`Animation ${animationId} failed:`, error);
            this.cleanupAnimation(animationInstance, true);
            try {
                window.dispatchEvent(new CustomEvent('triggerResult', { detail: { id: animationId, success: false, target: config?.target || '', count: animationInstance.elements?.length || 0, error: String(error?.message || error) } }));
            } catch {}
            return false;
        } finally {
            // Remove from active animations
            animationRuntime.disposeOwner(animationInstance.owner);
            this.activeAnimations.delete(animationInstance.id);
        }
    }

    storeCurrentStates(instance) {
        instance.elements.forEach(el => {
            const properties = {};
            MUTATED_STYLE_PROPERTIES.forEach(property => {
                properties[property] = {
                    value: el.style.getPropertyValue(property),
                    priority: el.style.getPropertyPriority(property)
                };
            });
            instance.elementSnapshots.set(el, {
                properties,
                hadPreAnimationTransform: Object.prototype.hasOwnProperty.call(el.dataset, 'preAnimationTransform'),
                preAnimationTransform: el.dataset.preAnimationTransform
            });
            el.dataset.preAnimationTransform = el.style.transform || '';
        });
    }

    async animateScale(instance) {
        const { config, elements } = instance;

        if (window.anime) {
            // Use anime.js if available
            const animation = window.anime({
                targets: elements,
                scale: [1, config.scale || 1.2],
                duration: config.duration || 600,
                easing: config.easing || 'easeOutElastic',
                direction: config.yoyo ? 'alternate' : 'normal',
                loop: config.repeat || false
            });
            if (window.animeManager && typeof window.animeManager.register === 'function') {
                window.animeManager.register(animation, { label: instance.id });
            }
            this.trackAnimeInstance(instance, animation);
            if (!await this.waitForAnime(instance, animation, (config.duration || 600) * (config.repeat ? 2 : 1) + 250)) return;
        } else {
            // CSS fallback
            elements.forEach(el => {
                const currentTransform = this.getCleanTransform(el);
                el.style.transition = `transform ${config.duration}ms ease-out`;
                el.style.transform = `${currentTransform} scale(${config.scale})`;
            });

            if (!await this.delay(config.duration, instance)) return;

            if (config.yoyo) {
                elements.forEach(el => {
                    const currentTransform = this.getCleanTransform(el);
                    el.style.transform = currentTransform;
                });
                if (!await this.delay(config.duration, instance)) return;
            }
        }

        if (config.resetAfter) {
            this.resetElements(elements);
        }
    }

    async animateRotation(instance) {
        const { config, elements } = instance;

        if (window.anime) {
            const animation = window.anime({
                targets: elements,
                rotate: config.rotation || 360,
                duration: config.duration || 1000,
                easing: config.easing || 'easeInOutCubic'
            });
            if (window.animeManager && typeof window.animeManager.register === 'function') {
                window.animeManager.register(animation, { label: instance.id });
            }
            this.trackAnimeInstance(instance, animation);
            if (!await this.waitForAnime(instance, animation, (config.duration || 1000) + 250)) return;
        } else {
            elements.forEach(el => {
                const currentTransform = this.getCleanTransform(el);
                el.style.transition = `transform ${config.duration}ms ease-in-out`;
                el.style.transform = `${currentTransform} rotate(${config.rotation}deg)`;
            });

            if (!await this.delay(config.duration, instance)) return;
        }

        if (config.resetAfter) {
            if (!await this.delay(100, instance)) return;
            this.resetElements(elements);
        }
    }

    async animateShake(instance) {
        const { config, elements } = instance;
        const intensity = config.intensity || 10;
        const duration = config.duration || 500;
        const shakes = 10;
        const shakeTime = duration / shakes;

        for (const el of elements) {
            // Store original transform
            const originalTransform = this.getCleanTransform(el);

            // Perform shake
            for (let i = 0; i < shakes; i++) {
                const x = (Math.random() - 0.5) * intensity * 2;
                const y = (Math.random() - 0.5) * intensity * 2;
                el.style.transition = `transform ${shakeTime}ms ease-out`;
                el.style.transform = `${originalTransform} translate(${x}px, ${y}px)`;
                if (!await this.delay(shakeTime, instance)) return;
            }

            // Reset to original position
            el.style.transform = originalTransform;
        }
    }

    async animateZoom(instance) {
        const { config, elements } = instance;

        for (const el of elements) {
            const originalTransform = this.getCleanTransform(el);

            el.style.transition = `transform ${config.duration / 2}ms ease-in-out`;
            el.style.transform = `${originalTransform} scale(${config.scale})`;

            if (!await this.delay(config.duration / 2, instance)) return;

            el.style.transform = originalTransform;

            if (!await this.delay(config.duration / 2, instance)) return;
        }
    }

    async animateFilter(instance) {
        const { config, elements } = instance;

        elements.forEach(el => {
            el.style.transition = `filter ${config.duration}ms ease-out`;
            el.style.filter = config.filter;
        });

        if (!await this.delay(config.duration, instance)) return;

        elements.forEach(el => {
            el.style.filter = '';
        });
    }

    async animateOpacity(instance) {
        const { config, elements } = instance;
        const sequence = config.opacitySequence || [1, 0, 1];
        const stepDuration = config.duration / sequence.length;

        for (const opacity of sequence) {
            elements.forEach(el => {
                el.style.transition = `opacity ${stepDuration}ms ease-out`;
                el.style.opacity = opacity;
            });
            if (!await this.delay(stepDuration, instance)) return;
        }

        // Reset opacity
        elements.forEach(el => {
            el.style.opacity = '';
        });
    }

    async animateScramble(instance) {
        const { config, elements } = instance;
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        const duration = config.duration || 2000;

        for (const el of elements) {
            const originalText = el.textContent;
            const textLength = originalText.length;
            let iterations = 0;
            const maxIterations = 30;

            const interval = animationRuntime.scheduleInterval(instance.owner, () => {
                el.textContent = originalText.split('').map((char, index) => {
                    if (index < iterations) {
                        return originalText[index];
                    }
                    return chars[Math.floor(Math.random() * chars.length)];
                }).join('');

                iterations++;
                if (iterations > maxIterations) {
                    interval.clear();
                    el.textContent = originalText;
                }
            }, duration / maxIterations);
            animationRuntime.trackDisposer(instance.owner, () => {
                interval.clear();
                el.textContent = originalText;
            });
        }

        await this.delay(duration, instance);
    }

    async animateWave(instance) {
        const { config, elements } = instance;
        const amplitude = config.amplitude || 20;
        const duration = config.duration || 2000;

        if (window.anime) {
            elements.forEach((el, i) => {
                const animation = window.anime({
                    targets: el,
                    translateY: [
                        { value: amplitude * Math.sin(i * 0.5), duration: duration / 4 },
                        { value: -amplitude * Math.sin(i * 0.5), duration: duration / 4 },
                        { value: amplitude * Math.sin(i * 0.5), duration: duration / 4 },
                        { value: 0, duration: duration / 4 }
                    ],
                    easing: 'easeInOutSine'
                });
                this.trackAnimeInstance(instance, animation, [el]);
            });
        } else {
            // CSS wave animation
            elements.forEach((el, i) => {
                el.style.animation = `wave ${duration}ms ease-in-out`;
                el.style.animationDelay = `${i * 100}ms`;
            });

            // Add wave keyframes if needed
            this.ensureWaveKeyframes(amplitude);
        }

        if (!await this.delay(duration, instance)) return;

        elements.forEach(el => {
            el.style.animation = '';
            el.style.transform = '';
        });
    }

    async animateGlitch(instance) {
        const { config, elements } = instance;

        this.ensureGlitchKeyframes();

        elements.forEach(el => {
            el.style.animation = `glitch ${config.duration}ms steps(1)`;
        });

        if (!await this.delay(config.duration, instance)) return;

        elements.forEach(el => {
            el.style.animation = '';
        });
    }

    async animateComposite(instance) {
        const { config, elements } = instance;
        const effects = config.effects || [];

        // Run multiple effects simultaneously
        const promises = effects.map(effect => {
            if (effect === 'opacity' && config.opacity) {
                return this.animateOpacity(instance);
            }
            if (effect === 'scale' && config.scale) {
                instance.config = { ...config, scale: config.scale };
                return this.animateScale(instance);
            }
            return Promise.resolve();
        });

        await Promise.all(promises);
    }

    async animatePerspective(instance) {
        const { config, elements } = instance;

        elements.forEach(el => {
            el.style.transition = `transform ${config.duration}ms ease-in-out`;
            el.style.transformStyle = 'preserve-3d';
            el.style.perspective = `${config.perspective}px`;
            el.style.transform = `rotateY(${config.rotateY}deg)`;
        });

        if (!await this.delay(config.duration / 2, instance)) return;

        elements.forEach(el => {
            el.style.transform = '';
        });

        await this.delay(config.duration / 2, instance);
    }

    async triggerSequence(config, options) {
        const results = [];

        for (const animationId of config.animations) {
            const result = await this.trigger(animationId, options);
            results.push(result);

            if (config.stagger) {
                if (!await this.delay(config.stagger)) return false;
            }
        }

        return results.every(r => r);
    }

    async cleanupTemporaryMatrixOverlays(instance) {
        // Remove temporary matrix overlays after animation
        const tempOverlays = Array.from(document.querySelectorAll('[data-temporary="true"]')).filter(overlay =>
            overlay.classList.contains('chaos-matrix') ||
                overlay.classList.contains('matrix-rain') ||
                overlay.id === 'chaos-matrix-temp'
        );
        tempOverlays.forEach(overlay => {
            overlay.style.transition = 'opacity 0.5s ease';
            overlay.style.opacity = '0';
        });
        if (tempOverlays.length) await this.delay(500, instance);
        tempOverlays.forEach(overlay => overlay.remove());
    }

    getCleanTransform(element) {
        // Get current transform without accumulating values
        const stored = element.dataset.preAnimationTransform;
        if (stored && stored !== 'none') {
            return stored;
        }

        const initial = this.elementStates.get(element);
        if (initial && initial.transform !== 'none') {
            return initial.transform;
        }

        return '';
    }

    resetElements(elements, snapshots = null) {
        elements.forEach(el => {
            const snapshot = snapshots?.get(el);
            if (snapshot) {
                MUTATED_STYLE_PROPERTIES.forEach(property => {
                    const saved = snapshot.properties[property];
                    if (saved?.value) {
                        el.style.setProperty(property, saved.value, saved.priority || '');
                    } else {
                        el.style.removeProperty(property);
                    }
                });
                if (snapshot.hadPreAnimationTransform) {
                    el.dataset.preAnimationTransform = snapshot.preAnimationTransform || '';
                } else {
                    delete el.dataset.preAnimationTransform;
                }
            } else {
                const initial = this.elementStates.get(el);
                if (initial) {
                    el.style.transform = initial.transform === 'none' ? '' : initial.transform;
                    el.style.opacity = initial.opacity;
                    el.style.filter = initial.filter === 'none' ? '' : initial.filter;
                } else {
                    el.style.transform = '';
                    el.style.opacity = '';
                    el.style.filter = '';
                }
                el.style.transition = '';
                el.style.animation = '';
                el.style.animationDelay = '';
                el.style.transformStyle = '';
                el.style.perspective = '';
                delete el.dataset.preAnimationTransform;
            }
        });
    }

    cleanupAnimation(instance, force = false) {
        if ((force || instance.config.cleanup || instance.config.resetAfter) && instance.elements) {
            this.resetElements(instance.elements, instance.elementSnapshots);
        }
    }

    ensureWaveKeyframes(amplitude = 20) {
        if (!document.getElementById('wave-keyframes')) {
            const style = document.createElement('style');
            style.id = 'wave-keyframes';
            style.textContent = `
                @keyframes wave {
                    0%, 100% { transform: translateY(0); }
                    25% { transform: translateY(${amplitude}px); }
                    75% { transform: translateY(-${amplitude}px); }
                }
            `;
            document.head.appendChild(style);
            animationRuntime.trackNode(MANAGER_RUNTIME_OWNER, style);
        }
    }

    ensureGlitchKeyframes() {
        if (!document.getElementById('glitch-keyframes')) {
            const style = document.createElement('style');
            style.id = 'glitch-keyframes';
            style.textContent = `
                @keyframes glitch {
                    0%, 100% {
                        transform: translateX(0);
                        filter: hue-rotate(0deg);
                    }
                    20% {
                        transform: translateX(-2px);
                        filter: hue-rotate(90deg);
                    }
                    40% {
                        transform: translateX(2px);
                        filter: hue-rotate(180deg);
                    }
                    60% {
                        transform: translateX(-2px);
                        filter: hue-rotate(270deg);
                    }
                    80% {
                        transform: translateX(2px);
                        filter: hue-rotate(360deg);
                    }
                }
            `;
            document.head.appendChild(style);
            animationRuntime.trackNode(MANAGER_RUNTIME_OWNER, style);
        }
    }

    trackAnimeInstance(instance, animation, targets = instance.elements) {
        if (!animation) return;
        animationRuntime.trackDisposer(instance.owner, () => {
            try { animation.pause?.(); } catch (_) {}
            try { window.anime?.remove?.(targets); } catch (_) {}
        });
    }

    async waitForAnime(instance, animation, maxDuration) {
        const outcome = await Promise.race([
            Promise.resolve(animation.finished).then(() => 'finished', () => 'failed'),
            this.delay(maxDuration, instance).then(completed => completed ? 'timeout' : 'cancelled')
        ]);
        if (outcome === 'finished') return true;
        if (outcome === 'timeout') {
            console.warn(`Animation ${instance.id} exceeded its ${maxDuration}ms deadline`);
            instance.controller.abort('deadline');
        }
        return false;
    }

    delay(ms, instance = null) {
        const owner = instance?.owner || MANAGER_RUNTIME_OWNER;
        const signal = instance?.controller?.signal;
        return new Promise(resolve => {
            let settled = false;
            let timeoutToken = null;
            let disposerToken = null;
            const finish = value => {
                if (settled) return;
                settled = true;
                signal?.removeEventListener('abort', onAbort);
                timeoutToken?.clear();
                const currentDisposer = disposerToken;
                disposerToken = null;
                currentDisposer?.clear();
                resolve(value);
            };
            const onAbort = () => finish(false);
            timeoutToken = animationRuntime.scheduleTimeout(owner, () => finish(true), Math.max(0, ms));
            disposerToken = animationRuntime.trackDisposer(owner, () => finish(false));
            if (signal?.aborted) {
                finish(false);
            } else {
                signal?.addEventListener('abort', onAbort, { once: true });
            }
        });
    }

    // Clean up all active animations
    cleanup() {
        this.generation++;
        animationRuntime.disposeOwner(MANAGER_RUNTIME_OWNER);
        this.activeAnimations.forEach(animation => {
            animation.controller?.abort('manager-cleanup');
            animationRuntime.disposeOwner(animation.owner);
            if (animation.elements) {
                this.resetElements(animation.elements, animation.elementSnapshots);
            }
        });
        this.activeAnimations.clear();
        this.animationQueue.splice(0).forEach(item => item.resolve(false));
        document.querySelectorAll('[data-temporary="true"]').forEach(node => node.remove());
    }

    reset() {
        this.destroyed = false;
        this.paused = false;
        this.setSafeMode(false);
        this.cleanup();
        this.captureInitialStates();
    }

    destroy() {
        this.destroyed = true;
        this.cleanup();
    }

    getStats() {
        return {
            active: this.activeAnimations.size,
            queued: this.animationQueue.length,
            processingQueue: this.isProcessingQueue,
            paused: this.paused,
            safeMode: this.safeMode,
            limits: {
                maxActive: this.maxActiveAnimations,
                maxQueued: this.maxQueueSize
            }
        };
    }
}

// Singleton holder (live binding)
let animationManager = null;

export function initAnimationManager() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return null;
    if (animationManager) return animationManager;
    try {
        animationManager = new AnimationManager();
        window.animationManager = animationManager;
        return animationManager;
    } catch (e) {
        console.error('Failed to initialize AnimationManager:', e);
        return null;
    }
}

// Auto-bootstrap on DOM ready in browsers
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const ready = () => { try { initAnimationManager(); } catch (_) {} };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ready, { once: true });
    } else {
        ready();
    }
}

export default animationManager;
