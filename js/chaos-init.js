import chaosEngine from './chaos-engine.js';
import textEffects from './text-effects.js';
import backgroundAnimator from './background-animator.js';
import matrixMessages from './matrix-messages.js';
import subtleEffects from './subtle-effects.js';
import randomAnimations from './random-animations.js';
import extendedAnimations from './extended-animations.js';
import timingController from './timing-controller.js';
import logoAnimator from './logo-animator.js';
import gsap from 'gsap';

class ChaosInitializer {
    constructor() {
        this.isReady = false;
        this.performanceMode = 'auto';
        this.fps = 60;
        this.fpsHistory = [];
        this.lastFrameTime = performance.now();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        console.log('🌀 ZIKADA 3886 CHAOS ENGINE INITIALIZING...');

        // Initialize timing controller first for coordination
        timingController.init();

        // Initialize subsystems
        this.initPerformanceMonitor();
        this.initBackgroundAnimator();
        this.initLogoAnimator();  // Initialize logo animator early
        this.initChaosEngine();
        this.initTextEffects();
        this.initAdditionalEffects();
        this.initRandomAnimations();
        this.handleResize();

        // Listen for animation phase changes
        window.addEventListener('animationPhase', (e) => this.handlePhaseChange(e.detail.phase));

        // Start the chaos
        this.isReady = true;
        console.log('⚡ CHAOS ENGINE ONLINE');

        // Skip startup sequence - removed status texts
        // this.runStartupSequence();
        // Start animation phases directly
        setTimeout(() => {
            this.startAnimationPhases();
        }, 2000);

        // Start animation watchdog to ensure animations never stop
        this.startAnimationWatchdog();
    }

    handlePhaseChange(phase) {
        // Adjust animation intensity based on phase
        switch(phase) {
            case 'calm':
                timingController.setGlobalSpeed(0.8);
                break;
            case 'buildup':
                timingController.setGlobalSpeed(1.2);
                break;
            case 'intense':
                timingController.setGlobalSpeed(1.5);
                timingController.throttleAnimations();
                break;
            case 'cooldown':
                timingController.setGlobalSpeed(0.6);
                break;
        }
    }

    initPerformanceMonitor() {
        const monitorFPS = () => {
            const now = performance.now();
            const delta = now - this.lastFrameTime;
            const currentFPS = 1000 / delta;

            this.fpsHistory.push(currentFPS);
            if (this.fpsHistory.length > 60) {
                this.fpsHistory.shift();
            }

            this.fps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;

            // Auto-adjust quality based on performance
            if (this.performanceMode === 'auto') {
                if (this.fps < 30 && chaosEngine.isInitialized) {
                    this.setPerformanceMode('low');
                } else if (this.fps > 50 && this.performanceMode !== 'high') {
                    this.setPerformanceMode('high');
                }
            }

            this.lastFrameTime = now;
            requestAnimationFrame(monitorFPS);
        };

        requestAnimationFrame(monitorFPS);
    }

    setPerformanceMode(mode) {
        this.performanceMode = mode;

        if (!chaosEngine.isInitialized) return;

        switch (mode) {
            case 'low':
                // Reduce particle count
                if (chaosEngine.particles) {
                    chaosEngine.particles.material.size = 0.3;
                }
                // Disable some post-processing
                if (chaosEngine.glitchPass) {
                    chaosEngine.glitchPass.enabled = false;
                }
                break;

            case 'high':
                // Enable all effects
                if (chaosEngine.particles) {
                    chaosEngine.particles.material.size = 0.5;
                }
                break;
        }
    }

    initBackgroundAnimator() {
        try {
            backgroundAnimator.init();
            backgroundAnimator.startGlitchSequence();
        } catch (error) {
            console.error('Failed to initialize Background Animator:', error);
        }
    }

    initLogoAnimator() {
        try {
            logoAnimator.init();
            console.log('✨ Logo Animator initialized');
        } catch (error) {
            console.error('Failed to initialize Logo Animator:', error);
        }
    }

    initChaosEngine() {
        try {
            chaosEngine.init();
        } catch (error) {
            console.error('Failed to initialize Chaos Engine:', error);
            // Fallback to CSS-only effects
            this.enableFallbackMode();
        }
    }

    initTextEffects() {
        try {
            textEffects.init();
            textEffects.addDataCorruption();
            matrixMessages.init();
            subtleEffects.init();
        } catch (error) {
            console.error('Failed to initialize Text Effects:', error);
        }
    }

    initRandomAnimations() {
        try {
            randomAnimations.init();
            extendedAnimations.init();
            console.log('🎲 Random animations initialized');
            console.log('🎬 Extended animations initialized');
        } catch (error) {
            console.error('Failed to initialize Random Animations:', error);
        }
    }

    initAdditionalEffects() {
        // Add scanlines effect
        this.addScanlines();

        // Add VHS distortion
        this.addVHSDistortion();

        // Add cyber grid
        this.addCyberGrid();

        // Add glowing edges to main elements
        this.addGlowEffects();

        // Add static noise overlay
        this.addStaticNoise();

        // Add data stream visualization
        this.addDataStreams();

        // Add holographic shimmer
        this.addHolographicShimmer();

        // Add glitch lines
        this.addGlitchLines();

        // Protect cicada logo opacity
        this.protectLogoOpacity();

        // Add more interesting effects
        this.addPersistentEffects();

        // Add subtle color variations
        this.addSubtleColorVariations();
    }

