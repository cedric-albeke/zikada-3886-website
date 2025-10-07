#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const srcDir = path.resolve(process.cwd(), '../src');
const reportsDir = path.resolve(process.cwd(), '../reports');

function analyzeStructure(lottieData, filename) {
    const analysis = {
        filename,
        basic: {
            version: lottieData.v || 'unknown',
            frameRate: lottieData.fr || 0,
            inPoint: lottieData.ip || 0,
            outPoint: lottieData.op || 0,
            duration: lottieData.op && lottieData.fr ? (lottieData.op - (lottieData.ip || 0)) / lottieData.fr : 0,
            width: lottieData.w || 0,
            height: lottieData.h || 0
        },
        layers: {
            total: 0,
            byType: {
                shape: 0,     // ty: 4
                precomp: 0,   // ty: 0
                image: 0,     // ty: 2
                text: 0,      // ty: 5
                solid: 0,     // ty: 1
                null: 0,      // ty: 3
                adjustment: 0, // ty: 20
                camera: 0,    // ty: 13
                light: 0      // ty: 10
            }
        },
        shapes: {
            groups: 0,
            paths: 0,
            ellipses: 0,
            rectangles: 0,
            roundedCorners: 0,
            trimPaths: 0,
            gradients: 0,
            gradientStops: 0,
            strokes: 0,
            fills: 0,
            dashPatterns: 0,
            mergePaths: 0,
            repeaters: 0,
            masks: 0,
            blendModes: 0
        },
        keyframes: {
            total: 0,
            byProperty: {},
            maxPerProperty: 0
        },
        complexity: {
            totalVertices: 0,
            heaviestPaths: [],
            complexityScore: 'LOW'
        },
        assets: lottieData.assets ? lottieData.assets.length : 0,
        fonts: lottieData.fonts ? lottieData.fonts.length : 0,
        chars: lottieData.chars ? lottieData.chars.length : 0
    };

    // Analyze layers
    if (lottieData.layers) {
        analysis.layers.total = lottieData.layers.length;
        analyzeLayersRecursive(lottieData.layers, analysis, lottieData);
    }

    // Calculate complexity score
    calculateComplexityScore(analysis);

    return analysis;
}

function analyzeLayersRecursive(layers, analysis, parentData) {
    for (const layer of layers) {
        // Count layer types
        const typeMap = {
            0: 'precomp',
            1: 'solid', 
            2: 'image',
            3: 'null',
            4: 'shape',
            5: 'text',
            10: 'light',
            13: 'camera',
            20: 'adjustment'
        };
        
        const layerType = typeMap[layer.ty] || 'unknown';
        if (analysis.layers.byType[layerType] !== undefined) {
            analysis.layers.byType[layerType]++;
        }

        // Analyze keyframes in layer properties
        analyzeKeyframes(layer.ks, analysis);

        // Analyze shapes if present
        if (layer.shapes) {
            analyzeShapes(layer.shapes, analysis);
        }

        // Analyze masks if present
        if (layer.masksProperties) {
            analysis.shapes.masks += layer.masksProperties.length;
        }

        // Check for precomps and recurse
        if (layer.ty === 0 && parentData && parentData.assets) {
            const refAsset = parentData.assets.find(asset => asset.id === layer.refId);
            if (refAsset && refAsset.layers) {
                analyzeLayersRecursive(refAsset.layers, analysis, parentData);
            }
        }
    }
}

function analyzeKeyframes(ks, analysis) {
    if (!ks) return;

    const properties = ['a', 'p', 'r', 's', 'o']; // anchor, position, rotation, scale, opacity
    
    for (const prop of properties) {
        if (ks[prop] && ks[prop].k) {
            let keyframeCount = 0;
            
            if (Array.isArray(ks[prop].k)) {
                // Multiple keyframes
                keyframeCount = ks[prop].k.length;
            } else {
                // Static value
                keyframeCount = 1;
            }
            
            analysis.keyframes.total += keyframeCount;
            analysis.keyframes.byProperty[prop] = (analysis.keyframes.byProperty[prop] || 0) + keyframeCount;
            
            if (keyframeCount > analysis.keyframes.maxPerProperty) {
                analysis.keyframes.maxPerProperty = keyframeCount;
            }
        }
    }
}

