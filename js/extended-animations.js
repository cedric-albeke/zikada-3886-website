import gsap from 'gsap';
import matrixConfig from './matrix-config.js';
import { register as registerEffect, enforceBudget } from './runtime/effects/EffectManager.js';
import { createNodePool } from './runtime/dom/NodePool.js';

class ExtendedAnimations {
    constructor() {
        this.isRunning = false;
        this.currentEffect = null;
        this.container = null;
        this._effectHandle = null;
        this._budgetDisposer = null;
    }

    _installPools() {
        // Placeholder for future pooling of repeaters
    }

    init() {
        this.isRunning = true;
        // Create a single container for extended effects
        this.container = document.querySelector('.extended-effects-root');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'extended-effects-root';
            this.container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:80;';
            document.body.appendChild(this.container);
        }
        // Budget guard: warn if > 800 nodes under container
        this._budgetDisposer = enforceBudget(this.container, 800, ({count,maxNodes}) => {
            console.warn(`ExtendedEffects: node budget exceeded (${count}/${maxNodes}), skipping effect run.`);
        });
        this._installPools();
        this.startExtendedSequence();
        this.addDynamicBackgroundEffects();
        this.add80sRetroEffects();
    }

    startExtendedSequence() {
        const effects = [
            () => this.vhsScanlineGlitch(),
            () => this.dataCorruption(),
            () => this.neonCityLights(),
            () => this.cyberPunkNoise(),
            () => this.matrixRainVariation(),
            () => this.analogTVDistortion(),
            () => this.digitalMeltdown(),
            () => this.holographicInterference(),
            () => this.terminalFlicker(),
            () => this.pixelSortGlitch(),
            () => this.chromaticWave(),
            () => this.dataMoshing(),
            () => this.quantumFlicker()
        ];
        // Register a managed loop: every 8s try an effect 40% of the time
        this._effectHandle = registerEffect(({ every }) => {
            const stopEvery = every(8000, () => {
                if (!this.isRunning) return;
                if (this.container && this.container.querySelectorAll('*').length > 700) return; // soft clamp
                if (Math.random() > 0.6) return; // 40% chance to run
                const effect = effects[Math.floor(Math.random() * effects.length)];
                try { effect(); } catch (e) { /* ignore */ }
            });
            return () => { try { stopEvery(); } catch(_){} };
        });
    }

    vhsScanlineGlitch() {
        // Only 5% chance of executing this effect
        if (Math.random() > 0.05) return;

        // Dispatch event for logo animations to react
        window.dispatchEvent(new CustomEvent('vhsGlitch'));

        // Create VHS-style horizontal distortion
        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 100;
            overflow: hidden;
        `;
        (this.container || document.body).appendChild(container);

        // Multiple scan line tears - minimal count
        for (let i = 0; i < 2; i++) {  // Further reduced to 2
            const scanline = document.createElement('div');
            const height = Math.random() * 10 + 2;
            const y = Math.random() * window.innerHeight;

            scanline.style.cssText = `
                position: absolute;
                left: 0;
                top: ${y}px;
                width: 100%;
                height: ${height}px;
                background: linear-gradient(90deg,
                    transparent,
                    rgba(255,255,255,0.005),  // Ultra minimal
                    rgba(0,255,255,0.01),     // Barely visible
                    rgba(255,0,255,0.01),     // Barely visible
                    transparent);
                mix-blend-mode: multiply;
                transform: translateX(${Math.random() * 20 - 10}px);
            `;
            container.appendChild(scanline);

            gsap.to(scanline, {
                x: Math.random() * 100 - 50,
                opacity: 0,
                duration: Math.random() * 0.5 + 0.1,
                delay: i * 0.05,
                ease: 'steps(5)'
            });
        }

        // Color distortion overlay
        const colorShift = document.createElement('div');
        colorShift.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(0deg,
                rgba(255,0,0,0.005),  // Ultra minimal
                transparent,
                rgba(0,255,0,0.005),  // Ultra minimal
                transparent,
                rgba(0,0,255,0.1));
            mix-blend-mode: screen;
            pointer-events: none;
        `;
        container.appendChild(colorShift);

        gsap.to(colorShift, {
            backgroundPosition: '0 100%',
            duration: 0.2,
            repeat: 3,
            ease: 'none'
        });

        setTimeout(() => container.remove(), 1000);
    }

    synthwaveGrid() {
        const grid = document.createElement('div');
        grid.style.cssText = `
            position: fixed;
            bottom: -50%;
            left: 50%;
            width: 200%;
            height: 100%;
            transform: translateX(-50%) perspective(500px) rotateX(60deg);
            pointer-events: none;
            z-index: 50;
            background-image:
                linear-gradient(rgba(255,0,255,0.3) 2px, transparent 2px),
                linear-gradient(90deg, rgba(0,255,255,0.3) 2px, transparent 2px);
            background-size: 50px 50px;
            opacity: 0;
        `;
        document.body.appendChild(grid);

        gsap.to(grid, {
            opacity: 0.8,
            y: -window.innerHeight * 0.3,
            duration: 1,
            ease: 'power2.out',
            onComplete: () => {
                gsap.to(grid, {
                    opacity: 0,
                    y: -window.innerHeight,
                    duration: 1,
                    delay: 2,
                    ease: 'power2.in',
                    onComplete: () => grid.remove()
                });
            }
        });

        // Add neon sun
        const sun = document.createElement('div');
        sun.style.cssText = `
            position: fixed;
            top: 30%;
            left: 50%;
            width: 200px;
            height: 200px;
            transform: translateX(-50%);
            background: radial-gradient(circle,
                rgba(255,255,0,0.8),
                rgba(255,0,255,0.4),
                transparent);
            border-radius: 50%;
            pointer-events: none;
            z-index: 49;
            filter: blur(2px);
            opacity: 0;
        `;
        document.body.appendChild(sun);

        gsap.to(sun, {
            opacity: 0.6,
            scale: 1.2,  // Reduced from 1.5
            duration: 1,
            ease: 'power2.out',
            onComplete: () => {
                gsap.to(sun, {
                    opacity: 0,
                    scale: 1.5,  // Reduced from 2
                    duration: 1,
                    delay: 2,
                    onComplete: () => sun.remove()
                });
            }
        });
    }

    dataCorruption() {
        // Create corrupted data blocks (clamped)
        const blocks = Math.min(Math.floor(Math.random() * 6 + 4), 10);

        for (let i = 0; i < blocks; i++) {
            const block = document.createElement('div');
            const size = Math.random() * 100 + 20;
            const chars = '01█▓▒░╔╗╚╝║═';
            let text = '';

            for (let j = 0; j < 20; j++) {
                text += chars[Math.floor(Math.random() * chars.length)];
            }

            block.textContent = text;
            block.style.cssText = `
                position: fixed;
                left: ${Math.random() * window.innerWidth}px;
                top: ${Math.random() * window.innerHeight}px;
                color: ${Math.random() > 0.5 ? '#00ff85' : '#ff00ff'};
                font-family: monospace;
                font-size: ${Math.random() * 20 + 10}px;
                pointer-events: none;
                z-index: 100;
                opacity: ${Math.random() * 0.8 + 0.2};
                transform: skewY(${Math.random() * 20 - 10}deg);
                text-shadow: 0 0 10px currentColor;
                mix-blend-mode: screen;
            `;
            (this.container || document.body).appendChild(block);

            gsap.to(block, {
                x: Math.random() * 200 - 100,
                y: Math.random() * 200 - 100,
                opacity: 0,
                rotation: Math.random() * 90 - 45,
                duration: Math.random() * 2 + 0.5,
                ease: 'power2.out',
                onComplete: () => block.remove()
            });
        }
    }

    neonCityLights() {
        // Create neon light streaks
        for (let i = 0; i < 8; i++) {
            const light = document.createElement('div');
            const isVertical = Math.random() > 0.5;

            if (isVertical) {
                light.style.cssText = `
                    position: fixed;
                    left: ${Math.random() * window.innerWidth}px;
                    top: -100px;
                    width: 2px;
                    height: ${Math.random() * 200 + 100}px;
                    background: linear-gradient(180deg,
                        transparent,
                        ${Math.random() > 0.5 ? '#ff00ff' : '#00ffff'},
                        transparent);
                    box-shadow: 0 0 20px currentColor;
                    pointer-events: none;
                    z-index: 60;
                    filter: blur(1px);
                `;

                gsap.to(light, {
                    y: window.innerHeight + 200,
                    duration: Math.random() * 2 + 1,
                    delay: i * 0.1,
                    ease: 'none',
                    onComplete: () => light.remove()
                });
            } else {
                light.style.cssText = `
                    position: fixed;
                    left: -100px;
                    top: ${Math.random() * window.innerHeight}px;
                    width: ${Math.random() * 200 + 100}px;
                    height: 2px;
                    background: linear-gradient(90deg,
                        transparent,
                        ${Math.random() > 0.5 ? '#ffff00' : '#00ff85'},
                        transparent);
                    box-shadow: 0 0 20px currentColor;
                    pointer-events: none;
                    z-index: 60;
                    filter: blur(1px);
                `;

                gsap.to(light, {
                    x: window.innerWidth + 200,
                    duration: Math.random() * 2 + 1,
                    delay: i * 0.1,
                    ease: 'none',
                    onComplete: () => light.remove()
                });
            }

        (this.container || document.body).appendChild(light);
        }
    }

    retroComputerBoot() {
        // Create old computer boot sequence effect
        const terminal = document.createElement('div');
        // Load terminal messages from config
        const messages = matrixConfig.terminalMessages;

        terminal.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            text-shadow: 0 0 5px #00ff00;
            pointer-events: none;
            z-index: 200;
        `;
        document.body.appendChild(terminal);

        let messageIndex = 0;
        const typeMessage = () => {
            if (messageIndex < messages.length) {
                terminal.textContent += messages[messageIndex] + '\n';
                messageIndex++;
                setTimeout(typeMessage, 200);
            } else {
                gsap.to(terminal, {
                    opacity: 0,
                    duration: 1,
                    delay: 1,
                    onComplete: () => terminal.remove()
                });
            }
        };

        typeMessage();
    }

    glitchArtEffect() {
        // Create artistic glitch patterns
        const canvas = document.createElement('canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            pointer-events: none;
            z-index: 80;
            opacity: 0.5;
            mix-blend-mode: difference;
        `;

        const ctx = canvas.getContext('2d');

        // Draw random glitch rectangles
        for (let i = 0; i < 50; i++) {
            ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`;
            ctx.fillRect(
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                Math.random() * 200,
                Math.random() * 10
            );
        }

        (this.container || document.body).appendChild(canvas);

        gsap.to(canvas, {
            opacity: 0,
            duration: 0.5,
            ease: 'steps(10)',
            onComplete: () => canvas.remove()
        });
    }

    cyberPunkNoise() {
        // Cyberpunk style digital noise
        const noise = document.createElement('div');
        noise.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 90;
            opacity: 0;
            background-image: repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(255,0,255,0.03) 10px,
                rgba(255,0,255,0.03) 20px
            ),
            repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 10px,
                rgba(0,255,255,0.03) 10px,
                rgba(0,255,255,0.03) 20px
            );
            mix-blend-mode: screen;
        `;
        (this.container || document.body).appendChild(noise);

        gsap.to(noise, {
            opacity: 1,
            duration: 0.2,
            onComplete: () => {
                gsap.to(noise, {
                    opacity: 0,
                    duration: 0.5,
                    delay: 1,
                    onComplete: () => noise.remove()
                });
            }
        });
    }

    matrixRainVariation() {
        // Different style of matrix rain (clamped columns)
        const columns = Math.min(Math.floor(window.innerWidth / 30), 25);

        for (let i = 0; i < columns; i++) {
            const drop = document.createElement('div');
            const chars = '日ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ';
            const char = chars[Math.floor(Math.random() * chars.length)];

            drop.textContent = char;
            drop.style.cssText = `
                position: fixed;
                left: ${i * 30}px;
                top: -50px;
                color: #9333ea;
                font-family: monospace;
                font-size: 20px;
                text-shadow: 0 0 10px rgba(147, 51, 234, 0.4);
                pointer-events: none;
                z-index: 40;
                opacity: ${Math.random() * 0.3 + 0.3};
            `;
            document.body.appendChild(drop);

            gsap.to(drop, {
                y: window.innerHeight + 100,
                duration: Math.random() * 5 + 3,
                delay: Math.random() * 2,
                ease: 'none',
                onComplete: () => drop.remove()
            });
        }
    }

    analogTVDistortion() {
        // Old TV distortion effect
        const distortion = document.createElement('div');
        distortion.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 95;
            background: repeating-linear-gradient(
                0deg,
                rgba(0,0,0,0.1) 0px,
                transparent 1px,
                transparent 2px,
                rgba(0,0,0,0.1) 3px
            );
        `;
        (this.container || document.body).appendChild(distortion);

        // Add rolling effect
        gsap.to(distortion, {
            backgroundPosition: '0 10px',
            duration: 0.1,
            repeat: 10,
            ease: 'none',
            onComplete: () => distortion.remove()
        });

        // Add color bars
        const colorBars = document.createElement('div');
        colorBars.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg,
                rgba(255,255,255,0.1) 14.28%,
                rgba(255,255,0,0.1) 14.28% 28.57%,
                rgba(0,255,255,0.1) 28.57% 42.86%,
                rgba(0,255,0,0.1) 42.86% 57.14%,
                rgba(255,0,255,0.1) 57.14% 71.43%,
                rgba(255,0,0,0.1) 71.43% 85.71%,
                rgba(0,0,255,0.1) 85.71%);
            pointer-events: none;
            z-index: 94;
            opacity: 0;
            mix-blend-mode: screen;
        `;
        (this.container || document.body).appendChild(colorBars);

        gsap.to(colorBars, {
            opacity: 0.5,
            duration: 0.1,
            yoyo: true,
            repeat: 5,
            onComplete: () => colorBars.remove()
        });
    }

    laserGrid() {
        // Create laser grid effect
        const gridContainer = document.createElement('div');
        gridContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 70;
            perspective: 1000px;
        `;
        (this.container || document.body).appendChild(gridContainer);

        // Horizontal lasers
        for (let i = 0; i < 5; i++) {
            const laser = document.createElement('div');
            laser.style.cssText = `
                position: absolute;
                left: 0;
                top: ${(i + 1) * 20}%;
                width: 100%;
                height: 1px;
                background: linear-gradient(90deg,
                    transparent,
                    #ff00ff,
                    #00ffff,
                    #ff00ff,
                    transparent);
                box-shadow: 0 0 10px currentColor;
                opacity: 0;
                transform: scaleX(0);
            `;
            gridContainer.appendChild(laser);

            gsap.to(laser, {
                scaleX: 1,
                opacity: 0.8,
                duration: 0.3,
                delay: i * 0.1,
                ease: 'power2.out',
                onComplete: () => {
                    gsap.to(laser, {
                        opacity: 0,
                        duration: 0.3,
                        delay: 0.5
                    });
                }
            });
        }

        // Vertical lasers
        for (let i = 0; i < 5; i++) {
            const laser = document.createElement('div');
            laser.style.cssText = `
                position: absolute;
                left: ${(i + 1) * 20}%;
                top: 0;
                width: 1px;
                height: 100%;
                background: linear-gradient(180deg,
                    transparent,
                    #00ff85,
                    #ffff00,
                    #00ff85,
                    transparent);
                box-shadow: 0 0 10px currentColor;
                opacity: 0;
                transform: scaleY(0);
            `;
            gridContainer.appendChild(laser);

            gsap.to(laser, {
                scaleY: 1,
                opacity: 0.8,
                duration: 0.3,
                delay: 0.5 + i * 0.1,
                ease: 'power2.out',
                onComplete: () => {
                    gsap.to(laser, {
                        opacity: 0,
                        duration: 0.3,
                        delay: 0.5
                    });
                }
            });
        }

        setTimeout(() => gridContainer.remove(), 2000);
    }

    digitalMeltdown() {
        // Elements appear to melt/distort - but not the cicada logo
        const elements = document.querySelectorAll('.logo-text-wrapper, .text-3886');

        elements.forEach((el, index) => {
            gsap.to(el, {
                skewY: Math.random() * 5 - 2.5,  // Even more reduced
                // Removed scaleY entirely to prevent distortion
                filter: 'blur(1px) saturate(2)',  // Reduced blur
                duration: 0.2,
                delay: index * 0.1,
                yoyo: true,
                repeat: 3,
                ease: 'power2.inOut',
                onComplete: () => {
                    gsap.set(el, {
                        skewY: 0,
                        filter: 'none'
                    });
                }
            });
        });

        // Slight effect for image-wrapper without scaleY
        const imageWrapper = document.querySelector('.image-wrapper');
        if (imageWrapper) {
            gsap.to(imageWrapper, {
                filter: 'brightness(1.2) saturate(1.5)',
                duration: 0.3,
                yoyo: true,
                repeat: 3,
                ease: 'power2.inOut',
                onComplete: () => {
                    gsap.set(imageWrapper, { filter: 'none' });
                }
            });
        }
    }

    holographicInterference() {
        // Holographic wave interference pattern
        const holo = document.createElement('div');
        holo.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 85;
            background: repeating-conic-gradient(
                from 0deg at 50% 50%,
                transparent 0deg,
                rgba(0,255,255,0.1) 10deg,
                transparent 20deg,
                rgba(255,0,255,0.1) 30deg,
                transparent 40deg
            );
            opacity: 0;
            transform: scale(0);
        `;
        (this.container || document.body).appendChild(holo);

        gsap.to(holo, {
            scale: 1.5,  // Reduced from 2
            opacity: 0.5,
            rotation: 360,
            duration: 2,
            ease: 'power2.out',
            onComplete: () => {
                gsap.to(holo, {
                    scale: 2,  // Reduced from 3
                    opacity: 0,
                    duration: 1,
                    onComplete: () => holo.remove()
                });
            }
        });
    }

    terminalFlicker() {
        // Terminal/CRT flicker effect
        const flicker = document.createElement('div');
        flicker.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 200;
            background: rgba(0,255,0,0.05);
            mix-blend-mode: screen;
        `;
        (this.container || document.body).appendChild(flicker);

        // Reduced flicker intensity and slowed down
        const flickerSequence = [0.8, 0.6, 0.8, 0.7, 0.8];  // Less dramatic changes
        flickerSequence.forEach((opacity, index) => {
            setTimeout(() => {
                flicker.style.opacity = String(opacity * 0.05);  // Very subtle
            }, index * 150);  // Slower timing (was 50ms)
        });

        setTimeout(() => flicker.remove(), 1000);  // Longer duration
    }

    pixelSortGlitch() {
        // Pixel sorting effect
        for (let i = 0; i < 4; i++) {
            const strip = document.createElement('div');
            const y = Math.random() * window.innerHeight;
            const height = Math.random() * 50 + 10;

            strip.style.cssText = `
                position: fixed;
                left: 0;
                top: ${y}px;
                width: 100%;
                height: ${height}px;
                background: linear-gradient(90deg,
                    ${Array.from({ length: 20 }, () =>
                        `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`
                    ).join(', ')});
                pointer-events: none;
                z-index: 75;
                mix-blend-mode: difference;
                transform: translateX(0);
            `;
        (this.container || document.body).appendChild(strip);

            gsap.to(strip, {
                x: Math.random() * 100 - 50,
                opacity: 0,
                duration: Math.random() * 0.5 + 0.2,
                ease: 'steps(10)',
                onComplete: () => strip.remove()
            });
        }
    }


    addDynamicBackgroundEffects() {
        // Continuous dynamic effects for the background
        const pulseBackground = () => {
            if (!this.isRunning) return;

            const bg = document.querySelector('.bg');
            if (bg) {
                gsap.to(bg, {
                    filter: `hue-rotate(${Math.random() * 30}deg) saturate(${1 + Math.random() * 0.5})`,
                    duration: 2,
                    yoyo: true,
                    repeat: 1,
                    ease: 'sine.inOut'
                });
            }

            setTimeout(pulseBackground, Math.random() * 10000 + 5000);
        };

        setTimeout(pulseBackground, 2000);
    }

    add80sRetroEffects() {
        // Continuous 80s aesthetic effects
        const retroWave = () => {
            if (!this.isRunning) return;

            if (Math.random() > 0.7) {
                // DISABLED - Retro flash causes bright overlays
                // Commented out to prevent flashing issues
                /*
                const flash = document.createElement('div');
                flash.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(45deg,
                        rgba(255,0,255,0.1),
                        rgba(0,255,255,0.1));
                    pointer-events: none;
                    z-index: 200;
                    opacity: 0;
                    mix-blend-mode: screen;
                `;
                document.body.appendChild(flash);

                gsap.to(flash, {
                    opacity: 0.2,
                    duration: 0.3,
                    ease: 'power2.inOut',
                    yoyo: true,
                    repeat: 1,
                    onComplete: () => flash.remove()
                });
                */
            }

            setTimeout(retroWave, Math.random() * 15000 + 10000);
        };

        setTimeout(retroWave, 5000);
    }

    chromaticWave() {
        const wave = document.createElement('div');
        wave.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 100;
            background: linear-gradient(45deg,
                rgba(255,0,0,0.1),
                rgba(0,255,0,0.1),
                rgba(0,0,255,0.1));
            mix-blend-mode: screen;
            opacity: 0;
        `;
        (this.container || document.body).appendChild(wave);

        gsap.to(wave, {
            opacity: 0.3,
            backgroundPosition: '200% 200%',
            duration: 3,
            ease: 'power2.inOut',
            onComplete: () => wave.remove()
        });
    }

    dataMoshing() {
        const mosh = document.createElement('div');
        mosh.style.cssText = `
            position: fixed;
            top: ${Math.random() * 50}%;
            left: 0;
            width: 100%;
            height: ${Math.random() * 200 + 100}px;
            pointer-events: none;
            z-index: 150;
            background: repeating-linear-gradient(
                90deg,
                transparent 0px,
                rgba(0,255,255,0.2) 2px,
                transparent 4px
            );
            transform: skewY(${Math.random() * 10 - 5}deg);
            opacity: 0;
        `;
        (this.container || document.body).appendChild(mosh);

        gsap.to(mosh, {
            opacity: 0.6,
            x: '100%',
            duration: 2,
            ease: 'steps(10)',
            onComplete: () => mosh.remove()
        });
    }

    quantumFlicker() {
        // Only 5% chance of executing this effect
        if (Math.random() > 0.05) return;

        const quantum = document.createElement('div');
        quantum.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 120;
            backdrop-filter: invert(0);
        `;
        document.body.appendChild(quantum);

        gsap.to(quantum, {
            backdropFilter: 'invert(0.2)',  // Reduced intensity from 1 to 0.2
            duration: 0.05,
            yoyo: true,
            repeat: 2,  // Reduced from 5 to 2
            ease: 'none',
            onComplete: () => quantum.remove()
        });
    }

    destroy() {
        this.isRunning = false;
        try { this._effectHandle?.stop?.(); } catch(_){}
        try { this._budgetDisposer?.(); } catch(_){}
        // Remove container contents but keep the root for reuse
        if (this.container) {
            try { this.container.querySelectorAll('*').forEach(n=>n.remove()); } catch(_){}
        }
    }
}

export default new ExtendedAnimations();