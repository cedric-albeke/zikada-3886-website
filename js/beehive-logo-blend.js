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

        // Effect settings - GLITCHY AND SUPER FAST
        this.settings = {
            duration: 3000, // Much shorter - only 3 seconds (was 15)
            fadeInTime: 0.05,  // INSTANT glitch in (was 0.2)
            fadeOutTime: 0.1, // INSTANT glitch out (was 0.3)
            interval: 60000, // Every minute
            logoOpacityMin: 0.99, // Even MORE subtle - 99% opacity (was 98%)
            logoOpacityMax: 1.0,
            beehiveOpacity: 0.15  // Even MORE subtle - 15% opacity (was 30%)
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

        // Position behind the logo
        this.container.style.cssText = `
            position: fixed;
            pointer-events: none;
            z-index: 10;
            opacity: 0;
            display: none;
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
        this.videoElement.playbackRate = 2.0; // Double speed playback

        this.videoElement.style.cssText = `
            position: absolute;
            width: 100%;
            height: 100%;
            object-fit: cover;
            filter: contrast(1.1) brightness(0.9);  // REDUCED contrast and brightness for subtlety
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

        // Position and size the container
        const pos = this.logoPosition;
        this.container.style.left = `${pos.x - pos.radius}px`;
        this.container.style.top = `${pos.y - pos.radius}px`;
        this.container.style.width = `${pos.radius * 2}px`;
        this.container.style.height = `${pos.radius * 2}px`;

        this.maskElement.style.width = `${pos.radius * 2}px`;
        this.maskElement.style.height = `${pos.radius * 2}px`;

        this.container.style.display = 'block';

        // Start video
        this.videoElement.currentTime = 0;
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
        // Apply filter effects to video
        .to(this.videoElement, {
            filter: 'hue-rotate(180deg) saturate(2)',
            duration: 5,
            yoyo: true,
            repeat: 1,
            ease: 'sine.inOut'
        }, '<');

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