function analyzeShapes(shapes, analysis) {
    for (const shape of shapes) {
        switch (shape.ty) {
            case 'gr': // group
                analysis.shapes.groups++;
                if (shape.it) {
                    analyzeShapes(shape.it, analysis);
                }
                break;
            case 'sh': // path/shape
                analysis.shapes.paths++;
                if (shape.ks && shape.ks.k && shape.ks.k.v) {
                    const vertices = Array.isArray(shape.ks.k.v) ? shape.ks.k.v.length : 0;
                    analysis.complexity.totalVertices += vertices;
                    
                    analysis.complexity.heaviestPaths.push({
                        vertices,
                        type: 'path'
                    });
                }
                break;
            case 'el': // ellipse
                analysis.shapes.ellipses++;
                break;
            case 'rc': // rectangle
                analysis.shapes.rectangles++;
                break;
            case 'rd': // rounded corners
                analysis.shapes.roundedCorners++;
                break;
            case 'tm': // trim path
                analysis.shapes.trimPaths++;
                break;
            case 'gf': // gradient fill
            case 'gs': // gradient stroke
                analysis.shapes.gradients++;
                if (shape.g && shape.g.k && shape.g.k.c) {
                    analysis.shapes.gradientStops += shape.g.k.c;
                }
                break;
            case 'st': // stroke
                analysis.shapes.strokes++;
                break;
            case 'fl': // fill
                analysis.shapes.fills++;
                break;
            case 'mm': // merge paths
                analysis.shapes.mergePaths++;
                break;
            case 'rp': // repeater
                analysis.shapes.repeaters++;
                break;
        }

        // Check for dash patterns
        if (shape.d && Array.isArray(shape.d)) {
            analysis.shapes.dashPatterns++;
        }

        // Check for blend modes
        if (shape.bm && shape.bm !== 0) {
            analysis.shapes.blendModes++;
        }
    }
}

function calculateComplexityScore(analysis) {
    let score = 0;
    let reasons = [];

    // High impact features
    if (analysis.shapes.mergePaths > 0) {
        score += 3;
        reasons.push(`${analysis.shapes.mergePaths} merge paths`);
    }
    
    if (analysis.shapes.repeaters > 0) {
        score += 3;
        reasons.push(`${analysis.shapes.repeaters} repeaters`);
    }
    
    if (analysis.complexity.totalVertices > 2000) {
        score += 2;
        reasons.push(`${analysis.complexity.totalVertices} total vertices`);
    }
    
    if (analysis.shapes.gradients > 0 && analysis.shapes.gradientStops > 40) {
        score += 2;
        reasons.push(`${analysis.shapes.gradients} gradients with ${analysis.shapes.gradientStops} stops`);
    }

    // Medium impact features
    if (analysis.shapes.trimPaths > 5) {
        score += 1;
        reasons.push(`${analysis.shapes.trimPaths} trim paths`);
    }
    
    if (analysis.keyframes.maxPerProperty > 100) {
        score += 1;
        reasons.push(`${analysis.keyframes.maxPerProperty} max keyframes per property`);
    }
    
    if (analysis.shapes.masks > 2) {
        score += 1;
        reasons.push(`${analysis.shapes.masks} masks`);
    }

    if (analysis.basic.frameRate > 30) {
        score += 1;
        reasons.push(`${analysis.basic.frameRate} fps`);
    }

    // Determine complexity level
    if (score >= 5) {
        analysis.complexity.complexityScore = 'HIGH';
    } else if (score >= 2) {
        analysis.complexity.complexityScore = 'MEDIUM';
    } else {
        analysis.complexity.complexityScore = 'LOW';
    }

    analysis.complexity.scoreDetails = {
        score,
        reasons
    };

    // Sort heaviest paths
    analysis.complexity.heaviestPaths.sort((a, b) => b.vertices - a.vertices);
    analysis.complexity.heaviestPaths = analysis.complexity.heaviestPaths.slice(0, 5);
}

