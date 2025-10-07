/**
 * ZIKADA 3886 PWA Performance Monitoring - Predictive Alerts
 * Trend analysis with confidence estimation for performance predictions
 */

class PredictiveAnalyzer {
  constructor(eventBus) {
    this.eventBus = eventBus;
    
    // Historical data for trend analysis
    this.fpsHistory = [];
    this.memoryHistory = [];
    this.frameTimeHistory = [];
    
    // Alert state
    this.activeAlerts = new Map();
    this.alertCooldowns = new Map();
    
    // Configuration
    this.config = {
      fps: {
        criticalThreshold: 30,
        warningThreshold: 45,
        trendWindowSize: 30, // seconds
        minDataPoints: 20,
        cooldownMs: 10000 // 10s between similar alerts
      },
      memory: {
        leakThreshold: 1024 * 10, // 10KB/s
        growthWindowSize: 60, // seconds
        minDataPoints: 30,
        cooldownMs: 15000 // 15s between memory alerts
      },
      frame: {
        budgetMs: 16.67, // 60fps budget
        lagThreshold: 33.33, // 30fps equivalent
        trendWindowSize: 20,
        minDataPoints: 15,
        cooldownMs: 8000
      }
    };
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    if (!this.eventBus) return;

    // Listen to performance events
    this.eventBus.on?.('performance:tick', (data) => {
      this.analyzeFPSTrend(data);
      this.analyzeFrameTrend(data);
    });

    this.eventBus.on?.('memory:sample', (data) => {
      this.analyzeMemoryTrend(data);
    });

    this.eventBus.on?.('performance:longtask', (data) => {
      this.analyzeLongTaskTrend(data);
    });
  }

  analyzeFPSTrend(data) {
    const now = performance.now();
    const { fps } = data;

    // Store FPS data point
    this.fpsHistory.push({
      timestamp: now,
      value: fps.current,
      ewma: fps.ewma,
      derivative: fps.derivative
    });

    // Trim history to window size
    const windowMs = this.config.fps.trendWindowSize * 1000;
    this.fpsHistory = this.fpsHistory.filter(point => 
      now - point.timestamp <= windowMs
    );

    if (this.fpsHistory.length < this.config.fps.minDataPoints) {
      return;
    }

    // Analyze trend
    const trend = this.calculateLinearTrend(this.fpsHistory);
    const confidence = this.calculateTrendConfidence(this.fpsHistory, trend);

    // Check for FPS degradation
    if (trend.slope < -0.5 && confidence > 0.7) {
      const currentFPS = fps.ewma;
      const etaMs = this.estimateCrossingTime(
        currentFPS,
        this.config.fps.criticalThreshold,
        trend.slope
      );

      if (etaMs > 0 && etaMs < 30000) { // Within 30 seconds
        this.emitPredictiveAlert({
          type: 'fps-degradation',
          metric: 'fps',
          severity: currentFPS < this.config.fps.warningThreshold ? 'high' : 'medium',
          current: currentFPS,
          threshold: this.config.fps.criticalThreshold,
          etaMs,
          confidence,
          rationale: `FPS declining at ${Math.abs(trend.slope).toFixed(2)}/s, approaching ${this.config.fps.criticalThreshold}fps`,
          trend: trend.slope
        });
      }
    }

    // Check for performance recovery
    if (trend.slope > 0.3 && confidence > 0.6) {
      const activeAlert = this.activeAlerts.get('fps-degradation');
      if (activeAlert) {
        this.emitPredictiveAlert({
          type: 'fps-recovery',
          metric: 'fps',
          severity: 'info',
          current: fps.ewma,
          confidence,
          rationale: `FPS recovering at +${trend.slope.toFixed(2)}/s`,
          trend: trend.slope
        });
      }
    }
  }

