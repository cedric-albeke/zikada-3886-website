// Direct Logo Animation - JavaScript-based manipulation
import gsap from 'gsap';

class DirectLogoAnimation {
    constructor() {
        this.logo = null;
        this.container = null;
        this.isAnimating = false;
    }

    init() {
        console.log('🎯 Direct Logo Animation initializing...');

        // Find logo element
        this.logo = document.querySelector('.image-2, img[src*="c01n"]');

        if (!this.logo) {
            console.log('Logo not found, retrying...');
            setTimeout(() => this.init(), 1000);
            return;
        }

        console.log('✅ Logo found, wrapping in container');

        // Wrap logo in a container div to control it better
        this.wrapLogo();

        // Set up event listeners
        this.setupEventListeners();

        // Start base breathing effect
        this.startBreathing();
    }

    wrapLogo() {
        // Create a wrapper div
        this.container = document.createElement('div');
        this.container.className = 'logo-animation-container';
        this.container.style.cssText = `
            display: inline-block;
            position: relative;
        `;

        // Insert wrapper before logo
        this.logo.parentNode.insertBefore(this.container, this.logo);

        // Move logo into wrapper
        this.container.appendChild(this.logo);

        // Ensure logo doesn't have conflicting styles
        this.logo.style.position = 'relative';
        this.logo.style.zIndex = '30';
    }

    startBreathing() {
        // Use GSAP on the container, not the logo itself
        gsap.to(this.container, {
            scale: 1.05,
            duration: 3,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1
        });
    }

    setupEventListeners() {
        // Listen for Lottie animations
        window.addEventListener('lottieAnimationStart', (event) => {
            const animationType = event.detail?.name;
            console.log('🎬 Direct animation reacting to Lottie:', animationType);

            switch(animationType) {
                case 'planetRing':
                case 'circuitRound':
                    this.wobble();
                    break;
                case 'planetLogo':
                case 'morphingParticle':
                    this.pump();
                    break;
                case 'transparentDiamond':
                case 'geometricalLines':
                    this.glitch();
                    break;
                case 'circularDots':
                    this.pulse();
                    break;
            }
        });

    }

    wobble() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        console.log('🌊 Wobble animation');

        gsap.to(this.container, {
            rotation: 5,
            duration: 0.1,
            ease: 'power2.inOut',
            yoyo: true,
            repeat: 5,
            onComplete: () => {
                gsap.set(this.container, { rotation: 0 });
                this.isAnimating = false;
            }
        });
    }

    pump() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        console.log('💓 Pump animation');

        const tl = gsap.timeline({
            onComplete: () => this.isAnimating = false
        });

        tl.to(this.container, {
            scale: 1.3,
            duration: 0.2,
            ease: 'power2.out'
        })
        .to(this.container, {
            scale: 0.9,
            duration: 0.1,
            ease: 'power2.in'
        })
        .to(this.container, {
            scale: 1.1,
            duration: 0.15,
            ease: 'power2.out'
        })
        .to(this.container, {
            scale: 1,
            duration: 0.2,
            ease: 'elastic.out(1, 0.3)'
        });
    }

    glitch() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        console.log('⚡ Glitch animation');

        const tl = gsap.timeline({
            onComplete: () => {
                gsap.set(this.container, { x: 0, y: 0, skewX: 0 });
                this.isAnimating = false;
            }
        });

        for (let i = 0; i < 8; i++) {
            tl.to(this.container, {
                x: gsap.utils.random(-10, 10),
                y: gsap.utils.random(-10, 10),
                skewX: gsap.utils.random(-5, 5),
                duration: 0.05,
                ease: 'none'
            });
        }
    }

    pulse() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        console.log('✨ Pulse animation');

        // Create a glow effect
        const glow = document.createElement('div');
        glow.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(0, 255, 133, 0.6), transparent 70%);
            pointer-events: none;
            opacity: 0;
            z-index: -1;
        `;
        this.container.appendChild(glow);

        const tl = gsap.timeline({
            onComplete: () => {
                glow.remove();
                this.isAnimating = false;
            }
        });

        tl.to(glow, {
            opacity: 1,
            scale: 2,
            duration: 0.3,
            ease: 'power2.out'
        })
        .to(glow, {
            opacity: 0,
            scale: 3,
            duration: 0.5,
            ease: 'power2.in'
        });

        // Also pulse the logo
        gsap.to(this.container, {
            scale: 1.15,
            duration: 0.3,
            ease: 'power2.out',
            yoyo: true,
            repeat: 1
        });
    }

    bigBounce() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        console.log('🎪 Big bounce animation');

        const tl = gsap.timeline({
            onComplete: () => this.isAnimating = false
        });

        tl.to(this.container, {
            scale: 0.8,
            duration: 0.1,
            ease: 'power2.in'
        })
        .to(this.container, {
            scale: 1.4,
            rotation: 180,
            duration: 0.3,
            ease: 'back.out(2)'
        })
        .to(this.container, {
            scale: 1,
            rotation: 360,
            duration: 0.4,
            ease: 'elastic.out(1, 0.3)'
        })
        .set(this.container, { rotation: 0 });
    }

    // Test methods
    testAll() {
        console.log('🧪 Testing all direct animations...');
        this.wobble();
        setTimeout(() => this.pump(), 1500);
        setTimeout(() => this.glitch(), 3000);
        setTimeout(() => this.pulse(), 4500);
        setTimeout(() => this.bigBounce(), 6000);
    }
}

// Initialize and expose
const directLogoAnimation = new DirectLogoAnimation();
directLogoAnimation.init();

// Expose to window for testing
window.directLogoAnimation = directLogoAnimation;
window.testDirectWobble = () => directLogoAnimation.wobble();
window.testDirectPump = () => directLogoAnimation.pump();
window.testDirectGlitch = () => directLogoAnimation.glitch();
window.testDirectPulse = () => directLogoAnimation.pulse();
window.testDirectBounce = () => directLogoAnimation.bigBounce();
window.testAllDirectAnimations = () => directLogoAnimation.testAll();

console.log('💡 Direct Logo Animation ready! Test with:');
console.log('  window.testAllDirectAnimations() - Test all animations');
console.log('  window.testDirectWobble() - Test wobble');
console.log('  window.testDirectPump() - Test pump');
console.log('  window.testDirectGlitch() - Test glitch');
console.log('  window.testDirectPulse() - Test pulse');
console.log('  window.testDirectBounce() - Test big bounce');

export default directLogoAnimation;