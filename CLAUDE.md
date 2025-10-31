# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ZIKADA 3886 Records is an autonomous animation display system for Psy & Techno events. Built on a Webflow export foundation, it features continuous 3D particle animations, dynamic logo effects, randomized animation phases with smooth transitions, and cyberpunk aesthetics designed to run endlessly without user interaction.

## Technology Stack

- **Build System**: Vite 5.4+ (port 3886, multi-page build with manual chunks)
- **Core Libraries**: Three.js (WebGL/particles), GSAP (animations), Lottie (UI animations), anime.js (optional)
- **Effects**: postprocessing (bloom, glitch, chromatic aberration), simplex-noise
- **Testing**: Playwright (E2E, performance baselines, soak tests)

## Development Commands

```bash
# Install dependencies
npm ci

# Development server (clears cache, kills port 3886, runs Vite with --force)
npm run dev

# Build production bundle (outputs to dist/ with three/gsap/effects chunks)
npm run build

# Preview production build on port 3886
npm run preview

# Static server (mimics CDN/cache behavior)
npm run serve

# E2E test suite
npm run test:e2e

# Performance baseline (2 min, logs to artifacts/baseline/)
npm run baseline

# 10-minute soak test for stability validation
npm run soak:10

# Analyze baseline results
npm run analyze:baseline

# Check styling guardrails (no hover translate, no direct filter writes)
npm run check:guardrails

# Budget validation (logs to artifacts/budgets/)
npm run check:budgets
```

## Architecture

### Entry Points & Multi-Page Setup

- **Main**: `index.html` - Primary animation display
- **Control Panels**: `control-panel.html`, `control-panel-v3.html` - Real-time control UIs
- **Build Config**: `vite.config.js` defines multi-page inputs and manual chunks for `three`, `gsap`, and `effects`

### Module Organization

Source modules in `js/` use namespace prefixes:

- **`chaos-*`**: 3D particle systems, WebGL resources, main orchestrator (`chaos-init.js` is primary entry)
- **`anime-*`**: anime.js integration modules (opt-in via `?anime=1` or `3886:enable-anime` event)
- **`performance-*`**: Performance monitoring, degradation ladders, budgets, element managers
- **`runtime/`**: Core infrastructure (phase/scene transitions, DOM pools, effect managers, teardown)
  - `phase/PhaseController.js` - FSM for scene transitions with AbortController-based cancellation
  - `effects/EffectManager.js` - Loop/timeout management with DOM budget enforcement
  - `dom/NodePool.js` - Reusable DOM nodes for repeating effects
  - `teardown.js` - Centralized cleanup for HMR safety
- **Other key modules**:
  - `filter-manager.js` - Sanitizes CSS filters to prevent white flashes during transitions
  - `fx-controller.js` + `vj-receiver.js` - Single FX orchestrator pattern (see Decision 0001)
  - `text-effects.js`, `matrix-messages.js` - Terminal/cyberpunk text animations
  - `logo-animator.js`, `enhanced-logo-animator.js` - Logo breathing/reactive animations with opacity protection
  - `webgl-resource-manager.js` - WebGL context/resource lifecycle
  - `feature-flags-safe.js` - Runtime flags for heavy effects gating

### Animation Phases

The system cycles through themed phases via `PhaseController`:

- **Intense**, **Calm**, **Glitch**, **Techno**, **Vaporwave**, **Cyberpunk**, **Neon**, **Aurora**
- Transitions use a shared `#viz-blackout` overlay (GSAP-driven fade to black, cleanup, fade in)
- Heavy effects (random/extended animations) are gated by feature flags and disabled by default (enable with `?extanim=1&randanim=1`)

### Effects Orchestration (Decision 0001)

- **Single FX Orchestrator**: `vj-receiver` + `fx-controller` manage all FX application
- `VisualEffectsController` acts as UI facade only, delegates to runtime orchestrator
- All overlays created via `fx-controller` and appended to `#fx-root` for centralized z-index management
- Control panel effect names map directly to `fx-controller` IDs (holographic, dataStreams, plasma, noise, etc.)

### Self-Healing & Stability

- **Watchdog Timer**: Monitors animation health every 10s
- **Logo Opacity Protection**: Never drops below 100%
- **Automatic Restart**: Each module can restart if stopped
- **HMR Safety**: `chaos-init.js` disposes Chaos Engine/WebGL resources on hot reload via `teardown.js`
- **InitGuard** (`runtime/init/InitGuard.js`): Provides `once/bindOnce/listen` helpers for idempotent setup

### Performance Management

