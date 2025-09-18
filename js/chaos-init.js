import chaosEngine from './chaos-engine.js';
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
import gsap from 'gsap';

// Ensure GSAP is globally available
if (typeof window !== 'undefined' && !window.gsap) {
    window.gsap = gsap;
}

// Performance Management Imports
import performanceElementManager from './performance-element-manager.js';
import intervalManager from './interval-manager.js';
import gsapAnimationRegistry from './gsap-animation-registry.js';
import performanceMonitor from './performance-monitor.js';

class ChaosInitializer {
    constructor() {
        this.isReady = false;
        this.performanceMode = 'auto';
        this.fps = 120;
        this.fpsHistory = [];
        this.lastFrameTime = performance.now();
        this.animeStackLoaded = false;
        this.animeStackPromise = null;
        this.animeEnableListener = null;
        
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
        
        console.log('🚀 ChaosInitializer created with performance management');

        this.setupAnimeIntegration();
    }

    setupAnimeIntegration() {
        if (typeof window === 'undefined') return;

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

        if (this.animeEnableListener) {
            window.removeEventListener('3886:enable-anime', this.animeEnableListener);
        }

        this.animeEnableListener = runAndReport;
        window.__loadAnimeStack__ = runAndReport;

        if (this.isAnimeFeatureEnabled()) {
            runAndReport();
            return;
        }

        window.addEventListener('3886:enable-anime', runAndReport, { once: true });
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
                await import('./anime-svg-logo.js');
                await import('./anime-enhanced-effects.js');
                console.log('🎬 Anime.js stack loaded successfully with enhanced effects');
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
     * Safe filter application to prevent grey screens with atomic replacement
     */
    safeApplyFilter(target, filterValue, duration = 2) {
        if (target === document.body) {
            // ATOMIC REPLACEMENT: Kill and immediately apply without gap
            gsap.killTweensOf(document.body, 'filter');
            
            // Immediately set a safe intermediate filter to prevent grey flash
            const safeFilter = this.validateFilter(filterValue);
            
            // Set intermediate safe state immediately (prevents gap)
            const currentFilter = window.getComputedStyle(document.body).filter;
            if (currentFilter !== 'none' && currentFilter !== safeFilter) {
                // Create safe intermediate filter (blend current with target)
                const intermediateFilter = this.createIntermediateFilter(currentFilter, safeFilter);
                gsap.set(document.body, { filter: intermediateFilter });
            }
            
            // Then apply final filter smoothly
            this.applyFilterNow(target, filterValue, duration);
        } else {
            this.applyFilterNow(target, filterValue, duration);
        }
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
        // Validate filter to prevent problematic values
        const safeFilter = this.validateFilter(filterValue);
        
        if (target === document.body) {
            this.filterTransitionInProgress = true;
            this.currentBodyFilter = safeFilter;
            console.log(`🎨 Applying safe filter: ${safeFilter}`);
            // Route through centralized filter manager for body
            filterManager.applyImmediate(safeFilter, duration);
            this.filterTransitionInProgress = false;
        } else {
            // Non-body targets still animate locally
            gsap.to(target, {
                filter: safeFilter,
                duration: duration,
                ease: 'power2.inOut'
            });
        }
    }

    /**
     * Validate and sanitize filter values to prevent grey screens
     */
    validateFilter(filterValue) {
        if (!filterValue || filterValue === 'none') return 'none';
        
        // Fix problematic filter values aggressively
        let safeFilter = filterValue;
        
        // Ensure brightness NEVER goes below 0.95 (very conservative to prevent any grey)
        safeFilter = safeFilter.replace(/brightness\(0\.[0-9][0-4]?\)/g, 'brightness(0.95)');
        safeFilter = safeFilter.replace(/brightness\(0\.8\d*\)/g, 'brightness(0.95)');
        safeFilter = safeFilter.replace(/brightness\(0\.9[0-4]\)/g, 'brightness(0.95)');
        
        // Ensure saturation NEVER goes below 0.9 (prevents any desaturation grey)
        safeFilter = safeFilter.replace(/saturate\(0(\.\d+)?\)/g, 'saturate(0.9)');
        safeFilter = safeFilter.replace(/saturate\(0\.[0-8]\d*\)/g, 'saturate(0.9)');
        
        // Remove ALL sepia and grayscale filters (major grey causers)
        safeFilter = safeFilter.replace(/sepia\([^)]*\)/g, '');
        safeFilter = safeFilter.replace(/grayscale\([^)]*\)/g, '');
        