    addScanlines() {
        const scanlines = document.createElement('div');
        scanlines.className = 'scanlines';
        scanlines.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9997;
            background: repeating-linear-gradient(
                0deg,
                rgba(0, 0, 0, 0.02) 0px,
                transparent 1px,
                transparent 2px,
                rgba(0, 0, 0, 0.02) 3px
            );
            opacity: 0.3;
            mix-blend-mode: multiply;
        `;
        document.body.appendChild(scanlines);

        // Slower, subtler animation
        gsap.to(scanlines, {
            backgroundPosition: '0 4px',
            duration: 2,
            repeat: -1,
            ease: 'none'
        });
    }

    addVHSDistortion() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes vhsDistortion {
                0%, 100% {
                    transform: translateX(0) scaleX(1);
                    filter: hue-rotate(0deg);
                }
                20% {
                    transform: translateX(-2px) scaleX(1.01);
                    filter: hue-rotate(10deg);
                }
                40% {
                    transform: translateX(2px) scaleX(0.99);
                    filter: hue-rotate(-10deg);
                }
                60% {
                    transform: translateX(-1px) scaleX(1.02);
                    filter: hue-rotate(5deg);
                }
                80% {
                    transform: translateX(1px) scaleX(0.98);
                    filter: hue-rotate(-5deg);
                }
            }

            .image-wrapper {
                animation: vhsDistortion 8s infinite;
            }

            @keyframes cyberPulse {
                0%, 100% {
                    filter: brightness(100%) contrast(100%);
                }
                50% {
                    filter: brightness(110%) contrast(110%);
                }
            }

            .logo-text-wrapper {
                animation: cyberPulse 4s infinite;
            }
        `;
        document.head.appendChild(style);
    }

    addCyberGrid() {
        const gridCanvas = document.createElement('canvas');
        gridCanvas.id = 'cyber-grid';
        gridCanvas.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 40%;
            pointer-events: none;
            z-index: -1;
            opacity: 0.15;
        `;

        document.body.appendChild(gridCanvas);

        const ctx = gridCanvas.getContext('2d');
        gridCanvas.width = window.innerWidth;
        gridCanvas.height = window.innerHeight * 0.4;

        let offset = 0;

        const drawGrid = () => {
            ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

            // Create perspective grid
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 0.5;

            const gridSize = 40;
            const horizon = 0;
            const vanishingPointY = -gridCanvas.height * 0.5;

            // Horizontal lines with perspective
            for (let i = 0; i <= 20; i++) {
                const y = horizon + (i * i * 2); // Exponential spacing for perspective
                if (y > gridCanvas.height) break;

                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(gridCanvas.width, y);
                ctx.globalAlpha = 1 - (y / gridCanvas.height) * 0.7;
                ctx.stroke();
            }

            // Vertical lines with perspective
            const centerX = gridCanvas.width / 2;
            const numLines = 30;

            for (let i = -numLines; i <= numLines; i++) {
                ctx.beginPath();
                const startX = centerX + (i * gridSize);
                const endX = centerX + (i * gridSize * 5);

                ctx.moveTo(startX, horizon);
                ctx.lineTo(endX, gridCanvas.height);
                ctx.globalAlpha = 0.3 - Math.abs(i / numLines) * 0.2;
                ctx.stroke();
            }

            ctx.globalAlpha = 1;
        };

        const gridSize = 40; // Define gridSize here
        const animateGrid = () => {
            offset += 0.5;
            if (offset > gridSize) offset = 0;
            drawGrid();
            requestAnimationFrame(animateGrid);
        };

        animateGrid();
    }

    addGlowEffects() {
        const style = document.createElement('style');
        style.textContent = `
            .image-wrapper {
                filter: drop-shadow(0 0 20px rgba(0, 255, 255, 0.5));
            }

            .logo-text {
                text-shadow:
                    0 0 10px rgba(0, 255, 255, 0.8),
                    0 0 20px rgba(0, 255, 255, 0.6),
                    0 0 30px rgba(0, 255, 255, 0.4);
            }

            .button-primary {
                box-shadow:
                    0 0 20px rgba(255, 0, 255, 0.5),
                    inset 0 0 20px rgba(0, 255, 255, 0.2);
                transition: all 0.3s;
            }

            .button-primary:hover {
                box-shadow:
                    0 0 40px rgba(255, 0, 255, 0.8),
                    inset 0 0 30px rgba(0, 255, 255, 0.4);
            }

            .glow {
                animation: glowPulse 2s infinite;
            }

            @keyframes glowPulse {
                0%, 100% {
                    opacity: 0.5;
                    transform: scale(1);
                }
                50% {
                    opacity: 1;
                    transform: scale(1.02);  /* Reduced from 1.1 */
                }
            }
        `;
        document.head.appendChild(style);
    }

    runStartupSequence() {
        // Cyberpunk-style startup sequence
        const messages = [
            'INITIALIZING NEURAL MATRIX...',
            'LOADING CHAOS PROTOCOLS...',
            'SYNCHRONIZING QUANTUM FLUX...',
            'CALIBRATING REALITY DISTORTION...',
            'ENGAGING TECHNO OVERDRIVE...',
            'SYSTEM READY'
        ];

        // Start phase-based animations after startup
        setTimeout(() => {
            this.startAnimationPhases();
        }, 8000);

        const consoleDiv = document.createElement('div');
        consoleDiv.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            font-family: 'Space Mono', monospace;
            font-size: 12px;
            color: #00ff00;
            text-shadow: 0 0 5px #00ff00;
            z-index: 9999;
            opacity: 0;
            max-width: 300px;
        `;
        document.body.appendChild(consoleDiv);

        // Fade in console
        gsap.to(consoleDiv, {
            opacity: 0.8,
            duration: 0.5
        });

        let messageIndex = 0;
        const typeMessage = () => {
            if (messageIndex < messages.length) {
                const message = messages[messageIndex];
                consoleDiv.innerText = '> ' + message;

                messageIndex++;
                setTimeout(typeMessage, 800);
            } else {
                // Fade out after completion
                gsap.to(consoleDiv, {
                    opacity: 0,
                    duration: 2,
                    delay: 2,
                    onComplete: () => consoleDiv.remove()
                });
            }
        };

        setTimeout(typeMessage, 500);
    }

