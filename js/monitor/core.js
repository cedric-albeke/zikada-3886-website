/**
 * ZIKADA 3886 PWA Performance Monitoring - Core Engine
 * Event-driven metrics sampling with ring buffers and aggregation
 */

class RingBuffer {
  constructor(size = 1024) {
    this.size = size;
    this.data = new Float32Array(size);
    this.index = 0;
    this.count = 0;
  }

  push(value) {
    this.data[this.index] = value;
    this.index = (this.index + 1) % this.size;
    this.count = Math.min(this.count + 1, this.size);
  }

  getLatest(n = 1) {
    if (n === 1) {
      return this.count > 0 ? this.data[(this.index - 1 + this.size) % this.size] : 0;
    }
    
    const result = new Float32Array(Math.min(n, this.count));
    for (let i = 0; i < result.length; i++) {
      const idx = (this.index - 1 - i + this.size) % this.size;
      result[i] = this.data[idx];
    }
    return result;
  }

  getEWMA(alpha = 0.25) {
    if (this.count === 0) return 0;
    
    let ewma = this.data[(this.index - this.count + this.size) % this.size];
    for (let i = 1; i < this.count; i++) {
      const idx = (this.index - this.count + i + this.size) % this.size;
      ewma = alpha * this.data[idx] + (1 - alpha) * ewma;
    }
    return ewma;
  }

  getStats(windowSize = this.count) {
    const window = Math.min(windowSize, this.count);
    if (window === 0) return { min: 0, max: 0, avg: 0, std: 0 };

    let min = Infinity, max = -Infinity, sum = 0;
    for (let i = 0; i < window; i++) {
      const idx = (this.index - 1 - i + this.size) % this.size;
      const val = this.data[idx];
      min = Math.min(min, val);
      max = Math.max(max, val);
      sum += val;
    }

    const avg = sum / window;
    let sumSq = 0;
    for (let i = 0; i < window; i++) {
      const idx = (this.index - 1 - i + this.size) % this.size;
      const diff = this.data[idx] - avg;
      sumSq += diff * diff;
    }

    return {
      min: min === Infinity ? 0 : min,
      max: max === -Infinity ? 0 : max,
      avg,
      std: Math.sqrt(sumSq / window)
    };
  }

  // Rolling linear regression slope for trend analysis
  getSlope(windowSize = Math.min(60, this.count)) {
    const window = Math.min(windowSize, this.count);
    if (window < 2) return 0;

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < window; i++) {
      const idx = (this.index - window + i + this.size) % this.size;
      const x = i;
      const y = this.data[idx];
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    }

    const n = window;
    const denominator = n * sumXX - sumX * sumX;
    if (Math.abs(denominator) < 1e-10) return 0;

    return (n * sumXY - sumX * sumY) / denominator;
  }
}

class CoreMonitor {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.running = false;
    this.lastFrameTime = 0;
    this.frameCount = 0;

    // Ring buffers for metrics
    this.fpsBuffer = new RingBuffer(1024);
    this.frameTimeBuffer = new RingBuffer(1024);
    this.memoryBuffer = new RingBuffer(512);
    this.longTaskBuffer = new RingBuffer(256);
    
    // Long task observer
    this.longTaskObserver = null;
    this.longTasks = [];
    
    // Memory sampling
    this.lastMemorySample = 0;
    this.memorySampleInterval = 500; // ms
    
