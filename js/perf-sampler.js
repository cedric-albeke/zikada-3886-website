// Performance sampler: subscribes to performanceBus and samples memory/DOM/overlays.
// Exposes window.__zikadaPerf with getSnapshot() and subscribe(cb).

import animationRuntime from './runtime/animation-runtime.js';

(function(){
  if (window.__zikadaPerf) return;
  const runtimeOwner = 'perf-sampler';
  animationRuntime.disposeOwner(runtimeOwner);

  const state = {
    fps: 0,
    frameTime: 0,
    mem: 0,
    dom: 0,
    overlays: 0,
    activeFx: 0,
    timestamp: Date.now()
  };

  const subs = new Set();
  function notify() { subs.forEach(fn => { try { fn({ ...state }); } catch {} }); }

  // Subscribe to performance bus if present
  try {
    if (window.performanceBus?.subscribe) {
      const updateFromBus = (m) => {
        if (typeof m?.fps === 'number') state.fps = m.fps;
        if (typeof m?.frameTime === 'number') state.frameTime = m.frameTime;
        if (typeof m?.memoryBytes === 'number') state.mem = m.memoryBytes;
        if (typeof m?.domNodes === 'number') state.dom = m.domNodes;
        if (typeof m?.overlays === 'number') state.overlays = m.overlays;
        if (typeof m?.activeFx === 'number') state.activeFx = m.activeFx;
        state.timestamp = Date.now();
        notify();
      };
      const unsubscribe = window.performanceBus.subscribe(updateFromBus);
      animationRuntime.trackDisposer(runtimeOwner, unsubscribe);
      updateFromBus(window.performanceBus.metrics);
    }
  } catch {}

  window.__zikadaPerf = {
    getSnapshot: () => ({ ...state }),
    subscribe: (fn) => { subs.add(fn); return () => subs.delete(fn); }
  };
})();
