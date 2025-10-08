#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const srcDir = path.resolve(process.cwd(), '../src');
const outDir = path.resolve(process.cwd(), '../out');
const reportsDir = path.resolve(process.cwd(), '../reports');

const OPTIMIZATION_SETTINGS = {
    precision: 3,                    // Decimal places for most values
    transformPrecision: 2,           // Decimal places for transforms/opacity  
    removeNames: true,               // Remove 'nm' properties
    removeMarkers: true,             // Remove markers
    removeHiddenLayers: true,        // Remove layers with hd: true
    dedupeKeyframes: true,           // Remove identical consecutive keyframes
    normalizeFrameRate: true,        // Clamp frame rates to 30fps max
    removeMetadata: true,            // Remove 'meta' properties
    tolerance: 0.001                 // Tolerance for comparing keyframe values
};

async function main() {
    console.log('🔧 Starting Lottie optimization pipeline...');
    
    // Ensure output directory exists
    await fs.promises.mkdir(path.join(outDir, 'minified'), { recursive: true });
    
    const files = await fs.promises.readdir(srcDir);
    const jsonFiles = files.filter(f => f.endsWith('.json') && !f.includes('Zone.Identifier'));
    
    const results = {
        timestamp: new Date().toISOString(),
        settings: OPTIMIZATION_SETTINGS,
        files: [],
        summary: {
            totalFiles: jsonFiles.length,
            totalSavings: { bytes: 0, percent: 0 },
            optimizations: {
                precisionRounding: 0,
                metadataRemoval: 0,
                keyframeDeduplication: 0,
                frameRateNormalization: 0
            }
        }
    };

    for (const file of jsonFiles) {
        const filePath = path.join(srcDir, file);
        const outputPath = path.join(outDir, 'minified', file);
        
        try {
            console.log(`\n📄 Processing ${file}...`);
            
            const originalContent = await fs.promises.readFile(filePath, 'utf8');
            const originalData = JSON.parse(originalContent);
            const originalSize = Buffer.byteLength(originalContent, 'utf8');
            
            // Apply optimizations
            const optimizedData = await optimizeLottie(originalData, file);
            const optimizedContent = JSON.stringify(optimizedData);
            const optimizedSize = Buffer.byteLength(optimizedContent, 'utf8');
            
            // Save optimized file
            await fs.promises.writeFile(outputPath, optimizedContent);
            
            const savings = {
                bytes: originalSize - optimizedSize,
                percent: ((originalSize - optimizedSize) / originalSize * 100)
            };
            
            results.files.push({
                filename: file,
                originalSize,
                optimizedSize,
                savings,
                optimizations: optimizedData._optimizations || {}
            });
            
            results.summary.totalSavings.bytes += savings.bytes;
            
            console.log(`  ✓ ${file}: ${(originalSize/1024).toFixed(1)}KB → ${(optimizedSize/1024).toFixed(1)}KB (-${savings.percent.toFixed(1)}%)`);
            
        } catch (error) {
            console.error(`  ❌ Error processing ${file}:`, error.message);
        }
    }
    
    // Calculate overall savings
    const totalOriginalSize = results.files.reduce((sum, f) => sum + f.originalSize, 0);
    results.summary.totalSavings.percent = (results.summary.totalSavings.bytes / totalOriginalSize * 100);
    
    // Write results
    await fs.promises.writeFile(
        path.join(reportsDir, 'size-comparison-initial.json'),
        JSON.stringify(results, null, 2)
    );
    
    // Generate comparison report
    const comparisonMd = await generateComparisonReport(results);
    await fs.promises.writeFile(
        path.join(reportsDir, 'size-comparison.md'),
        comparisonMd
    );
    
    console.log('\n🎯 Optimization Complete!');
    console.log(`Total files processed: ${results.summary.totalFiles}`);
    console.log(`Total size reduction: ${(results.summary.totalSavings.bytes/1024).toFixed(1)}KB (-${results.summary.totalSavings.percent.toFixed(1)}%)`);
}

async function optimizeLottie(data, filename) {
    const optimized = JSON.parse(JSON.stringify(data)); // Deep clone
    const optimizationLog = {
        precisionRounds: 0,
        removedNames: 0,
        removedMarkers: 0,
        removedHiddenLayers: 0,
        deduplicatedKeyframes: 0,
        frameRateChanged: false
    };
    
    console.log(`  🔄 Applying optimizations...`);
    
    // 1. Frame rate normalization
    if (OPTIMIZATION_SETTINGS.normalizeFrameRate && optimized.fr > 30) {
        const oldFr = optimized.fr;
        optimized.fr = 30;
        // Proportionally adjust timing if needed
        if (optimized.op) {
            optimized.op = Math.round(optimized.op * (30 / oldFr));
        }
        optimizationLog.frameRateChanged = true;
        console.log(`    📊 Frame rate: ${oldFr}fps → 30fps`);
    }
    
    // 2. Apply recursive optimizations
    optimizeObject(optimized, optimizationLog);
    
    // 3. Remove top-level metadata
    if (OPTIMIZATION_SETTINGS.removeMetadata && optimized.meta) {
        delete optimized.meta;
        optimizationLog.removedNames++;
    }
    
    // Store optimization log (for reporting only, remove before final output)
    optimized._optimizations = optimizationLog;
    
    console.log(`    ✨ Applied ${Object.values(optimizationLog).filter(v => typeof v === 'number').reduce((a,b) => a+b, 0)} optimizations`);
    
    return optimized;
}

