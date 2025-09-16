import gsap from 'gsap';

class MatrixMessages {
    constructor() {
        this.messages = [
            'WELC0ME, NPC',
            'Y0U ARE 1N A S1MULAT10N',
            'REAL1TY 1S C0RRUPTED',
            'C0NNECT1NG T0 THE GR1D',
            'D1G1TAL C0NSC10USNESS',
            'BREAK1NG THE 4TH WALL',
            'QUANTUM ENTANGLEMENT',
            'N0 ESCAPE FR0M THE MATR1X',
            '3886 1S WATCH1NG',
            'Z1KADA L1VES',
            'ENCRYPT10N FA1LED',
            'ACCESS DEN1ED',
            'WAKE UP NE0',
            'THE S1GNAL 1S STR0NG',
            'Y0U ARE BE1NG WATCHED',
            'THE C1CADA SPEAKS'
        ];

        this.scrambleChars = '!<>-_\\/[]{}—=+*^?#1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        this.currentMessageIndex = 0;
        this.messageElement = null;
        this.isActive = false;
        this.scrambleInterval = null;
    }

    init() {
        // Create blackout overlay
        this.blackoutElement = document.createElement('div');
        this.blackoutElement.className = 'matrix-blackout';
        document.body.appendChild(this.blackoutElement);

        // Create message container
        this.messageElement = document.createElement('div');
        this.messageElement.className = 'matrix-messages';
        document.body.appendChild(this.messageElement);

        // Style the message element
        this.styleMessages();

        // Start the message cycle
        this.startMessageCycle();

        // Expose to window for testing
        window.matrixMessages = this;
    }

