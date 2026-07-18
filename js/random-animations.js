import gsap from 'gsap';
import animationRuntime from './runtime/animation-runtime.js';

const RUNTIME_OWNER = 'random-animations';

class RandomAnimations {
    constructor() {
        this.activeAnimations = new Set();
        this.animationPool = [];
        this.isRunning = false;
        this.lastAnimation = null;

        // CRITICAL FIX: Store interval/timeout IDs for proper cleanup
        this.particleInterval = null;
        this.pulseTimeout = null;
        this.distortTimeout = null;
        this.randomSequenceTimeout = null;
    }

    init() {
        if (this.isRunning) return;
        animationRuntime.disposeOwner(RUNTIME_OWNER);
        this.isRunning = true;
        this.setupAnimationPool();
        this.startRandomSequence();
        this.addAmbientEffects();
    }

    scheduleTimeout(callback, delay) {
        return animationRuntime.scheduleTimeout(RUNTIME_OWNER, callback, delay);
    }

    appendNode(node) {
        node.dataset.randomFx = 'true';
        document.body.appendChild(node);
        return node;
    }

    getProfileScale() {
        if (this.performanceProfile === 'low') return 0.35;
        if (this.performanceProfile === 'medium') return 0.7;
        return 1;
    }

    scaledCount(count, minimum = 1) {
        return Math.max(minimum, Math.round(count * this.getProfileScale()));
    }

    setupAnimationPool() {
        // Pool of random animations that can trigger at any time
        this.animationPool = [
            () => this.dataGlitchWave(),
            () => this.neonPulse(),
            () => this.digitalRain(),
            () => this.colorWave(),
            // Removed pixelStorm - looked like confetti
            () => this.matrixCascade(),
            () => this.electricArc(),
            () => this.hologramFlicker(),
            () => this.warpField(),
            () => this.cyberGlitch(),
            () => this.quantumShift(),
            () => this.plasmaField(),
            () => this.circuitTrace(),
            () => this.dataFragmentation(),
            // New animations
            () => this.warpTunnel(),
            () => this.ripplePulse(),
            () => this.digitalCorruption(),
            () => this.prismaticBurst(),
            () => this.temporalGlitch()
        ];
    }

    triggerRandomAnimation() {
        // CRITICAL FIX: Check if still running before continuing
        if (!this.isRunning) {
            console.log('⏹️ Random animations stopped, not scheduling next trigger');
            return;
        }

        // Random chance to trigger an animation (balanced for resource management)
        const triggerChance = this.performanceProfile === 'low'
            ? 0.14
            : (this.performanceProfile === 'medium' ? 0.28 : 0.4);
        if (Math.random() < triggerChance) {
            // Pick a random animation that isn't the last one
            let animations = this.animationPool.filter(a => a !== this.lastAnimation);
            const randomAnim = animations[Math.floor(Math.random() * animations.length)];
            this.lastAnimation = randomAnim;
            randomAnim();
        }

        // Random delay between 20-40 seconds (increased from 8-20 for balanced resource usage)
        // CRITICAL FIX: Store timeout ID for cleanup
        const cadenceScale = this.performanceProfile === 'low'
            ? 1.6
            : (this.performanceProfile === 'medium' ? 1.25 : 1);
        const nextDelay = (Math.random() * 20000 + 20000) * cadenceScale;
        this.randomSequenceTimeout = this.scheduleTimeout(() => this.triggerRandomAnimation(), nextDelay);
    }

    startRandomSequence() {
        // Start after initial delay
        this.randomSequenceTimeout = this.scheduleTimeout(() => this.triggerRandomAnimation(), 2000);
    }

    dataGlitchWave() {
        const wave = document.createElement('div');
        const height = Math.random() * 100 + 50;
        const startY = Math.random() * (window.innerHeight - height);

        wave.style.cssText = `
            position: fixed;
            left: -100%;
            top: ${startY}px;
            width: 200%;
            height: ${height}px;
            background: linear-gradient(90deg,
                transparent,
                rgba(0,255,133,0.05),
                rgba(255,0,255,0.1),
                rgba(0,255,255,0.05),
                transparent);
            pointer-events: none;
            z-index: 5;
            transform: skewY(${Math.random() * 10 - 5}deg);
            mix-blend-mode: multiply;
        `;
        this.appendNode(wave);

        gsap.to(wave, {
            x: window.innerWidth * 2,
            duration: Math.random() * 2 + 1,
            ease: 'power2.inOut',
            onComplete: () => wave.remove()
        });
    }

