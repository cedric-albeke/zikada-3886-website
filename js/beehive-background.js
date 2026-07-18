import gsap from 'gsap';
import animationRuntime from './runtime/animation-runtime.js';

const RUNTIME_OWNER = 'beehive-background';

class BeehiveBackground {
  constructor() {
    this.initialized = false;
    this.container = null;
    this.pattern = null;
    this.particles = [];
    this.performanceProfile = 'high';
  }

  init() {
    if (this.initialized && this.container?.isConnected) return;

    animationRuntime.disposeOwner(RUNTIME_OWNER);
    this.createBeehiveBackground();
    this.initialized = true;
    this.setPerformanceProfile(
      document.documentElement.dataset.performanceProfile
      || (window.chaosEngine?.softwareRenderer ? 'low' : 'high')
    );
  }

  createBeehiveBackground() {
    const style = document.createElement('style');
    style.id = 'beehive-background-style';
    style.textContent = `
      @keyframes beehive-drift {
        0%, 100% { transform: translate3d(-24px, -24px, 0) rotate(0deg); }
        50% { transform: translate3d(0, 0, 0) rotate(0.25deg); }
      }

      @keyframes beehive-particle-drift {
        0%, 100% { transform: translate3d(0, 12px, 0) rotate(0deg); opacity: 0.12; }
        50% { transform: translate3d(8px, -12px, 0) rotate(30deg); opacity: 0.3; }
      }
    `;
    document.head.appendChild(style);
    animationRuntime.trackNode(RUNTIME_OWNER, style);

    this.container = document.createElement('div');
    this.container.className = 'beehive-bg-container';
    this.container.setAttribute('aria-hidden', 'true');
    this.container.style.cssText = `
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      height: 100dvh;
      z-index: -2;
      pointer-events: none;
      overflow: hidden;
      opacity: 0;
      contain: strict;
    `;

    // A single bounded, compositor-friendly texture replaces the old 150%
    // gradient plane with blur and background-position repaint on every frame.
    this.pattern = document.createElement('div');
    this.pattern.className = 'beehive-bg-pattern';
    this.pattern.style.cssText = `
      position: absolute;
      inset: -48px;
      background-image:
        linear-gradient(30deg, transparent 24%, rgba(0, 255, 133, 0.08) 25%, rgba(0, 255, 133, 0.08) 26%, transparent 27%, transparent 74%, rgba(0, 255, 133, 0.08) 75%, rgba(0, 255, 133, 0.08) 76%, transparent 77%),
        linear-gradient(150deg, transparent 24%, rgba(0, 210, 255, 0.05) 25%, rgba(0, 210, 255, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 210, 255, 0.05) 75%, rgba(0, 210, 255, 0.05) 76%, transparent 77%);
      background-size: 72px 126px;
      transform: translate3d(-24px, -24px, 0);
      transform-origin: center;
      animation: beehive-drift 36s ease-in-out infinite;
    `;
    this.container.appendChild(this.pattern);

    // Four lightweight CSS outlines preserve the authored floating hex detail.
    // They are fixed in number and never recursively respawn.
    const positions = [
      [12, 18, 34, 0],
      [78, 24, 46, -9],
      [28, 72, 28, -16],
      [88, 78, 38, -24]
    ];
    positions.forEach(([left, top, size, delay]) => {
      const particle = document.createElement('div');
      particle.className = 'beehive-bg-particle';
      particle.style.cssText = `
        position: absolute;
        left: ${left}%;
        top: ${top}%;
        width: ${size}px;
        aspect-ratio: 1;
        border: 1px solid rgba(0, 255, 133, 0.35);
        clip-path: polygon(25% 7%, 75% 7%, 100% 50%, 75% 93%, 25% 93%, 0 50%);
        animation: beehive-particle-drift 28s ease-in-out ${delay}s infinite;
      `;
      this.container.appendChild(particle);
      this.particles.push(particle);
    });

    document.body.appendChild(this.container);
    animationRuntime.trackNode(RUNTIME_OWNER, this.container);
    animationRuntime.trackAnimation(RUNTIME_OWNER, gsap.to(this.container, {
      opacity: 0.01,
      duration: 3,
      ease: 'power2.inOut'
    }));
  }

  setPerformanceProfile(profile) {
    this.performanceProfile = profile || 'high';
    if (!this.pattern) return;

    const lowCost = this.performanceProfile === 'low' || window.chaosEngine?.softwareRenderer;
    this.pattern.style.animationPlayState = lowCost ? 'paused' : 'running';
    this.pattern.style.willChange = lowCost ? 'auto' : 'transform';
    this.particles.forEach(particle => {
      particle.style.animationPlayState = lowCost ? 'paused' : 'running';
      particle.style.willChange = lowCost ? 'auto' : 'transform, opacity';
    });
  }

  destroy() {
    animationRuntime.disposeOwner(RUNTIME_OWNER);
    this.container = null;
    this.pattern = null;
    this.particles = [];
    this.initialized = false;
  }
}

const beehiveBackground = new BeehiveBackground();
window.beehiveBackground = beehiveBackground;

export default beehiveBackground;
