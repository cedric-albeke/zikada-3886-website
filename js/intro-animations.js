import gsap from 'gsap';

class IntroAnimations {
    constructor() {
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupAnimations());
        } else {
            this.setupAnimations();
        }

        this.initialized = true;
    }

    setupAnimations() {
        // Get elements
        const logoTextWrapper = document.querySelector('.logo-text-wrapper');
        const enterButtonWrapper = document.querySelector('.enter-button-wrapper');
        const imageWrapper = document.querySelector('.image-wrapper');

        // Animate ZIKADA text - starts from up, moves down to 0
        // Animate 3886 text - starts from down, moves up to 0
        // EXACT same timing and easing for perfect synchronization
        const animationConfig = {
            duration: 1.5,
            ease: 'power3.out',
            delay: 0.5,  // Same delay for both
            opacity: 1
        };

        if (logoTextWrapper) {
            gsap.fromTo(logoTextWrapper,
                {
                    y: '-25%',  // Start from above
                    opacity: 0
                },
                {
                    y: '0%',  // Move down to center
                    ...animationConfig
                }
            );
        }

        if (enterButtonWrapper) {
            gsap.fromTo(enterButtonWrapper,
                {
                    y: '20%',  // Start from below
                    opacity: 0
                },
                {
                    y: '0%',  // Move up to center
                    ...animationConfig
                }
            );
        }

        // Animate cicada image - scale and fade in smoothly without flashing
        if (imageWrapper) {
            gsap.fromTo(imageWrapper,
                {
                    scale: 0.9,
                    opacity: 0,
                    filter: 'brightness(60%)' // Start dimmed instead of black to avoid flash
                },
                {
                    scale: 1,
                    opacity: 1,
                    filter: 'brightness(60%)', // Keep same brightness to avoid bright flash
                    duration: 1.5,
                    ease: 'power3.out',
                    delay: 0.4
                }
            );
        }

        // Animate background - preserve proper scale of 3
        const bg = document.querySelector('.bg');
        if (bg) {
            gsap.fromTo(bg,
                {
                    scale: 8,
                    opacity: 0,
                    rotateX: 0
                },
                {
                    scale: 3, // Preserve correct scale for circular grid effect
                    opacity: 0.07, // Match original CSS opacity
                    rotateX: 0,
                    duration: 2,
                    ease: 'power3.out',
                    delay: 0.2
                }
            );
        }
    }
}

export default new IntroAnimations();