// Centralized Performance Bus
// Provides a single source of truth for FPS metrics across pages

class PerformanceBus {
  constructor() {
    this.subscribers = new Set();
    this.metrics = {
      fps: 60,
      avgFPS: 60,
      history: [],
      sampleWindow: 60,
    };
    this._lastTime = performance.now();
    this._frames = 0;
    this._rafId = null;
    this._tick = this._tick.bind(this);
    this._start();
  }

  _start() {
    // Use a consistent rAF-based measurement so both pages agree.
    const loop = (now) => {
      this._frames += 1;
      const elapsed = now - this._lastTime;
      if (elapsed >= 1000) {
        const fps = Math.round((this._frames * 1000) / elapsed);
        this.metrics.fps = fps;
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
      this._rafId = requestAnimationFrame(loop);
    };
    this._rafId = requestAnimationFrame(loop);
  }

  _tick() {
    // unused (kept for future extension)
  }

  _emit() {
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
    this.metrics.history.push(value);
    if (this.metrics.history.length > this.metrics.sampleWindow) {
      this.metrics.history.shift();
    }
    const sum = this.metrics.history.reduce((a, b) => a + b, 0);
    this.metrics.avgFPS = Math.round(sum / this.metrics.history.length);
    this._emit();
  }
}

// Singleton
const performanceBus = new PerformanceBus();
window.performanceBus = performanceBus;
export default performanceBus;
