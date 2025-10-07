/**
 * Advanced FPS Trend Analysis & Mathematical Models for ZIKADA 3886
 * 
 * Sophisticated algorithms for:
 * - Multi-order derivative calculations
 * - Exponential smoothing for noise reduction
 * - Statistical trend detection with confidence intervals
 * - Fourier analysis for periodic performance patterns
 * - Regression models for performance prediction
 */

class PredictiveTrendAnalysis {
    constructor() {
        // Trend analysis configuration
        this.config = {
            // Derivative orders
            derivativeOrders: [1, 2, 3], // First, second, third derivatives
            smoothingAlpha: 0.3,         // Exponential smoothing factor
            
            // Statistical analysis
            confidenceLevel: 0.95,       // 95% confidence intervals
            trendWindowSize: 20,         // Samples for trend detection
            noiseThreshold: 2.0,         // FPS noise threshold
            
            // Fourier analysis
            fftWindowSize: 64,           // Window size for FFT
            harmonicCount: 8,            // Number of harmonics to analyze
            
            // Regression models
            regressionWindow: 30,        // Samples for regression
            polynomialDegree: 3,         // Polynomial regression degree
            
            // Pattern detection
            patternMinLength: 10,        // Minimum pattern length
            patternMaxLength: 40,        // Maximum pattern length
            correlationThreshold: 0.7    // Pattern correlation threshold
        };
        
        // Data storage
        this.rawData = [];
        this.smoothedData = [];
        this.derivatives = [];
        this.trendHistory = [];
        this.frequencyData = [];
        
        // Mathematical models
        this.regressionModel = null;
        this.seasonalComponents = [];
        this.noiseProfile = { mean: 0, variance: 0 };
        
        // Pattern storage
        this.detectedPatterns = new Map();
        this.cycleDetector = new CycleDetector();
        
        console.log('📊 Predictive Trend Analysis initialized');
    }
    
    /**
     * Process new FPS data with comprehensive analysis
     */
    processData(fps, timestamp) {
        // Store raw data
        this.rawData.push({ fps, timestamp, id: Date.now() });
        
        // Maintain data window
        const maxSize = Math.max(
            this.config.fftWindowSize * 2,
            this.config.regressionWindow * 2,
            100
        );
        
        if (this.rawData.length > maxSize) {
            this.rawData.shift();
        }
        
        // Perform comprehensive analysis
        this.updateExponentialSmoothing(fps, timestamp);
        this.calculateMultiOrderDerivatives();
        this.updateStatisticalAnalysis();
        this.performFrequencyAnalysis();
        this.updateRegressionModels();
        this.detectPerformancePatterns();
        
        return this.getCurrentAnalysis();
    }
    
    /**
     * Exponential smoothing for noise reduction
     */
    updateExponentialSmoothing(fps, timestamp) {
        const alpha = this.config.smoothingAlpha;
        
        if (this.smoothedData.length === 0) {
            this.smoothedData.push({ fps, timestamp });
            return;
        }
        
        const lastSmoothed = this.smoothedData[this.smoothedData.length - 1];
        const smoothedFPS = alpha * fps + (1 - alpha) * lastSmoothed.fps;
        
        this.smoothedData.push({ fps: smoothedFPS, timestamp });
        
        // Maintain smoothed data window
        if (this.smoothedData.length > this.config.regressionWindow * 2) {
            this.smoothedData.shift();
        }
    }
    
    /**
     * Calculate multiple orders of derivatives
     */
    calculateMultiOrderDerivatives() {
        if (this.smoothedData.length < 4) return;
        
        const data = this.smoothedData.slice();
        let currentDerivatives = [];
        
        // Calculate derivatives for each order
        for (const order of this.config.derivativeOrders) {
            const derivative = this.calculateNthDerivative(data, order);
            currentDerivatives.push({
                order,
                value: derivative.value,
                confidence: derivative.confidence,
                timestamp: performance.now()
            });
        }
        
        this.derivatives.push({
            derivatives: currentDerivatives,
            timestamp: performance.now(),
            dataPoints: data.length
        });
        
        // Maintain derivatives history
        if (this.derivatives.length > this.config.trendWindowSize * 2) {
            this.derivatives.shift();
        }
    }
    
