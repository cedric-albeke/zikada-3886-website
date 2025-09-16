// Simple Logo Animation System - CSS-based approach
class SimpleLogoAnimation {
    constructor() {
        this.logo = null;
        this.styleSheet = null;
        this.animationActive = false;
    }

    init() {
        console.log('🎯 Simple Logo Animation initializing...');

        // Find logo element
        this.logo = document.querySelector('.image-2, img[src*="c01n"]');

        if (!this.logo) {
            console.log('Logo not found, retrying...');
            setTimeout(() => this.init(), 1000);
            return;
        }

        console.log('✅ Logo found, setting up CSS animations');

        // Create stylesheet for animations
        this.createAnimationStyles();

        // Add animation class to logo
        this.logo.classList.add('animated-logo');

        // Set up event listeners
        this.setupEventListeners();

        // Start base animation
        this.startBaseAnimation();
    }

    createAnimationStyles() {
        // Create a style element
        const style = document.createElement('style');
        style.textContent = `
            @keyframes logoBreath {
                0%, 100% {
                    filter: brightness(1) drop-shadow(0 0 10px rgba(0, 255, 133, 0.3));
                    opacity: 1;
                }
                50% {
                    filter: brightness(1.2) drop-shadow(0 0 30px rgba(0, 255, 133, 0.8));
                    opacity: 0.95;
                }
            }

            @keyframes logoWobble {
                0%, 100% {
                    filter: brightness(1) hue-rotate(0deg);
                    margin-left: 0;
                }
                25% {
                    filter: brightness(1.1) hue-rotate(10deg);
                    margin-left: 3px;
                }
                50% {
                    filter: brightness(1.1) hue-rotate(-10deg);
                    margin-left: -3px;
                }
                75% {
                    filter: brightness(1.05) hue-rotate(5deg);
                    margin-left: 2px;
                }
            }

            @keyframes logoPump {
                0%, 100% {
                    filter: brightness(1) contrast(100%);
                    padding: 0;
                }
                25% {
                    filter: brightness(1.3) contrast(110%);
                    padding: 5px;
                }
                50% {
                    filter: brightness(0.9) contrast(95%);
                    padding: -2px;
                }
                75% {
                    filter: brightness(1.2) contrast(105%);
                    padding: 3px;
                }
            }

            @keyframes logoGlitch {
                0%, 100% {
                    filter: brightness(1) saturate(100%);
                    text-shadow: none;
                }
                20% {
                    filter: brightness(1.2) saturate(150%) hue-rotate(90deg);
                    text-shadow: 2px 2px 4px rgba(255, 0, 0, 0.5);
                }
                40% {
                    filter: brightness(0.8) saturate(200%) hue-rotate(-90deg);
                    text-shadow: -2px -2px 4px rgba(0, 255, 0, 0.5);
                }
                60% {
                    filter: brightness(1.1) saturate(150%) hue-rotate(45deg);
                    text-shadow: 1px 1px 2px rgba(0, 0, 255, 0.5);
                }
                80% {
                    filter: brightness(0.95) saturate(120%) hue-rotate(-45deg);
                    text-shadow: -1px -1px 2px rgba(255, 255, 0, 0.5);
                }
            }

            @keyframes logoPulse {
                0%, 100% {
                    filter: drop-shadow(0 0 10px rgba(0, 255, 133, 0.5)) brightness(1);
                    outline: 2px solid transparent;
                }
                50% {
                    filter: drop-shadow(0 0 40px rgba(0, 255, 133, 1)) brightness(1.3);
                    outline: 2px solid rgba(0, 255, 133, 0.5);
                }
            }

            .animated-logo {
                animation: logoBreath 6s ease-in-out infinite;
                transform-origin: center center !important;
                will-change: transform, filter;
                transition: all 0.3s ease;
            }

            .animated-logo.wobble {
                animation: logoWobble 0.8s ease-in-out !important;
            }

            .animated-logo.pump {
                animation: logoPump 0.8s ease-out !important;
            }

            .animated-logo.glitch {
                animation: logoGlitch 0.5s linear !important;
            }

            .animated-logo.pulse {
                animation: logoPulse 1s ease-in-out !important;
            }

            .animated-logo:hover {
                filter: brightness(1.4) drop-shadow(0 0 50px rgba(0, 255, 133, 1)) saturate(120%) !important;
                cursor: pointer;
                opacity: 0.95 !important;
            }
        `;

        document.head.appendChild(style);
        this.styleSheet = style;
    }