    styleMessages() {
        const style = document.createElement('style');
        style.textContent = `
            /* Blackout overlay - 100% darken everything else */
            .matrix-blackout {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #000000;
                opacity: 0;
                pointer-events: none;
                z-index: 9998;
                transition: opacity 0.2s ease-in-out;
            }

            .matrix-blackout.active {
                opacity: 1;
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
                0% {
                    transform: translate(-50%, -50%) skewX(0deg);
                    clip-path: inset(0 0 0 0);
                }
                10% {
                    transform: translate(-48%, -50%) skewX(5deg);
                    clip-path: inset(10% 0 20% 0);
                }
                20% {
                    transform: translate(-52%, -50%) skewX(-5deg);
                    clip-path: inset(30% 0 10% 0);
                }
                30% {
                    transform: translate(-50%, -50%) skewX(3deg);
                    clip-path: inset(0 0 70% 0);
                }
                40% {
                    transform: translate(-51%, -50%) skewX(-3deg);
                    clip-path: inset(50% 0 20% 0);
                }
                50% {
                    transform: translate(-50%, -50%) skewX(0deg);
                    clip-path: inset(0 0 0 0);
                }
                60% {
                    transform: translate(-49%, -50%) skewX(2deg);
                    clip-path: inset(80% 0 5% 0);
                }
                70% {
                    transform: translate(-50%, -50%) skewX(-1deg);
                    clip-path: inset(0 0 0 0);
                }
                80% {
                    transform: translate(-52%, -50%) skewX(4deg);
                    clip-path: inset(20% 0 60% 0);
                }
                90% {
                    transform: translate(-50%, -50%) skewX(0deg);
                    clip-path: inset(0 0 0 0);
                }
            }

            @keyframes rgbGlitch {
                0%, 100% {
                    text-shadow:
                        2px 0 rgba(255,0,0,0.8),
                        -2px 0 rgba(0,255,255,0.8),
                        0 0 10px rgba(0, 255, 133, 0.5);
                }
                25% {
                    text-shadow:
                        -3px 0 rgba(255,0,255,0.8),
                        3px 0 rgba(0,255,0,0.8),
                        0 0 20px rgba(255, 0, 255, 0.5);
                }
                50% {
                    text-shadow:
                        0 2px rgba(0,0,255,0.8),
                        0 -2px rgba(255,255,0,0.8),
                        0 0 15px rgba(0, 255, 255, 0.5);
                }
                75% {
                    text-shadow:
                        4px 0 rgba(255,0,0,0.8),
                        -4px 0 rgba(0,255,255,0.8),
                        0 0 25px rgba(255, 255, 0, 0.5);
                }
            }

            .matrix-messages.glitching {
                animation:
                    analogTear 0.15s infinite steps(10),
                    rgbGlitch 0.1s infinite;
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

                // Add final glitch burst
                setTimeout(() => {
                    element.classList.add('glitching');
                    setTimeout(() => {
                        element.classList.remove('glitching');
                    }, 150);
                }, 1500);

                // Keep message visible for a moment
                setTimeout(() => {
                    this.fadeOutMessage();
                }, 2500);
            }
            iterations++;
        }, 15); // Faster scramble
    }

    fadeOutMessage() {
        // Trigger ending reactive effects
        this.triggerReactiveEffects('end');

        // Glitch out effect
        this.messageElement.style.transform = 'translate(-50%, -50%) scaleY(0.1)';
        this.messageElement.style.filter = 'blur(10px)';

        setTimeout(() => {
            this.messageElement.style.opacity = '0';
            this.messageElement.classList.remove('active');
            // Remove blackout
            this.blackoutElement.classList.remove('active');
            this.isActive = false;

            // Restore elements after glitch
            this.restoreElements();
        }, 100);
    }

    showMessage() {
        if (this.isActive) return;

        this.isActive = true;
        // Use random selection instead of sequential
        const randomIndex = Math.floor(Math.random() * this.messages.length);
        const message = this.messages[randomIndex];
        console.log('📢 Showing matrix message:', message);

        // Trigger reactive effects on other elements
        this.triggerReactiveEffects('start');

        // Activate blackout immediately
        this.blackoutElement.classList.add('active');

        // HEAVY ANALOG TV GLITCH - Chromatic aberration + horizontal tear
        this.createAnalogGlitch();

        // Reset message element
        this.messageElement.style.opacity = '0';
        this.messageElement.classList.add('active');

        // VIOLENT DIGITAL TEAR IN with enhanced glitch
        setTimeout(() => {
            // Create data burst explosion
            this.createDataBurst();

            // Create multiple glitch echo layers
            const glitchLayers = [];
            for (let i = 0; i < 3; i++) {
                const layer = this.messageElement.cloneNode(true);
                layer.style.position = 'fixed';
                layer.style.opacity = '0.4';
                layer.style.mixBlendMode = i % 2 === 0 ? 'screen' : 'difference';
                layer.style.color = '#ffffff';  // Monochrome white only, no rainbow colors
                layer.style.zIndex = '9997';
                document.body.appendChild(layer);
                glitchLayers.push(layer);
            }

            // Static TV-like glitch-in sequence (monochrome)
            const glitchSteps = [
                { delay: 0, transform: 'translate(-50%, -50%) scaleY(0.01) scaleX(50) rotate(90deg)', filter: 'blur(20px) brightness(2) contrast(3)', opacity: '0' },
                { delay: 10, transform: 'translate(-50%, -50%) scaleY(50) scaleX(0.01) rotate(-90deg)', filter: 'blur(15px) brightness(0.3)', opacity: '1' },
                { delay: 20, transform: 'translate(-30%, -50%) scaleY(0.5) scaleX(3) skewX(45deg)', filter: 'blur(10px) brightness(2) invert(1)', opacity: '1' },
                { delay: 30, transform: 'translate(-70%, -50%) scaleY(3) scaleX(0.5) skewX(-45deg) rotate(5deg)', filter: 'blur(8px) brightness(0.5)', opacity: '1' },
                { delay: 40, transform: 'translate(-50%, -30%) scaleY(1.5) scaleX(1.5) rotate(-5deg) skewY(10deg)', filter: 'blur(5px) brightness(1.5) contrast(2)', opacity: '1' },
                { delay: 50, transform: 'translate(-50%, -70%) scaleY(0.8) scaleX(1.2) skewY(-10deg)', filter: 'blur(3px) brightness(1.3)', opacity: '1' },
                { delay: 60, transform: 'translate(-45%, -50%) scaleY(1.2) scaleX(0.8) rotate(3deg)', filter: 'blur(2px) brightness(1.2)', opacity: '1' },
                { delay: 70, transform: 'translate(-55%, -50%) scaleY(0.9) scaleX(1.1) rotate(-2deg)', filter: 'blur(1px) brightness(1.1)', opacity: '1' },
                { delay: 80, transform: 'translate(-50%, -50%) scaleX(1) scaleY(1)', filter: 'brightness(1.2)', opacity: '1' },
                { delay: 90, transform: 'translate(-50%, -50%) scaleX(1) scaleY(1)', filter: 'none', opacity: '1' }
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
                        // Remove echo layers with burst effect
                        glitchLayers.forEach((layer, index) => {
                            gsap.to(layer, {
                                scale: 2,
                                opacity: 0,
                                rotation: Math.random() * 360,
                                duration: 0.3,
                                delay: index * 0.05,
                                ease: 'power2.out',
                                onComplete: () => layer.remove()
                            });
                        });
                        this.scrambleText(this.messageElement, message);
                    }
                }, step.delay);
            });

            // Add screen distortion
            this.distortScreen();
        }, 30);
    }

    createAnalogGlitch() {
        // Create horizontal scan lines
        const scanLine = document.createElement('div');
        scanLine.style.cssText = `
            position: fixed;
            width: 100%;
            height: 3px;
            background: white;
            opacity: 0.8;
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
            onComplete: () => scanLine.remove()
        });

        // Create RGB split overlay
        const rgbSplit = document.createElement('div');
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
            const band = document.createElement('div');
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
                ease: 'steps(2)'  // Choppy, TV-like
            });
        }

        document.body.appendChild(rgbSplit);
        setTimeout(() => rgbSplit.remove(), 300);

        // Static noise burst
        const staticNoise = document.createElement('canvas');
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
        staticNoise.width = window.innerWidth;
        staticNoise.height = window.innerHeight;

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
            onComplete: () => staticNoise.remove()
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

            // Logo and cicada image distort and glitch
            if (logoWrapper) {
                gsap.to(logoWrapper, {
                    scale: 0.8,
                    skewX: Math.random() * 20 - 10,
                    skewY: Math.random() * 10 - 5,
                    rotation: Math.random() * 10 - 5,
                    filter: 'blur(2px) saturate(0) brightness(0.5)',
                    duration: 0.1,
                    repeat: 3,
                    yoyo: true,
                    ease: 'steps(3)',
                    onComplete: () => {
                        gsap.to(logoWrapper, {
                            scale: 0.9,
                            skewX: 0,
                            skewY: 0,
                            rotation: 0,
                            filter: 'blur(0.5px) saturate(0.3) brightness(0.7)',
                            duration: 0.2
                        });
                    }
                });
            }

            if (imageWrapper) {
                gsap.to(imageWrapper, {
                    scale: 1.2,
                    rotation: '+=45',
                    filter: 'blur(3px) contrast(3) brightness(2)',
                    duration: 0.05,
                    repeat: 5,
                    yoyo: true,
                    ease: 'steps(2)',
                    onComplete: () => {
                        gsap.to(imageWrapper, {
                            scale: 0.85,
                            filter: 'blur(1px) contrast(0.5) brightness(0.6)',
                            duration: 0.3
                        });
                    }
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
                // 3886 text glitches hard
                gsap.to(text3886, {
                    x: Math.random() * 100 - 50,
                    y: Math.random() * 50 - 25,
                    scale: Math.random() * 0.5 + 0.5,
                    filter: 'blur(5px)',
                    opacity: 0.2,
                    duration: 0.1,
                    repeat: 3,
                    yoyo: true,
                    ease: 'steps(5)',
                    onComplete: () => {
                        gsap.to(text3886, {
                            x: 0,
                            y: 0,
                            scale: 1,
                            filter: 'none',
                            opacity: 0.3,
                            duration: 0.2
                        });
                    }
                });
            }

            // Very subtle screen vibration
            // this.shakeScreen();  // Disabled for now

        } else if (phase === 'end') {
            // Snap-back when message ends

            if (logoWrapper) {
                gsap.to(logoWrapper, {
                    scale: 1.3,
                    rotation: Math.random() * 20 - 10,
                    filter: 'blur(0px) saturate(3) brightness(2)',
                    duration: 0.05,
                    ease: 'power4.out',
                    onComplete: () => {
                        gsap.to(logoWrapper, {
                            scale: 1.05,
                            rotation: 0,
                            filter: 'blur(0px) saturate(1.5) brightness(1.2)',
                            duration: 0.1,
                            yoyo: true,
                            repeat: 1
                        });
                    }
                });
            }

            if (imageWrapper) {
                gsap.to(imageWrapper, {
                    scale: 0.7,
                    rotation: '-=90',
                    filter: 'blur(10px) saturate(0)',
                    duration: 0.05,
                    onComplete: () => {
                        gsap.to(imageWrapper, {
                            scale: 1.1,
                            filter: 'blur(0px) saturate(2) brightness(1.5)',
                            duration: 0.15,
                            ease: 'back.out(3)'
                        });
                    }
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
                // 3886 bounces back
                gsap.to(text3886, {
                    scale: 2,
                    filter: 'blur(0px) brightness(3)',
                    duration: 0.05,
                    onComplete: () => {
                        gsap.to(text3886, {
                            scale: 1.2,
                            filter: 'blur(0px) brightness(1.5)',
                            duration: 0.1,
                            ease: 'elastic.out(1, 0.3)'
                        });
                    }
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

        const restoreDuration = 0.8;

        if (logoWrapper) {
            gsap.to(logoWrapper, {
                scale: 1,
                rotation: 0,
                skewX: 0,
                skewY: 0,
                filter: 'none',
                opacity: 1,  // Ensure logo wrapper stays fully visible
                x: 0,
                y: 0,
                duration: restoreDuration,
                ease: 'power2.inOut'
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
        const burst = document.createElement('div');
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
            onComplete: () => burst.remove()
        });

        // 3. Subtle glitch blocks - less colorful
        for (let i = 0; i < 8; i++) {  // Reduced from 20
            const glitchBlock = document.createElement('div');
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
                onComplete: () => glitchBlock.remove()
            });
        }

        // 4. REMOVED - Confetti/sparks effect disabled
        /*
        for (let i = 0; i < 20; i++) {
            // Radial scanlines removed - looked like confetti
        }
        */

        // 5. VHS static burst
        const staticBurst = document.createElement('canvas');
        staticBurst.width = window.innerWidth;
        staticBurst.height = window.innerHeight;
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
            onComplete: () => staticBurst.remove()
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
                backdropFilter: 'blur(5px) contrast(2) brightness(1.5)',
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
                backdropFilter: 'blur(8px) contrast(3) saturate(0)',
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

    startMessageCycle() {
        // Show a message every 30-50 seconds (50% less frequent)
        const showRandomMessage = () => {
            this.showMessage();

            // Schedule next message
            const nextDelay = Math.random() * 20000 + 30000; // 30-50 seconds
            setTimeout(showRandomMessage, nextDelay);
        };

        // Start after initial delay
        setTimeout(showRandomMessage, 10000);
    }

    testMessage() {
        console.log('🧪 Testing matrix message...');
        this.showMessage();
    }

    destroy() {
        if (this.scrambleInterval) {
            clearInterval(this.scrambleInterval);
        }
        this.isActive = false;
    }
}

export default new MatrixMessages();