async function main() {
    console.log('🔍 Analyzing Lottie structure and complexity...');
    
    const files = await fs.promises.readdir(srcDir);
    const jsonFiles = files.filter(f => f.endsWith('.json') && !f.includes('Zone.Identifier'));
    
    const results = {
        timestamp: new Date().toISOString(),
        summary: {
            totalFiles: jsonFiles.length,
            complexityBreakdown: { HIGH: 0, MEDIUM: 0, LOW: 0 },
            totalLayers: 0,
            totalKeyframes: 0,
            totalVertices: 0,
            featuresFound: {
                mergePaths: 0,
                repeaters: 0,
                trimPaths: 0,
                gradients: 0,
                masks: 0
            }
        },
        files: []
    };

    for (const file of jsonFiles) {
        const filePath = path.join(srcDir, file);
        
        try {
            const content = await fs.promises.readFile(filePath, 'utf8');
            const lottieData = JSON.parse(content);
            
            const analysis = analyzeStructure(lottieData, file);
            results.files.push(analysis);
            
            // Update summary
            results.summary.complexityBreakdown[analysis.complexity.complexityScore]++;
            results.summary.totalLayers += analysis.layers.total;
            results.summary.totalKeyframes += analysis.keyframes.total;
            results.summary.totalVertices += analysis.complexity.totalVertices;
            
            // Update features found
            results.summary.featuresFound.mergePaths += analysis.shapes.mergePaths;
            results.summary.featuresFound.repeaters += analysis.shapes.repeaters;
            results.summary.featuresFound.trimPaths += analysis.shapes.trimPaths;
            results.summary.featuresFound.gradients += analysis.shapes.gradients;
            results.summary.featuresFound.masks += analysis.shapes.masks;
            
            console.log(`✓ ${file}: ${analysis.complexity.complexityScore} complexity (${analysis.layers.total} layers, ${analysis.keyframes.total} keyframes)`);
            
        } catch (error) {
            console.error(`❌ Error analyzing ${file}:`, error.message);
        }
    }

    // Sort by complexity score and file size
    results.files.sort((a, b) => {
        const scoreWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        return scoreWeight[b.complexity.complexityScore] - scoreWeight[a.complexity.complexityScore];
    });

    // Write JSON report
    await fs.promises.writeFile(
        path.join(reportsDir, 'structure.json'),
        JSON.stringify(results, null, 2)
    );

    // Generate markdown report
    const mdContent = generateMarkdownReport(results);
    await fs.promises.writeFile(
        path.join(reportsDir, 'structure.md'),
        mdContent
    );

    console.log('\\n🔍 Structure Analysis Complete!');
    console.log(`Complexity breakdown: ${results.summary.complexityBreakdown.HIGH} HIGH, ${results.summary.complexityBreakdown.MEDIUM} MEDIUM, ${results.summary.complexityBreakdown.LOW} LOW`);
    console.log(`Total layers: ${results.summary.totalLayers}, keyframes: ${results.summary.totalKeyframes}, vertices: ${results.summary.totalVertices}`);
}

