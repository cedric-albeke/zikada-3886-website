// Minimal Chaos Init - Only essential animations for performance
import chaosEngine from './chaos-engine.js';
import textEffects from './text-effects.js';
import backgroundAnimator from './background-animator.js';
import matrixConfig from './matrix-config.js';
import timingController from './timing-controller.js';
import centerpieceLogo from './centerpiece-logo.js';
import performanceManager from './performance-manager.js';
import debugConsole from './debug-console.js';
import vjReceiver from './vj-receiver.js';
import gsap from 'gsap';

class MinimalChaosInitializer {
    constructor() {
        this.isReady = false;
        this.performanceMode = 'auto';
        this.fps = 60;
        this.fpsHistory = [];
        this.lastFrameTime = performance.now();
        this.managedElements = [];

        console.log('🚀 Minimal Chaos Initializer created');
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        console.log('🌀 MINIMAL CHAOS ENGINE INITIALIZING...');

        // Clean up first
        this.performCleanup();

        // Initialize core systems only
        this.initTimingController();
        this.initPerformanceManager();
        this.initBackgroundAnimator();
        this.initChaosEngine();
        this.initTextEffects();
        this.initCenterpiece();
        this.addMinimalEffects();

        // Simple resize handler
        window.addEventListener('resize', () => this.handleResize());

        // Mark as ready
        this.isReady = true;
        console.log('⚡ MINIMAL CHAOS ENGINE ONLINE');

        // Start FPS monitoring
        this.startFPSMonitor();
    }

    performCleanup() {
        try {
            // Kill all GSAP animations
            if (typeof gsap !== 'undefined') {
                gsap.killTweensOf('*');
            }

            // Remove temp elements
            document.querySelectorAll('.temp-element, .chaos-temp').forEach(el => el.remove());

            console.log('🧹 Cleanup complete');
        } catch (e) {
            console.warn('Cleanup error:', e);
        }
    }

    initTimingController() {
        try {
            timingController.init();
            console.log('⏰ Timing controller initialized');
        } catch (e) {
            console.warn('Timing controller error:', e);
        }
    }

    initPerformanceManager() {
        try {
            if (performanceManager && performanceManager.init) {
                performanceManager.init();
                console.log('📊 Performance manager initialized');
            }
        } catch (e) {
            console.warn('Performance manager error:', e);
        }
    }

    initBackgroundAnimator() {
        try {
            backgroundAnimator.init({
                matrixConfig: matrixConfig,
                performanceMode: this.performanceMode
            });
            console.log('🎬 Background animator initialized');
        } catch (e) {
            console.warn('Background animator error:', e);
        }
    }

    initChaosEngine() {
        try {
            chaosEngine.init({
                canvas: document.getElementById('chaos-canvas'),
                performanceMode: this.performanceMode,
                vjControl: vjReceiver
            });
            console.log('🌀 Chaos engine initialized');
        } catch (e) {
            console.warn('Chaos engine error:', e);
        }
    }

    initTextEffects() {
        try {
            textEffects.init();
            console.log('✨ Text effects initialized');
        } catch (e) {
            console.warn('Text effects error:', e);
        }
    }

    initCenterpiece() {
        try {
            centerpieceLogo.init();
            console.log('🎯 Centerpiece logo initialized');
        } catch (e) {
            console.warn('Centerpiece error:', e);
        }
    }

    addMinimalEffects() {
        try {
            // Add very light scanlines
            const scanlines = document.createElement('div');
            scanlines.id = 'minimal-scanlines';
            scanlines.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 9998;
                background: repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 2px,
                    rgba(0, 255, 0, 0.005) 2px,
                    rgba(0, 255, 0, 0.005) 4px
                );
                opacity: 0.5;
            `;
            document.body.appendChild(scanlines);
            this.managedElements.push(scanlines);

            console.log('✨ Minimal effects added');
        } catch (e) {
            console.warn('Effects error:', e);
        }
    }

    startFPSMonitor() {
        let frameCount = 0;
        const monitor = () => {
            const now = performance.now();
            const delta = now - this.lastFrameTime;
            const currentFPS = 1000 / delta;

            this.fpsHistory.push(currentFPS);
            if (this.fpsHistory.length > 60) {
                this.fpsHistory.shift();
            }

            this.fps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;

            frameCount++;
            if (frameCount % 300 === 0) { // Check every 5 seconds
                this.checkPerformance();
            }

            this.lastFrameTime = now;
            requestAnimationFrame(monitor);
        };
        requestAnimationFrame(monitor);
    }

    checkPerformance() {
        if (this.fps < 30) {
            console.warn(`⚠️ Low FPS detected: ${Math.round(this.fps)}`);
            this.reduceQuality();
        } else if (this.fps > 55) {
            this.restoreQuality();
        }
    }

    reduceQuality() {
        if (this.performanceMode !== 'low') {
            this.performanceMode = 'low';
            console.log('📉 Switching to LOW quality mode');

            // Reduce animation speeds
            if (timingController && timingController.setGlobalSpeed) {
                timingController.setGlobalSpeed(0.5);
            }
        }
    }

    restoreQuality() {
        if (this.performanceMode === 'low') {
            this.performanceMode = 'auto';
            console.log('📈 Restoring normal quality');

            // Restore animation speeds
            if (timingController && timingController.setGlobalSpeed) {
                timingController.setGlobalSpeed(1.0);
            }
        }
    }

    handleResize() {
        try {
            if (chaosEngine && chaosEngine.isInitialized && chaosEngine.handleResize) {
                chaosEngine.handleResize();
            }
            if (backgroundAnimator && backgroundAnimator.isInitialized && backgroundAnimator.handleResize) {
                backgroundAnimator.handleResize();
            }
        } catch (e) {
            console.warn('Resize handler error:', e);
        }
    }

    getStatus() {
        return {
            ready: this.isReady,
            fps: Math.round(this.fps),
            performanceMode: this.performanceMode,
            chaosEngine: chaosEngine && chaosEngine.isInitialized,
            backgroundAnimator: backgroundAnimator && backgroundAnimator.isInitialized,
            textEffects: textEffects && textEffects.isInitialized,
            managedElements: this.managedElements.length
        };
    }

    destroy() {
        console.log('💀 Destroying minimal chaos...');

        try {
            // Stop all animations
            if (typeof gsap !== 'undefined') {
                gsap.killTweensOf('*');
            }

            // Remove managed elements
            this.managedElements.forEach(el => {
                if (el && el.parentNode) {
                    el.remove();
                }
            });

            // Destroy subsystems
            if (chaosEngine && chaosEngine.destroy) chaosEngine.destroy();
            if (backgroundAnimator && backgroundAnimator.destroy) backgroundAnimator.destroy();
            if (textEffects && textEffects.destroy) textEffects.destroy();
            if (centerpieceLogo && centerpieceLogo.destroy) centerpieceLogo.destroy();

            this.isReady = false;
            console.log('✅ Minimal chaos destroyed');
        } catch (e) {
            console.error('Destroy error:', e);
        }
    }
}

// Create and initialize
const minimalChaos = new MinimalChaosInitializer();

// Auto-initialize
minimalChaos.init();

// Export for global access
window.minimalChaos = minimalChaos;

// Add global functions
window.chaosStatus = () => minimalChaos.getStatus();
window.chaosDestroy = () => minimalChaos.destroy();
window.chaosRestart = () => {
    minimalChaos.destroy();
    setTimeout(() => minimalChaos.init(), 1000);
};

console.log('🚀 Minimal chaos-init loaded');
console.log('💡 Commands: chaosStatus(), chaosDestroy(), chaosRestart()');

export default minimalChaos;