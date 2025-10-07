/**
 * Predictive Performance Alerting Test Suite for ZIKADA 3886
 * 
 * Comprehensive testing for:
 * - FPS derivative calculations and trend detection
 * - Pattern recognition accuracy
 * - Alert threshold validation
 * - Predictive accuracy measurement
 * - Performance ladder integration
 * - Mathematical model validation
 */

import PredictiveTrendAnalysis from './predictive-trend-analysis.js';

class PredictiveAlertingTestSuite {
    constructor() {
        this.testResults = [];
        this.testStats = {
            total: 0,
            passed: 0,
            failed: 0,
            accuracy: 0
        };
        
        // Test configurations
        this.testScenarios = {
            gradualDecline: {
                name: 'Gradual FPS Decline',
                pattern: 'linear_decline',
                duration: 30000, // 30 seconds
                startFPS: 60,
                endFPS: 30,
                expectedAlerts: ['warning', 'critical']
            },
            
            suddenDrop: {
                name: 'Sudden FPS Drop',
                pattern: 'step_decline',
                duration: 5000, // 5 seconds
                startFPS: 60,
                endFPS: 20,
                expectedAlerts: ['critical', 'emergency']
            },
            
            periodicFrameDrops: {
                name: 'Periodic Frame Drops',
                pattern: 'periodic_drops',
                duration: 60000, // 1 minute
                baseFPS: 60,
                dropMagnitude: 20,
                dropFrequency: 5000, // Every 5 seconds
                expectedAlerts: ['warning']
            },
            
            noiseWithTrend: {
                name: 'Noisy Data with Downward Trend',
                pattern: 'noisy_decline',
                duration: 45000, // 45 seconds
                startFPS: 60,
                endFPS: 35,
                noiseLevel: 8,
                expectedAlerts: ['warning', 'critical']
            },
            
            falseAlarmScenario: {
                name: 'False Alarm Test',
                pattern: 'temporary_drop',
                duration: 20000, // 20 seconds
                baseFPS: 60,
                dropDuration: 3000, // 3 second drop
                dropMagnitude: 25,
                expectedAlerts: [],
                shouldRollback: true
            },
            
            stablePerformance: {
                name: 'Stable Performance',
                pattern: 'stable',
                duration: 30000, // 30 seconds
                baseFPS: 60,
                noiseLevel: 3,
                expectedAlerts: []
            }
        };
        
        console.log('🧪 Predictive Alerting Test Suite initialized');
    }
    
    /**
     * Run all test scenarios
     */
    async runAllTests() {
        console.log('🧪 Starting comprehensive test suite...');
        
        // Reset test results
        this.testResults = [];
        this.testStats = { total: 0, passed: 0, failed: 0, accuracy: 0 };
        
        // Run individual test categories
        await this.testDerivativeCalculations();
        await this.testTrendDetection();
        await this.testPatternRecognition();
        await this.testAlertThresholds();
        await this.testPredictiveAccuracy();
        await this.testPerformanceScenarios();
        await this.testMathematicalModels();
        
        // Generate final report
        this.generateTestReport();
        
        return this.testStats;
    }
    
