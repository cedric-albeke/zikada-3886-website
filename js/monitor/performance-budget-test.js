/**
 * ZIKADA 3886 Performance Budget Verification Script
 * Automated testing for <16ms update latency and performance overhead verification
 */

class PerformanceBudgetVerifier {
    constructor() {
        this.results = {
            passed: false,
            updateLatencyP95: 0,
            fpsFrameCorrelation: 0,
            memoryOverhead: 0,
            renderingOverhead: 0,
            samplingEfficiency: 0,
            recommendations: []
        };
    }

    async runFullVerification(durationMs = 10000) {
        console.log('🔍 Starting Performance Budget Verification...');
        
        const startTime = performance.now();
        
        // Phase 1: Baseline measurement (without dashboard)
        const baseline = await this.measureBaseline(durationMs / 3);
        
        // Phase 2: Dashboard enabled measurement
        const withDashboard = await this.measureWithDashboard(durationMs / 3);
        
        // Phase 3: Stress test measurement
        const stressTest = await this.measureUnderStress(durationMs / 3);
        
        // Calculate results
        this.results = this.calculateResults(baseline, withDashboard, stressTest);
        
        const totalTime = performance.now() - startTime;
        console.log(`✅ Performance Budget Verification completed in ${totalTime.toFixed(1)}ms`);
        
        return this.results;
    }

    async measureBaseline(durationMs) {
        console.log('📊 Measuring baseline performance...');
        
        return new Promise(resolve => {
            const startTime = performance.now();
            const samples = [];
            let frameCount = 0;
            
            const measureFrame = () => {
                const now = performance.now();
                const deltaTime = now - (samples.length > 0 ? samples[samples.length - 1].timestamp : startTime);
                
                samples.push({
                    timestamp: now,
                    deltaTime,
                    memoryUsed: performance.memory?.usedJSHeapSize || 0
                });
                
                frameCount++;
                
                if (now - startTime < durationMs) {
                    requestAnimationFrame(measureFrame);
                } else {
                    resolve({
                        samples,
                        frameCount,
                        duration: now - startTime,
                        avgDeltaTime: samples.reduce((sum, s) => sum + s.deltaTime, 0) / samples.length,
                        memoryBaseline: samples[0]?.memoryUsed || 0
                    });
                }
            };
            
            requestAnimationFrame(measureFrame);
        });
    }

    async measureWithDashboard(durationMs) {
        console.log('🖥️ Measuring performance with dashboard enabled...');
        
        // Ensure dashboard is running
        if (window.ZIKADA?.monitor?.getSnapshot) {
            const dashboardActive = !!window.ZIKADA.monitor.getSnapshot();
            if (!dashboardActive) {
                console.warn('⚠️ Dashboard not active, measurements may be inaccurate');
            }
        }

        return new Promise(resolve => {
            const startTime = performance.now();
            const samples = [];
            const dashboardSamples = [];
            let frameCount = 0;
            
            const measureFrame = () => {
                const now = performance.now();
                const deltaTime = now - (samples.length > 0 ? samples[samples.length - 1].timestamp : startTime);
                
                // Measure dashboard performance
                const dashboardStart = performance.now();
                const snapshot = window.ZIKADA?.monitor?.getSnapshot?.();
                const dashboardTime = performance.now() - dashboardStart;
                
                samples.push({
                    timestamp: now,
                    deltaTime,
                    memoryUsed: performance.memory?.usedJSHeapSize || 0,
                    dashboardTime
                });
                
                if (snapshot) {
                    dashboardSamples.push({
                        timestamp: now,
                        fps: snapshot.fps?.current || 0,
                        frameP95: snapshot.frame?.p95 || 0,
                        memory: snapshot.memory?.used || 0
                    });
                }
                
                frameCount++;
                
                if (now - startTime < durationMs) {
                    requestAnimationFrame(measureFrame);
                } else {
                    // Calculate update intervals for dashboard
                    const updateIntervals = [];
                    for (let i = 1; i < dashboardSamples.length; i++) {
                        const interval = dashboardSamples[i].timestamp - dashboardSamples[i - 1].timestamp;
                        updateIntervals.push(interval);
                    }
                    
                    updateIntervals.sort((a, b) => a - b);
                    const p95Index = Math.floor(updateIntervals.length * 0.95);
                    const updateLatencyP95 = updateIntervals[p95Index] || 0;
                    
                    resolve({
                        samples,
                        dashboardSamples,
                        frameCount,
                        duration: now - startTime,
                        updateLatencyP95,
                        avgDashboardTime: samples.reduce((sum, s) => sum + (s.dashboardTime || 0), 0) / samples.length
                    });
                }
            };
            
            requestAnimationFrame(measureFrame);
        });
    }

