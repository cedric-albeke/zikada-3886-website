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
        // Always enable anime effects - part of the core experience
        this.enabled = true;
        this.setupEventListeners();
        this.initEffects();
        console.log('🎨 Anime Enhanced Effects enabled automatically');
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
        // Initialize ONLY lightweight, well-positioned effects
        // Reduced for performance - commenting out heavy effects

        this.createFloatingParticles();  // Keep - lightweight
        // this.createTextMorphing();     // Keep text glow but lightweight
        this.createHolographicEffect();  // Keep - adds depth
        this.createDataStreamEffect();   // Keep - signature effect
        // this.createEnergyPulse();      // Skip - too many rings
        this.createGlitchTimeline();     // Keep - triggered only
        // this.createCyberGrid();        // Skip - heavy on GPU

        // Reduced VJ effects - only essentials
        // this.createPsychedelicWaves(); // Skip - too heavy
        this.createStrobeCircles();      // Keep but reduce count
        // this.createDNAHelix();         // Skip - unnecessary
        this.createPlasmaField();        // Keep but optimize
        // this.createGeometricMandala(); // Skip - redundant
        // this.createElectricArcs();     // Skip - too random
        // this.createWarpTunnel();       // Skip - overlaps with main effects

        console.log('✨ Optimized anime effects initialized');
    }

    // Effect 1: Floating Particles (OPTIMIZED)
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
            opacity: 0.6;
        `;
        document.body.appendChild(particleContainer);

        const particleCount = 10; // Reduced from 30
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

    // Effect 2: Text Glow Pulse (no text modification, just glow effect)
    createTextMorphing() {
        // Create glow effect without modifying text content
        const textElements = document.querySelectorAll('.logo-text, .text-3886');
        if (textElements.length === 0) return;

        textElements.forEach((element, index) => {
            // Create a glow element behind the text
            const glowElement = document.createElement('div');
            glowElement.className = 'anime-text-glow';
            glowElement.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: -1;
                filter: blur(10px);
                opacity: 0;
                background: linear-gradient(90deg, #00ff85, #00ffff, #ff00ff);
                -webkit-background-clip: text;
                background-clip: text;
            `;

            // Position glow behind text
            element.style.position = 'relative';
            element.appendChild(glowElement);

            // Create glow pulse animation (automatic, no hover)
            const glowAnim = anime({
                targets: glowElement,
                opacity: [
                    { value: 0, duration: 2000 },
                    { value: 0.6, duration: 1000 },
                    { value: 0, duration: 2000 }
                ],
                filter: [
                    { value: 'blur(10px) hue-rotate(0deg)', duration: 0 },
                    { value: 'blur(20px) hue-rotate(180deg)', duration: 2500 },
                    { value: 'blur(10px) hue-rotate(360deg)', duration: 2500 }
                ],
                duration: 5000,
                loop: true,
                autoplay: true,
                easing: 'easeInOutSine'
            });

            animeManager.register(glowAnim, {
                critical: false,
                label: `text-glow-${index}`
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

    // Effect 4: Data Stream Effect (OPTIMIZED)
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
            opacity: 0.5;
        `;
        document.body.appendChild(streamContainer);

        // Create vertical data streams - reduced count
        for (let i = 0; i < 3; i++) { // Reduced from 5
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

    // Create Psychedelic Waves
    createPsychedelicWaves() {
        const waveContainer = document.createElement('div');
        waveContainer.className = 'anime-psychedelic-waves';
        waveContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 3;
            overflow: hidden;
            mix-blend-mode: screen;
        `;
        document.body.appendChild(waveContainer);

        for (let i = 0; i < 5; i++) {
            const wave = document.createElement('div');
            wave.style.cssText = `
                position: absolute;
                width: 200%;
                height: 200%;
                top: -50%;
                left: -50%;
                background: radial-gradient(ellipse at center,
                    rgba(${255 * Math.random()}, ${255 * Math.random()}, 255, 0.2) 0%,
                    transparent 50%);
                border-radius: 50%;
            `;
            waveContainer.appendChild(wave);

            const waveAnim = anime({
                targets: wave,
                rotate: [0, 360],
                scale: [0.5, 2, 0.5],
                opacity: [0.3, 0.8, 0.3],
                translateX: () => anime.random(-200, 200),
                translateY: () => anime.random(-200, 200),
                duration: 10000 + i * 2000,
                loop: true,
                easing: 'easeInOutSine'
            });

            animeManager.register(waveAnim, { critical: false, label: `psychedelic-wave-${i}` });
        }
    }

    // Create Strobe Circles (OPTIMIZED)
    createStrobeCircles() {
        const strobeContainer = document.createElement('div');
        strobeContainer.className = 'anime-strobe-circles';
        strobeContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 4;
            mix-blend-mode: screen;
            opacity: 0.4;
        `;
        document.body.appendChild(strobeContainer);

        for (let i = 0; i < 3; i++) { // Reduced from 8 to 3
            const circle = document.createElement('div');
            const size = Math.random() * 100 + 50;
            circle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                border: 3px solid rgba(0, 255, 255, 0.8);
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                transform: translate(-50%, -50%);
                box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
            `;
            strobeContainer.appendChild(circle);

            const strobeAnim = anime({
                targets: circle,
                scale: [0, 1.5, 0],
                opacity: [0, 1, 0],
                borderColor: [
                    { value: 'rgba(0, 255, 255, 0.8)' },
                    { value: 'rgba(255, 0, 255, 0.8)' },
                    { value: 'rgba(0, 255, 0, 0.8)' }
                ],
                duration: 2000,
                delay: i * 250,
                loop: true,
                easing: 'easeInOutExpo'
            });

            animeManager.register(strobeAnim, { critical: false, label: `strobe-circle-${i}` });
        }
    }

    // Create DNA Helix
    createDNAHelix() {
        const helixContainer = document.createElement('div');
        helixContainer.className = 'anime-dna-helix';
        helixContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 10%;
            width: 80px;
            height: 400px;
            transform: translateY(-50%);
            pointer-events: none;
            z-index: 3;
        `;
        document.body.appendChild(helixContainer);

        for (let i = 0; i < 20; i++) {
            const strand = document.createElement('div');
            strand.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: rgba(0, 255, 133, 0.8);
                border-radius: 50%;
                top: ${i * 20}px;
                left: 50%;
                transform: translateX(-50%);
                box-shadow: 0 0 10px rgba(0, 255, 133, 0.5);
            `;
            helixContainer.appendChild(strand);

            const helixAnim = anime({
                targets: strand,
                translateX: [
                    { value: -30, duration: 2000 },
                    { value: 30, duration: 2000 }
                ],
                translateZ: [
                    { value: -30, duration: 2000 },
                    { value: 30, duration: 2000 }
                ],
                scale: [0.5, 1.5, 0.5],
                delay: i * 100,
                loop: true,
                direction: 'alternate',
                easing: 'easeInOutSine'
            });

            animeManager.register(helixAnim, { critical: false, label: `dna-strand-${i}` });
        }

        // Rotate the entire helix
        const helixRotate = anime({
            targets: helixContainer,
            rotateY: [0, 360],
            duration: 15000,
            loop: true,
            easing: 'linear'
        });

        animeManager.register(helixRotate, { critical: false, label: 'dna-helix-rotate' });
    }

    // Create Plasma Field (OPTIMIZED & REPOSITIONED)
    createPlasmaField() {
        const plasmaCanvas = document.createElement('canvas');
        plasmaCanvas.className = 'anime-plasma-field';
        plasmaCanvas.width = 150; // Reduced from 200
        plasmaCanvas.height = 150; // Reduced from 200
        plasmaCanvas.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 200px;
            height: 200px;
            pointer-events: none;
            z-index: 2;
            opacity: 0.15;
            mix-blend-mode: screen;
            filter: blur(3px);
            border-radius: 10px;
        `;
        document.body.appendChild(plasmaCanvas);

        const ctx = plasmaCanvas.getContext('2d');
        let time = 0;

        const drawPlasma = () => {
            const imageData = ctx.createImageData(150, 150);
            const data = imageData.data;

            // Simplified plasma calculation for performance
            for (let x = 0; x < 150; x += 2) { // Skip every other pixel
                for (let y = 0; y < 150; y += 2) {
                    const value = Math.sin(x / 20.0) + Math.sin(y / 10.0) +
                                 Math.sin((x + y) / 20.0) + 4 + time;

                    const index = (y * 150 + x) * 4;
                    const color = Math.sin(value * Math.PI) * 127 + 128;

                    // Neon green/cyan theme
                    data[index] = 0;
                    data[index + 1] = color;
                    data[index + 2] = color * 0.8;
                    data[index + 3] = 255;
                }
            }

            ctx.putImageData(imageData, 0, 0);
            time += 0.02; // Slower animation
        };

        const plasmaAnim = anime({
            targets: { time },
            time: [0, Math.PI * 2],
            duration: 10000,
            loop: true,
            update: drawPlasma,
            easing: 'linear'
        });

        animeManager.register(plasmaAnim, { critical: false, label: 'plasma-field' });
    }

    // Create Geometric Mandala
    createGeometricMandala() {
        const mandalaContainer = document.createElement('div');
        mandalaContainer.className = 'anime-mandala';
        mandalaContainer.style.cssText = `
            position: fixed;
            top: 50%;
            right: 10%;
            width: 200px;
            height: 200px;
            transform: translate(50%, -50%);
            pointer-events: none;
            z-index: 3;
        `;
        document.body.appendChild(mandalaContainer);

        const shapes = 12;
        for (let i = 0; i < shapes; i++) {
            const shape = document.createElement('div');
            const angle = (360 / shapes) * i;
            shape.style.cssText = `
                position: absolute;
                width: 100%;
                height: 2px;
                background: linear-gradient(90deg,
                    transparent 0%,
                    rgba(255, 0, 255, 0.8) 50%,
                    transparent 100%);
                top: 50%;
                left: 0;
                transform-origin: center;
                transform: rotate(${angle}deg);
            `;
            mandalaContainer.appendChild(shape);
        }

        const mandalaAnim = anime({
            targets: mandalaContainer,
            rotate: [0, 360],
            scale: [0.5, 1.5, 0.5],
            opacity: [0.3, 1, 0.3],
            duration: 8000,
            loop: true,
            easing: 'easeInOutQuad'
        });

        animeManager.register(mandalaAnim, { critical: false, label: 'geometric-mandala' });
    }

    // Create Electric Arcs
    createElectricArcs() {
        const arcContainer = document.createElement('div');
        arcContainer.className = 'anime-electric-arcs';
        arcContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 5;
            overflow: hidden;
        `;
        document.body.appendChild(arcContainer);

        const createArc = () => {
            const arc = document.createElement('div');
            const startX = Math.random() * window.innerWidth;
            const startY = Math.random() * window.innerHeight;
            const endX = Math.random() * window.innerWidth;
            const endY = Math.random() * window.innerHeight;

            const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;

            arc.style.cssText = `
                position: absolute;
                width: ${distance}px;
                height: 2px;
                background: linear-gradient(90deg,
                    rgba(255, 255, 0, 0) 0%,
                    rgba(255, 255, 0, 1) 50%,
                    rgba(255, 255, 0, 0) 100%);
                box-shadow: 0 0 10px rgba(255, 255, 0, 0.8);
                left: ${startX}px;
                top: ${startY}px;
                transform-origin: left center;
                transform: rotate(${angle}deg) scaleX(0);
            `;
            arcContainer.appendChild(arc);

            const arcAnim = anime({
                targets: arc,
                scaleX: [0, 1, 0],
                opacity: [0, 1, 0],
                duration: 300,
                easing: 'easeOutExpo',
                complete: () => arc.remove()
            });

            animeManager.register(arcAnim, { critical: false, label: 'electric-arc' });
        };

        // Create arcs periodically
        setInterval(() => {
            if (Math.random() > 0.7) {
                createArc();
            }
        }, 500);
    }

    // Create Warp Tunnel
    createWarpTunnel() {
        const tunnelContainer = document.createElement('div');
        tunnelContainer.className = 'anime-warp-tunnel';
        tunnelContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            width: 600px;
            height: 600px;
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 1;
            opacity: 0.2;
        `;
        document.body.appendChild(tunnelContainer);

        for (let i = 0; i < 10; i++) {
            const ring = document.createElement('div');
            ring.style.cssText = `
                position: absolute;
                width: ${100 + i * 50}px;
                height: ${100 + i * 50}px;
                border: 2px solid rgba(0, 255, 255, ${1 - i * 0.1});
                border-radius: 50%;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            `;
            tunnelContainer.appendChild(ring);

            const tunnelAnim = anime({
                targets: ring,
                scale: [0, 3],
                opacity: [1, 0],
                rotateZ: [0, 180],
                duration: 3000,
                delay: i * 300,
                loop: true,
                easing: 'linear'
            });

            animeManager.register(tunnelAnim, { critical: false, label: `warp-ring-${i}` });
        }
    }

    // Destroy all animations
    destroy() {
        this.pauseAll();

        // Remove created elements
        const elements = document.querySelectorAll(
            '.anime-particles, .anime-holographic, .anime-data-streams, ' +
            '.anime-energy-pulse, .anime-cyber-grid, .anime-matrix-enhance, ' +
            '.anime-psychedelic-waves, .anime-strobe-circles, .anime-dna-helix, ' +
            '.anime-plasma-field, .anime-mandala, .anime-electric-arcs, .anime-warp-tunnel'
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