    neonPulse() {
        const pulse = document.createElement('div');
        pulse.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            width: 100px;
            height: 100px;
            border: 3px solid rgba(0,255,133,0.8);
            border-radius: 50%;
            pointer-events: none;
            z-index: 6;
            transform: translate(-50%, -50%);
            box-shadow: 0 0 30px rgba(0,255,133,0.5);
        `;
        this.appendNode(pulse);

        // Use same value for width and height to keep it circular
        const targetSize = Math.random() * 500 + 300;
        gsap.to(pulse, {
            width: targetSize,
            height: targetSize,
            opacity: 0,
            borderWidth: 0,
            duration: Math.random() + 0.5,
            ease: 'power2.out',
            onComplete: () => pulse.remove()
        });
    }

    digitalRain() {
        const drops = this.scaledCount(Math.floor(Math.random() * 10 + 5), 3);

        for (let i = 0; i < drops; i++) {
            const drop = document.createElement('div');
            const char = String.fromCharCode(33 + Math.floor(Math.random() * 94));

            drop.textContent = char.repeat(Math.floor(Math.random() * 20 + 10));
            drop.style.cssText = `
                position: fixed;
                left: ${Math.random() * window.innerWidth}px;
                top: -100px;
                color: rgba(147, 51, 234, ${Math.random() * 0.3 + 0.1});
                font-family: monospace;
                font-size: ${Math.random() * 10 + 8}px;
                writing-mode: vertical-rl;
                pointer-events: none;
                z-index: 4;
                text-shadow: 0 0 5px rgba(147, 51, 234, 0.3);
            `;
            this.appendNode(drop);

            gsap.to(drop, {
                y: window.innerHeight + 200,
                duration: Math.random() * 3 + 2,
                ease: 'none',
                delay: i * 0.1,
                onComplete: () => drop.remove()
            });
        }
    }

    geometricPatterns() {
        const shapes = Math.floor(Math.random() * 5 + 3);

        for (let i = 0; i < shapes; i++) {
            const shape = document.createElement('div');
            const size = Math.random() * 100 + 20;
            const isTriangle = Math.random() > 0.5;

            if (isTriangle) {
                shape.style.cssText = `
                    position: fixed;
                    width: 0;
                    height: 0;
                    border-left: ${size/2}px solid transparent;
                    border-right: ${size/2}px solid transparent;
                    border-bottom: ${size}px solid rgba(255,0,255,0.2);
                    pointer-events: none;
                    z-index: 3;
                `;
            } else {
                shape.style.cssText = `
                    position: fixed;
                    width: ${size}px;
                    height: ${size}px;
                    border: 2px solid rgba(0,255,255,0.3);
                    transform: rotate(45deg);
                    pointer-events: none;
                    z-index: 3;
                `;
            }

            shape.style.left = Math.random() * window.innerWidth + 'px';
            shape.style.top = Math.random() * window.innerHeight + 'px';
            this.appendNode(shape);

            gsap.to(shape, {
                rotation: Math.random() * 720 - 360,
                scale: 0,
                opacity: 0,
                duration: Math.random() * 2 + 1,
                delay: i * 0.1,
                ease: 'power2.in',
                onComplete: () => shape.remove()
            });
        }
    }

    colorWave() {
        const overlay = document.createElement('div');
        const hue = Math.random() * 360;

        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(${Math.random() * 360}deg,
                transparent,
                hsla(${hue}, 100%, 50%, 0.05),
                transparent);
            pointer-events: none;
            z-index: 2;
            mix-blend-mode: multiply;
            opacity: 0;
        `;
        this.appendNode(overlay);

        gsap.to(overlay, {
            opacity: 1,
            duration: 0.5,
            onComplete: () => {
                gsap.to(overlay, {
                    opacity: 0,
                    duration: 0.5,
                    delay: 0.2,
                    onComplete: () => overlay.remove()
                });
            }
        });
    }