    /**
     * Calculate nth order derivative with error estimation
     */
    calculateNthDerivative(data, order) {
        if (data.length < order + 2) {
            return { value: 0, confidence: 0 };
        }
        
        let workingData = data.slice();
        
        // Calculate derivatives iteratively
        for (let n = 0; n < order; n++) {
            const newData = [];
            
            for (let i = 1; i < workingData.length; i++) {
                const dt = (workingData[i].timestamp - workingData[i-1].timestamp) / 1000;
                
                if (dt > 0) {
                    const derivative = (workingData[i].fps - workingData[i-1].fps) / dt;
                    newData.push({
                        fps: derivative,
                        timestamp: workingData[i].timestamp
                    });
                }
            }
            
            workingData = newData;
        }
        
        if (workingData.length === 0) {
            return { value: 0, confidence: 0 };
        }
        
        // Calculate average of recent derivatives
        const recentCount = Math.min(5, workingData.length);
        const recent = workingData.slice(-recentCount);
        const average = recent.reduce((sum, d) => sum + d.fps, 0) / recent.length;
        
        // Calculate confidence based on consistency
        const variance = recent.reduce((sum, d) => sum + Math.pow(d.fps - average, 2), 0) / recent.length;
        const confidence = Math.max(0, 1 - (Math.sqrt(variance) / 10));
        
        return { value: average, confidence };
    }
    
    /**
     * Statistical trend analysis with confidence intervals
     */
    updateStatisticalAnalysis() {
        if (this.smoothedData.length < this.config.trendWindowSize) return;
        
        const window = this.smoothedData.slice(-this.config.trendWindowSize);
        const analysis = this.performLinearRegression(window);
        
        // Calculate trend strength and direction
        const trendStrength = Math.abs(analysis.slope);
        const trendDirection = analysis.slope > 0 ? 'increasing' : 
                              analysis.slope < 0 ? 'decreasing' : 'stable';
        
        // Calculate confidence intervals
        const confidenceInterval = this.calculateConfidenceInterval(analysis, this.config.confidenceLevel);
        
        // Detect trend changes
        const trendChange = this.detectTrendChange(analysis);
        
        // Update noise profile
        this.updateNoiseProfile(window, analysis);
        
        const trendData = {
            slope: analysis.slope,
            intercept: analysis.intercept,
            rSquared: analysis.rSquared,
            direction: trendDirection,
            strength: trendStrength,
            confidence: analysis.confidence,
            confidenceInterval,
            trendChange,
            noiseLevel: Math.sqrt(this.noiseProfile.variance),
            timestamp: performance.now()
        };
        
        this.trendHistory.push(trendData);
        
        // Maintain trend history
        if (this.trendHistory.length > 100) {
            this.trendHistory.shift();
        }
    }
    
    /**
     * Perform linear regression analysis
     */
    performLinearRegression(data) {
        const n = data.length;
        if (n < 2) return { slope: 0, intercept: 0, rSquared: 0, confidence: 0 };
        
        // Create time series (x values as indices)
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
        
        data.forEach((point, index) => {
            const x = index;
            const y = point.fps;
            
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumXX += x * x;
            sumYY += y * y;
        });
        
        // Calculate regression coefficients
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Calculate R-squared
        const meanY = sumY / n;
        let ssRes = 0, ssTot = 0;
        
        data.forEach((point, index) => {
            const predicted = slope * index + intercept;
            ssRes += Math.pow(point.fps - predicted, 2);
            ssTot += Math.pow(point.fps - meanY, 2);
        });
        
        const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
        const confidence = Math.max(0, rSquared);
        
        return { slope, intercept, rSquared, confidence };
    }
    
    /**
     * Calculate confidence intervals for regression
     */
    calculateConfidenceInterval(regression, confidenceLevel) {
        // Simplified confidence interval calculation
        const tValue = this.getTValue(confidenceLevel);
        const standardError = Math.sqrt(1 - regression.rSquared) * 2; // Approximation
        
        const margin = tValue * standardError;
        
        return {
            slopeLower: regression.slope - margin,
            slopeUpper: regression.slope + margin,
            confidence: confidenceLevel
        };
    }
    
