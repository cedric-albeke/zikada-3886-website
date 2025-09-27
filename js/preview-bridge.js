// Preview Bridge: optimize main page when embedded as live preview in control panel

function isPreviewEmbed() {
  try {
    const params = new URLSearchParams(window.location.search || '');
    const inIframe = window.top !== window.self;
    return inIframe && (params.get('preview') === '1');
  } catch (_) {
    return false;
  }
}

function applyPreviewOptimizations() {
  // Throttle performance and effects for preview to reduce CPU/GPU
  try {
    if (window.vjReceiver && typeof window.vjReceiver.setPerformanceMode === 'function') {
      window.vjReceiver.setPerformanceMode('low');
    }
  } catch (_) {}

  // Reduce noisy effects if controller exists
  const applyLightFX = () => {
    try {
      if (window.fxController) {
        window.fxController.setGlobalIntensityMultiplier(0.6);
        window.fxController.setIntensity({ glitch: 0.2, particles: 0.2, noise: 0.05 });
      }
    } catch (_) {}
  };

  // Apply immediately and retry once after core init
  applyLightFX();
  setTimeout(applyLightFX, 1500);
}

if (isPreviewEmbed()) {
  // Mark body for potential CSS tweaks if desired
  document.documentElement.setAttribute('data-preview', '1');
  document.addEventListener('DOMContentLoaded', applyPreviewOptimizations);
}

export default {};

