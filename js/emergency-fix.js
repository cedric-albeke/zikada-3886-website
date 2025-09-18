// Emergency Fix - Stop the animation explosion and clean up DOM
console.log('🚨 EMERGENCY FIX LOADING...');

// 1. STOP ALL ANIMATION CREATION IMMEDIATELY
if (window.gsap) {
    // Save original methods
    const originalTo = gsap.to;
    const originalFrom = gsap.from;
    const originalFromTo = gsap.fromTo;
    const originalTimeline = gsap.timeline;

    // Throttle animation creation - max 1 per 100ms per type
    const throttleMap = new Map();

    const throttledMethod = (name, originalMethod) => {
        return function(...args) {
            const now = Date.now();
            const lastCall = throttleMap.get(name) || 0;

            if (now - lastCall < 100) {
                // Too soon, skip this animation
                return null;
            }

            throttleMap.set(name, now);

            // Check total animation count
            const animCount = gsap.globalTimeline?.getChildren()?.length || 0;
            if (animCount > 30) {
                // Too many animations, skip
                return null;
            }

            return originalMethod.apply(this, args);
        };
    };

    // Apply throttling
    gsap.to = throttledMethod('to', originalTo);
    gsap.from = throttledMethod('from', originalFrom);
    gsap.fromTo = throttledMethod('fromTo', originalFromTo);
    gsap.timeline = throttledMethod('timeline', originalTimeline);
}

// 2. CLEAN UP EXCESSIVE DOM NODES
function emergencyDOMCleanup() {
    console.log('🧹 Emergency DOM cleanup starting...');

    // Remove duplicate or excessive elements
    const selectorsToClean = [
        '.matrix-text-container',
        '.matrix-overlay',
        '.phase-overlay',
        '.flash-overlay',
        '.glitch-overlay',
        '.distortion-overlay',
        '.temp-element',
        '.chaos-temp',
        '[id^="scanlines"]',
        '[id^="vhs-"]',
        '[id^="cyber-"]',
        '.quantum-particles',
        '.holographic-shimmer',
        '.energy-field'
    ];

    selectorsToClean.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 1) {
            // Keep only the first one
            for (let i = 1; i < elements.length; i++) {
                elements[i].remove();
            }
        }
    });

    // Remove any elements with display:none that are temporary
    document.querySelectorAll('[style*="display: none"]').forEach(el => {
        if (el.className && el.className.includes('temp')) {
            el.remove();
        }
    });

    // Clean up text nodes that are empty
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node) {
                return node.nodeValue.trim() === '' ?
                    NodeFilter.FILTER_ACCEPT :
                    NodeFilter.FILTER_SKIP;
            }
        }
    );

    const nodesToRemove = [];
    while (walker.nextNode()) {
        nodesToRemove.push(walker.currentNode);
    }

    nodesToRemove.forEach(node => {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    });

    const afterCount = document.querySelectorAll('*').length;
    console.log(`🧹 DOM cleanup complete. Nodes: ${afterCount}`);
}

// 3. STOP RUNAWAY INTERVALS
function stopRunawayIntervals() {
    // Get all interval IDs by brute force
    const highestId = setTimeout(() => {}, 0);
    for (let i = 0; i < highestId; i++) {
        clearTimeout(i);
        clearInterval(i);
    }
    console.log('⏹️ Stopped all intervals and timeouts');
}

// 4. FIX PERFORMANCE MODE SWITCHING
window.FORCE_PERFORMANCE_MODE = function(mode) {
    console.log(`🎮 Forcing performance mode: ${mode}`);

    // Kill all animations first
    if (window.gsap) {
        gsap.killTweensOf('*');
    }

    // Set mode in all systems
    if (window.performanceOptimizer) {
        window.performanceOptimizer.performanceMode = mode;
        window.performanceOptimizer.emergencyMode = (mode === 'emergency');
    }

    if (window.chaosInit) {
        window.chaosInit.performanceMode = mode;
    }

    if (window.performanceManager) {
        window.performanceManager.performanceMode = mode;
    }

    // Update animation budgets based on mode
    const budgets = {
        emergency: { critical: 2, effects: 0, background: 0, particles: 0 },
        low: { critical: 3, effects: 2, background: 1, particles: 0 },
        normal: { critical: 5, effects: 8, background: 4, particles: 3 }
    };

    if (window.performanceOptimizer?.setAnimationBudget) {
        window.performanceOptimizer.setAnimationBudget(budgets[mode] || budgets.normal);
    }

    console.log(`✅ Performance mode set to: ${mode}`);
};