    enableFallbackMode() {
        console.log('📉 Running in fallback mode (CSS only)');

        // Add CSS-only animations as fallback
        const style = document.createElement('style');
        style.textContent = `
            .pre-loader {
                background: linear-gradient(45deg, #000, #0a0a0a, #000);
                animation: backgroundShift 10s infinite;
            }

            @keyframes backgroundShift {
                0%, 100% {
                    filter: hue-rotate(0deg) brightness(100%);
                }
                50% {
                    filter: hue-rotate(30deg) brightness(110%);
                }
            }
        `;
        document.head.appendChild(style);
    }

    handleResize() {
        window.addEventListener('resize', () => {
            if (chaosEngine.isInitialized) {
                chaosEngine.handleResize();
            }

            // Update canvas sizes
            const matrixCanvas = document.getElementById('matrix-rain');
            if (matrixCanvas) {
                matrixCanvas.width = window.innerWidth;
                matrixCanvas.height = window.innerHeight;
            }

            const gridCanvas = document.getElementById('cyber-grid');
            if (gridCanvas) {
                gridCanvas.width = window.innerWidth;
                gridCanvas.height = window.innerHeight * 0.3;
            }
        });
    }

    addStaticNoise() {
        const canvas = document.createElement('canvas');
        canvas.id = 'static-noise';
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
            opacity: 0.015;
            mix-blend-mode: screen;
        `;
        canvas.width = 256;
        canvas.height = 256;
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');

        const animateStatic = () => {
            const imageData = ctx.createImageData(256, 256);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const value = Math.random() * 255;
                data[i] = value;
                data[i + 1] = value;
                data[i + 2] = value;
                data[i + 3] = 255;
            }

            ctx.putImageData(imageData, 0, 0);
            setTimeout(animateStatic, 50);
        };

        animateStatic();
    }

    addDataStreams() {
        const container = document.createElement('div');
        container.className = 'data-streams';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 2;
            overflow: hidden;
        `;
        document.body.appendChild(container);

        // Create vertical data streams
        for (let i = 0; i < 5; i++) {
            const stream = document.createElement('div');
            stream.style.cssText = `
                position: absolute;
                left: ${Math.random() * 100}%;
                top: -100px;
                width: 2px;
                height: ${Math.random() * 200 + 100}px;
                background: linear-gradient(transparent, #00ff85, transparent);
                opacity: ${Math.random() * 0.3 + 0.1};
            `;
            container.appendChild(stream);

            gsap.to(stream, {
                y: window.innerHeight + 200,
                duration: Math.random() * 10 + 5,
                repeat: -1,
                ease: 'none',
                delay: Math.random() * 5
            });
        }
    }

    addHolographicShimmer() {
        const shimmer = document.createElement('div');
        shimmer.className = 'holographic-shimmer';
        shimmer.style.cssText = `
            position: fixed;
            top: -100%;
            left: -50%;
            width: 200%;
            height: 200%;
            pointer-events: none;
            z-index: 3;
            background: linear-gradient(45deg,
                transparent 30%,
                rgba(0, 255, 255, 0.05) 50%,
                transparent 70%);
            transform: rotate(45deg);
        `;
        document.body.appendChild(shimmer);

        gsap.to(shimmer, {
            y: '200%',
            duration: 15,
            repeat: -1,
            ease: 'none'
        });
    }

    startAnimationPhases() {
        // Prevent duplicate phase runners
        if (this.phaseRunning) {
            console.log('⚠️ Phase animations already running');
            return;
        }

        // Create a more dynamic, randomized animation sequence
        const phases = [
            () => this.phaseIntense(),
            () => this.phaseCalm(),
            () => this.phaseGlitch(),
            () => this.phaseTechno(),
            () => this.phaseMatrix(),
            () => this.phaseMinimal(),
            () => this.phaseChaotic(),
            () => this.phaseRetro(),
            // New color-themed phases
            () => this.phaseVaporwave(),
            () => this.phaseCyberpunk(),
            () => this.phaseNeon(),
            () => this.phaseAurora()
        ];

        let lastPhase = null;
        this.phaseRunning = true;
        this.currentPhase = null;

        const runRandomPhase = () => {
            if (!this.phaseRunning) {
                // Restart if stopped
                this.phaseRunning = true;
            }

            // Smooth transition out of current phase
            if (this.currentPhase) {
                this.transitionOut();
            }

            // Pick a random phase that isn't the last one
            let availablePhases = phases.filter(p => p !== lastPhase);
            const randomPhase = availablePhases[Math.floor(Math.random() * availablePhases.length)];
            lastPhase = randomPhase;

            // Smooth transition into new phase
            setTimeout(() => {
                randomPhase();
                this.currentPhase = randomPhase.name;
            }, 500);

            // Random duration between 15-40 seconds
            const nextDelay = Math.random() * 25000 + 15000;
            setTimeout(runRandomPhase, nextDelay);
        };

        runRandomPhase();
    }