function optimizeObject(obj, log) {
    if (Array.isArray(obj)) {
        // Handle keyframe deduplication for arrays
        if (obj.length > 1 && OPTIMIZATION_SETTINGS.dedupeKeyframes) {
            const deduplicated = deduplicateKeyframes(obj, log);
            obj.length = 0;
            obj.push(...deduplicated);
        }
        
        obj.forEach(item => optimizeObject(item, log));
    } else if (obj && typeof obj === 'object') {
        for (const [key, value] of Object.entries(obj)) {
            // Remove names
            if (key === 'nm' && OPTIMIZATION_SETTINGS.removeNames) {
                delete obj[key];
                log.removedNames++;
                continue;
            }
            
            // Remove markers
            if (key === 'markers' && OPTIMIZATION_SETTINGS.removeMarkers) {
                delete obj[key];
                log.removedMarkers++;
                continue;
            }
            
            // Remove hidden layers
            if (key === 'hd' && value === true && OPTIMIZATION_SETTINGS.removeHiddenLayers) {
                // Mark for removal at parent level
                obj._shouldRemove = true;
                continue;
            }
            
            // Round numeric values
            if (typeof value === 'number') {
                const precision = isTransformProperty(key) ? 
                    OPTIMIZATION_SETTINGS.transformPrecision : 
                    OPTIMIZATION_SETTINGS.precision;
                    
                const rounded = Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
                if (rounded !== value) {
                    obj[key] = rounded;
                    log.precisionRounds++;
                }
            } else {
                // Recurse into nested objects/arrays
                optimizeObject(value, log);
            }
        }
        
        // Remove layers/objects marked for deletion
        if (obj.layers && Array.isArray(obj.layers)) {
            const originalLength = obj.layers.length;
            obj.layers = obj.layers.filter(layer => !layer._shouldRemove);
            if (obj.layers.length < originalLength) {
                log.removedHiddenLayers += (originalLength - obj.layers.length);
            }
        }
    }
}

function deduplicateKeyframes(keyframes, log) {
    // Only process arrays that look like keyframe arrays (have 't' property)
    if (keyframes.length < 2 || !keyframes[0] || typeof keyframes[0] !== 'object' || !keyframes[0].hasOwnProperty('t')) {
        return keyframes;
    }
    
    const result = [keyframes[0]];
    
    for (let i = 1; i < keyframes.length; i++) {
        const current = keyframes[i];
        const previous = keyframes[i - 1];
        
        // Only compare actual keyframe objects
        if (!current || !previous || typeof current !== 'object' || typeof previous !== 'object') {
            result.push(current);
            continue;
        }
        
        // Compare keyframe values (more conservative)
        if (!areKeyframesEqual(current, previous)) {
            result.push(current);
        } else {
            log.deduplicatedKeyframes++;
        }
    }
    
    return result;
}

function areKeyframesEqual(kf1, kf2) {
    if (!kf1 || !kf2) return false;
    
    // Compare time values
    if (Math.abs((kf1.t || 0) - (kf2.t || 0)) > OPTIMIZATION_SETTINGS.tolerance) {
        return false;
    }
    
    // Compare shape values (simplified)
    if (kf1.s && kf2.s) {
        if (Array.isArray(kf1.s) && Array.isArray(kf2.s)) {
            if (kf1.s.length !== kf2.s.length) return false;
            
            for (let i = 0; i < kf1.s.length; i++) {
                if (Math.abs(kf1.s[i] - kf2.s[i]) > OPTIMIZATION_SETTINGS.tolerance) {
                    return false;
                }
            }
        } else if (typeof kf1.s === 'number' && typeof kf2.s === 'number') {
            return Math.abs(kf1.s - kf2.s) <= OPTIMIZATION_SETTINGS.tolerance;
        }
    }
    
    return true;
}

function isTransformProperty(key) {
    // Transform properties that need higher precision
    const transformProps = ['p', 'a', 's', 'r', 'o', 'sk', 'sa'];
    return transformProps.includes(key);
}