  analyzeMemoryTrend(data) {
    const now = performance.now();
    const { used, trend: slope, stats } = data;

    this.memoryHistory.push({
      timestamp: now,
      value: used,
      slope,
      stats
    });

    // Trim to window size
    const windowMs = this.config.memory.growthWindowSize * 1000;
    this.memoryHistory = this.memoryHistory.filter(point => 
      now - point.timestamp <= windowMs
    );

    if (this.memoryHistory.length < this.config.memory.minDataPoints) {
      return;
    }

    // Calculate trend confidence
    const slopeHistory = this.memoryHistory.map(p => p.slope);
    const avgSlope = slopeHistory.reduce((sum, s) => sum + s, 0) / slopeHistory.length;
    const slopeVariance = slopeHistory.reduce((sum, s) => sum + Math.pow(s - avgSlope, 2), 0) / slopeHistory.length;
    const confidence = Math.max(0, 1 - (slopeVariance / Math.pow(avgSlope || 1, 2)));

    // Memory leak detection
    if (avgSlope > this.config.memory.leakThreshold && confidence > 0.6) {
      const currentMemoryMB = used / (1024 * 1024);
      const growthRate = avgSlope / 1024; // KB/s
      
      // Estimate time to concerning memory usage
      const concerningMemoryMB = 256; // 256MB threshold
      const etaMs = ((concerningMemoryMB - currentMemoryMB) * 1024 * 1024 / avgSlope) * 1000;

      if (etaMs > 0 && etaMs < 120000) { // Within 2 minutes
        this.emitPredictiveAlert({
          type: 'memory-leak',
          metric: 'memory',
          severity: avgSlope > this.config.memory.leakThreshold * 2 ? 'high' : 'medium',
          current: currentMemoryMB,
          etaMs,
          confidence,
          rationale: `Memory growing at ${growthRate.toFixed(1)}KB/s with sustained trend`,
          trend: avgSlope
        });
      }
    }

    // Memory pressure warning
    const memoryMB = used / (1024 * 1024);
    if (memoryMB > 128 && avgSlope > this.config.memory.leakThreshold * 0.5) {
      this.emitPredictiveAlert({
        type: 'memory-pressure',
        metric: 'memory',
        severity: 'medium',
        current: memoryMB,
        confidence: Math.min(confidence, 0.8),
        rationale: `High memory usage (${memoryMB.toFixed(1)}MB) with growth trend`,
        trend: avgSlope
      });
    }
  }

  analyzeFrameTrend(data) {
    const now = performance.now();
    const { frame } = data;

    this.frameTimeHistory.push({
      timestamp: now,
      value: frame.time,
      p95: frame.p95 || frame.time
    });

    // Trim to window size
    const windowMs = this.config.frame.trendWindowSize * 1000;
    this.frameTimeHistory = this.frameTimeHistory.filter(point => 
      now - point.timestamp <= windowMs
    );

    if (this.frameTimeHistory.length < this.config.frame.minDataPoints) {
      return;
    }

    // Analyze P95 frame time trend
    const p95History = this.frameTimeHistory.map(p => ({ 
      timestamp: p.timestamp, 
      value: p.p95 
    }));
    
    const trend = this.calculateLinearTrend(p95History);
    const confidence = this.calculateTrendConfidence(p95History, trend);

    // Check for frame time degradation
    if (trend.slope > 0.2 && confidence > 0.65) {
      const currentP95 = frame.p95 || frame.time;
      const etaMs = this.estimateCrossingTime(
        currentP95,
        this.config.frame.lagThreshold,
        trend.slope
      );

      if (etaMs > 0 && etaMs < 20000) { // Within 20 seconds
        this.emitPredictiveAlert({
          type: 'frame-lag',
          metric: 'frame-time',
          severity: currentP95 > this.config.frame.budgetMs * 1.5 ? 'high' : 'medium',
          current: currentP95,
          threshold: this.config.frame.lagThreshold,
          etaMs,
          confidence,
          rationale: `Frame time increasing at ${trend.slope.toFixed(2)}ms/s`,
          trend: trend.slope
        });
      }
    }
  }

  analyzeLongTaskTrend(data) {
    // Simple frequency-based analysis for long tasks
    const now = performance.now();
    
    if (!this.longTaskFrequency) {
      this.longTaskFrequency = [];
    }

    this.longTaskFrequency.push({
      timestamp: now,
      duration: data.duration
    });

    // Keep last 30 seconds of long tasks
    this.longTaskFrequency = this.longTaskFrequency.filter(task => 
      now - task.timestamp <= 30000
    );

    // Alert if too many long tasks in a short period
    const recentTasks = this.longTaskFrequency.filter(task => 
      now - task.timestamp <= 10000
    );

    if (recentTasks.length >= 5) {
      const avgDuration = recentTasks.reduce((sum, task) => sum + task.duration, 0) / recentTasks.length;
      
      this.emitPredictiveAlert({
        type: 'long-task-cluster',
        metric: 'long-tasks',
        severity: avgDuration > 100 ? 'high' : 'medium',
        current: recentTasks.length,
        confidence: 0.85,
        rationale: `${recentTasks.length} long tasks in 10s (avg: ${avgDuration.toFixed(1)}ms)`,
        trend: recentTasks.length
      });
    }
  }

