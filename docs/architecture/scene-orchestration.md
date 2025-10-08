# Scene Orchestration, Transitions, and Effects (ZIKADA 3886)

Date: 2025-10-07

This document describes the runtime structure that coordinates scene/phase transitions and visual effects,
with a focus on stability, HMR safety, and performance.

## Goals
- Smooth, cancelable transitions between phases (a.k.a. scenes)
- Single, consistent blackout overlay
- No duplicate initialization across HMR saves
- Effects bounded by DOM and timing budgets

## Key Components

### PhaseController (js/runtime/phase/PhaseController.js)
A minimal finite-state machine with:
- setPhase(next, { force? })
- Lifecycle hooks: before/after/willLeave/didLeave/willEnter/didEnter/error
- AbortController-backed cancellation to prevent overlapping transitions

### PhaseStage (js/runtime/phase/PhaseStage.js)
Dual-slot DOM stage that crossfades between slots using CSS transitions.
Currently included for forward compatibility; the app uses blackout crossfades for low-GPU cost.

### PhaseRegistry (js/runtime/phase/PhaseRegistry.js)
A tiny registry that can be used to register phases with mount/onReady callbacks and enforce a min-visible time.

### Blackout Overlay
- Shared overlay: #viz-blackout
- Created by chaos-init and reused by matrix-messages
- Always one element, faded by GSAP; never removed while app is alive

### EffectManager and NodePool
- EffectManager (js/runtime/effects/EffectManager.js) manages loops (every/loop/timeout) and enforces a DOM budget via MutationObserver.
- NodePool (js/runtime/dom/NodePool.js) provides reusable nodes for effects that repeat.
- Extended animations now run within a single container (.extended-effects-root) with a soft DOM budget and reduced cadence.

## How Transitions Work (Today)
1. chaos-init chooses a next phase periodically (default ~30s) and calls phaseController.setPhase(name).
2. The transition executor (installed by chaos-init):
   - Fades to black (showBlackout)
   - Cleans previous overlays (transitionOut)
   - Runs the new phase runner
   - Fades back in (hideBlackout)
3. If a new transition is requested mid-flight, the old one is canceled via AbortController.

## Heavy Effects Gating
- Flags added in feature-flags-safe:
  - EXTENDED_ANIMATIONS_ENABLED (default false)
  - RANDOM_ANIMATIONS_ENABLED (default false)
- Enable at runtime: `?extanim=1&randanim=1`
- Extended animations now:
  - Spawn at lower cadence (approx every 8s, 40% chance)
  - Clamp per-effect spawn counts
  - Write to a single container with a soft node budget (~800 nodes) and skip when near limit

## HMR Safety
- chaos-init disposes Chaos Engine and WebGL Resource Manager on hot reload and runs teardownAll().
- InitGuard (js/runtime/init/InitGuard.js) provides once/bindOnce/listen helpers for idempotent setup.

## Acceptance Criteria (for QA)
- Phase transitions fade to black and back in ≤ ~600ms total.
- Exactly one #viz-blackout element exists.
- No emergency stops during normal idle with default flags.
- With effects enabled, container DOM stays under the soft budget and does not continuously grow.

## Future Work
- Wire PhaseStage for DOM-based scene mount/unmount with crossfades if needed.
- Adopt NodePool for specific effects if we keep them enabled frequently.
