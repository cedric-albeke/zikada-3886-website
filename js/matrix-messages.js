import gsap from 'gsap';
import MATRIX_MESSAGES from './matrix-message-pool.js';
const DEBUG_MATRIX = false;

class MatrixMessages {
    constructor() {
        this.messages = MATRIX_MESSAGES;

        this.scrambleChars = '!<>-_\\/[]{}—=+*^?#1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        this.currentMessageIndex = 0;
        this.messageElement = null;
        this.isActive = false;
        this.scrambleInterval = null;
        this.diceCountdown = 15;
        this.lastRoll = null;

        // Simple element pools to reduce GC churn
        this._divPool = [];
        this._canvasPool = [];
    }

    createBlackoutElement() {
        // Prefer the shared blackout overlay if available
        const shared = document.getElementById('viz-blackout');
        if (shared) {
            this.blackoutElement = shared;
            return;
        }
        // Fallback: create a single shared overlay with the same id
        this.blackoutElement = document.createElement('div');
        this.blackoutElement.id = 'viz-blackout';
        this.blackoutElement.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: #000000 !important;
            opacity: 0;
            pointer-events: none !important;
            z-index: 9998 !important;
            transition: opacity 180ms linear;
        `;
        document.body.appendChild(this.blackoutElement);
    }

    init() {
        // Create blackout overlay
        this.createBlackoutElement();

        // Create message container
        this.messageElement = document.createElement('div');
        this.messageElement.className = 'matrix-messages';
        document.body.appendChild(this.messageElement);

        // Style the message element
        this.styleMessages();

        // Do NOT auto-start internal dice/message cycle here.
        // Messages are driven by the control panel via vj-receiver to keep both views in sync.

        // Expose to window for testing
        window.matrixMessages = this;
    }

    styleMessages() {
        const style = document.createElement('style');
        style.textContent = `
            /* Blackout overlay - 100% darken everything else */
            .matrix-blackout {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: #000000 !important;
                opacity: 0;
                pointer-events: none !important;
                z-index: 9998 !important;
                transition: opacity 0.4s ease-in-out;
                display: none;
            }

            .matrix-blackout.active {
                opacity: 0.85 !important;  /* Semi-transparent blackout - allows some see-through */
                display: block !important;
            }

            .matrix-messages {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-family: 'Inconsolata', monospace;
                font-size: 1.4rem;
                font-weight: 700;
                color: #00ffa3;
                text-align: center;
                letter-spacing: 0.3em;
                text-shadow:
                    0 0 10px #00ff85,
                    0 0 20px #00ff8580;
                opacity: 0;
                white-space: nowrap;
                pointer-events: none;
                z-index: 9999;
                text-transform: uppercase;
            }

            .matrix-messages.active {
                opacity: 1;
            }

            .text-3886 {
                text-align: center;
                font-family: Anta, sans-serif;
                font-size: 3rem;
                position: relative;
                z-index: 50;
            }

            .text-3886 .text-span {
                color: var(--bg-accent);
                letter-spacing: 0.2em;
                -webkit-text-stroke-width: 1.3886px;
                -webkit-text-stroke-color: #006e37;
                text-shadow: 0 3px 5px var(--secondary-green);
                font-size: 3rem;
            }

            @keyframes analogTear {
                0%, 100% {
                    transform: translate(-50%, -50%) skewX(0deg);
                    clip-path: inset(0 0 0 0);
                }
                25% {
                    transform: translate(-49.5%, -50%) skewX(0.5deg);
                    clip-path: inset(5% 0 5% 0);
                }
                50% {
                    transform: translate(-50.5%, -50%) skewX(-0.5deg);
                    clip-path: inset(2% 0 2% 0);
                }
                75% {
                    transform: translate(-50%, -50%) skewX(0.2deg);
                    clip-path: inset(1% 0 1% 0);
                }
            }

            @keyframes rgbGlitch {
                0%, 100% {
                    text-shadow:
                        1px 0 rgba(0,255,133,0.4),
                        -1px 0 rgba(0,255,133,0.4),
                        0 0 10px rgba(0, 255, 133, 0.6);
                }
                50% {
                    text-shadow:
                        2px 0 rgba(0,255,133,0.3),
                        -2px 0 rgba(0,255,133,0.3),
                        0 0 15px rgba(0, 255, 133, 0.8);
                }
            }

            .matrix-messages.glitching {
                animation:
                    analogTear 0.5s ease-in-out 1,  /* Single smooth tear */
                    rgbGlitch 0.3s ease-in-out 1;  /* Single subtle glitch */
            }
        `;
        document.head.appendChild(style);
    }

    scrambleText(element, text, duration = 1000) {
        const chars = text.split('');
        const scrambleChars = this.scrambleChars.split('');
        let iterations = 0;
        const maxIterations = text.length * 3;

        element.textContent = '';
        element.classList.add('active', 'glitching');

        this.scrambleInterval = setInterval(() => {
            element.textContent = chars
                .map((char, index) => {
                    if (char === ' ') return ' ';
                    if (index < iterations / 3) {
                        return text[index];
                    }
                    return scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
                })
                .join('');

            if (iterations >= maxIterations) {
                clearInterval(this.scrambleInterval);
                element.textContent = text;
                element.classList.remove('glitching');

                // Removed final glitch burst to reduce strobe
                // No more flashing at the end

                // Keep message visible for a moment
                setTimeout(() => {
                    this.fadeOutMessage();
                }, 2500);
            }
            iterations++;
        }, 25); // Smoother scramble speed
    }

    fadeOutMessage() {
        // Trigger ending reactive effects
        this.triggerReactiveEffects('end');

        // Smooth fade out effect with subtle glitch
        gsap.timeline()
            .to(this.messageElement, {
                scale: 1.02,
                filter: 'blur(0.5px) brightness(1.2)',
                duration: 0.1,
                ease: 'power2.in'
            })
            .to(this.messageElement, {
                scaleY: 0.02,
                opacity: 0,
                filter: 'blur(8px) brightness(1.2)',  // Reduced from 2 to avoid white flash
                duration: 0.3,
                ease: 'power3.in',
                onComplete: () => {
                    this.messageElement.classList.remove('active');
                    this.messageElement.style.opacity = '0';
                    // Force immediate blackout removal
                    if (this.blackoutElement) {
                        // Kill any existing animations on blackout
                        try { gsap.killTweensOf(this.blackoutElement); } catch(_) {}
                        // Animate fade out
                        gsap.to(this.blackoutElement, {
                            opacity: 0,
                            duration: 0.4,
                            ease: 'power2.inOut',
                            onComplete: () => {
                                // For shared overlay, do not remove from DOM
                                this.blackoutElement.style.display = 'none';
                                this.blackoutElement.style.opacity = '0';
                            }
                        });
                    }
                    this.isActive = false;
                    // Clear failsafe since we completed normally
                    if (this.failsafeTimeout) {
                        clearTimeout(this.failsafeTimeout);
                        this.failsafeTimeout = null;
                    }
                    this.restoreElements();
                }
            });
    }

    showMessage(forcedMessage) {
        if (this.isActive) return;

        this.isActive = true;
        // Clear any existing failsafe timeout
        if (this.failsafeTimeout) {
            clearTimeout(this.failsafeTimeout);
        }
        
        // Set failsafe cleanup after 10 seconds (message should complete in ~5 seconds)
        this.failsafeTimeout = setTimeout(() => {
            console.log('⚠️ Matrix message failsafe cleanup triggered');
            this.forceCleanup();
        }, 10000);
        
        // Use externally provided message if present; otherwise fallback to a random one
        let message = typeof forcedMessage === 'string' && forcedMessage.trim().length > 0
            ? forcedMessage.trim()
            : this.messages[Math.floor(Math.random() * this.messages.length)];
        console.log('📢 Showing matrix message:', message);

        // Ensure blackout element exists and is properly styled
        if (!this.blackoutElement) {
            this.createBlackoutElement();
        }

        // Trigger reactive effects on other elements
        this.triggerReactiveEffects('start');

        // Activate blackout with semi-transparent overlay (shared overlay friendly)
        if (this.blackoutElement) {
            try { gsap.killTweensOf(this.blackoutElement); } catch(_) {}
            this.blackoutElement.style.display = 'block';
            gsap.to(this.blackoutElement, { opacity: 0.85, duration: 0.4, ease: 'power2.inOut' });
            this.blackoutElement.style.background = 'rgba(0, 0, 0, 0.95)';
        }

        // Subtle entrance effect - removed heavy glitch
        // this.createAnalogGlitch();  // Disabled for less strobe

        // Reset message element
        this.messageElement.style.opacity = '0';
        this.messageElement.classList.add('active');

        // Smooth digital fade in - removed violent effects
        setTimeout(() => {
            // Minimal entrance effect
            // this.createDataBurst();  // Disabled for less strobe

            // Removed glitch echo layers to reduce visual noise
            const glitchLayers = [];

            // Smooth fade-in sequence without aggressive transforms
            const glitchSteps = [
                { delay: 0, transform: 'translate(-50%, -50%) scale(0.95)', filter: 'blur(2px)', opacity: '0' },
                { delay: 30, transform: 'translate(-50%, -50%) scale(0.98)', filter: 'blur(1px)', opacity: '0.5' },
                { delay: 60, transform: 'translate(-50%, -50%) scale(1)', filter: 'blur(0.5px)', opacity: '0.8' },
                { delay: 90, transform: 'translate(-50%, -50%) scale(1)', filter: 'none', opacity: '1' }
            ];

            glitchSteps.forEach(step => {
                setTimeout(() => {
                    this.messageElement.style.opacity = step.opacity;
                    this.messageElement.style.transform = step.transform;
                    this.messageElement.style.filter = step.filter;

                    // Animate echo layers with offset
                    glitchLayers.forEach((layer, index) => {
                        const offset = (index + 1) * 3;
                        layer.style.transform = step.transform.replace(/-50%/g, `${-50 + offset}%`);
                        layer.style.filter = step.filter;
                        layer.style.opacity = String(parseFloat(step.opacity) * 0.3);
                    });

                    // Start scramble on final step
                    if (step.delay === 90) {
                        // Clean up any layers without effects
                        glitchLayers.forEach(layer => layer && layer.remove());
                        this.scrambleText(this.messageElement, message);
                    }
                }, step.delay);
            });

            // Add screen distortion
            this.distortScreen();
        }, 30);
    }

    createAnalogGlitch() {
        // Create horizontal scan lines (pooled)
        const scanLine = this._getDiv();
        scanLine.style.cssText = `
            position: fixed;
            width: 100%;
            height: 3px;
            background: rgba(0, 255, 133, 0.6);  // Changed from white to green
            opacity: 0.3;  // Reduced opacity
            z-index: 10000;
            pointer-events: none;
            top: ${Math.random() * window.innerHeight}px;
        `;
        document.body.appendChild(scanLine);

        // Animate scan line
        gsap.to(scanLine, {
            y: window.innerHeight,
            duration: 0.15,
            ease: 'none',
            onComplete: () => this._releaseDiv(scanLine)
        });

        // Create RGB split overlay
        const rgbSplit = this._getDiv();
        rgbSplit.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            mix-blend-mode: screen;
        `;

        // Add static TV interference bands (monochrome)
        for (let i = 0; i < 5; i++) {
            const band = this._getDiv();
            // More monochrome, static TV-like
            const intensity = Math.random() * 0.2 + 0.1;
            band.style.cssText = `
                position: absolute;
                width: 100%;
                height: ${Math.random() * 30 + 5}px;
                background: linear-gradient(90deg,
                    transparent,
                    rgba(255,255,255,${intensity}),
                    transparent);
                top: ${Math.random() * window.innerHeight}px;
                mix-blend-mode: overlay;
            `;
            rgbSplit.appendChild(band);

            gsap.to(band, {
                x: Math.random() * 10 - 5,  // Much less movement
                opacity: Math.random(),
                duration: 0.05,
                repeat: 4,
                yoyo: true,
                ease: 'steps(2)',  // Choppy, TV-like
                onComplete: () => this._releaseDiv(band)
            });
        }

        document.body.appendChild(rgbSplit);
        setTimeout(() => this._releaseDiv(rgbSplit), 300);

        // Static noise burst
        const staticNoise = this._getCanvas(window.innerWidth, window.innerHeight);
        staticNoise.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10001;
            opacity: 0.5;
        `;

        const ctx = staticNoise.getContext('2d');
        const imageData = ctx.createImageData(staticNoise.width, staticNoise.height);
        const data = imageData.data;

        // Generate static noise
        for (let i = 0; i < data.length; i += 4) {
            const value = Math.random() * 255;
            data[i] = value;     // red
            data[i + 1] = value; // green
            data[i + 2] = value; // blue
            data[i + 3] = Math.random() * 128; // alpha
        }

        ctx.putImageData(imageData, 0, 0);
        document.body.appendChild(staticNoise);

        // Flicker and remove
        gsap.to(staticNoise, {
            opacity: 0,
            duration: 0.2,
            ease: 'steps(5)',
            onComplete: () => this._releaseCanvas(staticNoise)
        });
    }

    triggerReactiveEffects(phase) {
        // Get main elements
        const logoWrapper = document.querySelector('.logo-text-wrapper');
        const imageWrapper = document.querySelector('.image-wrapper');
        const bgElement = document.querySelector('.bg');
        const text3886 = document.querySelector('.text-3886');

        if (phase === 'start') {
            // Violent reaction when message appears

            // Logo subtle fade - no aggressive distortion
            if (logoWrapper) {
                gsap.to(logoWrapper, {
                    scale: 0.95,
                    opacity: 0.1,
                    filter: 'blur(1px) brightness(0.3)',
                    duration: 0.5,
                    ease: 'power2.inOut'
                });
            }

            if (imageWrapper) {
                gsap.to(imageWrapper, {
                    scale: 0.95,
                    opacity: 0.1,
                    filter: 'blur(1px) brightness(0.3)',
                    duration: 0.5,
                    ease: 'power2.inOut'
                });
            }

            if (bgElement) {
                // Background tears and distorts - keep opacity LOW
                gsap.to(bgElement, {
                    scale: 3.2,  // Reduced scale change
                    rotation: '+=15',  // Less rotation
                    opacity: 0.06,  // Keep it subtle even during effects
                    filter: 'blur(3px) hue-rotate(90deg)',  // Less extreme
                    duration: 0.2,
                    ease: 'power2.inOut',
                    onComplete: () => {
                        gsap.to(bgElement, {
                            scale: 2.8,
                            rotation: '-=10',
                            opacity: 0.05,  // Return to subtle
                            filter: 'blur(1px) hue-rotate(45deg)',
                            duration: 0.3
                        });
                    }
                });
            }

            if (text3886) {
                // 3886 text subtle fade
                gsap.to(text3886, {
                    opacity: 0.1,
                    filter: 'blur(1px)',
                    duration: 0.5,
                    ease: 'power2.inOut'
                });
            }

            // Very subtle screen vibration
            // this.shakeScreen();  // Disabled for now

        } else if (phase === 'end') {
            // Gentle restoration when message ends

            if (logoWrapper) {
                gsap.to(logoWrapper, {
                    scale: 1,
                    rotation: 0,
                    opacity: 1,
                    filter: 'none',
                    duration: 1,
                    ease: 'power2.inOut'
                });
            }

            if (imageWrapper) {
                gsap.to(imageWrapper, {
                    scale: 1,
                    rotation: 0,
                    opacity: 1,
                    filter: 'none',
                    duration: 1,
                    ease: 'power2.inOut'
                });
            }

            if (bgElement) {
                // Background snaps back - but keep opacity LOW
                gsap.to(bgElement, {
                    scale: 4,
                    rotation: '+=180',
                    opacity: 0.05,  // Never let it go high!
                    filter: 'blur(0px) hue-rotate(0deg) brightness(1.2)',
                    duration: 0.1,
                    ease: 'power4.out'
                });
            }

            if (text3886) {
                // 3886 gentle restoration
                gsap.to(text3886, {
                    scale: 1,
                    opacity: 1,
                    filter: 'none',
                    duration: 1,
                    ease: 'power2.inOut'
                });
            }

            // Subtle vibration
            // this.shakeScreen(true);  // Disabled for now
        }
    }

    restoreElements() {
        // Smoothly restore all elements to normal
        const logoWrapper = document.querySelector('.logo-text-wrapper');
        const imageWrapper = document.querySelector('.image-wrapper');
        const bgElement = document.querySelector('.bg');
        const text3886 = document.querySelector('.text-3886');

        const restoreDuration = 1.5;  // Slower restoration for smoother transition

        if (logoWrapper) {
            // First restore opacity and basic properties
            gsap.to(logoWrapper, {
                scale: 1,
                rotation: 0,
                skewX: 0,
                skewY: 0,
                opacity: 1,  // Ensure logo wrapper stays fully visible
                x: 0,
                y: 0,
                duration: restoreDuration,
                ease: 'power2.inOut',
                onComplete: () => {
                    // After restoration, reapply current FX settings
                    if (window.fxController) {
                        const distortionValue = window.fxController.intensities.distortion;
                        window.fxController._applySideEffect('distortion', distortionValue);
                    }
                }
            });
        }

        if (imageWrapper) {
            gsap.to(imageWrapper, {
                scale: 1,
                filter: 'none',
                opacity: 1,  // Ensure image wrapper stays fully visible
                duration: restoreDuration,
                ease: 'power2.inOut'
            });

            // Also restore the image itself
            const image = document.querySelector('.image-2');
            if (image) {
                gsap.to(image, {
                    opacity: 1,
                    duration: restoreDuration,
                    ease: 'power2.inOut'
                });
            }
        }

        if (bgElement) {
            gsap.to(bgElement, {
                scale: 3,
                opacity: 0.05,  // Keep it subtle
                filter: 'none',
                duration: restoreDuration,
                ease: 'power2.inOut'
            });
        }

        if (text3886) {
            gsap.to(text3886, {
                x: 0,
                y: 0,
                scale: 1,
                filter: 'none',
                opacity: 1,
                duration: restoreDuration,
                ease: 'power2.inOut'
            });
        }
    }

    shakeScreen(intense = false) {
        const preLoader = document.querySelector('.pre-loader');
        if (!preLoader) return;

        // Much more subtle shake
        const shakeIntensity = intense ? 5 : 2;  // Drastically reduced from 20/10
        const shakeDuration = intense ? 0.15 : 0.1;  // Shorter duration

        gsap.to(preLoader, {
            x: Math.random() * shakeIntensity - shakeIntensity/2,
            y: Math.random() * shakeIntensity - shakeIntensity/2,
            duration: 0.03,
            repeat: Math.floor(shakeDuration / 0.03),
            yoyo: true,
            ease: 'sine.inOut',
            onComplete: () => {
                gsap.set(preLoader, { x: 0, y: 0 });
            }
        });
    }

    createDataBurst() {
        // MASSIVE 80s VHS EXPLOSION

        // 1. VHS tracking lines - MONOCHROME STATIC
        for (let i = 0; i < 5; i++) {
            const trackingLine = document.createElement('div');
            trackingLine.style.cssText = `
                position: fixed;
                left: 0;
                top: ${Math.random() * window.innerHeight}px;
                width: 100%;
                height: ${Math.random() * 20 + 5}px;
                background: linear-gradient(90deg,
                    transparent,
                    rgba(255,255,255,${Math.random() * 0.3 + 0.2}),
                    rgba(255,255,255,${Math.random() * 0.2 + 0.1}),
                    transparent);
                pointer-events: none;
                z-index: 10003;
                mix-blend-mode: overlay;
                filter: blur(0.5px);
            `;
            document.body.appendChild(trackingLine);

            gsap.to(trackingLine, {
                y: Math.random() * 200 - 100,
                scaleY: 0,
                opacity: 0,
                duration: 0.5,
                ease: 'power2.out',
                onComplete: () => trackingLine.remove()
            });
        }

        // 2. Subtle monochrome burst
        const burst = this._getDiv();
        burst.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            width: 100px;
            height: 100px;
            background: radial-gradient(circle,
                rgba(0,255,133,0.3) 0%,
                rgba(0,255,133,0.1) 50%,
                transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 10002;
            transform: translate(-50%, -50%);
            mix-blend-mode: screen;
        `;
        document.body.appendChild(burst);

        // Keep it circular by using the same size for width and height
        const maxDimension = Math.max(window.innerWidth, window.innerHeight) * 1.5;
        gsap.to(burst, {
            width: maxDimension,
            height: maxDimension,
            opacity: 0,
            duration: 0.6,
            ease: 'power3.out',
            onComplete: () => this._releaseDiv(burst)
        });

        // 3. Subtle glitch blocks - less colorful
        for (let i = 0; i < 8; i++) {  // Reduced from 20
            const glitchBlock = this._getDiv();
            const width = Math.random() * 150 + 30;
            const height = Math.random() * 20 + 3;

            glitchBlock.style.cssText = `
                position: fixed;
                left: ${Math.random() * window.innerWidth}px;
                top: ${Math.random() * window.innerHeight}px;
                width: ${width}px;
                height: ${height}px;
                background: rgba(0,255,133,${Math.random() * 0.2 + 0.1});
                pointer-events: none;
                z-index: 10001;
                mix-blend-mode: screen;
                transform: skewX(${Math.random() * 15 - 7.5}deg);
                filter: blur(0.5px);
            `;
            document.body.appendChild(glitchBlock);

            gsap.to(glitchBlock, {
                x: Math.random() * 100 - 50,
                scaleX: 0,
                opacity: 0,
                duration: Math.random() * 0.2 + 0.1,
                ease: 'steps(3)',
                onComplete: () => this._releaseDiv(glitchBlock)
            });
        }

        // 4. REMOVED - Confetti/sparks effect disabled
        /*
        for (let i = 0; i < 20; i++) {
            // Radial scanlines removed - looked like confetti
        }
        */

        // 5. VHS static burst
        const staticBurst = this._getCanvas(window.innerWidth, window.innerHeight);
        staticBurst.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            pointer-events: none;
            z-index: 10004;
            opacity: 0.8;
            mix-blend-mode: screen;
        `;

        const ctx = staticBurst.getContext('2d');
        const imageData = ctx.createImageData(staticBurst.width, staticBurst.height);
        const data = imageData.data;

        // Generate TRUE monochrome static (no color tint)
        for (let i = 0; i < data.length; i += 4) {
            const value = Math.random() * 255;
            data[i] = value;       // red (equal)
            data[i + 1] = value;   // green (equal)
            data[i + 2] = value;   // blue (equal)
            data[i + 3] = Math.random() * 100; // alpha (reduced)
        }
        ctx.putImageData(imageData, 0, 0);
        document.body.appendChild(staticBurst);

        gsap.to(staticBurst, {
            opacity: 0,
            duration: 0.3,
            ease: 'steps(10)',
            onComplete: () => this._releaseCanvas(staticBurst)
        });

        // 6. REMOVED - Chromatic rainbow wave disabled
        // this.createChromaticWave();
    }

    createChromaticWave() {
        const wave = document.createElement('div');
        wave.style.cssText = `
            position: fixed;
            top: 0;
            left: -100%;
            width: 200%;
            height: 100%;
            background: linear-gradient(90deg,
                transparent 0%,
                rgba(255,0,0,0.3) 25%,
                rgba(0,255,0,0.3) 50%,
                rgba(0,0,255,0.3) 75%,
                transparent 100%);
            pointer-events: none;
            z-index: 10005;
            mix-blend-mode: screen;
            transform: skewX(30deg);
        `;
        document.body.appendChild(wave);

        gsap.to(wave, {
            x: window.innerWidth * 2,
            duration: 0.5,
            ease: 'power2.inOut',
            onComplete: () => wave.remove()
        });
    }

    distortScreen() {
        // Create warping screen distortion (skip on low FPS)
        try {
            if (window.performanceBus && typeof window.performanceBus.getAverageFPS === 'function') {
                if (window.performanceBus.getAverageFPS() < 40) return;
            }
        } catch (_) {}
        // Create warping screen distortion
        const distortion = document.createElement('div');
        distortion.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10003;
            backdrop-filter: blur(0px) contrast(1);
            transform: scale(1) perspective(1000px) rotateX(0deg);
        `;
        document.body.appendChild(distortion);

        // Warp sequence
        const timeline = gsap.timeline({
            onComplete: () => distortion.remove()
        });

        timeline
            .to(distortion, {
                backdropFilter: 'blur(5px) contrast(1.5) brightness(1.2)',
                scale: 1.05,
                duration: 0.05
            })
            .to(distortion, {
                backdropFilter: 'blur(2px) contrast(0.5) brightness(0.8)',
                scale: 0.95,
                rotateX: 5,
                duration: 0.05
            })
            .to(distortion, {
                backdropFilter: 'blur(8px) contrast(1.5) saturate(0.7)',  // Reduced contrast to avoid flash
                scale: 1.1,
                rotateX: -5,
                duration: 0.05
            })
            .to(distortion, {
                backdropFilter: 'blur(0px) contrast(1) saturate(1)',
                scale: 1,
                rotateX: 0,
                duration: 0.1,
                ease: 'power2.out'
            });
    }