    /**
     * Test FPS derivative calculations
     */
    async testDerivativeCalculations() {
        console.log('🧪 Testing derivative calculations...');
        
        const trendAnalysis = new PredictiveTrendAnalysis();
        const testData = this.generateTestData('linear_decline', 10000, 60, 30);
        
        // Test first derivative calculation
        let derivativeResults = [];
        for (const dataPoint of testData) {
            const analysis = trendAnalysis.processData(dataPoint.fps, dataPoint.timestamp);
            if (analysis.derivatives && analysis.derivatives.derivatives.length > 0) {
                derivativeResults.push(analysis.derivatives.derivatives[0]);
            }
        }
        
        // Validate derivative calculations
        const expectedDerivative = -3; // ~-3 FPS/second for this test
        const actualDerivatives = derivativeResults
            .filter(d => d.order === 1)
            .map(d => d.value);
        
        const avgDerivative = actualDerivatives.length > 0 ?
            actualDerivatives.reduce((sum, val) => sum + val, 0) / actualDerivatives.length : 0;
        
        const derivativeAccuracy = Math.abs(avgDerivative - expectedDerivative) < 1;
        
        this.addTestResult('Derivative Calculation', {
            passed: derivativeAccuracy,
            expected: expectedDerivative,
            actual: avgDerivative.toFixed(2),
            details: `${actualDerivatives.length} derivative calculations performed`
        });
        
        // Test second derivative (acceleration)
        const secondDerivatives = derivativeResults
            .filter(d => d.order === 2)
            .map(d => d.value);
        
        const avgSecondDerivative = secondDerivatives.length > 0 ?
            secondDerivatives.reduce((sum, val) => sum + val, 0) / secondDerivatives.length : 0;
        
        // For linear decline, second derivative should be near zero
        const secondDerivativeAccuracy = Math.abs(avgSecondDerivative) < 0.5;
        
        this.addTestResult('Second Derivative Calculation', {
            passed: secondDerivativeAccuracy,
            expected: '~0 (linear trend)',
            actual: avgSecondDerivative.toFixed(3),
            details: 'Testing acceleration detection'
        });
    }
    
    /**
     * Test trend detection algorithms
     */
    async testTrendDetection() {
        console.log('🧪 Testing trend detection...');
        
        // Test different trend types
        const trendTests = [
            { pattern: 'linear_decline', expected: 'decreasing', duration: 15000, startFPS: 60, endFPS: 40 },
            { pattern: 'linear_incline', expected: 'increasing', duration: 15000, startFPS: 40, endFPS: 60 },
            { pattern: 'stable', expected: 'stable', duration: 15000, baseFPS: 60 }
        ];
        
        for (const test of trendTests) {
            const trendAnalysis = new PredictiveTrendAnalysis();
            const testData = this.generateTestData(test.pattern, test.duration, test.startFPS, test.endFPS, test.baseFPS);
            
            let finalTrend = 'stable';
            for (const dataPoint of testData) {
                const analysis = trendAnalysis.processData(dataPoint.fps, dataPoint.timestamp);
                if (analysis.trend) {
                    finalTrend = analysis.trend.direction;
                }
            }
            
            this.addTestResult(`Trend Detection: ${test.pattern}`, {
                passed: finalTrend === test.expected,
                expected: test.expected,
                actual: finalTrend,
                details: `${testData.length} data points analyzed`
            });
        }
    }
    
    /**
     * Test pattern recognition system
     */
    async testPatternRecognition() {
        console.log('🧪 Testing pattern recognition...');
        
        const trendAnalysis = new PredictiveTrendAnalysis();
        
        // Test periodic pattern detection
        const periodicData = this.generateTestData('periodic_drops', 30000, null, null, 60, {
            dropMagnitude: 15,
            dropFrequency: 3000
        });
        
        let detectedPatterns = [];
        for (const dataPoint of periodicData) {
            const analysis = trendAnalysis.processData(dataPoint.fps, dataPoint.timestamp);
            if (analysis.patterns && analysis.patterns.length > 0) {
                detectedPatterns = analysis.patterns;
            }
        }
        
        const periodicPatternsFound = detectedPatterns.some(p => p.type === 'periodic');
        
        this.addTestResult('Periodic Pattern Detection', {
            passed: periodicPatternsFound,
            expected: 'Periodic pattern detected',
            actual: periodicPatternsFound ? 'Pattern detected' : 'No pattern detected',
            details: `${detectedPatterns.length} patterns found`
        });
        
        // Test anomaly detection
        const anomalyData = this.generateAnomalyTestData();
        for (const dataPoint of anomalyData) {
            trendAnalysis.processData(dataPoint.fps, dataPoint.timestamp);
        }
        
        const finalAnalysis = trendAnalysis.getCurrentAnalysis();
        const anomaliesDetected = finalAnalysis.patterns.some(p => p.type === 'anomaly');
        
        this.addTestResult('Anomaly Detection', {
            passed: anomaliesDetected,
            expected: 'Anomalies detected',
            actual: anomaliesDetected ? 'Anomalies found' : 'No anomalies detected',
            details: `Final anomaly patterns: ${finalAnalysis.patterns.filter(p => p.type === 'anomaly').length}`
        });
    }
    
