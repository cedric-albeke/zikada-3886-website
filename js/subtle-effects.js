import gsap from 'gsap';

class SubtleEffects {
    constructor() {
        this.initialized = false;
        this.glitchElements = [];
        this.floatingParticles = [];
    }

    init() {
        this.addFloatingSymbols();
        this.addPeriodicFlicker();
        this.addSubtleParallax();
        this.addEasterEggs();
        this.addRGBShift();
        this.addBinaryRain();
        this.addSubtleTextAnimations();
        this.initialized = true;
    }

    // Floating cicada symbols that appear and disappear
    addFloatingSymbols() {
        const symbols = ['⟨', '⟩', '◊', '⬡', '⬢', '◈', '◉', '◎'];

        const createFloatingSymbol = () => {
            const symbol = document.createElement('div');
            symbol.className = 'floating-symbol';
            symbol.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            symbol.style.cssText = `
                position: fixed;
                font-size: ${Math.random() * 20 + 10}px;
                color: rgba(0, 255, 133, ${Math.random() * 0.3 + 0.1});
                left: ${Math.random() * window.innerWidth}px;
                top: ${window.innerHeight + 50}px;
                pointer-events: none;
                z-index: 1;
                font-family: 'Courier New', monospace;
            `;
            document.body.appendChild(symbol);

            gsap.to(symbol, {
                y: -(window.innerHeight + 100),
                x: Math.random() * 100 - 50,
                rotation: Math.random() * 360,
                duration: Math.random() * 10 + 10,
                ease: 'none',
                onComplete: () => {
                    symbol.remove();
                }
            });
        };

        // Create a symbol every 3-8 seconds
        setInterval(() => {
            if (Math.random() > 0.7) {
                createFloatingSymbol();
            }
        }, 3000);
    }

    // Periodic flicker effect on the cicada logo - VERY SUBTLE
    addPeriodicFlicker() {
        const imageWrapper = document.querySelector('.image-wrapper');
        const image = document.querySelector('.image-2');
        if (!imageWrapper) return;

        // Ensure image always stays visible
        if (image) {
            gsap.set(image, { opacity: 1 });
            // Lock the image opacity
            image.style.setProperty('opacity', '1', 'important');
        }

        const flickerTimeline = gsap.timeline({ repeat: -1 });

        flickerTimeline
            .to(imageWrapper, {
                opacity: 1,
                duration: 10
            })
            .to(imageWrapper, {
                opacity: 0.99,  // Very subtle change
                duration: 0.5   // Much slower transition
            })
            .to(imageWrapper, {
                opacity: 1,
                duration: 0.5
            })
            .to(imageWrapper, {
                opacity: 0.98,  // Very subtle change
                duration: 0.8   // Much slower
            })
            .to(imageWrapper, {
                opacity: 1,
                duration: 0.05
            })
            .to(imageWrapper, {
                opacity: 1,
                duration: 15
            });
    }

    // Removed mouse parallax - replaced with autonomous movement
    addSubtleParallax() {
        const logoText = document.querySelector('.logo-text-wrapper');
        const imageWrapper = document.querySelector('.image-wrapper');
        const bg = document.querySelector('.bg');

        if (!logoText || !imageWrapper) return;

        // Autonomous floating movement instead of mouse tracking
        const animateFloat = () => {
            const time = Date.now() * 0.0005;

            // Create smooth floating motion using sine waves
            const moveX = Math.sin(time) * 0.5;
            const moveY = Math.cos(time * 0.8) * 0.3;

            // Removed x/y transform on logoText to prevent alignment issues

            // Only apply subtle movement to imageWrapper
            gsap.to(imageWrapper, {
                x: moveX * 5,  // Reduced movement
                y: moveY * 3,  // Reduced movement
                duration: 2,
                ease: 'power2.out'
            });

            if (bg) {
                gsap.to(bg, {
                    x: moveX * 5,
                    y: moveY * 3,
                    duration: 3,
                    ease: 'power2.out'
                });
            }

            requestAnimationFrame(animateFloat);
        };

        animateFloat();
    }

    // Easter eggs and secret animations
    addEasterEggs() {
        // Konami code easter egg
        const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
        let konamiIndex = 0;

        document.addEventListener('keydown', (e) => {
            if (e.key === konamiCode[konamiIndex]) {
                konamiIndex++;
                if (konamiIndex === konamiCode.length) {
                    this.triggerSecretAnimation();
                    konamiIndex = 0;
                }
            } else {
                konamiIndex = 0;
            }
        });

        // Time-based easter eggs
        const checkTime = () => {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();

            // At 3:33 or 13:33
            if ((hours === 3 || hours === 15) && minutes === 33) {
                this.trigger333Effect();
            }

            // At midnight
            if (hours === 0 && minutes === 0) {
                this.triggerMidnightEffect();
            }
        };

        setInterval(checkTime, 60000); // Check every minute
    }

