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
            duration: 45000, // Show for 45 seconds (was 30)
            fadeInTime: 3,
            fadeOutTime: 3,
            opacity: 0.85, // More visible
            blendMode: 'screen',
            interval: 180000 // Appear every 3 minutes
        };

        // Visual modes for the video - increased intensity
        this.modes = {
            normal: { opacity: 0.5, blendMode: 'screen', hueRotate: 0, saturation: 1.5, brightness: 1.3 },
            psychedelic: { opacity: 0.6, blendMode: 'difference', hueRotate: 180, saturation: 2, brightness: 1.4 },
            electric: { opacity: 0.45, blendMode: 'color-dodge', hueRotate: 90, saturation: 1.8, brightness: 1.5 },
            matrix: { opacity: 0.4, blendMode: 'multiply', hueRotate: 120, saturation: 1.6, brightness: 1.2 },
            neon: { opacity: 0.7, blendMode: 'hard-light', hueRotate: 270, saturation: 2.2, brightness: 1.6 }
        };

        this.currentMode = 'normal';
        this.intervalId = null;
    }

    init() {
        if (this.isInitialized) {
            console.log('🐝 Beehive Effect already initialized');
            return;
        }

        console.log('🐝 Starting Beehive Effect initialization...');

        // Create video element
        this.createVideoElement();
        console.log('🐝 Video element created');

        // Create container
        this.createContainer();
        console.log('🐝 Container created and added to DOM');

        // Start periodic display
        this.startPeriodicDisplay();
        console.log('🐝 Periodic display scheduled');

        // Listen for phase changes
        window.addEventListener('animationPhase', (e) => this.reactToPhase(e.detail.phase));

        this.isInitialized = true;
        console.log('🐝 Beehive Effect fully initialized');
    }

    createVideoElement() {
        this.videoElement = document.createElement('video');
        this.videoElement.src = './videos/beehive-loop.mp4';
        this.videoElement.loop = true;
        this.videoElement.muted = true;
        this.videoElement.playsInline = true;
        this.videoElement.autoplay = false;

        // Optimize for performance
        this.videoElement.setAttribute('playsinline', '');
        this.videoElement.setAttribute('webkit-playsinline', '');

        this.videoElement.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            pointer-events: none;
            z-index: -1;
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
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 1;
            opacity: 0;
            mix-blend-mode: ${this.settings.blendMode};
            overflow: hidden;
            display: none;
        `;

        this.container.appendChild(this.videoElement);
        document.body.appendChild(this.container);
    }

    startPeriodicDisplay() {
        // Show immediately for debugging
        console.log('🐝 Showing beehive immediately for debugging');

        // Show right away
        setTimeout(() => {
            this.show();
        }, 1000); // 1 second delay just to ensure DOM is ready

        // Then set up periodic display
        this.intervalId = setInterval(() => {
            if (!this.isActive) {
                console.log('🐝 Triggering periodic beehive appearance');
                this.show();
            }
        }, this.settings.interval);
    }

    show() {
        if (this.isActive) {
            console.log('🐝 Beehive already active, skipping');
            return;
        }

        console.log('🐝 Showing beehive effect');
        this.isActive = true;
        this.container.style.display = 'block';

        // Select random mode
        const modes = Object.keys(this.modes);
        this.currentMode = modes[Math.floor(Math.random() * modes.length)];
        this.applyMode(this.currentMode);

        // Start video playback
        this.videoElement.currentTime = 0;
        console.log('🐝 Attempting to play video from:', this.videoElement.src);
        this.videoElement.play().then(() => {
            console.log('🐝 Video playing successfully');
        }).catch(err => {
            console.error('🐝 Beehive video playback failed:', err);
            console.log('🐝 Video readyState:', this.videoElement.readyState);
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

        // Restore logo opacity when hiding beehive
        this.restoreLogo();

        // Trigger exit effect
        this.triggerGlitchExit();
    }

    applyMode(mode) {
        const modeSettings = this.modes[mode];

        this.container.style.mixBlendMode = modeSettings.blendMode;

        // Apply filter effects with enhanced settings
        const filters = [];

        if (modeSettings.hueRotate) {
            filters.push(`hue-rotate(${modeSettings.hueRotate}deg)`);
        }

        // Apply saturation and brightness from mode settings
        if (modeSettings.saturation) {
            filters.push(`saturate(${modeSettings.saturation})`);
        }
        if (modeSettings.brightness) {
            filters.push(`brightness(${modeSettings.brightness})`);
        }

        // Add additional mode-specific enhancements
        switch(mode) {
            case 'psychedelic':
                filters.push('contrast(1.8)');
                this.addPsychedelicAnimation();
                break;

            case 'electric':
                filters.push('contrast(1.5)');
                this.addElectricAnimation();
                break;

            case 'matrix':
                filters.push('contrast(1.3)');
                this.addMatrixAnimation();
                break;

            case 'neon':
                filters.push('contrast(2)');
                this.addNeonAnimation();
                break;
        }

        this.videoElement.style.filter = filters.join(' ');

        // Also reduce logo opacity during beehive effect
        this.reduceLogo();
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
        // Subtle zoom instead of scale to avoid layout issues
        gsap.to(this.videoElement, {
            width: '110%',
            height: '110%',
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

    reduceLogo() {
        // Reduce logo opacity during beehive effect
        const logos = document.querySelectorAll('.image-wrapper, .image-2, img[src*="c01n"]');
        logos.forEach(logo => {
            gsap.to(logo, {
                opacity: 0.3,  // Reduce to 30% opacity
                duration: 2,
                ease: 'power2.inOut'
            });
        });
    }

    restoreLogo() {
        // Restore logo opacity after beehive effect
        const logos = document.querySelectorAll('.image-wrapper, .image-2, img[src*="c01n"]');
        logos.forEach(logo => {
            gsap.to(logo, {
                opacity: 1,  // Back to full opacity
                duration: 2,
                ease: 'power2.inOut'
            });
        });
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