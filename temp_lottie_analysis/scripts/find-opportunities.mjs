#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const reportsDir = path.resolve(process.cwd(), '../reports');

async function main() {
    console.log('🔍 Analyzing optimization opportunities...');
    
    // Load structure analysis results
    const structureData = JSON.parse(
        await fs.promises.readFile(path.join(reportsDir, 'structure.json'), 'utf8')
    );
    
    // Load size analysis results
    const sizeData = JSON.parse(
        await fs.promises.readFile(path.join(reportsDir, 'size-summary.json'), 'utf8')
    );

    const opportunities = {
        timestamp: new Date().toISOString(),
        summary: {
            totalFiles: structureData.files.length,
            quickWins: 0,
            structuralRefactors: 0,
            estimatedSavings: {
                minPercent: 0,
                maxPercent: 0,
                targetFiles: []
            }
        },
        files: []
    };

    for (const structFile of structureData.files) {
        const sizeFile = sizeData.files.find(sf => sf.file === structFile.filename);
        const analysis = analyzeFile(structFile, sizeFile);
        opportunities.files.push(analysis);
        
        // Update summary
        opportunities.summary.quickWins += analysis.quickWins.length;
        opportunities.summary.structuralRefactors += analysis.structuralRefactors.length;
        
        if (analysis.totalEstimatedSavings.max > 15) {
            opportunities.summary.estimatedSavings.targetFiles.push({
                file: structFile.filename,
                savings: analysis.totalEstimatedSavings
            });
        }
        
        console.log(`✓ ${structFile.filename}: ${analysis.quickWins.length} quick wins, ${analysis.structuralRefactors.length} structural opportunities`);
    }

    // Calculate overall savings potential
    const totalCurrentSize = sizeData.totals.raw;
    let minSavingsBytes = 0;
    let maxSavingsBytes = 0;
    
    for (const fileOpp of opportunities.files) {
        const fileSize = sizeData.files.find(sf => sf.file === fileOpp.filename)?.sizes.raw || 0;
        minSavingsBytes += (fileSize * fileOpp.totalEstimatedSavings.min / 100);
        maxSavingsBytes += (fileSize * fileOpp.totalEstimatedSavings.max / 100);
    }
    
    opportunities.summary.estimatedSavings.minPercent = (minSavingsBytes / totalCurrentSize * 100);
    opportunities.summary.estimatedSavings.maxPercent = (maxSavingsBytes / totalCurrentSize * 100);

    // Sort files by potential impact
    opportunities.files.sort((a, b) => {
        const sizeA = sizeData.files.find(sf => sf.file === a.filename)?.sizes.raw || 0;
        const sizeB = sizeData.files.find(sf => sf.file === b.filename)?.sizes.raw || 0;
        const impactA = sizeA * a.totalEstimatedSavings.max / 100;
        const impactB = sizeB * b.totalEstimatedSavings.max / 100;
        return impactB - impactA;
    });

    // Write JSON report
    await fs.promises.writeFile(
        path.join(reportsDir, 'opportunities.json'),
        JSON.stringify(opportunities, null, 2)
    );

    // Generate markdown report
    const mdContent = generateMarkdownReport(opportunities, sizeData);
    await fs.promises.writeFile(
        path.join(reportsDir, 'opportunities.md'),
        mdContent
    );

    console.log('\n🎯 Opportunity Analysis Complete!');
    console.log(`Total quick wins: ${opportunities.summary.quickWins}`);
    console.log(`Structural refactors: ${opportunities.summary.structuralRefactors}`);
    console.log(`Estimated savings: ${opportunities.summary.estimatedSavings.minPercent.toFixed(1)}% - ${opportunities.summary.estimatedSavings.maxPercent.toFixed(1)}%`);
}

