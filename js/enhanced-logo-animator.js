import gsap from 'gsap';

class EnhancedLogoAnimator {
    constructor() {
        this.logo = null;
        this.logoWrapper = null;
        this.textElements = { zikada: null, text3886: null };
        this.glowElement = null;
        this.energyField = null;

        // Animation states
        this.breathingTimeline = null;
        this.ambientTimeline = null;
        this.mousePosition = { x: 0, y: 0 };
        this.logoCenter = { x: 0, y: 0 };

        // Event tracking
        this.eventListeners = [];
        this.observer = null;
        this.animationFrameId = null;
        this.isInitialized = false;

        // Animation parameters
        this.breathIntensity = 1;
        this.energyLevel = 0.5;
        this.responsiveness = 1;
        this.lastEventTime = Date.now();

        // Event counters for adaptive behavior
        this.eventHistory = {
            lottie: [],
            matrix: [],
            glitch: [],
            user: []
        };
    }

    init() {
        console.log('🎨 Enhanced Logo Animator initializing...');

        // Find logo elements
        this.logo = document.querySelector('.image-2') ||
                    document.querySelector('img[src*="c01n"]') ||
                    document.querySelector('.logo-main img');

        this.logoWrapper = document.querySelector('.logo-text-wrapper');
        this.textElements.zikada = document.querySelector('.zikada-text');
        this.textElements.text3886 = document.querySelector('.text-3886');

        if (!this.logo) {
            console.error('❌ Logo element not found');
            return;
        }

        // Initialize components
        this.createEnergyField();
        this.createGlowLayers();
        this.setupMouseTracking();
        this.startCoreAnimations();
        this.setupEventListeners();
        this.startAdaptiveBehavior();

        this.isInitialized = true;
        console.log('✅ Enhanced Logo Animator ready');
    }

