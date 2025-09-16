// BEEHIVE VIDEO BACKGROUND EFFECT
// Special psychedelic beehive video effect that appears periodically
import gsap from 'gsap';

class BeehiveEffect {
    constructor() {
        this.videoElement = null;
        this.container = null;
        this.isActive = false;
        this.isInitialized = false;

        // Effect settings
        this.settings = {
            duration: 30000, // Show for 30 seconds
            fadeInTime: 3,
            fadeOutTime: 3,
            opacity: 0.7,
            blendMode: 'screen',
            interval: 180000 // Appear every 3 minutes
        };

        // Visual modes for the video
        this.modes = {
            normal: { opacity: 0.7, blendMode: 'screen', hueRotate: 0 },
            psychedelic: { opacity: 0.8, blendMode: 'difference', hueRotate: 180 },
            electric: { opacity: 0.6, blendMode: 'color-dodge', hueRotate: 90 },
            matrix: { opacity: 0.5, blendMode: 'multiply', hueRotate: 120 },
            neon: { opacity: 0.9, blendMode: 'hard-light', hueRotate: 270 }
        };

        this.currentMode = 'normal';
        this.intervalId = null;
    }

    init() {
        if (this.isInitialized) return;

        // Create video element
        this.createVideoElement();

        // Create container
        this.createContainer();

        // Start periodic display
        this.startPeriodicDisplay();

        // Listen for phase changes
        window.addEventListener('animationPhase', (e) => this.reactToPhase(e.detail.phase));

        this.isInitialized = true;
        console.log('🐝 Beehive Effect initialized');
    }

    createVideoElement() {
        this.videoElement = document.createElement('video');
        this.videoElement.src = '/videos/beehive-loop.mp4';
        this.videoElement.loop = true;
        this.videoElement.muted = true;
        this.videoElement.playsInline = true;
        this.videoElement.autoplay = false;

        // Optimize for performance
        this.videoElement.setAttribute('playsinline', '');
        this.videoElement.setAttribute('webkit-playsinline', '');

        this.videoElement.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            min-width: 100%;
            min-height: 100%;
            width: auto;
            height: auto;
            transform: translate(-50%, -50%) scale(1.2);
            object-fit: cover;
            pointer-events: none;
        `;

        // Preload video
        this.videoElement.load();
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'beehive-container';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 2;
            opacity: 0;
            mix-blend-mode: ${this.settings.blendMode};
            overflow: hidden;
            display: none;
        `;

        this.container.appendChild(this.videoElement);
        document.body.appendChild(this.container);
    }

    startPeriodicDisplay() {
        // Initial delay before first appearance
        setTimeout(() => {
            this.show();

            // Set up periodic display
            this.intervalId = setInterval(() => {
                if (!this.isActive) {
                    this.show();
                }
            }, this.settings.interval);
        }, 60000); // First appearance after 1 minute
    }

    show() {
        if (this.isActive) return;

        this.isActive = true;
        this.container.style.display = 'block';

        // Select random mode
        const modes = Object.keys(this.modes);
        this.currentMode = modes[Math.floor(Math.random() * modes.length)];
        this.applyMode(this.currentMode);

        // Start video playback
        this.videoElement.currentTime = 0;
        this.videoElement.play().catch(err => {
            console.warn('Beehive video playback failed:', err);
        });

        // Fade in with animation
        const tl = gsap.timeline();

        tl.to(this.container, {
            opacity: this.modes[this.currentMode].opacity,
            duration: this.settings.fadeInTime,
            ease: 'power2.out',
            onStart: () => {
                this.triggerGlitchIntro();
            }
        });

        // Add pulsing effect during display
        tl.to(this.container, {
            opacity: this.modes[this.currentMode].opacity * 0.8,
            duration: 2,
            yoyo: true,
            repeat: Math.floor(this.settings.duration / 4000),
            ease: 'sine.inOut'
        });

        // Schedule hide
        setTimeout(() => this.hide(), this.settings.duration);
    }

    hide() {
        if (!this.isActive) return;

        const tl = gsap.timeline();

        tl.to(this.container, {
            opacity: 0,
            duration: this.settings.fadeOutTime,
            ease: 'power2.in',
            onComplete: () => {
                this.container.style.display = 'none';
                this.videoElement.pause();
                this.isActive = false;
            }
        });

        // Trigger exit effect
        this.triggerGlitchExit();
    }