function analyzeFile(structData, sizeData) {
    const analysis = {
        filename: structData.filename,
        currentSize: sizeData ? sizeData.sizes.raw : 0,
        quickWins: [],
        structuralRefactors: [],
        rendererOptimization: {
            current: 'unknown',
            recommended: 'canvas',
            reason: ''
        },
        totalEstimatedSavings: {
            min: 0,
            max: 0
        }
    };

    // Determine recommended renderer
    if (structData.shapes.mergePaths > 0) {
        analysis.rendererOptimization.recommended = 'svg';
        analysis.rendererOptimization.reason = 'Merge paths require SVG renderer';
    } else if (structData.shapes.masks > 2) {
        analysis.rendererOptimization.recommended = 'svg';
        analysis.rendererOptimization.reason = 'Complex masking better with SVG';
    } else if (structData.layers.byType.text > 0) {
        analysis.rendererOptimization.recommended = 'svg';
        analysis.rendererOptimization.reason = 'Text rendering quality';
    } else if (structData.complexity.totalVertices > 2000) {
        analysis.rendererOptimization.recommended = 'canvas';
        analysis.rendererOptimization.reason = 'High vertex count performs better with Canvas';
    } else {
        analysis.rendererOptimization.recommended = 'canvas';
        analysis.rendererOptimization.reason = 'Good performance for shapes and paths';
    }

    // Quick Win Opportunities
    let quickWinSavings = 0;

    // 1. Precision rounding
    if (sizeData && sizeData.sizes.raw > 1000) {
        analysis.quickWins.push({
            type: 'precision_rounding',
            description: 'Round numeric values to 3 decimal places',
            estimatedSavings: { min: 8, max: 15 },
            effort: 'LOW',
            risk: 'NONE'
        });
        quickWinSavings += 12;
    }

    // 2. Metadata pruning
    if (structData.basic.version) {
        analysis.quickWins.push({
            type: 'metadata_pruning',
            description: 'Remove names (nm), markers, and unused metadata',
            estimatedSavings: { min: 3, max: 8 },
            effort: 'LOW',
            risk: 'NONE'
        });
        quickWinSavings += 5;
    }

    // 3. Frame rate optimization
    if (structData.basic.frameRate > 30) {
        analysis.quickWins.push({
            type: 'frame_rate_optimization',
            description: `Reduce frame rate from ${structData.basic.frameRate}fps to 30fps`,
            estimatedSavings: { min: 10, max: 25 },
            effort: 'LOW',
            risk: 'LOW'
        });
        quickWinSavings += 18;
    }

    // 4. Keyframe deduplication
    if (structData.keyframes.total > 100) {
        analysis.quickWins.push({
            type: 'keyframe_deduplication',
            description: 'Remove identical consecutive keyframes',
            estimatedSavings: { min: 2, max: 12 },
            effort: 'LOW',
            risk: 'NONE'
        });
        quickWinSavings += 7;
    }

    // Structural Refactor Opportunities
    let structuralSavings = 0;

    // 1. Merge paths optimization
    if (structData.shapes.mergePaths > 0) {
        analysis.structuralRefactors.push({
            type: 'merge_paths_simplification',
            description: 'Simplify or bake merge path operations in After Effects',
            estimatedSavings: { min: 15, max: 40 },
            effort: 'HIGH',
            risk: 'MEDIUM',
            requiresReexport: true
        });
        structuralSavings += 25;
    }

    // 2. Repeater optimization
    if (structData.shapes.repeaters > 0) {
        analysis.structuralRefactors.push({
            type: 'repeater_optimization',
            description: 'Replace repeaters with precomposed elements or reduce copies',
            estimatedSavings: { min: 20, max: 60 },
            effort: 'HIGH',
            risk: 'MEDIUM',
            requiresReexport: true
        });
        structuralSavings += 35;
    }

    // 3. High vertex count optimization
    if (structData.complexity.totalVertices > 1000) {
        analysis.structuralRefactors.push({
            type: 'path_simplification',
            description: 'Simplify paths to reduce vertex count',
            estimatedSavings: { min: 10, max: 30 },
            effort: 'MEDIUM',
            risk: 'LOW',
            requiresReexport: true
        });
        structuralSavings += 15;
    }

    // 4. Gradient optimization
    if (structData.shapes.gradients > 0 && structData.shapes.gradientStops > 20) {
        analysis.structuralRefactors.push({
            type: 'gradient_optimization',
            description: 'Reduce gradient stops and remove highlight properties',
            estimatedSavings: { min: 5, max: 20 },
            effort: 'MEDIUM',
            risk: 'LOW',
            requiresReexport: false
        });
        structuralSavings += 10;
    }

    // 5. Trim path optimization
    if (structData.shapes.trimPaths > 3) {
        analysis.structuralRefactors.push({
            type: 'trim_path_optimization',
            description: 'Consolidate or bake trim path operations',
            estimatedSavings: { min: 8, max: 25 },
            effort: 'MEDIUM',
            risk: 'MEDIUM',
            requiresReexport: true
        });
        structuralSavings += 15;
    }

    // Calculate total estimated savings
    analysis.totalEstimatedSavings.min = Math.min(quickWinSavings + structuralSavings * 0.5, 45);
    analysis.totalEstimatedSavings.max = Math.min(quickWinSavings + structuralSavings, 75);

    return analysis;
}