    // pixelStorm removed - was creating confetti-like effects

    matrixCascade() {
        const cascade = document.createElement('div');
        const width = Math.random() * 100 + 50;
        const x = Math.random() * window.innerWidth;

        cascade.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: -100px;
            width: ${width}px;
            height: 100%;
            background: linear-gradient(180deg,
                rgba(0,255,133,0.3),
                transparent 50%);
            pointer-events: none;
            z-index: 4;
            filter: blur(1px);
            mask-image: repeating-linear-gradient(
                180deg,
                black 0px,
                black 2px,
                transparent 2px,
                transparent 4px
            );
        `;
        this.appendNode(cascade);

        gsap.to(cascade, {
            y: window.innerHeight,
            duration: Math.random() * 2 + 1,
            ease: 'none',
            onComplete: () => cascade.remove()
        });
    }

    electricArc() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 7;
        `;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const startX = Math.random() * window.innerWidth;
        const startY = Math.random() * window.innerHeight;
        const endX = Math.random() * window.innerWidth;
        const endY = Math.random() * window.innerHeight;

        // Create jagged path
        let d = `M ${startX} ${startY}`;
        const segments = 10;
        for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            const x = startX + (endX - startX) * t + (Math.random() - 0.5) * 50;
            const y = startY + (endY - startY) * t + (Math.random() - 0.5) * 50;
            d += ` L ${x} ${y}`;
        }

        path.setAttribute('d', d);
        path.setAttribute('stroke', Math.random() > 0.5 ? '#00ffff' : '#ff00ff');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        path.setAttribute('filter', 'url(#glow)');

        svg.appendChild(path);
        this.appendNode(svg);

