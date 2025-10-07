# Lottie Optimization Research Notes

Based on web research using Chrome MCP on official sources and documentation.

## Key Findings

### lottie-web (Airbnb) Core Library
**Source**: [GitHub - airbnb/lottie-web](https://github.com/airbnb/lottie-web)

#### Supported Renderers & Performance Trade-offs
- **SVG**: Better for masks, merge paths, complex effects; higher quality; supports all features
- **Canvas**: Better performance with many shapes/paths; limited feature support (no merge paths)
- **HTML**: Legacy, not recommended for production

#### Feature Support & Performance Impact:
- ✅ **Low Impact**: Basic shapes, transforms, opacity, position keyframes
- ⚠️ **Medium Impact**: Trim paths, gradients (< 8 stops), dash patterns, text
- 🚫 **High Impact/Unsupported**: 
  - Merge paths (SVG only, performance hit)
  - Repeaters (performance hit with many copies)
  - Masks (performance hit)
  - Image sequences, videos, audio (not supported)
  - Negative layer stretching (causes issues)

### @lottiefiles/lottie-player v2.0.12
**Source**: [npm - @lottiefiles/lottie-player](https://www.npmjs.com/package/@lottiefiles/lottie-player)

#### Supported Attributes (Verified)
```html
<lottie-player 
  autoplay          // Boolean: starts playing when loaded
  controls          // Boolean: shows play/pause controls
  loop              // Boolean: loops animation
  mode="normal"     // String: "normal" | "bounce"
  src="file.json"   // String: path to animation
  speed="1"         // Number: playback speed (1 = normal)
  style="width:320px" // CSS styling
  renderer="svg"    // String: "svg" | "canvas" 
  background="transparent" // String: background color
  direction="1"     // Number: 1 = forward, -1 = reverse
></lottie-player>
```

#### Advanced Configuration (Research needed on rendererSettings)
- `progressiveLoad`: Load DOM elements when needed (SVG only) - unconfirmed support
- `clearCanvas`: Handle canvas clearing - unconfirmed support
- `hideOnTransparent`: Hide elements at opacity 0 - unconfirmed support

### dotLottie Format
**Source**: [dotLottie.io](https://dotlottie.io/)

#### Benefits
- ZIP-compressed archives with .lottie extension
- Can bundle multiple animations + shared assets
- Deflate compression (typically 20-40% smaller than JSON)
- Supports theming and interactivity capabilities
- Single file distribution

#### Tooling
- `dotlottie-js`: JavaScript library for handling .lottie files
- `@dotlottie/player-component`: Alternative player for .lottie files
- CLI tools available for pack/unpack operations

## Renderer Selection Decision Matrix

| Animation Features | Recommended Renderer | Reasoning |
|-------------------|---------------------|-----------|
| Many simple shapes, no merge paths | Canvas | Better performance, no feature limitations |
| Merge paths present | SVG | Canvas doesn't support merge paths |
| Complex masks/mattes | SVG | Better quality, full feature support |
| Many gradients (>8 stops) | SVG | Better gradient rendering |
| Trim paths on many shapes | SVG | Better compatibility |
| High path vertex count (>2000) | Canvas | Better performance with many paths |
| Text elements | SVG | Better text rendering |

## Optimization Quick Wins (Safe Automation)

### Non-Destructive Transforms
1. **Numeric Precision**: Round to 3 decimals globally, 2 for transforms/opacity
2. **Metadata Pruning**: Remove `nm` (names), `meta`, markers, unused assets
3. **Hidden Layer Removal**: Remove layers with `hd: true`
4. **Keyframe Deduplication**: Remove identical consecutive keyframes
5. **Frame Rate Clamping**: Reduce `fr` from >30 to 24-30 FPS where acceptable

### Size Impact Estimates
- Precision rounding: 15-25% reduction
- Metadata pruning: 5-15% reduction
- Keyframe dedup: 5-20% reduction
- Frame rate optimization: 10-30% reduction (if applicable)

## After Effects Export Best Practices

### Bodymovin Plugin Settings
- Enable "Guided" decimal precision
- Export at 24-30 FPS unless higher needed
- Convert vector layers to shapes ("Create shapes from Vector Layers")
- Avoid image sequences, use shape layers instead

### Animation Complexity Guidelines
- **Repeaters**: Limit copies, consider precomp alternatives
- **Gradients**: Keep stops ≤ 8, avoid highlight properties
- **Paths**: Use Simplify Path effect to reduce vertices
- **Effects**: Avoid Gaussian blur, drop shadows - use shape emulation
- **Text**: Prefer font-based over glyphs when possible

## Performance Patterns

### Visibility Optimization
```javascript
// Pause when offscreen
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const player = entry.target;
    if (entry.isIntersecting) {
      player.play();
    } else {
      player.pause();
    }
  });
});

// Respect user preferences
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  player.stop();
}
```

### Memory Management
```javascript
// Proper cleanup
player.destroy();
// Remove from DOM to prevent memory leaks
```

## Compression Benchmarks (Expected)
- Raw JSON: baseline
- Gzip: ~70-80% reduction
- Brotli: ~75-85% reduction  
- .lottie format: ~20-40% additional reduction over JSON

## Tools Evaluation Priority

### Immediate Use
1. **Built-in optimization script** (custom implementation)
2. **dotLottie CLI** for format conversion testing
3. **@lottiefiles/lottie-player** for current implementation

### Future Consideration
1. **LottieFiles Optimizer** (if API access available)
2. **@dotlottie/player-component** for .lottie files
3. **Custom After Effects templates** for design team

---

*Research completed: $(date +'%Y-%m-%d %H:%M:%S')*
*Sources: Official documentation, GitHub repositories, NPM packages*