    transitionOut() {
        // Smooth fade transition between phases
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(ellipse at center, transparent, rgba(0,0,0,0.3));
            pointer-events: none;
            z-index: 9998;
            opacity: 0;
        `;
        document.body.appendChild(overlay);

        gsap.to(overlay, {
            opacity: 0.5,
            duration: 0.3,
            yoyo: true,
            repeat: 1,
            ease: 'power2.inOut',
            onComplete: () => overlay.remove()
        });
    }

    startAnimationWatchdog() {
        // More aggressive watchdog - check every 10 seconds
        let checkCount = 0;

        setInterval(() => {
            checkCount++;
            const verbose = checkCount % 6 === 0; // Log every minute

            // Check if random animations are running
            if (randomAnimations) {
                if (!randomAnimations.isRunning) {
                    console.log('🔧 Restarting random animations...');
                    randomAnimations.isRunning = true;
                    randomAnimations.triggerRandomAnimation();
                } else if (verbose) {
                    // Force trigger new animation periodically to keep things fresh
                    randomAnimations.triggerRandomAnimation();
                }
            }

            // Check if extended animations are running
            if (extendedAnimations) {
                if (!extendedAnimations.isRunning) {
                    console.log('🔧 Restarting extended animations...');
                    extendedAnimations.isRunning = true;
                    extendedAnimations.runRandomEffect();
                } else if (verbose) {
                    // Force trigger new effect periodically
                    extendedAnimations.runRandomEffect();
                }
            }

            // Check if phase animations are running
            if (!this.phaseRunning) {
                console.log('🔧 Restarting phase animations...');
                this.phaseRunning = true;
                this.startAnimationPhases();
            }

            // Ensure background animator is running
            if (backgroundAnimator && !backgroundAnimator.initialized) {
                console.log('🔧 Restarting background animator...');
                backgroundAnimator.init();
                backgroundAnimator.startGlitchSequence();
            }

            // Ensure logo animator is running
            if (logoAnimator && !logoAnimator.isInitialized) {
                console.log('🔧 Restarting logo animator...');
                logoAnimator.init();
            }

            // Trigger special logo animation occasionally
            if (logoAnimator && logoAnimator.isInitialized && Math.random() < 0.1) {
                logoAnimator.triggerSpecialAnimation();
            }

            if (verbose) {
                console.log('✅ Watchdog check #' + checkCount + ' - All systems running');
            }
        }, 10000); // Check every 10 seconds instead of 30
    }

    phaseIntense() {
        console.log('🔥 INTENSE PHASE');
        // Dispatch event for logo reaction
        window.dispatchEvent(new CustomEvent('animationPhase', { detail: { phase: 'intense' } }));

        // Gentle rotation increase
        gsap.to('.bg', {
            rotationZ: '+=90',  // Reduced from 180
            duration: 8,  // Slower
            ease: 'power2.inOut'
        });

        // Subtle particle effects
        if (window.chaosEngine && window.chaosEngine.particles) {
            gsap.to(window.chaosEngine.particles.material, {
                opacity: 0.6,  // Reduced from 0.9
                size: 0.8,  // Reduced from 1
                duration: 3
            });
        }

        // Very subtle vibration instead of shake
        gsap.to(document.body, {
            x: 1,
            y: 1,
            duration: 0.1,
            yoyo: true,
            repeat: 10,
            ease: 'sine.inOut'
        });
    }

    phaseCalm() {
        console.log('🌊 CALM PHASE');

        // Slow everything down
        gsap.to('.bg', {
            rotationZ: '+=30',
            duration: 15,
            ease: 'sine.inOut'
        });

        // Reduce effects
        if (window.chaosEngine && window.chaosEngine.particles) {
            gsap.to(window.chaosEngine.particles.material, {
                opacity: 0.3,
                size: 0.3,
                duration: 5
            });
        }

        // Add subtle breathing effect to main elements
        gsap.to('.logo-text-wrapper, .image-wrapper', {
            scale: 1.02,  // Reduced from 1.05
            duration: 4,
            yoyo: true,
            repeat: 2,
            ease: 'sine.inOut'
        });
    }

    phaseGlitch() {
        console.log('⚡ GLITCH PHASE');

        // Heavy glitch effects
        const glitchBurst = () => {
            // RGB split
            document.body.style.filter = `hue-rotate(${Math.random() * 360}deg) saturate(${Math.random() * 2 + 0.5})`;

            // Position glitch
            const elements = document.querySelectorAll('.logo-text-wrapper, .image-wrapper, .text-3886');
            elements.forEach(el => {
                el.style.transform = `translate(${Math.random() * 20 - 10}px, ${Math.random() * 20 - 10}px) skew(${Math.random() * 10 - 5}deg)`;
            });

            setTimeout(() => {
                document.body.style.filter = 'none';
                elements.forEach(el => {
                    el.style.transform = 'none';
                });
            }, 100);
        };

        // Multiple glitch bursts
        for (let i = 0; i < 10; i++) {
            setTimeout(glitchBurst, i * 300);
        }
    }

    phaseTechno() {
        console.log('🎵 TECHNO PHASE');

        // Strobe-like effects
        const strobe = document.createElement('div');
        strobe.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
            pointer-events: none;
            z-index: 10000;
            opacity: 0;
        `;
        document.body.appendChild(strobe);

        // Strobe animation
        const strobeTimeline = gsap.timeline({ repeat: 5 });
        strobeTimeline
            .to(strobe, { opacity: 0.1, duration: 0.05 })
            .to(strobe, { opacity: 0, duration: 0.05 })
            .to(strobe, { opacity: 0.08, duration: 0.05 })
            .to(strobe, { opacity: 0, duration: 0.1 });

        setTimeout(() => strobe.remove(), 3000);

        // Very subtle pulsing
        gsap.to('.logo-text-wrapper, .image-wrapper, .text-3886', {
            scale: 1.03,  // Reduced from 1.1
            duration: 0.3,  // Slightly slower
            repeat: 10,
            yoyo: true,
            ease: 'power2.inOut'
        });
    }

