import gsap from 'gsap';

class TextEffects {
    constructor() {
        this.scrambleChars = '!@#$%^&*()_+-={}[]|:;<>?,./~`ΛБϾÐΣҒԌΉІЈҜԼМИФҎQЯSҬЦѴЩΧΨΖ0123456789';
        this.glitchChars = '▓▒░│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌';
        this.matrixChars = '日ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        this.activeEffects = new Set();
    }

    init() {
        this.initializeTextScramble();
        this.initializeGlitchText();
        this.initializeMatrixRain();
        this.initializeTextBreaking();
    }

    initializeTextScramble() {
        // REMOVED .logo-text to disable ZIKADA scrambling
        const scrambleElements = document.querySelectorAll('.scramble-text');

        scrambleElements.forEach(element => {
            const originalText = element.innerText;
            let scrambleInterval;

            const startScramble = () => {
                if (this.activeEffects.has(element)) return;
                this.activeEffects.add(element);

                let iterations = 0;
                const maxIterations = originalText.length * 3;

                scrambleInterval = setInterval(() => {
                    element.innerText = originalText
                        .split('')
                        .map((char, index) => {
                            if (index < iterations / 3) {
                                return originalText[index];
                            }
                            return this.scrambleChars[Math.floor(Math.random() * this.scrambleChars.length)];
                        })
                        .join('');

                    if (iterations >= maxIterations) {
                        clearInterval(scrambleInterval);
                        element.innerText = originalText;
                        this.activeEffects.delete(element);
                    }
                    iterations++;
                }, 30);
            };

            // Trigger scramble every 5-10 seconds
            const triggerRandomly = () => {
                startScramble();
                setTimeout(triggerRandomly, Math.random() * 5000 + 5000);
            };

            setTimeout(triggerRandomly, Math.random() * 3000);
        });
    }

    initializeGlitchText() {
        // Removed - was breaking the original text display
        // We'll add subtle glitch via CSS animations instead
    }

    initializeMatrixRain() {
        const canvas = document.createElement('canvas');
        canvas.id = 'matrix-rain';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '0';
        canvas.style.opacity = '0.03';

        const preLoader = document.querySelector('.pre-loader');
        if (preLoader) {
            preLoader.appendChild(canvas);
        }

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const columns = Math.floor(canvas.width / 20);
        const drops = Array(columns).fill(0);

        const drawMatrix = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#00ff00';
            ctx.font = '15px monospace';

            for (let i = 0; i < drops.length; i++) {
                const text = this.matrixChars[Math.floor(Math.random() * this.matrixChars.length)];
                ctx.fillText(text, i * 20, drops[i] * 20);

                if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        // rAF-driven loop with hidden-tab backoff
        let last = performance.now();
        const baseStep = 50; // ms
        const loop = (ts) => {
            const hidden = document.hidden === true;
            const step = hidden ? 200 : baseStep;
            if (ts - last >= step) {
                drawMatrix();
                last = ts;
            }
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);

        // Handle resize
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }

    initializeTextBreaking() {
        const enterButton = document.querySelector('.button-primary');
        if (!enterButton) return;

        const originalText = enterButton.innerText;

        // Text corruption effect
        const corruptText = () => {
            const chars = originalText.split('');
            let corrupted = chars.map((char, i) => {
                if (Math.random() < 0.3) {
                    return this.glitchChars[Math.floor(Math.random() * this.glitchChars.length)];
                }
                return char;
            }).join('');

            enterButton.innerText = corrupted;

            // Restore after a moment
            setTimeout(() => {
                enterButton.innerText = originalText;
            }, 100);
        };

        // Trigger corruption periodically
        setInterval(() => {
            if (Math.random() < 0.2) { // 20% chance every check
                corruptText();
            }
        }, 3000);

        // Add RGB split effect to button
        const style = document.createElement('style');
        style.textContent = `
            @keyframes rgbSplit {
                0%, 100% {
                    text-shadow:
                        -2px 0 #ff00ff,
                        2px 0 #00ffff;
                }
                25% {
                    text-shadow:
                        2px 0 #ff00ff,
                        -2px 0 #00ffff;
                }
                50% {
                    text-shadow:
                        -2px 2px #ff00ff,
                        2px -2px #00ffff;
                }
                75% {
                    text-shadow:
                        2px 2px #ff00ff,
                        -2px -2px #00ffff;
                }
            }

            .button-primary.overlay {
                animation: rgbSplit 4s infinite;
            }

            .glitch-layer-1, .glitch-layer-2 {
                will-change: transform;
            }

            #matrix-rain {
                mix-blend-mode: multiply;
            }
        `;
        document.head.appendChild(style);
    }

    addDataCorruption() {
        // Create random data corruption overlays
        const corruptionOverlay = document.createElement('div');
        corruptionOverlay.className = 'data-corruption';
        corruptionOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9998;
            display: none;
        `;

        const preLoader = document.querySelector('.pre-loader');
        if (preLoader) {
            preLoader.appendChild(corruptionOverlay);
        }

        const createCorruptionBlock = () => {
            const block = document.createElement('div');
            const size = Math.random() * 200 + 50;
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;

            block.style.cssText = `
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${Math.random() * 20 + 5}px;
                background: linear-gradient(90deg,
                    transparent,
                    rgba(0, 255, 255, 0.15),
                    rgba(255, 0, 255, 0.15),
                    transparent
                );
                mix-blend-mode: multiply;
            `;

            corruptionOverlay.appendChild(block);

            // Remove after animation
            setTimeout(() => {
                block.remove();
            }, 200);
        };

        // Trigger corruption bursts
        setInterval(() => {
            if (Math.random() < 0.1) { // 10% chance
                corruptionOverlay.style.display = 'block';

                // Create multiple corruption blocks
                for (let i = 0; i < Math.random() * 5 + 3; i++) {
                    setTimeout(() => createCorruptionBlock(), i * 50);
                }

                // Hide overlay after burst
                setTimeout(() => {
                    corruptionOverlay.style.display = 'none';
                }, 500);
            }
        }, 2000);
    }

    destroy() {
        this.activeEffects.clear();
        const matrixCanvas = document.getElementById('matrix-rain');
        if (matrixCanvas) {
            matrixCanvas.remove();
        }
    }
}

export default new TextEffects();