    /**
     * Get t-value for confidence interval
     */
    getTValue(confidenceLevel) {
        // Simplified t-table lookup for common confidence levels
        const tTable = {
            0.90: 1.645,
            0.95: 1.96,
            0.99: 2.576
        };
        
        return tTable[confidenceLevel] || 1.96;
    }
    
    /**
     * Detect significant trend changes
     */
    detectTrendChange(currentAnalysis) {
        if (this.trendHistory.length < 3) {
            return { detected: false };
        }
        
        const recent = this.trendHistory.slice(-3);
        const avgPreviousSlope = recent.reduce((sum, t) => sum + t.slope, 0) / recent.length;
        
        const slopeChange = Math.abs(currentAnalysis.slope - avgPreviousSlope);
        const significanceThreshold = 1.0; // FPS per frame change threshold
        
        const changeDetected = slopeChange > significanceThreshold;
        
        return {
            detected: changeDetected,
            magnitude: slopeChange,
            direction: currentAnalysis.slope > avgPreviousSlope ? 'acceleration' : 'deceleration',
            significance: slopeChange / significanceThreshold
        };
    }
    
    /**
     * Update noise profile for data quality assessment
     */
    updateNoiseProfile(data, regression) {
        let residuals = [];
        
        data.forEach((point, index) => {
            const predicted = regression.slope * index + regression.intercept;
            residuals.push(point.fps - predicted);
        });
        
        const mean = residuals.reduce((sum, r) => sum + r, 0) / residuals.length;
        const variance = residuals.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / residuals.length;
        
        // Exponential smoothing for noise profile
        const alpha = 0.1;
        this.noiseProfile.mean = alpha * mean + (1 - alpha) * this.noiseProfile.mean;
        this.noiseProfile.variance = alpha * variance + (1 - alpha) * this.noiseProfile.variance;
    }
    
    /**
     * Frequency analysis using simplified FFT concepts
     */
    performFrequencyAnalysis() {
        if (this.smoothedData.length < this.config.fftWindowSize) return;
        
        const window = this.smoothedData.slice(-this.config.fftWindowSize);
        const frequencies = this.analyzeFrequencies(window);
        
        this.frequencyData = frequencies;
        this.detectPeriodicPatterns(frequencies);
    }
    
    /**
     * Simplified frequency analysis
     */
    analyzeFrequencies(data) {
        const n = data.length;
        const frequencies = [];
        
        // Analyze different frequency components
        for (let freq = 1; freq <= this.config.harmonicCount; freq++) {
            const period = Math.floor(n / freq);
            if (period < 3) continue;
            
            let amplitude = 0;
            let correlation = 0;
            
            // Calculate correlation at this frequency
            for (let i = 0; i < n - period; i++) {
                const current = data[i].fps;
                const lagged = data[i + period].fps;
                correlation += current * lagged;
                amplitude += Math.abs(current - lagged);
            }
            
            correlation /= (n - period);
            amplitude /= (n - period);
            
            frequencies.push({
                frequency: freq,
                period,
                amplitude,
                correlation: Math.abs(correlation),
                strength: Math.min(1, Math.abs(correlation) / 100)
            });
        }
        
        return frequencies.sort((a, b) => b.strength - a.strength);
    }
    
    /**
     * Detect periodic performance patterns
     */
    detectPeriodicPatterns(frequencies) {
        const significantFreqs = frequencies.filter(f => f.strength > 0.3);
        
        for (const freq of significantFreqs) {
            const patternKey = `periodic_${freq.period}`;
            
            if (!this.detectedPatterns.has(patternKey)) {
                this.detectedPatterns.set(patternKey, {
                    type: 'periodic',
                    period: freq.period,
                    strength: freq.strength,
                    amplitude: freq.amplitude,
                    detected: performance.now(),
                    occurrences: 1
                });
            } else {
                const pattern = this.detectedPatterns.get(patternKey);
                pattern.strength = Math.max(pattern.strength, freq.strength);
                pattern.occurrences++;
            }
        }
    }
    