    phaseMatrix() {
        console.log('📟 MATRIX PHASE');

        // Green tint overlay
        const matrixOverlay = document.createElement('div');
        matrixOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle at center, transparent 30%, rgba(0, 255, 133, 0.1) 100%);
            pointer-events: none;
            z-index: 9990;
            opacity: 0;
        `;
        document.body.appendChild(matrixOverlay);

        gsap.to(matrixOverlay, {
            opacity: 1,
            duration: 2,
            onComplete: () => {
                gsap.to(matrixOverlay, {
                    opacity: 0,
                    duration: 2,
                    delay: 5,
                    onComplete: () => matrixOverlay.remove()
                });
            }
        });

        // Create falling code rain
        for (let i = 0; i < 20; i++) {
            const codeStream = document.createElement('div');
            codeStream.textContent = Array.from({ length: 30 }, () =>
                String.fromCharCode(33 + Math.random() * 94)
            ).join('');
            codeStream.style.cssText = `
                position: fixed;
                left: ${Math.random() * 100}%;
                top: -100%;
                color: #00ff85;
                font-family: monospace;
                font-size: 10px;
                opacity: ${Math.random() * 0.5 + 0.1};
                writing-mode: vertical-rl;
                pointer-events: none;
                z-index: 9991;
            `;
            document.body.appendChild(codeStream);

            gsap.to(codeStream, {
                y: window.innerHeight * 2,
                duration: Math.random() * 5 + 3,
                ease: 'none',
                onComplete: () => codeStream.remove()
            });
        }
    }

    addGlitchLines() {
        const container = document.createElement('div');
        container.className = 'glitch-lines';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9995;
        `;
        document.body.appendChild(container);

        const createGlitchLine = () => {
            const line = document.createElement('div');
            const height = Math.random() * 3 + 1;
            const y = Math.random() * window.innerHeight;

            line.style.cssText = `
                position: absolute;
                left: 0;
                top: ${y}px;
                width: 100%;
                height: ${height}px;
                background: rgba(255, 0, 255, 0.8);
                mix-blend-mode: screen;
            `;
            container.appendChild(line);

            gsap.to(line, {
                opacity: 0,
                scaleX: 0,
                duration: 0.2,
                ease: 'power4.out',
                onComplete: () => line.remove()
            });
        };

