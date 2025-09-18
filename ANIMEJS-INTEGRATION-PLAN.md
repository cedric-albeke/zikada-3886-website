# Anime.js Integration Plan for 3886-website

Status: In Progress
Owner: Agent Mode
Created: 2025-09-18

## Objective
Introduce anime.js as a complementary DOM/SVG microinteraction engine (e.g., SVG stroke/path effects), while keeping GSAP and Three.js as the orchestrators for complex timelines and 3D. Integration will be feature-flagged and performance-aware, with zero-regression by default.

## Scope and Guardrails
- Use anime.js for:
  - SVG stroke/path “draw” effects (strokeDashoffset), stroke/fill opacity/color.
  - Lightweight DOM/SVG microinteractions (staggered attributes, subtle pulses).
- Do NOT use anime.js for:
  - Transforms (translate/rotate/scale) on elements already animated by GSAP.
  - Three.js/WebGL objects or scene/camera control.
  - Long-running master timelines coordinated with engine clocks.
- Property separation:
  - anime.js: strokeDashoffset, strokeOpacity, fillOpacity, color, CSS variables, filters.
  - GSAP: transforms and master timelines.
- Feature-flagged rollout: disabled by default; enable via `?anime=1` or `window.__ANIME_POC_ENABLED = true`.

## Architecture Additions
- js/anime-init.js: Manager that imports anime.js, tracks instances, pause/play/kill, global speed.
- js/anime-performance-adapter.js: Maps existing performance modes (normal/reduced/emergency) to anime.js behavior via a `performanceMode` custom event.
- js/anime-svg-logo.js: PoC module – inline SVG for `images/c01n.svg` (next to `.image-2`) and apply a stroke-draw/idle loop (no GSAP conflicts). Reacts to `animationPhase` and `matrixMessage`.
- js/chaos-init-optimized.js: Minimal changes
  - Emit `performanceMode` events when mode changes (normal/reduced/emergency).
  - Dynamically import anime stack only when feature flag is enabled.

## Rollout Strategy
1) Ship with feature disabled (default path untouched).
2) Validate on dev via `?anime=1` or `window.__ANIME_POC_ENABLED = true`.
3) Observe FPS/CPU with your Performance Panel; ensure no regression.
4) Optionally enable for staging via a config toggle; monitor metrics.
5) Rollback: simply disable the flag (no template changes required).

## Tasks & Progress

Fixes applied before proceeding (blocking issues discovered from logs):
- Resolved a ReferenceError: introAnimations is not defined in chaos-init-optimized.js by guarding optional heavy modules (introAnimations, beehiveBackground, etc.).
- Removed duplicate method blocks and invalid braces introduced in earlier edits.
- Added performanceMode event dispatch without duplicating bodies of methods.
- Exposed a stable global API: window.chaosInit (instance reference) and window.chaosApi (thin wrapper for VJ Receiver) so scene switching can work even if specific methods are optional.
- [x] Create plan document and checklist
- [x] Add anime.js dependency to package.json and install
- [x] Add js/anime-init.js (manager)
- [x] Add js/anime-performance-adapter.js (performance mapping)
- [x] Add js/anime-svg-logo.js (feature-flagged PoC)
- [x] Wire dynamic import + flag in js/chaos-init-optimized.js
- [x] Emit performanceMode events from applyEmergency/Reduced/Normal
- [x] Lazy-load anime.js stack from chaos-init when the feature flag is active
- [x] Route performance mode + speed signals from VJ Receiver/control panel into animeManager
- [ ] Local test: `npm run dev`, baseline (no flag) => no changes
- [ ] Local test: `?anime=1`, logo stroke draw + idle loop works
- [ ] Performance test: switch modes via control panel, anime follows
- [ ] Document developer notes in README (optional)

## Testing Plan
- Baseline: run without flag; verify no console errors, no visual changes.
- Flagged: run with `?anime=1`; verify stroke-draw then idle opacity loop.
- Events: trigger `animationPhase` and `matrixMessage`; anime reacts without interfering with GSAP.
- Performance: switch modes; anime pauses/speeds per mode; observe FPS.
- Control panel should update its performance mode display after acknowledgements from VJ Receiver.
- HMR: editing anime files should dispose/re-init cleanly.
- Cross-browser: Chromium + Firefox; Safari optional.

## Risks & Mitigations
- Transform conflicts with GSAP → operate only on stroke/opacity/CSS vars for PoC.
- Performance spikes → registry-based pause/play and mode mapping; feature-gated.
- Visual mismatch → use currentColor for strokes to inherit theme.

## Notes
- No index.html edits are required.
- All additions are modular and opt-in.

---