    /**
     * Update polynomial regression models
     */
    updateRegressionModels() {
        if (this.smoothedData.length < this.config.regressionWindow) return;
        
        const window = this.smoothedData.slice(-this.config.regressionWindow);
        this.regressionModel = this.performPolynomialRegression(window, this.config.polynomialDegree);
    }
    
    /**
     * Polynomial regression for non-linear trend modeling
     */
    performPolynomialRegression(data, degree) {
        const n = data.length;
        if (n <= degree) return null;
        
        // Create design matrix for polynomial regression
        const X = [];
        const y = [];
        
        data.forEach((point, index) => {
            const row = [];
            for (let power = 0; power <= degree; power++) {
                row.push(Math.pow(index, power));
            }
            X.push(row);
            y.push(point.fps);
        });
        
        // Solve normal equations (simplified approach)
        try {
            const coefficients = this.solveLinearSystem(X, y);
            const predictions = this.evaluatePolynomial(coefficients, data.length);
            
            // Calculate model quality
            let ssRes = 0, ssTot = 0;
            const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
            
            for (let i = 0; i < n; i++) {
                ssRes += Math.pow(y[i] - predictions[i], 2);
                ssTot += Math.pow(y[i] - meanY, 2);
            }
            
            const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
            
            return {
                coefficients,
                degree,
                rSquared,
                predictions,
                quality: rSquared,
                timestamp: performance.now()
            };
        } catch (error) {
            console.warn('📊 Polynomial regression failed:', error.message);
            return null;
        }
    }
    
    /**
     * Simplified linear system solver
     */
    solveLinearSystem(X, y) {
        // Using simplified normal equations: (X^T X)^-1 X^T y
        // This is a basic implementation for small matrices
        const n = X.length;
        const m = X[0].length;
        
        if (m > 4) {
            throw new Error('Matrix too large for simplified solver');
        }
        
        // Calculate X^T X and X^T y
        const XTX = Array(m).fill().map(() => Array(m).fill(0));
        const XTy = Array(m).fill(0);
        
        for (let i = 0; i < m; i++) {
            for (let j = 0; j < m; j++) {
                for (let k = 0; k < n; k++) {
                    XTX[i][j] += X[k][i] * X[k][j];
                }
            }
            for (let k = 0; k < n; k++) {
                XTy[i] += X[k][i] * y[k];
            }
        }
        
        // Solve using Gaussian elimination (simplified)
        return this.gaussianElimination(XTX, XTy);
    }
    
    /**
     * Simplified Gaussian elimination
     */
    gaussianElimination(matrix, vector) {
        const n = matrix.length;
        const augmented = matrix.map((row, i) => [...row, vector[i]]);
        
        // Forward elimination
        for (let i = 0; i < n; i++) {
            // Find pivot
            let maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
                    maxRow = k;
                }
            }
            
            // Swap rows
            [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
            
            // Make diagonal element 1
            const pivot = augmented[i][i];
            if (Math.abs(pivot) < 1e-10) {
                throw new Error('Singular matrix');
            }
            
            for (let j = i; j <= n; j++) {
                augmented[i][j] /= pivot;
            }
            
            // Eliminate column
            for (let k = i + 1; k < n; k++) {
                const factor = augmented[k][i];
                for (let j = i; j <= n; j++) {
                    augmented[k][j] -= factor * augmented[i][j];
                }
            }
        }
        
        // Back substitution
        const solution = Array(n).fill(0);
        for (let i = n - 1; i >= 0; i--) {
            solution[i] = augmented[i][n];
            for (let j = i + 1; j < n; j++) {
                solution[i] -= augmented[i][j] * solution[j];
            }
        }
        