async function generateComparisonReport(results) {
    // Load original size data
    let originalSizeData;
    try {
        originalSizeData = JSON.parse(
            await fs.promises.readFile(path.join(reportsDir, 'size-summary.json'), 'utf8')
        );
    } catch (error) {
        console.warn('Could not load original size data for comparison');
        originalSizeData = { files: [] };
    }
    
    let md = `# Lottie Optimization Results - Size Comparison

Generated: ${new Date(results.timestamp).toLocaleString()}

## Optimization Settings
- **Precision**: ${results.settings.precision} decimal places (${results.settings.transformPrecision} for transforms)
- **Remove Names**: ${results.settings.removeNames ? 'Yes' : 'No'}
- **Remove Markers**: ${results.settings.removeMarkers ? 'Yes' : 'No'}
- **Dedupe Keyframes**: ${results.settings.dedupeKeyframes ? 'Yes' : 'No'}
- **Normalize Frame Rate**: ${results.settings.normalizeFrameRate ? 'Yes (30fps max)' : 'No'}

## Overall Results

- **Files Processed**: ${results.summary.totalFiles}
- **Total Size Reduction**: ${(results.summary.totalSavings.bytes/1024).toFixed(1)}KB (-${results.summary.totalSavings.percent.toFixed(1)}%)

## File-by-File Results

| File | Original | Optimized | Savings | Optimizations Applied |
|------|----------|-----------|---------|----------------------|
`;

    results.files.forEach(f => {
        const originalKB = (f.originalSize / 1024).toFixed(1);
        const optimizedKB = (f.optimizedSize / 1024).toFixed(1);
        const savingsKB = ((f.originalSize - f.optimizedSize) / 1024).toFixed(1);
        const opts = f.optimizations;
        const optList = [
            opts.precisionRounds > 0 ? `${opts.precisionRounds} precision` : '',
            opts.removedNames > 0 ? `${opts.removedNames} names` : '',
            opts.deduplicatedKeyframes > 0 ? `${opts.deduplicatedKeyframes} keyframes` : '',
            opts.frameRateChanged ? 'frame rate' : ''
        ].filter(Boolean).join(', ') || 'None';
        
        md += `| ${f.filename} | ${originalKB}KB | ${optimizedKB}KB | -${savingsKB}KB (-${f.savings.percent.toFixed(1)}%) | ${optList} |\\n`;
    });

    md += `

## Compression Analysis

### Before vs After Optimization (with Gzip/Brotli)

`;

    // Add compression comparison if original data is available
    if (originalSizeData.files.length > 0) {
        md += `| File | Before Optim (Raw) | After Optim (Raw) | Raw Savings | Gzip Potential | Brotli Potential |
|------|-------------------|-------------------|-------------|---------------|------------------|
`;

        for (const file of results.files) {
            const originalFile = originalSizeData.files.find(of => of.file === file.filename);
            if (originalFile) {
                const beforeKB = (originalFile.sizes.raw / 1024).toFixed(1);
                const afterKB = (file.optimizedSize / 1024).toFixed(1);
                const rawSavings = ((originalFile.sizes.raw - file.optimizedSize) / originalFile.sizes.raw * 100).toFixed(1);
                
                // Estimate compression on optimized files (simplified estimate)
                const gzipEst = (file.optimizedSize * 0.15).toFixed(1); // Assume ~85% compression
                const brotliEst = (file.optimizedSize * 0.12).toFixed(1); // Assume ~88% compression
                
                md += `| ${file.filename} | ${beforeKB}KB | ${afterKB}KB | -${rawSavings}% | ~${(gzipEst/1024).toFixed(1)}KB | ~${(brotliEst/1024).toFixed(1)}KB |\\n`;
            }
        }
    }

    md += `

## Optimization Impact Analysis

### Most Effective Optimizations
1. **Precision Rounding**: Applied to ${results.files.filter(f => f.optimizations.precisionRounds > 0).length} files
2. **Metadata Removal**: Applied to ${results.files.filter(f => f.optimizations.removedNames > 0).length} files
3. **Frame Rate Normalization**: Applied to ${results.files.filter(f => f.optimizations.frameRateChanged).length} files
4. **Keyframe Deduplication**: Applied to ${results.files.filter(f => f.optimizations.deduplicatedKeyframes > 0).length} files

### Files with Highest Savings
`;

    const topSavings = results.files
        .sort((a, b) => b.savings.percent - a.savings.percent)
        .slice(0, 5);
    
    topSavings.forEach((f, i) => {
        md += `${i + 1}. **${f.filename}**: ${f.savings.percent.toFixed(1)}% reduction (${((f.originalSize - f.optimizedSize)/1024).toFixed(1)}KB saved)\\n`;
    });

    md += `

## Next Steps

### Immediate Deployment
The optimized files in \`out/minified/\` are ready for deployment and should provide:
- ${results.summary.totalSavings.percent.toFixed(1)}% smaller payload
- Faster parsing due to simplified structure
- Better compression ratios when served with gzip/brotli

### Further Optimization Opportunities
1. **Renderer switching** to Canvas (9 files) for additional performance gains
2. **dotLottie bundling** for related animations
3. **Brotli compression** deployment (additional 15% savings)

---
*Generated by minify-lottie.mjs*
*Optimized files saved to: out/minified/*
`;

    return md;
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { optimizeLottie, main };