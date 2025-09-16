import gsap from 'gsap';

class RandomAnimations {
    constructor() {
        this.activeAnimations = new Set();
        this.animationPool = [];
        this.isRunning = false;
        this.lastAnimation = null;
    }

    init() {
        this.setupAnimationPool();
        this.startRandomSequence();
        this.addAmbientEffects();
        this.isRunning = true;
    }

    setupAnimationPool() {
        // Pool of random animations that can trigger at any time
        this.animationPool = [
            () => this.dataGlitchWave(),
            () => this.neonPulse(),
            () => this.digitalRain(),
            () => this.geometricPatterns(),
            () => this.colorWave(),
            () => this.pixelStorm(),
            () => this.matrixCascade(),
            () => this.electricArc(),
            () => this.hologramFlicker(),
            () => this.warpField(),
            () => this.cyberGlitch(),
            () => this.quantumShift(),
            () => this.plasmaField(),
            () => this.circuitTrace(),
            () => this.dataFragmentation()
        ];
    }

    startRandomSequence() {
        const triggerRandomAnimation = () => {
            if (!this.isRunning) return;

            // Random chance to trigger an animation
            if (Math.random() > 0.3) { // 70% chance
                // Pick a random animation that isn't the last one
                let animations = this.animationPool.filter(a => a !== this.lastAnimation);
                const randomAnim = animations[Math.floor(Math.random() * animations.length)];
                this.lastAnimation = randomAnim;
                randomAnim();
            }

            // Random delay between 3-15 seconds
            const nextDelay = Math.random() * 12000 + 3000;
            setTimeout(triggerRandomAnimation, nextDelay);
        };

        // Start after initial delay
        setTimeout(triggerRandomAnimation, 2000);
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
                rgba(0,255,133,0.1),
                rgba(255,0,255,0.2),
                rgba(0,255,255,0.1),
                transparent);
            pointer-events: none;
            z-index: 5;
            transform: skewY(${Math.random() * 10 - 5}deg);
            mix-blend-mode: screen;
        `;
        document.body.appendChild(wave);

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
        document.body.appendChild(pulse);

        gsap.to(pulse, {
            width: Math.random() * 500 + 300,
            height: Math.random() * 500 + 300,
            opacity: 0,
            borderWidth: 0,
            duration: Math.random() + 0.5,
            ease: 'power2.out',
            onComplete: () => pulse.remove()
        });
    }

    digitalRain() {
        const drops = Math.floor(Math.random() * 10 + 5);

        for (let i = 0; i < drops; i++) {
            const drop = document.createElement('div');
            const char = String.fromCharCode(33 + Math.floor(Math.random() * 94));

            drop.textContent = char.repeat(Math.floor(Math.random() * 20 + 10));
            drop.style.cssText = `
                position: fixed;
                left: ${Math.random() * window.innerWidth}px;
                top: -100px;
                color: rgba(0,255,133,${Math.random() * 0.5 + 0.2});
                font-family: monospace;
                font-size: ${Math.random() * 10 + 8}px;
                writing-mode: vertical-rl;
                pointer-events: none;
                z-index: 4;
                text-shadow: 0 0 5px currentColor;
            `;
            document.body.appendChild(drop);

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
            document.body.appendChild(shape);

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
                hsla(${hue}, 100%, 50%, 0.1),
                transparent);
            pointer-events: none;
            z-index: 2;
            mix-blend-mode: screen;
            opacity: 0;
        `;
        document.body.appendChild(overlay);

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

    pixelStorm() {
        const pixels = Math.floor(Math.random() * 30 + 20);

        for (let i = 0; i < pixels; i++) {
            const pixel = document.createElement('div');
            const size = Math.random() * 5 + 2;

            pixel.style.cssText = `
                position: fixed;
                width: ${size}px;
                height: ${size}px;
                background: ${Math.random() > 0.5 ? '#00ff85' : '#ff00ff'};
                left: 50%;
                top: 50%;
                pointer-events: none;
                z-index: 5;
                box-shadow: 0 0 ${size}px currentColor;
            `;
            document.body.appendChild(pixel);

            const angle = (i / pixels) * Math.PI * 2;
            const distance = Math.random() * 500 + 100;

            gsap.to(pixel, {
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                opacity: 0,
                duration: Math.random() + 0.5,
                ease: 'power2.out',
                onComplete: () => pixel.remove()
            });
        }
    }

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
        document.body.appendChild(cascade);

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
        document.body.appendChild(svg);

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
                filter: 'brightness(2) saturate(0)',
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
        document.body.appendChild(warp);

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
        const glitchBox = document.createElement('div');
        const width = Math.random() * 300 + 100;
        const height = Math.random() * 50 + 20;

        glitchBox.style.cssText = `
            position: fixed;
            left: ${Math.random() * window.innerWidth}px;
            top: ${Math.random() * window.innerHeight}px;
            width: ${width}px;
            height: ${height}px;
            background: repeating-linear-gradient(
                90deg,
                rgba(255,0,0,0.5) 0px,
                rgba(0,255,0,0.5) 2px,
                rgba(0,0,255,0.5) 4px
            );
            pointer-events: none;
            z-index: 8;
            mix-blend-mode: difference;
            transform: skewX(${Math.random() * 30 - 15}deg);
        `;
        document.body.appendChild(glitchBox);

        gsap.to(glitchBox, {
            scaleX: 0,
            duration: 0.2,
            ease: 'power4.in',
            onComplete: () => glitchBox.remove()
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
        document.body.appendChild(shift);

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
            opacity: 0.3;
            mix-blend-mode: screen;
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

        document.body.appendChild(plasma);

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

        document.body.appendChild(trace);
    }

    dataFragmentation() {
        const fragments = Math.floor(Math.random() * 15 + 10);
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
            document.body.appendChild(fragment);

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
            document.body.appendChild(particle);

            gsap.to(particle, {
                y: -(window.innerHeight + 20),
                x: Math.random() * 100 - 50,
                duration: Math.random() * 10 + 10,
                ease: 'none',
                onComplete: () => particle.remove()
            });
        };

        // Create particles periodically
        setInterval(() => {
            if (Math.random() > 0.5) createParticle();
        }, 1000);
    }

    addEnergyPulses() {
        const pulse = () => {
            if (!this.isRunning) return;

            const bg = document.querySelector('.bg');
            if (bg && Math.random() > 0.7) {
                gsap.to(bg, {
                    filter: 'brightness(1.3) saturate(1.5)',
                    duration: 0.3,
                    yoyo: true,
                    repeat: 1,
                    ease: 'power2.inOut'
                });
            }

            setTimeout(pulse, Math.random() * 10000 + 5000);
        };

        setTimeout(pulse, 3000);
    }

    addSubtleDistortions() {
        const distort = () => {
            if (!this.isRunning) return;

            if (Math.random() > 0.8) {
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

            setTimeout(distort, Math.random() * 8000 + 4000);
        };

        setTimeout(distort, 5000);
    }

    destroy() {
        this.isRunning = false;
        this.activeAnimations.clear();
    }
}

export default new RandomAnimations();