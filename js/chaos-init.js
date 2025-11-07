/**
 * ZIKADA 3886 Chaos Initializer - Safe Version
 * 
 * This version has been updated to use safe managers to prevent memory leaks:
 * - Uses safe PerformanceElementManager (with proper purge() method)
 * - Uses safe TextEffectsManager (with proper lifecycle management) 
 * - Uses safe Feature Flags system for configuration
 * - Integrates with emergency cleanup utilities
 * 
 * Safe managers are loaded globally and referenced here for compatibility.
 */

import chaosEngine from './chaos-engine.js';
// Safe imports - use the safe versions of problematic managers
import textEffects from './text-effects.js';
import backgroundAnimator from './background-animator.js';
import matrixMessages from './matrix-messages.js';
import matrixConfig from './matrix-config.js';
import subtleEffects from './subtle-effects.js';
import randomAnimations from './random-animations.js';
import extendedAnimations from './extended-animations.js';
import timingController from './timing-controller.js';
import enhancedLogoAnimator from './enhanced-logo-animator.js';
import filterManager from './filter-manager.js';
import centerpieceLogo from './centerpiece-logo.js';
import beehiveLogoBlend from './beehive-logo-blend.js';
import performanceManager from './performance-manager.js';
import debugConsole from './debug-console.js';
import sonarEffect from './sonar-effect.js';
import lottieAnimations from './lottie-animations.js';
import introAnimations from './intro-animations.js';
import beehiveBackground from './beehive-background.js';
import directLogoAnimation from './direct-logo-animation.js';
import vjReceiver from './vj-receiver.js';
import performanceOptimizer from './performance-optimizer.js';
import VisualEffectsController from './visual-effects-complete.js';
import createPerformanceProfileManager from './performance/profile-manager.js';

// Use safe feature flags system
const featureFlags = window.SAFE_FEATURE_FLAGS || {
    isEnabled: (flag) => {
        // Fallback for missing safe feature flags
        const defaults = { 
            pwaEnabled: false, 
            debugMetrics: false, 
            predictiveAlerting: false,
            serviceWorkerEnabled: false,
            installPrompt: false,
            monitorDashboard: false
        };
        return defaults[flag] || false;
    }
};
import enhancedWatchdog from './enhanced-watchdog.js';
// import memoryLeakGuardian from './memory-leak-guardian.js'; // DISABLED - causing aggressive cleanup
import performanceLadder from './performance-degradation-ladder.js';
import performanceLadderTest from './performance-ladder-test.js';
import smartPreloader from './smart-preloader.js';
import smartPreloaderTest from './smart-preloader-test.js';
import predictivePerformanceAlerting from './predictive-performance-alerting.js';
import PredictiveTrendAnalysis from './predictive-trend-analysis.js';
import predictiveLadderIntegration from './predictive-ladder-integration.js';
import predictiveAlertingTestSuite from './predictive-alerting-tests.js';
import { threeJSParticleOptimizer } from './threejs-particle-optimizer.js';
import { webglResourceManager } from './webgl-resource-manager.js';
import { registerMonitor } from './monitor/dashboard.js';
import { teardownAll } from './runtime/teardown.js';
import { getPhaseController } from './runtime/phase/PhaseController.js';
import gsap from 'gsap';

// Ensure GSAP is globally available
if (typeof window !== 'undefined' && !window.gsap) {
    window.gsap = gsap;
}

// Safe Performance Management Imports - use the safe versions
// These are now globally available after safe initialization
const performanceElementManager = window.performanceElementManager || null;
const intervalManager = window.intervalManager || null;
const gsapAnimationRegistry = window.gsapAnimationRegistry || null;
const performanceMonitor = window.performanceMonitor || null;

// Safe text effects manager
const safeTextEffects = window.safeTextEffects || textEffects;

// Safe element creation helpers - fallback to direct DOM if performanceElementManager unavailable
const warnOnce = (() => {
    let warned = false;
    return (msg) => {
        if (!warned) {
            console.warn(msg);
            warned = true;
        }
    };
})();

const safeCreateElement = (tagName, category = 'effect', styles = {}) => {
    const pem = window.performanceElementManager;
    if (pem && typeof pem.createElement === 'function') {
        return pem.createElement(tagName, category, styles);
    }
    
    // Fallback: create element directly
    warnOnce('[ZIKADA] No element management detected: falling back to document.createElement()');
    const el = document.createElement(tagName);
    
    // Apply styles manually
    if (styles && typeof styles === 'object') {
        Object.entries(styles).forEach(([key, value]) => {
            const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            el.style.setProperty(cssKey, value);
        });
    }
    
    return el;
};

const safeRemoveElement = (element) => {
    if (!element) return;
    
    const pem = window.performanceElementManager;
    if (pem && typeof pem.removeElement === 'function') {
        pem.removeElement(element);
    } else {
        // Fallback: direct DOM removal
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        } else if (typeof element.remove === 'function') {
            element.remove();
        }
    }
};

class ChaosInitializer {
    constructor() {
        this.isReady = false;
        this.performanceMode = 'auto';
        this.fps = 120;
        this.fpsHistory = [];
        this.lastFrameTime = performance.now();
        this.bootTs = performance.now(); // Prevent plasma for first 120s
        this.animeStackLoaded = false;
        this.animeStackPromise = null;
        this.animeEnableListener = null;
        // AUTO phase cadence (default 50s)
        this.phaseDurationMs = 50000;
        this.phaseTimer = null;
        this.currentPhase = null;
        
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
        
        // PWA and performance-aware features
        this.pwaEnabled = featureFlags.isEnabled('pwaEnabled');
        this.debugMetrics = featureFlags.isEnabled('debugMetrics');
        
        // Predictive performance alerting
        this.predictiveAlertingEnabled = featureFlags.isEnabled('predictiveAlerting');
        this.predictiveTrendAnalysis = null;
        this.lastFPSUpdate = 0;
        
        console.log('🚀 ChaosInitializer created with performance management');
        if (this.pwaEnabled) {
            console.log('📱 PWA features enabled');
            this.initializePWAFeatures();
        }
        
        // Set up watchdog event listeners for recovery
        this.setupWatchdogEventHandlers();

        this.setupAnimeIntegration();

        // Phase controller for coordinated transitions
        this.phaseController = getPhaseController();
        this._installPhaseController();
    }

