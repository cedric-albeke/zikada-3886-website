// Professional Animation Manager for ZIKADA 3886
// Handles all animation triggers with proper state management and cleanup

// NOTE: Import-safe: no DOM access or instantiation at import time. Use initAnimationManager() or
// rely on the DOMContentLoaded bootstrap below (browser-only) to create the singleton.

class AnimationManager {
    constructor() {
        this.activeAnimations = new Map();
        this.animationQueue = [];
        this.isProcessingQueue = false;
        this.elementStates = new WeakMap();
        this.animationDefaults = new Map();

        // Animation configurations
        this.animations = {
'logo-pulse': {
                target: '.anime-logo-container svg, .image-2',
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

    trigger(animationId, options = {}) {
        console.log(`🎭 Triggering animation: ${animationId}`);

        // Check if animation exists
        const config = this.animations[animationId];
        if (!config) {
            console.warn(`Animation ${animationId} not found`);
            return Promise.resolve(false);
        }

        // Handle sequence animations
        if (config.type === 'sequence') {
            return this.triggerSequence(config, options);
        }

        // Add to queue if another animation is running on same target
        if (this.isTargetBusy(config.target)) {
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
            this.animationQueue.push({ animationId, options, resolve });
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.isProcessingQueue || this.animationQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;

        while (this.animationQueue.length > 0) {
            const { animationId, options, resolve } = this.animationQueue.shift();
            const config = this.animations[animationId];

            if (!this.isTargetBusy(config.target)) {
                const result = await this.executeAnimation(animationId, config, options);
                resolve(result);
            } else {
                // Put it back and wait
                this.animationQueue.unshift({ animationId, options, resolve });
                await this.delay(100);
            }
        }

        this.isProcessingQueue = false;
    }

    async executeAnimation(animationId, config, options = {}) {
        const animationInstance = {
            id: `${animationId}-${Date.now()}`,
            target: config.target,
            startTime: performance.now(),
            completed: false,
            config: config,
            elements: []
        };

        // Store animation instance
        this.activeAnimations.set(animationInstance.id, animationInstance);

        try {
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
            this.storeCurrentStates(animationInstance.elements);

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

            // Mark as completed
            animationInstance.completed = true;

            // Cleanup if needed
            if (config.cleanup) {
                await this.delay(config.duration || 1000);
                this.cleanupAnimation(animationInstance);
            }

            // Emit diagnostic event
            try {
                window.dispatchEvent(new CustomEvent('triggerResult', { detail: { id: animationId, success: true, target: config.target, count: animationInstance.elements?.length || 0 } }));
            } catch {}

            return true;
        } catch (error) {
            console.error(`Animation ${animationId} failed:`, error);
            this.cleanupAnimation(animationInstance);
            try {
                window.dispatchEvent(new CustomEvent('triggerResult', { detail: { id: animationId, success: false, target: config?.target || '', count: animationInstance.elements?.length || 0, error: String(error?.message || error) } }));
            } catch {}
            return false;
        } finally {
            // Remove from active animations
            this.activeAnimations.delete(animationInstance.id);
        }
    }

    storeCurrentStates(elements) {
        elements.forEach(el => {
            const currentTransform = el.style.transform || '';
            el.dataset.preAnimationTransform = currentTransform;
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

            await animation.finished;
        } else {
            // CSS fallback
            elements.forEach(el => {
                const currentTransform = this.getCleanTransform(el);
                el.style.transition = `transform ${config.duration}ms ease-out`;
                el.style.transform = `${currentTransform} scale(${config.scale})`;
            });

            await this.delay(config.duration);

            if (config.yoyo) {
                elements.forEach(el => {
                    const currentTransform = this.getCleanTransform(el);
                    el.style.transform = currentTransform;
                });
                await this.delay(config.duration);
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

            await animation.finished;
        } else {
            elements.forEach(el => {
                const currentTransform = this.getCleanTransform(el);
                el.style.transition = `transform ${config.duration}ms ease-in-out`;
                el.style.transform = `${currentTransform} rotate(${config.rotation}deg)`;
            });

            await this.delay(config.duration);
        }

        if (config.resetAfter) {
            await this.delay(100);
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
                await this.delay(shakeTime);
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

            await this.delay(config.duration / 2);

            el.style.transform = originalTransform;

            await this.delay(config.duration / 2);
        }
    }

    async animateFilter(instance) {
        const { config, elements } = instance;

        elements.forEach(el => {
            el.style.transition = `filter ${config.duration}ms ease-out`;
            el.style.filter = config.filter;
        });

        await this.delay(config.duration);

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
            await this.delay(stepDuration);
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

            const interval = setInterval(() => {
                el.textContent = originalText.split('').map((char, index) => {
                    if (index < iterations) {
                        return originalText[index];
                    }
                    return chars[Math.floor(Math.random() * chars.length)];
                }).join('');

                iterations++;
                if (iterations > maxIterations) {
                    clearInterval(interval);
                    el.textContent = originalText;
                }
            }, duration / maxIterations);
        }

        await this.delay(duration);
    }

    async animateWave(instance) {
        const { config, elements } = instance;
        const amplitude = config.amplitude || 20;
        const duration = config.duration || 2000;

        if (window.anime) {
            elements.forEach((el, i) => {
                window.anime({
                    targets: el,
                    translateY: [
                        { value: amplitude * Math.sin(i * 0.5), duration: duration / 4 },
                        { value: -amplitude * Math.sin(i * 0.5), duration: duration / 4 },
                        { value: amplitude * Math.sin(i * 0.5), duration: duration / 4 },
                        { value: 0, duration: duration / 4 }
                    ],
                    easing: 'easeInOutSine'
                });
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

        await this.delay(duration);

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

        await this.delay(config.duration);

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

        await this.delay(config.duration / 2);

        elements.forEach(el => {
            el.style.transform = '';
        });

        await this.delay(config.duration / 2);
    }

    async triggerSequence(config, options) {
        const results = [];

        for (const animationId of config.animations) {
            const result = await this.trigger(animationId, options);
            results.push(result);

            if (config.stagger) {
                await this.delay(config.stagger);
            }
        }

        return results.every(r => r);
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

    resetElements(elements) {
        elements.forEach(el => {
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
            delete el.dataset.preAnimationTransform;
        });
    }

    cleanupAnimation(instance) {
        if (instance.config.resetAfter && instance.elements) {
            this.resetElements(instance.elements);
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
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Clean up all active animations
    cleanup() {
        this.activeAnimations.forEach(animation => {
            if (animation.elements) {
                this.resetElements(animation.elements);
            }
        });
        this.activeAnimations.clear();
        this.animationQueue = [];
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
