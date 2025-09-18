// Enhanced Anime.js Effects Module
// Advanced animations for ZIKADA 3886 website

import animeManager from './anime-init.js';

const anime = animeManager.anime;

class AnimeEnhancedEffects {
    constructor() {
        this.animations = {};
        this.enabled = false;
        this.particleSystem = null;
        this.glitchTimeline = null;
        this.morphingTextActive = false;

        console.log('🎨 Anime Enhanced Effects initialized');
    }

    init() {
        if (!this.checkAnimeEnabled()) {
            console.log('⚠️ Anime.js not enabled, skipping enhanced effects');
            return;
        }

        this.enabled = true;
        this.setupEventListeners();
        this.initEffects();
    }

    checkAnimeEnabled() {
        const qp = new URLSearchParams(window.location.search);
        return qp.get('anime') === '1' ||
               window.__ANIME_POC_ENABLED === true ||
               localStorage.getItem('3886_anime_enabled') === '1';
    }

    setupEventListeners() {
        // Listen for animation phase changes
        window.addEventListener('animationPhase', (e) => {
            this.handlePhaseChange(e.detail.phase);
        });

        // Listen for matrix messages
        window.addEventListener('matrixMessage', () => {
            this.triggerGlitchBurst();
        });

        // Listen for dice rolls
        window.addEventListener('diceRoll', () => {
            this.triggerDiceAnimation();
        });
    }

    initEffects() {
        // Initialize various effects
        this.createFloatingParticles();
        this.createTextMorphing();
        this.createHolographicEffect();
        this.createDataStreamEffect();
        this.createEnergyPulse();
        this.createGlitchTimeline();
        this.createCyberGrid();

        console.log('✨ All enhanced anime effects initialized');
    }

    // Effect 1: Floating Particles
    createFloatingParticles() {
        const particleContainer = document.createElement('div');
        particleContainer.className = 'anime-particles';
        particleContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 5;
        `;
        document.body.appendChild(particleContainer);

        const particleCount = 30;
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: radial-gradient(circle, rgba(0,255,133,0.8) 0%, transparent 70%);
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
            `;
            particleContainer.appendChild(particle);
            particles.push(particle);
        }

        // Animate particles
        this.animations.particles = anime({
            targets: particles,
            translateX: () => anime.random(-100, 100),
            translateY: () => anime.random(-100, 100),
            scale: [
                { value: 0, duration: 0 },
                { value: [0.5, 1.5], duration: 2000 },
                { value: 0, duration: 1000 }
            ],
            opacity: [
                { value: 0, duration: 0 },
                { value: 0.8, duration: 1000 },
                { value: 0, duration: 2000 }
            ],
            delay: anime.stagger(200, { from: 'random' }),
            duration: 5000,
            loop: true,
            easing: 'easeInOutQuad'
        });