function generateMarkdownReport(results) {
    const { files, summary } = results;
    
    let md = `# Lottie Structure & Complexity Analysis

Generated: ${new Date(results.timestamp).toLocaleString()}

## Summary

- **Total Files Analyzed**: ${summary.totalFiles}
- **Complexity Distribution**: ${summary.complexityBreakdown.HIGH} HIGH | ${summary.complexityBreakdown.MEDIUM} MEDIUM | ${summary.complexityBreakdown.LOW} LOW
- **Total Layers**: ${summary.totalLayers}
- **Total Keyframes**: ${summary.totalKeyframes} 
- **Total Path Vertices**: ${summary.totalVertices}

### Features Found Across All Files
- **Merge Paths**: ${summary.featuresFound.mergePaths} (⚠️ SVG renderer required)
- **Repeaters**: ${summary.featuresFound.repeaters} (⚠️ Performance impact)
- **Trim Paths**: ${summary.featuresFound.trimPaths}
- **Gradients**: ${summary.featuresFound.gradients}
- **Masks**: ${summary.featuresFound.masks}

## File Analysis (sorted by complexity)

| File | Complexity | Duration | Layers | Keyframes | Vertices | Key Issues |
|------|------------|----------|--------|-----------|----------|------------|
`;

    files.forEach(f => {
        const issues = f.complexity.scoreDetails.reasons.slice(0, 2).join(', ') || 'None';
        md += `| ${f.filename} | **${f.complexity.complexityScore}** | ${f.basic.duration.toFixed(1)}s | ${f.layers.total} | ${f.keyframes.total} | ${f.complexity.totalVertices} | ${issues} |\\n`;
    });

    md += `

## Detailed Analysis

`;

    files.forEach(f => {
        md += `### ${f.filename}
- **Complexity**: ${f.complexity.complexityScore} (Score: ${f.complexity.scoreDetails.score})
- **Basic Info**: ${f.basic.width}x${f.basic.height}px, ${f.basic.frameRate}fps, ${f.basic.duration.toFixed(1)}s
- **Layers**: ${f.layers.total} total (${f.layers.byType.shape} shape, ${f.layers.byType.precomp} precomp, ${f.layers.byType.image} image, ${f.layers.byType.text} text)
- **Keyframes**: ${f.keyframes.total} total, max ${f.keyframes.maxPerProperty} per property
- **Shape Features**: ${f.shapes.paths} paths, ${f.shapes.groups} groups, ${f.shapes.gradients} gradients, ${f.shapes.trimPaths} trim paths
- **Performance Flags**: ${f.shapes.mergePaths > 0 ? '⚠️ Merge Paths' : ''} ${f.shapes.repeaters > 0 ? '⚠️ Repeaters' : ''} ${f.complexity.totalVertices > 1000 ? '⚠️ High Vertices' : ''}

`;
        if (f.complexity.scoreDetails.reasons.length > 0) {
            md += `**Complexity Reasons**: ${f.complexity.scoreDetails.reasons.join(', ')}\\n\\n`;
        }
    });

    md += `## Renderer Recommendations

Based on structural analysis:

| File | Recommended Renderer | Reasoning |
|------|---------------------|-----------|
`;

    files.forEach(f => {
        let renderer = 'canvas';
        let reasoning = 'Good performance for shapes and paths';
        
        if (f.shapes.mergePaths > 0) {
            renderer = 'svg';
            reasoning = 'Merge paths require SVG renderer';
        } else if (f.shapes.masks > 2) {
            renderer = 'svg';
            reasoning = 'Better mask support';
        } else if (f.layers.byType.text > 0) {
            renderer = 'svg';
            reasoning = 'Better text rendering';
        } else if (f.complexity.totalVertices > 2000) {
            renderer = 'canvas';
            reasoning = 'Better performance with many vertices';
        }
        
        md += `| ${f.filename} | **${renderer}** | ${reasoning} |\\n`;
    });

    md += `

## Optimization Priorities

### High Priority (Immediate Impact)
`;
    const highComplexity = files.filter(f => f.complexity.complexityScore === 'HIGH');
    if (highComplexity.length > 0) {
        highComplexity.forEach(f => {
            md += `- **${f.filename}**: ${f.complexity.scoreDetails.reasons.join(', ')}\\n`;
        });
    } else {
        md += '- No high-complexity files found\\n';
    }

    md += `
### Medium Priority 
`;
    const medComplexity = files.filter(f => f.complexity.complexityScore === 'MEDIUM');
    medComplexity.slice(0, 3).forEach(f => {
        md += `- **${f.filename}**: ${f.complexity.scoreDetails.reasons.join(', ')}\\n`;
    });

    md += `
### Quick Wins (All Files)
- Reduce frame rate from ${Math.max(...files.map(f => f.basic.frameRate))}fps to 24-30fps where acceptable
- Round numeric precision to 3 decimals
- Remove unused names and metadata
- Deduplicate identical keyframes

---
*Generated by analyze-structure.mjs*
`;

    return md;
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { analyzeStructure, main };