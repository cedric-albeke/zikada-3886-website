// Centralized Performance Mode Manager
// Applies Low/Auto/High modes consistently across subsystems and broadcasts changes.

(function(){
  if (window.performanceModeManager) return;

  function applyMode(mode) {
    const pmMode = (mode === 'auto') ? 'medium' : mode; // for performanceManager
    const pemMode = (mode === 'low') ? 'aggressive' : 'normal'; // for performanceElementManager

    try {
      // FX intensity scaling
      if (window.fxController && typeof window.fxController.setGlobalIntensityMultiplier === 'function') {
        const mult = mode === 'low' ? 0.7 : (mode === 'high' ? 1.3 : 1.0);
        window.fxController.setGlobalIntensityMultiplier(mult);
      }
    } catch {}

    try {
      // GSAP animation limits
      if (window.gsapAnimationRegistry) {
        switch (mode) {
          case 'low': window.gsapAnimationRegistry.maxAnimations = 50; break;
          case 'high': window.gsapAnimationRegistry.maxAnimations = 200; break;
          default: window.gsapAnimationRegistry.maxAnimations = 100; break;
        }
      }
    } catch {}

    try {
      // Apply to performance manager(s)
      if (window.performanceManager?.setPerformanceMode) {
        window.performanceManager.setPerformanceMode(pmMode);
      }
      if (window.performanceElementManager?.setPerformanceMode) {
        window.performanceElementManager.setPerformanceMode(pemMode);
      }
      if (window.ChaosControl?.setPerformance) {
        window.ChaosControl.setPerformance(pmMode);
      }
    } catch {}

    // Broadcast normalized detail
    const detail = { mode, pmMode, pemMode, source: 'performanceModeManager' };
    window.dispatchEvent(new CustomEvent('performanceMode', { detail }));
    window.dispatchEvent(new CustomEvent('performanceModeChange', { detail }));
  }

  window.performanceModeManager = { applyMode };
})();