    triggerSecretAnimation() {
        // Secret animation when konami code is entered
        const secretMsg = document.createElement('div');
        secretMsg.textContent = 'CICADA 3301 LIVES';
        secretMsg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0);
            font-size: 4rem;
            color: #ff00ff;
            font-family: 'Courier New', monospace;
            text-shadow: 0 0 50px #ff00ff;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(secretMsg);

        gsap.to(secretMsg, {
            scale: 1,
            rotation: 720,
            duration: 1,
            ease: 'back.out(1.7)'
        });

        gsap.to(secretMsg, {
            scale: 0,
            opacity: 0,
            duration: 0.5,
            delay: 2,
            onComplete: () => secretMsg.remove()
        });

        // Trigger rainbow effect
        this.rainbowEffect();
    }

    rainbowEffect() {
        const elements = document.querySelectorAll('.logo-text, .image-wrapper');
        elements.forEach(el => {
            gsap.to(el, {
                filter: 'hue-rotate(360deg)',
                duration: 2,
                onComplete: () => {
                    gsap.set(el, { filter: 'none' });
                }
            });
        });
    }

    trigger333Effect() {
        // Special effect at 3:33
        const msg = document.createElement('div');
        msg.textContent = '3:33';
        msg.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            font-size: 2rem;
            color: #00ff85;
            font-family: 'Courier New', monospace;
            opacity: 0;
            z-index: 1000;
        `;
        document.body.appendChild(msg);

        gsap.to(msg, {
            opacity: 0.5,
            duration: 1,
            yoyo: true,
            repeat: 3,
            onComplete: () => msg.remove()
        });
    }

    triggerMidnightEffect() {
        // Midnight effect - only 5% chance of occurring
        if (Math.random() < 0.05) {
            document.body.style.filter = 'invert(1)';
            setTimeout(() => {
                document.body.style.filter = 'none';
            }, 1000);
        }
    }

    // RGB channel shift effect
    addRGBShift() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes rgbShift {
                0%, 100% {
                    filter: none;
                }
                33% {
                    filter: drop-shadow(2px 0 0 #ff0000) drop-shadow(-2px 0 0 #00ffff);
                }
                66% {
                    filter: drop-shadow(-2px 0 0 #ff00ff) drop-shadow(2px 0 0 #00ff00);
                }
            }

            .image-wrapper {
                animation: rgbShift 20s infinite;
            }
        `;
        document.head.appendChild(style);
    }

    // Binary rain in specific area
    addBinaryRain() {
        const binaryContainer = document.createElement('div');
        binaryContainer.className = 'binary-rain';
        binaryContainer.style.cssText = `
            position: fixed;
            top: 0;
            right: 0;
            width: 100px;
            height: 100%;
            overflow: hidden;
            pointer-events: none;
            z-index: 1;
            opacity: 0.03;
        `;
        document.body.appendChild(binaryContainer);

        const createBinaryDrop = () => {
            const drop = document.createElement('div');
            drop.textContent = Math.random() > 0.5 ? '1' : '0';
            drop.style.cssText = `
                position: absolute;
                color: #00ff85;
                font-family: 'Courier New', monospace;
                font-size: 14px;
                left: ${Math.random() * 100}px;
                top: -20px;
            `;
            binaryContainer.appendChild(drop);

            gsap.to(drop, {
                y: window.innerHeight + 20,
                duration: Math.random() * 5 + 5,
                ease: 'none',
                onComplete: () => drop.remove()
            });
        };

        setInterval(() => {
            if (Math.random() > 0.5) {
                createBinaryDrop();
            }
        }, 200);
    }

    // Add subtle animations to ZIKADA and 3886 texts
    addSubtleTextAnimations() {
        const logoText = document.querySelector('.logo-text');
        const text3886 = document.querySelector('.text-3886');
        const zikadaText = document.querySelector('.zikada-text') || logoText;

        if (logoText || zikadaText) {
            const targetText = zikadaText || logoText;

            // REMOVED INTRO ANIMATION - No movement on load
            // Just set to visible immediately
            gsap.set(targetText, {
                opacity: 1,
                scale: 1,
                y: 0,
                rotationX: 0
            });

            // ZIKADA text animations after intro
            // Subtle breathing effect
            gsap.to(targetText, {
                scale: 1.02,
                duration: 4,
                yoyo: true,
                repeat: -1,
                ease: 'sine.inOut'
            });

            // REMOVED floating effect - no continuous movement

            // Gentle color shift
            gsap.to(logoText, {
                filter: 'hue-rotate(10deg) brightness(110%)',
                duration: 6,
                yoyo: true,
                repeat: -1,
                ease: 'sine.inOut'
            });

            // Occasional glitch without x positioning
            const glitchZikada = () => {
                gsap.to(logoText, {
                    skewX: Math.random() * 2 - 1,
                    // Removed x transform to maintain alignment
                    duration: 0.05,
                    repeat: 2,
                    yoyo: true,
                    ease: 'steps(2)',
                    onComplete: () => {
                        gsap.set(logoText, { skewX: 0 });
                    }
                });

                // Schedule next glitch
                setTimeout(glitchZikada, Math.random() * 15000 + 10000);
            };
            setTimeout(glitchZikada, Math.random() * 5000);

            // Text shadow pulse
            const shadowPulse = gsap.timeline({ repeat: -1 });
            shadowPulse
                .to(logoText, {
                    textShadow: '0 0 20px rgba(0, 255, 133, 0.8), 0 0 40px rgba(0, 255, 133, 0.4)',
                    duration: 2,
                    ease: 'power2.inOut'
                })
                .to(logoText, {
                    textShadow: '0 0 10px rgba(0, 255, 133, 0.5), 0 0 20px rgba(0, 255, 133, 0.2)',
                    duration: 2,
                    ease: 'power2.inOut'
                });
        }

        if (text3886) {
            // REMOVED INTRO ANIMATION - No movement on load
            // Just set to visible immediately
            gsap.set(text3886, {
                opacity: 1,
                scale: 1,
                y: 0,
                rotationY: 0
            });

            // REMOVED floating effect - no continuous movement

            // REMOVED rotation - was causing instability
            // Keep text stable

            // Brightness pulse
            gsap.to(text3886, {
                filter: 'brightness(130%) contrast(110%)',
                duration: 4,
                yoyo: true,
                repeat: -1,
                ease: 'power2.inOut'
            });

            // Occasional strong pulse
            const pulse3886 = () => {
                gsap.to(text3886, {
                    scale: 1.15,
                    filter: 'brightness(150%) blur(0.5px)',
                    duration: 0.3,
                    ease: 'power2.out',
                    onComplete: () => {
                        gsap.to(text3886, {
                            scale: 1,
                            filter: 'brightness(100%) blur(0px)',
                            duration: 0.5,
                            ease: 'elastic.out(1, 0.5)'
                        });
                    }
                });

                // Schedule next pulse
                setTimeout(pulse3886, Math.random() * 20000 + 15000);
            };
            setTimeout(pulse3886, Math.random() * 10000);

            // Add chromatic aberration effect
            const chromaticTimeline = gsap.timeline({ repeat: -1 });
            chromaticTimeline
                .set(text3886, {
                    textShadow: '2px 0 #ff00ff, -2px 0 #00ffff'
                })
                .to(text3886, {
                    textShadow: '-2px 0 #ff00ff, 2px 0 #00ffff',
                    duration: 0.1,
                    ease: 'steps(1)'
                })
                .to(text3886, {
                    textShadow: '0 2px #ff00ff, 0 -2px #00ffff',
                    duration: 0.1,
                    ease: 'steps(1)'
                })
                .to(text3886, {
                    textShadow: '1px 1px #ff00ff, -1px -1px #00ffff',
                    duration: 0.1,
                    ease: 'steps(1)'
                })
                .to(text3886, {
                    textShadow: 'none',
                    duration: 5,
                    ease: 'power2.out'
                });
        }

        // Synchronized effects between both texts
        if (logoText && text3886) {
            // Occasional synchronized glitch
            const syncGlitch = () => {
                const skewAmount = Math.random() * 5 - 2.5;
                const timeline = gsap.timeline();

                timeline
                    .to([logoText, text3886], {
                        skewY: skewAmount,
                        filter: 'blur(1px) saturate(3)',
                        duration: 0.05
                    })
                    .to([logoText, text3886], {
                        skewY: -skewAmount,
                        filter: 'blur(2px) saturate(0.85)',  // Increased to avoid grey
                        duration: 0.05
                    })
                    .to([logoText, text3886], {
                        skewY: 0,
                        filter: 'blur(0px) saturate(1)',
                        duration: 0.1,
                        ease: 'power2.out'
                    });

                // Schedule next sync glitch
                setTimeout(syncGlitch, Math.random() * 25000 + 20000);
            };
            setTimeout(syncGlitch, Math.random() * 10000 + 5000);
        }
    }

    destroy() {
        this.initialized = false;
    }
}

export default new SubtleEffects();