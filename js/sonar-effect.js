import gsap from 'gsap';
import animationRuntime from './runtime/animation-runtime.js';

const RUNTIME_OWNER = 'sonar-effect';
const SESSION_OWNER = 'sonar-effect:session';

class SonarEffect {
    constructor() {
        this.isActive = false;
        this.container = null;
        this.sonar = null;
        this.blips = [];
        this.sweepAngle = 0;
        this.nextDisplayToken = null;
        this.phaseHandler = (event) => this.reactToPhase(event.detail.phase);
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;
        this.createSonarScreen();

        // Start periodic display - show every 45-75 seconds
        this.startPeriodicDisplay();

        // Listen for animation phases
        window.addEventListener('animationPhase', this.phaseHandler);
        animationRuntime.trackDisposer(RUNTIME_OWNER, () => {
            window.removeEventListener('animationPhase', this.phaseHandler);
        });
        this.isInitialized = true;
    }

    startPeriodicDisplay() {
        this.scheduleNextDisplay(15000);
    }

    scheduleNextDisplay(delay = Math.random() * 30000 + 45000) {
        this.nextDisplayToken?.clear();
        this.nextDisplayToken = animationRuntime.scheduleTimeout(RUNTIME_OWNER, () => {
            this.nextDisplayToken = null;
            if (!this.isActive) this.show();
        }, delay);
    }

    createSonarScreen() {
        // Create container - FULL WIDTH CENTERED like the logo
        this.container = document.createElement('div');
        this.container.className = 'sonar-container';

        // Calculate size based on viewport - DOUBLE the size
        const size = Math.min(window.innerWidth, window.innerHeight) * 0.8; // 80% of viewport

        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: radial-gradient(circle,
                rgba(0, 255, 133, 0.03) 0%,
                rgba(0, 255, 133, 0.01) 30%,
                transparent 100%);
            border: 1px solid rgba(0, 255, 133, 0.1);
            overflow: hidden;
            pointer-events: none;
            z-index: 2; // Behind logo (which is usually z-index 10+)
            opacity: 0; // Start hidden
            box-shadow:
                inset 0 0 100px rgba(0, 255, 133, 0.05),
                0 0 50px rgba(0, 255, 133, 0.05);
        `;
        document.body.appendChild(this.container);

        // Create grid lines
        this.createGridLines();

        // Create sweep line
        this.createSweepLine();

    }

    createGridLines() {
        // Create concentric circles - more circles for larger size
        for (let i = 1; i <= 4; i++) {
            const circle = document.createElement('div');
            const size = (i / 4) * 100;
            circle.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                width: ${size}%;
                height: ${size}%;
                border: 1px solid rgba(0, 255, 133, 0.05);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                pointer-events: none;
            `;
            this.container.appendChild(circle);
        }

        // Create cross lines - very subtle
        const verticalLine = document.createElement('div');
        verticalLine.style.cssText = `
            position: absolute;
            top: 0;
            left: 50%;
            width: 1px;
            height: 100%;
            background: rgba(0, 255, 133, 0.05);
            transform: translateX(-50%);
        `;
        this.container.appendChild(verticalLine);

