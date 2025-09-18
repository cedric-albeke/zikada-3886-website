// Balanced Fix - Restore functionality while maintaining performance
console.log('🔧 BALANCED FIX LOADING...');

// 1. RESTORE ESSENTIAL MODULES (but with limits)
function restoreEssentialModules() {
    console.log('🔄 Restoring essential modules...');

    // Re-enable key modules with performance limits
    const modulesToRestore = ['textEffects', 'centerpieceLogo', 'backgroundAnimator'];

    modulesToRestore.forEach(moduleName => {
        if (window[moduleName] && window[moduleName].init) {
            try {
                // Create a limited version of init
                const originalInit = window[moduleName].init;
                window[moduleName].init = function() {
                    console.log(`✅ Restoring ${moduleName} with limits`);

                    // Set performance mode to low before init
                    if (this.setPerformanceMode) {
                        this.setPerformanceMode('low');
                    }

                    return originalInit.call(this);
                };

                // Call the limited init
                window[moduleName].init();
            } catch (e) {
                console.warn(`⚠️ Failed to restore ${moduleName}:`, e.message);
            }
        }
    });
}

// 2. SMART ANIMATION THROTTLING (less aggressive)
function setupSmartThrottling() {
    if (!window.gsap) return;

    // Store original methods if not already stored
    if (!gsap._balanced_originals) {
        gsap._balanced_originals = {
            to: gsap.to,
            from: gsap.from,
            fromTo: gsap.fromTo,
            timeline: gsap.timeline
        };
    }

    const animationCounts = {
        to: 0,
        from: 0,
        fromTo: 0,
        timeline: 0
    };

    const resetCounts = () => {
        Object.keys(animationCounts).forEach(key => animationCounts[key] = 0);
    };

    // Reset counts every 2 seconds
    setInterval(resetCounts, 2000);

    const createThrottledMethod = (name, originalMethod, maxPerInterval = 5) => {
        return function(...args) {
            // Check current count
            if (animationCounts[name] >= maxPerInterval) {
                // Return a dummy object that won't break chains
                return {
                    to: () => this,
                    from: () => this,
                    fromTo: () => this,
                    then: () => this,
                    delay: () => this,
                    duration: () => this,
                    ease: () => this,
                    onComplete: () => this,
                    onUpdate: () => this,
                    play: () => this,
                    pause: () => this,
                    reverse: () => this,
                    kill: () => this
                };
            }

            animationCounts[name]++;

            // Check total active animations
            const totalActive = gsap.globalTimeline?.getChildren()?.length || 0;
            if (totalActive > 20) {
                // Kill oldest animations
                const children = gsap.globalTimeline.getChildren();
                if (children.length > 15) {
                    for (let i = 0; i < 5; i++) {
                        if (children[i]) children[i].kill();
                    }
                }
            }

            return originalMethod.apply(this, args);
        };
    };

    // Apply smart throttling
    gsap.to = createThrottledMethod('to', gsap._balanced_originals.to, 8);
    gsap.from = createThrottledMethod('from', gsap._balanced_originals.from, 4);
    gsap.fromTo = createThrottledMethod('fromTo', gsap._balanced_originals.fromTo, 4);
    gsap.timeline = createThrottledMethod('timeline', gsap._balanced_originals.timeline, 6);

    console.log('🎛️ Smart animation throttling enabled');
}

