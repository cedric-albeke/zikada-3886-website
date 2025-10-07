#!/usr/bin/env node

/**
 * Performance Baseline Analyzer for ZIKADA 3886
 * 
 * Analyzes performance baseline data and extracts key metrics:
 * - FPS percentiles (p50, p95), averages, and stability
 * - Memory usage patterns and growth rates  
 * - DOM node trends and accumulation
 * - WebGL resource tracking
 * - Performance consistency over time
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

class BaselineAnalyzer {
    constructor(baselineFile) {
        this.baselineFile = baselineFile;
        this.data = [];
        this.metrics = {};
        
        console.log('🔍 Analyzing baseline data:', baselineFile);
    }
    
    loadData() {
        if (!existsSync(this.baselineFile)) {
            throw new Error(`Baseline file not found: ${this.baselineFile}`);
        }
        
        const content = readFileSync(this.baselineFile, 'utf8');
        const lines = content.trim().split('\n');
        
        this.data = lines.map(line => {
            try {
                return JSON.parse(line);
            } catch (error) {
                console.warn('Skipping invalid JSON line:', line.substring(0, 50));
                return null;
            }
        }).filter(Boolean);
        
        console.log(`📊 Loaded ${this.data.length} data points`);
        
        if (this.data.length === 0) {
            throw new Error('No valid data points found in baseline file');
        }
    }
    
    analyzeMetrics() {
        const fps = this.data.map(d => d.fps).filter(f => f > 0);
        const memory = this.data.map(d => d.mem).filter(m => m > 0);
        const dom = this.data.map(d => d.dom).filter(d => d > 0);
        const overlays = this.data.map(d => d.overlays || 0);
        const controlFx = this.data.map(d => d.controlFx || 0);
        
        // Calculate time span
        const startTime = this.data[0]?.t || Date.now();
        const endTime = this.data[this.data.length - 1]?.t || Date.now();
        const duration = (endTime - startTime) / 1000; // seconds
        
        this.metrics = {
            metadata: {
                file: this.baselineFile,
                dataPoints: this.data.length,
                duration: Math.round(duration),
                timestamp: new Date().toISOString()
            },
            fps: this.analyzeFPS(fps),
            memory: this.analyzeMemory(memory, duration),
            dom: this.analyzeDOM(dom),
            effects: {
                overlays: this.calculateStats(overlays),
                controlFx: this.calculateStats(controlFx)
            },
            performance: this.assessPerformance(fps, memory, dom)
        };
        
        return this.metrics;
    }
    
    analyzeFPS(fps) {
        const sorted = [...fps].sort((a, b) => a - b);
        const stats = this.calculateStats(fps);
        
        // Calculate stability (coefficient of variation)
        const cv = stats.stdDev / stats.mean;
        const stability = cv < 0.2 ? 'excellent' : cv < 0.4 ? 'good' : cv < 0.6 ? 'fair' : 'poor';
        
        // Count frames below threshold
        const belowThreshold = fps.filter(f => f < 30).length;
        const droppedFramePercent = (belowThreshold / fps.length) * 100;
        
        return {
            ...stats,
            p50: this.percentile(sorted, 0.5),
            p95: this.percentile(sorted, 0.95),
            p99: this.percentile(sorted, 0.99),
            stability,
            coefficientOfVariation: Math.round(cv * 100) / 100,
            droppedFramePercent: Math.round(droppedFramePercent * 100) / 100,
            belowThreshold: belowThreshold,
            assessment: this.assessFPS(stats.mean, droppedFramePercent)
        };
    }
    
    analyzeMemory(memory, duration) {
        const stats = this.calculateStats(memory);
        const bytesToMB = bytes => Math.round(bytes / (1024 * 1024) * 100) / 100;
        
        // Calculate memory trend (linear regression)
        const growthRate = this.calculateMemoryGrowth(memory, duration);
        const projectedGrowth24h = growthRate * 24 * 3600; // bytes per 24 hours
        
        return {
            ...stats,
            min: bytesToMB(stats.min),
            max: bytesToMB(stats.max),
            mean: bytesToMB(stats.mean),
            stdDev: bytesToMB(stats.stdDev),
            growthRateMBPerHour: Math.round(growthRate * 3600 / (1024 * 1024) * 100) / 100,
            projected24hGrowthMB: Math.round(projectedGrowth24h / (1024 * 1024) * 100) / 100,
            assessment: this.assessMemory(growthRate, projectedGrowth24h)
        };
    }
    
    analyzeDOM(dom) {
        const stats = this.calculateStats(dom);
        const growth = dom[dom.length - 1] - dom[0];
        
        return {
            ...stats,
            initialNodes: dom[0],
            finalNodes: dom[dom.length - 1],
            totalGrowth: growth,
            growthPercent: Math.round((growth / dom[0]) * 100 * 100) / 100,
            assessment: this.assessDOM(growth, stats.mean)
        };
    }
    
    calculateMemoryGrowth(memory, duration) {
        if (duration === 0) return 0;
        
        // Simple linear regression to estimate growth rate (bytes per second)
        const n = memory.length;
        const indices = Array.from({ length: n }, (_, i) => i);
        
        const sumX = indices.reduce((a, b) => a + b, 0);
        const sumY = memory.reduce((a, b) => a + b, 0);
        const sumXY = indices.reduce((sum, x, i) => sum + x * memory[i], 0);
        const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        
        // Convert slope from per-datapoint to per-second
        return slope * (n / duration);
    }
    
    calculateStats(values) {
        if (values.length === 0) return { count: 0, min: 0, max: 0, mean: 0, stdDev: 0 };
        
        const sorted = [...values].sort((a, b) => a - b);
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        return {
            count: values.length,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            mean: Math.round(mean * 100) / 100,
            stdDev: Math.round(stdDev * 100) / 100
        };
    }
    
    percentile(sorted, p) {
        const index = (sorted.length - 1) * p;
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index - lower;
        
        return Math.round((sorted[lower] * (1 - weight) + sorted[upper] * weight) * 100) / 100;
    }
    
    assessPerformance(fps, memory, dom) {
        const avgFPS = fps.reduce((a, b) => a + b, 0) / fps.length;
        const memGrowth = memory[memory.length - 1] - memory[0];
        const domGrowth = dom[dom.length - 1] - dom[0];
        
        let score = 100;
        let issues = [];
        
        // FPS scoring
        if (avgFPS < 30) {
            score -= 40;
            issues.push('FPS critically low (< 30)');
        } else if (avgFPS < 60) {
            score -= 20;
            issues.push('FPS below target (< 60)');
        } else if (avgFPS < 80) {
            score -= 10;
            issues.push('FPS below optimal (< 80)');
        }
        
        // Memory growth scoring
        const memGrowthMB = memGrowth / (1024 * 1024);
        if (memGrowthMB > 50) {
            score -= 30;
            issues.push('Excessive memory growth (> 50MB)');
        } else if (memGrowthMB > 20) {
            score -= 15;
            issues.push('Significant memory growth (> 20MB)');
        }
        
        // DOM growth scoring
        if (domGrowth > 100) {
            score -= 20;
            issues.push('DOM node accumulation detected');
        }
        
        const rating = score >= 90 ? 'excellent' : score >= 75 ? 'good' : score >= 50 ? 'fair' : 'poor';
        
        return {
            score: Math.max(0, score),
            rating,
            issues,
            summary: issues.length === 0 ? 'No performance issues detected' : `${issues.length} issue(s) found`
        };
    }
    
    assessFPS(avgFPS, droppedPercent) {
        if (avgFPS >= 80 && droppedPercent < 1) return 'excellent';
        if (avgFPS >= 60 && droppedPercent < 5) return 'good';
        if (avgFPS >= 30 && droppedPercent < 15) return 'fair';
        return 'poor';
    }
    
    assessMemory(growthRate, projected24h) {
        const growthMB24h = projected24h / (1024 * 1024);
        if (Math.abs(growthMB24h) < 5) return 'excellent';
        if (Math.abs(growthMB24h) < 20) return 'good';
        if (Math.abs(growthMB24h) < 50) return 'fair';
        return 'poor';
    }
    
    assessDOM(growth, avgNodes) {
        if (Math.abs(growth) < 10) return 'excellent';
        if (Math.abs(growth) < 50) return 'good';
        if (Math.abs(growth) < 100) return 'fair';
        return 'poor';
    }
    
    generateReport() {
        const report = {
            baseline: this.metrics,
            generated: new Date().toISOString(),
            summary: this.generateSummary()
        };
        
        // Save to artifacts
        const artifactsDir = join(projectRoot, 'artifacts', 'baselines');
        const reportPath = join(artifactsDir, `baseline-analysis-${Date.now()}.json`);
        
        writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log('\n📋 Baseline Analysis Report:');
        console.log('================================');
        console.log(`📁 File: ${this.baselineFile}`);
        console.log(`⏱️  Duration: ${this.metrics.metadata.duration}s`);
        console.log(`📊 Data Points: ${this.metrics.metadata.dataPoints}`);
        console.log('');
        console.log('🖼️  FPS Metrics:');
        console.log(`   Average: ${this.metrics.fps.mean} fps`);
        console.log(`   P50: ${this.metrics.fps.p50} fps | P95: ${this.metrics.fps.p95} fps`);
        console.log(`   Stability: ${this.metrics.fps.stability} (CV: ${this.metrics.fps.coefficientOfVariation})`);
        console.log(`   Dropped frames: ${this.metrics.fps.droppedFramePercent}%`);
        console.log(`   Assessment: ${this.metrics.fps.assessment}`);
        console.log('');
        console.log('🧠 Memory Metrics:');
        console.log(`   Average: ${this.metrics.memory.mean} MB`);
        console.log(`   Growth rate: ${this.metrics.memory.growthRateMBPerHour} MB/hour`);
        console.log(`   24h projection: ${this.metrics.memory.projected24hGrowthMB} MB`);
        console.log(`   Assessment: ${this.metrics.memory.assessment}`);
        console.log('');
        console.log('🌳 DOM Metrics:');
        console.log(`   Initial nodes: ${this.metrics.dom.initialNodes}`);
        console.log(`   Final nodes: ${this.metrics.dom.finalNodes}`);
        console.log(`   Growth: ${this.metrics.dom.totalGrowth} nodes (${this.metrics.dom.growthPercent}%)`);
        console.log(`   Assessment: ${this.metrics.dom.assessment}`);
        console.log('');
        console.log('🎯 Overall Performance:');
        console.log(`   Score: ${this.metrics.performance.score}/100`);
        console.log(`   Rating: ${this.metrics.performance.rating}`);
        console.log(`   Summary: ${this.metrics.performance.summary}`);
        if (this.metrics.performance.issues.length > 0) {
            console.log('   Issues:');
            this.metrics.performance.issues.forEach(issue => console.log(`     - ${issue}`));
        }
        console.log('');
        console.log(`📄 Full report saved: ${reportPath}`);
        
        return report;
    }
    
    generateSummary() {
        return {
            fps: {
                mean: this.metrics.fps.mean,
                p95: this.metrics.fps.p95,
                assessment: this.metrics.fps.assessment
            },
            memory: {
                growthRateMBPerHour: this.metrics.memory.growthRateMBPerHour,
                projected24hGrowthMB: this.metrics.memory.projected24hGrowthMB,
                assessment: this.metrics.memory.assessment
            },
            dom: {
                totalGrowth: this.metrics.dom.totalGrowth,
                assessment: this.metrics.dom.assessment
            },
            performance: {
                score: this.metrics.performance.score,
                rating: this.metrics.performance.rating,
                issues: this.metrics.performance.issues
            }
        };
    }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
    const baselineFile = process.argv[2];
    
    if (!baselineFile) {
        console.error('Usage: node analyze-baseline.js <baseline-file.jsonl>');
        process.exit(1);
    }
    
    try {
        const analyzer = new BaselineAnalyzer(baselineFile);
        analyzer.loadData();
        analyzer.analyzeMetrics();
        analyzer.generateReport();
    } catch (error) {
        console.error('Analysis failed:', error.message);
        process.exit(1);
    }
}

export default BaselineAnalyzer;