        const horizontalLine = document.createElement('div');
        horizontalLine.style.cssText = `
            position: absolute;
            top: 50%;
            left: 0;
            width: 100%;
            height: 1px;
            background: rgba(0, 255, 133, 0.05);
            transform: translateY(-50%);
        `;
        this.container.appendChild(horizontalLine);
    }

    createSweepLine() {
        // Create sweep container
        const sweepContainer = document.createElement('div');
        sweepContainer.className = 'sonar-sweep-container';
        sweepContainer.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 100%;
            height: 100%;
            transform: translate(-50%, -50%);
            pointer-events: none;
        `;
        this.container.appendChild(sweepContainer);

        // Create sweep line - very subtle
        this.sweep = document.createElement('div');
        this.sweep.className = 'sonar-sweep';
        this.sweep.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 50%;
            height: 1px;
            background: linear-gradient(90deg,
                rgba(0, 255, 133, 0.4) 0%,
                rgba(0, 255, 133, 0.2) 50%,
                transparent 100%);
            transform-origin: 0 50%;
            transform: rotate(0deg);
            box-shadow: 0 0 10px rgba(0, 255, 133, 0.2);
        `;
        sweepContainer.appendChild(this.sweep);

        // Create sweep trail effect
        const trail = document.createElement('div');
        trail.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: conic-gradient(
                from 0deg,
                transparent 0deg,
                rgba(0, 255, 133, 0.1) 30deg,
                transparent 90deg,
                transparent 360deg
            );
            transform: rotate(-30deg);
            opacity: 0;
        `;
        sweepContainer.appendChild(trail);

        this.trail = trail;
    }

    startSweep() {
        const ambientTween = gsap.to(this.container, {
            boxShadow: 'inset 0 0 120px rgba(0, 255, 133, 0.08), 0 0 80px rgba(0, 255, 133, 0.1)',
            duration: 3,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });
        animationRuntime.trackAnimation(SESSION_OWNER, ambientTween);

        const trailTween = gsap.to(this.trail, {
            rotation: 330,
            opacity: 0.5,
            duration: 3,
            repeat: -1,
            ease: 'linear'
        });
        animationRuntime.trackAnimation(SESSION_OWNER, trailTween);

        // Continuous sweep rotation
        const sweepTween = gsap.to(this.sweep, {
            rotation: 360,
            duration: 3,
            repeat: -1,
            ease: 'linear',
            onUpdate: () => {
                this.sweepAngle = gsap.getProperty(this.sweep, 'rotation');
                this.checkBlipDetection();
            }
        });
        animationRuntime.trackAnimation(SESSION_OWNER, sweepTween);
    }

    generateRandomBlips() {
        // Create random blips on the sonar
        const createBlip = () => {
            const angle = Math.random() * 360;
            const distance = Math.random() * 80 + 10; // 10-90% from center

            const blip = document.createElement('div');
            blip.className = 'sonar-blip';

            // Calculate position based on polar coordinates
            const radian = (angle * Math.PI) / 180;
            const x = Math.cos(radian) * distance;
            const y = Math.sin(radian) * distance;

            blip.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                width: 6px;
                height: 6px;
                background: #00ff85;
                border-radius: 50%;
                transform: translate(-50%, -50%) translate(${x}%, ${y}%);
                opacity: 0;
                pointer-events: none;
                box-shadow: 0 0 10px #00ff85;
            `;

            this.container.appendChild(blip);
            animationRuntime.trackNode(SESSION_OWNER, blip);
            this.blips.push({ element: blip, angle: angle, active: false });

            // Fade in animation
            gsap.to(blip, {
                opacity: 0.8,
                duration: 0.3,
                ease: 'power2.out'
            });

            // Remove blip after some time
            animationRuntime.scheduleTimeout(SESSION_OWNER, () => {
                const fadeTween = gsap.to(blip, {
                    opacity: 0,
                    scale: 2,
                    duration: 1,
                    ease: 'power2.out',
                    onComplete: () => {
                        blip.remove();
                        this.blips = this.blips.filter(b => b.element !== blip);
                    }
                });
                animationRuntime.trackAnimation(SESSION_OWNER, fadeTween);
            }, Math.random() * 5000 + 3000);
        };

        // Create initial blips
        for (let i = 0; i < 3; i++) {
            animationRuntime.scheduleTimeout(SESSION_OWNER, () => createBlip(), i * 500);
        }

        // Continue creating blips periodically
        animationRuntime.scheduleInterval(SESSION_OWNER, () => {
            if (Math.random() > 0.5 && this.blips.length < 5) {
                createBlip();
            }
        }, 2000);
    }

    checkBlipDetection() {
        // Check if sweep line passes over blips
        this.blips.forEach(blip => {
            const angleDiff = Math.abs(this.sweepAngle - blip.angle);

            if (angleDiff < 10 && !blip.active) {
                blip.active = true;

                // Pulse effect when detected
                gsap.to(blip.element, {
                    scale: 1.5,
                    opacity: 1,
                    duration: 0.2,
                    yoyo: true,
                    repeat: 1,
                    ease: 'power2.out'
                });

                // Create detection ring
                this.createDetectionRing(blip.element);
            } else if (angleDiff > 30) {
                blip.active = false;
            }
        });
    }

    createDetectionRing(blipElement) {
        const ring = document.createElement('div');
        const rect = blipElement.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();

        ring.style.cssText = `
            position: absolute;
            top: ${rect.top - containerRect.top + rect.height/2}px;
            left: ${rect.left - containerRect.left + rect.width/2}px;
            width: 20px;
            height: 20px;
            border: 2px solid #00ff85;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
        `;

        this.container.appendChild(ring);
        animationRuntime.trackNode(SESSION_OWNER, ring);

        const ringTween = gsap.to(ring, {
            width: 40,
            height: 40,
            opacity: 0,
            duration: 0.5,
            ease: 'power2.out',
            onComplete: () => ring.remove()
        });
        animationRuntime.trackAnimation(SESSION_OWNER, ringTween);
    }

    reactToPhase(phase) {
        switch(phase) {
            case 'intense':
            case 'chaotic':
                // Speed up sweep during intense phases
                gsap.to(this.sweep, {
                    duration: 1,
                    overwrite: 'auto'
                });
                break;
            case 'calm':
            case 'minimal':
                // Slow down during calm phases
                gsap.to(this.sweep, {
                    duration: 5,
                    overwrite: 'auto'
                });
                break;
        }
    }

    show() {
        if (!this.container || this.isActive) return;

        this.isActive = true;

        // Fade in
        const showTween = gsap.to(this.container, {
            opacity: 0.3,
            duration: 1,
            ease: 'power2.out'
        });
        animationRuntime.trackAnimation(SESSION_OWNER, showTween);

        // Start animations
        this.startSweep();
        this.generateRandomBlips();

        // Auto-hide after 8-12 seconds
        const displayDuration = Math.random() * 4000 + 8000;
        animationRuntime.scheduleTimeout(SESSION_OWNER, () => {
            this.hide();
        }, displayDuration);
    }

    hide() {
        if (!this.container || !this.isActive) return;

        animationRuntime.disposeOwner(SESSION_OWNER);
        this.blips = [];

        // Fade out
        const hideTween = gsap.to(this.container, {
            opacity: 0,
            duration: 1,
            ease: 'power2.out',
            onComplete: () => {
                this.isActive = false;
                this.scheduleNextDisplay();
            }
        });
        animationRuntime.trackAnimation(RUNTIME_OWNER, hideTween);
    }

    destroy() {
        animationRuntime.disposeOwner(SESSION_OWNER);
        animationRuntime.disposeOwner(RUNTIME_OWNER);
        gsap.killTweensOf([this.container, this.sweep, this.trail]);
        if (this.container) {
            this.container.remove();
        }
        this.isActive = false;
        this.isInitialized = false;
    }
}

export default new SonarEffect();
