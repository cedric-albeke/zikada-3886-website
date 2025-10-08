#!/usr/bin/env node

import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ConservativeLottieOptimizer {
    constructor() {
        this.projectRoot = join(__dirname, '..');
        this.srcDir = join(this.projectRoot, 'src');
        this.outDir = join(this.projectRoot, 'out', 'conservative');
        this.reportDir = join(this.projectRoot, 'reports');
    }

    async optimize() {
        console.log('🛠️  Starting conservative Lottie optimization...\n');
        
        // Ensure output directory exists
        await fs.mkdir(this.outDir, { recursive: true });
        
        // Get list of source files
        const srcFiles = await this.getJsonFiles(this.srcDir);
        console.log(`📂 Found ${srcFiles.length} files to optimize\n`);
        
        const results = [];
        
        // Process each file
        for (const file of srcFiles) {
            const result = await this.optimizeFile(file);
            results.push(result);
        }
        
        // Generate report
        await this.generateOptimizationReport(results);
        
        // Print summary
        this.printSummary(results);
        
        return results;
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

    async optimizeFile(filename) {
        console.log(`🔧 Optimizing ${filename}...`);
        
        const result = {
            filename,
            status: 'unknown',
            originalSize: 0,
            optimizedSize: 0,
            savings: 0,
            savingsPercent: 0,
            optimizations: [],
            errors: []
        };

        try {
            // Read original file
            const srcPath = join(this.srcDir, filename);
            const srcData = await fs.readFile(srcPath, 'utf8');
            result.originalSize = Buffer.byteLength(srcData, 'utf8');
            
            // Parse JSON
            let animation;
            try {
                animation = JSON.parse(srcData);
            } catch (parseError) {
                result.status = 'error';
                result.errors.push(`JSON parsing failed: ${parseError.message}`);
                console.log(`  ❌ JSON parsing failed`);
                return result;
            }

            // Apply conservative optimizations
            const optimizedAnimation = this.applyConservativeOptimizations(animation, result);
            
            // Write optimized file
            const outPath = join(this.outDir, filename);
            const optimizedData = JSON.stringify(optimizedAnimation, null, 0); // No pretty printing for size
            await fs.writeFile(outPath, optimizedData);
            
            result.optimizedSize = Buffer.byteLength(optimizedData, 'utf8');
            result.savings = result.originalSize - result.optimizedSize;
            result.savingsPercent = ((result.savings / result.originalSize) * 100).toFixed(1);
            result.status = 'success';
            
            console.log(`  ✅ ${result.savingsPercent}% smaller (${this.formatBytes(result.originalSize)} → ${this.formatBytes(result.optimizedSize)})`);
            if (result.optimizations.length > 0) {
                result.optimizations.forEach(opt => console.log(`    • ${opt}`));
            }

        } catch (error) {
            result.status = 'error';
            result.errors.push(`Optimization failed: ${error.message}`);
            console.log(`  ❌ Optimization failed: ${error.message}`);
        }

        return result;
    }

    applyConservativeOptimizations(animation, result) {
        // Create a deep copy to avoid modifying the original
        const optimized = JSON.parse(JSON.stringify(animation));
        let optimizationCount = 0;

        // 1. Round numeric values to reasonable precision (3 decimal places)
        const roundNumbers = (obj) => {
            if (typeof obj === 'number') {
                // Only round if the number has more than 3 decimal places
                if (obj % 1 !== 0 && obj.toString().split('.')[1]?.length > 3) {
                    return Math.round(obj * 1000) / 1000;
                }
                return obj;
            } else if (Array.isArray(obj)) {
                return obj.map(roundNumbers);
            } else if (typeof obj === 'object' && obj !== null) {
                const rounded = {};
                for (const [key, value] of Object.entries(obj)) {
                    rounded[key] = roundNumbers(value);
                }
                return rounded;
            }
            return obj;
        };

        const beforeRounding = JSON.stringify(optimized);
        const afterRounding = roundNumbers(optimized);
        Object.assign(optimized, afterRounding);
        
        if (JSON.stringify(optimized) !== beforeRounding) {
            result.optimizations.push('Rounded numeric precision to 3 decimals');
            optimizationCount++;
        }

        // 2. Remove non-essential metadata (but preserve critical ones)
        const removeMetadata = (obj) => {
            if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
                const cleaned = {};
                for (const [key, value] of Object.entries(obj)) {
                    // Remove these specific non-essential metadata fields
                    if (['mn', 'cl', 'cm'].includes(key)) {
                        // Skip these metadata fields
                        continue;
                    }
                    // Keep 'nm' (name) as it might be used for debugging
                    cleaned[key] = removeMetadata(value);
                }
                return cleaned;
            } else if (Array.isArray(obj)) {
                return obj.map(removeMetadata);
            }
            return obj;
        };

        const beforeMetadata = JSON.stringify(optimized);
        Object.assign(optimized, removeMetadata(optimized));
        
        if (JSON.stringify(optimized) !== beforeMetadata) {
            result.optimizations.push('Removed non-essential metadata fields');
            optimizationCount++;
        }

        // 3. Skip frame rate and animation bounds normalization to preserve exact values
        // These values should not be modified as they affect animation timing

        // 5. Clean up empty arrays and objects (but be very conservative)
        const cleanupEmpty = (obj) => {
            if (Array.isArray(obj)) {
                return obj.map(cleanupEmpty).filter(item => {
                    // Only remove truly empty objects/arrays, not falsy values
                    if (Array.isArray(item)) {
                        return item.length > 0;
                    }
                    if (typeof item === 'object' && item !== null) {
                        return Object.keys(item).length > 0;
                    }
                    return true; // Keep all other values including 0, false, null
                });
            } else if (typeof obj === 'object' && obj !== null) {
                const cleaned = {};
                for (const [key, value] of Object.entries(obj)) {
                    const cleanedValue = cleanupEmpty(value);
                    
                    // Only skip if it's an empty object or empty array
                    if (Array.isArray(cleanedValue) && cleanedValue.length === 0) {
                        continue;
                    }
                    if (typeof cleanedValue === 'object' && cleanedValue !== null && Object.keys(cleanedValue).length === 0) {
                        continue;
                    }
                    
                    cleaned[key] = cleanedValue;
                }
                return cleaned;
            }
            return obj;
        };

        const beforeCleanup = JSON.stringify(optimized);
        Object.assign(optimized, cleanupEmpty(optimized));
        
        if (JSON.stringify(optimized) !== beforeCleanup) {
            result.optimizations.push('Removed empty objects and arrays');
            optimizationCount++;
        }

        // 6. Conservative keyframe optimization (remove consecutive identical keyframes)
        const optimizeKeyframes = (obj) => {
            if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
                const processed = {};
                for (const [key, value] of Object.entries(obj)) {
                    if (key === 'k' && Array.isArray(value) && value.length > 1) {
                        // This looks like a keyframe array
                        processed[key] = this.deduplicateConsecutiveKeyframes(value);
                    } else {
                        processed[key] = optimizeKeyframes(value);
                    }
                }
                return processed;
            } else if (Array.isArray(obj)) {
                return obj.map(optimizeKeyframes);
            }
            return obj;
        };

        const beforeKeyframes = JSON.stringify(optimized);
        Object.assign(optimized, optimizeKeyframes(optimized));
        
        if (JSON.stringify(optimized) !== beforeKeyframes) {
            result.optimizations.push('Optimized consecutive identical keyframes');
            optimizationCount++;
        }

        if (optimizationCount === 0) {
            result.optimizations.push('No optimizations applied (file already optimal)');
        }

        return optimized;
    }

    deduplicateConsecutiveKeyframes(keyframes) {
        if (!Array.isArray(keyframes) || keyframes.length <= 1) {
            return keyframes;
        }

        const deduplicated = [keyframes[0]]; // Always keep the first keyframe
        
        for (let i = 1; i < keyframes.length; i++) {
            const current = keyframes[i];
            const previous = keyframes[i - 1];
            
            // Only remove if this is truly a keyframe object and it's identical to the previous one
            if (this.isKeyframe(current) && this.isKeyframe(previous)) {
                if (!this.areKeyframesEqual(current, previous)) {
                    deduplicated.push(current);
                }
                // If they are equal, skip (don't add to deduplicated)
            } else {
                // Not keyframes, keep as-is
                deduplicated.push(current);
            }
        }
        
        return deduplicated;
    }

    isKeyframe(obj) {
        return (
            typeof obj === 'object' && 
            obj !== null && 
            typeof obj.t === 'number' && // Has time property
            (obj.hasOwnProperty('s') || obj.hasOwnProperty('e') || obj.hasOwnProperty('to') || obj.hasOwnProperty('ti'))
        );
    }

    areKeyframesEqual(kf1, kf2) {
        // Compare key properties (but not time)
        const props = ['s', 'e', 'to', 'ti', 'i', 'o'];
        
        for (const prop of props) {
            if (JSON.stringify(kf1[prop]) !== JSON.stringify(kf2[prop])) {
                return false;
            }
        }
        
        return true;
    }

    async generateOptimizationReport(results) {
        await fs.mkdir(this.reportDir, { recursive: true });
        
        const report = {
            timestamp: new Date().toISOString(),
            type: 'conservative_optimization',
            summary: this.generateSummary(results),
            results
        };

        const reportPath = join(this.reportDir, `conservative-optimization-report-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`);
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        console.log(`\n📊 Optimization report generated: ${reportPath}`);
    }

    generateSummary(results) {
        const successful = results.filter(r => r.status === 'success');
        const failed = results.filter(r => r.status === 'error');
        
        const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
        const totalOptimizedSize = successful.reduce((sum, r) => sum + r.optimizedSize, 0);
        const totalSavings = totalOriginalSize - totalOptimizedSize;
        const avgSavingsPercent = successful.length > 0 ? 
            (successful.reduce((sum, r) => sum + parseFloat(r.savingsPercent), 0) / successful.length).toFixed(1) : 0;

        return {
            totalFiles: results.length,
            successful: successful.length,
            failed: failed.length,
            totalOriginalSize: this.formatBytes(totalOriginalSize),
            totalOptimizedSize: this.formatBytes(totalOptimizedSize),
            totalSavings: this.formatBytes(totalSavings),
            totalSavingsPercent: ((totalSavings / totalOriginalSize) * 100).toFixed(1),
            averageSavingsPercent: avgSavingsPercent
        };
    }

    printSummary(results) {
        const summary = this.generateSummary(results);
        
        console.log('\n' + '='.repeat(60));
        console.log('🎯 CONSERVATIVE OPTIMIZATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`📊 Total Files: ${summary.totalFiles}`);
        console.log(`✅ Successful: ${summary.successful}`);
        console.log(`❌ Failed: ${summary.failed}`);
        console.log('');
        console.log(`📦 Original Size: ${summary.totalOriginalSize}`);
        console.log(`🗜️  Optimized Size: ${summary.totalOptimizedSize}`);
        console.log(`💾 Total Savings: ${summary.totalSavings} (${summary.totalSavingsPercent}%)`);
        console.log(`📈 Average Savings: ${summary.averageSavingsPercent}%`);
        console.log('='.repeat(60));
        
        if (summary.failed > 0) {
            console.log(`\n⚠️  ${summary.failed} file(s) failed optimization. Check logs above.`);
        } else {
            console.log(`\n🎉 All files optimized successfully!`);
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
    const optimizer = new ConservativeLottieOptimizer();
    
    try {
        const results = await optimizer.optimize();
        
        // Exit with error code if there are failures
        const hasErrors = results.some(r => r.status === 'error');
        process.exit(hasErrors ? 1 : 0);
        
    } catch (error) {
        console.error('❌ Optimization failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export default ConservativeLottieOptimizer;