- **Performance Element Manager** (`performance-element-manager.js`): Tracks DOM node budgets, purges on overflow
- **Interval Manager** (`interval-manager.js`): Centralized timer lifecycle
- **GSAP Animation Registry** (`gsap-animation-registry.js`): Global GSAP timeline tracking
- **Performance Ladder** (`performance-degradation-ladder.js`): Automatic quality degradation when perf drops
- **Extended Animations**: Single container (`.extended-effects-root`) with soft DOM budget (~800 nodes), reduced cadence (~8s spawn, 40% chance)

### Control Panel Integration

- Two tabs in same browser profile: main display (`http://localhost:3886/`) + control panel (`http://localhost:3886/control-panel.html`)
- Cross-tab communication via `vj-receiver`/`vj-messaging` for real-time effect control
- Dashboards under `js/performance-*` expose metrics when `?overlay=1` or `?cycle=1` query params used

## Critical Styling Guardrails

### NO HOVER MOVEMENT ANIMATIONS

**NEVER** use `translateY`, `translateX`, or any position-changing animations on hover states. This causes janky movement effects.

**Allowed hover effects**:
- Color/background changes
- Box shadow changes
- Border color changes
- Scale transformations (subtle, max 1.02)
- Opacity changes

**Forbidden**:
```css
/* NEVER DO THIS */
.button:hover {
    transform: translateY(-2px); /* FORBIDDEN */
}
```

**Correct**:
```css
.button:hover {
    background: rgba(0, 255, 133, 0.2);
    box-shadow: 0 0 15px rgba(0, 255, 133, 0.3);
    transform: scale(1.02); /* Optional subtle scale only */
}
```

### Filter Transitions

- Use `filter-manager.js` pattern to sanitize filters before transitions
- Maintain safe defaults to avoid white flashes
- Never write `document.body.style.filter` directly (checked by `npm run check:filters`)

### Webflow Legacy

- Preserve Webflow `data-*` attributes when editing existing markup
- `js/3886.js` contains legacy minified Webflow interactions (avoid editing directly)

## Testing & QA

### Manual Testing Only

- **No automated unit tests** - rely on E2E suite and manual QA via control panel
- Before PRs: run `npm run build`, check console warnings, log FPS/memory deltas when touching animation loops
- Enable anime.js: `?anime=1` or `window.dispatchEvent(new Event('3886:enable-anime'))`, then trigger Anime Tests panel

### E2E & Performance

- `npm run baseline` - 2-minute perf baseline log to `artifacts/baseline/`
- `npm run runbook:duplicates` - 60s duplicate overlays runbook
- `npm run soak:10` - 10-minute stability soak
- `npm run flicker` - First-load flicker capture (~10s overlay/z-index mutations)
- Results analyzed via `npm run analyze:baseline`

### Budget Validation

- `npm run check:budgets` - Validates DOM/timer/GSAP budgets, generates reports in `artifacts/budgets/`
- Extended animations have soft node budget (~800) with skip-on-limit logic

## Commit Conventions

- Follow Conventional Commits: `feat:`, `fix:`, `docs:`, `perf:`, `test:`
- Imperative subjects under ~72 characters
- PRs require: summary, linked issue, relevant visuals, manual verification notes
- Update companion docs when behavior/controls change:
  - `ANIMEJS-INTEGRATION-PLAN.md`
  - `PERFORMANCE-IMPROVEMENTS.md`
  - `DEV-BRANCH-SUMMARY.md`
  - `docs/architecture/`, `docs/decisions/`

## Key Documentation

- **`AGENTS.md`**: Repository conventions, manual QA expectations, doc sync requirements
- **`CODEX.md`**: Codex CLI agent checklist for scoped changes, verification, handoff notes
- **`README.md`**: Installation, bring-up, event usage overview
- **`docs/architecture/scene-orchestration.md`**: Phase transitions, blackout overlay, HMR safety
- **`docs/decisions/0001-single-fx-orchestrator.md`**: FX orchestration pattern and acceptance criteria

## Runtime Flags & Query Params

- `?anime=1` - Enable anime.js integration
- `?extanim=1` - Enable extended animations (heavy)
- `?randanim=1` - Enable random animations (heavy)
- `?overlay=1` - Show telemetry overlay
- `?cycle=1` - Load effects cycle harness
- `?debug=timers` or `?timers=1` - Enable timer instrumentation

## Browser Support & Performance

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (may require webkit prefixes)
- Mobile: Reduced particle count for performance
- Optimized for continuous runtime with automatic cleanup and memory-conscious effect cycling