        // Periodic glitch lines
        setInterval(() => {
            if (Math.random() > 0.8) {
                createGlitchLine();
                if (Math.random() > 0.5) {
                    setTimeout(createGlitchLine, 50);
                }
            }
        }, 3000);
    }

    // Ensure cicada logo never goes too transparent
    protectLogoOpacity() {
        const imageWrapper = document.querySelector('.image-wrapper');
        const image = document.querySelector('.image-2');

        if (imageWrapper && image) {
            // Set initial minimum opacity
            gsap.set(image, { opacity: 1 });

            // Create a MutationObserver to watch for opacity changes
            const observer = new MutationObserver(() => {
                const wrapperOpacity = parseFloat(window.getComputedStyle(imageWrapper).opacity);
                const imageOpacity = parseFloat(window.getComputedStyle(image).opacity);
                const combinedOpacity = wrapperOpacity * imageOpacity;

                // If combined opacity is too low, boost the image opacity
                if (combinedOpacity < 0.7) {
                    const boostFactor = 0.7 / wrapperOpacity;
                    gsap.set(image, { opacity: Math.min(1, boostFactor) });
                }
            });

            // Observe style changes on both elements
            observer.observe(imageWrapper, { attributes: true, attributeFilter: ['style'] });
            observer.observe(image, { attributes: true, attributeFilter: ['style'] });

            // Store observer for cleanup
            this.opacityObserver = observer;
        }
    }

    addPersistentEffects() {
        // Add chromatic aberration pulse
        this.addChromaticPulse();

        // Add digital artifacts
        this.addDigitalArtifacts();

        // Add energy field effect around cicada
        this.addEnergyField();

        // Add data corruption waves
        this.addCorruptionWaves();

        // Add quantum fluctuations
        this.addQuantumFluctuations();
    }

    addChromaticPulse() {
        const pulseOverlay = document.createElement('div');
        pulseOverlay.className = 'chromatic-pulse';
        pulseOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 2;
            mix-blend-mode: screen;
            background: linear-gradient(45deg,
                transparent 30%,
                rgba(255,0,0,0.03) 35%,
                transparent 40%,
                transparent 60%,
                rgba(0,255,255,0.03) 65%,
                transparent 70%);
            background-size: 200% 200%;
        `;
        document.body.appendChild(pulseOverlay);

        gsap.to(pulseOverlay, {
            backgroundPosition: '200% 200%',
            duration: 8,
            repeat: -1,
            ease: 'none'
        });
    }

    addDigitalArtifacts() {
        const createArtifact = () => {
            const artifact = document.createElement('div');
            const types = ['horizontal', 'vertical', 'diagonal'];
            const type = types[Math.floor(Math.random() * types.length)];

            artifact.style.cssText = `
                position: fixed;
                pointer-events: none;
                z-index: 3;
                opacity: ${Math.random() * 0.2 + 0.05};
            `;

            if (type === 'horizontal') {
                artifact.style.width = '100%';
                artifact.style.height = Math.random() * 2 + 0.5 + 'px';
                artifact.style.top = Math.random() * window.innerHeight + 'px';
                artifact.style.background = `linear-gradient(90deg,
                    transparent,
                    rgba(0,255,133,0.3),
                    transparent)`;

                gsap.fromTo(artifact,
                    { x: -window.innerWidth },
                    {
                        x: window.innerWidth,
                        duration: Math.random() * 3 + 2,
                        ease: 'none',
                        onComplete: () => artifact.remove()
                    }
                );
            } else if (type === 'vertical') {
                artifact.style.height = '100%';
                artifact.style.width = Math.random() * 2 + 0.5 + 'px';
                artifact.style.left = Math.random() * window.innerWidth + 'px';
                artifact.style.background = `linear-gradient(180deg,
                    transparent,
                    rgba(255,0,255,0.3),
                    transparent)`;

                gsap.fromTo(artifact,
                    { y: -window.innerHeight },
                    {
                        y: window.innerHeight,
                        duration: Math.random() * 3 + 2,
                        ease: 'none',
                        onComplete: () => artifact.remove()
                    }
                );
            } else {
                artifact.style.width = Math.random() * 150 + 50 + 'px';
                artifact.style.height = '1px';
                artifact.style.background = 'rgba(0,255,255,0.5)';
                artifact.style.transform = 'rotate(' + (Math.random() * 360) + 'deg)';
                artifact.style.left = Math.random() * window.innerWidth + 'px';
                artifact.style.top = Math.random() * window.innerHeight + 'px';

                gsap.to(artifact, {
                    rotation: '+=720',
                    scale: 0,
                    duration: Math.random() * 4 + 2,
                    ease: 'power2.in',
                    onComplete: () => artifact.remove()
                });
            }

            document.body.appendChild(artifact);
        };

        // Create artifacts periodically
        setInterval(() => {
            if (Math.random() > 0.7) {
                createArtifact();
            }
        }, 3000);
    }

    addEnergyField() {
        const imageWrapper = document.querySelector('.image-wrapper');
        if (!imageWrapper) return;

        const energyField = document.createElement('div');
        energyField.className = 'energy-field';
        energyField.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 150%;
            height: 150%;
            border-radius: 50%;
            pointer-events: none;
            background: radial-gradient(circle,
                transparent 20%,
                rgba(0,255,133,0.05) 30%,
                transparent 40%,
                rgba(0,255,133,0.02) 50%,
                transparent 60%);
            filter: blur(3px);
            z-index: -1;
        `;
        imageWrapper.appendChild(energyField);

        // Subtle pulsing energy field
        gsap.to(energyField, {
            scale: 1.1,  // Reduced from 1.3
            opacity: 0.5,
            duration: 4,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });

        // Rotating energy field
        gsap.to(energyField, {
            rotation: 360,
            duration: 30,
            repeat: -1,
            ease: 'none'
        });

        // Second layer of energy
        const energyField2 = energyField.cloneNode();
        energyField2.style.background = `radial-gradient(circle,
            transparent 10%,
            rgba(255,0,255,0.03) 25%,
            transparent 35%,
            rgba(255,0,255,0.01) 45%,
            transparent 55%)`;
        imageWrapper.appendChild(energyField2);

        gsap.to(energyField2, {
            scale: 1.2,  // Reduced from 1.5
            opacity: 0.3,
            duration: 5,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });

        gsap.to(energyField2, {
            rotation: -360,
            duration: 25,
            repeat: -1,
            ease: 'none'
        });
    }

    addCorruptionWaves() {
        const createWave = () => {
            const wave = document.createElement('div');
            wave.style.cssText = `
                position: fixed;
                left: 0;
                width: 100%;
                height: ${Math.random() * 30 + 5}px;
                top: ${Math.random() * window.innerHeight}px;
                pointer-events: none;
                z-index: 4;
                background: repeating-linear-gradient(
                    90deg,
                    transparent,
                    transparent 10px,
                    rgba(255,0,255,0.05) 10px,
                    rgba(255,0,255,0.05) 20px
                );
                transform: scaleY(0.1);
                transform-origin: left center;
                mix-blend-mode: screen;
            `;
            document.body.appendChild(wave);

            // Expand and fade
            gsap.to(wave, {
                scaleY: 1,
                opacity: 0,
                duration: 0.8,
                ease: 'power2.out',
                onComplete: () => wave.remove()
            });
        };

        // Trigger waves periodically
        setInterval(() => {
            if (Math.random() > 0.85) {
                createWave();
                // Sometimes create multiple waves
                if (Math.random() > 0.7) {
                    setTimeout(createWave, 100);
                    setTimeout(createWave, 200);
                }
            }
        }, 4000);
    }

    addQuantumFluctuations() {
        // Create quantum particle effects around the cicada
        const imageWrapper = document.querySelector('.image-wrapper');
        if (!imageWrapper) return;

        const particleContainer = document.createElement('div');
        particleContainer.className = 'quantum-particles';
        particleContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10;
        `;
        imageWrapper.appendChild(particleContainer);

        const createParticle = () => {
            const particle = document.createElement('div');
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 100 + 50;
            const startX = Math.cos(angle) * distance;
            const startY = Math.sin(angle) * distance;

            particle.style.cssText = `
                position: absolute;
                width: 3px;
                height: 3px;
                background: radial-gradient(circle, rgba(0,255,133,0.8) 0%, transparent 70%);
                border-radius: 50%;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                box-shadow: 0 0 10px rgba(0,255,133,0.5);
            `;
            particleContainer.appendChild(particle);

            // Animate particle orbiting
            gsap.fromTo(particle,
                {
                    x: startX,
                    y: startY,
                    scale: 0,
                    opacity: 0
                },
                {
                    x: -startX,
                    y: -startY,
                    scale: 1,
                    opacity: 1,
                    duration: Math.random() * 3 + 2,
                    ease: 'sine.inOut',
                    onComplete: () => {
                        gsap.to(particle, {
                            scale: 0,
                            opacity: 0,
                            duration: 0.5,
                            onComplete: () => particle.remove()
                        });
                    }
                }
            );
        };

        // Create particles periodically
        setInterval(() => {
            if (Math.random() > 0.5) {
                createParticle();
            }
        }, 500);
    }

    phaseMinimal() {
        console.log('⚪ MINIMAL PHASE');

        // Reduce all effects to minimum
        gsap.to('.bg', {
            opacity: 0.03,
            scale: 2.2,  // Reduced from 2.5
            duration: 5,
            ease: 'power2.inOut'
        });

        // Subtle breathing
        gsap.to('.logo-text-wrapper, .image-wrapper, .text-3886', {
            filter: 'brightness(0.8) contrast(0.9)',
            duration: 3,
            yoyo: true,
            repeat: 3,
            ease: 'sine.inOut'
        });
    }

    phaseChaotic() {
        console.log('🌪️ CHAOTIC PHASE');

        // More controlled chaos
        const chaos = () => {
            // Subtle transforms
            const elements = document.querySelectorAll('.logo-text-wrapper, .image-wrapper, .text-3886');

            elements.forEach(el => {
                gsap.to(el, {
                    x: Math.random() * 6 - 3,  // Much smaller movement
                    y: Math.random() * 6 - 3,  // Much smaller movement
                    rotation: Math.random() * 3 - 1.5,  // Smaller rotation
                    scale: 0.99 + Math.random() * 0.02,  // Even smaller scale change
                    duration: 0.2,
                    yoyo: true,
                    repeat: 1,
                    ease: 'power2.inOut'
                });
            });
        };

        // Fewer chaos bursts
        for (let i = 0; i < 8; i++) {  // Reduced from 20
            setTimeout(chaos, i * 300);  // Slower spacing
        }

        // Reset after chaos
        setTimeout(() => {
            gsap.to('.logo-text-wrapper, .image-wrapper, .text-3886', {
                x: 0,
                y: 0,
                rotation: 0,
                scale: 1,
                duration: 1.5,
                ease: 'power2.out'
            });
        }, 3000);
    }

    phaseRetro() {
        console.log('📼 RETRO PHASE');

        // Add CRT TV effect
        const crt = document.createElement('div');
        crt.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9996;
            background: repeating-linear-gradient(
                0deg,
                rgba(0,0,0,0.1) 0px,
                transparent 2px,
                transparent 4px,
                rgba(0,0,0,0.1) 6px
            );
            animation: crtFlicker 0.1s infinite;
        `;
        document.body.appendChild(crt);

        // Add style for CRT flicker
        const style = document.createElement('style');
        style.textContent = `
            @keyframes crtFlicker {
                0% { opacity: 0.9; }
                50% { opacity: 1; }
                100% { opacity: 0.95; }
            }
        `;
        document.head.appendChild(style);

        // Color distortion
        gsap.to(document.body, {
            filter: 'contrast(1.2) saturate(0.8) sepia(0.1)',
            duration: 0.5
        });

        // Remove after phase
        setTimeout(() => {
            crt.remove();
            style.remove();
            gsap.to(document.body, {
                filter: 'none',
                duration: 0.5
            });
        }, 8000);
    }

    // New color-themed phases
    phaseVaporwave() {
        console.log('🌴 VAPORWAVE PHASE');
        window.dispatchEvent(new CustomEvent('animationPhase', { detail: { phase: 'vaporwave' } }));

        // Apply vaporwave color filter
        gsap.to(document.body, {
            filter: 'hue-rotate(45deg) saturate(1.2) contrast(0.95)',
            duration: 2,
            ease: 'power2.inOut'
        });

        // Subtle pink/purple overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg,
                rgba(255, 0, 128, 0.05),
                rgba(128, 0, 255, 0.05));
            pointer-events: none;
            z-index: 9995;
            opacity: 0;
        `;
        document.body.appendChild(overlay);

        gsap.to(overlay, {
            opacity: 0.3,
            duration: 2,
            ease: 'power2.inOut'
        });

        setTimeout(() => {
            gsap.to(overlay, {
                opacity: 0,
                duration: 1,
                onComplete: () => overlay.remove()
            });
            gsap.to(document.body, {
                filter: 'none',
                duration: 2
            });
        }, 10000);
    }

    phaseCyberpunk() {
        console.log('🤖 CYBERPUNK PHASE');
        window.dispatchEvent(new CustomEvent('animationPhase', { detail: { phase: 'cyberpunk' } }));

        // Yellow/cyan color scheme
        gsap.to(document.body, {
            filter: 'contrast(1.2) saturate(0.8)',
            duration: 2,
            ease: 'power2.inOut'
        });

        // Add cyberpunk grid overlay
        const grid = document.createElement('div');
        grid.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image:
                linear-gradient(rgba(255, 255, 0, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px);
            background-size: 50px 50px;
            pointer-events: none;
            z-index: 9994;
            opacity: 0;
        `;
        document.body.appendChild(grid);

        gsap.to(grid, {
            opacity: 0.5,
            duration: 2
        });

        setTimeout(() => {
            gsap.to(grid, {
                opacity: 0,
                duration: 1,
                onComplete: () => grid.remove()
            });
            gsap.to(document.body, {
                filter: 'none',
                duration: 2
            });
        }, 10000);
    }

    phaseNeon() {
        console.log('💫 NEON PHASE');
        window.dispatchEvent(new CustomEvent('animationPhase', { detail: { phase: 'neon' } }));

        // Bright neon colors
        gsap.to(document.body, {
            filter: 'brightness(1.1) saturate(1.5) contrast(1.1)',
            duration: 2,
            ease: 'power2.inOut'
        });

        // Neon glow pulses
        const neonPulse = document.createElement('div');
        neonPulse.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9993;
            box-shadow:
                inset 0 0 100px rgba(0, 255, 255, 0.2),
                inset 0 0 200px rgba(255, 0, 255, 0.1);
            opacity: 0;
        `;
        document.body.appendChild(neonPulse);

        gsap.to(neonPulse, {
            opacity: 0.5,
            duration: 2,
            yoyo: true,
            repeat: 4,
            ease: 'sine.inOut'
        });

        setTimeout(() => {
            neonPulse.remove();
            gsap.to(document.body, {
                filter: 'none',
                duration: 2
            });
        }, 10000);
    }

    phaseAurora() {
        console.log('🌌 AURORA PHASE');
        window.dispatchEvent(new CustomEvent('animationPhase', { detail: { phase: 'aurora' } }));

        // Northern lights gradient
        const aurora = document.createElement('div');
        aurora.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                0deg,
                transparent 60%,
                rgba(0, 255, 133, 0.1) 70%,
                rgba(0, 133, 255, 0.1) 80%,
                rgba(133, 0, 255, 0.1) 90%,
                transparent 100%
            );
            pointer-events: none;
            z-index: 9992;
            opacity: 0;
            transform: translateY(-100%);
        `;
        document.body.appendChild(aurora);

        gsap.timeline()
            .to(aurora, {
                y: '0%',
                opacity: 0.6,
                duration: 3,
                ease: 'power2.inOut'
            })
            .to(aurora, {
                backgroundPosition: '0 100%',
                duration: 8,
                ease: 'sine.inOut'
            })
            .to(aurora, {
                y: '100%',
                opacity: 0,
                duration: 3,
                onComplete: () => aurora.remove()
            });
    }

    destroy() {
        this.phaseRunning = false;
        if (chaosEngine.isInitialized) {
            chaosEngine.destroy();
        }
        textEffects.destroy();
        backgroundAnimator.destroy();
        randomAnimations.destroy();
        extendedAnimations.destroy();

        // Disconnect opacity observer
        if (this.opacityObserver) {
            this.opacityObserver.disconnect();
        }

        // Remove added elements
        document.querySelectorAll('.scanlines, #cyber-grid, #static-noise, .data-streams, .holographic-shimmer, .glitch-lines, .chromatic-pulse, .energy-field, .quantum-particles').forEach(el => el.remove());
    }
    addSubtleColorVariations() {
        // Subtle color shifts for text elements
        const textColorTimeline = gsap.timeline({ repeat: -1 });
        textColorTimeline
            .to('.logo-text, .text-3886', {
                filter: 'hue-rotate(0deg) brightness(100%)',
                duration: 0
            })
            .to('.logo-text, .text-3886', {
                filter: 'hue-rotate(5deg) brightness(103%)',  // Slight warm shift
                duration: 18,
                ease: 'sine.inOut'
            })
            .to('.logo-text, .text-3886', {
                filter: 'hue-rotate(-6deg) brightness(101%)',  // Cool shift
                duration: 15,
                ease: 'sine.inOut'
            })
            .to('.logo-text, .text-3886', {
                filter: 'hue-rotate(3deg) brightness(102%)',   // Back to warm
                duration: 12,
                ease: 'sine.inOut'
            })
            .to('.logo-text, .text-3886', {
                filter: 'hue-rotate(0deg) brightness(100%)',
                duration: 10,
                ease: 'sine.inOut'
            });

        // Very subtle color pulse for cicada logo
        gsap.to('.glow', {
            filter: 'hue-rotate(12deg) saturate(115%) brightness(105%)',
            duration: 12,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });

        // Subtle color shift for grid
        gsap.to('#cyber-grid', {
            filter: 'hue-rotate(20deg)',
            duration: 20,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });
    }
}

// Auto-initialize
console.log('🚀 chaos-init.js module loaded');
const chaosInit = new ChaosInitializer();

// Add immediate console output
console.log('🎬 Starting chaos initialization...');
chaosInit.init();

// Export for external control
window.ChaosControl = {
    setPerformance: (mode) => chaosInit.setPerformanceMode(mode),
    getFPS: () => chaosInit.fps,
    destroy: () => chaosInit.destroy(),
    restart: () => {
        chaosInit.destroy();
        setTimeout(() => chaosInit.init(), 100);
    }
};

console.log('✅ ChaosControl attached to window');