    /**
     * Initialize PWA features when enabled
     */
    async initializePWAFeatures() {
        try {
            // Only proceed if service worker flag is enabled
            if (!featureFlags.isEnabled('serviceWorkerEnabled')) {
                console.log('💤 Service Worker disabled by feature flag');
                return;
            }

            // Check if service worker is supported
            if (!('serviceWorker' in navigator)) {
                console.warn('⚠️ Service Worker not supported in this browser');
                return;
            }

            // Register service worker (will be created in later steps)
            const registration = await navigator.serviceWorker.register('/service-worker.js', {
                scope: '/'
            });

            console.log('✅ Service Worker registered:', registration.scope);

            // Listen for service worker updates
            registration.addEventListener('updatefound', () => {
                console.log('🔄 Service Worker update found');
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('🆕 New Service Worker installed');
                        }
                    });
                }
            });

            // Initialize PWA install prompt if enabled
            if (featureFlags.isEnabled('installPrompt')) {
                this.initializeInstallPrompt();
            }

        } catch (error) {
            console.error('❌ PWA initialization failed:', error);
            // Don't let PWA failures break the animation system
        }
    }

    /**
     * Initialize PWA install prompt handling
     */
    initializeInstallPrompt() {
        let deferredPrompt = null;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            console.log('💾 PWA install prompt ready');
            
            // For debugging - expose install function
            if (this.debugMetrics) {
                window.installPWA = async () => {
                    if (deferredPrompt) {
                        const choiceResult = await deferredPrompt.prompt();
                        console.log('Install choice:', choiceResult.outcome);
                        deferredPrompt = null;
                    }
                };
            }
        });

        window.addEventListener('appinstalled', () => {
            console.log('✅ PWA installed successfully');
            deferredPrompt = null;
        });
    }
    
    /**
     * Set up event handlers for watchdog recovery events
     */
    setupWatchdogEventHandlers() {
        // Listen for RAF restart events
        window.addEventListener('raf:restart', () => {
            console.log('🔄 RAF restart requested by watchdog');
            this.restartAnimationLoop();
        });
        
        // Listen for WebGL context rebuild events
        window.addEventListener('webgl:rebuild', (event) => {
            console.log('🆕 WebGL rebuild requested by watchdog');
            this.handleWebGLRebuild(event.detail.context);
        });
        
        // Listen for performance emergency events
        window.addEventListener('performance:emergency', (event) => {
            console.log('🚨 Emergency performance reduction requested');
            this.handlePerformanceEmergency(event.detail.level);
        });
        
        // Listen for temporary performance reduction
        window.addEventListener('performance:reduce', (event) => {
            console.log('⚡ Temporary performance reduction requested');
            this.handleTemporaryPerformanceReduction(event.detail);
        });
        
        // Listen for performance restoration
        window.addEventListener('performance:restore', () => {
            console.log('✅ Performance restoration requested');
            this.handlePerformanceRestore();
        });
        
        // Listen for component quarantine events
        window.addEventListener('component:quarantine', (event) => {
            console.log(`⛔ Component quarantine requested: ${event.detail.component}`);
            this.handleComponentQuarantine(event.detail.component);
        });
        
        // Listen for soft restart events
        window.addEventListener('app:soft-restart', () => {
            console.log('🔄 Soft restart requested by watchdog');
            this.handleSoftRestart();
        });
        
        // Listen for memory events from Memory Leak Guardian
        window.addEventListener('memory:warning', (event) => {
            console.log('⚠️ Memory growth warning detected');
            this.handleMemoryWarning(event.detail);
        });
        
        window.addEventListener('memory:critical', (event) => {
            console.log('🚨 Critical memory growth detected');
            this.handleMemoryCritical(event.detail);
        });
        
        window.addEventListener('dom:excessive-growth', (event) => {
            console.log('🌳 Excessive DOM growth detected');
            this.handleDOMGrowth(event.detail);
        });
        
        // Listen for WebGL resource leak warnings
        window.addEventListener('webgl:resource-leak', (event) => {
            console.log('🗺️ WebGL resource leak detected');
            this.handleWebGLResourceLeak(event.detail);
        });
        
        // Listen for performance adjustments that need pixel ratio changes
        window.addEventListener('performance:adjust-pixel-ratio', (event) => {
            console.log('📱 Pixel ratio adjustment requested');
            this.handlePixelRatioAdjustment(event.detail);
        });
        
        // Listen for Smart Preloader events
        window.addEventListener('preloader:started', (event) => {
            if (this.debugMetrics) {
                console.log('🚀 Preloader started:', event.detail);
            }
        });
        
        window.addEventListener('preloader:loaded', (event) => {
            if (this.debugMetrics) {
                console.log(`✅ Resource preloaded: ${event.detail.url} (${event.detail.size} bytes)`);
            }
        });
        
        window.addEventListener('preloader:failed', (event) => {
            if (this.debugMetrics) {
                console.log(`❌ Resource preload failed: ${event.detail.url} - ${event.detail.error}`);
            }
        });
        
        window.addEventListener('preloader:paused', (event) => {
            console.log(`⏸️ Preloader paused: ${event.detail.reason}`);
        });
        
        window.addEventListener('preloader:cache-cleared', (event) => {
            console.log(`🗑️ Preloader cache cleared: ${event.detail.resourcesCleared} resources (${event.detail.bytesCleared} bytes)`);
        });
    }
    
    /**
     * Restart the main animation loop
     */
    restartAnimationLoop() {
        // Emit a global event that other animation systems can listen to
        const event = new CustomEvent('chaos:restart-animations');
        window.dispatchEvent(event);
        
        // Force a new RAF cycle
        requestAnimationFrame(() => {
            console.log('🔄 Animation loop restarted');
        });
    }
    
    /**
     * Handle WebGL context rebuild
     */
    handleWebGLRebuild(context) {
        // Emit event for Three.js systems to rebuild
        const event = new CustomEvent('chaos:webgl-rebuild', {
            detail: { context }
        });
        window.dispatchEvent(event);
    }
    
    /**
     * Handle emergency performance reduction
     */
    handlePerformanceEmergency(level) {
        if (level === 'critical') {
            // Disable heavy effects immediately
            this.disableHeavyEffects();
            // Set emergency CSS
            this.applyEmergencyCSS();
        }
    }
    
    /**
     * Handle temporary performance reduction
     */
    handleTemporaryPerformanceReduction(options) {
        const { level, duration } = options;
        
        // Temporarily reduce effects
        this.reduceEffectsTemporarily(level);
        
        // Restore after duration
        if (duration) {
            setTimeout(() => {
                this.restoreEffects();
            }, duration);
        }
    }
    
    /**
     * Handle performance restoration
     */
    handlePerformanceRestore() {
        this.restoreEffects();
        this.removeEmergencyCSS();
    }
    
    /**
     * Handle component quarantine
     */
    handleComponentQuarantine(component) {
        // Add component to quarantine list and disable it
        const event = new CustomEvent('chaos:quarantine-component', {
            detail: { component }
        });
        window.dispatchEvent(event);
    }
    
    /**
     * Handle soft restart
     */
    handleSoftRestart() {
        console.log('🔄 Performing soft restart...');
        
        // Clear all timers and intervals
        this.clearAllTimers();
        
        // Reset animation states
        this.resetAnimationStates();
        
        // Restart with minimal configuration
        setTimeout(() => {
            this.restartMinimal();
        }, 1000);
    }
    
    /**
     * Handle memory warning from Memory Leak Guardian
     */
    handleMemoryWarning(details) {
        console.log('🧠 Memory warning details:', details);
        // Progressive cleanup strategies
        
        try {
            // 1. Cleanup oldest animations
            if (window.animationRegistry) {
                window.animationRegistry.cleanup();
            }
            
            // 2. Purge element pools
            if (window.performanceElementManager) {
                window.performanceElementManager.purge();
            }
            
            // 3. Clear expired intervals
            if (window.intervalManager && typeof window.intervalManager.performAutoCleanup === 'function') {
                window.intervalManager.performAutoCleanup();
            }
            
            // 4. Clear cached GSAP transforms
            if (typeof gsap !== 'undefined') {
                gsap.set('*', { clearProps: 'transform' });
            }
            
            console.log('✅ Memory warning cleanup completed');
        } catch (error) {
            console.error('Memory warning cleanup failed:', error);
        }
    }
    
    /**
     * Handle critical memory situation from Memory Leak Guardian
     */
    handleMemoryCritical(details) {
        console.error('🚨 Critical memory situation:', details);
        
        // Emergency cleanup - more aggressive
        try {
            // Stop all animations immediately
            if (typeof gsap !== 'undefined') {
                gsap.killTweensOf('*');
                gsap.set('*', { clearProps: 'all' });
            }
            
            // Clear all cached elements
            if (window.performanceElementManager) {
                window.performanceElementManager.emergencyCleanup();
            }
            
            // Clear all intervals
            if (window.intervalManager) {
                window.intervalManager.emergencyStop();
            }
            
            // Clear all timers managed by this class
            this.clearAllTimers();
            
            // Apply emergency performance CSS
            this.applyEmergencyCSS();
            
            // Trigger garbage collection if available
            if (window.gc) {
                window.gc();
            }
            
            console.log('💥 Emergency memory cleanup completed');
            
            // If we still have issues, restart the app after brief delay
            setTimeout(() => {
                console.log('🔄 Initiating soft restart due to memory crisis');
                this.handleSoftRestart();
            }, 2000);
            
        } catch (error) {
            console.error('❌ Critical memory cleanup failed:', error);
            // Last resort: reload the page
            setTimeout(() => {
                console.error('🎆 Forcing page reload as last resort');
                window.location.reload();
            }, 3000);
        }
    }
    
    /**
     * Handle excessive DOM growth from Memory Leak Guardian
     */
    handleDOMGrowth(details) {
        console.log('📊 DOM growth details:', details);
        
        try {
            // DOM-specific cleanup
            if (window.performanceElementManager) {
                // Force DOM cleanup with stricter limits
                window.performanceElementManager.purge();
            }
            
            // Remove orphaned elements
            const orphanedElements = document.querySelectorAll('[data-animation-orphaned="true"]');
            let removedCount = 0;
            orphanedElements.forEach(el => {
                try {
                    el.remove();
                    removedCount++;
                } catch (e) {
                    console.warn('Could not remove orphaned element:', e);
                }
            });
            
            // Clean up elements marked for removal
            const markedForRemoval = document.querySelectorAll('[data-remove-pending="true"]');
            markedForRemoval.forEach(el => {
                try {
                    el.remove();
                    removedCount++;
                } catch (e) {
                    console.warn('Could not remove marked element:', e);
                }
            });
            
            // Clean up detached DOM nodes (common memory leak source)
            // Note: '*:not(:connected)' is an invalid selector, so we use a different approach
            try {
                const allElements = document.querySelectorAll('*');
                allElements.forEach(el => {
                    if (!el.isConnected && el.parentNode) {
                        try {
                            el.parentNode.removeChild(el);
                            removedCount++;
                        } catch (e) {
                            // Element may have been removed already
                        }
                    }
                });
            } catch (e) {
                console.warn('Could not perform detached element cleanup:', e);
            }
            
            console.log(`🗑️ DOM cleanup completed, removed ${removedCount} elements`);
            
        } catch (error) {
            console.error('DOM growth cleanup failed:', error);
        }
    }
    
    /**
     * Handle WebGL resource leak detection from resource manager
     */
    handleWebGLResourceLeak(details) {
        console.log('🗺️ WebGL resource leak details:', details);
        
        try {
            // Trigger intensive cleanup
            if (window.WEBGL_RESOURCE_MANAGER) {
                window.WEBGL_RESOURCE_MANAGER.performRendererCleanup();
            }
            
            // Force GSAP cleanup
            if (typeof gsap !== 'undefined') {
                gsap.killTweensOf('*');
            }
            
            // Clear animation registry
            if (window.animationRegistry) {
                window.animationRegistry.cleanup();
            }
            
            // Reduce quality temporarily to prevent further leaks
            this.handlePerformanceEmergency({ level: 'warning' });
            
            console.log('✅ WebGL resource leak cleanup completed');
            
        } catch (error) {
            console.error('WebGL resource leak cleanup failed:', error);
        }
    }
    
    /**
     * Handle pixel ratio adjustment requests
     */
    handlePixelRatioAdjustment(details) {
        console.log('📱 Pixel ratio adjustment details:', details);
        
        try {
            const { ratio, reason } = details;
            
            // Apply pixel ratio adjustment via WebGL Resource Manager
            if (window.WEBGL_RESOURCE_MANAGER) {
                window.WEBGL_RESOURCE_MANAGER.setPixelRatio(ratio);
                console.log(`🎆 Pixel ratio adjusted to ${ratio} (${reason})`);
            }
            
        } catch (error) {
            console.error('Pixel ratio adjustment failed:', error);
        }
    }
    
    /**
     * Disable heavy effects for emergency performance
     */
    disableHeavyEffects() {
        const event = new CustomEvent('chaos:disable-heavy-effects');
        window.dispatchEvent(event);
    }
    
    /**
     * Apply emergency CSS to reduce performance impact
     */
    applyEmergencyCSS() {
        if (document.getElementById('emergency-performance-css')) return;
        
        const style = document.createElement('style');
        style.id = 'emergency-performance-css';
        style.textContent = `
            /* Emergency performance reduction */
            .quantum-particles { display: none !important; }
            .holographic-shimmer { opacity: 0.01 !important; }
            .energy-field { display: none !important; }
            .matrix-overlay { opacity: 0.1 !important; }
            .phase-overlay { display: none !important; }
            
            /* Reduce animation complexity */
            * {
                animation-duration: 2s !important;
                transition-duration: 0.1s !important;
            }
            
            /* Disable expensive filters */
            .blur-effect { filter: none !important; }
            .glow-effect { box-shadow: none !important; }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Remove emergency CSS
     */
    removeEmergencyCSS() {
        const style = document.getElementById('emergency-performance-css');
        if (style) {
            style.remove();
        }
    }
    
    /**
     * Reduce effects temporarily
     */
    reduceEffectsTemporarily(level) {
        const event = new CustomEvent('chaos:reduce-effects', {
            detail: { level }
        });
        window.dispatchEvent(event);
    }
    
    /**
     * Restore normal effects
     */
    restoreEffects() {
        const event = new CustomEvent('chaos:restore-effects');
        window.dispatchEvent(event);
    }
    
    /**
     * Clear all managed timers and intervals
     */
    clearAllTimers() {
        // Clear managed intervals
        this.managedIntervals.forEach(id => {
            clearInterval(id);
        });
        this.managedIntervals = [];
        
        // Emit event for other systems to clear their timers
        const event = new CustomEvent('chaos:clear-timers');
        window.dispatchEvent(event);
    }
    
    /**
     * Reset animation states
     */
    resetAnimationStates() {
        // Kill all GSAP animations
        if (typeof gsap !== 'undefined') {
            gsap.killTweensOf('*');
        }
        
        // Reset phases
        this.currentPhase = null;
        
        // Clear phase timer
        if (this.phaseTimer) {
            clearTimeout(this.phaseTimer);
            this.phaseTimer = null;
        }
    }
    
    /**
     * Restart with minimal configuration
     */
    restartMinimal() {
        console.log('🔄 Restarting with minimal configuration');
        
        // Reinitialize with reduced complexity
        const event = new CustomEvent('chaos:restart-minimal');
        window.dispatchEvent(event);
        
        // Restart phase system with longer intervals
        this.phaseDurationMs = Math.max(this.phaseDurationMs * 1.5, 45000); // Increase to 45s minimum
    }

    setupAnimeIntegration() {
        if (typeof window === 'undefined') return;

        // Always load anime.js stack - no parameter needed
        const enableFn = () => this.loadAnimeStack();
        const runAndReport = () => {
            try {
                const maybePromise = enableFn();
                if (maybePromise && typeof maybePromise.catch === 'function') {
                    maybePromise.catch(error => console.error('Anime.js stack failed to load', error));
                }
                this.animeEnableListener = null;
                return maybePromise;
            } catch (error) {
                console.error('Anime.js stack failed to load', error);
                this.animeEnableListener = null;
                return undefined;
            }
        };

        // Always load anime.js automatically
        console.log('🎬 Auto-loading anime.js effects...');
        runAndReport();
    }

    isAnimeFeatureEnabled() {
        try {
            if (typeof window === 'undefined') return false;
            const qp = new URLSearchParams(window.location?.search || '');
            if (qp.get('anime') === '1') {
                try {
                    window.localStorage?.setItem('3886_anime_enabled', '1');
                } catch (_) {}
                return true;
            }
            if (window.__ANIME_POC_ENABLED === true) return true;
            const stored = window.localStorage?.getItem('3886_anime_enabled');
            return stored === '1';
        } catch (_) {
            return false;
        }
    }

    async loadAnimeStack() {
        if (this.animeStackLoaded) return this.animeStackPromise;

        this.animeStackLoaded = true;
        const load = async () => {
            try {
                // Import the proper anime.js stack
                await import('./anime-init.js');
                await import('./animation-manager.js');
                await import('./anime-svg-logo.js');
                await import('./anime-enhanced-effects.js');
                console.log('🎬 Anime.js stack loaded successfully with enhanced effects and animation manager');
            } catch (error) {
                this.animeStackLoaded = false;
                console.error('Failed to load anime.js stack', error);
                throw error;
            }
        };

        this.animeStackPromise = load();
        return this.animeStackPromise;
    }

    /**
     * Safe filter application with brightness/contrast capping to prevent bright flashes
     */
    safeApplyFilter(target, filterValue, duration = 2) {
        const sanitizedFilter = this.validateFilter(filterValue);
        this.applyFilterNow(target, sanitizedFilter, duration);
    }

    /**
     * Create safe intermediate filter to prevent grey gaps
     */
    createIntermediateFilter(currentFilter, targetFilter) {
        // If going to 'none', use a safe neutral filter as intermediate
        if (targetFilter === 'none') {
            return 'brightness(1) contrast(1) saturate(1) hue-rotate(0deg)';
        }
        
        // If coming from 'none', start with neutral values
        if (currentFilter === 'none') {
            return 'brightness(1) contrast(1) saturate(1) hue-rotate(0deg)';
        }
        
        // For filter-to-filter transitions, ensure safe values
        return this.validateFilter(targetFilter);
    }

    applyFilterNow(target, filterValue, duration) {
        const finalFilter = filterValue || 'none';
        // INSTANT application - GSAP animations cause blackouts/whiteouts during scene switches
        // Filter values are still sanitized by validateFilter() to prevent bright flashes
        if (target === document.body || target === document.documentElement) {
            document.body.style.filter = finalFilter;
            document.documentElement.style.filter = finalFilter;
        } else if (target && target.style) {
            target.style.filter = finalFilter;
        }
    }

    /**
     * Validate and sanitize filter values to prevent bright flashes
     * CRITICAL: Caps brightness at 1.05, contrast at 1.1, saturation at 1.2
     */
    validateFilter(filterValue) {
        if (!filterValue || filterValue === 'none') return 'none';
        
        // Extract numeric values from filter string and clamp them
        let sanitized = filterValue;
        
        // Cap brightness at 1.05 (prevent bright flashes)
        sanitized = sanitized.replace(/brightness\(([\d.]+)\)/g, (match, value) => {
            const num = parseFloat(value);
            const capped = Math.min(num, 1.05);
            return `brightness(${capped})`;
        });
        
        // Cap contrast at 1.1 (prevent harsh visual spikes)
        sanitized = sanitized.replace(/contrast\(([\d.]+)\)/g, (match, value) => {
            const num = parseFloat(value);
            const capped = Math.min(num, 1.1);
            return `contrast(${capped})`;
        });
        
        // Cap saturation at 1.2 (prevent color overstimulation)
        sanitized = sanitized.replace(/saturate\(([\d.]+)\)/g, (match, value) => {
            const num = parseFloat(value);
            const capped = Math.min(num, 1.2);
            return `saturate(${capped})`;
        });
        
        return sanitized || 'none';
    }

    /**
     * Start grey flash prevention system - real-time monitoring
     */
    startGreyFlashPrevention() {
        // Safe filter/grey-flash prevention feature removed
        return;
    }

    init(forceRestart = false) {
        // If this is a forced restart, clean up first
        if (forceRestart) {
            console.log('🔄 FORCE RESTART: Cleaning up before reinitializing...');
            this.cleanup();
        }

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        // Poster mode: If ?poster=1 is present, avoid heavy subsystems and render static hero only for capture
        try {
            const qp = new URLSearchParams(window.location.search || '');
            if (qp.get('poster') === '1') {
                document.body.classList.add('poster-mode');
                // Ensure baseline elements exist (pre-loader wrapper)
                this.ensureFxRoot();
                // Do not start chaos engine or heavy effects; exit early
                console.log('🖼️ Poster mode enabled (no heavy initialization)');
                return;
            }
        } catch (_) {}
        console.log('🌀 ZIKADA 3886 CHAOS ENGINE INITIALIZING...');
        // Ensure a single FX overlay root to prevent z-index conflicts and flicker
        this.ensureFxRoot();

        // Initialize timing controller first for coordination
        timingController.init();

        // Initialize intro animations first for reveal effect
        introAnimations.init();

        // Initialize beehive background for subtle effect
        beehiveBackground.init();

        // Initialize subsystems
        this.initPerformanceMonitor();
        this.initPerformanceManager(); // Initialize performance monitoring first
        
        // Memory Leak Guardian DISABLED - was causing aggressive cleanups
        console.log('🚤 Memory Leak Guardian disabled (was interfering with normal operation)');
        // try {
        //     console.log('🧠 Starting Memory Leak Guardian...');
        //     if (memoryLeakGuardian && typeof memoryLeakGuardian.startGuardian === 'function') {
        //         memoryLeakGuardian.startGuardian();
        //         console.log('✅ Memory Leak Guardian active');
        //     } else {
        //         console.warn('[ZIKADA][init] Memory Leak Guardian not started: startGuardian() unavailable or instance undefined');
        //     }
        // } catch (error) {
        //     console.warn('⚠️ Memory Leak Guardian failed to start:', error);
        // }
        
        // Start Enhanced Watchdog for RAF/WebGL/performance monitoring
        try {
            console.log('🐶 Starting Enhanced Watchdog...');
            if (enhancedWatchdog && typeof enhancedWatchdog.startWatchdog === 'function') {
                enhancedWatchdog.startWatchdog();
                console.log('✅ Enhanced Watchdog active');
            } else {
                console.warn('[ZIKADA][init] Enhanced Watchdog not started: startWatchdog() unavailable or instance undefined');
            }
        } catch (error) {
            console.warn('⚠️ Enhanced Watchdog failed to start:', error);
        }
        
        // Defer WebGL-related initializations until after Chaos Engine is initialized
        // (renderer must exist)

        // CRITICAL FIX: Moved Performance Degradation Ladder initialization to AFTER
        // ChaosEngine initialization (see below after initChaosEngine() call)

        // Initialize Smart Preloader
        try {
            console.log('🚀 Starting Smart Preloader...');
            
            // Only start if PWA features are enabled or in development mode
            if (this.pwaEnabled || this.debugMetrics) {
                smartPreloader.start();
                console.log('✅ Smart Preloader active');
                
                // Expose for debugging if enabled
                if (this.debugMetrics) {
                    window.smartPreloader = smartPreloader;
                    window.smartPreloaderTest = smartPreloaderTest;
                    console.log('🧪 Debug mode: Preloader testing available via window.testSmartPreloader()');
                }
            } else {
                console.log('💤 Smart Preloader disabled (PWA features not enabled)');
            }
        } catch (error) {
            console.warn('⚠️ Smart Preloader failed to start:', error);
        }
        
        // Initialize Predictive Performance Alerting System
        this.initPredictiveAlerting();
        
        // Initialize Performance Monitoring Dashboard if enabled
        this.initMonitoringDashboard();
        
        this.initBackgroundAnimator();
        this.initLogoAnimator();  // Initialize logo animator early
        this.initChaosEngine();

        // Now that Chaos Engine is initialized, set up GPU optimizers/managers that need the renderer
        try {
            if (window.chaosEngine && window.chaosEngine.renderer) {
                if (!window.THREEJS_PARTICLE_OPTIMIZER?.enabled) {
                    console.log('🌌 Initializing Three.js Particle Optimizer...');
                    threeJSParticleOptimizer.initialize(window.chaosEngine.renderer);
                } else {
                    console.debug('Three.js Particle Optimizer already initialized');
                }
                // Attempt live re-optimization of existing particle system
                if (window.chaosEngine.particles) {
                    const prev = window.chaosEngine.particles;
                    const optimized = threeJSParticleOptimizer.optimizeParticleSystem(prev, window.chaosEngine.particleCount || 2000);
                    if (optimized && optimized !== prev && window.chaosEngine.scene) {
                        try { window.chaosEngine.scene.remove(prev); } catch (_) {}
                        window.chaosEngine.scene.add(optimized);
                        window.chaosEngine.particles = optimized;
                        console.log('✅ Switched to optimized instanced particle system');
                    }
                }
                console.log('✅ Three.js Particle Optimizer ready');
            } else {
                console.warn('⚠️ Three.js Particle Optimizer: renderer not available yet');
            }
        } catch (error) {
            console.warn('⚠️ Three.js Particle Optimizer failed to initialize:', error);
        }

        try {
            if (window.chaosEngine && window.chaosEngine.renderer) {
                console.log('🔧 Initializing WebGL Resource Manager...');
                webglResourceManager.initialize(window.chaosEngine.renderer);
                if (window.chaosEngine.scene && window.chaosEngine.camera) {
                    webglResourceManager.queueShaderPrecompilation(
                        window.chaosEngine.scene,
                        window.chaosEngine.camera,
                        'high'
                    );
                }
                console.log('✅ WebGL Resource Manager active');
            } else {
                console.warn('⚠️ WebGL Resource Manager: renderer not available yet');
            }
        } catch (error) {
            console.warn('⚠️ WebGL Resource Manager failed to initialize:', error);
        }

        // CRITICAL FIX: Initialize Performance Degradation Ladder AFTER ChaosEngine is ready
        // This ensures renderer, scene, and composer are properly initialized
        try {
            console.log('📊 Starting Performance Degradation Ladder...');
            if (window.chaosEngine && window.chaosEngine.renderer) {
                const renderer = window.chaosEngine.renderer;
                const scene = window.chaosEngine.scene;
                const composer = window.chaosEngine.composer;

                performanceLadder.start(renderer, scene, composer);
                console.log('✅ Performance Degradation Ladder active with valid renderer');

                // Expose for debugging if enabled
                if (this.debugMetrics) {
                    window.performanceLadder = performanceLadder;
                    window.performanceLadderTest = performanceLadderTest;
                    console.log('🧪 Debug mode: Performance testing available via window.testPerformanceLadder()');
                }
            } else {
                console.warn('⚠️ Performance Degradation Ladder: ChaosEngine not ready, starting with null values');
                performanceLadder.start(null, null, null);
            }
        } catch (error) {
            console.warn('⚠️ Performance Degradation Ladder failed to start:', error);
        }

        // Start centralized profile manager (adaptive DPR, post-processing, particles, Lottie)
        try {
            const mgr = createPerformanceProfileManager({
                engine: window.chaosEngine,
                lottie: lottieAnimations,
                effects: window.fxController || null
            });
            mgr.start();
            console.log('🧭 PerformanceProfileManager started');
        } catch (e) {
            console.warn('⚠️ Failed to start PerformanceProfileManager:', e);
        }

        this.initTextEffects();
        this.initAdditionalEffects();
        // RE-ENABLED: Random animations (CSS blur will fix rectangular elements)
        this.initRandomAnimations();
        
        // Auto-enable visual effects (particles and plasma) for continuous animation
        this.initVisualEffects();
        
        this.handleResize();

        // Listen for animation phase changes
        window.addEventListener('animationPhase', (e) => this.handlePhaseChange(e.detail.phase));

        // Start the chaos
        this.isReady = true;
        console.log('⚡ CHAOS ENGINE ONLINE');
        try { window.dispatchEvent(new CustomEvent('app:ready', { detail: { ts: Date.now() } })); } catch (_) {}

        // Skip startup sequence - removed status texts
        // this.runStartupSequence();
        // Create global blackout overlay to ensure full coverage for fades/blackouts
        this.ensureBlackoutOverlay();

        // CRITICAL FIX: Increased delay from 2000ms to 5000ms to ensure all DOM elements are ready
        // This prevents race conditions where phase methods try to animate elements that don't exist yet
        setTimeout(() => {
            console.log('🚀 Starting animation phases...');
            this.startAnimationPhases();
        }, 5000);

        // Start animation watchdog to ensure animations never stop
        this.startAnimationWatchdog();

        // Start periodic DOM cleanup to prevent accumulation
        this.startPeriodicDOMCleanup();

        // DISABLED: Grey flash prevention was causing performance catastrophe
        // this.startGreyFlashPrevention();
    }

    ensureFxRoot() {
        try {
            let root = document.getElementById('fx-root');
            if (!root) {
                root = document.createElement('div');
                root.id = 'fx-root';
                root.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:500;';
                document.body.appendChild(root);
            }
        } catch (e) {
            // No-op on failure; modules will fallback to body
        }
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

            // Update predictive alerting system with current FPS
            this.updatePredictiveAlerting(currentFPS, now);

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
                // Reduce particle count
                if (chaosEngine.particles) {
                    chaosEngine.particles.material.size = 0.3;
                }
                // Disable some post-processing
                if (chaosEngine.glitchPass) {
                    chaosEngine.glitchPass.enabled = false;
                }
                break;

            case 'high':
                // Enable all effects
                if (chaosEngine.particles) {
                    chaosEngine.particles.material.size = 0.5;
                }
                break;
        }
    }

    /**
     * Initialize Predictive Performance Alerting System
     */
    initPredictiveAlerting() {
        try {
            if (!this.predictiveAlertingEnabled) {
                console.log('💤 Predictive Performance Alerting disabled by feature flag');
                return;
            }
            
            console.log('🔮 Starting Predictive Performance Alerting System...');
            
            // Initialize trend analysis
            this.predictiveTrendAnalysis = new PredictiveTrendAnalysis();
            
            // Start predictive alerting system
            predictivePerformanceAlerting.start();
            console.log('✅ Predictive Performance Alerting active');
            
            // Start ladder integration
            predictiveLadderIntegration.start();
            console.log('✅ Predictive Ladder Integration active');
            
            // Setup predictive event listeners
            this.setupPredictiveEventListeners();
            
            // Expose for debugging if enabled
            if (this.debugMetrics) {
                window.predictivePerformanceAlerting = predictivePerformanceAlerting;
                window.predictiveTrendAnalysis = this.predictiveTrendAnalysis;
                window.predictiveLadderIntegration = predictiveLadderIntegration;
                window.predictiveAlertingTestSuite = predictiveAlertingTestSuite;
                console.log('🧪 Debug mode: Predictive alerting available for testing');
                
                // Add test runner to global scope
                window.runPredictiveTests = async (category = 'all') => {
                    if (category === 'all') {
                        return await predictiveAlertingTestSuite.runAllTests();
                    } else {
                        return await predictiveAlertingTestSuite.runTestCategory(category);
                    }
                };
                
                console.log('🧪 Debug: Run tests with window.runPredictiveTests()');
            }
            
        } catch (error) {
            console.warn('⚠️ Predictive Performance Alerting failed to start:', error);
        }
    }
    
    /**
     * Setup predictive alerting event listeners
     */
    setupPredictiveEventListeners() {
        // Listen for predictive ladder transition requests
        window.addEventListener('predictive-ladder:transition-request', (event) => {
            if (this.debugMetrics) {
                console.log('🎯 Predictive transition request:', event.detail);
            }
            
            // Forward to performance ladder
            const transitionEvent = new CustomEvent('performance:transition-request', {
                detail: {
                    ...event.detail,
                    source: 'predictive'
                }
            });
            window.dispatchEvent(transitionEvent);
        });
        
        // Listen for rollback requests
        window.addEventListener('predictive-ladder:rollback-request', (event) => {
            console.log('↩️ Predictive rollback request:', event.detail);
            
            // Forward to performance ladder
            const rollbackEvent = new CustomEvent('performance:rollback-request', {
                detail: {
                    ...event.detail,
                    source: 'predictive'
                }
            });
            window.dispatchEvent(rollbackEvent);
        });
        
        // Listen for predictive pattern matches
        window.addEventListener('predictive:pattern:matched', (event) => {
            if (this.debugMetrics) {
                console.log('🔍 Performance pattern matched:', event.detail.patternName);
            }
        });
        
        // Listen for predictive events and forward FPS data
        window.addEventListener('predictive:started', () => {
            this.lastFPSUpdate = performance.now();
        });
    }
    
    /**
     * Update predictive alerting system with current FPS data
     */
    updatePredictiveAlerting(currentFPS, timestamp) {
        if (!this.predictiveAlertingEnabled || !predictivePerformanceAlerting.isActive) {
            return;
        }
        
        // Throttle updates to avoid overwhelming the system (every 100ms)
        if (timestamp - this.lastFPSUpdate < 100) {
            return;
        }
        
        try {
            // Update predictive alerting system
            predictivePerformanceAlerting.updateFPS(currentFPS, timestamp);
            
            // Update trend analysis if available
            if (this.predictiveTrendAnalysis) {
                this.predictiveTrendAnalysis.processData(currentFPS, timestamp);
            }
            
            // Emit FPS update event for other systems
            const fpsEvent = new CustomEvent('performance:fps:update', {
                detail: {
                    fps: currentFPS,
                    timestamp,
                    avgFPS: this.fps,
                    fpsHistory: this.fpsHistory.slice(-10) // Last 10 samples
                }
            });
            window.dispatchEvent(fpsEvent);
            
            this.lastFPSUpdate = timestamp;
            
        } catch (error) {
            if (this.debugMetrics) {
                console.warn('⚠️ Predictive alerting update failed:', error);
            }
        }
    }

    /**
     * Initialize Performance Monitoring Dashboard
     */
    initMonitoringDashboard() {
        try {
            // Check if monitoring dashboard is enabled via feature flag
            const dashboardEnabled = featureFlags.isEnabled('monitorDashboard') || 
                                    window.__ZIKADA_FLAGS__?.monitorDashboard ||
                                    this.debugMetrics; // Enable in debug mode
            
            if (!dashboardEnabled) {
                console.log('💤 Monitoring Dashboard disabled by feature flag');
                return;
            }
            
            console.log('📊 Initializing Performance Monitoring Dashboard...');
            
            // Create a simple event bus if ZIKADA_EVENT_BUS doesn't exist
            if (!window.ZIKADA_EVENT_BUS) {
                window.ZIKADA_EVENT_BUS = {
                    listeners: new Map(),
                    on(event, callback) {
                        if (!this.listeners.has(event)) {
                            this.listeners.set(event, []);
                        }
                        this.listeners.get(event).push(callback);
                    },
                    emit(event, data) {
                        const callbacks = this.listeners.get(event);
                        if (callbacks) {
                            callbacks.forEach(callback => {
                                try {
                                    callback(data);
                                } catch (error) {
                                    console.warn(`Event handler error for ${event}:`, error);
                                }
                            });
                        }
                    }
                };
            }
            
            // Register the monitoring dashboard
            const dashboard = registerMonitor(window.ZIKADA_EVENT_BUS);
            
            if (dashboard) {
                console.log('✅ Performance Monitoring Dashboard active (Ctrl+Alt+M to toggle)');
                
                // Expose for debugging if enabled
                if (this.debugMetrics) {
                    window.monitorDashboard = dashboard;
                    console.log('🧪 Debug mode: Dashboard available via window.monitorDashboard');
                }
                
                // Auto-show dashboard in debug mode
                if (this.debugMetrics) {
                    setTimeout(() => {
                        dashboard.show();
                    }, 2000);
                }
            } else {
                console.warn('⚠️ Failed to initialize monitoring dashboard');
            }
            
        } catch (error) {
            console.error('❌ Monitoring Dashboard initialization failed:', error);
            // Don't let dashboard failures break the animation system
        }
    }

    initBackgroundAnimator() {
        try {
            backgroundAnimator.init();
            backgroundAnimator.startGlitchSequence();
        } catch (error) {
            console.error('Failed to initialize Background Animator:', error);
        }
    }

    initLogoAnimator() {
        try {
            enhancedLogoAnimator.init();
            console.log('✨ Enhanced Logo Animator initialized');

            // Initialize the new centerpiece logo system
            centerpieceLogo.init();
            console.log('🎯 Centerpiece Logo System initialized');
        } catch (error) {
            console.error('Failed to initialize Enhanced Logo Animator:', error);
        }
    }

    initPerformanceManager() {
        try {
            performanceManager.init();
            console.log('🎮 Performance Manager initialized');
        } catch (error) {
            console.error('Failed to initialize Performance Manager:', error);
        }
    }

    initChaosEngine() {
        try {
            chaosEngine.init();
        } catch (error) {
            console.error('Failed to initialize Chaos Engine:', error);
            // Fallback to CSS-only effects
            this.enableFallbackMode();
        }
    }

    initTextEffects() {
        try {
            // Use safe text effects manager if available
            if (window.safeTextEffects) {
                window.safeTextEffects.init();
                console.log('✅ Safe Text Effects initialized');
                // Only add data corruption if text effects are enabled
                if (window.SAFE_FEATURE_FLAGS?.isEnabled('TEXT_EFFECTS_ENABLED')) {
                    window.safeTextEffects.addDataCorruption();
                }
            } else if (window.textEffects) {
                // Use the global text effects instance
                console.log('✅ Using global text effects instance');
                window.textEffects.init();
                if (window.SAFE_FEATURE_FLAGS?.isEnabled('TEXT_EFFECTS_ENABLED')) {
                    window.textEffects.addDataCorruption();
                }
            } else {
                // Create new text effects instance
                console.log('⚠️ Creating new text effects instance');
                const TextEffectsClass = textEffects; // This is the class
                const textEffectsInstance = new TextEffectsClass();
                textEffectsInstance.init();
                if (window.SAFE_FEATURE_FLAGS?.isEnabled('TEXT_EFFECTS_ENABLED')) {
                    textEffectsInstance.addDataCorruption();
                }
            }
            matrixMessages.init();
            subtleEffects.init();
        } catch (error) {
            console.error('Failed to initialize Text Effects:', error);
        }
    }

    initRandomAnimations() {
        try {
            const flags = (window.SAFE_FLAGS || window.safeFeatureFlags || {});
            const allowRandom = !!flags.RANDOM_ANIMATIONS_ENABLED;
            const allowExtended = !!flags.EXTENDED_ANIMATIONS_ENABLED;

            if (allowRandom) {
                randomAnimations.init();
                console.log('🎲 Random animations initialized (flag RANDOM_ANIMATIONS_ENABLED)');
            } else {
                console.log('💤 Random animations disabled by feature flag');
            }

            if (allowExtended) {
                extendedAnimations.init();
                console.log('🎬 Extended animations initialized (flag EXTENDED_ANIMATIONS_ENABLED)');
            } else {
                console.log('💤 Extended animations disabled by feature flag');
            }

            // Initialize beehive logo blend effect
            beehiveLogoBlend.init();
            console.log('🐝 Beehive logo blend initialized');

            // Initialize sonar effect
            sonarEffect.init();
            console.log('📡 Sonar effect initialized');

            // Initialize Lottie animations
            lottieAnimations.init();
            console.log('🌟 Lottie animations initialized');

            // Logo animations are now integrated into logo-animator.js
        } catch (error) {
            console.error('Failed to initialize Random Animations:', error);
        }
    }

    initAdditionalEffects() {
        // Add scanlines effect
        this.addScanlines();

        // Add VHS distortion
        this.addVHSDistortion();

        // Add cyber grid
        this.addCyberGrid();

        // Add glowing edges to main elements
        this.addGlowEffects();

        // Add static noise overlay
        this.addStaticNoise();

        // Add data stream visualization
        this.addDataStreams();

        // Add holographic shimmer
        this.addHolographicShimmer();

        // DISABLED: Glitch lines create ugly rectangular elements
        // this.addGlitchLines();

        // Protect cicada logo opacity
        this.protectLogoOpacity();

        // DISABLED: Persistent effects include digital artifacts with rectangular elements
        // this.addPersistentEffects();

        // Add subtle color variations
        this.addSubtleColorVariations();
    }

    initVisualEffects() {
        // Visual effects (particles and plasma) are now integrated into specific animation phases
        // They will be enabled/disabled dynamically based on the current scene
        console.log('🎨 Visual effects will be managed by animation phase system');
        
        // Track active visual effects for cleanup
        this.activeVisualEffects = {
            particles: false,
            plasma: false
        };
    }
    
    enableParticleEffect() {
        if (this.activeVisualEffects.particles) return; // Already enabled
        
        try {
            if (window.visualEffectsController) {
                window.visualEffectsController.enableParticles();
                this.activeVisualEffects.particles = true;
                console.log('✨ Particles enabled for current phase');
            }
        } catch (error) {
            console.warn('Failed to enable particles:', error);
        }
    }
    
    disableParticleEffect() {
        if (!this.activeVisualEffects.particles) return; // Already disabled
        
        try {
            if (window.visualEffectsController) {
                window.visualEffectsController.disableParticles();
                this.activeVisualEffects.particles = false;
                console.log('✨ Particles disabled');
            }
        } catch (error) {
            console.warn('Failed to disable particles:', error);
        }
    }
    
    enablePlasmaEffect() {
        if (this.activeVisualEffects.plasma) return; // Already enabled
        
        // Safety gate: never show plasma in the first 120s after boot
        if (performance.now() - this.bootTs < 120000) {
            if (this.debugMetrics) console.log('⏳ Plasma suppressed: within first 120s');
            return;
        }
        
        // Default: skip plasma 80% of the time. Allow runtime override via SAFE_FLAGS for tuning.
        const skipProb = (window.SAFE_FLAGS?.PLASMA_SKIP_PROBABILITY ?? 0.8);
        if (Math.random() < skipProb) {
            return;
        }
        try {
            let plasmaCanvas = document.getElementById('plasma-field-canvas');
            
            // Create plasma field if it doesn't exist
            if (!plasmaCanvas && window.animeEnhancedEffects?.createPlasmaField) {
                window.animeEnhancedEffects.createPlasmaField();
                plasmaCanvas = document.getElementById('plasma-field-canvas');
            }
            
            if (plasmaCanvas && typeof plasmaCanvas.startEffect === 'function') {
                plasmaCanvas.startEffect();
                // Reduce opacity by 40% from current
                try {
                    const cs = getComputedStyle(plasmaCanvas);
                    const cur = parseFloat(plasmaCanvas.style.opacity || cs.opacity || '1');
                    plasmaCanvas.style.opacity = String(Math.max(0, (cur * 0.6).toFixed(3)));
                } catch(_) {}
                this.activeVisualEffects.plasma = true;
                console.log('🌊 Plasma field enabled for current phase');
            }
        } catch (error) {
            console.warn('Failed to enable plasma:', error);
        }
    }
    
    disablePlasmaEffect() {
        if (!this.activeVisualEffects.plasma) return; // Already disabled
        
        try {
            const plasmaCanvas = document.getElementById('plasma-field-canvas');
            if (plasmaCanvas && typeof plasmaCanvas.stopEffect === 'function') {
                plasmaCanvas.stopEffect();
                this.activeVisualEffects.plasma = false;
                console.log('🌊 Plasma field disabled');
            }
        } catch (error) {
            console.warn('Failed to disable plasma:', error);
        }
    }

    addScanlines() {
        // Check if scanlines already exist
        if (document.querySelector('.scanlines')) {
            return; // Already exists, don't create duplicate
        }
        
        const scanlines = safeCreateElement('div', 'effect', {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: '9997',
            background: `repeating-linear-gradient(
                0deg,
                rgba(0, 0, 0, 0.01) 0px,
                transparent 1px,
                transparent 2px,
                rgba(0, 0, 0, 0.01) 3px
            )`,
            opacity: '0.001',
            mixBlendMode: 'multiply'
        });
        scanlines.className = 'scanlines';
        scanlines.setAttribute('data-permanent', 'true'); // Mark as permanent
        document.body.appendChild(scanlines);

        // Use GSAP registry if available, otherwise direct GSAP
        if (this.gsapRegistry) {
            this.gsapRegistry.createAnimation('to', scanlines, {
                backgroundPosition: '0 4px',
                duration: 3,
                repeat: -1,
                ease: 'sine.inOut'
            }, 'scanlines-animation', 'background');
        } else {
            // Direct GSAP fallback
            gsap.to(scanlines, {
                backgroundPosition: '0 4px',
                duration: 3,
                repeat: -1,
                ease: 'sine.inOut'
            });
        }
        
        console.log('✅ Scanlines animation created (with fallback support)');
    }

    addVHSDistortion() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes vhsDistortion {
                0%, 100% {
                    transform: translateX(0) scaleX(1);
                    filter: hue-rotate(0deg);
                }
                20% {
                    transform: translateX(-2px) scaleX(1.01);
                    filter: hue-rotate(10deg);
                }
                40% {
                    transform: translateX(2px) scaleX(0.99);
                    filter: hue-rotate(-10deg);
                }
                60% {
                    transform: translateX(-1px) scaleX(1.02);
                    filter: hue-rotate(5deg);
                }
                80% {
                    transform: translateX(1px) scaleX(0.98);
                    filter: hue-rotate(-5deg);
                }
            }

            .image-wrapper {
                animation: vhsDistortion 8s infinite;
            }

            @keyframes cyberPulse {
                0%, 100% {
                    filter: brightness(100%) contrast(100%);
                }
                50% {
                    filter: brightness(110%) contrast(110%);
                }
            }

            .logo-text-wrapper {
                animation: cyberPulse 4s infinite;
            }
        `;
        document.head.appendChild(style);
    }

    addCyberGrid() {
        const gridCanvas = safeCreateElement('canvas', 'background', {
            position: 'fixed',
            bottom: '0',
            left: '0',
            width: '100%',
            height: '80%',
            pointerEvents: 'none',
            zIndex: '-1',
            opacity: '0.008'
        });
        gridCanvas.id = 'cyber-grid';
        document.body.appendChild(gridCanvas);

        const ctx = gridCanvas.getContext('2d');
        gridCanvas.width = window.innerWidth;
        gridCanvas.height = window.innerHeight * 0.8;

        let offset = 0;

        const drawGrid = () => {
            ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

            // Create perspective grid
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 0.5;

            const gridSize = 40;
            const horizon = 0;
            const vanishingPointY = -gridCanvas.height * 0.5;

            // Horizontal lines with perspective
            for (let i = 0; i <= 20; i++) {
                const y = horizon + (i * i * 2); // Exponential spacing for perspective
                if (y > gridCanvas.height) break;

                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(gridCanvas.width, y);
                ctx.globalAlpha = 1 - (y / gridCanvas.height) * 0.7;
                ctx.stroke();
            }

            // Vertical lines with perspective
            const centerX = gridCanvas.width / 2;
            const numLines = 30;

            for (let i = -numLines; i <= numLines; i++) {
                ctx.beginPath();
                const startX = centerX + (i * gridSize);
                const endX = centerX + (i * gridSize * 5);

                ctx.moveTo(startX, horizon);
                ctx.lineTo(endX, gridCanvas.height);
                ctx.globalAlpha = 0.3 - Math.abs(i / numLines) * 0.2;
                ctx.stroke();
            }

            ctx.globalAlpha = 1;
        };

        const gridSize = 40; // Define gridSize here
        const animateGrid = () => {
            offset += 0.5;
            if (offset > gridSize) offset = 0;
            drawGrid();
            requestAnimationFrame(animateGrid);
        };

        animateGrid();
    }

    addGlowEffects() {
        const style = document.createElement('style');
        style.textContent = `
            .image-wrapper {
                filter: drop-shadow(0 0 20px rgba(0, 255, 255, 0.5));
            }

            .logo-text {
                text-shadow:
                    0 0 10px rgba(0, 255, 255, 0.8),
                    0 0 20px rgba(0, 255, 255, 0.6),
                    0 0 30px rgba(0, 255, 255, 0.4);
            }

            .button-primary {
                box-shadow:
                    0 0 20px rgba(255, 0, 255, 0.5),
                    inset 0 0 20px rgba(0, 255, 255, 0.2);
                transition: all 0.3s;
            }

            .button-primary:hover {
                box-shadow:
                    0 0 40px rgba(255, 0, 255, 0.8),
                    inset 0 0 30px rgba(0, 255, 255, 0.4);
            }

            /* Removed .glow animation that was causing unwanted green bar
               The .glow element should remain opacity: 0 as set in chaos-effects.css */
        `;
        document.head.appendChild(style);
    }

    runStartupSequence() {
        // Cyberpunk-style startup sequence - load from config
        const messages = matrixConfig.startupMessages;

        // Start phase-based animations after startup
        setTimeout(() => {
            this.startAnimationPhases();
        }, 8000);

        const consoleDiv = document.createElement('div');
        consoleDiv.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            font-family: 'Space Mono', monospace;
            font-size: 12px;
            color: #00ff00;
            text-shadow: 0 0 5px #00ff00;
            z-index: 9999;
            opacity: 0;
            max-width: 300px;
        `;
        document.body.appendChild(consoleDiv);

        // Fade in console
        gsap.to(consoleDiv, {
            opacity: 0.8,
            duration: 0.5
        });

        let messageIndex = 0;
        const typeMessage = () => {
            if (messageIndex < messages.length) {
                const message = messages[messageIndex];
                consoleDiv.innerText = '> ' + message;

                messageIndex++;
                setTimeout(typeMessage, 800);
            } else {
                // Fade out after completion
                gsap.to(consoleDiv, {
                    opacity: 0,
                    duration: 2,
                    delay: 2,
                    onComplete: () => consoleDiv.remove()
                });
            }
        };

        setTimeout(typeMessage, 500);
    }

    enableFallbackMode() {
        console.log('📉 Running in fallback mode (CSS only)');

        // Add CSS-only animations as fallback
        const style = document.createElement('style');
        style.textContent = `
            .pre-loader {
                background: linear-gradient(45deg, #000, #0a0a0a, #000);
                animation: backgroundShift 10s infinite;
            }

            @keyframes backgroundShift {
                0%, 100% {
                    filter: hue-rotate(0deg) brightness(100%);
                }
                50% {
                    filter: hue-rotate(30deg) brightness(110%);
                }
            }
        `;
        document.head.appendChild(style);
    }

    handleResize() {
        window.addEventListener('resize', () => {
            if (chaosEngine.isInitialized) {
                chaosEngine.handleResize();
            }

            // Update canvas sizes
            const matrixCanvas = document.getElementById('matrix-rain');
            if (matrixCanvas) {
                matrixCanvas.width = window.innerWidth;
                matrixCanvas.height = window.innerHeight;
            }

            const gridCanvas = document.getElementById('cyber-grid');
            if (gridCanvas) {
                gridCanvas.width = window.innerWidth;
                gridCanvas.height = window.innerHeight * 0.8;
            }
        });
    }

    addStaticNoise() {
        // CRITICAL FIX: Create static-noise canvas outside performance manager
        // to prevent auto-cleanup that was causing noise effect to disappear
        const canvas = document.createElement('canvas');
        canvas.id = 'static-noise';

        // Check current noise intensity from FX controller to set initial opacity
        let initialOpacity = 0.015; // Default
        let initialDisplay = 'block';

        if (window.fxController) {
            const noiseIntensity = window.fxController.getIntensity('noise');
            if (noiseIntensity === 0) {
                initialOpacity = 0;
                initialDisplay = 'none';
            } else {
                initialOpacity = (noiseIntensity * 0.05).toFixed(3);
            }
        }

        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
            opacity: ${initialOpacity};
            mix-blend-mode: screen;
            display: ${initialDisplay};
        `;
        canvas.width = 256;
        canvas.height = 256;

        // Add to DOM directly (not through performance manager)
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');

        // Store references for start/stop control
        this._noiseCanvas = canvas;
        this._noiseCtx = ctx;

        // Rendering routine (invoked by rAF loop)
        this._renderNoiseFrame = () => {
            if (!this._noiseCtx || !this._noiseCanvas) return;
            const imageData = this._noiseCtx.createImageData(256, 256);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const value = Math.random() * 255;
                data[i] = value;
                data[i + 1] = value;
                data[i + 2] = value;
                data[i + 3] = 255;
            }
            this._noiseCtx.putImageData(imageData, 0, 0);
        };

        // Visibility-aware rAF loop at ~10 FPS
        this._noiseActive = false;
        this._noiseRAF = null;
        this._noiseLastTick = 0;
        this.startNoiseAnimation();
        
        // Pause/resume on tab visibility change
        window.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopNoiseAnimation();
            } else {
                // Only resume if noise is visible and opacity > 0
                const canvasEl = document.getElementById('static-noise');
                const isVisible = canvasEl && canvasEl.style.display !== 'none' && parseFloat(canvasEl.style.opacity || '0') > 0;
                if (isVisible) this.startNoiseAnimation();
            }
        });

        console.log('✅ Static noise canvas created (outside performance manager to prevent cleanup)');
    }

    startNoiseAnimation() {
        const canvasEl = document.getElementById('static-noise');
        if (!canvasEl || !this._noiseCtx) return;
        if (this._noiseActive) return;
        // Only run if noise is actually visible and has opacity
        const visible = canvasEl.style.display !== 'none' && parseFloat(canvasEl.style.opacity || '0') > 0;
        if (!visible) return;
        this._noiseActive = true;
        const loop = (now) => {
            if (!this._noiseActive) return;
            // Throttle to ~10 FPS
            if (!this._noiseLastTick || (now - this._noiseLastTick) >= 100) {
                this._noiseLastTick = now;
                this._renderNoiseFrame && this._renderNoiseFrame();
            }
            this._noiseRAF = requestAnimationFrame(loop);
        };
        this._noiseRAF = requestAnimationFrame(loop);
    }

    stopNoiseAnimation() {
        this._noiseActive = false;
        if (this._noiseRAF) {
            cancelAnimationFrame(this._noiseRAF);
            this._noiseRAF = null;
        }
    }

    addDataStreams() {
        // Check if data streams already exist
        if (document.querySelector('.data-streams')) {
            return; // Already exists, don't create duplicate
        }
        
        const container = safeCreateElement('div', 'stream', {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: '2',
            overflow: 'hidden'
        });
        container.className = 'data-streams';
        container.setAttribute('data-permanent', 'true'); // Mark as permanent
        document.body.appendChild(container);

        // Create vertical data streams with managed elements
        for (let i = 0; i < 3; i++) { // Reduced from 5 to 3
            const stream = safeCreateElement('div', 'stream', {
                position: 'absolute',
                left: `${Math.random() * 100}%`,
                top: '-100px',
                width: '2px',
                height: `${Math.random() * 200 + 100}px`,
                background: 'linear-gradient(transparent, #00ff85, transparent)',
                opacity: `${Math.random() * 0.3 + 0.1}`
            }, { autoAppend: false });
            stream.setAttribute('data-permanent', 'true'); // Mark as permanent
            container.appendChild(stream);

            // Use GSAP registry if available, otherwise direct GSAP
            if (this.gsapRegistry) {
                this.gsapRegistry.createAnimation('to', stream, {
                    y: window.innerHeight + 200,
                    duration: Math.random() * 10 + 5,
                    repeat: -1,
                    ease: 'linear',
                    delay: Math.random() * 5
                }, `data-stream-${i}`, 'stream');
            } else {
                // Fallback to direct GSAP
                gsap.to(stream, {
                    y: window.innerHeight + 200,
                    duration: Math.random() * 10 + 5,
                    repeat: -1,
                    ease: 'linear',
                    delay: Math.random() * 5
                });
            }
        }
    }

    addHolographicShimmer() {
        const shimmer = document.createElement('div');
        shimmer.className = 'holographic-shimmer';
        shimmer.style.cssText = `
            position: fixed;
            top: -100%;
            left: -50%;
            width: 200%;
            height: 200%;
            pointer-events: none;
            z-index: 3;
            background: linear-gradient(45deg,
                transparent 30%,
                rgba(0, 255, 255, 0.05) 50%,
                transparent 70%);
            transform: rotate(45deg);
        `;
        document.body.appendChild(shimmer);

        gsap.to(shimmer, {
            y: '200%',
            duration: 15,
            repeat: -1,
            ease: 'linear'  // Smoother continuous movement
        });
    }

    _installPhaseController() {
        // Map phase name to runner
        this._phaseMap = new Map([
            ['intense', () => this.phaseIntense()],
            ['calm', () => this.phaseCalm()],
            ['glitch', () => this.phaseGlitch()],
            ['techno', () => this.phaseTechno?.()],
            ['matrix', () => this.phaseMatrix?.()],
            ['minimal', () => this.phaseMinimal?.()],
            ['chaotic', () => this.phaseChaotic?.()],
            ['retro', () => this.phaseRetro?.()],
            ['vaporwave', () => this.phaseVaporwave?.()],
            ['cyberpunk', () => this.phaseCyberpunk?.()],
            ['neon', () => this.phaseNeon()],
            ['aurora', () => this.phaseAurora()],
            ['sunset', () => this.phaseSunset()],
            ['ocean', () => this.phaseOcean()],
            ['forest', () => this.phaseForest()],
            ['fire', () => this.phaseFire()],
            ['ice', () => this.phaseIce()],
            ['galaxy', () => this.phaseGalaxy()]
        ]);

        // Install transition executor with instant transitions (no blackout)
        this.phaseController.setTransitionExecutor(async ({ prev, next, signal }) => {
            // Guard against missing next
            if (!next || !this._phaseMap.has(next)) return;
            
            // Cleanup previous overlays immediately
            this.transitionOut();
            if (signal?.aborted) return;
            
            // Brief pause for cleanup to complete
            await new Promise(r => setTimeout(r, 100));
            if (signal?.aborted) return;
            
            // Run target phase
            try { this._phaseMap.get(next)?.(); } catch (e) { console.warn('Phase runner error', next, e); }
            
            // Notify
            try { window.vjReceiver?.sendMessage?.({ type: 'scene_changed', scene: next, timestamp: Date.now() }); } catch(_) {}
        });
    }

    startAnimationPhases() {
        // Prevent duplicate phase runners
        if (this.phaseRunning && this.phaseTimer) {
            console.log('⚠️ Phase animations already running');
            return;
        }

        // Create phase list (name + runner)
        const phases = [
            { name: 'intense', run: () => this.phaseIntense() },
            { name: 'calm', run: () => this.phaseCalm() },
            { name: 'glitch', run: () => this.phaseGlitch() },
            { name: 'techno', run: () => this.phaseTechno() },
            { name: 'matrix', run: () => this.phaseMatrix() },
            { name: 'minimal', run: () => this.phaseMinimal() },
            { name: 'chaotic', run: () => this.phaseChaotic() },
            { name: 'retro', run: () => this.phaseRetro() },
            // Color-themed phases
            { name: 'vaporwave', run: () => this.phaseVaporwave() },
            { name: 'cyberpunk', run: () => this.phaseCyberpunk() },
            { name: 'neon', run: () => this.phaseNeon() },
            { name: 'aurora', run: () => this.phaseAurora() },
            // New additional color phases
            { name: 'sunset', run: () => this.phaseSunset() },
            { name: 'ocean', run: () => this.phaseOcean() },
            { name: 'forest', run: () => this.phaseForest() },
            { name: 'fire', run: () => this.phaseFire() },
            { name: 'ice', run: () => this.phaseIce() },
            { name: 'galaxy', run: () => this.phaseGalaxy() }
        ];

        let lastPhaseName = null;
        this.phaseRunning = true;

        const notifyScene = (name) => {
            if (window.vjReceiver && typeof window.vjReceiver.sendMessage === 'function' && name) {
                window.vjReceiver.sendMessage({ type: 'scene_changed', scene: name, timestamp: Date.now() });
            }
        };

        const runRandomPhase = () => {
            if (!this.phaseRunning) return;
            if (this._phaseTransitioning) return; // guard against overlapping transitions

            const availablePhases = phases.filter(p => p.name !== lastPhaseName);
            const choice = availablePhases[Math.floor(Math.random() * availablePhases.length)];
            lastPhaseName = choice.name;

            // Use PhaseController to coordinate transition (cancellable)
            this._phaseTransitioning = true;
            this.phaseController.setPhase(choice.name).finally(() => {
                this.currentPhase = choice.name;
                notifyScene(choice.name);
                this._phaseTransitioning = false;
            });

            // schedule next based on configured phaseDurationMs
            this.clearPhaseTimer();
            this.phaseTimer = setTimeout(runRandomPhase, Math.max(5000, Number(this.phaseDurationMs) || 30000));
        };

        runRandomPhase();
    }

    stopAnimationPhases() {
        this.phaseRunning = false;
        this.clearPhaseTimer();
    }

    clearPhaseTimer() {
        if (this.phaseTimer) {
            clearTimeout(this.phaseTimer);
            this.phaseTimer = null;
        }
    }

    transitionOut() {
        // SIMPLIFIED: No filter reset during transitions to prevent grey flashes
        // Let new phase handle its own filter without resetting first
        
        // Disable visual effects during transition
        this.disableParticleEffect();
        this.disablePlasmaEffect();
        
        // Kill previous phase animations if GSAP registry is available
        if (this.currentPhase && window.gsapAnimationRegistry) {
            const phaseName = `chaos-phase-${this.currentPhase}`;
            const killed = window.gsapAnimationRegistry.killOwner(phaseName);
            if (killed > 0) {
                console.log(`🗑️ Killed ${killed} animations from previous phase: ${this.currentPhase}`);
            }
        }
        
        // Only clean up overlays (no filter manipulation)
        this.cleanupPhaseElements();
        
        console.log('🔄 Phase transition - overlay and animation cleanup completed');
    }

    cleanupPhaseElements() {
        // Clean up any lingering elements from previous phases
        const temporaryElements = document.querySelectorAll('.vhs-overlay, .flash-overlay, .warp-effect, .phase-overlay, .glitch-overlay, div[style*="z-index: 999"]');
        temporaryElements.forEach(el => {
            // Skip essential elements
            if (
                el.classList.contains('matrix-messages') ||
                el.classList.contains('matrix-blackout') ||
                el.classList.contains('scanlines') ||
                el.id === 'static-noise'
            ) {
                return;
            }
            // Cancel any running animations on the element
            gsap.killTweensOf(el);
            el.remove();
        });

        // Clean up orphaned canvases
        const canvases = document.querySelectorAll('canvas');
        canvases.forEach(canvas => {
            // Keep essential canvases
            if (canvas.id === 'cyber-grid' || canvas.id === 'chaos-canvas') {
                return;
            }
            // Remove temporary effect canvases
            if (canvas.style.position === 'fixed' && !canvas.id) {
                canvas.remove();
            }
        });
    }

    startAnimationWatchdog() {
        // Simple watchdog without performance system dependencies
        let checkCount = 0;

        // Use regular setInterval with proper cleanup tracking
        const watchdogIntervalId = setInterval(() => {
            checkCount++;
            const verbose = checkCount % 30 === 0; // Log every 5 minutes
            
            // Get basic performance check from safe monitor if available
            let shouldSkipOptimizations = false;
            if (window.safePerformanceMonitor) {
                const report = window.safePerformanceMonitor.getReport();
                shouldSkipOptimizations = report.fps.current < 25;
            }

            if (shouldSkipOptimizations) {
                console.log('⚠️ Skipping watchdog optimizations due to low FPS');
                return;
            }

            // Clean up any stuck grey filters every 3 minutes instead of 30 seconds
            if (checkCount % 9 === 0) {
                const bodyFilter = window.getComputedStyle(document.body).filter;
                // Check for problematic filters (low saturation or high sepia)
                if (bodyFilter && (bodyFilter.includes('saturate(0') || bodyFilter.includes('sepia'))) {
                    console.log('🔧 Clearing stuck grey/sepia filter...');
                    // Use direct GSAP instead of registry (since registry might be null)
                    gsap.to(document.body, {
                        filter: 'none',
                        duration: 1,
                        ease: 'power2.inOut'
                    });
                }

                // Clean up stuck blackout overlays - don't remove, just reset
                const blackouts = document.querySelectorAll('.matrix-blackout');
                if (blackouts.length > 0 && !window.matrixMessages?.isActive) {
                    blackouts.forEach(blackout => {
                        // Only clear if it's stuck in active state
                        if (blackout.classList.contains('active') || parseFloat(blackout.style.opacity) > 0) {
                            console.log('🔧 Clearing stuck blackout overlay...');
                            blackout.classList.remove('active');
                            blackout.style.opacity = '0';
                            blackout.style.display = 'none';
                        }
                    });
                }

                // Clean up duplicate blackout elements
                const allBlackouts = document.querySelectorAll('.matrix-blackout');
                if (allBlackouts.length > 1) {
                    console.log('🔧 Removing duplicate blackout elements...');
                    // Keep the first one, remove duplicates
                    for (let i = 1; i < allBlackouts.length; i++) {
                        if (allBlackouts[i] && allBlackouts[i].parentNode) {
                            allBlackouts[i].remove();
                        }
                    }
                }
            }

            // REMOVED: Force triggering of random animations - this was causing the performance issues
            // Only restart if completely stopped (much less aggressive)
            if (randomAnimations && !randomAnimations.isRunning) {
                console.log('🔧 Restarting stopped random animations...');
                randomAnimations.isRunning = true;
                // Don't force trigger immediately
            }

            // DISABLED: Extended animations cause DOM explosion and performance collapse
            // Do NOT restart them even if stopped
            // if (extendedAnimations && !extendedAnimations.isRunning) {
            //     console.log('🔧 Restarting stopped extended animations...');
            //     extendedAnimations.isRunning = true;
            // }

            // Check if phase animations are completely stopped
            if (!this.phaseRunning) {
                console.log('🔧 Restarting phase animations...');
                this.phaseRunning = true;
                this.startAnimationPhases();
            }

            // Only restart if truly not initialized
            if (backgroundAnimator && !backgroundAnimator.initialized) {
                console.log('🔧 Restarting background animator...');
                backgroundAnimator.init();
                backgroundAnimator.startGlitchSequence();
            }

            if (enhancedLogoAnimator && !enhancedLogoAnimator.isInitialized) {
                console.log('🔧 Restarting enhanced logo animator...');
                enhancedLogoAnimator.init();
            }

            // REMOVED: Random special logo animation trigger - was creating too many elements

            // Memory monitoring (every check ~30 seconds)
            if (performance.memory) {
                const { usedJSHeapSize, jsHeapSizeLimit } = performance.memory;
                const usagePercent = ((usedJSHeapSize / jsHeapSizeLimit) * 100).toFixed(1);

                // Log every 10 checks (~5 minutes)
                if (checkCount % 10 === 0) {
                    const usedMB = (usedJSHeapSize / 1048576).toFixed(2);
                    const limitMB = (jsHeapSizeLimit / 1048576).toFixed(2);
                    console.log(`📊 Memory: ${usedMB}MB / ${limitMB}MB (${usagePercent}%)`);
                }

                // CRITICAL FIX: Increased threshold from 75% to 85% (browsers often use 80-95% normally)
                if (usagePercent > 85 && checkCount % 2 === 0) {
                    console.warn(`⚠️ High memory usage: ${usagePercent}% - consider reducing animations`);
                }

                // CRITICAL FIX: Increased threshold from 85% to 92% (prevents unnecessary cleanup)
                if (usagePercent > 92) {
                    console.error(`🚨 Critical memory usage: ${usagePercent}% - triggering emergency cleanup`);
                    // Force aggressive cleanup
                    if (window.vjReceiver && typeof window.vjReceiver.aggressiveDOMCleanup === 'function') {
                        window.vjReceiver.aggressiveDOMCleanup();
                    }
                    this.cleanupPhaseElements();
                }

                // CRITICAL FIX: Increased threshold from 90% to 97% (prevents restart loops)
                if (usagePercent > 97) {
                    console.error(`🚨🚨 CRITICAL: Memory at ${usagePercent}% - initiating soft restart`);
                    setTimeout(() => this.handleSoftRestart(), 2000);
                }
            }

            if (verbose) {
                console.log('🔍 Watchdog check completed - performance preserved');
            }
        }, 30000); // Simple 30-second interval

        // Store interval ID for cleanup
        this.watchdogIntervalId = watchdogIntervalId;
    }

    startPeriodicDOMCleanup() {
        // Periodic cleanup of unmanaged DOM elements every 60 seconds (more aggressive)
        // This prevents accumulation from anime-enhanced-effects and other unmanaged modules
        this.domCleanupInterval = setInterval(() => {
            const beforeCount = document.querySelectorAll('*').length;

            // Use VJ receiver's aggressive cleanup if available
            if (window.vjReceiver && typeof window.vjReceiver.aggressiveDOMCleanup === 'function') {
                window.vjReceiver.aggressiveDOMCleanup();
            } else {
                // Fallback cleanup
                this.cleanupPhaseElements();

                // Clean up anime-enhanced-effects elements
                const animeElements = document.querySelectorAll('.anime-particles, .anime-data-streams, .anime-energy-pulse, .anime-text-glow');
                animeElements.forEach(el => {
                    if (!el.hasAttribute('data-permanent')) {
                        try { el.remove(); } catch {}
                    }
                });
            }

            // Additional cleanup for orphaned GSAP animations
            if (window.gsapAnimationRegistry && typeof window.gsapAnimationRegistry.size === 'function') {
                const totalAnims = window.gsapAnimationRegistry.size();
                if (totalAnims > 100) {
                    console.warn(`⚠️ High GSAP animation count: ${totalAnims}`);
                    // Cleanup is handled by registry's own budget system
                }
            }

            const afterCount = document.querySelectorAll('*').length;
            const removed = beforeCount - afterCount;

            if (removed > 0) {
                console.log(`🧹 Periodic DOM cleanup: removed ${removed} elements (${beforeCount} → ${afterCount})`);
            }

            // Log resource status every 5 cleanups (~5 minutes)
            if (!this._cleanupCounter) this._cleanupCounter = 0;
            this._cleanupCounter++;
            if (this._cleanupCounter % 5 === 0) {
                const gsapCount = (window.gsapAnimationRegistry && typeof window.gsapAnimationRegistry.size === 'function')
                    ? window.gsapAnimationRegistry.size()
                    : 0;
                console.log(`📊 Resources: ${afterCount} DOM nodes, ${gsapCount} GSAP anims`);
            }
        }, 60000); // Every 60 seconds (was 120000)

        console.log('📊 Periodic DOM cleanup scheduler started (every 60 seconds)');
    }

    phaseIntense() {
        // Phase: Intense
        // Dispatch event for logo reaction
        window.dispatchEvent(new CustomEvent('animationPhase', { detail: { phase: 'intense' } }));

        // Gentle rotation increase
        try {
            const bgElement = document.querySelector('.bg');
            if (bgElement) {
                gsap.to(bgElement, {
                    rotationZ: '+=90',  // Reduced from 180
                    scale: 3,  // CRITICAL: Preserve scale to prevent edge reveal
                    duration: 8,  // Slower
                    ease: 'power2.inOut'
                });
            }
        } catch (e) {
            console.warn('phaseIntense: Failed to animate .bg', e);
        }

        // Subtle particle effects
        if (window.chaosEngine && window.chaosEngine.particles && window.chaosEngine.particles.material) {
            try {
                gsap.to(window.chaosEngine.particles.material, {
                    opacity: 0.6,  // Reduced from 0.9
                    size: 0.8,  // Reduced from 1
                    duration: 3
                });
            } catch (e) {
                console.warn('phaseIntense: Failed to animate particles', e);
            }
        }

        // Very subtle vibration instead of shake
        try {
            if (document.body) {
                gsap.to(document.body, {
                    x: 1,
                    y: 1,
                    duration: 0.5,  // Slower for smoothness
                    yoyo: true,
                    repeat: 10,
                    ease: 'sine.inOut'
                });
            }
        } catch (e) {
            console.warn('phaseIntense: Failed to animate body', e);
        }
    }

    phaseCalm() {
        // Phase: Calm

        // Slow everything down
        try {
            const bgElement = document.querySelector('.bg');
            if (bgElement) {
                gsap.to(bgElement, {
                    rotationZ: '+=30',
                    scale: 3,  // CRITICAL: Preserve scale to prevent edge reveal
                    duration: 15,
                    ease: 'sine.inOut'
                });
            }
        } catch (e) {
            console.warn('phaseCalm: Failed to animate .bg', e);
        }

        // Reduce effects
        if (window.chaosEngine && window.chaosEngine.particles && window.chaosEngine.particles.material) {
            try {
                gsap.to(window.chaosEngine.particles.material, {
                    opacity: 0.3,
                    size: 0.3,
                    duration: 5
                });
            } catch (e) {
                console.warn('phaseCalm: Failed to animate particles', e);
            }
        }

        // Add subtle breathing effect to main elements
        try {
            const elements = document.querySelectorAll('.logo-text-wrapper, .image-wrapper');
            if (elements.length > 0) {
                gsap.to(elements, {
                    scale: 1.02,  // Reduced from 1.05
                    duration: 4,
                    yoyo: true,
                    repeat: 2,
                    ease: 'sine.inOut'
                });
            }
        } catch (e) {
            console.warn('phaseCalm: Failed to animate logo elements', e);
        }
    }

    phaseGlitch() {
        // Phase: Glitch

        // Heavy glitch effects
        const glitchBurst = () => {
            // RGB split via safe filter application to avoid flashes
            this.safeApplyFilter(
                document.body,
                `hue-rotate(${Math.random() * 360}deg) saturate(${Math.random() * 2 + 0.5})`,
                0.2
            );

            // Position glitch
            const elements = document.querySelectorAll('.logo-text-wrapper, .image-wrapper, .text-3886');
            elements.forEach(el => {
                el.style.transform = `translate(${Math.random() * 20 - 10}px, ${Math.random() * 20 - 10}px) skew(${Math.random() * 10 - 5}deg)`;
            });

            setTimeout(() => {
                this.safeApplyFilter(document.body, 'none', 0.2);
                elements.forEach(el => {
                    el.style.transform = 'none';
                });
            }, 100);
        };

        // Reduced glitch bursts (was 10, now 3)
        for (let i = 0; i < 3; i++) {
            setTimeout(glitchBurst, i * 800);  // Slower interval (was 300ms)
        }
    }

    phaseTechno() {
        // Phase: Techno

        // REMOVED STROBE FLASH - No more flashing before color switch

        // Apply techno blue color theme safely
        this.safeApplyFilter(document.body, 'hue-rotate(-30deg) saturate(1.3) brightness(1.05)', 3);

        // Very subtle pulsing
        try {
            const elements = document.querySelectorAll('.logo-text-wrapper, .image-wrapper, .text-3886');
            if (elements.length > 0) {
                gsap.to(elements, {
                    scale: 1.02,  // Even more subtle
                    duration: 2,  // Much slower for smooth flow
                    repeat: 10,
                    yoyo: true,
                    ease: 'sine.inOut'  // Smoother easing
                });
            }
        } catch (e) {
            console.warn('phaseTechno: Failed to animate elements', e);
        }
    }

    phaseMatrix() {
        // Phase: Matrix

        // Green tint overlay
        const matrixOverlay = document.createElement('div');
        matrixOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle at center, transparent 30%, rgba(0, 255, 133, 0.1) 100%);
            pointer-events: none;
            z-index: 9990;
            opacity: 0;
        `;
        document.body.appendChild(matrixOverlay);

        gsap.to(matrixOverlay, {
            opacity: 1,
            duration: 2,
            onComplete: () => {
                gsap.to(matrixOverlay, {
                    opacity: 0,
                    duration: 2,
                    delay: 5,
                    onComplete: () => matrixOverlay.remove()
                });
            }
        });

        // Create falling code rain
        for (let i = 0; i < 20; i++) {
            const codeStream = document.createElement('div');
            codeStream.textContent = Array.from({ length: 30 }, () =>
                String.fromCharCode(33 + Math.random() * 94)
            ).join('');
            codeStream.style.cssText = `
                position: fixed;
                left: ${Math.random() * 100}%;
                top: -100%;
                color: #00ff85;
                font-family: monospace;
                font-size: 10px;
                opacity: ${Math.random() * 0.5 + 0.1};
                writing-mode: vertical-rl;
                pointer-events: none;
                z-index: 9991;
            `;
            document.body.appendChild(codeStream);

            gsap.to(codeStream, {
                y: window.innerHeight * 2,
                duration: Math.random() * 5 + 3,
                ease: 'linear',  // Smoother than none
                onComplete: () => codeStream.remove()
            });
        }
    }

    addGlitchLines() {
        const container = document.createElement('div');
        container.className = 'glitch-lines';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9995;
        `;
        document.body.appendChild(container);

        const createGlitchLine = () => {
            // REPLACED: Circular glitch burst instead of ugly full-width line
            const glitchBurst = safeCreateElement('div', 'effect');
            const size = Math.random() * 80 + 20;
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;

            glitchBurst.style.cssText = `
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: radial-gradient(circle,
                    rgba(255, 0, 255, 0.8) 0%,
                    rgba(255, 0, 255, 0.4) 40%,
                    transparent 100%);
                border: 2px solid rgba(255, 0, 255, 0.6);
                mix-blend-mode: screen;
                transform: scale(0);
            `;
            container.appendChild(glitchBurst);

            this.gsapRegistry.createAnimation('to', glitchBurst, {
                scale: 2,
                opacity: 0,
                rotation: 180,
                duration: 0.8,
                ease: 'power4.out',
                onComplete: () => safeRemoveElement(glitchBurst)
            }, 'glitch-burst', 'effect');
        };

        // Periodic glitch lines with performance controls
        const glitchLineInterval = this.intervalManager.createInterval(() => {
            // Check performance before creating glitch lines
            const performanceStats = this.performanceMonitor.metrics;
            if (performanceStats.fps < 25 || performanceStats.managedElements > 130) {
                return; // Skip this cycle if performance is poor
            }
            
            if (Math.random() > 0.85) { // Reduced frequency from 0.8 to 0.85
                createGlitchLine();
                if (Math.random() > 0.7) { // Reduced from 0.5 to 0.7
                    setTimeout(createGlitchLine, 75); // Increased delay from 50 to 75ms
                }
            }
        }, 4500, 'glitch-lines', { // Increased interval from 3000 to 4500ms
            category: 'effect',
            maxAge: 200000 // 3.3 minutes max age
        });
        
        this.managedIntervals.push(glitchLineInterval);
    }

    // Ensure cicada logo never goes too transparent
    protectLogoOpacity() {
        const imageWrapper = document.querySelector('.image-wrapper');
        const image = document.querySelector('.image-2');

        if (imageWrapper && image) {
            // Set initial minimum opacity
            gsap.set(image, { opacity: 1 });

            // Create a MutationObserver to watch for opacity changes
            const observer = new MutationObserver(() => {
                const wrapperOpacity = parseFloat(window.getComputedStyle(imageWrapper).opacity);
                const imageOpacity = parseFloat(window.getComputedStyle(image).opacity);
                const combinedOpacity = wrapperOpacity * imageOpacity;

                // If combined opacity is too low, boost the image opacity
                if (combinedOpacity < 0.7) {
                    const boostFactor = 0.7 / wrapperOpacity;
                    gsap.set(image, { opacity: Math.min(1, boostFactor) });
                }
            });

            // Observe style changes on both elements
            observer.observe(imageWrapper, { attributes: true, attributeFilter: ['style'] });
            observer.observe(image, { attributes: true, attributeFilter: ['style'] });

            // Store observer for cleanup
            this.opacityObserver = observer;
        }
    }

    addPersistentEffects() {
        // Add chromatic aberration pulse
        this.addChromaticPulse();

        // Add digital artifacts
        this.addDigitalArtifacts();

        // Add energy field effect around cicada
        this.addEnergyField();

        // Add data corruption waves
        this.addCorruptionWaves();

        // Add quantum fluctuations
        this.addQuantumFluctuations();
    }

    addChromaticPulse() {
        const pulseOverlay = document.createElement('div');
        pulseOverlay.className = 'chromatic-pulse';
        pulseOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 2;
            mix-blend-mode: screen;
            background: linear-gradient(45deg,
                transparent 30%,
                rgba(255,0,0,0.03) 35%,
                transparent 40%,
                transparent 60%,
                rgba(0,255,255,0.03) 65%,
                transparent 70%);
            background-size: 200% 200%;
        `;
        document.body.appendChild(pulseOverlay);

        gsap.to(pulseOverlay, {
            backgroundPosition: '200% 200%',
            duration: 8,
            repeat: -1,
            ease: 'linear'  // Smoother continuous movement
        });
    }

    addDigitalArtifacts() {
        const createArtifact = () => {
            const artifact = safeCreateElement('div', 'artifact');
            const types = ['horizontal', 'vertical', 'diagonal'];
            const type = types[Math.floor(Math.random() * types.length)];

            artifact.style.cssText = `
                position: fixed;
                pointer-events: none;
                z-index: 3;
                opacity: ${Math.random() * 0.2 + 0.05};
            `;

            if (type === 'horizontal') {
                // REPLACED: Circular glitch burst instead of ugly full-width line
                artifact.style.width = Math.random() * 60 + 20 + 'px'; // Small circular size
                artifact.style.height = artifact.style.width; // Make it circular
                artifact.style.borderRadius = '50%'; // Perfect circle
                artifact.style.left = Math.random() * window.innerWidth + 'px';
                artifact.style.top = Math.random() * window.innerHeight + 'px';
                artifact.style.background = `radial-gradient(circle,
                    rgba(0,255,133,0.6) 0%,
                    rgba(0,255,133,0.3) 50%,
                    transparent 100%)`;

                this.gsapRegistry.createAnimation('fromTo', artifact, {
                    scale: 3,
                    opacity: 0,
                    duration: Math.random() * 2 + 1,
                    ease: 'power2.out',
                    onComplete: () => safeRemoveElement(artifact)
                }, 'artifact-circular', 'artifact', { fromVars: { scale: 0, opacity: 1 } });
            } else if (type === 'vertical') {
                // REPLACED: Circular pulse instead of ugly full-height line
                artifact.style.width = Math.random() * 40 + 15 + 'px'; // Small circular size
                artifact.style.height = artifact.style.width; // Make it circular
                artifact.style.borderRadius = '50%'; // Perfect circle
                artifact.style.left = Math.random() * window.innerWidth + 'px';
                artifact.style.top = Math.random() * window.innerHeight + 'px';
                artifact.style.background = `radial-gradient(circle,
                    rgba(255,0,255,0.6) 0%,
                    rgba(255,0,255,0.2) 70%,
                    transparent 100%)`;

                this.gsapRegistry.createAnimation('fromTo', artifact, {
                    scale: 2.5,
                    opacity: 0,
                    rotation: 180,
                    duration: Math.random() * 2 + 1,
                    ease: 'power2.out',
                    onComplete: () => safeRemoveElement(artifact)
                }, 'artifact-pulse', 'artifact', { fromVars: { scale: 0, opacity: 0.8, rotation: 0 } });
            } else {
                // REPLACED: Small rotating circle instead of line
                artifact.style.width = Math.random() * 30 + 10 + 'px';
                artifact.style.height = artifact.style.width; // Make it circular
                artifact.style.borderRadius = '50%'; // Perfect circle
                artifact.style.background = `radial-gradient(circle,
                    rgba(0,255,255,0.8) 0%,
                    rgba(0,255,255,0.4) 60%,
                    transparent 100%)`;
                artifact.style.left = Math.random() * window.innerWidth + 'px';
                artifact.style.top = Math.random() * window.innerHeight + 'px';

                this.gsapRegistry.createAnimation('to', artifact, {
                    rotation: '+=720',
                    scale: 0,
                    opacity: 0,
                    duration: Math.random() * 3 + 1.5,
                    ease: 'power2.in',
                    onComplete: () => safeRemoveElement(artifact)
                }, 'artifact-rotating', 'artifact');
            }

            document.body.appendChild(artifact);
        };

        // Create artifacts periodically with managed interval and limits
        const artifactInterval = this.intervalManager.createInterval(() => {
            // Check performance before creating artifacts
            const performanceStats = this.performanceMonitor.metrics;
            if (performanceStats.fps < 25 || performanceStats.managedElements > 150) {
                return; // Skip this cycle if performance is poor
            }
            
            if (Math.random() > 0.8) { // Reduced frequency from 0.7 to 0.8
                createArtifact();
            }
        }, 5000, 'digital-artifacts', { // Increased interval from 3000 to 5000ms
            category: 'effect',
            maxAge: 300000 // 5 minutes max age
        });
        
        this.managedIntervals.push(artifactInterval);
    }

    addEnergyField() {
        const imageWrapper = document.querySelector('.image-wrapper');
        if (!imageWrapper) return;

        const energyField = document.createElement('div');
        energyField.className = 'energy-field';
        energyField.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 150%;
            height: 150%;
            border-radius: 50%;
            pointer-events: none;
            background: radial-gradient(circle,
                transparent 20%,
                rgba(0,255,133,0.05) 30%,
                transparent 40%,
                rgba(0,255,133,0.02) 50%,
                transparent 60%);
            filter: blur(3px);
            z-index: -1;
        `;
        imageWrapper.appendChild(energyField);

        // Subtle pulsing energy field
        gsap.to(energyField, {
            scale: 1.1,  // Reduced from 1.3
            opacity: 0.5,
            duration: 4,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });

        // Rotating energy field
        gsap.to(energyField, {
            rotation: 360,
            duration: 30,
            repeat: -1,
            ease: 'linear'  // Smoother continuous movement
        });

        // Second layer of energy
        const energyField2 = energyField.cloneNode();
        energyField2.style.background = `radial-gradient(circle,
            transparent 10%,
            rgba(255,0,255,0.03) 25%,
            transparent 35%,
            rgba(255,0,255,0.01) 45%,
            transparent 55%)`;
        imageWrapper.appendChild(energyField2);

        gsap.to(energyField2, {
            scale: 1.2,  // Reduced from 1.5
            opacity: 0.3,
            duration: 5,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });

        gsap.to(energyField2, {
            rotation: -360,
            duration: 25,
            repeat: -1,
            ease: 'linear'  // Smoother continuous movement
        });
    }

    addCorruptionWaves() {
        const createWave = () => {
            // REPLACED: Circular ripple effect instead of ugly horizontal bars
            const wave = safeCreateElement('div', 'effect');
            const size = Math.random() * 100 + 50;
            wave.style.cssText = `
                position: fixed;
                left: ${Math.random() * window.innerWidth}px;
                top: ${Math.random() * window.innerHeight}px;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                pointer-events: none;
                z-index: 4;
                background: radial-gradient(circle,
                    transparent 30%,
                    rgba(255,0,255,0.1) 50%,
                    rgba(255,0,255,0.05) 70%,
                    transparent 100%);
                border: 1px solid rgba(255,0,255,0.3);
                transform: scale(0.1);
                mix-blend-mode: screen;
            `;

            // Ripple expansion effect
            this.gsapRegistry.createAnimation('to', wave, {
                scale: 4,
                opacity: 0,
                duration: 1.2,
                ease: 'power2.out',
                onComplete: () => safeRemoveElement(wave)
            }, 'corruption-ripple', 'effect');
        };

        // Trigger waves periodically with performance awareness
        const corruptionWaveInterval = this.intervalManager.createInterval(() => {
            // Check performance before creating waves
            const performanceStats = this.performanceMonitor.metrics;
            if (performanceStats.fps < 30 || performanceStats.managedElements > 120) {
                return; // Skip this cycle if performance is poor
            }
            
            if (Math.random() > 0.9) { // Reduced frequency from 0.85 to 0.9
                createWave();
                // Reduced multiple wave creation
                if (Math.random() > 0.8) { // Reduced from 0.7 to 0.8
                    setTimeout(createWave, 150);
                    // Removed third wave to reduce element creation
                }
            }
        }, 6000, 'corruption-waves', { // Increased interval from 4000 to 6000ms
            category: 'effect',
            maxAge: 240000 // 4 minutes max age
        });
        
        this.managedIntervals.push(corruptionWaveInterval);
    }

    addQuantumFluctuations() {
        // Create quantum particle effects around the cicada
        const imageWrapper = document.querySelector('.image-wrapper');
        if (!imageWrapper) return;

        const particleContainer = document.createElement('div');
        particleContainer.className = 'quantum-particles';
        particleContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10;
        `;
        imageWrapper.appendChild(particleContainer);

        const createParticle = () => {
            const particle = safeCreateElement('div', 'particle');
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 100 + 50;
            const startX = Math.cos(angle) * distance;
            const startY = Math.sin(angle) * distance;

            particle.style.cssText = `
                position: absolute;
                width: 3px;
                height: 3px;
                background: radial-gradient(circle, rgba(0,255,133,0.8) 0%, transparent 70%);
                border-radius: 50%;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                box-shadow: 0 0 10px rgba(0,255,133,0.5);
            `;
            particleContainer.appendChild(particle);

            // Animate particle orbiting
            gsap.fromTo(particle,
                {
                    x: startX,
                    y: startY,
                    scale: 0,
                    opacity: 0
                },
                {
                    x: -startX,
                    y: -startY,
                    scale: 1,
                    opacity: 1,
                    duration: Math.random() * 3 + 2,
                    ease: 'sine.inOut',
                    onComplete: () => {
                        gsap.to(particle, {
                            scale: 0,
                            opacity: 0,
                            duration: 0.5,
                            onComplete: () => particle.remove()
                        });
                    }
                }
            );
        };

        // Create particles periodically with strict performance controls
        const quantumParticleInterval = this.intervalManager.createInterval(() => {
            // Strict performance checks - quantum particles are expensive
            const performanceStats = this.performanceMonitor.metrics;
            if (performanceStats.fps < 35 || performanceStats.managedElements > 100) {
                return; // Skip this cycle if performance is poor
            }
            
            // Much more conservative particle creation
            if (Math.random() > 0.75) { // Reduced frequency from 0.5 to 0.75
                createParticle();
            }
        }, 2000, 'quantum-particles', { // Increased interval from 500ms to 2000ms (4x slower!)
            category: 'particle',
            maxAge: 180000 // 3 minutes max age
        });
        
        this.managedIntervals.push(quantumParticleInterval);
    }

    phaseMinimal() {
        // Phase: Minimal

        // Reduce all effects to minimum
        try {
            const bgElement = document.querySelector('.bg');
            if (bgElement) {
                gsap.to(bgElement, {
                    opacity: 0.03,
                    scale: 3,  // CRITICAL: Keep at 3 to prevent edge reveal (was 2.2 - BUG!)
                    duration: 5,
                    ease: 'power2.inOut'
                });
            }
        } catch (e) {
            console.warn('[phaseMinimal] Error animating .bg:', e);
        }

        // Subtle breathing WITHOUT brightness reduction (prevents grey wash)
        try {
            const elements = document.querySelectorAll('.logo-text-wrapper, .image-wrapper, .text-3886');
            if (elements.length > 0) {
                gsap.to(elements, {
                    opacity: 0.9, // Use opacity instead of brightness to avoid grey
                    duration: 3,
                    yoyo: true,
                    repeat: 3,
                    ease: 'sine.inOut'
                });
            }
        } catch (e) {
            console.warn('[phaseMinimal] Error animating logo elements:', e);
        }
    }

    phaseChaotic() {
        // Phase: Chaotic

        // More controlled chaos
        const chaos = () => {
            // Subtle transforms
            const elements = document.querySelectorAll('.logo-text-wrapper, .image-wrapper, .text-3886');

            elements.forEach(el => {
                gsap.to(el, {
                    x: Math.random() * 4 - 2,  // Even smaller movement
                    y: Math.random() * 4 - 2,  // Even smaller movement
                    rotation: Math.random() * 2 - 1,  // Smaller rotation
                    scale: 0.995 + Math.random() * 0.01,  // Minimal scale change
                    duration: 0.4,
                    yoyo: true,
                    repeat: 1,
                    ease: 'sine.inOut'  // Smoother easing
                });
            });
        };

        // Fewer chaos bursts
        for (let i = 0; i < 8; i++) {  // Reduced from 20
            setTimeout(chaos, i * 300);  // Slower spacing
        }

        // Reset after chaos
        setTimeout(() => {
            gsap.to('.logo-text-wrapper, .image-wrapper, .text-3886', {
                x: 0,
                y: 0,
                rotation: 0,
                scale: 1,
                duration: 1.5,
                ease: 'power2.out'
            });
        }, 3000);
    }

    phaseRetro() {
        // Phase: Retro

        // Add CRT TV effect using managed element system
        const crt = safeCreateElement('div', 'effect', {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: '9996',
            background: `repeating-linear-gradient(
                0deg,
                rgba(0,0,0,0.1) 0px,
                transparent 2px,
                transparent 4px,
                rgba(0,0,0,0.1) 6px
            )`,
            animation: 'crtFlicker 4s infinite ease-in-out'
        });
        crt.style.animation = 'crtFlicker 4s infinite ease-in-out';
        document.body.appendChild(crt);

        // Add style for CRT flicker
        const style = document.createElement('style');
        style.textContent = `
            @keyframes crtFlicker {
                0%, 100% { opacity: 0.95; }
                50% { opacity: 0.98; }
            }
        `;
        document.head.appendChild(style);

        // Color distortion with safe transition
        this.safeApplyFilter(document.body, 'contrast(1.1) saturate(1.1)', 1.5);

        // Remove after phase
        setTimeout(() => {
            crt.remove();
            style.remove();
            this.safeApplyFilter(document.body, 'none', 1.5);
        }, 8000);
    }

    // New color-themed phases
    phaseVaporwave() {
        // Phase: Vaporwave
        window.dispatchEvent(new CustomEvent('animationPhase', { detail: { phase: 'vaporwave' } }));

        // Enable plasma for dreamy aesthetic atmosphere
        this.enablePlasmaEffect();

        // Apply vaporwave color filter safely
        this.safeApplyFilter(document.body, 'hue-rotate(45deg) saturate(1.2) contrast(0.95)', 2);

        // Subtle pink/purple overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg,
                rgba(255, 0, 128, 0.05),
                rgba(128, 0, 255, 0.05));
            pointer-events: none;
            z-index: 9995;
            opacity: 0;
        `;
        document.body.appendChild(overlay);

        gsap.to(overlay, {
            opacity: 0.3,
            duration: 2,
            ease: 'power2.inOut'
        });

        setTimeout(() => {
            gsap.to(overlay, {
                opacity: 0,
                duration: 1,
                onComplete: () => overlay.remove()
            });
            this.safeApplyFilter(document.body, 'none', 2);
            // Plasma will be disabled during next phase transition
        }, 10000);
    }

    phaseCyberpunk() {
        // Phase: Cyberpunk
        window.dispatchEvent(new CustomEvent('animationPhase', { detail: { phase: 'cyberpunk' } }));

        // Enable particles for digital rain effect
        this.enableParticleEffect();

        // Yellow/cyan color scheme safely
        this.safeApplyFilter(document.body, 'contrast(1.1) saturate(1.1)', 2);

        // Add cyberpunk grid overlay
        const grid = document.createElement('div');
        grid.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image:
                linear-gradient(rgba(255, 255, 0, 0.002) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 255, 255, 0.002) 1px, transparent 1px);
            background-size: 50px 50px;
            pointer-events: none;
            z-index: 9994;
            opacity: 0;
        `;
        document.body.appendChild(grid);

        gsap.to(grid, {
            opacity: 0.02,  // Ultra minimal visibility
            duration: 2
        });

        setTimeout(() => {
            gsap.to(grid, {
                opacity: 0,
                duration: 1,
                onComplete: () => grid.remove()
            });
            this.safeApplyFilter(document.body, 'none', 2);
            // Particles will be disabled during next phase transition
        }, 10000);
    }

    phaseNeon() {
        // Phase: Neon
        window.dispatchEvent(new CustomEvent('animationPhase', { detail: { phase: 'neon' } }));

        // Bright neon colors safely
        this.safeApplyFilter(document.body, 'brightness(1.1) saturate(1.5) contrast(1.1)', 2);

        // Neon glow pulses
        const neonPulse = document.createElement('div');
        neonPulse.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9993;
            box-shadow:
                inset 0 0 100px rgba(0, 255, 255, 0.2),
                inset 0 0 200px rgba(255, 0, 255, 0.1);
            opacity: 0;
        `;
        document.body.appendChild(neonPulse);

        gsap.to(neonPulse, {
            opacity: 0.5,
            duration: 2,
            yoyo: true,
            repeat: 4,
            ease: 'sine.inOut'
        });

        setTimeout(() => {
            neonPulse.remove();
            this.safeApplyFilter(document.body, 'none', 2);
        }, 10000);
    }

    phaseAurora() {
        // Phase: Aurora
        window.dispatchEvent(new CustomEvent('animationPhase', { detail: { phase: 'aurora' } }));

        // Enable particles for magical sparkle effect
        this.enableParticleEffect();

        // Northern lights gradient
        const aurora = document.createElement('div');
        aurora.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                0deg,
                transparent 60%,
                rgba(0, 255, 133, 0.1) 70%,
                rgba(0, 133, 255, 0.1) 80%,
                rgba(133, 0, 255, 0.1) 90%,
                transparent 100%
            );
            pointer-events: none;
            z-index: 9992;
            opacity: 0;
            transform: translateY(-100%);
        `;
        document.body.appendChild(aurora);

        gsap.timeline()
            .to(aurora, {
                y: '0%',
                opacity: 0.6,
                duration: 3,
                ease: 'power2.inOut'
            })
            .to(aurora, {
                backgroundPosition: '0 100%',
                duration: 8,
                ease: 'sine.inOut'
            })
            .to(aurora, {
                y: '100%',
                opacity: 0,
                duration: 3,
                onComplete: () => {
                    aurora.remove();
                    // Particles will be disabled during next phase transition
                }
            });
    }

    ensureBlackoutOverlay() {
        if (this.blackoutEl && document.body.contains(this.blackoutEl)) return;
        const el = document.createElement('div');
        el.id = 'viz-blackout';
        el.style.position = 'fixed';
        el.style.left = '0';
        el.style.top = '0';
        el.style.width = '100vw';
        el.style.height = '100vh';
        el.style.background = '#000';
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        el.style.zIndex = '2147483647';
        el.style.transition = 'opacity 700ms cubic-bezier(0.4, 0, 0.2, 1)';
        document.body.appendChild(el);
        this.blackoutEl = el;
    }

    showBlackout(opacity = 1) {
        this.ensureBlackoutOverlay();
        this.blackoutEl.style.opacity = String(Math.max(0, Math.min(1, opacity)));
    }

    hideBlackout() {
        if (this.blackoutEl) this.blackoutEl.style.opacity = '0';
    }

    /**
     * Comprehensive cleanup method for force restart
     */
    cleanup() {
        console.log('🧹 CHAOS INIT: Comprehensive cleanup starting...');

        // Stop all phase animations immediately
        this.phaseRunning = false;

        // Clear all watchdog and monitoring intervals
        if (this.watchdogIntervalId) {
            clearInterval(this.watchdogIntervalId);
            this.watchdogIntervalId = null;
        }

        if (this.greyFlashPreventionId) {
            clearInterval(this.greyFlashPreventionId);
            this.greyFlashPreventionId = null;
        }

        // Kill all GSAP animations and clear all properties
        gsap.killTweensOf('*');
        gsap.globalTimeline.clear();

        // Reset all elements to their default state
        gsap.set('.logo-text, .text-3886, .logo-text-wrapper, .image-wrapper, .glow', {
            clearProps: 'all'
        });

        // Reset all flags and states
        this.isReady = false;
        this.animeStackLoaded = false;
        this.filterTransitionInProgress = false;

        // Clear performance history
        this.fpsHistory = [];
        this.fps = 120;
        this.lastFrameTime = performance.now();

        console.log('✅ CHAOS INIT: Comprehensive cleanup completed');
    }

    destroy() {
        console.log('💀 Destroying ChaosInitializer and all performance systems...');

        this.phaseRunning = false;
        
        // Destroy performance management systems
        if (this.performanceMonitor) {
            this.performanceMonitor.destroy();
        }
        
        // Clear watchdog interval
        if (this.watchdogIntervalId) {
            clearInterval(this.watchdogIntervalId);
            console.log('🗑️ Watchdog interval cleared');
        }
        
        // Clear grey flash prevention interval
        if (this.greyFlashPreventionId) {
            clearInterval(this.greyFlashPreventionId);
            console.log('🗑️ Grey flash prevention cleared');
        }
        
        // Clear all managed intervals if they exist
        if (this.managedIntervals && this.managedIntervals.length > 0) {
            this.managedIntervals.forEach(interval => {
                if (interval && interval.clear) {
                    interval.clear();
                }
            });
            this.managedIntervals = [];
        }
        
        // Clear localStorage polling interval
        if (window.chaosStoragePollingHandle) {
            if (typeof window.chaosStoragePollingHandle.clear === 'function') {
                window.chaosStoragePollingHandle.clear();
                console.log('🗑️ Chaos localStorage polling interval cleared');
            }
            window.chaosStoragePollingHandle = null;
        }
        
        // Emergency cleanup of all performance systems
        if (this.performanceElementManager) {
            this.performanceElementManager.emergencyCleanup();
        }
        
        if (this.gsapRegistry) {
            this.gsapRegistry.emergencyStop();
        }
        
        if (this.intervalManager) {
            this.intervalManager.emergencyStop();
        }
        
        // Destroy original systems
        if (chaosEngine.isInitialized) {
            chaosEngine.destroy();
        }
        
        if (textEffects && textEffects.destroy) {
            textEffects.destroy();
        }
        
        if (backgroundAnimator && backgroundAnimator.destroy) {
            backgroundAnimator.destroy();
        }
        
        if (randomAnimations && randomAnimations.destroy) {
            randomAnimations.destroy();
        }
        
        if (extendedAnimations && extendedAnimations.destroy) {
            extendedAnimations.destroy();
        }

        // Disconnect opacity observer
        if (this.opacityObserver) {
            this.opacityObserver.disconnect();
        }

        // Destroy Smart Preloader
        if (window.smartPreloader && typeof window.smartPreloader.destroy === 'function') {
            window.smartPreloader.destroy();
            console.log('✅ Smart Preloader destroyed');
        }
        
        // Enhanced element cleanup using performance selectors
        const elementsToRemove = [
            '.scanlines', '#cyber-grid', '#static-noise', '.data-streams', 
            '.holographic-shimmer', '.glitch-lines', '.chromatic-pulse', 
            '.energy-field', '.quantum-particles', '.perf-managed',
            '[data-perf-id]', '.matrix-overlay', '.vhs-overlay'
        ];
        
        elementsToRemove.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                if (el && el.parentNode) {
                    el.parentNode.removeChild(el);
                }
            });
        });
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        console.log('✅ ChaosInitializer destruction complete');
    }
    // New color phase implementations
    phaseSunset() {
        // Phase: Sunset
        window.dispatchEvent(new CustomEvent('animationPhase', { detail: { phase: 'sunset' } }));

        // Warm orange/pink gradient safely
        this.safeApplyFilter(document.body, 'hue-rotate(15deg) saturate(1.4) brightness(1.1) contrast(1.05)', 2.5);

        // Reset after duration
        setTimeout(() => {
            gsap.to(document.body, {
                filter: 'none',
                duration: 2,
                ease: 'power2.inOut'
            });
        }, 8000);
    }

    phaseOcean() {
        // Phase: Ocean
        window.dispatchEvent(new CustomEvent('animationPhase', { detail: { phase: 'ocean' } }));

        // Enable plasma effect for oceanic atmosphere
        this.enablePlasmaEffect();

        // Deep blue/teal theme safely
        this.safeApplyFilter(document.body, 'hue-rotate(-45deg) saturate(1.2) brightness(0.95)', 2.5);

        setTimeout(() => {
            gsap.to(document.body, {
                filter: 'none',
                duration: 2,
                ease: 'power2.inOut'
            });
            // Plasma will be disabled during next phase transition
        }, 8000);
    }

    phaseForest() {
        // Phase: Forest
        window.dispatchEvent(new CustomEvent('animationPhase', { detail: { phase: 'forest' } }));

        // Deep green nature theme safely
        this.safeApplyFilter(document.body, 'hue-rotate(60deg) saturate(1.1) brightness(0.98)', 2.5);

        setTimeout(() => {
            gsap.to(document.body, {
                filter: 'none',
                duration: 2,
                ease: 'power2.inOut'
            });
        }, 8000);
    }

    phaseFire() {
        // Phase: Fire
        window.dispatchEvent(new CustomEvent('animationPhase', { detail: { phase: 'fire' } }));

        // Intense red/orange safely
        this.safeApplyFilter(document.body, 'hue-rotate(25deg) saturate(1.5) brightness(1.05) contrast(1.1)', 2.5);

        setTimeout(() => {
            gsap.to(document.body, {
                filter: 'none',
                duration: 2,
                ease: 'power2.inOut'
            });
        }, 8000);
    }

    phaseIce() {
        // Phase: Ice
        window.dispatchEvent(new CustomEvent('animationPhase', { detail: { phase: 'ice' } }));

        // Cool blue/white safely
        this.safeApplyFilter(document.body, 'hue-rotate(-30deg) saturate(1.2) brightness(1.05) contrast(1.02)', 2.5);

        setTimeout(() => {
            gsap.to(document.body, {
                filter: 'none',
                duration: 2,
                ease: 'power2.inOut'
            });
        }, 8000);
    }

    phaseGalaxy() {
        // Phase: Galaxy
        window.dispatchEvent(new CustomEvent('animationPhase', { detail: { phase: 'galaxy' } }));

        // Enable particles for cosmic star field effect
        this.enableParticleEffect();
        // Enable plasma for nebula-like atmosphere
        this.enablePlasmaEffect();

        // Deep purple/violet cosmic theme safely
        this.safeApplyFilter(document.body, 'hue-rotate(90deg) saturate(1.3) brightness(0.95) contrast(1.1)', 2.5);

        setTimeout(() => {
            gsap.to(document.body, {
                filter: 'none',
                duration: 2,
                ease: 'power2.inOut'
            });
            // Particles and plasma will be disabled during next phase transition
        }, 8000);
    }

    addSubtleColorVariations() {
        // Kill any existing color variation animations first to prevent stacking
        // Guard against null/undefined targets to avoid GSAP errors
        const safeKill = (selector, props) => {
            try {
                if (!selector) return;
                const hasTargets = typeof selector === 'string'
                    ? document.querySelector(selector) !== null
                    : !!selector;
                if (!hasTargets) return;
                gsap.killTweensOf(selector, props);
            } catch (_) {
                // Swallow to avoid breaking init on missing nodes
            }
        };

        safeKill('.logo-text, .text-3886', 'filter');
        safeKill('.glow', 'filter');
        safeKill('#cyber-grid', 'filter');

        // Resolve targets once to avoid race conditions and null conversions
        const textNodes = document.querySelectorAll('.logo-text, .text-3886');
        const glowNodes = document.querySelectorAll('.glow');
        const gridNodes = document.querySelectorAll('#cyber-grid');

        // Reset filter to base state before starting animations (only if targets exist)
        if (textNodes && textNodes.length) {
            try {
                gsap.set(textNodes, {
                    filter: 'none',
                    clearProps: 'filter'
                });
            } catch (_) {}
        }

        // Preserve ZIKADA text original green colors - NO hue rotation
        if (textNodes && textNodes.length) {
            const textColorTimeline = gsap.timeline({ repeat: -1 });
            textColorTimeline
                .to(textNodes, {
                filter: 'brightness(100%) saturate(100%) contrast(100%)',
                duration: 0
            })
            .to(textNodes, {
                filter: 'brightness(105%) saturate(110%) contrast(105%)',  // Slight enhancement only
                duration: 18,
                ease: 'sine.inOut'
            })
            .to(textNodes, {
                filter: 'brightness(98%) saturate(105%) contrast(102%)',   // Subtle dimming
                duration: 15,
                ease: 'sine.inOut'
            })
            .to(textNodes, {
                filter: 'brightness(102%) saturate(108%) contrast(103%)',  // Back to enhanced
                duration: 12,
                ease: 'sine.inOut'
            })
            .to(textNodes, {
                filter: 'brightness(100%) saturate(100%) contrast(100%)',
                duration: 10,
                ease: 'sine.inOut'
            });
        }

        // Very subtle color pulse for cicada logo
        if (glowNodes && glowNodes.length) {
            gsap.to(glowNodes, {
            filter: 'hue-rotate(12deg) saturate(115%) brightness(105%)',
            duration: 12,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
            });
        }

        // Subtle color shift for grid
        if (gridNodes && gridNodes.length) {
            gsap.to(gridNodes, {
            filter: 'hue-rotate(20deg)',
            duration: 20,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
            });
        }
    }
}

// Auto-initialize
console.log('🚀 chaos-init.js module loaded');
const chaosInit = new ChaosInitializer();

// Make chaosInit globally accessible for VJ control
window.chaosInit = chaosInit;

// Add immediate console output
console.log('🎬 Starting chaos initialization...');
chaosInit.init();

// Export for external control
window.ChaosControl = {
    setPerformance: (mode) => chaosInit.setPerformanceMode(mode),
    getFPS: () => chaosInit.fps,
    destroy: () => chaosInit.destroy(),
    restart: () => {
        chaosInit.destroy();
        setTimeout(() => chaosInit.init(), 100);
    },
    // Add test function for matrix messages
    testMatrix: () => {
        console.log('Testing matrix message...');
        matrixMessages.testMessage();
    },

    // Lottie animation controls
    lottie: {
        play: (name) => {
            if (window.lottieAnimations) {
                window.lottieAnimations.play(name);
            }
        },
        pause: (name) => {
            if (window.lottieAnimations) {
                window.lottieAnimations.pause(name);
            }
        },
        triggerSun: () => {
            if (window.lottieAnimations) {
                window.lottieAnimations.playSunReveal();
            }
        },
        cosmicBurst: () => {
            if (window.lottieAnimations) {
                window.lottieAnimations.triggerCosmicBurst();
            }
        },
        status: () => {
            if (window.lottieAnimations) {
                console.log('🌟 Lottie Animations Status:', {
                    initialized: window.lottieAnimations.isInitialized,
                    animations: Object.keys(window.lottieAnimations.animations).map(key => ({
                        name: key,
                        loaded: !!window.lottieAnimations.animations[key]
                    }))
                });
            }
        }
    }
};

console.log('✅ ChaosControl attached to window');

// Listen for control panel messages (strobe triggers)
window.addEventListener('storage', (e) => {
    if (e.key === '3886_vj_message') {
        try {
            const message = JSON.parse(e.newValue);
            if (message.type === 'trigger_effect' && message.effect === 'strobe') {
                console.log('🔴 Strobe trigger received from control panel');
                if (window.animeEnhancedEffects && typeof window.animeEnhancedEffects.createStrobeCircles === 'function') {
                    if (window.animeEnhancedEffects.activeStrobeCircles) {
                        window.animeEnhancedEffects.removeStrobeCircles();
                        console.log('🔴 Strobe circles disabled');
                    } else {
                        window.animeEnhancedEffects.createStrobeCircles();
                        console.log('🟢 Strobe circles enabled');
                    }
                }
            }
        } catch (err) {
            // Ignore JSON parse errors
        }
    }
});

// Also poll localStorage for same-tab communication (using interval-manager)
let lastStrobeMessageId = null;
let chaosStoragePollingHandle = null;

// Use dynamic import to avoid circular dependencies
import('./interval-manager.js').then(module => {
    const intervalManager = module.default;
    
    chaosStoragePollingHandle = intervalManager.createInterval(() => {
        const messageData = localStorage.getItem('3886_vj_message');
        if (messageData) {
            try {
                const parsed = JSON.parse(messageData);
                if (parsed._id && parsed._id !== lastStrobeMessageId) {
                    lastStrobeMessageId = parsed._id;
                    if (parsed.type === 'trigger_effect' && parsed.effect === 'strobe') {
                        console.log('🔴 Strobe trigger received from control panel (polling)');
                        if (window.animeEnhancedEffects && typeof window.animeEnhancedEffects.createStrobeCircles === 'function') {
                            if (window.animeEnhancedEffects.activeStrobeCircles) {
                                window.animeEnhancedEffects.removeStrobeCircles();
                                console.log('🔴 Strobe circles disabled');
                            } else {
                                window.animeEnhancedEffects.createStrobeCircles();
                                console.log('🟢 Strobe circles enabled');
                            }
                        }
                    }
                }
            } catch (e) {
                // Ignore JSON parse errors
            }
        }
    }, 200, 'chaos-localStorage-poll', {
        category: 'system',
        maxAge: Infinity // Keep running until explicitly cleared
    });
    
    // Store handle globally for cleanup
    window.chaosStoragePollingHandle = chaosStoragePollingHandle;
}).catch(err => {
    console.warn('Failed to load interval-manager for chaos localStorage polling, falling back to raw setInterval:', err);
    // Fallback to raw interval
    setInterval(() => {
        const messageData = localStorage.getItem('3886_vj_message');
        if (messageData) {
            try {
                const parsed = JSON.parse(messageData);
                if (parsed._id && parsed._id !== lastStrobeMessageId) {
                    lastStrobeMessageId = parsed._id;
                    if (parsed.type === 'trigger_effect' && parsed.effect === 'strobe') {
                        console.log('🔴 Strobe trigger received from control panel (polling)');
                        if (window.animeEnhancedEffects && typeof window.animeEnhancedEffects.createStrobeCircles === 'function') {
                            if (window.animeEnhancedEffects.activeStrobeCircles) {
                                window.animeEnhancedEffects.removeStrobeCircles();
                                console.log('🔴 Strobe circles disabled');
                            } else {
                                window.animeEnhancedEffects.createStrobeCircles();
                                console.log('🟢 Strobe circles enabled');
                            }
                        }
                    }
                }
            } catch (e) {
                // Ignore JSON parse errors
            }
        }
    }, 200);
});

// HMR teardown safety for dev
if (import.meta && import.meta.hot) {
    import.meta.hot.dispose(() => {
        try { if (window.chaosEngine && typeof window.chaosEngine.destroy === 'function') window.chaosEngine.destroy(); } catch (_) {}
        try { if (window.WEBGL_RESOURCE_MANAGER && typeof window.WEBGL_RESOURCE_MANAGER.dispose === 'function') window.WEBGL_RESOURCE_MANAGER.dispose(); } catch (_) {}
        try { teardownAll(); } catch (_) {}
    });
    import.meta.hot.accept();
}