    async measureUnderStress(durationMs) {
        console.log('💥 Measuring performance under stress conditions...');
        
        // Create synthetic load
        const stressWorker = this.createStressLoad();
        
        try {
            return await new Promise(resolve => {
                const startTime = performance.now();
                const samples = [];
                let frameCount = 0;
                
                const measureFrame = () => {
                    const now = performance.now();
                    const deltaTime = now - (samples.length > 0 ? samples[samples.length - 1].timestamp : startTime);
                    
                    // Measure under load
                    const measureStart = performance.now();
                    const snapshot = window.ZIKADA?.monitor?.getSnapshot?.();
                    const measureTime = performance.now() - measureStart;
                    
                    samples.push({
                        timestamp: now,
                        deltaTime,
                        measureTime,
                        memoryUsed: performance.memory?.usedJSHeapSize || 0,
                        fps: snapshot?.fps?.current || 0
                    });
                    
                    frameCount++;
                    
                    if (now - startTime < durationMs) {
                        requestAnimationFrame(measureFrame);
                    } else {
                        resolve({
                            samples,
                            frameCount,
                            duration: now - startTime,
                            avgMeasureTime: samples.reduce((sum, s) => sum + s.measureTime, 0) / samples.length
                        });
                    }
                };
                
                requestAnimationFrame(measureFrame);
            });
        } finally {
            stressWorker.stop();
        }
    }

    createStressLoad() {
        let running = true;
        const allocations = [];
        
        // CPU stress
        const cpuStress = () => {
            if (!running) return;
            const start = performance.now();
            while (performance.now() - start < 5) {
                Math.random() * Math.random();
            }
            setTimeout(cpuStress, 10);
        };
        
        // Memory pressure
        const memoryStress = () => {
            if (!running) return;
            allocations.push(new Array(1000).fill(Math.random()));
            if (allocations.length > 50) {
                allocations.splice(0, 25);
            }
            setTimeout(memoryStress, 50);
        };
        
        cpuStress();
        memoryStress();
        
        return {
            stop: () => {
                running = false;
                allocations.length = 0;
            }
        };
    }

