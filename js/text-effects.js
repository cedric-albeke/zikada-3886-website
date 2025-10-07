import gsap from 'gsap';

// Safe TextEffects implementation with proper lifecycle management
class TextEffects {
    constructor() {
        this.scrambleChars = '!@#$%^&*()_+-={}[]|:;<>?,./~`ΛБϾÐΣҒԌΉІЈҜԼМИФҎQЯSҬЦѴЩΧΨΖ0123456789';
        this.glitchChars = '▓▒░│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌';
        this.matrixChars = '日ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        
        // Use WeakMap for element state tracking (automatic cleanup when element is GCed)
        this.activeEffects = new WeakMap();
        this.timelines = new WeakMap();
        this.intervals = new Set(); // For cleanup
        this.canvases = new Set(); // Track created canvases
        this.rafIds = new Set(); // Track RAF IDs
        
        // Performance limits
        this.MAX_SCRAMBLE_ELEMENTS = 5;
        this.MAX_CORRUPTION_BLOCKS = 10;
        this.activeScrambleCount = 0;
        
        // Mutation observer for cleanup when elements are removed
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.removedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.cleanupElement(node);
                    }
                });
            });
        });
        
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('✅ Safe TextEffects initialized with lifecycle management');
    }

    init() {
        // Check feature flags before initializing any effects
        if (!window.SAFE_FLAGS?.TEXT_EFFECTS_ENABLED) {
            console.log('💤 TextEffects disabled by feature flag');
            return;
        }
        
        this.initializeTextScramble();
        this.initializeGlitchText();
        
        if (window.SAFE_FLAGS?.shouldEnableEffect('matrix')) {
            this.initializeMatrixRain();
        }
        
        this.initializeTextBreaking();
        
        if (window.SAFE_FLAGS?.shouldEnableEffect('corruption')) {
            this.addDataCorruption();
        }
    }

    initializeTextScramble() {
        if (!window.SAFE_FLAGS?.shouldEnableEffect('scramble')) {
            console.log('💤 Text scramble disabled by feature flag');
            return;
        }
        
        const scrambleElements = document.querySelectorAll('.scramble-text');
        
        scrambleElements.forEach((element, index) => {
            // Limit concurrent scrambles
            if (index >= this.MAX_SCRAMBLE_ELEMENTS) {
                console.warn(`⚠️ Skipping scramble element ${index}, limit reached (${this.MAX_SCRAMBLE_ELEMENTS})`);
                return;
            }
            
            this.initScrambleForElement(element);
        });
    }
    
    initScrambleForElement(element) {
        if (this.activeEffects.has(element)) {
            console.warn('⚠️ Element already has scramble effect, skipping');
            return;
        }
        
        const originalText = element.textContent;
        if (!originalText) return;
        
        const state = {
            originalText,
            isScrambling: false,
            timeline: null,
            timeoutId: null,
            destroyed: false
        };
        
        this.activeEffects.set(element, state);
        
        const startScramble = () => {
            if (state.destroyed || state.isScrambling) return;
            if (this.activeScrambleCount >= this.MAX_SCRAMBLE_ELEMENTS) return;
            
            state.isScrambling = true;
            this.activeScrambleCount++;
            
            let iterations = 0;
            const maxIterations = Math.min(originalText.length * 3, 60); // Cap iterations
            
            // Use GSAP timeline instead of setInterval for better performance
            const tl = gsap.timeline({
                onComplete: () => {
                    element.textContent = originalText;
                    state.isScrambling = false;
                    this.activeScrambleCount--;
                    
                    // Schedule next scramble
                    if (!state.destroyed) {
                        state.timeoutId = setTimeout(() => {
                            if (!state.destroyed) {
                                triggerRandomly();
                            }
                        }, Math.random() * 5000 + 5000);
                    }
                }
            });
            
            state.timeline = tl;
            
            // Create scramble animation using GSAP
            tl.to({}, {
                duration: maxIterations * 0.03, // 30ms per iteration converted to seconds
                ease: "none",
                onUpdate: function() {
                    if (state.destroyed) return;
                    
                    const progress = this.progress();
                    iterations = Math.floor(progress * maxIterations);
                    
                    const scrambledText = originalText
                        .split('')
                        .map((char, index) => {
                            if (index < iterations / 3) {
                                return originalText[index];
                            }
                            return state.originalText.includes(char) ? 
                                this.scrambleChars[Math.floor(Math.random() * this.scrambleChars.length)] : 
                                char;
                        })
                        .join('');
                    
                    element.textContent = scrambledText;
                }.bind(this)
            });
        };

        const triggerRandomly = () => {
            if (state.destroyed) return;
            
            startScramble();
        };

        // Start with initial delay
        state.timeoutId = setTimeout(triggerRandomly, Math.random() * 3000);
    }

    initializeGlitchText() {
        // Glitch effects implemented via CSS only to avoid DOM manipulation
        if (!document.getElementById('glitch-css-effects')) {
            const style = document.createElement('style');
            style.id = 'glitch-css-effects';
            style.textContent = `
                .glitch-text {
                    position: relative;
                    animation: glitch-skew 1s infinite linear alternate-reverse;
                }
                
                .glitch-text::before,
                .glitch-text::after {
                    content: attr(data-text);
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                }
                
                .glitch-text::before {
                    left: 2px;
                    text-shadow: -2px 0 #ff00c1;
                    clip: rect(44px, 450px, 56px, 0);
                    animation: glitch-anim 5s infinite linear alternate-reverse;
                }
                
                .glitch-text::after {
                    left: -2px;
                    text-shadow: -2px 0 #00fff9, 2px 2px #ff00c1;
                    animation: glitch-anim2 1s infinite linear alternate-reverse;
                }
                
                @keyframes glitch-anim {
                    0% { clip: rect(79px, 9999px, 28px, 0); transform: skew(0.85deg); }
                    5% { clip: rect(46px, 9999px, 18px, 0); transform: skew(0.25deg); }
                    10% { clip: rect(12px, 9999px, 99px, 0); transform: skew(0.15deg); }
                    /* ... more keyframes truncated for brevity */
                    100% { clip: rect(91px, 9999px, 43px, 0); transform: skew(0.05deg); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    initializeMatrixRain() {
        const canvas = document.createElement('canvas');
        canvas.id = 'matrix-rain-safe';
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
            opacity: 0.03;
            mix-blend-mode: multiply;
        `;

        const preLoader = document.querySelector('.pre-loader');
        if (preLoader) {
            preLoader.appendChild(canvas);
            this.canvases.add(canvas);
            
            // Track with performance manager if available
            if (window.performanceElementManager?.track) {
                canvas.__bornAt = Date.now();
                window.performanceElementManager.track(canvas);
            }
        }

        const ctx = canvas.getContext('2d');
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();

        const columns = Math.floor(canvas.width / 20);
        const drops = Array(columns).fill(0);
        
        let lastTime = performance.now();
        const baseStep = 50; // ms between updates
        let rafId;
        
        const drawMatrix = (currentTime) => {
            const hidden = document.hidden;
            const step = hidden ? 200 : baseStep;
            
            if (currentTime - lastTime >= step) {
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
                
                lastTime = currentTime;
            }
            
            rafId = requestAnimationFrame(drawMatrix);
            this.rafIds.add(rafId);
        };
        
        rafId = requestAnimationFrame(drawMatrix);
        this.rafIds.add(rafId);

        // Handle resize with debouncing
        let resizeTimeout;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(resizeCanvas, 250);
        };
        
        window.addEventListener('resize', handleResize);
        
        // Store cleanup function
        const cleanup = () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
                this.rafIds.delete(rafId);
            }
            window.removeEventListener('resize', handleResize);
            clearTimeout(resizeTimeout);
        };
        
        // Store cleanup for later
        this.activeEffects.set(canvas, { cleanup });
    }

    initializeTextBreaking() {
        const enterButton = document.querySelector('.button-primary');
        if (!enterButton) return;

        const originalText = enterButton.textContent;
        if (!originalText) return;
        
        const state = {
            originalText,
            intervalId: null,
            destroyed: false
        };
        
        this.activeEffects.set(enterButton, state);

        // Use more efficient corruption with limits
        const corruptText = () => {
            if (state.destroyed) return;
            
            const chars = originalText.split('');
            const corruptedChars = chars.map((char, i) => {
                // Reduce probability and limit corruption
                if (Math.random() < 0.2) { // Reduced from 0.3
                    return this.glitchChars[Math.floor(Math.random() * this.glitchChars.length)];
                }
                return char;
            });
            
            enterButton.textContent = corruptedChars.join('');

            // Faster restore to reduce visual disruption
            setTimeout(() => {
                if (!state.destroyed) {
                    enterButton.textContent = originalText;
                }
            }, 75); // Reduced from 100ms
        };

        // Less frequent triggering with cleanup
        state.intervalId = setInterval(() => {
            if (state.destroyed) {
                clearInterval(state.intervalId);
                return;
            }
            
            if (Math.random() < 0.15) { // Reduced from 0.2
                corruptText();
            }
        }, 4000); // Increased from 3000ms
        
        this.intervals.add(state.intervalId);

        // Add CSS effects
        if (!document.getElementById('text-breaking-effects')) {
            const style = document.createElement('style');
            style.id = 'text-breaking-effects';
            style.textContent = `
                .button-primary.overlay {
                    animation: rgbSplit 4s infinite;
                }
                
                @keyframes rgbSplit {
                    0%, 100% {
                        text-shadow: -2px 0 #ff00ff, 2px 0 #00ffff;
                    }
                    25% {
                        text-shadow: 2px 0 #ff00ff, -2px 0 #00ffff;
                    }
                    50% {
                        text-shadow: -2px 2px #ff00ff, 2px -2px #00ffff;
                    }
                    75% {
                        text-shadow: 2px 2px #ff00ff, -2px -2px #00ffff;
                    }
                }
                
                .glitch-layer-1, .glitch-layer-2 {
                    will-change: transform;
                }
            `;
            document.head.appendChild(style);
        }
    }

    addDataCorruption() {
        if (!window.SAFE_FLAGS?.shouldEnableEffect('corruption')) {
            console.log('💤 Data corruption disabled by feature flag');
            return;
        }
        
        const corruptionOverlay = document.createElement('div');
        corruptionOverlay.className = 'data-corruption-safe';
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
            
            // Track with performance manager
            if (window.performanceElementManager?.track) {
                corruptionOverlay.__bornAt = Date.now();
                window.performanceElementManager.track(corruptionOverlay);
            }
        }
        
        let activeBlocks = 0;
        const state = {
            intervalId: null,
            activeBlocks: 0,
            destroyed: false
        };
        
        this.activeEffects.set(corruptionOverlay, state);

        const createCorruptionBlock = () => {
            if (state.destroyed || activeBlocks >= this.MAX_CORRUPTION_BLOCKS) return;
            
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
            activeBlocks++;

            // Cleanup block
            setTimeout(() => {
                if (block.parentNode) {
                    block.remove();
                    activeBlocks--;
                }
            }, 200);
        };

        // Much less frequent triggering
        state.intervalId = setInterval(() => {
            if (state.destroyed) {
                clearInterval(state.intervalId);
                return;
            }
            
            if (Math.random() < 0.05) { // Reduced from 0.1
                corruptionOverlay.style.display = 'block';

                // Fewer blocks per burst
                const blockCount = Math.min(Math.random() * 3 + 2, this.MAX_CORRUPTION_BLOCKS - activeBlocks);
                for (let i = 0; i < blockCount; i++) {
                    setTimeout(() => createCorruptionBlock(), i * 50);
                }

                setTimeout(() => {
                    if (!state.destroyed) {
                        corruptionOverlay.style.display = 'none';
                    }
                }, 300); // Reduced from 500
            }
        }, 5000); // Increased from 2000ms
        
        this.intervals.add(state.intervalId);
    }

    // Clean up effects for a specific element
    cleanupElement(element) {
        if (this.activeEffects.has(element)) {
            const state = this.activeEffects.get(element);
            state.destroyed = true;
            
            // Clean up timelines
            if (state.timeline) {
                state.timeline.kill();
            }
            
            // Clean up timeouts
            if (state.timeoutId) {
                clearTimeout(state.timeoutId);
            }
            
            // Clean up intervals
            if (state.intervalId) {
                clearInterval(state.intervalId);
                this.intervals.delete(state.intervalId);
            }
            
            // Clean up custom cleanup
            if (state.cleanup) {
                state.cleanup();
            }
            
            this.activeEffects.delete(element);
            
            if (window.SAFE_FLAGS?.DEBUG_FX) {
                console.log('🧹 Cleaned up text effect for element:', element);
            }
        }
    }

    // Clean up all effects
    destroy() {
        console.log('🧹 Destroying SafeTextEffects...');
        
        // Clean up all intervals
        this.intervals.forEach(id => clearInterval(id));
        this.intervals.clear();
        
        // Clean up all RAF IDs
        this.rafIds.forEach(id => cancelAnimationFrame(id));
        this.rafIds.clear();
        
        // Clean up all canvases
        this.canvases.forEach(canvas => {
            if (canvas.parentNode) {
                canvas.remove();
            }
        });
        this.canvases.clear();
        
        // Clean up all active effects
        for (const [element, state] of this.activeEffects) {
            this.cleanupElement(element);
        }
        
        // Disconnect mutation observer
        this.observer.disconnect();
        
        // Reset counters
        this.activeScrambleCount = 0;
        
        console.log('✅ SafeTextEffects destroyed');
    }
}

// Create global instance for backward compatibility
if (typeof window !== 'undefined') {
    window.textEffects = new TextEffects();
}

export default TextEffects;