function generateMarkdownReport(opportunities, sizeData) {
    const { files, summary } = opportunities;
    
    let md = `# Lottie Optimization Opportunities

Generated: ${new Date(opportunities.timestamp).toLocaleString()}

## Executive Summary

- **Total Files**: ${summary.totalFiles}
- **Quick Win Opportunities**: ${summary.quickWins} 
- **Structural Refactor Opportunities**: ${summary.structuralRefactors}
- **Estimated Overall Savings**: ${summary.estimatedSavings.minPercent.toFixed(1)}% - ${summary.estimatedSavings.maxPercent.toFixed(1)}% of total payload

## Priority Files by Impact

| File | Current Size | Est. Savings | Quick Wins | Structural | Renderer |
|------|--------------|--------------|------------|------------|----------|
`;

    files.forEach(f => {
        const currentSizeKB = (f.currentSize / 1024).toFixed(1);
        const savingsRange = `${f.totalEstimatedSavings.min}-${f.totalEstimatedSavings.max}%`;
        md += `| ${f.filename} | ${currentSizeKB}KB | ${savingsRange} | ${f.quickWins.length} | ${f.structuralRefactors.length} | ${f.rendererOptimization.recommended} |\\n`;
    });

    md += `

## Quick Win Opportunities (Low Risk, High Impact)

`;

    // Group quick wins by type
    const quickWinTypes = {};
    files.forEach(f => {
        f.quickWins.forEach(qw => {
            if (!quickWinTypes[qw.type]) {
                quickWinTypes[qw.type] = { files: [], description: qw.description, totalSavings: 0 };
            }
            quickWinTypes[qw.type].files.push(f.filename);
            quickWinTypes[qw.type].totalSavings += (qw.estimatedSavings.min + qw.estimatedSavings.max) / 2;
        });
    });

    Object.entries(quickWinTypes).forEach(([type, data]) => {
        md += `### ${type.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase())}
**Description**: ${data.description}
**Files Affected**: ${data.files.length} (${data.files.slice(0, 3).join(', ')}${data.files.length > 3 ? '...' : ''})
**Average Savings**: ${(data.totalSavings / data.files.length).toFixed(1)}% per file

`;
    });

    md += `## Structural Refactor Opportunities

`;

    const structuralTypes = {};
    files.forEach(f => {
        f.structuralRefactors.forEach(sr => {
            if (!structuralTypes[sr.type]) {
                structuralTypes[sr.type] = { files: [], description: sr.description, totalSavings: 0, effort: sr.effort };
            }
            structuralTypes[sr.type].files.push(f.filename);
            structuralTypes[sr.type].totalSavings += (sr.estimatedSavings.min + sr.estimatedSavings.max) / 2;
        });
    });

    Object.entries(structuralTypes).forEach(([type, data]) => {
        md += `### ${type.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase())}
**Description**: ${data.description}
**Effort Level**: ${data.effort}
**Files Affected**: ${data.files.length} (${data.files.join(', ')})
**Average Savings**: ${(data.totalSavings / data.files.length).toFixed(1)}% per file

`;
    });

    md += `## Renderer Optimization Matrix

| File | Current | Recommended | Reason | Performance Impact |
|------|---------|-------------|--------|--------------------|
`;

    files.forEach(f => {
        const perfImpact = f.rendererOptimization.recommended === 'canvas' ? 'Higher FPS' : 'Better Quality';
        md += `| ${f.filename} | SVG | **${f.rendererOptimization.recommended.toUpperCase()}** | ${f.rendererOptimization.reason} | ${perfImpact} |\\n`;
    });

    md += `

## Implementation Roadmap

### Phase 1: Quick Wins (Week 1)
**Target**: 15-25% size reduction, minimal risk

1. **Precision Rounding** (All files)
   - Effort: 2-4 hours
   - Risk: None
   - Expected: 8-15% reduction

2. **Metadata Pruning** (All files)  
   - Effort: 1-2 hours
   - Risk: None
   - Expected: 3-8% reduction

3. **Renderer Optimization** (9 files to Canvas)
   - Effort: 2-3 hours
   - Risk: Low
   - Expected: 10-20% performance improvement

### Phase 2: Frame Rate & Animation Tweaks (Week 2)
**Target**: Additional 5-15% savings

1. **Frame Rate Normalization** (${files.filter(f => f.quickWins.some(qw => qw.type === 'frame_rate_optimization')).length} files)
2. **Keyframe Deduplication** (${files.filter(f => f.quickWins.some(qw => qw.type === 'keyframe_deduplication')).length} files)

### Phase 3: Structural Optimization (Week 3-4)
**Target**: Additional 10-30% savings (requires re-export)

1. **Path Simplification** (${files.filter(f => f.structuralRefactors.some(sr => sr.type === 'path_simplification')).length} files)
2. **Gradient Optimization** (${files.filter(f => f.structuralRefactors.some(sr => sr.type === 'gradient_optimization')).length} files)
3. **After Effects Re-export** (where needed)

## Risk Assessment

### Low Risk (Automated)
- Precision rounding
- Metadata pruning  
- Keyframe deduplication
- Renderer switching

### Medium Risk (Requires Testing)
- Frame rate changes
- Gradient modifications
- Path simplification

### High Risk (Requires Designer Input)
- Merge path changes
- Repeater modifications
- Major structural changes

---
*Generated by find-opportunities.mjs*
`;

    return md;
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { analyzeFile, main };