        gsap.to(path, {
            opacity: 0,
            strokeWidth: 0,
            duration: 0.3,
            ease: 'power2.out',
            onComplete: () => svg.remove()
        });
    }

    hologramFlicker() {
        const elements = document.querySelectorAll('.logo-text, .image-wrapper, .text-3886');

        elements.forEach((el, index) => {
            gsap.to(el, {
                opacity: 0.3,
                filter: 'brightness(1.1) saturate(0.85)',  // Increased saturation to avoid grey
                duration: 0.05,
                delay: index * 0.02,
                yoyo: true,
                repeat: 3,
                ease: 'steps(2)',
                onComplete: () => {
                    gsap.set(el, {
                        opacity: 1,
                        filter: 'none'
                    });
                }
            });
        });
    }

    warpField() {
        const warp = document.createElement('div');
        warp.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            width: 200px;
            height: 200px;
            border-radius: 50%;
            background: radial-gradient(circle,
                transparent 30%,
                rgba(255,0,255,0.2) 50%,
                transparent 70%);
            pointer-events: none;
            z-index: 6;
            transform: translate(-50%, -50%) scale(0);
            filter: blur(5px);
        `;
        this.appendNode(warp);

        gsap.to(warp, {
            scale: Math.random() * 5 + 3,
            rotation: Math.random() * 360,
            opacity: 0,
            duration: Math.random() * 2 + 1,
            ease: 'power2.out',
            onComplete: () => warp.remove()
        });
    }

    cyberGlitch() {
        // Only 10% chance of executing this effect
        if (Math.random() > 0.1) return;

        // Create subtle glitch effects without visible boxes
        const glitchOverlay = document.createElement('div');
        glitchOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 8;
            backdrop-filter: invert(0);
        `;
        this.appendNode(glitchOverlay);

        gsap.to(glitchOverlay, {
            backdropFilter: 'invert(0.05) hue-rotate(45deg)',  // Reduced from 0.1 to 0.05 and 90deg to 45deg
            duration: 0.05,
            yoyo: true,
            repeat: 1,  // Reduced from 3 to 1
            ease: 'steps(2)',
            onComplete: () => glitchOverlay.remove()
        });
    }

    quantumShift() {
        const shift = document.createElement('div');
        shift.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9;
            backdrop-filter: hue-rotate(0deg);
        `;
        this.appendNode(shift);

        gsap.to(shift, {
            backdropFilter: `hue-rotate(${Math.random() * 180}deg)`,
            duration: 0.5,
            yoyo: true,
            repeat: 1,
            ease: 'power2.inOut',
            onComplete: () => shift.remove()
        });
    }

    plasmaField() {
        const plasma = document.createElement('canvas');
        plasma.width = 200;
        plasma.height = 200;
        plasma.style.cssText = `
            position: fixed;
            left: ${Math.random() * (window.innerWidth - 200)}px;
            top: ${Math.random() * (window.innerHeight - 200)}px;
            pointer-events: none;
            z-index: 5;
            opacity: 0.15;
            mix-blend-mode: multiply;
            filter: blur(2px);
        `;

        const ctx = plasma.getContext('2d');
        const time = Date.now() * 0.001;

        for (let x = 0; x < 200; x += 5) {
            for (let y = 0; y < 200; y += 5) {
                const value = Math.sin(x * 0.05 + time) + Math.sin(y * 0.05 + time);
                const hue = (value + 2) * 60;
                ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
                ctx.fillRect(x, y, 5, 5);
            }
        }

        this.appendNode(plasma);

        gsap.to(plasma, {
            scale: 2,
            opacity: 0,
            rotation: Math.random() * 360,
            duration: 2,
            ease: 'power2.out',
            onComplete: () => plasma.remove()
        });
    }

    circuitTrace() {
        const trace = document.createElement('div');
        const isHorizontal = Math.random() > 0.5;

        if (isHorizontal) {
            trace.style.cssText = `
                position: fixed;
                left: -10px;
                top: ${Math.random() * window.innerHeight}px;
                width: 10px;
                height: 2px;
                background: linear-gradient(90deg, transparent, #00ff85, transparent);
                pointer-events: none;
                z-index: 6;
                box-shadow: 0 0 10px #00ff85;
            `;

            gsap.to(trace, {
                x: window.innerWidth + 20,
                duration: Math.random() + 0.5,
                ease: 'none',
                onComplete: () => trace.remove()
            });
        } else {
            trace.style.cssText = `
                position: fixed;
                left: ${Math.random() * window.innerWidth}px;
                top: -10px;
                width: 2px;
                height: 10px;
                background: linear-gradient(180deg, transparent, #ff00ff, transparent);
                pointer-events: none;
                z-index: 6;
                box-shadow: 0 0 10px #ff00ff;
            `;

            gsap.to(trace, {
                y: window.innerHeight + 20,
                duration: Math.random() + 0.5,
                ease: 'none',
                onComplete: () => trace.remove()
            });
        }

        this.appendNode(trace);
    }

    dataFragmentation() {
        const fragments = this.scaledCount(Math.floor(Math.random() * 15 + 10), 4);
        const centerX = Math.random() * window.innerWidth;
        const centerY = Math.random() * window.innerHeight;

        for (let i = 0; i < fragments; i++) {
            const fragment = document.createElement('div');
            const size = Math.random() * 30 + 10;

            fragment.style.cssText = `
                position: fixed;
                left: ${centerX}px;
                top: ${centerY}px;
                width: ${size}px;
                height: ${Math.random() * 5 + 1}px;
                background: ${Math.random() > 0.5 ? 'rgba(0,255,133,0.5)' : 'rgba(255,0,255,0.5)'};
                pointer-events: none;
                z-index: 7;
                transform-origin: center;
            `;
            this.appendNode(fragment);

            const angle = (i / fragments) * Math.PI * 2;
            const distance = Math.random() * 200 + 50;

            gsap.to(fragment, {
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                rotation: Math.random() * 720 - 360,
                opacity: 0,
                duration: Math.random() + 0.5,
                ease: 'power2.out',
                onComplete: () => fragment.remove()
            });
        }
    }

    addAmbientEffects() {
        // Continuous subtle ambient effects
        this.addFloatingParticles();
        this.addEnergyPulses();
        this.addSubtleDistortions();
    }

    addFloatingParticles() {
        const createParticle = () => {
            if (!this.isRunning) return;

            const particle = document.createElement('div');
            const size = Math.random() * 3 + 1;

            particle.style.cssText = `
                position: fixed;
                width: ${size}px;
                height: ${size}px;
                background: rgba(0,255,133,${Math.random() * 0.5 + 0.2});
                border-radius: 50%;
                left: ${Math.random() * window.innerWidth}px;
                top: ${window.innerHeight + 10}px;
                pointer-events: none;
                z-index: 1;
                box-shadow: 0 0 ${size * 2}px rgba(0,255,133,0.5);
            `;
            this.appendNode(particle);

            gsap.to(particle, {
                y: -(window.innerHeight + 20),
                x: Math.random() * 100 - 50,
                duration: Math.random() * 10 + 10,
                ease: 'none',
                onComplete: () => particle.remove()
            });
        };

        // CRITICAL FIX: Store interval ID for cleanup
        this.particleInterval = animationRuntime.scheduleInterval(RUNTIME_OWNER, () => {
            const chance = 0.5 * this.getProfileScale();
            if (Math.random() < chance) createParticle();
        }, 1000);
    }

    addEnergyPulses() {
        const pulse = () => {
            // CRITICAL FIX: Check if still running before continuing
            if (!this.isRunning) {
                console.log('⏹️ Energy pulses stopped, not scheduling next pulse');
                return;
            }

            const bg = document.querySelector('.bg');
            const chance = 0.3 * this.getProfileScale();
            if (bg && Math.random() < chance) {
                gsap.to(bg, {
                    filter: 'brightness(1.03) saturate(1.05)',  // REDUCED from 1.3/1.5 to prevent bright flashes
                    duration: 0.3,
                    yoyo: true,
                    repeat: 1,
                    ease: 'power2.inOut'
                });
            }

            // CRITICAL FIX: Store timeout ID for cleanup
            this.pulseTimeout = this.scheduleTimeout(pulse, Math.random() * 10000 + 5000);
        };

        this.pulseTimeout = this.scheduleTimeout(pulse, 3000);
    }

    addSubtleDistortions() {
        const distort = () => {
            // CRITICAL FIX: Check if still running before continuing
            if (!this.isRunning) {
                console.log('⏹️ Subtle distortions stopped, not scheduling next distortion');
                return;
            }

            const chance = 0.2 * this.getProfileScale();
            if (Math.random() < chance) {
                const elements = document.querySelectorAll('.logo-text-wrapper, .image-wrapper');
                elements.forEach(el => {
                    gsap.to(el, {
                        scaleX: 1 + (Math.random() * 0.02 - 0.01),
                        scaleY: 1 + (Math.random() * 0.02 - 0.01),
                        duration: 0.1,
                        yoyo: true,
                        repeat: 1,
                        ease: 'power2.inOut'
                    });
                });
            }

            // CRITICAL FIX: Store timeout ID for cleanup
            this.distortTimeout = this.scheduleTimeout(distort, Math.random() * 8000 + 4000);
        };

        this.distortTimeout = this.scheduleTimeout(distort, 5000);
    }

    // New warp tunnel effect
    warpTunnel() {
        const tunnel = document.createElement('div');
        tunnel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            width: 200%;
            height: 200%;
            transform: translate(-50%, -50%);
            background: radial-gradient(ellipse at center,
                transparent 0%,
                rgba(0, 255, 255, 0.1) 25%,
                rgba(255, 0, 255, 0.1) 50%,
                transparent 75%);
            pointer-events: none;
            z-index: 5;
            opacity: 0;
        `;
        this.appendNode(tunnel);

        gsap.to(tunnel, {
            rotation: 360,
            scale: 0.1,
            opacity: 0.6,
            duration: 3,
            ease: 'power2.inOut',
            onComplete: () => tunnel.remove()
        });
    }

    // Ripple pulse effect
    ripplePulse() {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;

        const rippleCount = this.scaledCount(3, 1);
        for (let i = 0; i < rippleCount; i++) {
            const ripple = document.createElement('div');
            ripple.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: 50px;
                height: 50px;
                border: 2px solid rgba(0, 255, 133, 0.6);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                pointer-events: none;
                z-index: 4;
            `;
            this.appendNode(ripple);

            gsap.to(ripple, {
                width: 300,
                height: 300,
                opacity: 0,
                duration: 2,
                delay: i * 0.2,
                ease: 'power2.out',
                onComplete: () => ripple.remove()
            });
        }
    }

    // Digital corruption effect
    digitalCorruption() {
        const corruption = document.createElement('div');
        const lines = Math.floor(Math.random() * 5 + 3);
        let content = '';

        for (let i = 0; i < lines; i++) {
            const width = Math.random() * 100;
            const left = Math.random() * 100;
            const color = ['#00ffff', '#ff00ff', '#ffff00'][Math.floor(Math.random() * 3)];
            content += `<div style="
                position: absolute;
                top: ${i * 20}%;
                left: ${left}%;
                width: ${width}%;
                height: 2px;
                background: ${color};
                opacity: 0.8;
            "></div>`;
        }

        corruption.innerHTML = content;
        corruption.style.cssText = `
            position: fixed;
            top: ${Math.random() * 80}%;
            left: 0;
            width: 100%;
            height: ${Math.random() * 100 + 50}px;
            pointer-events: none;
            z-index: 6;
            filter: blur(1px);
        `;
        this.appendNode(corruption);

        gsap.to(corruption, {
            x: '100%',
            opacity: 0,
            duration: 1.5,
            ease: 'steps(10)',
            onComplete: () => corruption.remove()
        });
    }

    // Prismatic light burst
    prismaticBurst() {
        const burst = document.createElement('div');
        burst.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            width: 100px;
            height: 100px;
            transform: translate(-50%, -50%);
            background: conic-gradient(
                from 0deg,
                rgba(255, 0, 0, 0.5),
                rgba(255, 255, 0, 0.5),
                rgba(0, 255, 0, 0.5),
                rgba(0, 255, 255, 0.5),
                rgba(0, 0, 255, 0.5),
                rgba(255, 0, 255, 0.5),
                rgba(255, 0, 0, 0.5)
            );
            border-radius: 50%;
            pointer-events: none;
            z-index: 7;
            opacity: 0;
            filter: blur(20px);
        `;
        this.appendNode(burst);

        gsap.timeline()
            .to(burst, {
                scale: 10,
                opacity: 0.3,
                rotation: 180,
                duration: 1,
                ease: 'power2.out'
            })
            .to(burst, {
                scale: 15,
                opacity: 0,
                rotation: 360,
                duration: 1,
                ease: 'power2.in',
                onComplete: () => burst.remove()
            });
    }

    // Temporal glitch lines
    temporalGlitch() {
        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 8;
            overflow: hidden;
        `;

        const lineCount = this.scaledCount(10, 3);
        for (let i = 0; i < lineCount; i++) {
            const line = document.createElement('div');
            const height = Math.random() * 3 + 1;
            line.style.cssText = `
                position: absolute;
                left: 0;
                top: ${Math.random() * 100}%;
                width: 100%;
                height: ${height}px;
                background: linear-gradient(90deg,
                    transparent,
                    rgba(0, 255, 255, 0.5),
                    transparent);
                transform: translateX(-100%);
            `;
            container.appendChild(line);

            gsap.to(line, {
                x: '200%',
                duration: Math.random() * 0.5 + 0.2,
                delay: i * 0.05,
                ease: 'none'
            });
        }

        this.appendNode(container);
        this.scheduleTimeout(() => container.remove(), 1000);
    }

    setPerformanceProfile(profile) {
        this.performanceProfile = profile || 'high';
    }

    destroy() {
        console.log('🧹 Destroying random animations and clearing all timers...');
        this.isRunning = false;
        this.activeAnimations.clear();

        animationRuntime.disposeOwner(RUNTIME_OWNER);
        this.particleInterval = null;
        this.pulseTimeout = null;
        this.distortTimeout = null;
        this.randomSequenceTimeout = null;
        this.performanceProfile = 'high';
        const randomNodes = document.querySelectorAll('[data-random-fx="true"], [data-random-fx="true"] *');
        gsap.killTweensOf(randomNodes);
        document.querySelectorAll('[data-random-fx="true"]').forEach(node => node.remove());
        gsap.killTweensOf(document.querySelectorAll('.bg, .logo-text-wrapper, .image-wrapper'));

        console.log('✅ Random animations destroyed successfully');
    }
}

export default new RandomAnimations();