        // Ensure contrast doesn't go too low (can cause washed out grey look)
        safeFilter = safeFilter.replace(/contrast\(0\.[0-7]\d*\)/g, 'contrast(0.8)');
        
        // Clean up multiple spaces and empty parentheses
        safeFilter = safeFilter.replace(/\s+/g, ' ').replace(/\(\s*\)/g, '').trim();
        
        // Final safety check - if filter looks problematic, return 'none'
        if (safeFilter.includes('brightness(0.') && !safeFilter.includes('brightness(0.9')) {
            console.warn('⚠️ Rejecting potentially problematic filter, using none instead:', filterValue);
            return 'none';
        }
        
        return safeFilter;
    }

    /**
     * Start grey flash prevention system - real-time monitoring
     */
    startGreyFlashPrevention() {
        // Monitor document.body filter changes in real-time
        const greyFlashPreventionId = setInterval(() => {
            const bodyStyle = window.getComputedStyle(document.body);
            const currentFilter = bodyStyle.filter;
            
            // Check for problematic filter values that cause grey
            if (currentFilter && currentFilter !== 'none') {
                let needsFix = false;
                let fixReason = '';
                
                // Check for grey-causing conditions
                if (currentFilter.includes('saturate(0') || currentFilter.includes('saturate(0.')) {
                    const satMatch = currentFilter.match(/saturate\((0\.?\d*)\)/);
                    if (satMatch && parseFloat(satMatch[1]) < 0.9) {
                        needsFix = true;
                        fixReason = 'low saturation';
                    }
                }
                
                if (currentFilter.includes('brightness(0.')) {
                    const brightMatch = currentFilter.match(/brightness\((0\.\d+)\)/);
                    if (brightMatch && parseFloat(brightMatch[1]) < 0.95) {
                        needsFix = true;
                        fixReason = 'low brightness';
                    }
                }
                
                if (currentFilter.includes('sepia') || currentFilter.includes('grayscale')) {
                    needsFix = true;
                    fixReason = 'sepia/grayscale';
                }
                
                // Apply immediate fix if needed
                if (needsFix) {
                    console.warn(`🚨 GREY FLASH DETECTED - Immediate correction: ${fixReason} in filter: ${currentFilter}`);
                    
                    // FORCE immediate safe filter (no transition to prevent flash)
                    gsap.set(document.body, { 
                        filter: 'brightness(1) contrast(1) saturate(1) hue-rotate(0deg)' 
                    });
                    
                    // Kill any problematic ongoing animations on body
                    gsap.killTweensOf(document.body, 'filter');
                    
                    // Brief pause then apply corrected filter
                    setTimeout(() => {
                        const correctedFilter = this.validateFilter(currentFilter);
                        if (correctedFilter !== 'none') {
                            gsap.to(document.body, { 
                                filter: correctedFilter, 
                                duration: 0.5, 
                                ease: 'power2.inOut' 
                            });
                        }
                    }, 100);
                }
            }
        }, 100); // Check every 100ms for real-time protection
        
        // Store interval ID for cleanup
        this.greyFlashPreventionId = greyFlashPreventionId;
        
        console.log('🛡️ Grey flash prevention system started');
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
        console.log('🌀 ZIKADA 3886 CHAOS ENGINE INITIALIZING...');

        // Initialize timing controller first for coordination
        timingController.init();

        // Initialize intro animations first for reveal effect
        introAnimations.init();

        // Initialize beehive background for subtle effect
        beehiveBackground.init();

        // Initialize subsystems
        this.initPerformanceMonitor();
        this.initPerformanceManager(); // Initialize performance monitoring first
        this.initBackgroundAnimator();
        this.initLogoAnimator();  // Initialize logo animator early
        this.initChaosEngine();
        this.initTextEffects();
        this.initAdditionalEffects();
        // RE-ENABLED: Random animations (CSS blur will fix rectangular elements)
        this.initRandomAnimations();
        this.handleResize();

        // Listen for animation phase changes
        window.addEventListener('animationPhase', (e) => this.handlePhaseChange(e.detail.phase));

        // Start the chaos
        this.isReady = true;
        console.log('⚡ CHAOS ENGINE ONLINE');

        // Skip startup sequence - removed status texts
        // this.runStartupSequence();
        // Create global blackout overlay to ensure full coverage for fades/blackouts
        this.ensureBlackoutOverlay();

        // Start animation phases directly
        setTimeout(() => {
            console.log('🚀 Starting animation phases...');
            this.startAnimationPhases();
        }, 2000);

        // Start animation watchdog to ensure animations never stop
        this.startAnimationWatchdog();

        // DISABLED: Grey flash prevention was causing performance catastrophe
        // this.startGreyFlashPrevention();
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
            textEffects.init();
            textEffects.addDataCorruption();
            matrixMessages.init();
            subtleEffects.init();
        } catch (error) {
            console.error('Failed to initialize Text Effects:', error);
        }
    }

    initRandomAnimations() {
        try {
            // RE-ENABLED: Rectangular elements will be blurred by CSS
            randomAnimations.init();
            extendedAnimations.init();
            console.log('🎲 Random animations initialized (rectangular elements blurred via CSS)');
            console.log('🎬 Extended animations initialized (rectangular elements blurred via CSS)');

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

    addScanlines() {
        let scanlines;
        
        // Use performance manager if available, otherwise create normally
        if (this.performanceElementManager) {
            scanlines = this.performanceElementManager.createElement('div', 'effect', {
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
        } else {
            // Fallback to direct creation
            scanlines = document.createElement('div');
            scanlines.className = 'scanlines';
            scanlines.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 9997;
                background: repeating-linear-gradient(
                    0deg,
                    rgba(0, 0, 0, 0.01) 0px,
                    transparent 1px,
                    transparent 2px,
                    rgba(0, 0, 0, 0.01) 3px
                );
                opacity: 0.001;
                mix-blend-mode: multiply;
            `;
            document.body.appendChild(scanlines);
        }
        
        scanlines.className = 'scanlines';

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
        const gridCanvas = this.performanceElementManager.createElement('canvas', 'background', {
            position: 'fixed',
            bottom: '0',
            left: '0',
            width: '100%',
            height: '40%',
            pointerEvents: 'none',
            zIndex: '-1',
            opacity: '0.002'
        });
        gridCanvas.id = 'cyber-grid';

        const ctx = gridCanvas.getContext('2d');
        gridCanvas.width = window.innerWidth;
        gridCanvas.height = window.innerHeight * 0.4;

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

            .glow {
                animation: glowPulse 2s infinite;
            }

            @keyframes glowPulse {
                0%, 100% {
                    opacity: 0.5;
                    transform: scale(1);
                }
                50% {
                    opacity: 1;
                    transform: scale(1.02);  /* Reduced from 1.1 */
                }
            }
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
                gridCanvas.height = window.innerHeight * 0.3;
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

        const animateStatic = () => {
            // Check if canvas still exists (safety check)
            if (!document.getElementById('static-noise')) {
                console.warn('⚠️ Static noise canvas was removed, recreating...');
                // Recreate if somehow removed
                if (window.chaosInitializer && typeof window.chaosInitializer.addStaticNoise === 'function') {
                    window.chaosInitializer.addStaticNoise();
                }
                return;
            }
            
            const imageData = ctx.createImageData(256, 256);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const value = Math.random() * 255;
                data[i] = value;
                data[i + 1] = value;
                data[i + 2] = value;
                data[i + 3] = 255;
            }

            ctx.putImageData(imageData, 0, 0);
            setTimeout(animateStatic, 50);
        };

        animateStatic();
        console.log('✅ Static noise canvas created (outside performance manager to prevent cleanup)');
    }

    addDataStreams() {
        const container = this.performanceElementManager.createElement('div', 'stream', {
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

        // Create vertical data streams with managed elements
        for (let i = 0; i < 3; i++) { // Reduced from 5 to 3
            const stream = this.performanceElementManager.createElement('div', 'stream', {
                position: 'absolute',
                left: `${Math.random() * 100}%`,
                top: '-100px',
                width: '2px',
                height: `${Math.random() * 200 + 100}px`,
                background: 'linear-gradient(transparent, #00ff85, transparent)',
                opacity: `${Math.random() * 0.3 + 0.1}`
            }, { autoAppend: false });
            container.appendChild(stream);

            this.gsapRegistry.createAnimation('to', stream, {
                y: window.innerHeight + 200,
                duration: Math.random() * 10 + 5,
                repeat: -1,
                ease: 'linear',
                delay: Math.random() * 5
            }, `data-stream-${i}`, 'stream');
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

    startAnimationPhases() {
        // Prevent duplicate phase runners
        if (this.phaseRunning) {
            console.log('⚠️ Phase animations already running');
            return;
        }

        // Create a more dynamic, randomized animation sequence
        const phases = [
            () => this.phaseIntense(),
            () => this.phaseCalm(),
            () => this.phaseGlitch(),
            () => this.phaseTechno(),
            () => this.phaseMatrix(),
            () => this.phaseMinimal(),
            () => this.phaseChaotic(),
            () => this.phaseRetro(),
            // Color-themed phases
            () => this.phaseVaporwave(),
            () => this.phaseCyberpunk(),
            () => this.phaseNeon(),
            () => this.phaseAurora(),
            // New additional color phases
            () => this.phaseSunset(),
            () => this.phaseOcean(),
            () => this.phaseForest(),
            () => this.phaseFire(),
            () => this.phaseIce(),
            () => this.phaseGalaxy()
        ];

        let lastPhase = null;
        this.phaseRunning = true;
        this.currentPhase = null;

        const runRandomPhase = () => {
            if (!this.phaseRunning) {
                // Restart if stopped
                this.phaseRunning = true;
            }

            // Pick a random phase that isn't the last one
            let availablePhases = phases.filter(p => p !== lastPhase);
            const randomPhase = availablePhases[Math.floor(Math.random() * availablePhases.length)];
            lastPhase = randomPhase;

            // Smooth transition with overlap
            if (this.currentPhase) {
                this.transitionOut();
                // Delay new phase slightly for overlap
                setTimeout(() => {
                    randomPhase();
                }, 500);
            } else {
                randomPhase();
            }
            this.currentPhase = randomPhase.name;

            // Random duration between 30-60 seconds (increased from 15-40)
            const nextDelay = Math.random() * 30000 + 30000;
            setTimeout(runRandomPhase, nextDelay);
        };

        runRandomPhase();
    }

    transitionOut() {
        // SIMPLIFIED: No filter reset during transitions to prevent grey flashes
        // Let new phase handle its own filter without resetting first
        
        // Only clean up overlays (no filter manipulation)
        this.cleanupPhaseElements();
        
        console.log('🔄 Phase transition - overlay cleanup only (no filter reset)');
    }

    cleanupPhaseElements() {
        // Clean up any lingering elements from previous phases
        const temporaryElements = document.querySelectorAll('.vhs-overlay, .flash-overlay, .warp-effect, .phase-overlay, .glitch-overlay, div[style*="z-index: 999"]');
        temporaryElements.forEach(el => {
            // Skip essential elements
            if (el.classList.contains('matrix-messages') || el.classList.contains('matrix-blackout')) {
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

            if (extendedAnimations && !extendedAnimations.isRunning) {
                console.log('🔧 Restarting stopped extended animations...');
                extendedAnimations.isRunning = true;
                // Don't force trigger immediately
            }

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

            if (verbose) {
                console.log('🔍 Watchdog check completed - performance preserved');
            }
        }, 30000); // Simple 30-second interval

        // Store interval ID for cleanup
        this.watchdogIntervalId = watchdogIntervalId;
    }

    phaseIntense() {
        // Phase: Intense
        // Dispatch event for logo reaction
        window.dispatchEvent(new CustomEvent('animationPhase', { detail: { phase: 'intense' } }));

        // Gentle rotation increase
        gsap.to('.bg', {
            rotationZ: '+=90',  // Reduced from 180
            duration: 8,  // Slower
            ease: 'power2.inOut'
        });

        // Subtle particle effects
        if (window.chaosEngine && window.chaosEngine.particles) {
            gsap.to(window.chaosEngine.particles.material, {
                opacity: 0.6,  // Reduced from 0.9
                size: 0.8,  // Reduced from 1
                duration: 3
            });
        }

        // Very subtle vibration instead of shake
        gsap.to(document.body, {
            x: 1,
            y: 1,
            duration: 0.5,  // Slower for smoothness
            yoyo: true,
            repeat: 10,
            ease: 'sine.inOut'
        });
    }

    phaseCalm() {
        // Phase: Calm

        // Slow everything down
        gsap.to('.bg', {
            rotationZ: '+=30',
            duration: 15,
            ease: 'sine.inOut'
        });

        // Reduce effects
        if (window.chaosEngine && window.chaosEngine.particles) {
            gsap.to(window.chaosEngine.particles.material, {
                opacity: 0.3,
                size: 0.3,
                duration: 5
            });
        }

        // Add subtle breathing effect to main elements
        gsap.to('.logo-text-wrapper, .image-wrapper', {
            scale: 1.02,  // Reduced from 1.05
            duration: 4,
            yoyo: true,
            repeat: 2,
            ease: 'sine.inOut'
        });
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
        gsap.to('.logo-text-wrapper, .image-wrapper, .text-3886', {
            scale: 1.02,  // Even more subtle
            duration: 2,  // Much slower for smooth flow
            repeat: 10,
            yoyo: true,
            ease: 'sine.inOut'  // Smoother easing
        });
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
            const glitchBurst = this.performanceElementManager.createElement('div', 'effect');
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
                onComplete: () => this.performanceElementManager.removeElement(glitchBurst)
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
            const artifact = this.performanceElementManager.createElement('div', 'artifact');
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
                    onComplete: () => this.performanceElementManager.removeElement(artifact)
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
                    onComplete: () => this.performanceElementManager.removeElement(artifact)
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
                    onComplete: () => this.performanceElementManager.removeElement(artifact)
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
            const wave = this.performanceElementManager.createElement('div', 'effect');
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
                onComplete: () => this.performanceElementManager.removeElement(wave)
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
            const particle = this.performanceElementManager.createElement('div', 'particle');
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
        gsap.to('.bg', {
            opacity: 0.03,
            scale: 2.2,  // Reduced from 2.5
            duration: 5,
            ease: 'power2.inOut'
        });

        // Subtle breathing WITHOUT brightness reduction (prevents grey wash)
        gsap.to('.logo-text-wrapper, .image-wrapper, .text-3886', {
            opacity: 0.9, // Use opacity instead of brightness to avoid grey
            duration: 3,
            yoyo: true,
            repeat: 3,
            ease: 'sine.inOut'
        });
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
        let crt;
        if (this.performanceElementManager) {
            crt = this.performanceElementManager.createElement('div', 'effect', {
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
        } else {
            crt = document.createElement('div');
            crt.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 9996;
                background: repeating-linear-gradient(
                    0deg,
                    rgba(0,0,0,0.1) 0px,
                    transparent 2px,
                    transparent 4px,
                    rgba(0,0,0,0.1) 6px
                );
                animation: crtFlicker 4s infinite ease-in-out;
            `;
            document.body.appendChild(crt);
        }

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
        }, 10000);
    }

    phaseCyberpunk() {
        // Phase: Cyberpunk
        window.dispatchEvent(new CustomEvent('animationPhase', { detail: { phase: 'cyberpunk' } }));

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
                onComplete: () => aurora.remove()
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
        el.style.transition = 'opacity 180ms linear';
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

        // Deep blue/teal theme safely
        this.safeApplyFilter(document.body, 'hue-rotate(-45deg) saturate(1.2) brightness(0.95)', 2.5);

        setTimeout(() => {
            gsap.to(document.body, {
                filter: 'none',
                duration: 2,
                ease: 'power2.inOut'
            });
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

        // Deep purple/violet cosmic theme safely
        this.safeApplyFilter(document.body, 'hue-rotate(90deg) saturate(1.3) brightness(0.95) contrast(1.1)', 2.5);

        setTimeout(() => {
            gsap.to(document.body, {
                filter: 'none',
                duration: 2,
                ease: 'power2.inOut'
            });
        }, 8000);
    }

    addSubtleColorVariations() {
        // Kill any existing color variation animations first to prevent stacking
        gsap.killTweensOf('.logo-text, .text-3886', 'filter');
        gsap.killTweensOf('.glow', 'filter');
        gsap.killTweensOf('#cyber-grid', 'filter');

        // Reset filter to base state before starting animations
        gsap.set('.logo-text, .text-3886', {
            filter: 'none',
            clearProps: 'filter'
        });

        // Subtle color shifts for text elements
        const textColorTimeline = gsap.timeline({ repeat: -1 });
        textColorTimeline
            .to('.logo-text, .text-3886', {
                filter: 'hue-rotate(0deg) brightness(100%)',
                duration: 0
            })
            .to('.logo-text, .text-3886', {
                filter: 'hue-rotate(5deg) brightness(103%)',  // Slight warm shift
                duration: 18,
                ease: 'sine.inOut'
            })
            .to('.logo-text, .text-3886', {
                filter: 'hue-rotate(-6deg) brightness(101%)',  // Cool shift
                duration: 15,
                ease: 'sine.inOut'
            })
            .to('.logo-text, .text-3886', {
                filter: 'hue-rotate(3deg) brightness(102%)',   // Back to warm
                duration: 12,
                ease: 'sine.inOut'
            })
            .to('.logo-text, .text-3886', {
                filter: 'hue-rotate(0deg) brightness(100%)',
                duration: 10,
                ease: 'sine.inOut'
            });

        // Very subtle color pulse for cicada logo
        gsap.to('.glow', {
            filter: 'hue-rotate(12deg) saturate(115%) brightness(105%)',
            duration: 12,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });

        // Subtle color shift for grid
        gsap.to('#cyber-grid', {
            filter: 'hue-rotate(20deg)',
            duration: 20,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
        });
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