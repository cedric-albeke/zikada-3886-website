// Telemetry Overlay - optional runtime metrics HUD
// Enable with ?overlay=1 in the URL

(function () {
  try {
    const qp = new URLSearchParams(window.location.search);
    const overlayEnabled = qp.get('overlay') === '1';
    if (!overlayEnabled) return;

    if (document.getElementById('telemetry-overlay')) return; // already present

    const el = document.createElement('div');
    el.id = 'telemetry-overlay';
    el.style.cssText = [
      'position:fixed',
      'top:8px',
      'left:8px',
      'z-index:9999',
      'background:rgba(0,0,0,0.6)',
      'color:#0f0',
      'font:12px/1.4 monospace',
      'padding:8px 10px',
      'border:1px solid #0f0',
      'border-radius:4px',
      'pointer-events:none',
      'white-space:pre',
      'max-width:46vw',
    ].join(';');
    el.textContent = 'Loading telemetry...';
    document.body.appendChild(el);

    let visible = true;
    const toggle = () => {
      visible = !visible;
      el.style.display = visible ? 'block' : 'none';
    };

    // Keyboard toggle: Shift+O
    window.addEventListener('keydown', (e) => {
      if ((e.key === 'O' || e.key === 'o') && e.shiftKey) {
        toggle();
      }
    }, { passive: true });

    function fmtBytes(b) {
      if (!Number.isFinite(b)) return 'n/a';
      if (b < 1024) return b + ' B';
      const kb = b / 1024; if (kb < 1024) return kb.toFixed(1) + ' KB';
      const mb = kb / 1024; return mb.toFixed(1) + ' MB';
    }

    function getFPS() {
      try {
        if (window.performanceBus?.metrics?.fps) return window.performanceBus.metrics.fps;
        if (window.safePerformanceMonitor?.metrics?.fps) return window.safePerformanceMonitor.metrics.fps;
      } catch {}
      return 0;
    }

    function getRendererInfo() {
      try {
        const info = window.chaosEngine?.renderer?.info;
        if (!info) return null;
        return {
          progs: Array.isArray(info.programs) ? info.programs.length : (info.programs?.length || 0),
          geom: info.memory?.geometries ?? 0,
          tex: info.memory?.textures ?? 0,
        };
      } catch {}
      return null;
    }

    function getResourceStats() {
      try {
        const r = window.chaosEngine?.resources;
        if (!r) return null;
        return {
          g: r.geometries?.length ?? 0,
          m: r.materials?.length ?? 0,
          t: r.textures?.length ?? 0,
          me: r.meshes?.length ?? 0,
          l: r.lights?.length ?? 0,
        };
      } catch {}
      return null;
    }

    function getPostFX() {
      try {
        const ce = window.chaosEngine;
        if (!ce) return 'n/a';
        const bloom = !!(ce.bloomPass && ce.bloomPass.enabled && ce.bloomPass.strength > 0.01);
        const glitch = !!(ce.glitchPass && ce.glitchPass.enabled);
        const film = !!(ce.filmPass && ce.filmPass.enabled);
        const chroma = !!(ce.chromaticAberrationPass && ce.chromaticAberrationPass.uniforms?.amount?.value > 0.001);
        return `bloom:${bloom?'on':'off'} glitch:${glitch?'on':'off'} film:${film?'on':'off'} chroma:${chroma?'on':'off'}`;
      } catch {}
      return 'n/a';
    }

    const update = () => {
      try {
        const fps = getFPS();
        const mem = (performance && performance.memory && performance.memory.usedJSHeapSize) ? performance.memory.usedJSHeapSize : NaN;
        const dom = document.querySelectorAll('*').length;
        const ri = getRendererInfo() || { progs: 0, geom: 0, tex: 0 };
        const rs = getResourceStats() || { g:0, m:0, t:0, me:0, l:0 };
        const fx = getPostFX();

        el.textContent = [
          `FPS: ${fps}`,
          `Mem: ${fmtBytes(mem)}`,
          `DOM: ${dom}`,
          `GL: progs:${ri.progs} geom:${ri.geom} tex:${ri.tex}`,
          `Res: g:${rs.g} m:${rs.m} t:${rs.t} meshes:${rs.me} lights:${rs.l}`,
          `FX:  ${fx}`,
          `Toggle: Shift+O`,
        ].join('\n');
      } catch (e) {
        el.textContent = `Telemetry error: ${e?.message || e}`;
      }
    };

    const interval = setInterval(update, 1000);
    update();

    // Clean up on page hide/unload (best-effort)
    window.addEventListener('beforeunload', () => clearInterval(interval));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) return; // refresh upon return
      update();
    });
  } catch (e) {
    // No-op; overlay is purely optional
    console.warn('[overlay] init failed:', e);
  }
})();