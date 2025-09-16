// BEEHIVE LOGO BLEND EFFECT
// Creates a circular masked beehive video that blends through the main logo
import gsap from 'gsap';

class BeehiveLogoBlend {
    constructor() {
        this.logo = null;
        this.container = null;
        this.videoElement = null;
        this.maskElement = null;
        this.isActive = false;
        this.isInitialized = false;

        // Effect settings - OPTIMIZED FOR PERFORMANCE
        this.settings = {
            duration: 2000, // Shorter duration to reduce lag
            fadeInTime: 0.3,  // Smoother fade to reduce jarring
            fadeOutTime: 0.3, // Smoother fade
            interval: 90000, // Less frequent - every 90 seconds
            logoOpacityMin: 0.9, // Less dramatic opacity change
            logoOpacityMax: 1.0,
            beehiveOpacity: 0.2  // Lower opacity for better performance
        };
    }

    init() {
        if (this.isInitialized) {
            return;
        }


        // Find the logo element
        this.logo = document.querySelector('.image-2') ||
                    document.querySelector('img[src*="c01n"]') ||
                    document.querySelector('.image-wrapper img');

        if (!this.logo) {
            console.error('🐝 Logo element not found for beehive blend');
            return;
        }


        // Get logo position and size
        this.updateLogoPosition();

        // Create the beehive container
        this.createContainer();

        // Create video element
        this.createVideoElement();

        // Start periodic display
        this.startPeriodicDisplay();

        // Listen for window resize
        window.addEventListener('resize', () => this.updateLogoPosition());

        // Listen for animation phases
        window.addEventListener('animationPhase', (e) => this.reactToPhase(e.detail.phase));

        this.isInitialized = true;
    }

    updateLogoPosition() {
        if (!this.logo) return;

        const rect = this.logo.getBoundingClientRect();
        this.logoPosition = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            width: rect.width,
            height: rect.height,
            radius: Math.min(rect.width, rect.height) / 2
        };
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'beehive-logo-container';

        // Position behind the logo - COMPLETELY HIDDEN
        this.container.style.cssText = `
            position: fixed;
            pointer-events: none;
            z-index: -1;  // Behind everything
            opacity: 0;
            display: none;
            visibility: hidden;  // Extra hiding
        `;

        // Create circular mask
        this.maskElement = document.createElement('div');
        this.maskElement.style.cssText = `
            position: absolute;
            overflow: hidden;
            border-radius: 50%;
        `;

        this.container.appendChild(this.maskElement);
        document.body.appendChild(this.container);
    }

    createVideoElement() {
        this.videoElement = document.createElement('video');
        this.videoElement.src = './videos/beehive-loop.mp4';
        this.videoElement.loop = true;
        this.videoElement.muted = true;
        this.videoElement.playsInline = true;
        this.videoElement.autoplay = false;
        this.videoElement.playbackRate = 1.0; // Normal speed to reduce processing

        // Performance optimizations
        this.videoElement.preload = 'auto';
        this.videoElement.setAttribute('webkit-playsinline', 'true');
        this.videoElement.setAttribute('x5-video-player-type', 'h5');
        this.videoElement.setAttribute('x5-video-player-fullscreen', 'false');

        this.videoElement.style.cssText = `
            position: absolute;
            width: 100%;
            height: 100%;
            object-fit: cover;
            filter: none;  // Remove ALL filters for performance
            will-change: auto;  // Let browser optimize
            transform: translateZ(0);  // Force GPU layer
            -webkit-transform: translateZ(0);
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
        `;

        this.maskElement.appendChild(this.videoElement);

        // Preload video
        this.videoElement.load();
    }

    startPeriodicDisplay() {
        // Show after 3 seconds for testing
        setTimeout(() => {
            this.show();

            // Set up periodic display
            this.intervalId = setInterval(() => {
                if (!this.isActive) {
                    this.show();
                }
            }, this.settings.interval);
        }, 3000);
    }

    show() {
        if (this.isActive || !this.logo) return;

        this.isActive = true;

        // Update position
        this.updateLogoPosition();

        // Position and size the container - match logo size
        const pos = this.logoPosition;
        // Use actual logo size, no artificial cap
        const actualRadius = pos.radius;

        this.container.style.left = `${pos.x - actualRadius}px`;
        this.container.style.top = `${pos.y - actualRadius}px`;
        this.container.style.width = `${actualRadius * 2}px`;
        this.container.style.height = `${actualRadius * 2}px`;

        this.maskElement.style.width = `${actualRadius * 2}px`;
        this.maskElement.style.height = `${actualRadius * 2}px`;

        // Force lower quality rendering for performance
        this.videoElement.style.imageRendering = 'pixelated';
        this.videoElement.style.imageRendering = 'crisp-edges';

        this.container.style.display = 'block';
        this.container.style.visibility = 'visible';
        this.container.style.zIndex = '10';  // Bring to front when active

        // Start video with performance optimizations
        this.videoElement.currentTime = 0;
        // Request lower quality if possible
        if (this.videoElement.requestVideoFrameCallback) {
            this.videoElement.requestVideoFrameCallback(() => {});
        }
        this.videoElement.play().catch(err => {
            console.error('🐝 Video playback failed:', err);
        });

        // Create the blend animation timeline
        const tl = gsap.timeline();

        // Fade in beehive
        tl.to(this.container, {
            opacity: this.settings.beehiveOpacity,
            duration: this.settings.fadeInTime,
            ease: 'power2.inOut'
        })
        // Fade down logo opacity
        .to(this.logo, {
            opacity: this.settings.logoOpacityMin,
            duration: this.settings.fadeInTime,
            ease: 'power2.inOut'
        }, '<')
        // Add subtle pulsing effect
        .to(this.logo, {
            opacity: 0.99, // Extremely subtle pulse between 98% and 99%
            duration: 1.5,
            yoyo: true,
            repeat: 3,
            ease: 'sine.inOut'
        })
        // REMOVED filter animations for performance
        // Filter effects cause major performance issues

        // Schedule hide
        setTimeout(() => this.hide(), this.settings.duration);
    }

    hide() {
        if (!this.isActive) return;


        const tl = gsap.timeline();

        // Fade out beehive and restore logo
        tl.to(this.container, {
            opacity: 0,
            duration: this.settings.fadeOutTime,
            ease: 'power2.inOut'
        })
        .to(this.logo, {
            opacity: this.settings.logoOpacityMax,
            duration: this.settings.fadeOutTime,
            ease: 'power2.inOut',
            onComplete: () => {
                this.container.style.display = 'none';
                this.container.style.visibility = 'hidden';
                this.container.style.zIndex = '-1';  // Send to back when inactive
                this.videoElement.pause();
                this.isActive = false;
            }
        }, '<');
    }

    reactToPhase(phase) {
        switch(phase) {
            case 'intense':
            case 'glitch':
                if (!this.isActive && Math.random() > 0.5) {
                    this.show();
                }
                break;
        }
    }

    // Manual control
    trigger() {
        if (!this.isActive) {
            this.show();
        } else {
            this.hide();
        }
    }

    destroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        if (this.isActive) {
            this.hide();
        }

        gsap.killTweensOf([this.container, this.videoElement, this.logo]);

        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }

        this.isInitialized = false;
    }
}

export default new BeehiveLogoBlend();