// 3. RESTORE SCENE SWITCHING
function restoreSceneSwitching() {
    if (window.vjReceiver) {
        // Create working scene switching
        window.vjReceiver.switchScene = function(sceneName) {
            console.log(`🎬 Switching to scene: ${sceneName}`);

            // Gentle cleanup before switching
            const activeAnims = gsap.globalTimeline?.getChildren() || [];
            if (activeAnims.length > 10) {
                // Kill only excess animations
                for (let i = 10; i < activeAnims.length; i++) {
                    activeAnims[i].kill();
                }
            }

            // Minimal DOM cleanup
            document.querySelectorAll('.temp-overlay').forEach(el => el.remove());

            // Apply scene (simplified)
            if (window.chaosEngine && window.chaosEngine.setScene) {
                window.chaosEngine.setScene(sceneName);
            }

            // Trigger appropriate effects for scene
            switch(sceneName) {
                case 'cosmic':
                    if (window.centerpieceLogo) window.centerpieceLogo.triggerSpecial?.();
                    break;
                case 'matrix':
                    if (window.textEffects) window.textEffects.scrambleAll?.();
                    break;
                case 'minimal':
                    // Stop non-essential animations
                    gsap.globalTimeline?.getChildren()?.slice(5)?.forEach(anim => anim.pause());
                    break;
            }

            console.log(`✅ Scene switched to: ${sceneName}`);
            return true;
        };
    }

    // Add global scene switching
    window.SWITCH_SCENE = function(sceneName) {
        if (window.vjReceiver?.switchScene) {
            return window.vjReceiver.switchScene(sceneName);
        } else {
            console.warn('Scene switching not available');
            return false;
        }
    };

    console.log('🎬 Scene switching restored');
}

// 4. RESTORE CONTROL SLIDERS
function restoreSliders() {
    if (window.vjReceiver) {
        window.vjReceiver.updateTempo = function(value) {
            console.log(`🎵 Tempo: ${value}`);

            const speed = Math.max(0.1, Math.min(2.0, value / 100));

            // Apply to timing controller
            if (window.timingController) {
                window.timingController.setGlobalSpeed(speed);
            }

            // Apply to active animations
            gsap.globalTimeline?.getChildren()?.forEach(anim => {
                if (anim.timeScale) {
                    anim.timeScale(speed);
                }
            });

            return true;
        };

        window.vjReceiver.updateFXIntensity = function(value) {
            console.log(`✨ FX Intensity: ${value}`);

            const intensity = value / 100;

            // Update animation budgets based on intensity
            const budgets = {
                critical: Math.max(2, Math.floor(5 * intensity)),
                effects: Math.max(1, Math.floor(8 * intensity)),
                background: Math.floor(4 * intensity),
                particles: Math.floor(3 * intensity)
            };

            if (window.performanceOptimizer?.setAnimationBudget) {
                window.performanceOptimizer.setAnimationBudget(budgets);
            }

            // Apply to visual effects
            if (intensity < 0.3) {
                // Low intensity - minimal effects
                document.querySelectorAll('.visual-effect').forEach(el => {
                    el.style.opacity = '0.1';
                });
            } else if (intensity < 0.7) {
                // Medium intensity
                document.querySelectorAll('.visual-effect').forEach(el => {
                    el.style.opacity = '0.5';
                });
            } else {
                // High intensity
                document.querySelectorAll('.visual-effect').forEach(el => {
                    el.style.opacity = '1.0';
                });
            }

            return true;
        };
    }

    // Add global control functions
    window.SET_TEMPO = function(value) {
        return window.vjReceiver?.updateTempo?.(value) || false;
    };

    window.SET_FX_INTENSITY = function(value) {
        return window.vjReceiver?.updateFXIntensity?.(value) || false;
    };

    console.log('🎛️ Control sliders restored');
}

// 5. PERFORMANCE MODE SWITCHING
function setupPerformanceModes() {
    window.SET_PERFORMANCE_MODE = function(mode) {
        console.log(`🎮 Setting performance mode: ${mode}`);

        const modes = {
            high: {
                budget: { critical: 8, effects: 12, background: 6, particles: 4 },
                quality: 'high',
                animationSpeed: 1.0
            },
            normal: {
                budget: { critical: 5, effects: 8, background: 4, particles: 3 },
                quality: 'normal',
                animationSpeed: 1.0
            },
            low: {
                budget: { critical: 3, effects: 4, background: 2, particles: 1 },
                quality: 'low',
                animationSpeed: 0.8
            },
            minimal: {
                budget: { critical: 2, effects: 1, background: 0, particles: 0 },
                quality: 'minimal',
                animationSpeed: 0.5
            }
        };

        const config = modes[mode] || modes.normal;

        // Apply animation budget
        if (window.performanceOptimizer?.setAnimationBudget) {
            window.performanceOptimizer.setAnimationBudget(config.budget);
        }

        // Set global animation speed
        if (window.timingController) {
            window.timingController.setGlobalSpeed(config.animationSpeed);
        }

        // Update performance systems
        if (window.performanceOptimizer) {
            window.performanceOptimizer.performanceMode = mode;
            window.performanceOptimizer.emergencyMode = (mode === 'minimal');
        }

        // Apply visual quality settings
        if (config.quality === 'low' || config.quality === 'minimal') {
            document.body.style.transform = 'translateZ(0)'; // Force GPU acceleration
            document.querySelectorAll('canvas').forEach(canvas => {
                canvas.style.imageRendering = 'pixelated';
            });
        }

        console.log(`✅ Performance mode set to: ${mode}`);
        return config;
    };

    console.log('🎮 Performance mode switching ready');
}