    // Autonomous dice mode for standalone demos (no control panel)
    enableAutonomousDiceMode() {
        if (this._autoDice) return;
        this._autoDice = true;
        this.diceCountdown = 15;
        if (DEBUG_MATRIX) console.log('🎲 Autonomous MATRIX dice mode: ENABLED');
        // Subscribe to a shared 1Hz ticker to avoid extra intervals
        const sub = this._subscribe1Hz(() => {
            this.diceCountdown--;
            if (this.diceCountdown <= 0) {
                const roll = Math.floor(Math.random() * 100) + 1;
                this.lastRoll = roll;
                if (roll >= 90) {
                    this.showMessage();
                }
                this.diceCountdown = 15;
            }
        });
        this._countdownUnsub = sub;
    }

    disableAutonomousDiceMode() {
        if (!this._autoDice) return;
        this._autoDice = false;
        if (typeof this._countdownUnsub === 'function') this._countdownUnsub();
        if (DEBUG_MATRIX) console.log('🎲 Autonomous MATRIX dice mode: DISABLED');
    }

    testMessage() {
        if (DEBUG_MATRIX) console.log('🧪 Testing matrix message...');
        this.showMessage();
    }
    
    forceCleanup() {
        // Force complete cleanup of matrix elements
        if (DEBUG_MATRIX) console.log('🧹 Force cleaning matrix message elements');
        
        // Clear failsafe timeout
        if (this.failsafeTimeout) {
            clearTimeout(this.failsafeTimeout);
            this.failsafeTimeout = null;
        }
        
        // Kill all animations
        if (this.messageElement) {
            gsap.killTweensOf(this.messageElement);
            this.messageElement.classList.remove('active', 'glitching');
            this.messageElement.style.opacity = '0';
        }
        
        // Remove blackout completely
        if (this.blackoutElement) {
            gsap.killTweensOf(this.blackoutElement);
            this.blackoutElement.classList.remove('active');
            this.blackoutElement.style.display = 'none';
            this.blackoutElement.style.opacity = '0';
            if (this.blackoutElement.parentNode) {
                this.blackoutElement.remove();
            }
            this.blackoutElement = null;
        }
        
        // Clear scramble interval
        if (this.scrambleInterval) {
            clearInterval(this.scrambleInterval);
            this.scrambleInterval = null;
        }
        
        this.isActive = false;
        
        // Force restore all elements to visible
        const elements = [
            '.logo-text-wrapper',
            '.image-wrapper', 
            '.text-3886',
            '.image-2'
        ];
        
        elements.forEach(selector => {
            const el = document.querySelector(selector);
            if (el) {
                el.style.opacity = '1';
                el.style.transform = '';
                // Don't clear filter completely as it might have FX applied
                if (!window.fxController || window.fxController.intensities.distortion === 0) {
                    el.style.filter = '';
                }
            }
        });
        
        // Reapply current FX settings after a short delay
        if (window.fxController) {
            setTimeout(() => {
                Object.keys(window.fxController.intensities).forEach(key => {
                    window.fxController._applySideEffect(key, window.fxController.intensities[key]);
                });
            }, 100);
        }
    }