  calculateLinearTrend(dataPoints) {
    if (dataPoints.length < 2) {
      return { slope: 0, intercept: 0, rSquared: 0 };
    }

    const n = dataPoints.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    const startTime = dataPoints[0].timestamp;

    for (const point of dataPoints) {
      const x = (point.timestamp - startTime) / 1000; // Convert to seconds
      const y = point.value;
      
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    }

    const denominator = n * sumXX - sumX * sumX;
    if (Math.abs(denominator) < 1e-10) {
      return { slope: 0, intercept: sumY / n, rSquared: 0 };
    }

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R²
    const yMean = sumY / n;
    let ssRes = 0, ssTot = 0;
    
    for (const point of dataPoints) {
      const x = (point.timestamp - startTime) / 1000;
      const yPred = slope * x + intercept;
      ssRes += Math.pow(point.value - yPred, 2);
      ssTot += Math.pow(point.value - yMean, 2);
    }

    const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;

    return { slope, intercept, rSquared };
  }

  calculateTrendConfidence(dataPoints, trend) {
    if (dataPoints.length < 3) return 0;

    // Base confidence on R² and data consistency
    let baseConfidence = Math.max(0, trend.rSquared);
    
    // Reduce confidence if there are outliers
    const startTime = dataPoints[0].timestamp;
    let outliers = 0;
    
    for (const point of dataPoints) {
      const x = (point.timestamp - startTime) / 1000;
      const predicted = trend.slope * x + trend.intercept;
      const error = Math.abs(point.value - predicted);
      const relativeError = error / (Math.abs(predicted) + 1);
      
      if (relativeError > 0.3) {
        outliers++;
      }
    }

    const outlierPenalty = outliers / dataPoints.length;
    const finalConfidence = baseConfidence * (1 - outlierPenalty * 0.5);
    
    // Boost confidence if we have more data points
    const dataBonus = Math.min(0.2, dataPoints.length / 100);
    
    return Math.min(0.95, Math.max(0, finalConfidence + dataBonus));
  }

  estimateCrossingTime(current, threshold, slope) {
    if (slope === 0) return Infinity;
    
    const difference = threshold - current;
    const timeSeconds = difference / slope;
    
    if (timeSeconds <= 0) return 0;
    
    return timeSeconds * 1000; // Convert to milliseconds
  }

  emitPredictiveAlert(alert) {
    const alertKey = alert.type;
    const now = performance.now();

    // Check cooldown
    const lastAlert = this.alertCooldowns.get(alertKey);
    const cooldown = this.config[alert.metric]?.cooldownMs || 10000;
    
    if (lastAlert && now - lastAlert < cooldown) {
      return; // Still in cooldown
    }

    // Update cooldown
    this.alertCooldowns.set(alertKey, now);

    // Store active alert
    this.activeAlerts.set(alertKey, {
      ...alert,
      timestamp: now
    });

    // Emit alert event
    this.eventBus?.emit?.('predictive:alert', {
      ...alert,
      timestamp: now,
      id: `${alertKey}_${now}`
    });

    console.warn(`[ZIKADA][Predictive] ${alert.severity.toUpperCase()}: ${alert.rationale}`);

    // Auto-clear recovery alerts
    if (alert.type.includes('recovery')) {
      setTimeout(() => {
        this.activeAlerts.delete(alertKey);
      }, 5000);
    }
  }

  getActiveAlerts() {
    const now = performance.now();
    const alerts = [];

    for (const [key, alert] of this.activeAlerts) {
      // Auto-expire old alerts
      if (now - alert.timestamp > 60000) { // 1 minute
        this.activeAlerts.delete(key);
        continue;
      }

      alerts.push(alert);
    }

    return alerts;
  }

  clearAlert(alertType) {
    this.activeAlerts.delete(alertType);
  }

  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
  }

  getStats() {
    return {
      activeAlerts: this.activeAlerts.size,
      fpsHistorySize: this.fpsHistory.length,
      memoryHistorySize: this.memoryHistory.length,
      frameHistorySize: this.frameTimeHistory.length,
      longTaskFrequencySize: this.longTaskFrequency?.length || 0
    };
  }
}

export { PredictiveAnalyzer };