    /**
     * Test alert threshold system
     */
    async testAlertThresholds() {
        console.log('🧪 Testing alert thresholds...');
        
        // Mock predictive alerting system
        const alertSystem = this.createMockAlertSystem();
        const testScenarios = [
            { derivative: -2, expectedLevel: 'none' },
            { derivative: -4, expectedLevel: 'warning' },
            { derivative: -10, expectedLevel: 'critical' },
            { derivative: -20, expectedLevel: 'emergency' }
        ];
        
        for (const scenario of testScenarios) {
            const alertLevel = this.simulateAlertCheck(alertSystem, scenario.derivative);
            
            this.addTestResult(`Alert Threshold: ${scenario.derivative} FPS/s`, {
                passed: alertLevel === scenario.expectedLevel,
                expected: scenario.expectedLevel,
                actual: alertLevel,
                details: `Derivative: ${scenario.derivative} FPS/second`
            });
        }
    }
    
    /**
     * Test predictive accuracy with real scenarios
     */
    async testPredictiveAccuracy() {
        console.log('🧪 Testing predictive accuracy...');
        
        const accuracyTests = [];
        
        for (const [scenarioName, scenario] of Object.entries(this.testScenarios)) {
            const result = await this.testPredictionScenario(scenario);
            accuracyTests.push(result);
            
            this.addTestResult(`Prediction Accuracy: ${scenario.name}`, {
                passed: result.accuracy > 0.7, // 70% accuracy threshold
                expected: '>70% accuracy',
                actual: `${(result.accuracy * 100).toFixed(1)}%`,
                details: `${result.correctPredictions}/${result.totalPredictions} correct`
            });
        }
        
        // Calculate overall accuracy
        const overallAccuracy = accuracyTests.reduce((sum, test) => sum + test.accuracy, 0) / accuracyTests.length;
        
        this.addTestResult('Overall Prediction Accuracy', {
            passed: overallAccuracy > 0.65, // 65% overall threshold
            expected: '>65% overall accuracy',
            actual: `${(overallAccuracy * 100).toFixed(1)}%`,
            details: `Average across ${accuracyTests.length} scenarios`
        });
    }
    
    /**
     * Test specific performance scenarios
     */
    async testPerformanceScenarios() {
        console.log('🧪 Testing performance scenarios...');
        
        for (const [scenarioName, scenario] of Object.entries(this.testScenarios)) {
            const testData = this.generateScenarioData(scenario);
            const alerts = await this.simulateAlertingSystem(testData, scenario);
            
            // Check if expected alerts were triggered
            const expectedAlerts = scenario.expectedAlerts || [];
            const actualAlerts = alerts.map(a => a.level);
            
            const alertsMatch = expectedAlerts.length === 0 ? 
                actualAlerts.length === 0 :
                expectedAlerts.every(expected => actualAlerts.includes(expected));
            
            this.addTestResult(`Scenario: ${scenario.name}`, {
                passed: alertsMatch,
                expected: expectedAlerts.length > 0 ? expectedAlerts.join(', ') : 'No alerts',
                actual: actualAlerts.length > 0 ? actualAlerts.join(', ') : 'No alerts',
                details: `${alerts.length} total alerts triggered`
            });
        }
    }
    
