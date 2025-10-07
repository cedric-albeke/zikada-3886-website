#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const brotliCompress = promisify(zlib.brotliCompress);

const srcDir = path.resolve(process.cwd(), '../src');
const reportsDir = path.resolve(process.cwd(), '../reports');

async function analyzeFile(filePath) {
    const stats = await fs.promises.stat(filePath);
    const content = await fs.promises.readFile(filePath);
    
    const gzipped = await gzip(content);
    const brotlied = await brotliCompress(content);
    
    return {
        raw: stats.size,
        gzip: gzipped.length,
        brotli: brotlied.length
    };
}

async function main() {
    console.log('📊 Analyzing Lottie file sizes...');
    
    const files = await fs.promises.readdir(srcDir);
    const results = {
        timestamp: new Date().toISOString(),
        files: [],
        totals: {
            raw: 0,
            gzip: 0,
            brotli: 0
        }
    };
    
    // Process both JSON and .lottie files
    const targetFiles = files.filter(f => 
        (f.endsWith('.json') && !f.includes('Zone.Identifier')) ||
        f.endsWith('.lottie')
    );
    
    console.log(`Found ${targetFiles.length} files to analyze`);
    
    for (const file of targetFiles) {
        const filePath = path.join(srcDir, file);
        const ext = path.extname(file);
        const baseName = path.basename(file, ext);
        
        try {
            const sizes = await analyzeFile(filePath);
            const result = {
                name: baseName,
                file: file,
                type: ext === '.json' ? 'json' : 'lottie',
                sizes: sizes,
                compressionRatio: {
                    gzip: ((sizes.raw - sizes.gzip) / sizes.raw * 100),
                    brotli: ((sizes.raw - sizes.brotli) / sizes.raw * 100)
                }
            };
            
            results.files.push(result);
            results.totals.raw += sizes.raw;
            results.totals.gzip += sizes.gzip;
            results.totals.brotli += sizes.brotli;
            
            console.log(`✓ ${file}: ${(sizes.raw/1024).toFixed(1)}KB → ${(sizes.gzip/1024).toFixed(1)}KB (gz) → ${(sizes.brotli/1024).toFixed(1)}KB (br)`);
        } catch (error) {
            console.error(`❌ Error analyzing ${file}:`, error.message);
        }
    }
    
    // Sort by raw size descending
    results.files.sort((a, b) => b.sizes.raw - a.sizes.raw);
    
    // Calculate total compression ratios
    results.totals.compressionRatio = {
        gzip: ((results.totals.raw - results.totals.gzip) / results.totals.raw * 100),
        brotli: ((results.totals.raw - results.totals.brotli) / results.totals.raw * 100)
    };
    
    // Write JSON report
    await fs.promises.writeFile(
        path.join(reportsDir, 'size-summary.json'),
        JSON.stringify(results, null, 2)
    );
    
    // Generate markdown report
    const mdContent = generateMarkdownReport(results);
    await fs.promises.writeFile(
        path.join(reportsDir, 'size-summary.md'),
        mdContent
    );
    
    console.log('\\n📈 Analysis Complete!');
    console.log(`Total payload: ${(results.totals.raw/1024).toFixed(1)}KB raw → ${(results.totals.gzip/1024).toFixed(1)}KB gzipped → ${(results.totals.brotli/1024).toFixed(1)}KB brotli`);
    console.log(`Compression savings: ${results.totals.compressionRatio.gzip.toFixed(1)}% (gzip) | ${results.totals.compressionRatio.brotli.toFixed(1)}% (brotli)`);
}

function generateMarkdownReport(results) {
    const { files, totals } = results;
    
    let md = `# Lottie Animation Size Analysis

Generated: ${new Date(results.timestamp).toLocaleString()}

## Summary

| Metric | Raw | Gzipped | Brotli | Savings (gz) | Savings (br) |
|--------|-----|---------|--------|--------------|--------------|
| **Total** | **${(totals.raw/1024).toFixed(1)} KB** | **${(totals.gzip/1024).toFixed(1)} KB** | **${(totals.brotli/1024).toFixed(1)} KB** | **${totals.compressionRatio.gzip.toFixed(1)}%** | **${totals.compressionRatio.brotli.toFixed(1)}%** |

## File Breakdown (sorted by size)

| Filename | Type | Raw Size | Gzipped | Brotli | GZ Savings | BR Savings |
|----------|------|----------|---------|--------|------------|------------|
`;

    files.forEach(f => {
        const raw = (f.sizes.raw / 1024).toFixed(1);
        const gz = (f.sizes.gzip / 1024).toFixed(1);
        const br = (f.sizes.brotli / 1024).toFixed(1);
        const gzSave = f.compressionRatio.gzip.toFixed(1);
        const brSave = f.compressionRatio.brotli.toFixed(1);
        
        md += `| ${f.file} | ${f.type} | ${raw} KB | ${gz} KB | ${br} KB | ${gzSave}% | ${brSave}% |\\n`;
    });

    md += `

## Analysis Notes

### Largest Files
`;
    files.slice(0, 3).forEach((f, i) => {
        md += `${i + 1}. **${f.name}**: ${(f.sizes.raw/1024).toFixed(1)}KB raw (${f.type} format)\\n`;
    });

    md += `
### Format Comparison
- **JSON files**: ${files.filter(f => f.type === 'json').length} files, ${(files.filter(f => f.type === 'json').reduce((sum, f) => sum + f.sizes.raw, 0)/1024).toFixed(1)}KB total
- **Lottie files**: ${files.filter(f => f.type === 'lottie').length} files, ${(files.filter(f => f.type === 'lottie').reduce((sum, f) => sum + f.sizes.raw, 0)/1024).toFixed(1)}KB total

### Optimization Opportunities
- Files with lowest compression ratios may benefit from structural optimization
- Consider dotLottie format for bundling related animations
- Large files (>50KB) should be prioritized for optimization efforts

---
*Generated by analyze-sizes.mjs*
`;

    return md;
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { analyzeFile, main };