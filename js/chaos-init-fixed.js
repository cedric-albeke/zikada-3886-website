// Performance optimizer MUST load first
import performanceOptimizer from './performance-optimizer.js';

// Core essentials only
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

// Performance Management Imports
import performanceElementManager from './performance-element-manager.js';
import intervalManager from './interval-manager.js';
import gsapAnimationRegistry from './gsap-animation-registry.js';
import performanceMonitor from './performance-monitor.js';

class ChaosInitializer {
    constructor() {
        this.isReady = false;
        this.performanceMode = 'auto';
        this.fps = 60;
        this.fpsHistory = [];
        this.lastFrameTime = performance.now();

        // Performance management (with fallbacks if not loaded)
        this.performanceElementManager = window.performanceElementManager || null;
        this.intervalManager = window.intervalManager || null;
        this.gsapRegistry = window.gsapAnimationRegistry || null;
        this.performanceMonitor = window.performanceMonitor || null;

        // Track managed intervals and elements for cleanup
        this.managedIntervals = [];
        this.managedElements = [];

        // Filter management to prevent grey screens
        this.currentBodyFilter = 'none';
        this.filterTransitionInProgress = false;

        console.log('🚀 ChaosInitializer created with performance management (optimized)');
    }

    init() {
        // Enhanced initialization with proper cleanup
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.performCleanup();
                this.initialize();
            });
        } else {
            this.performCleanup();
            this.initialize();
        }
    }

    performCleanup() {
        // Clean up any existing animations or elements
        if (typeof gsap !== 'undefined') {
            gsap.killTweensOf('*');
        }

        // Clear any existing intervals
        // Note: intervalManager doesn't have clearAll, just skip for now

        // Remove temporary elements
        const tempElements = document.querySelectorAll('.temp-element, .chaos-temp');
        tempElements.forEach(el => el.remove());

        console.log('🧹 Pre-initialization cleanup complete');
    }

    initialize() {
        console.log('🌀 ZIKADA 3886 CHAOS ENGINE INITIALIZING (OPTIMIZED)...');

        // Initialize timing controller first for coordination
        timingController.init();

        // Initialize subsystems
        this.initPerformanceMonitor();
        this.initPerformanceManager();
        this.initBackgroundAnimator();
        this.initLogoAnimator();
        this.initChaosEngine();
        this.initTextEffects();
        this.initAdditionalEffects();
        this.handleResize();

        // Listen for animation phase changes
        window.addEventListener('animationPhase', (e) => this.handlePhaseChange(e.detail.phase));

        // Start the chaos
        this.isReady = true;
        console.log('⚡ CHAOS ENGINE ONLINE (OPTIMIZED)');

        // Start animation phases directly
        setTimeout(() => {
            console.log('🚀 Starting animation phases...');
            this.startAnimationPhases();
        }, 2000);

        // Start animation watchdog to ensure animations never stop
        this.startAnimationWatchdog();
    }

    handlePhaseChange(phase) {
        // Adjust animation intensity based on phase
        switch(phase) {
            case 'calm':
                timingController.setGlobalSpeed(0.8);
                break;
            case 'buildup':
                timingController.setGlobalSpeed(1.2);
                break;
            case 'intense':
                timingController.setGlobalSpeed(1.5);
                timingController.throttleAnimations();
                break;
            case 'cooldown':
                timingController.setGlobalSpeed(0.6);
                break;
        }
    }

    initPerformanceMonitor() {
        let frameCount = 0;
        const monitorFPS = () => {
            const now = performance.now();
            const delta = now - this.lastFrameTime;
            const currentFPS = 1000 / delta;

            this.fpsHistory.push(currentFPS);
            if (this.fpsHistory.length > 60) {
                this.fpsHistory.shift();
            }

            this.fps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;

            // Auto-adjust quality based on performance - less aggressive
            frameCount++;
            if (frameCount % 300 === 0 && this.performanceMode === 'auto') {  // Check every 5 seconds
                if (this.fps < 25 && chaosEngine.isInitialized) {
                    this.setPerformanceMode('low');
                } else if (this.fps > 55 && this.performanceMode !== 'high') {
                    this.setPerformanceMode('high');
                }
            }

            this.lastFrameTime = now;
            requestAnimationFrame(monitorFPS);
        };

        requestAnimationFrame(monitorFPS);
    }

    setPerformanceMode(mode) {
        this.performanceMode = mode;

        if (!chaosEngine.isInitialized) return;

        switch (mode) {
            case 'low':
                // Reduce effects for better performance
                console.log('📉 Switching to LOW performance mode');
                timingController.setGlobalSpeed(0.5);
                break;

            case 'medium':
                console.log('📊 Switching to MEDIUM performance mode');
                timingController.setGlobalSpeed(0.8);
                break;

            case 'high':
                console.log('📈 Switching to HIGH performance mode');
                timingController.setGlobalSpeed(1.0);
                break;
        }
    }

    initPerformanceManager() {
        if (performanceManager) {
            performanceManager.init();
            console.log('📊 Performance manager initialized');
        }
    }

    initLogoAnimator() {
        // Initialize only essential logo animator
        centerpieceLogo.init();
        console.log('🎨 Logo animation system initialized (optimized)');
    }

    initBackgroundAnimator() {
        // Initialize background with config
        backgroundAnimator.init({
            matrixConfig: matrixConfig,
            performanceMode: this.performanceMode
        });

        console.log('🎬 Background animator initialized');
    }

    initChaosEngine() {
        // Initialize with VJ control support
        chaosEngine.init({
            canvas: document.getElementById('chaos-canvas'),
            performanceMode: this.performanceMode,
            vjControl: vjReceiver
        });

        console.log('🌀 Chaos engine initialized with VJ control');
    }

    initTextEffects() {
        // Initialize text effects
        textEffects.init();
        console.log('✨ Text effects initialized');
    }

    initAdditionalEffects() {
        // Add minimal scanlines effect
        this.addScanlines();
        // Add minimal VHS distortion
        this.addVHSDistortion();
        console.log('🎨 Additional effects initialized (minimal)');
    }

    addScanlines() {
        const scanlines = document.createElement('div');
        scanlines.id = 'scanlines';
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
                rgba(0, 255, 0, 0.01) 2px,
                rgba(0, 255, 0, 0.01) 4px
            );
            animation: scanlines 8s linear infinite;
        `;

        document.body.appendChild(scanlines);

        // Track element
        this.managedElements.push(scanlines);
    }

    addVHSDistortion() {
        const vhs = document.createElement('div');
        vhs.id = 'vhs-distortion';
        vhs.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9997;
            opacity: 0.03;
            mix-blend-mode: screen;
            background: linear-gradient(
                90deg,
                rgba(255, 0, 0, 0.1),
                rgba(0, 255, 0, 0.1),
                rgba(0, 0, 255, 0.1)
            );
            animation: vhs-distortion 0.3s linear infinite;
        `;

        document.body.appendChild(vhs);

        // Track element
        this.managedElements.push(vhs);
    }

    startAnimationPhases() {
        const phases = ['calm', 'buildup', 'intense', 'cooldown'];
        let currentPhaseIndex = 0;

        const nextPhase = () => {
            const phase = phases[currentPhaseIndex];

            // Dispatch phase event
            window.dispatchEvent(new CustomEvent('animationPhase', {
                detail: { phase }
            }));

            console.log(`🎭 Animation phase: ${phase}`);

            currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;

            // Random duration for each phase (10-30 seconds)
            const duration = 10000 + Math.random() * 20000;

            // Use managed interval
            const intervalId = setTimeout(nextPhase, duration);

            if (this.intervalManager) {
                this.intervalManager.register(intervalId, 'phase-timer', duration);
            }
        };

        // Start with first phase
        nextPhase();
    }

    startAnimationWatchdog() {
        // Monitor and restart animations if they stop
        const watchdog = setInterval(() => {
            if (!this.isReady) return;

            // Check if chaos engine is still running
            if (chaosEngine && chaosEngine.isInitialized && !chaosEngine.isAnimating) {
                console.warn('🐕 Watchdog: Restarting stopped chaos engine');
                chaosEngine.animate();
            }

            // Check background animator
            if (backgroundAnimator && !backgroundAnimator.isAnimating) {
                console.warn('🐕 Watchdog: Restarting background animator');
                backgroundAnimator.start();
            }

        }, 5000); // Check every 5 seconds

        // Register with interval manager
        if (this.intervalManager) {
            this.intervalManager.register(watchdog, 'animation-watchdog', 5000);
        }
    }

    handleResize() {
        window.addEventListener('resize', () => {
            if (chaosEngine.isInitialized) {
                chaosEngine.handleResize();
            }

            if (backgroundAnimator.isInitialized) {
                backgroundAnimator.handleResize();
            }
        });
    }

    // Public API
    getStatus() {
        return {
            ready: this.isReady,
            fps: Math.round(this.fps),
            performanceMode: this.performanceMode,
            chaosEngine: chaosEngine.isInitialized,
            backgroundAnimator: backgroundAnimator.isInitialized,
            textEffects: textEffects.isInitialized,
            managedElements: this.managedElements.length,
            managedIntervals: this.intervalManager ? this.intervalManager.getActiveCount() : 0
        };
    }

    destroy() {
        console.log('💀 Destroying chaos initializer...');

        // Stop all animations
        if (typeof gsap !== 'undefined') {
            gsap.killTweensOf('*');
        }

        // Clear all intervals
        // Note: intervalManager doesn't have clearAll method

        // Remove managed elements
        this.managedElements.forEach(el => {
            if (el && el.parentNode) {
                el.remove();
            }
        });

        // Destroy subsystems
        if (chaosEngine.destroy) chaosEngine.destroy();
        if (backgroundAnimator.destroy) backgroundAnimator.destroy();
        if (textEffects.destroy) textEffects.destroy();
        if (centerpieceLogo.destroy) centerpieceLogo.destroy();

        this.isReady = false;
        console.log('✅ Chaos initializer destroyed');
    }

    // Test functions
    testMatrixMessage() {
        console.log('Matrix messages disabled for performance');
    }

    testLottieAnimation(name) {
        console.log('Lottie animations disabled for performance');
    }
}

// Create and initialize
const chaosInit = new ChaosInitializer();

// Auto-initialize when ready
chaosInit.init();

// Export for global access
window.chaosInit = chaosInit;

// Add global test functions
window.testChaos = () => chaosInit.getStatus();
window.destroyChaos = () => chaosInit.destroy();
window.reinitChaos = () => {
    chaosInit.destroy();
    setTimeout(() => chaosInit.init(), 1000);
};

console.log('🚀 chaos-init-fixed.js module loaded (OPTIMIZED VERSION)');
console.log('💡 Use testChaos() to check status, destroyChaos() to stop, reinitChaos() to restart');

export default chaosInit;