    destroy() {
        // Clean up scramble interval
        if (this.scrambleInterval) {
            clearInterval(this.scrambleInterval);
            this.scrambleInterval = null;
        }
        
        // Clean up failsafe timeout
        if (this.failsafeTimeout) {
            clearTimeout(this.failsafeTimeout);
            this.failsafeTimeout = null;
        }
        
        // Disable autonomous dice mode (cleans up subscription)
        this.disableAutonomousDiceMode();
        
        // Stop the shared 1Hz ticker if this is the last instance
        if (window.__oneHzTicker) {
            window.__oneHzTicker._stop();
        }
        
        this.isActive = false;
    }
}

export default new MatrixMessages();

// --- Shared simple 1Hz ticker (singleton on window) ---
(function ensureOneHzTicker(){
    if (window.__oneHzTicker) return;
    const subs = new Set();
    
    // Import interval-manager dynamically for managed intervals
    let intervalHandle = null;
    import('./interval-manager.js').then(module => {
        const intervalManager = module.default;
        
        intervalHandle = intervalManager.createInterval(() => {
            subs.forEach(fn => { try { fn(); } catch(_) {} });
        }, 1000, 'matrix-oneHz-ticker', {
            category: 'system',
            maxAge: Infinity // Keep running indefinitely
        });
    }).catch(err => {
        console.warn('Failed to load interval-manager, falling back to raw setInterval:', err);
        // Fallback to raw interval if interval-manager is not available
        intervalHandle = { nativeId: setInterval(() => {
            subs.forEach(fn => { try { fn(); } catch(_) {} });
        }, 1000) };
    });
    
    window.__oneHzTicker = {
        subscribe(fn){ subs.add(fn); return () => subs.delete(fn); },
        _stop(){ 
            if (intervalHandle) {
                if (typeof intervalHandle.clear === 'function') {
                    intervalHandle.clear();
                } else if (intervalHandle.nativeId) {
                    clearInterval(intervalHandle.nativeId);
                }
                intervalHandle = null;
            }
        }
    };
})();

// Instance methods hooking the shared ticker and pools
MatrixMessages.prototype._subscribe1Hz = function(fn){
    return window.__oneHzTicker.subscribe(fn);
};

MatrixMessages.prototype._getDiv = function(){
    return this._divPool.pop() || document.createElement('div');
};

MatrixMessages.prototype._releaseDiv = function(el){
    try { el.remove(); } catch(_) {}
    try { el.removeAttribute('style'); el.className = ''; el.innerHTML=''; } catch(_) {}
    this._divPool.push(el);
};

MatrixMessages.prototype._getCanvas = function(w, h){
    const c = this._canvasPool.pop() || document.createElement('canvas');
    c.width = Math.max(1, Math.floor(w));
    c.height = Math.max(1, Math.floor(h));
    return c;
};

MatrixMessages.prototype._releaseCanvas = function(c){
    try { c.remove(); } catch(_) {}
    this._canvasPool.push(c);
};