// 5. DISABLE PROBLEMATIC MODULES
function disableProblematicModules() {
    // Disable modules that create excessive DOM nodes
    const modulesToDisable = [
        'matrixMessages',
        'randomAnimations',
        'extendedAnimations',
        'subtleEffects'
    ];

    modulesToDisable.forEach(moduleName => {
        if (window[moduleName]) {
            if (window[moduleName].destroy) {
                try {
                    window[moduleName].destroy();
                } catch (e) {}
            }
            if (window[moduleName].stop) {
                try {
                    window[moduleName].stop();
                } catch (e) {}
            }
            // Disable init method
            if (window[moduleName].init) {
                window[moduleName].init = () => {
                    console.log(`⛔ ${moduleName}.init() disabled`);
                };
            }
        }
    });

    console.log('⛔ Problematic modules disabled');
}

// 6. CREATE CLEANUP FUNCTION
window.EMERGENCY_CLEANUP = function() {
    console.log('🚨 RUNNING EMERGENCY CLEANUP...');

    // Stop everything
    stopRunawayIntervals();

    // Kill all animations
    if (window.gsap) {
        gsap.killTweensOf('*');
    }

    // Clean DOM
    emergencyDOMCleanup();

    // Disable problematic modules
    disableProblematicModules();

    // Force low performance mode
    FORCE_PERFORMANCE_MODE('low');

    // Force garbage collection if available
    if (window.gc) {
        window.gc();
    }

    console.log('✅ Emergency cleanup complete');

    // Report status
    const domNodes = document.querySelectorAll('*').length;
    const animCount = window.gsap ? gsap.globalTimeline?.getChildren()?.length || 0 : 0;

    console.log(`📊 Status: DOM nodes: ${domNodes}, Animations: ${animCount}`);

    return {
        domNodes,
        animations: animCount,
        mode: window.performanceOptimizer?.performanceMode || 'unknown'
    };
};

// 7. FIX SCENE SWITCHING
window.FIX_SCENE_SWITCHING = function() {
    // Re-enable scene switching
    if (window.chaosEngine && window.chaosEngine.switchScene) {
        const originalSwitch = window.chaosEngine.switchScene;
        window.chaosEngine.switchScene = function(sceneName) {
            console.log(`🎬 Switching to scene: ${sceneName}`);

            // Clean up before switching
            if (window.gsap) {
                gsap.killTweensOf('*');
            }

            // Minimal DOM cleanup
            document.querySelectorAll('.temp-element, .chaos-temp').forEach(el => el.remove());

            // Switch scene
            return originalSwitch.call(this, sceneName);
        };
    }
    console.log('✅ Scene switching fixed');
};

// 8. FIX SLIDERS
window.FIX_SLIDERS = function() {
    // Re-enable tempo and FX intensity sliders
    if (window.vjReceiver) {
        window.vjReceiver.handleControlChange = function(control, value) {
            console.log(`🎚️ Control change: ${control} = ${value}`);

            // Apply the change
            if (control === 'tempo') {
                if (window.timingController) {
                    window.timingController.setGlobalSpeed(value / 100);
                }
            } else if (control === 'fxIntensity') {
                const intensity = value / 100;
                // Adjust animation intensity
                if (window.performanceOptimizer) {
                    const budget = {
                        critical: Math.floor(5 * intensity),
                        effects: Math.floor(8 * intensity),
                        background: Math.floor(4 * intensity),
                        particles: Math.floor(3 * intensity)
                    };
                    window.performanceOptimizer.setAnimationBudget(budget);
                }
            }
        };
    }
    console.log('✅ Sliders fixed');
};

// AUTO-RUN EMERGENCY CLEANUP
setTimeout(() => {
    console.log('🚨 AUTO-RUNNING EMERGENCY FIX...');
    EMERGENCY_CLEANUP();
    FIX_SCENE_SWITCHING();
    FIX_SLIDERS();

    // Monitor and prevent DOM explosion
    setInterval(() => {
        const nodeCount = document.querySelectorAll('*').length;
        if (nodeCount > 5000) {
            console.warn(`⚠️ DOM explosion detected: ${nodeCount} nodes`);
            emergencyDOMCleanup();
        }
    }, 5000);

}, 1000);

console.log('✅ Emergency fix loaded. Commands available:');
console.log('  EMERGENCY_CLEANUP() - Run full cleanup');
console.log('  FORCE_PERFORMANCE_MODE("low"|"normal"|"emergency") - Force mode');
console.log('  FIX_SCENE_SWITCHING() - Fix scene switching');
console.log('  FIX_SLIDERS() - Fix control sliders');

export default {
    cleanup: EMERGENCY_CLEANUP,
    forceMode: FORCE_PERFORMANCE_MODE,
    fixScenes: FIX_SCENE_SWITCHING,
    fixSliders: FIX_SLIDERS
};