    calculateResults(baseline, withDashboard, stressTest) {
        const results = {
            passed: false,
            updateLatencyP95: withDashboard.updateLatencyP95,
            fpsFrameCorrelation: this.calculateFPSFrameCorrelation(withDashboard.dashboardSamples),
            memoryOverhead: this.calculateMemoryOverhead(baseline, withDashboard),
            renderingOverhead: withDashboard.avgDashboardTime,
            samplingEfficiency: withDashboard.dashboardSamples.length / (withDashboard.duration / 16.67),
            stressResilience: this.calculateStressResilience(withDashboard, stressTest),
            recommendations: []
        };

        // Performance budget checks
        const budgetChecks = {
            updateLatency: results.updateLatencyP95 <= 16,
            fpsCorrelation: results.fpsFrameCorrelation >= 0.99,
            memoryOverhead: results.memoryOverhead <= 2 * 1024 * 1024, // 2MB max
            renderingOverhead: results.renderingOverhead <= 1, // 1ms max per frame
            samplingEfficiency: results.samplingEfficiency >= 0.8, // 80% sampling rate
            stressResilience: results.stressResilience >= 0.7 // 70% performance retention
        };

        results.passed = Object.values(budgetChecks).every(check => check);
        results.budgetChecks = budgetChecks;

        // Generate recommendations
        if (!budgetChecks.updateLatency) {
            results.recommendations.push(`Update latency (${results.updateLatencyP95.toFixed(1)}ms) exceeds 16ms budget`);
        }
        if (!budgetChecks.fpsCorrelation) {
            results.recommendations.push(`FPS correlation (${results.fpsFrameCorrelation.toFixed(3)}) below 0.99 target`);
        }
        if (!budgetChecks.memoryOverhead) {
            results.recommendations.push(`Memory overhead (${(results.memoryOverhead / 1024 / 1024).toFixed(1)}MB) exceeds 2MB budget`);
        }
        if (!budgetChecks.renderingOverhead) {
            results.recommendations.push(`Rendering overhead (${results.renderingOverhead.toFixed(2)}ms) exceeds 1ms budget`);
        }

        return results;
    }

    calculateFPSFrameCorrelation(samples) {
        if (samples.length < 2) return 0;

        const x = samples.map(s => s.frameP95 > 0 ? 1000 / s.frameP95 : 0);
        const y = samples.map(s => s.fps);

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
        return denominator === 0 ? 0 : Math.abs(numerator / denominator);
    }

    calculateMemoryOverhead(baseline, withDashboard) {
        const baselineMemory = baseline.samples[baseline.samples.length - 1]?.memoryUsed || 0;
        const dashboardMemory = withDashboard.samples[withDashboard.samples.length - 1]?.memoryUsed || 0;
        return Math.max(0, dashboardMemory - baselineMemory);
    }

    calculateStressResilience(normal, stress) {
        if (normal.samples.length === 0 || stress.samples.length === 0) return 0;
        
        const normalAvgTime = normal.avgDashboardTime;
        const stressAvgTime = stress.avgMeasureTime;
        
        if (normalAvgTime === 0) return 1;
        
        return Math.max(0, Math.min(1, normalAvgTime / stressAvgTime));
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            passed: this.results.passed,
            summary: {
                updateLatencyP95: `${this.results.updateLatencyP95.toFixed(1)}ms`,
                fpsFrameCorrelation: this.results.fpsFrameCorrelation.toFixed(3),
                memoryOverhead: `${(this.results.memoryOverhead / 1024 / 1024).toFixed(1)}MB`,
                renderingOverhead: `${this.results.renderingOverhead.toFixed(2)}ms`,
                samplingEfficiency: `${(this.results.samplingEfficiency * 100).toFixed(1)}%`,
                stressResilience: `${(this.results.stressResilience * 100).toFixed(1)}%`
            },
            budgetChecks: this.results.budgetChecks,
            recommendations: this.results.recommendations,
            verdict: this.results.passed ? 'PASS ✅' : 'FAIL ❌'
        };

        console.log('\n📊 Performance Budget Verification Report');
        console.log('==========================================');
        console.log(`Status: ${report.verdict}`);
        console.log('\nMetrics:');
        Object.entries(report.summary).forEach(([key, value]) => {
            const passed = report.budgetChecks[key.replace(/([A-Z])/g, (match, letter) => letter.toLowerCase())];
            const status = passed ? '✅' : '❌';
            console.log(`  ${key}: ${value} ${status}`);
        });

        if (report.recommendations.length > 0) {
            console.log('\nRecommendations:');
            report.recommendations.forEach(rec => console.log(`  ⚠️ ${rec}`));
        }
        console.log('==========================================\n');

        return report;
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.PerformanceBudgetVerifier = PerformanceBudgetVerifier;
}

export { PerformanceBudgetVerifier };