// Performance sampler: subscribes to performanceBus and samples memory/DOM/overlays.
// Exposes window.__zikadaPerf with getSnapshot() and subscribe(cb).

(function(){
  if (window.__zikadaPerf) return;

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
      window.performanceBus.subscribe((m) => {
        if (typeof m?.fps === 'number') state.fps = m.fps;
        if (typeof m?.frameTime === 'number') state.frameTime = m.frameTime;
        state.timestamp = Date.now();
        notify();
      });
    }
  } catch {}

  // Periodic sampler for memory/DOM/overlays/activeFx
  setInterval(() => {
    try {
      state.mem = (performance && performance.memory && performance.memory.usedJSHeapSize) ? performance.memory.usedJSHeapSize : 0;
    } catch {}
    try {
      state.dom = document.querySelectorAll('*').length;
    } catch {}
    try {
      const fxRoot = document.getElementById('fx-root');
      state.overlays = fxRoot ? fxRoot.children.length : 0;
    } catch {}
    try {
      state.activeFx = (window.vjReceiver && typeof window.vjReceiver.activeFx === 'number') ? window.vjReceiver.activeFx : 0;
    } catch {}
    state.timestamp = Date.now();
    notify();
  }, 1000);

  window.__zikadaPerf = {
    getSnapshot: () => ({ ...state }),
    subscribe: (fn) => { subs.add(fn); return () => subs.delete(fn); }
  };
})();