    applyMode(mode) {
        const modeSettings = this.modes[mode];

        this.container.style.mixBlendMode = modeSettings.blendMode;

        // Apply filter effects
        const filters = [];

        if (modeSettings.hueRotate) {
            filters.push(`hue-rotate(${modeSettings.hueRotate}deg)`);
        }

        // Add mode-specific filters
        switch(mode) {
            case 'psychedelic':
                filters.push('contrast(1.5)', 'saturate(2)');
                this.addPsychedelicAnimation();
                break;

            case 'electric':
                filters.push('brightness(1.2)', 'contrast(1.3)');
                this.addElectricAnimation();
                break;

            case 'matrix':
                filters.push('saturate(0.5)', 'brightness(0.8)');
                this.addMatrixAnimation();
                break;

            case 'neon':
                filters.push('saturate(3)', 'contrast(1.5)');
                this.addNeonAnimation();
                break;
        }

        this.videoElement.style.filter = filters.join(' ');
    }

    addPsychedelicAnimation() {
        gsap.to(this.videoElement, {
            filter: 'hue-rotate(360deg)',
            duration: 10,
            repeat: -1,
            ease: 'none'
        });
    }

    addElectricAnimation() {
        const flicker = () => {
            if (!this.isActive) return;

            gsap.to(this.videoElement, {
                filter: `brightness(${1 + Math.random() * 0.3}) contrast(${1.3 + Math.random() * 0.2})`,
                duration: 0.1,
                ease: 'none',
                onComplete: () => {
                    if (this.isActive) {
                        setTimeout(flicker, Math.random() * 500 + 100);
                    }
                }
            });
        };
        flicker();
    }

    addMatrixAnimation() {
        // Green tint overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(0deg,
                rgba(0,255,0,0.2),
                transparent 50%,
                rgba(0,255,0,0.1));
            pointer-events: none;
        `;
        this.container.appendChild(overlay);

        gsap.to(overlay, {
            backgroundPosition: '0 100%',
            duration: 3,
            repeat: -1,
            ease: 'none'
        });
    }

    addNeonAnimation() {
        gsap.to(this.videoElement, {
            scale: 1.3,
            duration: 20,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });

        // Add glow effect
        this.videoElement.style.boxShadow = '0 0 100px rgba(255,0,255,0.5)';
    }

    triggerGlitchIntro() {
        // Create glitch effect on video appearance
        const glitchTl = gsap.timeline();

        for (let i = 0; i < 5; i++) {
            glitchTl.to(this.videoElement, {
                x: Math.random() * 20 - 10,
                y: Math.random() * 20 - 10,
                scale: 1 + Math.random() * 0.1,
                duration: 0.05,
                ease: 'none'
            });
        }

        glitchTl.to(this.videoElement, {
            x: 0,
            y: 0,
            scale: 1.2,
            duration: 0.2,
            ease: 'power2.out'
        });

        // Dispatch event for other systems
        window.dispatchEvent(new CustomEvent('beehiveActive', {
            detail: { mode: this.currentMode }
        }));
    }

    triggerGlitchExit() {
        // Create exit glitch
        const glitchTl = gsap.timeline();

        glitchTl.to(this.videoElement, {
            scaleX: 1.5,
            scaleY: 0.5,
            duration: 0.2,
            ease: 'power4.in'
        })
        .to(this.videoElement, {
            scaleX: 0.5,
            scaleY: 1.5,
            opacity: 0,
            duration: 0.2,
            ease: 'power4.in'
        });

        // Dispatch event
        window.dispatchEvent(new CustomEvent('beehiveInactive'));
    }

    reactToPhase(phase) {
        // React to global animation phases
        switch(phase) {
            case 'intense':
                if (this.isActive) {
                    this.applyMode('electric');
                }
                break;

            case 'glitch':
                if (!this.isActive && Math.random() > 0.7) {
                    this.show();
                }
                break;

            case 'vaporwave':
                if (this.isActive) {
                    this.applyMode('psychedelic');
                }
                break;

            case 'cyberpunk':
                if (this.isActive) {
                    this.applyMode('neon');
                }
                break;
        }
    }

    // Manual controls
    trigger() {
        if (!this.isActive) {
            this.show();
        } else {
            this.hide();
        }
    }

    setMode(mode) {
        if (this.modes[mode] && this.isActive) {
            this.currentMode = mode;
            this.applyMode(mode);
        }
    }

    destroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        if (this.isActive) {
            this.hide();
        }

        gsap.killTweensOf([this.container, this.videoElement]);

        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }

        this.isInitialized = false;
    }
}

export default new BeehiveEffect();