#!/usr/bin/env node

import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class LottieValidation {
    constructor() {
        this.projectRoot = join(__dirname, '..');
        this.srcDir = join(this.projectRoot, 'src');
        this.outDir = join(this.projectRoot, 'out', 'conservative');
        this.reportDir = join(this.projectRoot, 'reports');
        this.validationResults = [];
    }

    async validate() {
        console.log('🔍 Starting Lottie animation validation...\n');
        
        // Get list of files to validate
        const srcFiles = await this.getJsonFiles(this.srcDir);
        const outFiles = await this.getJsonFiles(this.outDir);
        
        console.log(`📂 Found ${srcFiles.length} original files and ${outFiles.length} optimized files\n`);
        
        // Validate each optimized file against its original
        for (const srcFile of srcFiles) {
            const basename = srcFile.replace('.json', '');
            const outFile = `${basename}.json`;
            
            if (outFiles.includes(outFile)) {
                await this.validateAnimationPair(srcFile, outFile);
            } else {
                console.log(`⚠️  Missing optimized version: ${basename}`);
                this.validationResults.push({
                    animation: basename,
                    status: 'missing',
                    errors: ['Optimized version not found']
                });
            }
        }
        
        // Generate validation report
        await this.generateValidationReport();
        
        // Print summary
        this.printValidationSummary();
        
        return this.validationResults;
    }

    async getJsonFiles(dir) {
        try {
            const files = await fs.readdir(dir);
            return files.filter(f => f.endsWith('.json'));
        } catch (error) {
            console.error(`❌ Error reading directory ${dir}:`, error.message);
            return [];
        }
    }

    async validateAnimationPair(srcFile, outFile) {
        const basename = srcFile.replace('.json', '');
        console.log(`🧪 Validating ${basename}...`);
        
        const result = {
            animation: basename,
            status: 'unknown',
            errors: [],
            warnings: [],
            metrics: {
                originalSize: 0,
                optimizedSize: 0,
                compression: 0
            }
        };

        try {
            // Load both files
            const srcPath = join(this.srcDir, srcFile);
            const outPath = join(this.outDir, outFile);
            
            const [srcData, outData] = await Promise.all([
                fs.readFile(srcPath, 'utf8'),
                fs.readFile(outPath, 'utf8')
            ]);

            result.metrics.originalSize = Buffer.byteLength(srcData, 'utf8');
            result.metrics.optimizedSize = Buffer.byteLength(outData, 'utf8');
            result.metrics.compression = ((result.metrics.originalSize - result.metrics.optimizedSize) / result.metrics.originalSize * 100).toFixed(1);

            // Parse JSON
            let srcJson, outJson;
            try {
                srcJson = JSON.parse(srcData);
                outJson = JSON.parse(outData);
            } catch (parseError) {
                result.errors.push(`JSON parsing failed: ${parseError.message}`);
                result.status = 'error';
                this.validationResults.push(result);
                console.log(`  ❌ JSON parsing failed`);
                return;
            }

            // Validate critical animation properties
            const criticalErrors = this.validateCriticalProperties(srcJson, outJson);
            const structuralWarnings = this.validateStructuralIntegrity(srcJson, outJson);
            const performanceChecks = this.checkPerformanceOptimizations(srcJson, outJson);

            result.errors = criticalErrors;
            result.warnings = [...structuralWarnings, ...performanceChecks.warnings];
            result.optimizations = performanceChecks.optimizations;

            // Determine overall status
            if (criticalErrors.length === 0) {
                result.status = structuralWarnings.length > 0 ? 'warning' : 'success';
            } else {
                result.status = 'error';
            }

            this.validationResults.push(result);
            
            // Log result
            const statusIcon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
            console.log(`  ${statusIcon} ${result.status.toUpperCase()} - ${result.metrics.compression}% smaller (${this.formatBytes(result.metrics.originalSize)} → ${this.formatBytes(result.metrics.optimizedSize)})`);
            
            if (result.errors.length > 0) {
                result.errors.forEach(error => console.log(`    🔴 ${error}`));
            }
            if (result.warnings.length > 0) {
                result.warnings.forEach(warning => console.log(`    🟡 ${warning}`));
            }

        } catch (error) {
            result.errors.push(`Validation failed: ${error.message}`);
            result.status = 'error';
            this.validationResults.push(result);
            console.log(`  ❌ Validation failed: ${error.message}`);
        }
    }

    validateCriticalProperties(original, optimized) {
        const errors = [];

        // Check basic animation properties
        if (original.v !== optimized.v) {
            errors.push(`Version mismatch: ${original.v} → ${optimized.v}`);
        }

        // Allow small precision differences in frame rate (up to 0.01 difference)
        if (Math.abs(original.fr - optimized.fr) > 0.01) {
            errors.push(`Frame rate changed: ${original.fr} → ${optimized.fr}`);
        }

        // Allow small precision differences in animation bounds (up to 0.01 difference)
        if (Math.abs(original.ip - optimized.ip) > 0.01 || Math.abs(original.op - optimized.op) > 0.01) {
            errors.push(`Animation duration changed: ${original.ip}-${original.op} → ${optimized.ip}-${optimized.op}`);
        }

        if (original.w !== optimized.w || original.h !== optimized.h) {
            errors.push(`Dimensions changed: ${original.w}x${original.h} → ${optimized.w}x${optimized.h}`);
        }

        // Check layers count
        const originalLayers = original.layers?.length || 0;
        const optimizedLayers = optimized.layers?.length || 0;
        if (originalLayers !== optimizedLayers) {
            errors.push(`Layer count changed: ${originalLayers} → ${optimizedLayers}`);
        }

        // Check assets count (if present)
        const originalAssets = original.assets?.length || 0;
        const optimizedAssets = optimized.assets?.length || 0;
        if (originalAssets !== optimizedAssets) {
            errors.push(`Asset count changed: ${originalAssets} → ${optimizedAssets}`);
        }

        return errors;
    }

    validateStructuralIntegrity(original, optimized) {
        const warnings = [];

        // Check if important structural elements are preserved
        const checkProperty = (path, originalVal, optimizedVal, name) => {
            if (JSON.stringify(originalVal) !== JSON.stringify(optimizedVal)) {
                if (originalVal && !optimizedVal) {
                    warnings.push(`${name} removed during optimization`);
                } else if (!originalVal && optimizedVal) {
                    warnings.push(`${name} added during optimization`);
                } else {
                    warnings.push(`${name} modified during optimization`);
                }
            }
        };

        // Check for significant structural changes
        if (original.markers && !optimized.markers) {
            warnings.push('Animation markers removed');
        }

        if (original.chars && !optimized.chars) {
            warnings.push('Text characters definition removed');
        }

        // Check layer types preservation
        if (original.layers && optimized.layers) {
            const originalTypes = original.layers.map(l => l.ty).sort();
            const optimizedTypes = optimized.layers.map(l => l.ty).sort();
            
            if (JSON.stringify(originalTypes) !== JSON.stringify(optimizedTypes)) {
                warnings.push('Layer types changed during optimization');
            }
        }

        return warnings;
    }

    checkPerformanceOptimizations(original, optimized) {
        const optimizations = [];
        const warnings = [];

        // Check numeric precision optimization
        const originalStr = JSON.stringify(original);
        const optimizedStr = JSON.stringify(optimized);
        
        const originalDecimals = (originalStr.match(/\.\d{4,}/g) || []).length;
        const optimizedDecimals = (optimizedStr.match(/\.\d{4,}/g) || []).length;
        
        if (originalDecimals > optimizedDecimals) {
            optimizations.push(`Reduced high-precision decimals: ${originalDecimals} → ${optimizedDecimals}`);
        }

        // Check metadata removal
        const metadataFields = ['nm', 'mn', 'cl', 'cm'];
        let removedMetadata = 0;
        
        const countMetadata = (obj) => {
            let count = 0;
            if (typeof obj === 'object' && obj !== null) {
                for (const field of metadataFields) {
                    if (obj.hasOwnProperty(field)) count++;
                }
                for (const key in obj) {
                    count += countMetadata(obj[key]);
                }
            } else if (Array.isArray(obj)) {
                for (const item of obj) {
                    count += countMetadata(item);
                }
            }
            return count;
        };

        const originalMetadata = countMetadata(original);
        const optimizedMetadata = countMetadata(optimized);
        
        if (originalMetadata > optimizedMetadata) {
            optimizations.push(`Removed metadata fields: ${originalMetadata - optimizedMetadata} instances`);
        }

        // Check keyframe optimization
        const countKeyframes = (obj) => {
            let count = 0;
            if (typeof obj === 'object' && obj !== null) {
                if (obj.k && Array.isArray(obj.k)) {
                    count += obj.k.length;
                }
                for (const key in obj) {
                    count += countKeyframes(obj[key]);
                }
            } else if (Array.isArray(obj)) {
                for (const item of obj) {
                    count += countKeyframes(item);
                }
            }
            return count;
        };

        const originalKeyframes = countKeyframes(original);
        const optimizedKeyframes = countKeyframes(optimized);
        
        if (originalKeyframes > optimizedKeyframes) {
            optimizations.push(`Optimized keyframes: ${originalKeyframes} → ${optimizedKeyframes}`);
            
            // Warn if reduction is too aggressive
            const reduction = (originalKeyframes - optimizedKeyframes) / originalKeyframes;
            if (reduction > 0.5) {
                warnings.push(`Aggressive keyframe reduction (${(reduction * 100).toFixed(1)}%) - verify animation quality`);
            }
        }

        // Check for extreme compression
        const compressionRatio = (Buffer.byteLength(originalStr, 'utf8') - Buffer.byteLength(optimizedStr, 'utf8')) / Buffer.byteLength(originalStr, 'utf8');
        
        if (compressionRatio > 0.9) {
            warnings.push(`Extremely high compression (${(compressionRatio * 100).toFixed(1)}%) - verify animation integrity`);
        } else if (compressionRatio > 0.7) {
            optimizations.push(`High compression achieved: ${(compressionRatio * 100).toFixed(1)}%`);
        }

        return { optimizations, warnings };
    }

    async generateValidationReport() {
        await fs.mkdir(this.reportDir, { recursive: true });
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: this.generateSummary(),
            results: this.validationResults
        };

        const reportPath = join(this.reportDir, `validation-report-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`);
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        // Generate markdown report
        const markdownReport = this.generateMarkdownReport(report);
        const mdPath = join(this.reportDir, 'validation-report.md');
        await fs.writeFile(mdPath, markdownReport);

        console.log(`\n📊 Validation reports generated:`);
        console.log(`   JSON: ${reportPath}`);
        console.log(`   Markdown: ${mdPath}`);
    }

    generateSummary() {
        const total = this.validationResults.length;
        const success = this.validationResults.filter(r => r.status === 'success').length;
        const warnings = this.validationResults.filter(r => r.status === 'warning').length;
        const errors = this.validationResults.filter(r => r.status === 'error').length;
        const missing = this.validationResults.filter(r => r.status === 'missing').length;

        const totalOriginalSize = this.validationResults.reduce((sum, r) => sum + (r.metrics?.originalSize || 0), 0);
        const totalOptimizedSize = this.validationResults.reduce((sum, r) => sum + (r.metrics?.optimizedSize || 0), 0);
        const overallCompression = totalOriginalSize > 0 ? 
            ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(1) : 0;

        return {
            total,
            success,
            warnings,
            errors,
            missing,
            overallCompression: `${overallCompression}%`,
            totalOriginalSize: this.formatBytes(totalOriginalSize),
            totalOptimizedSize: this.formatBytes(totalOptimizedSize),
            spaceSaved: this.formatBytes(totalOriginalSize - totalOptimizedSize)
        };
    }

    generateMarkdownReport(report) {
        const { summary, results } = report;
        
        let md = `# Lottie Animation Validation Report\n\n`;
        md += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n\n`;
        
        md += `## 📊 Summary\n\n`;
        md += `| Metric | Value |\n`;
        md += `|--------|-------|\n`;
        md += `| Total Animations | ${summary.total} |\n`;
        md += `| ✅ Successful | ${summary.success} |\n`;
        md += `| ⚠️ Warnings | ${summary.warnings} |\n`;
        md += `| ❌ Errors | ${summary.errors} |\n`;
        md += `| 🔍 Missing | ${summary.missing} |\n`;
        md += `| 📦 Original Size | ${summary.totalOriginalSize} |\n`;
        md += `| 🗜️ Optimized Size | ${summary.totalOptimizedSize} |\n`;
        md += `| 💾 Space Saved | ${summary.spaceSaved} |\n`;
        md += `| 📉 Compression | ${summary.overallCompression} |\n\n`;
        
        md += `## 📋 Detailed Results\n\n`;
        
        for (const result of results) {
            const statusIcon = result.status === 'success' ? '✅' : 
                             result.status === 'warning' ? '⚠️' : 
                             result.status === 'missing' ? '🔍' : '❌';
            
            md += `### ${statusIcon} ${result.animation}\n\n`;
            md += `**Status:** ${result.status.toUpperCase()}\n\n`;
            
            if (result.metrics) {
                md += `**Size:** ${this.formatBytes(result.metrics.originalSize)} → ${this.formatBytes(result.metrics.optimizedSize)} (${result.metrics.compression}% smaller)\n\n`;
            }
            
            if (result.optimizations && result.optimizations.length > 0) {
                md += `**Optimizations Applied:**\n`;
                for (const opt of result.optimizations) {
                    md += `- ${opt}\n`;
                }
                md += `\n`;
            }
            
            if (result.errors && result.errors.length > 0) {
                md += `**❌ Critical Errors:**\n`;
                for (const error of result.errors) {
                    md += `- ${error}\n`;
                }
                md += `\n`;
            }
            
            if (result.warnings && result.warnings.length > 0) {
                md += `**⚠️ Warnings:**\n`;
                for (const warning of result.warnings) {
                    md += `- ${warning}\n`;
                }
                md += `\n`;
            }
        }
        
        md += `## 🎯 Recommendations\n\n`;
        
        const errorResults = results.filter(r => r.status === 'error');
        const warningResults = results.filter(r => r.status === 'warning');
        const highCompressionResults = results.filter(r => r.metrics && parseFloat(r.metrics.compression) > 90);
        
        if (errorResults.length > 0) {
            md += `### ❌ Critical Issues\n\n`;
            md += `${errorResults.length} animation(s) have critical errors that need immediate attention:\n\n`;
            for (const result of errorResults) {
                md += `- **${result.animation}**: ${result.errors.join(', ')}\n`;
            }
            md += `\n**Action Required:** Review and fix these animations before deployment.\n\n`;
        }
        
        if (warningResults.length > 0) {
            md += `### ⚠️ Review Recommended\n\n`;
            md += `${warningResults.length} animation(s) have warnings that should be reviewed:\n\n`;
            for (const result of warningResults.slice(0, 5)) { // Show first 5
                md += `- **${result.animation}**: ${result.warnings.join(', ')}\n`;
            }
            if (warningResults.length > 5) {
                md += `- ... and ${warningResults.length - 5} more\n`;
            }
            md += `\n**Action Suggested:** Manual verification of animation quality recommended.\n\n`;
        }
        
        if (highCompressionResults.length > 0) {
            md += `### 🔍 High Compression Achieved\n\n`;
            md += `${highCompressionResults.length} animation(s) achieved >90% compression - verify quality:\n\n`;
            for (const result of highCompressionResults) {
                md += `- **${result.animation}**: ${result.metrics.compression}% compression\n`;
            }
            md += `\n**Action Suggested:** Visual comparison with originals recommended.\n\n`;
        }
        
        const successfulOptimizations = results.filter(r => r.status === 'success' || r.status === 'warning');
        if (successfulOptimizations.length > 0) {
            md += `### ✅ Ready for Production\n\n`;
            md += `${successfulOptimizations.length} animation(s) successfully optimized and ready for deployment.\n\n`;
            
            const avgCompression = successfulOptimizations.reduce((sum, r) => sum + parseFloat(r.metrics?.compression || 0), 0) / successfulOptimizations.length;
            md += `**Average Compression:** ${avgCompression.toFixed(1)}%\n\n`;
        }
        
        return md;
    }

    printValidationSummary() {
        const summary = this.generateSummary();
        
        console.log('\n' + '='.repeat(50));
        console.log('🎯 VALIDATION SUMMARY');
        console.log('='.repeat(50));
        console.log(`📊 Total Animations: ${summary.total}`);
        console.log(`✅ Successful: ${summary.success}`);
        console.log(`⚠️  With Warnings: ${summary.warnings}`);
        console.log(`❌ Errors: ${summary.errors}`);
        console.log(`🔍 Missing: ${summary.missing}`);
        console.log('');
        console.log(`📦 Original Size: ${summary.totalOriginalSize}`);
        console.log(`🗜️  Optimized Size: ${summary.totalOptimizedSize}`);
        console.log(`💾 Space Saved: ${summary.spaceSaved} (${summary.overallCompression})`);
        console.log('='.repeat(50));
        
        if (summary.errors > 0) {
            console.log(`\n⚠️  ${summary.errors} animation(s) have critical errors - review required!`);
        } else if (summary.warnings > 0) {
            console.log(`\n✅ All animations passed validation with ${summary.warnings} warning(s).`);
        } else {
            console.log(`\n🎉 All animations passed validation successfully!`);
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
}

// CLI execution
async function main() {
    const validator = new LottieValidation();
    
    try {
        const results = await validator.validate();
        
        // Exit with error code if there are critical errors
        const hasErrors = results.some(r => r.status === 'error');
        process.exit(hasErrors ? 1 : 0);
        
    } catch (error) {
        console.error('❌ Validation failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export default LottieValidation;