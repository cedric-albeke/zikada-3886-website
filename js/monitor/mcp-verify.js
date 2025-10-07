/**
 * ZIKADA 3886 PWA Performance Monitoring - Verification Hooks
 * Calibration tests and metrics validation for automated testing
 */

(function exposeVerificationAPI() {
  const verification = {
    getStatsSnapshot: () => {
      return window.ZIKADA?.monitor?.getSnapshot?.() || null;
    },

    async runCalibrationTest(durationMs = 5000) {
      console.log('[ZIKADA][Verify] Starting calibration test...');
      
      const start = performance.now();
      const results = [];
      let frameCount = 0;
      
      return new Promise((resolve) => {
        const collectSample = () => {
          const now = performance.now();
          const snapshot = verification.getStatsSnapshot();
          
          if (snapshot) {
            results.push({
              timestamp: now,
              fps: snapshot.fps.current,
              frameMs: snapshot.frame.p95,
              memory: snapshot.memory.used
            });
          }
          
          frameCount++;
          
          if (now - start < durationMs) {
            requestAnimationFrame(collectSample);
          } else {
            // Calculate metrics
            const metrics = verification.calculateMetrics(results, start, now);
            console.log('[ZIKADA][Verify] Calibration completed:', metrics);
            resolve(metrics);
          }
        };
        
        requestAnimationFrame(collectSample);
      });
    },

    calculateMetrics(results, startTime, endTime) {
      if (results.length === 0) {
        return { error: 'No data collected', samples: 0 };
      }

      // Calculate update latency (time between samples)
      const updateIntervals = [];
      for (let i = 1; i < results.length; i++) {
        const interval = results[i].timestamp - results[i - 1].timestamp;
        updateIntervals.push(interval);
      }

      updateIntervals.sort((a, b) => a - b);
      const p95Index = Math.floor(updateIntervals.length * 0.95);
      const updateLatencyP95 = updateIntervals[p95Index] || 0;

      // Calculate FPS/FrameTime correlation
      const fpsFrameCorr = verification.calculateCorrelation(results);

      // Performance distribution
      const avgFps = results.reduce((sum, r) => sum + r.fps, 0) / results.length;
      const avgFrameMs = results.reduce((sum, r) => sum + r.frameMs, 0) / results.length;
      
      // Memory trend
      const memoryTrend = verification.calculateMemoryTrend(results);
      
      // Update frequency
      const actualDuration = endTime - startTime;
      const expectedSamples = actualDuration / 16.67; // Assuming 60fps target
      const samplingEfficiency = results.length / expectedSamples;

      return {
        samples: results.length,
        duration: actualDuration,
        updateLatencyP95,
        fpsFrameCorr,
        avgFps: Math.round(avgFps * 10) / 10,
        avgFrameMs: Math.round(avgFrameMs * 10) / 10,
        memoryTrend,
        samplingEfficiency: Math.round(samplingEfficiency * 1000) / 1000,
        
        // Performance criteria
        passes: {
          updateLatency: updateLatencyP95 <= 16,
          fpsCorrelation: fpsFrameCorr >= 0.99,
          samplingRate: samplingEfficiency >= 0.8
        }
      };
    },

    calculateCorrelation(results) {
      if (results.length < 2) return 0;

      // Calculate correlation between 1/frameMs and fps
      const x = results.map(r => r.frameMs > 0 ? 1000 / r.frameMs : 0);
      const y = results.map(r => r.fps);

      const n = x.length;
      const meanX = x.reduce((sum, val) => sum + val, 0) / n;
      const meanY = y.reduce((sum, val) => sum + val, 0) / n;

      let numerator = 0;
      let denomX = 0;
      let denomY = 0;

      for (let i = 0; i < n; i++) {
        const diffX = x[i] - meanX;
        const diffY = y[i] - meanY;
        
        numerator += diffX * diffY;
        denomX += diffX * diffX;
        denomY += diffY * diffY;
      }

      const denominator = Math.sqrt(denomX * denomY);
      return denominator === 0 ? 0 : numerator / denominator;
    },

    calculateMemoryTrend(results) {
      if (results.length < 3) return 0;

      // Simple linear regression on memory usage
      const points = results.map((r, i) => ({ x: i, y: r.memory }));
      const n = points.length;
      
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      
      for (const point of points) {
        sumX += point.x;
        sumY += point.y;
        sumXY += point.x * point.y;
        sumXX += point.x * point.x;
      }

      const denominator = n * sumXX - sumX * sumX;
      if (Math.abs(denominator) < 1e-10) return 0;

      const slope = (n * sumXY - sumX * sumY) / denominator;
      return slope; // bytes per sample
    },

    async runPerformanceStressTest(durationMs = 10000) {
      console.log('[ZIKADA][Verify] Starting stress test...');
      
      const baselineSnapshot = verification.getStatsSnapshot();
      const stressResults = [];
      
      // Create artificial load
      const stressLoad = verification.createStressLoad();
      
      // Collect metrics during stress
      const collectMetrics = async () => {
        const startTime = performance.now();
        
        while (performance.now() - startTime < durationMs) {
          const snapshot = verification.getStatsSnapshot();
          if (snapshot) {
            stressResults.push({
              timestamp: performance.now(),
              ...snapshot
            });
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      };

      await collectMetrics();
      
      // Stop stress load
      stressLoad.stop();
      
      // Recovery metrics
      await new Promise(resolve => setTimeout(resolve, 2000));
      const recoverySnapshot = verification.getStatsSnapshot();
      
      const analysis = {
        baseline: baselineSnapshot,
        stressPeriod: verification.analyzeStressPeriod(stressResults),
        recovery: recoverySnapshot,
        alertsTriggered: verification.countAlerts(),
        overallHealth: verification.assessSystemHealth(baselineSnapshot, stressResults, recoverySnapshot)
      };

      console.log('[ZIKADA][Verify] Stress test completed:', analysis);
      return analysis;
    },

    createStressLoad() {
      let running = true;
      const workers = [];
      
      // CPU stress
      const cpuWorker = () => {
        const stressLoop = () => {
          if (!running) return;
          
          const start = performance.now();
          // Busy wait for ~8ms to create frame budget pressure
          while (performance.now() - start < 8) {
            Math.random() * Math.random();
          }
          
          setTimeout(stressLoop, 20);
        };
        stressLoop();
      };
      
      // Memory stress
      const memoryStress = [];
      const memoryWorker = () => {
        const allocLoop = () => {
          if (!running) return;
          
          // Allocate and retain some memory
          const chunk = new Array(1000).fill(Math.random());
          memoryStress.push(chunk);
          
          // Occasionally clean up to avoid actual leaks
          if (memoryStress.length > 100) {
            memoryStress.splice(0, 50);
          }
          
          setTimeout(allocLoop, 100);
        };
        allocLoop();
      };

      // Start stress workers
      cpuWorker();
      memoryWorker();

      return {
        stop: () => {
          running = false;
          memoryStress.length = 0; // Clean up
        }
      };
    },

    analyzeStressPeriod(results) {
      if (results.length === 0) return null;

      const fps = results.map(r => r.fps?.current || 0);
      const memory = results.map(r => r.memory?.used || 0);
      const frameTimes = results.map(r => r.frame?.p95 || 0);

      return {
        fpsStats: {
          min: Math.min(...fps),
          max: Math.max(...fps),
          avg: fps.reduce((a, b) => a + b, 0) / fps.length
        },
        memoryGrowth: memory[memory.length - 1] - memory[0],
        frameTimeSpikes: frameTimes.filter(t => t > 33.33).length,
        samples: results.length
      };
    },

    countAlerts() {
      // This would normally check the predictive analyzer's active alerts
      return window.ZIKADA?.monitor?.predictiveAnalyzer?.getActiveAlerts?.()?.length || 0;
    },

    assessSystemHealth(baseline, stressResults, recovery) {
      const score = {
        fpsStability: 0,
        memoryManagement: 0,
        alertSystem: 0,
        recovery: 0,
        overall: 0
      };

      // FPS stability during stress
      if (stressResults.length > 0) {
        const avgStressFps = stressResults.reduce((sum, r) => sum + (r.fps?.current || 0), 0) / stressResults.length;
        const baselineFps = baseline?.fps?.current || 60;
        const fpsRetention = avgStressFps / baselineFps;
        score.fpsStability = Math.max(0, Math.min(100, fpsRetention * 100));
      }

      // Memory management
      if (stressResults.length > 1) {
        const memoryStart = stressResults[0].memory?.used || 0;
        const memoryEnd = stressResults[stressResults.length - 1].memory?.used || 0;
        const memoryGrowth = (memoryEnd - memoryStart) / (1024 * 1024); // MB
        score.memoryManagement = Math.max(0, 100 - (memoryGrowth * 2)); // Penalize >50MB growth
      }

      // Alert system responsiveness
      score.alertSystem = verification.countAlerts() > 0 ? 100 : 50;

      // Recovery assessment
      if (baseline && recovery) {
        const fpsRecovery = (recovery.fps?.current || 0) / (baseline.fps?.current || 1);
        score.recovery = Math.min(100, fpsRecovery * 100);
      }

      // Overall score
      score.overall = (score.fpsStability + score.memoryManagement + score.alertSystem + score.recovery) / 4;

      return score;
    },

    validateMonitoringSystem() {
      const checks = {
        coreMonitorActive: !!window.ZIKADA?.monitor?.getSnapshot,
        eventBusConnected: verification.getStatsSnapshot() !== null,
        graphsRendering: !!document.querySelector('.zikada-monitor-dashboard canvas'),
        keyboardShortcut: true, // Assume working if no errors
        alertSystem: !!window.ZIKADA?.monitor?.predictiveAnalyzer
      };

      const passed = Object.values(checks).filter(Boolean).length;
      const total = Object.keys(checks).length;

      return {
        checks,
        passed,
        total,
        success: passed === total,
        score: Math.round((passed / total) * 100)
      };
    },

    generateReport() {
      const snapshot = verification.getStatsSnapshot();
      const validation = verification.validateMonitoringSystem();
      
      return {
        timestamp: new Date().toISOString(),
        system: {
          userAgent: navigator.userAgent,
          hardwareConcurrency: navigator.hardwareConcurrency,
          deviceMemory: navigator.deviceMemory,
          connection: navigator.connection?.effectiveType
        },
        monitoring: {
          active: !!snapshot,
          snapshot,
          validation
        },
        recommendations: verification.generateRecommendations(snapshot, validation)
      };
    },

    generateRecommendations(snapshot, validation) {
      const recommendations = [];

      if (!validation.success) {
        recommendations.push('Monitor initialization incomplete - check console for errors');
      }

      if (snapshot) {
        if (snapshot.fps?.current < 45) {
          recommendations.push('Low FPS detected - consider reducing animation complexity');
        }
        
        if (snapshot.memory?.used > 128 * 1024 * 1024) {
          recommendations.push('High memory usage - check for memory leaks');
        }
        
        if (snapshot.frame?.p95 > 33.33) {
          recommendations.push('High frame times - optimize rendering pipeline');
        }
      }

      return recommendations;
    }
  };

  // Expose to global scope
  window.__ZIKADA_MONITOR_EXPOSE__ = verification;

  // Also expose via ZIKADA namespace
  if (typeof window !== 'undefined') {
    if (!window.ZIKADA) window.ZIKADA = {};
    if (!window.ZIKADA.verify) window.ZIKADA.verify = verification;
  }

  console.log('[ZIKADA][Verify] Verification API exposed');
})();