    // Animation frame ID
    this.rafId = null;
  }

  start() {
    if (this.running) return;
    this.running = true;

    // Initialize performance observers
    this.setupLongTaskObserver();
    
    // Start sampling loop
    this.lastFrameTime = performance.now();
    this.rafId = requestAnimationFrame(() => this.sampleLoop());
    
    console.log('[ZIKADA][Monitor] Core engine started');
  }

  stop() {
    if (!this.running) return;
    this.running = false;

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.longTaskObserver) {
      this.longTaskObserver.disconnect();
      this.longTaskObserver = null;
    }

    console.log('[ZIKADA][Monitor] Core engine stopped');
  }

  sampleLoop() {
    if (!this.running) return;

    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;

    if (deltaTime > 0) {
      // FPS calculation
      const fps = Math.min(1000 / deltaTime, 144); // Cap at 144 FPS
      this.fpsBuffer.push(fps);
      this.frameTimeBuffer.push(deltaTime);

      // Emit FPS tick
      const fpsStats = this.fpsBuffer.getStats(60); // Last 60 frames
      const ewmaFps = this.fpsBuffer.getEWMA(0.25);
      const derivative = this.calculateFPSDerivative();
      
      this.eventBus?.emit?.('performance:tick', {
        fps: {
          current: fps,
          ewma: ewmaFps,
          min: fpsStats.min,
          max: fpsStats.max,
          derivative
        },
        frame: {
          time: deltaTime,
          p95: this.getFrameTimeP95()
        },
        timestamp: now
      });

      this.frameCount++;
    }

    // Memory sampling (throttled)
    if (now - this.lastMemorySample >= this.memorySampleInterval) {
      this.sampleMemory();
      this.lastMemorySample = now;
    }

    this.lastFrameTime = now;
    this.rafId = requestAnimationFrame(() => this.sampleLoop());
  }

  setupLongTaskObserver() {
    if (!window.PerformanceObserver || !PerformanceObserver.supportedEntryTypes?.includes?.('longtask')) {
      return;
    }

    try {
      this.longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.longTaskBuffer.push(entry.duration);
          this.longTasks.push({
            duration: entry.duration,
            startTime: entry.startTime,
            attribution: entry.attribution?.[0]?.name || 'unknown'
          });

          // Keep only recent long tasks
          if (this.longTasks.length > 50) {
            this.longTasks = this.longTasks.slice(-25);
          }

          // Emit long task event
          this.eventBus?.emit?.('performance:longtask', {
            duration: entry.duration,
            startTime: entry.startTime,
            attribution: entry.attribution?.[0]?.name || 'unknown'
          });
        }
      });

      this.longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (error) {
      console.warn('[ZIKADA][Monitor] Long task observer setup failed:', error);
    }
  }

  sampleMemory() {
    let memoryUsed = 0;

    // Prefer measureUserAgentSpecificMemory if available
    if ('measureUserAgentSpecificMemory' in performance) {
      performance.measureUserAgentSpecificMemory()
        .then((result) => {
          memoryUsed = result.bytes || 0;
          this.processMemorySample(memoryUsed);
        })
        .catch(() => {
          // Fallback to legacy memory API
          this.sampleMemoryLegacy();
        });
    } else {
      this.sampleMemoryLegacy();
    }
  }

  sampleMemoryLegacy() {
    if (performance.memory && performance.memory.usedJSHeapSize) {
      const memoryUsed = performance.memory.usedJSHeapSize;
      this.processMemorySample(memoryUsed);
    }
  }

  processMemorySample(memoryUsed) {
    this.memoryBuffer.push(memoryUsed);
    
    const memoryStats = this.memoryBuffer.getStats(120); // Last 2 minutes at 500ms intervals
    const trend = this.memoryBuffer.getSlope(60); // 30s trend window
    
    // Emit memory sample
    this.eventBus?.emit?.('memory:sample', {
      used: memoryUsed,
      trend: trend,
      stats: memoryStats,
      timestamp: performance.now()
    });

    // Check for potential memory leak
    this.checkMemoryLeak(trend, memoryStats);
  }

  checkMemoryLeak(trend, stats) {
    const leakSlopeThreshold = 1024 * 10; // 10KB/s
    const sustainedDuration = 30000; // 30s
    const lowOscillation = stats.std < (stats.avg * 0.1);

    if (trend > leakSlopeThreshold && lowOscillation) {
      const etaMs = this.estimateMemoryExhaustion(trend, stats.avg);
      
      this.eventBus?.emit?.('predictive:alert', {
        type: 'memory-leak',
        severity: trend > leakSlopeThreshold * 2 ? 'high' : 'medium',
        confidence: Math.min(0.95, 0.5 + (trend / leakSlopeThreshold) * 0.3),
        slope: trend,
        etaMs,
        rationale: `Memory growing at ${Math.round(trend / 1024)}KB/s with low oscillation`
      });
    }
  }

  estimateMemoryExhaustion(slope, current) {
    // Estimate time to reach a concerning memory threshold
    const maxMemoryMB = 512; // Reasonable threshold
    const maxMemoryBytes = maxMemoryMB * 1024 * 1024;
    const remainingBytes = maxMemoryBytes - current;
    
    if (slope <= 0 || remainingBytes <= 0) return Infinity;
    
    return (remainingBytes / slope) * 1000; // Convert to milliseconds
  }

  calculateFPSDerivative() {
    const recentFps = this.fpsBuffer.getLatest(5);
    if (recentFps.length < 2) return 0;

    let derivative = 0;
    for (let i = 1; i < recentFps.length; i++) {
      derivative += recentFps[i - 1] - recentFps[i];
    }
    return derivative / (recentFps.length - 1);
  }

  getFrameTimeP95() {
    const recent = this.frameTimeBuffer.getLatest(100);
    if (recent.length === 0) return 0;

    const sorted = Array.from(recent).sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    return sorted[p95Index] || 0;
  }

  getLongTaskStats() {
    const recentTasks = this.longTasks.slice(-20);
    if (recentTasks.length === 0) {
      return { count: 0, totalDuration: 0, p95Duration: 0 };
    }

    const durations = recentTasks.map(t => t.duration).sort((a, b) => a - b);
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const p95Duration = durations[Math.floor(durations.length * 0.95)] || 0;

    return {
      count: recentTasks.length,
      totalDuration,
      p95Duration,
      tasks: recentTasks
    };
  }

  getSnapshot() {
    const fpsStats = this.fpsBuffer.getStats(60);
    const memoryStats = this.memoryBuffer.getStats(120);
    const longTaskStats = this.getLongTaskStats();

    return {
      fps: {
        current: this.fpsBuffer.getLatest(1),
        ewma: this.fpsBuffer.getEWMA(0.25),
        derivative: this.calculateFPSDerivative(),
        ...fpsStats
      },
      frame: {
        p95: this.getFrameTimeP95(),
        droppedRatio: this.calculateDroppedFrameRatio()
      },
      memory: {
        used: this.memoryBuffer.getLatest(1),
        trend: this.memoryBuffer.getSlope(60),
        ...memoryStats
      },
      longTask: longTaskStats,
      timestamp: performance.now()
    };
  }

  calculateDroppedFrameRatio() {
    const recent = this.frameTimeBuffer.getLatest(60);
    if (recent.length === 0) return 0;

    let droppedFrames = 0;
    for (let i = 0; i < recent.length; i++) {
      if (recent[i] > 16.67) { // Dropped frame threshold
        droppedFrames++;
      }
    }

    return droppedFrames / recent.length;
  }
}

export { CoreMonitor, RingBuffer };