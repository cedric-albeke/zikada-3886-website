# Lottie Structure & Complexity Analysis

Generated: 10/8/2025, 12:46:14 AM

## Summary

- **Total Files Analyzed**: 10
- **Complexity Distribution**: 0 HIGH | 0 MEDIUM | 10 LOW
- **Total Layers**: 107
- **Total Keyframes**: 4352 
- **Total Path Vertices**: 1264

### Features Found Across All Files
- **Merge Paths**: 0 (⚠️ SVG renderer required)
- **Repeaters**: 0 (⚠️ Performance impact)
- **Trim Paths**: 7
- **Gradients**: 1
- **Masks**: 3

## File Analysis (sorted by complexity)

| File | Complexity | Duration | Layers | Keyframes | Vertices | Key Issues |
|------|------------|----------|--------|-----------|----------|------------|
| Abstraction.json | **LOW** | 9.6s | 37 | 1259 | 0 | None |\n| Impossible-Hexagon-black.json | **LOW** | 3.0s | 18 | 195 | 0 | None |\n| Morphing-Particle-Loader.json | **LOW** | 3.0s | 4 | 55 | 3 | 60 fps |\n| Planet-Logo.json | **LOW** | 2.5s | 1 | 211 | 51 | 3 masks |\n| Sacred-Geometry.json | **LOW** | 4.0s | 3 | 30 | 78 | None |\n| circuit-round-ani.json | **LOW** | 2.0s | 6 | 66 | 356 | None |\n| circular-dots.json | **LOW** | 2.5s | 6 | 2064 | 760 | None |\n| geometrical-lines.json | **LOW** | 75.0s | 21 | 350 | 0 | None |\n| planet-ring.json | **LOW** | 5.0s | 9 | 102 | 16 | None |\n| transparent-diamond-dark.json | **LOW** | 1.0s | 2 | 20 | 0 | None |\n

## Detailed Analysis

### Abstraction.json
- **Complexity**: LOW (Score: 0)
- **Basic Info**: 500x500px, 24fps, 9.6s
- **Layers**: 37 total (42 shape, 1 precomp, 0 image, 0 text)
- **Keyframes**: 1259 total, max 27 per property
- **Shape Features**: 0 paths, 66 groups, 0 gradients, 0 trim paths
- **Performance Flags**:   

### Impossible-Hexagon-black.json
- **Complexity**: LOW (Score: 0)
- **Basic Info**: 512x512px, 30fps, 3.0s
- **Layers**: 18 total (18 shape, 0 precomp, 0 image, 0 text)
- **Keyframes**: 195 total, max 3 per property
- **Shape Features**: 18 paths, 18 groups, 0 gradients, 0 trim paths
- **Performance Flags**:   

### Morphing-Particle-Loader.json
- **Complexity**: LOW (Score: 1)
- **Basic Info**: 300x300px, 60fps, 3.0s
- **Layers**: 4 total (4 shape, 0 precomp, 0 image, 0 text)
- **Keyframes**: 55 total, max 5 per property
- **Shape Features**: 1 paths, 4 groups, 1 gradients, 0 trim paths
- **Performance Flags**:   

**Complexity Reasons**: 60 fps\n\n### Planet-Logo.json
- **Complexity**: LOW (Score: 1)
- **Basic Info**: 256x256px, 29.9700012207031fps, 2.5s
- **Layers**: 1 total (15 shape, 3 precomp, 0 image, 0 text)
- **Keyframes**: 211 total, max 4 per property
- **Shape Features**: 10 paths, 15 groups, 0 gradients, 0 trim paths
- **Performance Flags**:   

**Complexity Reasons**: 3 masks\n\n### Sacred-Geometry.json
- **Complexity**: LOW (Score: 0)
- **Basic Info**: 948x1117px, 20fps, 4.0s
- **Layers**: 3 total (3 shape, 0 precomp, 0 image, 0 text)
- **Keyframes**: 30 total, max 3 per property
- **Shape Features**: 23 paths, 23 groups, 0 gradients, 2 trim paths
- **Performance Flags**:   

### circuit-round-ani.json
- **Complexity**: LOW (Score: 0)
- **Basic Info**: 1080x1920px, 29.9700012207031fps, 2.0s
- **Layers**: 6 total (6 shape, 0 precomp, 0 image, 0 text)
- **Keyframes**: 66 total, max 3 per property
- **Shape Features**: 107 paths, 107 groups, 0 gradients, 5 trim paths
- **Performance Flags**:   

### circular-dots.json
- **Complexity**: LOW (Score: 0)
- **Basic Info**: 1080x1080px, 30fps, 2.5s
- **Layers**: 6 total (201 shape, 5 precomp, 0 image, 0 text)
- **Keyframes**: 2064 total, max 3 per property
- **Shape Features**: 190 paths, 201 groups, 0 gradients, 0 trim paths
- **Performance Flags**:   

### geometrical-lines.json
- **Complexity**: LOW (Score: 0)
- **Basic Info**: 1920x1920px, 25fps, 75.0s
- **Layers**: 21 total (20 shape, 0 precomp, 0 image, 0 text)
- **Keyframes**: 350 total, max 5 per property
- **Shape Features**: 20 paths, 20 groups, 0 gradients, 0 trim paths
- **Performance Flags**:   

### planet-ring.json
- **Complexity**: LOW (Score: 0)
- **Basic Info**: 800x800px, 30fps, 5.0s
- **Layers**: 9 total (9 shape, 0 precomp, 0 image, 0 text)
- **Keyframes**: 102 total, max 4 per property
- **Shape Features**: 4 paths, 13 groups, 0 gradients, 0 trim paths
- **Performance Flags**:   

### transparent-diamond-dark.json
- **Complexity**: LOW (Score: 0)
- **Basic Info**: 256x256px, 30fps, 1.0s
- **Layers**: 2 total (2 shape, 0 precomp, 0 image, 0 text)
- **Keyframes**: 20 total, max 3 per property
- **Shape Features**: 10 paths, 10 groups, 0 gradients, 0 trim paths
- **Performance Flags**:   

## Renderer Recommendations

Based on structural analysis:

| File | Recommended Renderer | Reasoning |
|------|---------------------|-----------|
| Abstraction.json | **canvas** | Good performance for shapes and paths |\n| Impossible-Hexagon-black.json | **canvas** | Good performance for shapes and paths |\n| Morphing-Particle-Loader.json | **canvas** | Good performance for shapes and paths |\n| Planet-Logo.json | **svg** | Better mask support |\n| Sacred-Geometry.json | **canvas** | Good performance for shapes and paths |\n| circuit-round-ani.json | **canvas** | Good performance for shapes and paths |\n| circular-dots.json | **canvas** | Good performance for shapes and paths |\n| geometrical-lines.json | **canvas** | Good performance for shapes and paths |\n| planet-ring.json | **canvas** | Good performance for shapes and paths |\n| transparent-diamond-dark.json | **canvas** | Good performance for shapes and paths |\n

## Optimization Priorities

### High Priority (Immediate Impact)
- No high-complexity files found\n
### Medium Priority 

### Quick Wins (All Files)
- Reduce frame rate from 60fps to 24-30fps where acceptable
- Round numeric precision to 3 decimals
- Remove unused names and metadata
- Deduplicate identical keyframes

---
*Generated by analyze-structure.mjs*