    setupEventListeners() {
        // Listen for Lottie animations
        window.addEventListener('lottieAnimationStart', (event) => {
            const animationType = event.detail?.name;
            console.log('🎬 Logo reacting to Lottie:', animationType);

            switch(animationType) {
                case 'planetRing':
                case 'circuitRound':
                    this.triggerAnimation('wobble');
                    break;
                case 'planetLogo':
                case 'morphingParticle':
                    this.triggerAnimation('pump');
                    break;
                case 'transparentDiamond':
                case 'geometricalLines':
                    this.triggerAnimation('glitch');
                    break;
                case 'circularDots':
                    this.triggerAnimation('pulse');
                    break;
            }
        });

        // Listen for VHS glitch
        window.addEventListener('vhsGlitch', () => {
            this.triggerAnimation('glitch');
        });

        // Listen for chaos phases
        window.addEventListener('chaosPhase', (event) => {
            const phase = event.detail?.phase;
            switch(phase) {
                case 'glitch':
                    this.triggerAnimation('glitch');
                    break;
                case 'intense':
                    this.triggerAnimation('pump');
                    break;
                case 'matrix':
                    this.triggerAnimation('wobble');
                    break;
                case 'calm':
                    this.triggerAnimation('pulse');
                    break;
            }
        });

        // Click animation
        this.logo.addEventListener('click', () => {
            this.triggerAnimation('pump');
        });

        // Hover is handled by CSS
    }

    triggerAnimation(type) {
        if (this.animationActive) return;

        console.log(`🎭 Triggering ${type} animation`);
        this.animationActive = true;

        // Remove base animation temporarily
        this.logo.style.animation = 'none';

        // Force reflow
        void this.logo.offsetHeight;

        // Add animation class
        this.logo.classList.add(type);

        // Remove class after animation
        setTimeout(() => {
            this.logo.classList.remove(type);
            this.animationActive = false;

            // Restore base animation
            this.logo.style.animation = '';
        }, 1000);
    }

    startBaseAnimation() {
        // The base breathing animation is applied via CSS class
        console.log('✅ Base breathing animation started');
    }

    // Public methods for testing
    testWobble() {
        this.triggerAnimation('wobble');
    }

    testPump() {
        this.triggerAnimation('pump');
    }

    testGlitch() {
        this.triggerAnimation('glitch');
    }

    testPulse() {
        this.triggerAnimation('pulse');
    }

    testAll() {
        console.log('🧪 Testing all animations...');
        this.testWobble();
        setTimeout(() => this.testPump(), 1500);
        setTimeout(() => this.testGlitch(), 3000);
        setTimeout(() => this.testPulse(), 4500);
    }
}

// Initialize and expose
const simpleLogoAnimation = new SimpleLogoAnimation();
simpleLogoAnimation.init();

// Expose to window for testing
window.simpleLogoAnimation = simpleLogoAnimation;
window.testLogoWobble = () => simpleLogoAnimation.testWobble();
window.testLogoPump = () => simpleLogoAnimation.testPump();
window.testLogoGlitch = () => simpleLogoAnimation.testGlitch();
window.testLogoPulse = () => simpleLogoAnimation.testPulse();
window.testAllLogoAnimations = () => simpleLogoAnimation.testAll();

console.log('💡 Simple Logo Animation ready! Test with:');
console.log('  window.testAllLogoAnimations() - Test all animations');
console.log('  window.testLogoWobble() - Test wobble');
console.log('  window.testLogoPump() - Test pump');
console.log('  window.testLogoGlitch() - Test glitch');
console.log('  window.testLogoPulse() - Test pulse');

export default simpleLogoAnimation;