        return solution;
    }
    
    /**
     * Evaluate polynomial at given points
     */
    evaluatePolynomial(coefficients, numPoints) {
        const results = [];
        
        for (let x = 0; x < numPoints; x++) {
            let value = 0;
            for (let power = 0; power < coefficients.length; power++) {
                value += coefficients[power] * Math.pow(x, power);
            }
            results.push(value);
        }
        
        return results;
    }
    
    /**
     * Advanced pattern detection
     */
    detectPerformancePatterns() {
        if (this.smoothedData.length < this.config.patternMinLength * 2) return;
        
        this.cycleDetector.detectCycles(this.smoothedData);
        this.findRecurringPatterns();
        this.detectAnomalousPatterns();
    }
    
    /**
     * Find recurring performance patterns
     */
    findRecurringPatterns() {
        const data = this.smoothedData.slice(-this.config.patternMaxLength * 2);
        
        for (let len = this.config.patternMinLength; len <= this.config.patternMaxLength; len++) {
            if (data.length < len * 2) continue;
            
            const pattern = data.slice(-len);
            const correlations = [];
            
            // Find similar patterns in history
            for (let i = 0; i <= data.length - len * 2; i++) {
                const candidate = data.slice(i, i + len);
                const correlation = this.calculatePatternCorrelation(pattern, candidate);
                
                if (correlation > this.config.correlationThreshold) {
                    correlations.push({
                        position: i,
                        correlation,
                        pattern: candidate
                    });
                }
            }
            
            if (correlations.length > 1) {
                const patternKey = `recurring_${len}_${correlations.length}`;
                this.detectedPatterns.set(patternKey, {
                    type: 'recurring',
                    length: len,
                    occurrences: correlations.length,
                    averageCorrelation: correlations.reduce((sum, c) => sum + c.correlation, 0) / correlations.length,
                    pattern: pattern.map(p => p.fps),
                    detected: performance.now()
                });
            }
        }
    }
    
    /**
     * Calculate correlation between two patterns
     */
    calculatePatternCorrelation(pattern1, pattern2) {
        if (pattern1.length !== pattern2.length) return 0;
        
        const n = pattern1.length;
        let sum1 = 0, sum2 = 0, sum1Sq = 0, sum2Sq = 0, sumProduct = 0;
        
        for (let i = 0; i < n; i++) {
            const val1 = pattern1[i].fps;
            const val2 = pattern2[i].fps;
            
            sum1 += val1;
            sum2 += val2;
            sum1Sq += val1 * val1;
            sum2Sq += val2 * val2;
            sumProduct += val1 * val2;
        }
        
        const numerator = sumProduct - (sum1 * sum2 / n);
        const denominator = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));
        
        return denominator > 0 ? numerator / denominator : 0;
    }
    
    /**
     * Detect anomalous patterns
     */
    detectAnomalousPatterns() {
        if (this.trendHistory.length < 10) return;
        
        const recentTrends = this.trendHistory.slice(-10);
        const avgSlope = recentTrends.reduce((sum, t) => sum + Math.abs(t.slope), 0) / recentTrends.length;
        const avgNoise = recentTrends.reduce((sum, t) => sum + t.noiseLevel, 0) / recentTrends.length;
        
        const current = recentTrends[recentTrends.length - 1];
        
        // Detect slope anomalies
        if (Math.abs(current.slope) > avgSlope * 3) {
            this.detectedPatterns.set('anomaly_slope', {
                type: 'anomaly',
                subtype: 'slope',
                severity: Math.abs(current.slope) / avgSlope,
                value: current.slope,
                baseline: avgSlope,
                detected: performance.now()
            });
        }
        
        // Detect noise anomalies
        if (current.noiseLevel > avgNoise * 2.5) {
            this.detectedPatterns.set('anomaly_noise', {
                type: 'anomaly',
                subtype: 'noise',
                severity: current.noiseLevel / avgNoise,
                value: current.noiseLevel,
                baseline: avgNoise,
                detected: performance.now()
            });
        }
    }
    
    /**
     * Get current comprehensive analysis
     */
    getCurrentAnalysis() {
        const currentTrend = this.trendHistory.length > 0 ? 
            this.trendHistory[this.trendHistory.length - 1] : null;
        
        const currentDerivatives = this.derivatives.length > 0 ? 
            this.derivatives[this.derivatives.length - 1] : null;
        
        return {
            trend: currentTrend,
            derivatives: currentDerivatives,
            regression: this.regressionModel,
            frequencies: this.frequencyData.slice(0, 3), // Top 3 frequencies
            patterns: Array.from(this.detectedPatterns.entries()).map(([key, pattern]) => ({
                name: key,
                ...pattern
            })),
            noise: this.noiseProfile,
            dataQuality: {
                samples: this.rawData.length,
                smoothedSamples: this.smoothedData.length,
                trendPoints: this.trendHistory.length,
                patternCount: this.detectedPatterns.size
            },
            timestamp: performance.now()
        };
    }
    
    /**
     * Predict future performance based on models
     */
    predictFuturePerformance(horizonSeconds = 10) {
        if (!this.regressionModel) return null;
        
        const currentTime = performance.now();
        const predictions = [];
        
        // Use polynomial regression for prediction
        const coefficients = this.regressionModel.coefficients;
        const currentX = this.smoothedData.length - 1;
        
        // Predict for the next horizonSeconds (assuming 60 FPS)
        const steps = Math.floor(horizonSeconds * 60);
        
        for (let step = 1; step <= steps; step++) {
            const x = currentX + step;
            let predictedFPS = 0;
            
            for (let power = 0; power < coefficients.length; power++) {
                predictedFPS += coefficients[power] * Math.pow(x, power);
            }
            
            // Add noise estimate
            const noiseMargin = Math.sqrt(this.noiseProfile.variance);
            
            predictions.push({
                time: currentTime + (step * 1000 / 60), // Convert to timestamp
                fps: predictedFPS,
                confidence: this.regressionModel.quality,
                upperBound: predictedFPS + noiseMargin,
                lowerBound: predictedFPS - noiseMargin
            });
        }
        
        return {
            predictions,
            horizon: horizonSeconds,
            model: 'polynomial',
            confidence: this.regressionModel.quality,
            generated: currentTime
        };
    }
    
    /**
     * Reset analysis state
     */
    reset() {
        this.rawData = [];
        this.smoothedData = [];
        this.derivatives = [];
        this.trendHistory = [];
        this.frequencyData = [];
        this.detectedPatterns.clear();
        this.regressionModel = null;
        this.noiseProfile = { mean: 0, variance: 0 };
        
        console.log('📊 Trend analysis reset');
    }
}