        animeManager.register(this.animations.particles, {
            critical: false,
            label: 'floating-particles'
        });
    }

    // Effect 2: Text Morphing
    createTextMorphing() {
        const textElements = document.querySelectorAll('.logo-text, .text-3886');
        if (textElements.length === 0) return;

        textElements.forEach((element, index) => {
            const originalText = element.textContent;
            const chars = originalText.split('');

            // Wrap each character in a span
            element.innerHTML = chars.map(char =>
                `<span style="display: inline-block; transition: none;">${char}</span>`
            ).join('');

            const charSpans = element.querySelectorAll('span');

            // Create morphing animation
            const morphAnim = anime({
                targets: charSpans,
                rotateY: [0, 360],
                scale: [
                    { value: 1, duration: 0 },
                    { value: [0.8, 1.2], duration: 500 },
                    { value: 1, duration: 500 }
                ],
                color: [
                    { value: '#00ff85', duration: 200 },
                    { value: '#00ffff', duration: 200 },
                    { value: '#ff00ff', duration: 200 },
                    { value: '#00ff85', duration: 200 }
                ],
                delay: anime.stagger(50, { from: 'center' }),
                duration: 2000,
                loop: true,
                autoplay: false,
                direction: 'alternate',
                easing: 'easeInOutElastic(1, .5)'
            });

            animeManager.register(morphAnim, {
                critical: false,
                label: `text-morph-${index}`
            });

            // Start animation on hover
            element.addEventListener('mouseenter', () => morphAnim.play());
            element.addEventListener('mouseleave', () => {
                morphAnim.pause();
                morphAnim.seek(0);
            });
        });
    }

    // Effect 3: Holographic Effect
    createHolographicEffect() {
        const imageWrapper = document.querySelector('.image-wrapper');
        if (!imageWrapper) return;

        // Create holographic overlay
        const holoOverlay = document.createElement('div');
        holoOverlay.className = 'anime-holographic';
        holoOverlay.style.cssText = `
            position: absolute;
            top: -10%;
            left: -10%;
            width: 120%;
            height: 120%;
            background: linear-gradient(45deg,
                transparent 30%,
                rgba(0,255,255,0.1) 50%,
                transparent 70%);
            pointer-events: none;
            opacity: 0;
        `;
        imageWrapper.appendChild(holoOverlay);

        // Animate holographic scan
        this.animations.holographic = anime({
            targets: holoOverlay,
            opacity: [0, 0.6, 0],
            backgroundPosition: ['0% 0%', '200% 200%'],
            rotate: [0, 360],
            scale: [0.8, 1.2],
            duration: 4000,
            loop: true,
            easing: 'linear'
        });

        animeManager.register(this.animations.holographic, {
            critical: false,
            label: 'holographic-scan'
        });
    }

    // Effect 4: Data Stream Effect
    createDataStreamEffect() {
        const streamContainer = document.createElement('div');
        streamContainer.className = 'anime-data-streams';
        streamContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 3;
            overflow: hidden;
        `;
        document.body.appendChild(streamContainer);

        // Create vertical data streams
        for (let i = 0; i < 5; i++) {
            const stream = document.createElement('div');
            stream.style.cssText = `
                position: absolute;
                left: ${20 * i + 10}%;
                top: -100px;
                width: 2px;
                height: ${Math.random() * 200 + 100}px;
                background: linear-gradient(180deg,
                    transparent 0%,
                    rgba(0,255,133,0.8) 50%,
                    transparent 100%);
                opacity: 0;
            `;
            streamContainer.appendChild(stream);

            const streamAnim = anime({
                targets: stream,
                translateY: [0, window.innerHeight + 200],
                opacity: [
                    { value: 0, duration: 500 },
                    { value: 0.8, duration: 500 },
                    { value: 0.8, duration: 2000 },
                    { value: 0, duration: 500 }
                ],
                duration: 4000,
                delay: i * 800,
                loop: true,
                easing: 'linear'
            });

            animeManager.register(streamAnim, {
                critical: false,
                label: `data-stream-${i}`
            });
        }
    }

    // Effect 5: Energy Pulse
    createEnergyPulse() {
        const logo = document.querySelector('.image-wrapper');
        if (!logo) return;

        // Create pulse rings
        const pulseContainer = document.createElement('div');
        pulseContainer.className = 'anime-energy-pulse';
        pulseContainer.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            height: 100%;
            pointer-events: none;
        `;
        logo.appendChild(pulseContainer);

        for (let i = 0; i < 3; i++) {
            const ring = document.createElement('div');
            ring.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 100%;
                height: 100%;
                border: 2px solid rgba(0,255,255,0.5);
                border-radius: 50%;
                opacity: 0;
            `;
            pulseContainer.appendChild(ring);

            const pulseAnim = anime({
                targets: ring,
                scale: [0.8, 1.5],
                opacity: [
                    { value: 0.8, duration: 0 },
                    { value: 0, duration: 2000 }
                ],
                duration: 2000,
                delay: i * 600,
                loop: true,
                easing: 'easeOutExpo'
            });

            animeManager.register(pulseAnim, {
                critical: false,
                label: `energy-pulse-${i}`
            });
        }
    }

    // Effect 6: Glitch Timeline
    createGlitchTimeline() {
        this.glitchTimeline = anime.timeline({
            loop: false,
            autoplay: false
        });

        this.glitchTimeline
            .add({
                targets: document.body,
                translateX: [
                    { value: -5, duration: 50 },
                    { value: 5, duration: 50 },
                    { value: -3, duration: 50 },
                    { value: 3, duration: 50 },
                    { value: 0, duration: 50 }
                ],
                easing: 'steps(1)'
            })
            .add({
                targets: '.logo-text, .text-3886',
                color: [
                    { value: '#ff0000', duration: 100 },
                    { value: '#00ff00', duration: 100 },
                    { value: '#0000ff', duration: 100 },
                    { value: '#00ff85', duration: 100 }
                ],
                easing: 'steps(3)'
            }, '-=200')
            .add({
                targets: '.image-wrapper',
                filter: [
                    { value: 'hue-rotate(90deg)', duration: 100 },
                    { value: 'hue-rotate(-90deg)', duration: 100 },
                    { value: 'hue-rotate(0deg)', duration: 100 }
                ],
                easing: 'steps(2)'
            }, '-=300');

        animeManager.register(this.glitchTimeline, {
            critical: false,
            label: 'glitch-timeline'
        });
    }

    // Effect 7: Cyber Grid
    createCyberGrid() {
        const gridContainer = document.createElement('div');
        gridContainer.className = 'anime-cyber-grid';
        gridContainer.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 30%;
            pointer-events: none;
            z-index: 2;
            overflow: hidden;
            perspective: 1000px;
        `;
        document.body.appendChild(gridContainer);

        // Create grid lines
        const lineCount = 20;
        for (let i = 0; i < lineCount; i++) {
            const line = document.createElement('div');
            line.style.cssText = `
                position: absolute;
                bottom: 0;
                width: 100%;
                height: 2px;
                background: linear-gradient(90deg,
                    transparent 0%,
                    rgba(0,255,255,0.3) 50%,
                    transparent 100%);
                transform-origin: bottom center;
                transform: rotateX(85deg) translateZ(${i * 20}px);
                opacity: ${1 - (i / lineCount)};
            `;
            gridContainer.appendChild(line);

            const lineAnim = anime({
                targets: line,
                translateY: [-100, 0],
                opacity: [0, 1 - (i / lineCount)],
                duration: 1000,
                delay: i * 50,
                loop: true,
                direction: 'alternate',
                easing: 'easeInOutSine'
            });

            animeManager.register(lineAnim, {
                critical: false,
                label: `grid-line-${i}`
            });
        }
    }

    // Phase change handler
    handlePhaseChange(phase) {
        console.log(`🎭 Anime effects responding to phase: ${phase}`);

        switch(phase) {
            case 'intense':
                anime.speed = 1.5;
                this.triggerGlitchBurst();
                break;
            case 'calm':
                anime.speed = 0.7;
                break;
            case 'glitch':
                this.triggerGlitchBurst();
                break;
            case 'matrix':
                this.enhanceMatrixEffect();
                break;
            default:
                anime.speed = 1.0;
        }
    }

    // Trigger glitch burst
    triggerGlitchBurst() {
        if (this.glitchTimeline) {
            this.glitchTimeline.restart();
        }

        // Additional glitch effects
        const elements = document.querySelectorAll('.image-wrapper, .logo-text, .text-3886');

        const glitchBurst = anime({
            targets: elements,
            translateX: () => anime.random(-10, 10),
            translateY: () => anime.random(-10, 10),
            rotate: () => anime.random(-5, 5),
            duration: 100,
            direction: 'alternate',
            loop: 3,
            easing: 'steps(2)',
            complete: () => {
                // Reset transforms
                anime.set(elements, {
                    translateX: 0,
                    translateY: 0,
                    rotate: 0
                });
            }
        });

        animeManager.register(glitchBurst, {
            critical: false,
            label: 'glitch-burst'
        });
    }

    // Trigger dice animation
    triggerDiceAnimation() {
        console.log('🎲 Dice roll animation triggered');

        // Create dice effect
        const diceContainer = document.createElement('div');
        diceContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 100px;
            color: #00ff85;
            pointer-events: none;
            z-index: 9999;
        `;
        diceContainer.textContent = '🎲';
        document.body.appendChild(diceContainer);

        const diceAnim = anime({
            targets: diceContainer,
            rotate: [0, 720],
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0],
            duration: 2000,
            easing: 'easeOutElastic(1, .5)',
            complete: () => {
                diceContainer.remove();
            }
        });

        animeManager.register(diceAnim, {
            critical: false,
            label: 'dice-roll'
        });
    }

    // Enhance matrix effect
    enhanceMatrixEffect() {
        const matrixChars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';

        // Create matrix rain overlay
        const matrixOverlay = document.createElement('div');
        matrixOverlay.className = 'anime-matrix-enhance';
        matrixOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 4;
            color: #00ff41;
            font-family: monospace;
            font-size: 14px;
            overflow: hidden;
        `;
        document.body.appendChild(matrixOverlay);

        // Create falling characters
        for (let i = 0; i < 50; i++) {
            const char = document.createElement('span');
            char.style.cssText = `
                position: absolute;
                left: ${Math.random() * 100}%;
                top: -20px;
                opacity: 0;
            `;
            char.textContent = matrixChars[Math.floor(Math.random() * matrixChars.length)];
            matrixOverlay.appendChild(char);

            const fallAnim = anime({
                targets: char,
                translateY: window.innerHeight + 20,
                opacity: [
                    { value: 0, duration: 100 },
                    { value: 1, duration: 200 },
                    { value: 1, duration: 1000 },
                    { value: 0, duration: 200 }
                ],
                duration: 2000,
                delay: Math.random() * 2000,
                easing: 'linear',
                complete: () => {
                    char.remove();
                }
            });

            animeManager.register(fallAnim, {
                critical: false,
                label: `matrix-char-${i}`
            });
        }

        // Remove overlay after effect
        setTimeout(() => {
            matrixOverlay.remove();
        }, 4000);
    }

    // Pause all animations
    pauseAll() {
        Object.values(this.animations).forEach(anim => {
            if (anim && typeof anim.pause === 'function') {
                anim.pause();
            }
        });
    }

    // Resume all animations
    resumeAll() {
        Object.values(this.animations).forEach(anim => {
            if (anim && typeof anim.play === 'function') {
                anim.play();
            }
        });
    }

    // Destroy all animations
    destroy() {
        this.pauseAll();

        // Remove created elements
        const elements = document.querySelectorAll(
            '.anime-particles, .anime-holographic, .anime-data-streams, ' +
            '.anime-energy-pulse, .anime-cyber-grid, .anime-matrix-enhance'
        );
        elements.forEach(el => el.remove());

        // Clear animations
        this.animations = {};
        this.enabled = false;

        console.log('💀 Anime enhanced effects destroyed');
    }
}

// Create and initialize
const animeEnhancedEffects = new AnimeEnhancedEffects();

// Auto-initialize if anime is enabled
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => animeEnhancedEffects.init(), 1000);
    });
} else {
    setTimeout(() => animeEnhancedEffects.init(), 1000);
}

// Expose to window for control
window.animeEnhancedEffects = animeEnhancedEffects;

// Add control functions
window.ANIME_EFFECTS = {
    pause: () => animeEnhancedEffects.pauseAll(),
    resume: () => animeEnhancedEffects.resumeAll(),
    glitch: () => animeEnhancedEffects.triggerGlitchBurst(),
    dice: () => animeEnhancedEffects.triggerDiceAnimation(),
    matrix: () => animeEnhancedEffects.enhanceMatrixEffect(),
    destroy: () => animeEnhancedEffects.destroy(),
    status: () => ({
        enabled: animeEnhancedEffects.enabled,
        animationCount: Object.keys(animeEnhancedEffects.animations).length
    })
};

console.log('🎬 Anime Enhanced Effects module loaded - use ANIME_EFFECTS for control');

export default animeEnhancedEffects;