    createEnergyField() {
        // Create multi-layered energy field around logo
        this.energyField = document.createElement('div');
        this.energyField.className = 'logo-energy-field';
        this.energyField.innerHTML = `
            <div class="energy-ring energy-ring-1"></div>
            <div class="energy-ring energy-ring-2"></div>
            <div class="energy-ring energy-ring-3"></div>
            <div class="energy-particles"></div>
        `;

        // Add CSS for energy field
        const style = document.createElement('style');
        style.textContent = `
            .logo-energy-field {
                position: absolute;
                width: 150%;
                height: 150%;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                pointer-events: none;
                z-index: -2;
            }

            .energy-ring {
                position: absolute;
                width: 100%;
                height: 100%;
                border-radius: 50%;
                opacity: 0;
            }

            .energy-ring-1 {
                background: radial-gradient(circle, transparent 40%, rgba(0, 255, 133, 0.1) 60%, transparent 70%);
            }

            .energy-ring-2 {
                background: radial-gradient(circle, transparent 50%, rgba(0, 255, 200, 0.08) 70%, transparent 80%);
            }

            .energy-ring-3 {
                background: radial-gradient(circle, transparent 60%, rgba(0, 200, 255, 0.05) 80%, transparent 90%);
            }

            .energy-particles {
                position: absolute;
                width: 100%;
                height: 100%;
                background-image:
                    radial-gradient(circle at 20% 30%, rgba(0, 255, 133, 0.3) 0%, transparent 2%),
                    radial-gradient(circle at 80% 70%, rgba(0, 255, 200, 0.3) 0%, transparent 2%),
                    radial-gradient(circle at 65% 20%, rgba(0, 200, 255, 0.3) 0%, transparent 2%);
                animation: particleFloat 20s infinite linear;
            }

            @keyframes particleFloat {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);

        if (this.logo.parentElement) {
            this.logo.parentElement.style.position = 'relative';
            this.logo.parentElement.appendChild(this.energyField);
        }
    }

    createGlowLayers() {
        // Multi-layered glow for depth
        const glowContainer = document.createElement('div');
        glowContainer.className = 'logo-glow-container';
        glowContainer.innerHTML = `
            <div class="glow-layer glow-core"></div>
            <div class="glow-layer glow-mid"></div>
            <div class="glow-layer glow-outer"></div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            .logo-glow-container {
                position: absolute;
                width: 120%;
                height: 120%;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                pointer-events: none;
                z-index: -1;
            }

            .glow-layer {
                position: absolute;
                width: 100%;
                height: 100%;
                border-radius: 50%;
            }

            .glow-core {
                background: radial-gradient(circle, rgba(0, 255, 133, 0.4), transparent 40%);
                filter: blur(20px);
            }

            .glow-mid {
                background: radial-gradient(circle, rgba(0, 255, 133, 0.2), transparent 60%);
                filter: blur(40px);
            }

            .glow-outer {
                background: radial-gradient(circle, rgba(0, 255, 133, 0.1), transparent 70%);
                filter: blur(60px);
            }
        `;
        document.head.appendChild(style);

        if (this.logo.parentElement) {
            this.logo.parentElement.appendChild(glowContainer);
        }

        this.glowElement = glowContainer;
    }

    setupMouseTracking() {
        // Track mouse for proximity reactions
        document.addEventListener('mousemove', (e) => {
            this.mousePosition.x = e.clientX;
            this.mousePosition.y = e.clientY;

            // Calculate distance to logo
            const logoRect = this.logo.getBoundingClientRect();
            this.logoCenter.x = logoRect.left + logoRect.width / 2;
            this.logoCenter.y = logoRect.top + logoRect.height / 2;

            const distance = Math.sqrt(
                Math.pow(this.mousePosition.x - this.logoCenter.x, 2) +
                Math.pow(this.mousePosition.y - this.logoCenter.y, 2)
            );

            // React to proximity
            if (distance < 200) {
                this.proximityReaction(distance);
            }
        });

        // React to clicks near logo
        document.addEventListener('click', (e) => {
            const logoRect = this.logo.getBoundingClientRect();
            const clickX = e.clientX;
            const clickY = e.clientY;

            if (clickX >= logoRect.left - 100 && clickX <= logoRect.right + 100 &&
                clickY >= logoRect.top - 100 && clickY <= logoRect.bottom + 100) {
                this.clickReaction();
            }
        });
    }

    startCoreAnimations() {
        // Complex breathing with variable intensity
        this.breathingTimeline = gsap.timeline({ repeat: -1 });
        this.updateBreathing();

        // Ambient animations
        this.startAmbientAnimations();

        // Energy field animations
        this.animateEnergyField();

        // Micro movements
        this.startMicroMovements();
    }

    updateBreathing() {
        if (this.breathingTimeline) {
            this.breathingTimeline.clear();

            // Variable breathing based on energy level
            const scaleFactor = 1 + (0.12 * this.breathIntensity);
            const duration = 4 - (this.energyLevel * 2);

            this.breathingTimeline
                .to(this.logo, {
                    scale: scaleFactor,
                    duration: duration,
                    ease: 'sine.inOut'
                })
                .to(this.logo, {
                    scale: 1,
                    duration: duration,
                    ease: 'sine.inOut'
                })
                .to(this.glowElement, {
                    opacity: 0.6 + (this.energyLevel * 0.4),
                    scale: 1 + (0.1 * this.breathIntensity),
                    duration: duration,
                    ease: 'sine.inOut'
                }, '<');
        }
    }

    startAmbientAnimations() {
        // Subtle rotation and movement
        this.ambientTimeline = gsap.timeline({ repeat: -1 });

        this.ambientTimeline
            .to(this.logo, {
                rotation: 3,
                x: 5,
                duration: 8,
                ease: 'sine.inOut'
            })
            .to(this.logo, {
                rotation: -3,
                x: -5,
                duration: 8,
                ease: 'sine.inOut'
            })
            .to(this.logo, {
                rotation: 0,
                x: 0,
                duration: 8,
                ease: 'sine.inOut'
            });
    }

    animateEnergyField() {
        if (!this.energyField) return;

        const rings = this.energyField.querySelectorAll('.energy-ring');

        // Pulsing energy rings
        rings.forEach((ring, index) => {
            gsap.to(ring, {
                opacity: 0.3 + (index * 0.1),
                scale: 1 + (index * 0.1),
                duration: 3 + index,
                ease: 'sine.inOut',
                repeat: -1,
                yoyo: true,
                delay: index * 0.5
            });
        });
    }

    startMicroMovements() {
        // Tiny random movements for organic feel
        const microMove = () => {
            if (!this.isInitialized) return;

            const microX = (Math.random() - 0.5) * 2;
            const microY = (Math.random() - 0.5) * 2;
            const microRotation = (Math.random() - 0.5) * 0.5;

            gsap.to(this.logo, {
                x: `+=${microX}`,
                y: `+=${microY}`,
                rotation: `+=${microRotation}`,
                duration: 2,
                ease: 'power1.inOut',
                onComplete: () => {
                    if (this.isInitialized) {
                        setTimeout(microMove, Math.random() * 3000 + 2000);
                    }
                }
            });
        };

        microMove();
    }

    setupEventListeners() {
        // Listen to all animation events
        const handlers = {
            lottieStart: (e) => this.reactToLottie(e.detail),
            matrixMessage: () => this.matrixReaction(),
            glitchEvent: () => this.glitchReaction(),
            animationPhase: (e) => this.phaseReaction(e.detail.phase),
            audioUpdate: (e) => this.audioReaction(e.detail),
            chaosEvent: (e) => this.chaosReaction(e.detail)
        };

        // Register all handlers
        Object.entries(handlers).forEach(([event, handler]) => {
            window.addEventListener(event, handler);
            this.eventListeners.push({ type: event, handler });
        });

        // Keyboard interactions
        document.addEventListener('keypress', (e) => {
            this.keyboardReaction(e.key);
        });
    }

    reactToLottie(detail) {
        // Track event
        this.eventHistory.lottie.push(Date.now());
        this.cleanEventHistory();

        // Adaptive reaction based on animation type
        const reactions = {
            'planet': () => this.orbitalReaction(),
            'particle': () => this.particleReaction(),
            'geometric': () => this.geometricReaction(),
            'circuit': () => this.circuitReaction(),
            'abstract': () => this.abstractReaction()
        };

        // Find matching reaction
        Object.keys(reactions).forEach(key => {
            if (detail.name && detail.name.toLowerCase().includes(key)) {
                reactions[key]();
            }
        });

        // Increase energy temporarily
        this.boostEnergy(0.2, 3000);
    }

    orbitalReaction() {
        const tl = gsap.timeline();

        tl.to(this.logo, {
            rotation: '+=360',
            scale: 1.1,
            duration: 2,
            ease: 'power2.inOut'
        })
        .to(this.logo, {
            rotation: '+=180',
            scale: 1,
            duration: 1,
            ease: 'back.out(1.7)'
        });

        // Energy rings expand
        this.pulseEnergyRings();
    }

    particleReaction() {
        // Disperse and reform
        const tl = gsap.timeline();

        tl.to(this.logo, {
            scale: 1.2,
            opacity: 0.8,
            duration: 0.3,
            ease: 'power2.out'
        })
        .to(this.logo, {
            scale: 0.9,
            opacity: 1,
            duration: 0.2,
            ease: 'power2.in'
        })
        .to(this.logo, {
            scale: 1,
            duration: 0.5,
            ease: 'elastic.out(1, 0.3)'
        });
    }

    geometricReaction() {
        // Sharp, angular movements
        const tl = gsap.timeline();

        for (let i = 0; i < 4; i++) {
            tl.to(this.logo, {
                rotation: `+=${90}`,
                scale: i % 2 === 0 ? 1.05 : 0.95,
                duration: 0.2,
                ease: 'power2.inOut'
            });
        }

        tl.to(this.logo, {
            rotation: 0,
            scale: 1,
            duration: 0.5,
            ease: 'back.out(2)'
        });
    }

    circuitReaction() {
        // Electric pulse
        const tl = gsap.timeline();

        tl.to(this.logo, {
            scale: 1.02,
            duration: 0.1,
            repeat: 5,
            yoyo: true,
            ease: 'none'
        })
        .to(this.glowElement, {
            opacity: 1,
            scale: 1.3,
            duration: 0.2,
            ease: 'power2.out'
        }, 0)
        .to(this.glowElement, {
            opacity: 0.5,
            scale: 1,
            duration: 0.8,
            ease: 'power2.inOut'
        });
    }

    abstractReaction() {
        // Fluid, organic movement
        const tl = gsap.timeline();

        tl.to(this.logo, {
            scaleX: 1.1,
            scaleY: 0.9,
            rotation: 5,
            duration: 0.5,
            ease: 'sine.inOut'
        })
        .to(this.logo, {
            scaleX: 0.9,
            scaleY: 1.1,
            rotation: -5,
            duration: 0.5,
            ease: 'sine.inOut'
        })
        .to(this.logo, {
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            duration: 0.5,
            ease: 'sine.out'
        });
    }

    matrixReaction() {
        // Digital cascade effect
        this.eventHistory.matrix.push(Date.now());

        const tl = gsap.timeline();

        // Rapid digital flicker
        for (let i = 0; i < 3; i++) {
            tl.to(this.logo, {
                scale: 1 + (Math.random() * 0.05),
                x: (Math.random() - 0.5) * 10,
                y: (Math.random() - 0.5) * 10,
                duration: 0.05
            });
        }

        tl.to(this.logo, {
            scale: 1,
            x: 0,
            y: 0,
            duration: 0.2,
            ease: 'power2.out'
        });

        // Green glow pulse
        gsap.to(this.glowElement, {
            filter: 'hue-rotate(-30deg)',
            duration: 0.3,
            yoyo: true,
            repeat: 1
        });
    }

    glitchReaction() {
        this.eventHistory.glitch.push(Date.now());

        const intensity = Math.min(this.eventHistory.glitch.length / 10, 1);

        const tl = gsap.timeline();

        // Distortion based on glitch frequency
        for (let i = 0; i < 5 + (intensity * 5); i++) {
            tl.to(this.logo, {
                x: gsap.utils.random(-10 * intensity, 10 * intensity),
                y: gsap.utils.random(-10 * intensity, 10 * intensity),
                skewX: gsap.utils.random(-5 * intensity, 5 * intensity),
                skewY: gsap.utils.random(-5 * intensity, 5 * intensity),
                duration: 0.02
            });
        }

        tl.to(this.logo, {
            x: 0,
            y: 0,
            skewX: 0,
            skewY: 0,
            duration: 0.1,
            ease: 'power2.out'
        });
    }

    phaseReaction(phase) {
        // Adapt breathing and energy to phase
        const phaseSettings = {
            calm: { breath: 0.5, energy: 0.3, responsiveness: 0.5 },
            building: { breath: 0.8, energy: 0.6, responsiveness: 0.8 },
            intense: { breath: 1.2, energy: 1, responsiveness: 1.2 },
            glitch: { breath: 1.5, energy: 0.8, responsiveness: 1.5 },
            fade: { breath: 0.3, energy: 0.2, responsiveness: 0.3 }
        };

        const settings = phaseSettings[phase] || phaseSettings.calm;

        // Smoothly transition to new settings
        gsap.to(this, {
            breathIntensity: settings.breath,
            energyLevel: settings.energy,
            responsiveness: settings.responsiveness,
            duration: 2,
            onUpdate: () => this.updateBreathing()
        });
    }

    audioReaction(audioData) {
        if (!audioData) return;

        // React to audio levels
        const { bass, mid, treble, volume } = audioData;

        // Bass drives scale
        if (bass > 0.7) {
            gsap.to(this.logo, {
                scale: 1 + (bass * 0.1),
                duration: 0.1,
                ease: 'power2.out',
                yoyo: true,
                repeat: 1
            });
        }

        // Treble drives rotation
        if (treble > 0.6) {
            gsap.to(this.logo, {
                rotation: `+=${treble * 10}`,
                duration: 0.2
            });
        }

        // Overall volume affects glow
        gsap.to(this.glowElement, {
            opacity: 0.5 + (volume * 0.5),
            duration: 0.1
        });
    }

    proximityReaction(distance) {
        // React based on mouse proximity
        const factor = 1 - (distance / 200);

        // Subtle attraction/repulsion
        const angle = Math.atan2(
            this.mousePosition.y - this.logoCenter.y,
            this.mousePosition.x - this.logoCenter.x
        );

        const pullX = Math.cos(angle) * factor * 5;
        const pullY = Math.sin(angle) * factor * 5;

        gsap.to(this.logo, {
            x: pullX,
            y: pullY,
            scale: 1 + (factor * 0.05),
            duration: 0.3,
            ease: 'power2.out'
        });

        // Glow responds to proximity
        gsap.to(this.glowElement, {
            opacity: 0.5 + (factor * 0.3),
            scale: 1 + (factor * 0.1),
            duration: 0.3
        });
    }

    clickReaction() {
        // Burst effect on click
        const burst = document.createElement('div');
        burst.style.cssText = `
            position: absolute;
            width: 100%;
            height: 100%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            border: 3px solid rgba(0, 255, 133, 0.8);
            border-radius: 50%;
            pointer-events: none;
            z-index: 100;
        `;

        if (this.logo.parentElement) {
            this.logo.parentElement.appendChild(burst);

            gsap.to(burst, {
                scale: 3,
                opacity: 0,
                duration: 1,
                ease: 'power2.out',
                onComplete: () => burst.remove()
            });
        }

        // Logo response
        const tl = gsap.timeline();

        tl.to(this.logo, {
            scale: 0.9,
            duration: 0.1,
            ease: 'power2.in'
        })
        .to(this.logo, {
            scale: 1.2,
            rotation: '+=360',
            duration: 0.5,
            ease: 'back.out(2)'
        })
        .to(this.logo, {
            scale: 1,
            duration: 0.3,
            ease: 'power2.inOut'
        });

        // Boost energy
        this.boostEnergy(0.5, 5000);
    }

    keyboardReaction(key) {
        // React to keyboard input
        this.eventHistory.user.push(Date.now());

        const keyReactions = {
            ' ': () => this.spaceReaction(),
            'Enter': () => this.enterReaction(),
            default: () => this.genericKeyReaction()
        };

        const reaction = keyReactions[key] || keyReactions.default;
        reaction();
    }

    spaceReaction() {
        // Jump effect
        gsap.to(this.logo, {
            y: -20,
            scale: 1.1,
            duration: 0.3,
            ease: 'power2.out',
            yoyo: true,
            repeat: 1
        });
    }

    enterReaction() {
        // Confirmation pulse
        const tl = gsap.timeline();

        tl.to(this.logo, {
            scale: 1.3,
            duration: 0.2,
            ease: 'power2.out'
        })
        .to(this.logo, {
            scale: 1,
            duration: 0.5,
            ease: 'elastic.out(1, 0.3)'
        });
    }

    genericKeyReaction() {
        // Subtle wiggle
        gsap.to(this.logo, {
            rotation: '+=2',
            duration: 0.1,
            yoyo: true,
            repeat: 1
        });
    }

    chaosReaction(detail) {
        // React to chaos events
        const chaosLevel = detail.intensity || 0.5;

        // Chaotic movement
        const tl = gsap.timeline();

        for (let i = 0; i < chaosLevel * 10; i++) {
            tl.to(this.logo, {
                x: gsap.utils.random(-20, 20) * chaosLevel,
                y: gsap.utils.random(-20, 20) * chaosLevel,
                rotation: gsap.utils.random(-30, 30) * chaosLevel,
                scale: gsap.utils.random(0.8, 1.2),
                duration: 0.1,
                ease: 'none'
            });
        }

        tl.to(this.logo, {
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            duration: 0.5,
            ease: 'power2.out'
        });
    }

    pulseEnergyRings() {
        if (!this.energyField) return;

        const rings = this.energyField.querySelectorAll('.energy-ring');

        rings.forEach((ring, index) => {
            gsap.to(ring, {
                opacity: 0.8,
                scale: 1.5,
                duration: 0.5 + (index * 0.1),
                ease: 'power2.out',
                yoyo: true,
                repeat: 1
            });
        });
    }

    boostEnergy(amount, duration) {
        // Temporarily boost energy level
        const originalEnergy = this.energyLevel;

        gsap.to(this, {
            energyLevel: Math.min(1, this.energyLevel + amount),
            duration: 0.5,
            onUpdate: () => this.updateBreathing(),
            onComplete: () => {
                // Return to normal after duration
                setTimeout(() => {
                    gsap.to(this, {
                        energyLevel: originalEnergy,
                        duration: 1,
                        onUpdate: () => this.updateBreathing()
                    });
                }, duration);
            }
        });
    }

    startAdaptiveBehavior() {
        // Analyze event patterns and adapt
        const analyzeAndAdapt = () => {
            if (!this.isInitialized) return;

            const now = Date.now();
            const recentWindow = 30000; // 30 seconds

            // Count recent events
            const recentEvents = {
                lottie: this.eventHistory.lottie.filter(t => now - t < recentWindow).length,
                matrix: this.eventHistory.matrix.filter(t => now - t < recentWindow).length,
                glitch: this.eventHistory.glitch.filter(t => now - t < recentWindow).length,
                user: this.eventHistory.user.filter(t => now - t < recentWindow).length
            };

            // Calculate activity level
            const totalEvents = Object.values(recentEvents).reduce((a, b) => a + b, 0);
            const activityLevel = Math.min(1, totalEvents / 20);

            // Adapt behavior based on activity
            if (activityLevel > 0.7) {
                // High activity - become more reactive
                this.responsiveness = 1.5;
                this.breathIntensity = 1.2;
            } else if (activityLevel < 0.3) {
                // Low activity - subtle autonomous movements
                this.responsiveness = 0.8;
                this.breathIntensity = 0.8;

                // Random special animation
                if (Math.random() < 0.1) {
                    this.triggerRandomSpecial();
                }
            }

            // Clean old events
            this.cleanEventHistory();

            // Schedule next analysis
            setTimeout(analyzeAndAdapt, 5000);
        };

        analyzeAndAdapt();
    }

    cleanEventHistory() {
        const now = Date.now();
        const maxAge = 60000; // Keep 1 minute of history

        Object.keys(this.eventHistory).forEach(key => {
            this.eventHistory[key] = this.eventHistory[key].filter(t => now - t < maxAge);
        });
    }

    triggerRandomSpecial() {
        const specials = [
            () => this.spiralBurst(),
            () => this.quantumFlicker(),
            () => this.dimensionalShift(),
            () => this.energyVortex()
        ];

        const special = specials[Math.floor(Math.random() * specials.length)];
        special();
    }

    spiralBurst() {
        const tl = gsap.timeline();

        tl.to(this.logo, {
            rotation: '+=720',
            scale: 0.7,
            duration: 1,
            ease: 'power2.in'
        })
        .to(this.logo, {
            scale: 1.3,
            duration: 0.2,
            ease: 'power2.out'
        })
        .to(this.logo, {
            scale: 1,
            rotation: '+=180',
            duration: 0.5,
            ease: 'back.out(2)'
        });

        this.pulseEnergyRings();
    }

    quantumFlicker() {
        const tl = gsap.timeline();

        for (let i = 0; i < 10; i++) {
            tl.to(this.logo, {
                opacity: Math.random() > 0.5 ? 1 : 0.7,
                scale: 1 + (Math.random() - 0.5) * 0.1,
                duration: 0.05
            });
        }

        tl.to(this.logo, {
            opacity: 1,
            scale: 1,
            duration: 0.2
        });
    }

    dimensionalShift() {
        const tl = gsap.timeline();

        tl.to(this.logo, {
            scaleX: 0.1,
            duration: 0.3,
            ease: 'power2.in'
        })
        .to(this.logo, {
            scaleX: 1.5,
            duration: 0.2,
            ease: 'power2.out'
        })
        .to(this.logo, {
            scaleX: 1,
            duration: 0.3,
            ease: 'elastic.out(1, 0.3)'
        });
    }

    energyVortex() {
        // Create multiple rotating rings
        for (let i = 0; i < 3; i++) {
            const ring = document.createElement('div');
            ring.style.cssText = `
                position: absolute;
                width: ${100 + i * 30}%;
                height: ${100 + i * 30}%;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                border: 1px solid rgba(0, 255, 133, ${0.5 - i * 0.1});
                border-radius: 50%;
                pointer-events: none;
            `;

            if (this.logo.parentElement) {
                this.logo.parentElement.appendChild(ring);

                gsap.to(ring, {
                    rotation: 360 * (i % 2 === 0 ? 1 : -1),
                    opacity: 0,
                    scale: 2,
                    duration: 2,
                    ease: 'power2.out',
                    delay: i * 0.1,
                    onComplete: () => ring.remove()
                });
            }
        }

        gsap.to(this.logo, {
            rotation: '+=360',
            scale: 1.1,
            duration: 2,
            ease: 'power2.inOut'
        });
    }

    destroy() {
        this.isInitialized = false;

        // Cancel animations
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        if (this.observer) this.observer.disconnect();

        // Remove event listeners
        this.eventListeners.forEach(({ type, handler }) => {
            window.removeEventListener(type, handler);
        });

        // Kill GSAP animations
        if (this.breathingTimeline) this.breathingTimeline.kill();
        if (this.ambientTimeline) this.ambientTimeline.kill();
        gsap.killTweensOf([this.logo, this.glowElement, this.energyField]);

        // Remove created elements
        if (this.glowElement) this.glowElement.remove();
        if (this.energyField) this.energyField.remove();
    }
}

export default new EnhancedLogoAnimator();