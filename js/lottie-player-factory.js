import lottie from 'lottie-web/build/player/lottie_light_canvas.js';
import animationRuntime from './runtime/animation-runtime.js';

const ASSET_CACHE = new Map();
let nextPlayerId = 1;

function normalizeProfile(profile) {
  return ['high', 'medium', 'low'].includes(profile) ? profile : 'high';
}

function resolveRuntimeSource(src) {
  if (!/\.lottie(?:$|\?)/i.test(src)) return src;
  return src
    .replace('/animations/lottie/', '/animations/lottie-json/')
    .replace(/\.lottie(?=$|\?)/i, '.json');
}

function loadAsset(src) {
  const runtimeSource = resolveRuntimeSource(src);
  if (!ASSET_CACHE.has(runtimeSource)) {
    ASSET_CACHE.set(runtimeSource, fetch(runtimeSource).then(response => {
      if (!response.ok) throw new Error(`Lottie asset failed with ${response.status}: ${runtimeSource}`);
      return response.json();
    }).catch(error => {
      ASSET_CACHE.delete(runtimeSource);
      throw error;
    }));
  }
  return ASSET_CACHE.get(runtimeSource);
}

export function getLottieRenderConfig(profile = 'high') {
  const normalized = normalizeProfile(profile);
  const deviceDpr = Math.max(0.5, Number(window.devicePixelRatio) || 1);
  return {
    autoResize: true,
    devicePixelRatio: normalized === 'low'
      ? 0.45
      : (normalized === 'medium' ? Math.min(0.7, deviceDpr) : Math.min(1, deviceDpr)),
    freezeOnOffscreen: true,
    quality: normalized === 'low' ? 40 : (normalized === 'medium' ? 60 : 85)
  };
}