    /**
     * Test mathematical model accuracy
     */
    async testMathematicalModels() {
        console.log('🧪 Testing mathematical models...');
        
        const trendAnalysis = new PredictiveTrendAnalysis();
        
        // Test regression model fitting
        const regressionData = this.generateTestData('polynomial', 20000, 60, 30);
        
        let finalModel = null;
        for (const dataPoint of regressionData) {
            const analysis = trendAnalysis.processData(dataPoint.fps, dataPoint.timestamp);
            if (analysis.regression) {
                finalModel = analysis.regression;
            }
        }
        
        const regressionQuality = finalModel ? finalModel.quality > 0.8 : false;
        
        this.addTestResult('Regression Model Quality', {
            passed: regressionQuality,
            expected: 'R² > 0.8',
            actual: finalModel ? `R² = ${finalModel.quality.toFixed(3)}` : 'No model',
            details: finalModel ? `Degree ${finalModel.degree} polynomial` : 'Model fitting failed'
        });
        
        // Test prediction accuracy
        if (finalModel) {
            const prediction = trendAnalysis.predictFuturePerformance(5); // 5 seconds ahead
            const predictionValid = prediction && prediction.predictions.length > 0;
            
            this.addTestResult('Future Performance Prediction', {
                passed: predictionValid,
                expected: 'Valid predictions generated',
                actual: predictionValid ? `${prediction.predictions.length} predictions` : 'No predictions',
                details: predictionValid ? `Confidence: ${(prediction.confidence * 100).toFixed(1)}%` : 'Prediction failed'
            });
        }
        
        // Test noise profile accuracy
        const finalAnalysis = trendAnalysis.getCurrentAnalysis();
        const noiseProfileValid = finalAnalysis.noise && 
                                 typeof finalAnalysis.noise.variance === 'number' &&
                                 finalAnalysis.noise.variance >= 0;
        
        this.addTestResult('Noise Profile Calculation', {
            passed: noiseProfileValid,
            expected: 'Valid noise profile',
            actual: noiseProfileValid ? `σ² = ${finalAnalysis.noise.variance.toFixed(3)}` : 'Invalid profile',
            details: noiseProfileValid ? `Mean: ${finalAnalysis.noise.mean.toFixed(3)}` : 'Calculation failed'
        });
    }
    
    /**
     * Generate test data for various patterns
     */
    generateTestData(pattern, duration, startFPS = 60, endFPS = 30, baseFPS = 60, options = {}) {
        const data = [];
        const intervalMs = 16.67; // ~60 FPS intervals
        const steps = Math.floor(duration / intervalMs);
        
        for (let i = 0; i < steps; i++) {
            const progress = i / (steps - 1);
            const timestamp = performance.now() + (i * intervalMs);
            let fps;
            
            switch (pattern) {
                case 'linear_decline':
                    fps = startFPS - (progress * (startFPS - endFPS));
                    break;
                    
                case 'linear_incline':
                    fps = startFPS + (progress * (endFPS - startFPS));
                    break;
                    
                case 'step_decline':
                    fps = progress < 0.1 ? startFPS : endFPS;
                    break;
                    
                case 'periodic_drops':
                    const dropFrequency = options.dropFrequency || 5000;
                    const dropMagnitude = options.dropMagnitude || 20;
                    const cyclePosition = (i * intervalMs) % dropFrequency;
                    const isInDrop = cyclePosition < 500; // 500ms drops
                    fps = baseFPS - (isInDrop ? dropMagnitude : 0);
                    break;
                    
                case 'noisy_decline':
                    const baselineFPS = startFPS - (progress * (startFPS - endFPS));
                    const noiseLevel = options.noiseLevel || 5;
                    const noise = (Math.random() - 0.5) * noiseLevel;
                    fps = baselineFPS + noise;
                    break;
                    
                case 'temporary_drop':
                    const dropStart = 0.3;
                    const dropEnd = dropStart + (options.dropDuration || 3000) / duration;
                    const dropMag = options.dropMagnitude || 25;
                    fps = (progress >= dropStart && progress <= dropEnd) ? 
                          baseFPS - dropMag : baseFPS;
                    break;
                    
                case 'polynomial':
                    // Quadratic decline for testing regression
                    fps = startFPS - ((progress * progress) * (startFPS - endFPS));
                    break;
                    
                case 'stable':
                default:
                    const stableNoise = options.noiseLevel || 2;
                    fps = baseFPS + ((Math.random() - 0.5) * stableNoise);
                    break;
            }
            
            data.push({ fps: Math.max(0, fps), timestamp });
        }
        
        return data;
    }
    
