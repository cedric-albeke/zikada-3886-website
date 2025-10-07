// Device telemetry: collects capability info and exposes it on window for diagnostics/tests.
(function initDeviceTelemetry(){
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const gather = () => {
    try {
      const nav = navigator || {};
      const dpr = window.devicePixelRatio || 1;
      const cores = (nav).hardwareConcurrency || null;
      const ua = (nav).userAgent || '';
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      let vendor = null, renderer = null, maxTex = null;
      if (gl) {
        try {
          const ext = gl.getExtension('WEBGL_debug_renderer_info');
          if (ext) {
            vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL);
            renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
          }
          maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        } catch(_) {}
      }
      const profile = {
        dpr, cores, ua, vendor, renderer, maxTex,
        ts: Date.now(),
      };
      window.__zikadaDeviceProfile = profile;
      try {
        window.dispatchEvent(new CustomEvent('performance:device:ready',{ detail: profile }));
      } catch(_) {}
      return profile;
    } catch(e) {
      // ignore
      return null;
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', gather, { once: true });
  } else {
    gather();
  }
})();