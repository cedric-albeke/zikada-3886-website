# ZIKADA 3886 Stable Release v1.1

**Date**: 2026-01-10
**Branch**: `main` (force-updated from `revert/stable-with-fixes`)

---

## Summary

This release replaces the bloated main branch with a clean, stable codebase. The previous main had accumulated ~100+ JS modules including PWA features, predictive alerting, performance ladders, and test infrastructure that added complexity without proportional benefit.

This stable release focuses on **core VJ functionality** with targeted stability fixes.

---

## What Changed

### Stability Fixes Applied

| Fix | File(s) | Description |
|-----|---------|-------------|
| **Scene Switch Flash Fix** | `js/chaos-init.js`, `js/filter-manager.js` | Filters now apply instantly via `style.filter` instead of GSAP animation, eliminating bright flashes during transitions |
| **Brightness Caps** | `js/subtle-effects.js` | Reduced from 130%/150% to 103%/105% |
| **Brightness Caps** | `js/random-animations.js` | Reduced from 1.3/1.5 to 1.03/1.05 |
| **GSAP Stream Category** | `js/gsap-animation-registry.js` | Added `stream` category (max 5, priority 6) for data stream animations |
| **Text Effects Export** | `js/text-effects.js` | Fixed to export instance instead of class |

### Control Panel Cleanup

Removed imports for non-existent modules:
- `performance-bus.js`
- `performance-stats-controller.js`
- `performance-dashboard-v2.js`
- `preview-client.js`
- `trigger-effects-diagnostic.js`
- `trigger-effect-orchestrator.js`
- `midi-controller.js`, `midi-action-catalog.js`, `midi-feedback.js`
- `lottie-ui.js`
- CSS: `trigger-effects.css`

### Modules Removed (from previous main)

The following bloated modules were removed by reverting to stable base:

**PWA & Performance Monitoring (~20 files)**
- `smart-preloader.js`, `smart-preloader-test.js`
- `performance-degradation-ladder.js`, `performance-ladder-test.js`
- `predictive-performance-alerting.js`, `predictive-trend-analysis.js`
- `predictive-ladder-integration.js`, `predictive-alerting-tests.js`
- `enhanced-watchdog.js`, `memory-leak-guardian.js`
- `performance-optimizer.js`, `performance-optimizer-v2.js`
- `performance-dashboard-v2.js`, `performance-budgets*.js`
- `longevity-monitor.js`, `stability-manager.js`

**Test Infrastructure (~15 files)**
- `tests/e2e/*.spec.ts`
- `playwright.config.ts`
- `scripts/analyze-baseline.js`, `scripts/check-budgets.js`

**Unused Features (~30 files)**
- `trigger-effect-orchestrator.js`, `trigger-effects-diagnostic.js`
- `visual-effects-complete.js`
- `webgl-resource-manager.js`, `threejs-particle-optimizer.js`
- `anime-enhanced-effects.js`, `control-panel-enhanced.js`
- MIDI support files
- Monitor dashboard files
- Runtime phase/effect modules

**Documentation Bloat (~50 files)**
- Various `*-SUMMARY.md`, `*-REPORT.md`, `*-HANDOFF.md` files
- Session logs, fix summaries, investigation reports

---

## Architecture (Simplified)

```
js/
├── chaos-init.js          # Main orchestrator
├── chaos-engine.js         # 3D particle system
├── filter-manager.js       # Safe filter transitions
├── gsap-animation-registry.js  # Animation lifecycle
├── interval-manager.js     # Timer management
├── performance-element-manager.js  # DOM budget
├── performance-monitor.js  # Basic FPS/memory
├── vj-receiver.js          # Cross-tab communication
├── vj-messaging.js         # Message protocol
├── control-panel-v3.js     # Control panel UI
├── control-panel-professional.js  # VJ controls
├── text-effects.js         # Terminal text
├── matrix-messages.js      # Matrix rain messages
├── subtle-effects.js       # Ambient effects
├── random-animations.js    # Random FX
├── extended-animations.js  # Extended FX
├── lottie-animations.js    # Lottie integration
├── beehive-*.js            # Beehive effect
├── logo-animator.js        # Logo effects
└── ... (~54 total files)
```

---

## Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| JS Modules | ~54 | Down from ~100+ |
| Bundle Size | ~383 KB | Main chunk |
| GSAP Animation Limit | 150 | With category caps |
| Build Time | ~2s | Vite production |

---

## Breaking Changes

1. **MIDI Support Removed** - No longer available in control panel
2. **Performance Dashboard Removed** - No overlay metrics
3. **PWA Features Removed** - No service worker, offline support
4. **Predictive Alerting Removed** - No automatic quality scaling

---

## How to Verify Stability

```bash
# Start dev server
npm run dev

# Open main page
http://localhost:3886/

# Open control panel in another tab
http://localhost:3886/control-panel-v3.html

# Check console for:
# - No "init is not a function" errors
# - No missing module errors
# - GSAP animation count stays reasonable
# - No bright flashes during scene transitions
```

---

## Previous Main (Archived)

The previous main branch content is preserved in:
- Commit: `cc385f7` (can be accessed via `git show cc385f7`)
- Remote tracking branches may still reference old commits

To restore old main if needed:
```bash
git checkout -b restore-old-main cc385f7
```

---

## Contributors

- Cedri (original development)
- Claude Opus 4.5 (stability analysis and fixes)
