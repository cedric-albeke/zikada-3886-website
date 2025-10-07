#!/usr/bin/env node

/**
 * Performance Budget Checker for ZIKADA 3886
 * 
 * Enforces size budgets for PWA features and generates reports.
 * Fails CI builds that exceed performance budgets.
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync, statSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { gzip } from 'zlib';
import { promisify } from 'util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const gzipAsync = promisify(gzip);

class BudgetChecker {
    constructor() {
        this.budgetConfig = this.loadBudgetConfig();
        this.results = {
            passed: true,
            violations: [],
            report: {
                timestamp: new Date().toISOString(),
                files: {},
                summary: {}
            }
        };
        
        console.log('📊 Checking performance budgets...');
    }
    
    loadBudgetConfig() {
        const configPath = join(projectRoot, 'perf-budgets.json');
        if (!existsSync(configPath)) {
            throw new Error(`Budget configuration not found: ${configPath}`);
        }
        
        return JSON.parse(readFileSync(configPath, 'utf8'));
    }
    
    async checkBudgets() {
        console.log('\n🔍 Checking PWA component budgets...');
        
        // Check individual PWA components
        await this.checkServiceWorker();
        await this.checkManifest();
        await this.checkIcons();
        
        // Calculate total PWA budget
        await this.checkTotalPWABudget();
        
        // Generate reports
        this.generateReport();
        
        if (!this.results.passed) {
            console.error('\n❌ Performance budget violations detected!');
            process.exit(1);
        } else {
            console.log('\n✅ All performance budgets passed!');
        }
    }
    
    async checkServiceWorker() {
        const swPath = join(projectRoot, 'service-worker.js');
        if (!existsSync(swPath)) {
            console.log('ℹ️  Service worker not found (not yet created)');
            return;
        }
        
        const { size, gzipSize } = await this.getFileSize(swPath);
        const budget = this.budgetConfig.budgets.pwa.components.serviceWorker;
        
        this.results.report.files['service-worker.js'] = {
            size,
            gzipSize,
            budget: budget.maxSizeGzipped,
            passed: gzipSize <= budget.maxSizeGzipped
        };
        
        if (gzipSize > budget.maxSizeGzipped) {
            this.addViolation('Service Worker', gzipSize, budget.maxSizeGzipped, swPath);
        } else {
            console.log(`✓ Service Worker: ${this.formatBytes(gzipSize)} / ${this.formatBytes(budget.maxSizeGzipped)} (gzipped)`);
        }
    }
    
    async checkManifest() {
        const manifestPath = join(projectRoot, 'manifest.webmanifest');
        if (!existsSync(manifestPath)) {
            console.log('ℹ️  Web manifest not found (not yet created)');
            return;
        }
        
        const { size, gzipSize } = await this.getFileSize(manifestPath);
        const budget = this.budgetConfig.budgets.pwa.components.manifest;
        
        this.results.report.files['manifest.webmanifest'] = {
            size,
            gzipSize,
            budget: budget.maxSizeGzipped,
            passed: gzipSize <= budget.maxSizeGzipped
        };
        
        if (gzipSize > budget.maxSizeGzipped) {
            this.addViolation('Web Manifest', gzipSize, budget.maxSizeGzipped, manifestPath);
        } else {
            console.log(`✓ Web Manifest: ${this.formatBytes(gzipSize)} / ${this.formatBytes(budget.maxSizeGzipped)} (gzipped)`);
        }
    }
    
    async checkIcons() {
        const iconsDir = join(projectRoot, 'icons');
        if (!existsSync(iconsDir)) {
            console.log('ℹ️  Icons directory not found (not yet created)');
            return;
        }
        
        let totalSize = 0;
        const iconFiles = readdirSync(iconsDir).filter(f => f.match(/\.(png|svg|jpg|jpeg)$/i));
        
        for (const iconFile of iconFiles) {
            const iconPath = join(iconsDir, iconFile);
            const stat = statSync(iconPath);
            totalSize += stat.size;
        }
        
        const budget = this.budgetConfig.budgets.pwa.components.icons;
        
        this.results.report.files['icons/'] = {
            size: totalSize,
            fileCount: iconFiles.length,
            budget: budget.maxSizeTotal,
            passed: totalSize <= budget.maxSizeTotal
        };
        
        if (totalSize > budget.maxSizeTotal) {
            this.addViolation('Icons', totalSize, budget.maxSizeTotal, iconsDir);
        } else {
            console.log(`✓ Icons: ${this.formatBytes(totalSize)} / ${this.formatBytes(budget.maxSizeTotal)} (${iconFiles.length} files)`);
        }
    }
    
    async checkTotalPWABudget() {
        const pwaFiles = Object.values(this.results.report.files);
        const totalSize = pwaFiles.reduce((sum, file) => sum + (file.gzipSize || file.size || 0), 0);
        const budget = this.budgetConfig.budgets.pwa.maxSizeGzipped;
        
        this.results.report.summary = {
            totalPWASize: totalSize,
            budget: budget,
            passed: totalSize <= budget,
            utilizationPercent: Math.round((totalSize / budget) * 100)
        };
        
        if (totalSize > budget) {
            this.addViolation('Total PWA Budget', totalSize, budget, 'All PWA files');
        } else {
            console.log(`✓ Total PWA Budget: ${this.formatBytes(totalSize)} / ${this.formatBytes(budget)} (${this.results.report.summary.utilizationPercent}% utilized)`);
        }
    }
    
    async getFileSize(filePath) {
        const content = readFileSync(filePath);
        const size = content.length;
        const gzipBuffer = await gzipAsync(content);
        const gzipSize = gzipBuffer.length;
        
        return { size, gzipSize };
    }
    
    addViolation(component, actual, budget, path) {
        const violation = {
            component,
            actual,
            budget,
            overage: actual - budget,
            overagePercent: Math.round(((actual - budget) / budget) * 100),
            path
        };
        
        this.results.violations.push(violation);
        this.results.passed = false;
        
        console.error(`❌ ${component}: ${this.formatBytes(actual)} exceeds budget of ${this.formatBytes(budget)} by ${this.formatBytes(violation.overage)} (+${violation.overagePercent}%)`);
    }
    
    generateReport() {
        const artifactsDir = join(projectRoot, this.budgetConfig.enforcement.artifactsDirectory);
        
        // Ensure artifacts directory exists
        mkdirSync(artifactsDir, { recursive: true });
        
        // Write JSON report
        const jsonReportPath = join(artifactsDir, `budget-report-${Date.now()}.json`);
        writeFileSync(jsonReportPath, JSON.stringify(this.results, null, 2));
        
        // Write HTML report
        const htmlReport = this.generateHTMLReport();
        const htmlReportPath = join(artifactsDir, `budget-report-${Date.now()}.html`);
        writeFileSync(htmlReportPath, htmlReport);
        
        console.log(`\n📋 Reports generated:`);
        console.log(`   JSON: ${jsonReportPath}`);
        console.log(`   HTML: ${htmlReportPath}`);
    }
    
    generateHTMLReport() {
        const violationsHTML = this.results.violations.length > 0 
            ? this.results.violations.map(v => `
                <tr class="violation">
                    <td>${v.component}</td>
                    <td>${this.formatBytes(v.actual)}</td>
                    <td>${this.formatBytes(v.budget)}</td>
                    <td>${this.formatBytes(v.overage)} (+${v.overagePercent}%)</td>
                    <td><code>${v.path}</code></td>
                </tr>
            `).join('')
            : '<tr><td colspan="5" class="no-violations">✅ No budget violations</td></tr>';
            
        const filesHTML = Object.entries(this.results.report.files).map(([name, data]) => `
            <tr class="${data.passed ? 'passed' : 'failed'}">
                <td><code>${name}</code></td>
                <td>${this.formatBytes(data.gzipSize || data.size)}</td>
                <td>${this.formatBytes(data.budget)}</td>
                <td>${data.passed ? '✅' : '❌'}</td>
            </tr>
        `).join('');
        
        return `<!DOCTYPE html>
<html>
<head>
    <title>ZIKADA 3886 - Performance Budget Report</title>
    <style>
        body { font-family: 'SF Mono', Monaco, monospace; margin: 20px; background: #000; color: #0f0; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { background: #111; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #333; }
        th { background: #222; color: #0f0; }
        .violation { background: #300; color: #f88; }
        .passed { color: #8f8; }
        .failed { color: #f88; }
        .no-violations { text-align: center; color: #8f8; font-weight: bold; }
        code { background: #222; padding: 2px 6px; border-radius: 3px; }
        .timestamp { color: #888; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎧 ZIKADA 3886 Performance Budget Report</h1>
        <div class="timestamp">Generated: ${this.results.report.timestamp}</div>
    </div>
    
    <div class="summary">
        <h2>📊 Summary</h2>
        <p><strong>Status:</strong> ${this.results.passed ? '✅ PASSED' : '❌ FAILED'}</p>
        <p><strong>Total PWA Size:</strong> ${this.formatBytes(this.results.report.summary.totalPWASize || 0)}</p>
        <p><strong>Budget Utilization:</strong> ${this.results.report.summary.utilizationPercent || 0}%</p>
        <p><strong>Violations:</strong> ${this.results.violations.length}</p>
    </div>
    
    <h2>❌ Budget Violations</h2>
    <table>
        <thead>
            <tr>
                <th>Component</th>
                <th>Actual Size</th>
                <th>Budget</th>
                <th>Overage</th>
                <th>Path</th>
            </tr>
        </thead>
        <tbody>
            ${violationsHTML}
        </tbody>
    </table>
    
    <h2>📁 File Details</h2>
    <table>
        <thead>
            <tr>
                <th>File</th>
                <th>Size</th>
                <th>Budget</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${filesHTML}
        </tbody>
    </table>
    
    <div class="summary">
        <h3>💡 Budget Configuration</h3>
        <pre>${JSON.stringify(this.budgetConfig.budgets, null, 2)}</pre>
    </div>
</body>
</html>`;
    }
    
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
}

// Run budget check
if (import.meta.url === `file://${process.argv[1]}`) {
    const checker = new BudgetChecker();
    checker.checkBudgets().catch(error => {
        console.error('Budget check failed:', error);
        process.exit(1);
    });
}

export default BudgetChecker;