// 6. INTELLIGENT DOM MONITORING
function setupDOMMonitoring() {
    let lastNodeCount = 0;

    const monitorDOM = () => {
        const currentCount = document.querySelectorAll('*').length;

        if (currentCount > lastNodeCount + 100) {
            console.warn(`⚠️ DOM growth detected: ${lastNodeCount} → ${currentCount}`);

            // Smart cleanup
            const tempElements = document.querySelectorAll('[class*="temp"], [id*="temp"], .matrix-overlay:not(:first-of-type)');
            if (tempElements.length > 0) {
                tempElements.forEach(el => el.remove());
                console.log(`🧹 Cleaned ${tempElements.length} temporary elements`);
            }
        }

        lastNodeCount = currentCount;
    };

    // Monitor every 3 seconds
    setInterval(monitorDOM, 3000);

    console.log('👁️ Smart DOM monitoring enabled');
}

// 7. RESTORE ESSENTIAL ANIMATIONS
function restoreEssentialAnimations() {
    // Restore logo animation
    if (window.centerpieceLogo && !window.centerpieceLogo.isActive) {
        try {
            window.centerpieceLogo.init();
        } catch (e) {}
    }

    // Restore text effects
    if (window.textEffects) {
        try {
            window.textEffects.init();
        } catch (e) {}
    }

    // Start a gentle animation loop
    if (window.gsap) {
        const breathe = () => {
            const logo = document.querySelector('.image-2');
            if (logo && gsap.globalTimeline?.getChildren()?.length < 5) {
                gsap.to(logo, {
                    scale: 1.02,
                    duration: 3,
                    ease: 'sine.inOut',
                    yoyo: true,
                    repeat: -1,
                    onComplete: () => {
                        setTimeout(breathe, 1000);
                    }
                });
            }
        };

        setTimeout(breathe, 2000);
    }

    console.log('✨ Essential animations restored');
}

// MAIN INITIALIZATION
function initializeBalancedFix() {
    console.log('🚀 INITIALIZING BALANCED FIX...');

    // Wait for everything to be ready
    setTimeout(() => {
        setupSmartThrottling();
        restoreSceneSwitching();
        restoreSliders();
        setupPerformanceModes();
        setupDOMMonitoring();
        restoreEssentialModules();
        restoreEssentialAnimations();

        // Set to normal mode
        SET_PERFORMANCE_MODE('normal');

        console.log('✅ BALANCED FIX COMPLETE');
        console.log('🎮 Available commands:');
        console.log('  SET_PERFORMANCE_MODE("high"|"normal"|"low"|"minimal")');
        console.log('  SWITCH_SCENE("cosmic"|"matrix"|"minimal")');
        console.log('  SET_TEMPO(0-200) - Control animation speed');
        console.log('  SET_FX_INTENSITY(0-100) - Control effect intensity');

        // Report status
        const nodeCount = document.querySelectorAll('*').length;
        const animCount = gsap.globalTimeline?.getChildren()?.length || 0;
        console.log(`📊 Status: ${nodeCount} DOM nodes, ${animCount} animations`);

    }, 2000);
}

// Export functions
window.BALANCED_FIX_INIT = initializeBalancedFix;

// Auto-initialize
initializeBalancedFix();

console.log('🔧 Balanced fix loaded');

export default {
    init: initializeBalancedFix,
    setMode: () => window.SET_PERFORMANCE_MODE,
    switchScene: () => window.SWITCH_SCENE,
    setTempo: () => window.SET_TEMPO,
    setFXIntensity: () => window.SET_FX_INTENSITY
};