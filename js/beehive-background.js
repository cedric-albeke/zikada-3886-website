import gsap from 'gsap';

class BeehiveBackground {
    constructor() {
        this.initialized = false;
        this.container = null;
    }

    init() {
        if (this.initialized) return;

        this.createBeehiveBackground();
        this.initialized = true;
    }

    createBeehiveBackground() {
        // Create container for the beehive background
        this.container = document.createElement('div');
        this.container.className = 'beehive-bg-container';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: -2;  // Behind everything
            pointer-events: none;
            overflow: hidden;
            opacity: 0;
        `;

        // Create the beehive pattern overlay
        const beehivePattern = document.createElement('div');
        beehivePattern.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 150%;
            height: 150%;
            transform: translate(-50%, -50%);
            background-image:
                radial-gradient(circle at 20% 80%, transparent 0%, transparent 50%, rgba(0, 255, 133, 0.01) 50%, rgba(0, 255, 133, 0.01) 100%),
                linear-gradient(60deg, transparent 0%, transparent 40%, rgba(0, 255, 133, 0.005) 40%, rgba(0, 255, 133, 0.005) 60%, transparent 60%, transparent 100%),
                linear-gradient(120deg, transparent 0%, transparent 40%, rgba(0, 255, 133, 0.005) 40%, rgba(0, 255, 133, 0.005) 60%, transparent 60%, transparent 100%);
            background-size: 80px 80px, 80px 140px, 80px 140px;
            background-position: 0 0, 0 0, 40px 70px;
            animation: beehiveFloat 30s ease-in-out infinite, beehivePan 45s linear infinite;
            filter: blur(1px);
        `;

        this.container.appendChild(beehivePattern);

        // Add animated hexagon particles
        this.createHexagonParticles();

        // Add to body
        document.body.appendChild(this.container);

        // Fade in the background
        gsap.to(this.container, {
            opacity: 0.01,  // 1% opacity as requested
            duration: 3,
            ease: 'power2.inOut'
        });

        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes beehiveFloat {
                0% {
                    transform: translate(-50%, -50%) rotate(0deg) scale(1);
                }
                25% {
                    transform: translate(-48%, -52%) rotate(2deg) scale(1.05);
                }
                50% {
                    transform: translate(-52%, -50%) rotate(-1deg) scale(0.95);
                }
                75% {
                    transform: translate(-50%, -48%) rotate(1deg) scale(1.03);
                }
                100% {
                    transform: translate(-50%, -50%) rotate(0deg) scale(1);
                }
            }

            @keyframes beehivePan {
                0% {
                    background-position: 0 0, 0 0, 40px 70px;
                }
                100% {
                    background-position: 80px 80px, 80px 140px, 120px 210px;
                }
            }

            @keyframes hexFloat {
                0% {
                    transform: translateY(100vh) rotate(0deg);
                    opacity: 0;
                }
                10% {
                    opacity: 0.3;
                }
                90% {
                    opacity: 0.3;
                }
                100% {
                    transform: translateY(-100vh) rotate(360deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    createHexagonParticles() {
        // Create subtle floating hexagon particles
        for (let i = 0; i < 8; i++) {  // Increased from 5 to 8 particles
            setTimeout(() => {
                const hex = document.createElement('div');
                const size = Math.random() * 40 + 20;  // Slightly larger
                const xPos = Math.random() * 100;
                const duration = Math.random() * 25 + 20;  // Faster animation

                hex.style.cssText = `
                    position: absolute;
                    left: ${xPos}%;
                    bottom: -50px;
                    width: ${size}px;
                    height: ${size}px;
                    opacity: 0;
                    pointer-events: none;
                    animation: hexFloat ${duration}s linear infinite;
                    animation-delay: ${Math.random() * duration}s;
                `;

                // Create hexagon shape with CSS
                hex.innerHTML = `
                    <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
                        <polygon points="50,10 85,30 85,70 50,90 15,70 15,30"
                                 fill="none"
                                 stroke="rgba(0, 255, 133, 0.15)"
                                 stroke-width="1.5"/>
                    </svg>
                `;

                this.container.appendChild(hex);

                // Remove after animation completes
                setTimeout(() => {
                    if (hex.parentNode) {
                        hex.remove();
                    }
                }, duration * 1000);
            }, i * 5000);
        }

        // Continuously create new particles
        setInterval(() => {
            this.createHexagonParticles();
        }, 15000);  // More frequent particle generation
    }
}

export default new BeehiveBackground();