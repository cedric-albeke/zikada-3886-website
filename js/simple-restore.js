// Simple Restore - Stop all performance systems and provide basic functionality
console.log('🔥 SIMPLE RESTORE - Stopping all systems...');

// 1. STOP ALL ANIMATION MONITORING AND CREATION
if (window.gsap) {
    // Kill all existing animations
    gsap.killTweensOf('*');

    // Stop any animation registries
    if (window.gsapAnimationRegistry && window.gsapAnimationRegistry.killAll) {
        window.gsapAnimationRegistry.killAll();
    }
}

// 2. CLEAR ALL INTERVALS AND TIMEOUTS
const highestId = setTimeout(() => {}, 0);
for (let i = 0; i < highestId; i++) {
    clearTimeout(i);
    clearInterval(i);
}

// 3. DISABLE ALL PERFORMANCE MONITORING
if (window.performanceOptimizer) {
    window.performanceOptimizer = null;
}
if (window.safePerformanceMonitor) {
    window.safePerformanceMonitor = null;
}
if (window.performanceInspector) {
    window.performanceInspector = null;
}
if (window.gsapAnimationRegistry) {
    window.gsapAnimationRegistry = null;
}

// 4. SIMPLE WORKING FUNCTIONS
window.SWITCH_SCENE = function(sceneName) {
    console.log(`🎬 Simple scene switch: ${sceneName}`);

    // Kill any running animations
    if (window.gsap) {
        gsap.killTweensOf('*');
    }

    // Simple text updates
    const textElements = document.querySelectorAll('.logo-text, .text-3886, .matrix-messages');
    textElements.forEach(el => {
        if (sceneName === 'cosmic') {
            el.textContent = 'ZIKADA LIVES';
        } else if (sceneName === 'matrix') {
            el.textContent = 'MATRIX MODE';
        } else if (sceneName === 'minimal') {
            el.textContent = 'MINIMAL';
        }
    });

    return true;
};

window.SET_TEMPO = function(value) {
    if (typeof value === 'undefined' || value === null) {
        console.warn('⚠️ SET_TEMPO called with undefined value');
        return false;
    }
    console.log(`🎵 Simple tempo set: ${value}`);
    return true;
};

window.SET_FX_INTENSITY = function(value) {
    if (typeof value === 'undefined' || value === null) {
        console.warn('⚠️ SET_FX_INTENSITY called with undefined value');
        return false;
    }
    console.log(`✨ Simple FX intensity set: ${value}`);
    return true;
};

// 5. DISABLE CHAOS ENGINE RESTART LOOPS
if (window.chaosInit && window.chaosInit.watchdog) {
    window.chaosInit.watchdog = () => {};
}

console.log('✅ Simple restore complete. Functions available:');
console.log('  SWITCH_SCENE("cosmic"|"matrix"|"minimal")');
console.log('  SET_TEMPO(number)');
console.log('  SET_FX_INTENSITY(number)');

export default {
    switchScene: window.SWITCH_SCENE,
    setTempo: window.SET_TEMPO,
    setFXIntensity: window.SET_FX_INTENSITY
};