// Centralized Performance Bus
// Provides a single source of truth for FPS metrics across pages

import animationRuntime from './runtime/animation-runtime.js';

const PERFORMANCE_BUS_OWNER = 'performance-bus';
const SYSTEM_SAMPLE_INTERVAL_MS = 2000;

class PerformanceBus {
  constructor() {
    this.subscribers = new Set();
    this.metrics = {
      fps: 60,
      avgFPS: 60,
      frameTime: 1000 / 60,
      memoryBytes: 0,
      memoryMB: 0,
      memoryLimitBytes: 0,
      domNodes: 0,
      overlays: 0,
      activeFx: 0,
      activeAnimations: 0,
      runtimeOwners: 0,
      runtimeTokens: 0,
      history: [],
      sampleWindow: 60,
    };
    this._lastTime = performance.now();
    this._frames = 0;
    this._rafToken = null;
    this._lastSystemSampleAt = 0;
    this._tick = this._tick.bind(this);
    this._start();
  }

  _start() {
    animationRuntime.disposeOwner(PERFORMANCE_BUS_OWNER);
    if (typeof requestAnimationFrame !== 'function') return;
    // Use a consistent rAF-based measurement so both pages agree.
    const loop = (now) => {
      this._frames += 1;
      const elapsed = now - this._lastTime;
      if (elapsed >= 1000) {
        const fps = Math.round((this._frames * 1000) / elapsed);
        this.metrics.fps = fps;
        this.metrics.frameTime = fps > 0 ? 1000 / fps : 0;
        this.metrics.history.push(fps);
        if (this.metrics.history.length > this.metrics.sampleWindow) {
          this.metrics.history.shift();
        }
        const sum = this.metrics.history.reduce((a, b) => a + b, 0);
        this.metrics.avgFPS = Math.round(sum / this.metrics.history.length);
        this._frames = 0;
        this._lastTime = now;
        this._emit();
      }
    };
    this._rafToken = animationRuntime.scheduleRafLoop(PERFORMANCE_BUS_OWNER, loop);
  }

  _tick() {
    // unused (kept for future extension)
  }

  _emit() {
    this._sampleSystemMetrics();
    const snapshot = { ...this.metrics };
    // CustomEvent for loose coupling
    try {
      window.dispatchEvent(new CustomEvent('3886:perf', { detail: snapshot }));
    } catch (_) {}
    // Direct subscribers
    this.subscribers.forEach((fn) => {
      try { fn(snapshot); } catch (_) {}
    });
  }

  _sampleSystemMetrics(force = false) {
    const now = performance.now();
    if (!force && now - this._lastSystemSampleAt < SYSTEM_SAMPLE_INTERVAL_MS) return;
    this._lastSystemSampleAt = now;

    try {
      const memory = performance.memory;
      if (memory) {
        this.metrics.memoryBytes = Number(memory.usedJSHeapSize) || 0;
        this.metrics.memoryMB = this.metrics.memoryBytes / (1024 * 1024);
        this.metrics.memoryLimitBytes = Number(memory.jsHeapSizeLimit) || 0;
      }
    } catch (_) {}

    try {
      // One shared structural read replaces competing full-DOM scans in every
      // optimizer and health subsystem.
      this.metrics.domNodes = document.getElementsByTagName('*').length;
      this.metrics.overlays = document.getElementById('fx-root')?.childElementCount || 0;
    } catch (_) {}

    try {
      const triggerStats = window.triggerRuntime?.getStats?.();
      this.metrics.activeFx = Number(triggerStats?.active ?? window.vjReceiver?.activeFx) || 0;
    } catch (_) {}

    try {
      const gsapCount = window.gsap?.globalTimeline?.getChildren?.().length || 0;
      const animeCount = window.animeManager?.instances?.size || 0;
      this.metrics.activeAnimations = gsapCount + animeCount;
    } catch (_) {}

    try {
      const owners = animationRuntime.getStats?.().owners || {};
      const ownerStats = Object.values(owners);
      this.metrics.runtimeOwners = ownerStats.length;
      this.metrics.runtimeTokens = ownerStats.reduce((total, stats) => (
        total + Object.values(stats).reduce((sum, count) => sum + (Number(count) || 0), 0)
      ), 0);
    } catch (_) {}
  }

  subscribe(fn) {
    if (typeof fn === 'function') this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  getFPS() { return this.metrics.fps; }
  getAverageFPS() { return this.metrics.avgFPS; }
  getHistory() { return this.metrics.history.slice(); }

  // Allow remote sources (e.g., main animation page) to feed FPS to the bus
  ingestRemote(fps) {
    const value = Number.isFinite(fps) ? Math.max(0, Math.min(240, Math.round(fps))) : null;
    if (value == null) return;
    this.metrics.fps = value;
    this.metrics.frameTime = value > 0 ? 1000 / value : 0;
    this.metrics.history.push(value);
    if (this.metrics.history.length > this.metrics.sampleWindow) {
      this.metrics.history.shift();
    }
    const sum = this.metrics.history.reduce((a, b) => a + b, 0);
    this.metrics.avgFPS = Math.round(sum / this.metrics.history.length);
    this._emit();
  }

  destroy() {
    animationRuntime.disposeOwner(PERFORMANCE_BUS_OWNER);
    this._rafToken = null;
    this.subscribers.clear();
  }
}

// Singleton
const performanceBus = new PerformanceBus();
window.performanceBus = performanceBus;
export default performanceBus;
