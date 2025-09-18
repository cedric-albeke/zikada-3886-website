// Non-intrusive diagnostics helper (no timers, no hooks)
// Exposes window.__3886_DIAG with getStats() and print()

import gsap from 'gsap';

(function initDiagnostics() {
  const formatBytes = (bytes) => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFPS = () => {
    if (window.safePerformanceMonitor?.metrics?.fps) return window.safePerformanceMonitor.metrics.fps;
    if (window.vjReceiver?.currentFPS) return Math.round(window.vjReceiver.currentFPS);
    return 'Unknown';
  };

  const getGSAPCounts = () => {
    let registry = 0;
    let timelineChildren = 'N/A';
    try {
      registry = window.gsapAnimationRegistry?.animations?.size ?? 0;
    } catch (_) {}
    try {
      timelineChildren = gsap?.globalTimeline?.getChildren()?.length ?? 'N/A';
    } catch (_) {}
    return { registry, timelineChildren };
  };

  const getStats = () => {
    const domNodes = document.querySelectorAll('*').length;
    const intervals = window.intervalManager?.intervals?.size ?? 0;
    const managedElements = window.performanceElementManager?.elements?.size ?? 0;
    const { registry: gsapRegistry, timelineChildren } = getGSAPCounts();
    const memoryBytes = performance.memory ? performance.memory.usedJSHeapSize : 0;

    return {
      timestamp: new Date().toISOString(),
      fps: getFPS(),
      domNodes,
      managedElements,
      intervals,
      gsapAnimations: {
        registry: gsapRegistry,
        globalTimelineChildren: timelineChildren
      },
      memory: {
        bytes: memoryBytes,
        formatted: formatBytes(memoryBytes)
      }
    };
  };

  const print = () => {
    const s = getStats();
    console.log('[DIAG]', `FPS=${s.fps}`, `DOM=${s.domNodes}`, `Anim(reg=${s.gsapAnimations.registry}, gt=${s.gsapAnimations.globalTimelineChildren})`, `Elems=${s.managedElements}`, `Intervals=${s.intervals}`, `Mem=${s.memory.formatted}`);
    return s;
  };

  const api = { getStats, print };
  if (typeof window !== 'undefined') {
    window.__3886_DIAG = api;
    console.log('🔍 Diagnostics ready. Use window.__3886_DIAG.getStats() or window.__3886_DIAG.print()');
  }

  export default api;
})();