    /**
     * Generate anomaly test data
     */
    generateAnomalyTestData() {
        const data = [];
        const baseTimestamp = performance.now();
        
        // Normal data
        for (let i = 0; i < 100; i++) {
            data.push({
                fps: 60 + ((Math.random() - 0.5) * 4),
                timestamp: baseTimestamp + (i * 16.67)
            });
        }
        
        // Sudden anomaly
        for (let i = 100; i < 110; i++) {
            data.push({
                fps: 20 + ((Math.random() - 0.5) * 10), // Sudden drop
                timestamp: baseTimestamp + (i * 16.67)
            });
        }
        
        // Return to normal
        for (let i = 110; i < 200; i++) {
            data.push({
                fps: 60 + ((Math.random() - 0.5) * 4),
                timestamp: baseTimestamp + (i * 16.67)
            });
        }
        
        return data;
    }
    
    /**
     * Generate scenario-specific test data
     */
    generateScenarioData(scenario) {
        return this.generateTestData(
            scenario.pattern,
            scenario.duration,
            scenario.startFPS,
            scenario.endFPS,
            scenario.baseFPS,
            scenario
        );
    }
    
    /**
     * Create mock alert system for testing
     */
    createMockAlertSystem() {
        return {
            thresholds: {
                warning: -3,
                critical: -8,
                emergency: -15
            },
            
            checkAlert: function(derivative) {
                if (derivative <= this.thresholds.emergency) return 'emergency';
                if (derivative <= this.thresholds.critical) return 'critical';
                if (derivative <= this.thresholds.warning) return 'warning';
                return 'none';
            }
        };
    }
    
    /**
     * Simulate alert checking
     */
    simulateAlertCheck(alertSystem, derivative) {
        return alertSystem.checkAlert(derivative);
    }
    
    /**
     * Test prediction scenario accuracy
     */
    async testPredictionScenario(scenario) {
        const testData = this.generateScenarioData(scenario);
        const trendAnalysis = new PredictiveTrendAnalysis();
        
        let predictions = [];
        let actualPerformance = [];
        
        // Process first 70% of data to make predictions
        const trainingSize = Math.floor(testData.length * 0.7);
        
        for (let i = 0; i < trainingSize; i++) {
            const analysis = trendAnalysis.processData(testData[i].fps, testData[i].timestamp);
            
            if (analysis.regression && i % 30 === 0) { // Make predictions periodically
                const prediction = trendAnalysis.predictFuturePerformance(3); // 3 seconds ahead
                if (prediction) {
                    predictions.push({
                        timestamp: testData[i].timestamp,
                        prediction,
                        actualIndex: i
                    });
                }
            }
        }
        
        // Validate predictions against remaining 30% of data
        let correctPredictions = 0;
        let totalPredictions = 0;
        
        for (const pred of predictions) {
            const futureDataIndex = pred.actualIndex + Math.floor(3000 / 16.67); // 3 seconds later
            
            if (futureDataIndex < testData.length) {
                totalPredictions++;
                const actualFPS = testData[futureDataIndex].fps;
                const predictedFPS = pred.prediction.predictions[Math.floor(pred.prediction.predictions.length / 2)]?.fps || 0;
                
                // Consider prediction correct if within 10% or 5 FPS
                const error = Math.abs(actualFPS - predictedFPS);
                const percentError = error / actualFPS;
                
                if (error < 5 || percentError < 0.1) {
                    correctPredictions++;
                }
            }
        }
        
        return {
            scenario: scenario.name,
            correctPredictions,
            totalPredictions,
            accuracy: totalPredictions > 0 ? correctPredictions / totalPredictions : 0
        };
    }
    
    /**
     * Simulate complete alerting system
     */
    async simulateAlertingSystem(testData, scenario) {
        const alerts = [];
        const trendAnalysis = new PredictiveTrendAnalysis();
        const alertSystem = this.createMockAlertSystem();
        
        for (const dataPoint of testData) {
            const analysis = trendAnalysis.processData(dataPoint.fps, dataPoint.timestamp);
            
            if (analysis.derivatives && analysis.derivatives.derivatives.length > 0) {
                const firstDerivative = analysis.derivatives.derivatives.find(d => d.order === 1);
                
                if (firstDerivative) {
                    const alertLevel = alertSystem.checkAlert(firstDerivative.value);
                    
                    if (alertLevel !== 'none') {
                        alerts.push({
                            level: alertLevel,
                            timestamp: dataPoint.timestamp,
                            fps: dataPoint.fps,
                            derivative: firstDerivative.value
                        });
                    }
                }
            }
        }
        
        return alerts;
    }
    