/**
 * Cycle detection helper class
 */
class CycleDetector {
    constructor() {
        this.detectedCycles = [];
    }
    
    detectCycles(data) {
        if (data.length < 20) return;
        
        // Simple cycle detection using autocorrelation
        const maxLag = Math.floor(data.length / 3);
        const correlations = [];
        
        for (let lag = 2; lag <= maxLag; lag++) {
            const correlation = this.calculateAutocorrelation(data, lag);
            correlations.push({ lag, correlation });
        }
        
        // Find peaks in autocorrelation
        const peaks = this.findPeaks(correlations, 0.3);
        
        this.detectedCycles = peaks.map(peak => ({
            period: peak.lag,
            strength: peak.correlation,
            detected: performance.now()
        }));
    }
    
    calculateAutocorrelation(data, lag) {
        const n = data.length - lag;
        let sum1 = 0, sum2 = 0, sum1Sq = 0, sum2Sq = 0, sumProduct = 0;
        
        for (let i = 0; i < n; i++) {
            const val1 = data[i].fps;
            const val2 = data[i + lag].fps;
            
            sum1 += val1;
            sum2 += val2;
            sum1Sq += val1 * val1;
            sum2Sq += val2 * val2;
            sumProduct += val1 * val2;
        }
        
        const numerator = sumProduct - (sum1 * sum2 / n);
        const denominator = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));
        
        return denominator > 0 ? numerator / denominator : 0;
    }
    
    findPeaks(correlations, threshold) {
        const peaks = [];
        
        for (let i = 1; i < correlations.length - 1; i++) {
            const current = correlations[i];
            const prev = correlations[i - 1];
            const next = correlations[i + 1];
            
            if (current.correlation > threshold && 
                current.correlation > prev.correlation && 
                current.correlation > next.correlation) {
                peaks.push(current);
            }
        }
        
        return peaks.sort((a, b) => b.correlation - a.correlation);
    }
}

export default PredictiveTrendAnalysis;