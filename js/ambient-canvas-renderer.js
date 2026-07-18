import animationRuntime from './runtime/animation-runtime.js';

const RUNTIME_OWNER = 'ambient-canvas-renderer';
const LOOP_OWNER = 'ambient-canvas-renderer:loop';
const DEFAULT_MATRIX_CHARS = '日ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

class AmbientCanvasRenderer {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.matrixSurface = document.createElement('canvas');
    this.matrixCtx = this.matrixSurface.getContext('2d');
    this.cyberSurface = document.createElement('canvas');
    this.cyberCtx = this.cyberSurface.getContext('2d');
    this.noiseSurface = document.createElement('canvas');
    this.noiseCtx = this.noiseSurface.getContext('2d');
    this.glitchSurface = document.createElement('canvas');
    this.glitchCtx = this.glitchSurface.getContext('2d');
    this.noiseSurface.width = 128;
    this.noiseSurface.height = 128;
    this.matrixChars = DEFAULT_MATRIX_CHARS;
    this.matrixDrops = [];
    this.initialized = false;
    this.profile = 'low';
    this.lastNoiseAt = 0;
    this.channels = {
      matrix: { enabled: false, opacity: 0.03 },
      cyberGrid: { enabled: false, opacity: 0.008 },
      noise: { enabled: true, strength: 0.25 },
      scanlines: { enabled: true, strength: 0.035 },
      filmGrain: { enabled: false, strength: 0.15 },
      glitch: { enabled: false, strength: 0 }
    };
  }

  init() {
    if (this.initialized && this.canvas?.isConnected) return this.canvas;

    animationRuntime.disposeOwner(RUNTIME_OWNER);
    animationRuntime.disposeOwner(LOOP_OWNER);
    document.getElementById('ambient-effects-canvas')?.remove();

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'ambient-effects-canvas';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.canvas.style.cssText = `
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      height: 100dvh;
      pointer-events: none;
      z-index: 0;
      opacity: 1;
      mix-blend-mode: normal;
      image-rendering: auto;
    `;

    const mount = document.querySelector('.pre-loader') || document.body;
    mount.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d', { alpha: true, desynchronized: true });
    animationRuntime.trackNode(RUNTIME_OWNER, this.canvas);

    const handleResize = () => this.resize();
    window.addEventListener('resize', handleResize, { passive: true });
    animationRuntime.trackDisposer(RUNTIME_OWNER, () => window.removeEventListener('resize', handleResize));

    const handleVisibility = () => {
      if (document.hidden) animationRuntime.disposeOwner(LOOP_OWNER);
      else this.start();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    animationRuntime.trackDisposer(RUNTIME_OWNER, () => document.removeEventListener('visibilitychange', handleVisibility));

    this.initialized = true;
    this.setPerformanceProfile(
      document.documentElement.dataset.performanceProfile
      || (window.chaosEngine?.softwareRenderer ? 'low' : 'high')
    );
    return this.canvas;
  }

  getQuality() {
    const lowCost = this.profile === 'low' || window.chaosEngine?.softwareRenderer;
    if (lowCost) return { scale: 0.375, fps: 6 };
    if (this.profile === 'medium') return { scale: 0.5, fps: 8 };
    return { scale: 0.65, fps: 12 };
  }

  resize() {
    if (!this.canvas) return;
    const { scale } = this.getQuality();
    const width = Math.max(320, Math.round(window.innerWidth * scale));
    const height = Math.max(180, Math.round(window.innerHeight * scale));
    if (this.canvas.width === width && this.canvas.height === height) return;

    [this.canvas, this.matrixSurface, this.cyberSurface, this.glitchSurface].forEach(surface => {
      surface.width = width;
      surface.height = height;
    });
    this.resetMatrixDrops();
    this.drawCyberGrid();
  }

  resetMatrixDrops() {
    const columns = Math.min(48, Math.floor((this.matrixSurface.width || 320) / 15));
    this.matrixDrops = Array.from({ length: columns }, () => Math.floor(Math.random() * 20));
    this.matrixCtx?.clearRect(0, 0, this.matrixSurface.width, this.matrixSurface.height);
  }

  drawCyberGrid() {
    const ctx = this.cyberCtx;
    const width = this.cyberSurface.width;
    const height = this.cyberSurface.height;
    if (!ctx || !width || !height) return;

    ctx.clearRect(0, 0, width, height);
    const horizon = height * 0.2;
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 0.5;

    for (let i = 0; i <= 18; i++) {
      const normalized = i / 18;
      const y = horizon + normalized * normalized * (height - horizon);
      ctx.globalAlpha = 0.65 - normalized * 0.35;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const centerX = width / 2;
    for (let i = -18; i <= 18; i++) {
      ctx.globalAlpha = 0.22;
      ctx.beginPath();
      ctx.moveTo(centerX + i * 8, horizon);
      ctx.lineTo(centerX + i * 44, height);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  drawMatrix() {
    const ctx = this.matrixCtx;
    const width = this.matrixSurface.width;
    const height = this.matrixSurface.height;
    if (!ctx || !width || !height || !this.channels.matrix.enabled) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#00ff66';
    ctx.font = '15px monospace';

    for (let i = 0; i < this.matrixDrops.length; i++) {
      const char = this.matrixChars[Math.floor(Math.random() * this.matrixChars.length)];
      const y = this.matrixDrops[i] * 15;
      ctx.fillText(char, i * 15, y);
      if (y > height && Math.random() > 0.975) this.matrixDrops[i] = 0;
      else this.matrixDrops[i]++;
    }
  }

  drawNoise(now) {
    if (!this.noiseCtx || now - this.lastNoiseAt < 180) return;
    this.lastNoiseAt = now;
    const width = this.noiseSurface.width;
    const height = this.noiseSurface.height;
    const image = this.noiseCtx.createImageData(width, height);
    const data = image.data;
    const noiseAlpha = Math.round(255 * Math.max(0, this.channels.noise.strength) * 0.05);
    const grainAlpha = Math.round(255 * Math.max(0, this.channels.filmGrain.strength) * 0.1);
    const lineAlpha = Math.round(255 * Math.max(0, this.channels.scanlines.strength));
    const lineOffset = Math.floor((now / 180) % 4);

    for (let i = 0; i < data.length; i += 4) {
      const y = Math.floor((i / 4) / width);
      const isLine = this.channels.scanlines.enabled && ((y + lineOffset) % 4 === 0);
      const value = Math.random() * 255 * (isLine ? 0.38 : 1);
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
      data[i + 3] = Math.max(
        this.channels.noise.enabled ? noiseAlpha : 0,
        this.channels.filmGrain.enabled ? grainAlpha : 0,
        isLine ? lineAlpha : 0
      );
    }
    this.noiseCtx.putImageData(image, 0, 0);
  }

  drawGlitch() {
    const strength = this.channels.glitch.strength;
    if (!this.channels.glitch.enabled || strength <= 0 || !this.glitchCtx || !this.ctx) return;
    const width = this.canvas.width;
    const height = this.canvas.height;
    if (!width || !height) return;

    this.glitchCtx.clearRect(0, 0, width, height);
    this.glitchCtx.drawImage(this.canvas, 0, 0);
    const slices = 1 + Math.round(strength * 4);
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'screen';
    this.ctx.globalAlpha = 0.22 + strength * 0.38;
    for (let index = 0; index < slices; index++) {
      const sliceHeight = Math.max(2, Math.round(height * (0.008 + Math.random() * 0.025)));
      const sourceY = Math.max(0, Math.round(Math.random() * (height - sliceHeight)));
      const shift = Math.round((Math.random() - 0.5) * width * 0.05 * strength);
      this.ctx.drawImage(
        this.glitchSurface,
        0, sourceY, width, sliceHeight,
        shift, sourceY, width, sliceHeight
      );
    }
    this.ctx.restore();
  }

  render(now = performance.now()) {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (this.channels.cyberGrid.enabled) {
      ctx.globalAlpha = this.channels.cyberGrid.opacity;
      ctx.drawImage(this.cyberSurface, 0, 0);
    }

    if (this.channels.matrix.enabled) {
      this.drawMatrix();
      ctx.globalAlpha = this.channels.matrix.opacity;
      ctx.drawImage(this.matrixSurface, 0, 0);
    }

    if (this.channels.noise.enabled || this.channels.scanlines.enabled || this.channels.filmGrain.enabled) {
      this.drawNoise(now);
      ctx.globalAlpha = 1;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.noiseSurface, 0, 0, width, height);
      ctx.imageSmoothingEnabled = true;
    }
    this.drawGlitch();
    ctx.globalAlpha = 1;
  }

  start() {
    if (!this.initialized || !this.canvas?.isConnected) this.init();
    if (document.hidden) return;
    animationRuntime.disposeOwner(LOOP_OWNER);
    const { fps } = this.getQuality();
    this.render();
    animationRuntime.scheduleRafLoop(LOOP_OWNER, now => this.render(now), { maxFps: fps });
  }

  pause() {
    animationRuntime.disposeOwner(LOOP_OWNER);
  }

  setPerformanceProfile(profile) {
    this.profile = ['high', 'medium', 'low'].includes(profile) ? profile : 'high';
    if (!this.initialized) return;
    this.canvas.style.mixBlendMode = this.profile === 'low' || window.chaosEngine?.softwareRenderer ? 'normal' : 'screen';
    this.resize();
    this.start();
  }

  setMatrixEnabled(enabled, chars = this.matrixChars) {
    this.init();
    this.channels.matrix.enabled = Boolean(enabled);
    if (chars) this.matrixChars = String(chars);
    if (enabled && !this.matrixDrops.length) this.resetMatrixDrops();
    this.start();
  }

  setCyberGridEnabled(enabled) {
    this.init();
    this.channels.cyberGrid.enabled = Boolean(enabled);
    this.start();
  }

  setNoiseStrength(value) {
    this.init();
    this.channels.noise.enabled = Number(value) > 0;
    this.channels.noise.strength = Math.max(0, Math.min(1, Number(value) || 0));
    this.start();
  }

  setScanlinesEnabled(enabled, strength = this.channels.scanlines.strength) {
    this.init();
    this.channels.scanlines.enabled = Boolean(enabled);
    this.channels.scanlines.strength = Math.max(0, Math.min(0.3, Number(strength) || 0));
    this.start();
  }

  setFilmGrainEnabled(enabled, strength = this.channels.filmGrain.strength) {
    this.init();
    this.channels.filmGrain.enabled = Boolean(enabled);
    this.channels.filmGrain.strength = Math.max(0, Math.min(0.4, Number(strength) || 0));
    this.start();
  }

  setGlitchStrength(value) {
    this.init();
    this.channels.glitch.strength = Math.max(0, Math.min(1, Number(value) || 0));
    this.channels.glitch.enabled = this.channels.glitch.strength > 0;
    this.start();
  }

  getStats() {
    return {
      profile: this.profile,
      width: this.canvas?.width || 0,
      height: this.canvas?.height || 0,
      channels: Object.fromEntries(
        Object.entries(this.channels).map(([name, state]) => [name, { ...state }])
      ),
      owners: animationRuntime.getStats?.().owners?.[LOOP_OWNER] || null
    };
  }

  destroy() {
    animationRuntime.disposeOwner(LOOP_OWNER);
    animationRuntime.disposeOwner(RUNTIME_OWNER);
    this.canvas = null;
    this.ctx = null;
    this.matrixDrops = [];
    this.initialized = false;
  }
}

const ambientCanvasRenderer = new AmbientCanvasRenderer();
window.ambientCanvasRenderer = ambientCanvasRenderer;

export default ambientCanvasRenderer;