    /**
     * Add test result to collection
     */
    addTestResult(testName, result) {
        this.testResults.push({
            name: testName,
            ...result,
            timestamp: new Date().toISOString()
        });
        
        this.testStats.total++;
        if (result.passed) {
            this.testStats.passed++;
        } else {
            this.testStats.failed++;
        }
        
        this.testStats.accuracy = (this.testStats.passed / this.testStats.total) * 100;
    }
    
    /**
     * Generate comprehensive test report
     */
    generateTestReport() {
        console.log('\n🧪 === PREDICTIVE ALERTING TEST REPORT ===');
        console.log(`📊 Total Tests: ${this.testStats.total}`);
        console.log(`✅ Passed: ${this.testStats.passed}`);
        console.log(`❌ Failed: ${this.testStats.failed}`);
        console.log(`📈 Success Rate: ${this.testStats.accuracy.toFixed(1)}%`);
        
        console.log('\n📋 Detailed Results:');
        
        const categories = {};
        this.testResults.forEach(result => {
            const category = result.name.split(':')[0];
            if (!categories[category]) categories[category] = [];
            categories[category].push(result);
        });
        
        for (const [category, tests] of Object.entries(categories)) {
            const passed = tests.filter(t => t.passed).length;
            const total = tests.length;
            const categoryRate = ((passed / total) * 100).toFixed(1);
            
            console.log(`\n🔍 ${category} (${passed}/${total} - ${categoryRate}%)`);
            
            tests.forEach(test => {
                const status = test.passed ? '✅' : '❌';
                console.log(`  ${status} ${test.name.split(':')[1] || test.name}`);
                console.log(`     Expected: ${test.expected}`);
                console.log(`     Actual: ${test.actual}`);
                if (test.details) {
                    console.log(`     Details: ${test.details}`);
                }
            });
        }
        
        // Performance summary
        const performanceTests = this.testResults.filter(r => 
            r.name.includes('Accuracy') || r.name.includes('Scenario'));
        
        if (performanceTests.length > 0) {
            const avgAccuracy = performanceTests
                .filter(t => t.actual.includes('%'))
                .reduce((sum, t) => {
                    const percent = parseFloat(t.actual.replace('%', ''));
                    return sum + (isNaN(percent) ? 0 : percent);
                }, 0) / performanceTests.filter(t => t.actual.includes('%')).length;
            
            console.log(`\n🎯 Average Prediction Accuracy: ${avgAccuracy.toFixed(1)}%`);
        }
        
        console.log('\n🧪 === END OF TEST REPORT ===\n');
        
        return {
            summary: this.testStats,
            detailed: this.testResults,
            categories
        };
    }
    
    /**
     * Run specific test category
     */
    async runTestCategory(category) {
        console.log(`🧪 Running ${category} tests...`);
        
        switch (category) {
            case 'derivatives':
                await this.testDerivativeCalculations();
                break;
            case 'trends':
                await this.testTrendDetection();
                break;
            case 'patterns':
                await this.testPatternRecognition();
                break;
            case 'alerts':
                await this.testAlertThresholds();
                break;
            case 'accuracy':
                await this.testPredictiveAccuracy();
                break;
            case 'scenarios':
                await this.testPerformanceScenarios();
                break;
            case 'models':
                await this.testMathematicalModels();
                break;
            default:
                console.warn(`Unknown test category: ${category}`);
        }
        
        return this.testStats;
    }
    
    /**
     * Get test results
     */
    getResults() {
        return {
            stats: this.testStats,
            results: this.testResults,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Reset test state
     */
    reset() {
        this.testResults = [];
        this.testStats = { total: 0, passed: 0, failed: 0, accuracy: 0 };
        console.log('🧪 Test suite reset');
    }
}

// Create singleton instance
const predictiveAlertingTestSuite = new PredictiveAlertingTestSuite();

// Expose for debugging and manual testing
if (typeof window !== 'undefined') {
    window.PREDICTIVE_ALERTING_TESTS = predictiveAlertingTestSuite;
}

export default predictiveAlertingTestSuite;