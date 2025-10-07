# Changelog

## [2025-10-07] - Control Panel scene auto-scroll + DOM growth headroom

### Changed
- Control Panel: auto-scroll Scene section to center the active/selected scene on load and after selection; also centers on `scene_changed` acknowledgment from the main page for consistency.
- Performance flags: raised `MAX_DOM_NODES_GROWTH` default to 300 (from 200) in `js/feature-flags-safe.js`.

### Files Modified
- `js/control-panel-professional.js`
- `js/feature-flags-safe.js`

## [2025-10-07] - Particle optimizer init order + text effects default

### Changed
- Initialize Three.js Particle Optimizer immediately after renderer creation in `js/chaos-engine.js` so the instancing path (on capable hardware) is selected before any particle systems are created.
- Guard optimizer initialization in `js/chaos-init.js` to avoid double-init and safely re-optimize an existing particle system only when present.

### Enabled
- Text scramble effect is now enabled by default via `js/feature-flags-safe.js` (`TEXT_SCRAMBLE_ENABLED = true`).

### Files Modified
- `js/chaos-engine.js`
- `js/chaos-init.js`
- `js/feature-flags-safe.js`
## [2025-01-16] - Animation Fixes and Performance Improvements

### Fixed
- **c01n.svg Scale Animations**:
  - Removed inline `scale: none` style that was blocking GSAP animations
  - Added MutationObserver to prevent scale blocking from being reapplied
  - Increased breathing scale range to 0.8-1.3 for more visible effects
  - Added `.image-2` class to CSS protection rules

- **Performance Manager Error**:
  - Fixed `setupOptimizations is not a function` error by commenting out the non-existent function call

### Changed
- **Beehive Logo Blend Effect**:
  - Made effect much snappier with 0.05s fade in and 0.1s fade out (previously 2s each)
  - Reduced duration to 3 seconds (previously 15 seconds)
  - Made more subtle with 99% logo opacity and 15% beehive opacity
  - Reduced video contrast to 1.1 and brightness to 0.9
  - Increased video playback speed to 2x

- **Text Animations**:
  - Reduced "3886" text vertical movement from -3px to -1px
  - Added reversed floating animation to "ZIKADA" text (y: 1px)
  - Both texts now float subtly in opposite directions

### Optimized
- **Console Logging**:
  - Removed excessive console.log statements across all animation files
  - Significantly reduced logging noise for better performance
  - Kept only essential error messages

### Files Modified
- `js/performance-manager.js` - Fixed initialization error
- `js/centerpiece-logo.js` - Fixed scale animations, added mutation observer
- `js/beehive-logo-blend.js` - Made effect snappier and more subtle
- `js/subtle-effects.js` - Adjusted text animations
- `js/logo-animator.js` - Reduced console logging
- `styles/logo-protection.css` - Added .image-2 class support