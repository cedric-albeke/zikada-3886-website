// Effects Cycle Harness - optional short test of scenes & FX
// Enable with ?cycle=1 (default duration ~120s)

(function () {
  try {
    const qp = new URLSearchParams(window.location.search);
    const enabled = qp.get('cycle') === '1';
    if (!enabled) return;

    const log = (...args) => console.log('[cycle]', ...args);

    // Basic plan: alternate scenes every 15s and trigger a light FX every 10s
    const SCENES = ['calm', 'buildup', 'intense', 'cooldown'];
    const FX = ['strobe', 'vignette-pulse', 'scanlines-sweep', 'chroma-pulse', 'noise-burst'];

    const totalMs = parseInt(qp.get('cycle_ms') || '120000', 10);
    const fxIntervalMs = 10000;
    const sceneIntervalMs = 15000;

    let sceneIdx = 0;
    let fxIdx = 0;
    const t0 = Date.now();

    function setScene(name) {
      try {
        window.dispatchEvent(new CustomEvent('animationPhase', { detail: { phase: name } }));
        log('scene->', name);
      } catch (e) { log('scene error', e); }
    }

    function triggerFx(name) {
      try {
        // Prefer vjReceiver if available
        if (window.vjReceiver && typeof window.vjReceiver.triggerEffect === 'function') {
          window.vjReceiver.triggerEffect(name);
        } else {
          window.dispatchEvent(new CustomEvent('effect:trigger', { detail: { effect: name } }));
        }
        log('fx->', name);
      } catch (e) { log('fx error', e); }
    }

    function sample() {
      try {
        const fps = (window.performanceBus?.metrics?.fps) || (window.safePerformanceMonitor?.metrics?.fps) || 0;
        const mem = performance?.memory?.usedJSHeapSize || 0;
        log('metrics', { fps, mem });
      } catch {}
    }

    // Kickoff
    setScene(SCENES[sceneIdx]);
    triggerFx(FX[fxIdx]);
    sample();

    const sceneTimer = setInterval(() => {
      sceneIdx = (sceneIdx + 1) % SCENES.length;
      setScene(SCENES[sceneIdx]);
    }, sceneIntervalMs);

    const fxTimer = setInterval(() => {
      fxIdx = (fxIdx + 1) % FX.length;
      triggerFx(FX[fxIdx]);
      sample();
    }, fxIntervalMs);

    const stopAt = t0 + totalMs;
    const guard = setInterval(() => {
      if (Date.now() >= stopAt) {
        clearInterval(sceneTimer);
        clearInterval(fxTimer);
        clearInterval(guard);
        log('cycle complete');
      }
    }, 1000);

    window.addEventListener('beforeunload', () => {
      clearInterval(sceneTimer); clearInterval(fxTimer); clearInterval(guard);
    });
  } catch (e) {
    console.warn('[effects-cycle] init failed:', e);
  }
})();