export function createManagedLottieCanvas(options = {}) {
  // lottie-web owns the single canvas appended inside this surface. The old
  // canvas-as-container path allocated an unused outer canvas plus the real
  // renderer canvas for every clip.
  const canvas = document.createElement('div');
  const src = String(options.src || '');
  const loop = options.loop !== false;
  let profile = normalizeProfile(options.profile || 'high');
  let speed = Math.max(0.05, Number(options.speed) || 1);
  let instance = null;
  let loadPromise = null;
  let destroyed = false;
  let wantsToPlay = false;
  let renderConfig = getLottieRenderConfig(profile);
  let playbackToken = null;
  let playbackStartedAt = 0;
  let playbackStartFrame = 0;
  const playbackOwner = `lottie-player:${nextPlayerId++}`;

  canvas.dataset.lottieManaged = 'true';
  canvas.dataset.lottieProfile = profile;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';

  const nativeSetAttribute = canvas.setAttribute.bind(canvas);
  const nativeGetAttribute = canvas.getAttribute.bind(canvas);
  const dispatch = (type, detail = {}) => {
    if (type === 'error') {
      canvas.dataset.lottieError = String(detail.error?.message || detail.error || 'unknown');
    }
    canvas.dispatchEvent(new CustomEvent(type, { detail }));
  };

  const applyRenderProfile = () => {
    renderConfig = getLottieRenderConfig(profile);
    lottie.setQuality(profile === 'high' ? 'medium' : 'low');
    if (!instance?.renderer?.renderConfig) return;
    instance.renderer.renderConfig.dpr = renderConfig.devicePixelRatio;
    try { instance.resize(); } catch (_) {}
  };

  const getPlaybackFps = () => profile === 'low' ? 12 : (profile === 'medium' ? 18 : 30);

  const clearPlayback = () => {
    playbackToken?.clear?.();
    playbackToken = null;
    animationRuntime.disposeOwner(playbackOwner);
  };

  const startPlayback = animation => {
    if (!animation?.isLoaded || !wantsToPlay || destroyed) return;
    clearPlayback();
    try { animation.pause(); } catch (_) {}
    playbackStartFrame = Number(animation.currentFrame) || 0;
    playbackStartedAt = performance.now();
    const totalFrames = Math.max(1, Number(animation.totalFrames) || 1);
    const frameRate = Math.max(1, Number(animation.frameRate || animation.animationData?.fr) || 60);

    playbackToken = animationRuntime.scheduleRafLoop(playbackOwner, now => {
      if (!wantsToPlay || destroyed) return;
      if (!canvas.isConnected) {
        wantsToPlay = false;
        clearPlayback();
        dispatch('interrupted', { reason: 'detached' });
        return;
      }
      const elapsedFrames = ((now - playbackStartedAt) / 1000) * frameRate * speed;
      const rawFrame = playbackStartFrame + elapsedFrames;
      const frame = loop ? (rawFrame % totalFrames) : Math.min(totalFrames - 1, rawFrame);
      try { animation.goToAndStop(frame, true); } catch (_) {}
      if (!loop && rawFrame >= totalFrames - 1) {
        wantsToPlay = false;
        clearPlayback();
        dispatch('complete');
      }
    }, { maxFps: getPlaybackFps() });
  };

  const ensureLoaded = () => {
    if (destroyed) return Promise.reject(new Error('Lottie canvas was destroyed'));
    if (instance) return Promise.resolve(instance);
    if (loadPromise) return loadPromise;

    loadPromise = loadAsset(src).then(animationData => {
      if (destroyed) throw new Error('Lottie canvas was destroyed');
      const data = typeof structuredClone === 'function'
        ? structuredClone(animationData)
        : JSON.parse(JSON.stringify(animationData));

      const animation = lottie.loadAnimation({
        container: canvas,
        renderer: 'canvas',
        loop,
        autoplay: false,
        animationData: data,
        rendererSettings: {
          clearCanvas: true,
          progressiveLoad: true,
          preserveAspectRatio: 'xMidYMid meet',
          dpr: renderConfig.devicePixelRatio
        }
      });
      instance = animation;
      animation.setSpeed(speed);
      animation.renderConfig = renderConfig;

      animation.addEventListener('config_ready', () => dispatch('ready'));
      animation.addEventListener('DOMLoaded', () => {
        animation.renderConfig = renderConfig;
        dispatch('load');
        if (wantsToPlay) startPlayback(animation);
      });
      animation.addEventListener('complete', () => dispatch('complete'));
      animation.addEventListener('data_failed', () => dispatch('error', { error: new Error(`Invalid Lottie data: ${src}`) }));
      return animation;
    }).catch(error => {
      loadPromise = null;
      dispatch('error', { error });
      throw error;
    });
    return loadPromise;
  };

  canvas.play = () => {
    wantsToPlay = true;
    return ensureLoaded().then(animation => {
      if (animation.isLoaded) startPlayback(animation);
    }).catch(() => {});
  };
  canvas.pause = () => {
    wantsToPlay = false;
    clearPlayback();
    try { instance?.pause(); } catch (_) {}
    return Promise.resolve();
  };
  canvas.stop = () => {
    wantsToPlay = false;
    clearPlayback();
    try { instance?.goToAndStop(0, true); } catch (_) {}
    return Promise.resolve();
  };
  canvas.destroy = () => {
    destroyed = true;
    wantsToPlay = false;
    clearPlayback();
    loadPromise = null;
    const animation = instance;
    instance = null;
    try { animation?.destroy(); } catch (_) {}
    return Promise.resolve();
  };
  canvas.setPerformanceProfile = nextProfile => {
    profile = normalizeProfile(nextProfile);
    canvas.dataset.lottieProfile = profile;
    applyRenderProfile();
    if (instance) instance.renderConfig = renderConfig;
    if (instance?.isLoaded && wantsToPlay) startPlayback(instance);
    return Promise.resolve();
  };
  canvas.ensureLottieLoaded = ensureLoaded;
  canvas.getLottieInstance = () => instance;

  canvas.setAttribute = (name, value) => {
    nativeSetAttribute(name, value);
    if (String(name).toLowerCase() === 'speed') {
      speed = Math.max(0.05, Number(value) || 1);
      if (instance?.isLoaded && wantsToPlay) startPlayback(instance);
    }
  };
  canvas.getAttribute = name => {
    if (String(name).toLowerCase() === 'speed') return String(speed);
    return nativeGetAttribute(name);
  };

  Object.defineProperties(canvas, {
    currentState: {
      configurable: true,
      get: () => instance?.isPaused ? 'paused' : (instance?.isLoaded ? 'ready' : 'idle')
    },
    lottieDuration: {
      configurable: true,
      get: () => instance?.getDuration?.(false) || 0
    }
  });

  applyRenderProfile();
  nativeSetAttribute('speed', String(speed));
  nativeSetAttribute('aria-hidden', 'true');
  return canvas;
}
