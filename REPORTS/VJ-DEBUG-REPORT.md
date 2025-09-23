# 3886 Website — VJ System Debugging & Optimization Report

Owner: ZIKADA 3886 • Session start: 2025-09-19

This report is a living document tracking analysis, fixes, and performance metrics for the VJ control panel and the main animation page. It will be updated continuously as work progresses.

## Scope (from request)
1) Ensure the control-panel is properly connected and functional to the main animation display page
2) Implement AUTO mode for SCENE SELECT: randomly switch scenes; use TEMPO → Phase Duration as interval; highlight active scene
3) TRIGGER FX: make RIPPLE functional
4) ANIMATION SYSTEM: fix triggers so they are broadly functional
5) VISUAL EFFECTS & LAYERS: toggles should have visible effects on the animations page
6) Performance/Stability: optimize for ~60 FPS

## Environment
- Repo: 3886-website (Vite)
- OS: Windows (pwsh 7.5)
- Entry pages:
  - /index.html (main visuals)
  - /control-panel.html (control panel)
- Key libs: three, gsap, postprocessing, simplex-noise, animejs, lottie

## Initial Findings (analysis)

Transport & Integration
- BroadcastChannel channel "3886_vj_control" present both sides with localStorage fallback (good).
- Control panel connection UI not wired to actual DOM:
  - JS expects .connection-status; markup uses #connectionStatus with nested .status-text/.status-dot → status not updating.
- Performance mode button listeners target .perf-btn but markup uses .mode-btn → mode switches not sent.

Scenes / AUTO mode
- chaos-init.js auto phase runner uses random 30–60s duration; no linkage to Phase Duration slider.
- vj-receiver.js updatePhaseDuration only logs; doesn’t propagate to chaos-init (interval remains unchanged).
- Control panel does not highlight the active scene during automatic switching (no feedback path from main to panel per phase).

Trigger FX – RIPPLE
- vj-receiver implements triggerRipple and maps data-effect "shake" → ripple; should be visible but can be obscured by high z-index overlays (e.g., blackout). Needs alias support for "ripple" and z-index audit.

Animation System
- animation-manager.js triggers target selectors that are often missing on index.html (e.g., .text-26/.text-25, .matrix-rain). Need broader, real DOM selectors (e.g., .logo-text, .text-3886, h1/h2/h3, #data-streams-overlay) and sensible fallbacks.

Visual Effects & Layers
- Two implementations coexist (fx-controller and visual-effects-complete); overlay ids differ (e.g., #vignette-overlay vs #vignette-effect). Layer toggle map in vj-receiver uses selectors that don’t match created overlays → toggles appear to do nothing. Need unified selectors and tolerant toggling (operate on whichever exists).

Timing / Performance
- Speed slider sends percent (10–200) but vj-receiver sets gsap timeScale(value) directly (e.g., 120 ⇒ 120x speed!) → should be value/100.
- chaos-engine and chaos-init already include performance-oriented code. We can layer adaptive pixel ratio and particle gating based on FPS thresholds. Ensure monitors/intervals are idempotent and cleanup paths are robust.

## Planned Changes (high-level)
- Wire connection status UI to #connectionStatus/.status-text/.status-dot; keep backward compat for .connection-status.
- Bind performance modes to .mode-btn (low/auto/high) and send performance_mode messages.
- Implement deterministic AUTO cadence in chaos-init using phaseDurationMs set via vj-receiver.updatePhaseDuration(seconds→ms). Notify panel of each scene change to highlight active scene.
- Control panel highlights the active scene button during AUTO; manual scene click cancels AUTO.
- TRIGGER FX: support both "shake" and "ripple" aliases; ensure ripple appears above overlays but below blackout unless explicitly engaged.
- Animation triggers: broaden selectors and add fallbacks; warn when selector resolution yields zero elements.
- Unify layer toggles to support both overlay id conventions across fx-controller and visual-effects-complete.
- Map speed percent to timeScale = value/100; keep UI in percent.
- Add adaptive pixel ratio and particle gating tied to FPS; gate heavy DOM overlays under low FPS; ensure cleanup is idempotent.

## Work Plan (trackable milestones)
- M1: Transport verified, connection UI fixed, performance modes wired
- M2: AUTO mode driven by Phase Duration; main → panel scene_changed feedback; panel highlight
- M3: RIPPLE visible and robust
- M4: Animation triggers broad coverage with fallbacks
- M5: Visual Effects & Layers unified toggles
- M6: Performance pass (speed unit fix, adaptive DPR, particle gating)
- M7: QA passes and final report

## Test Strategy (summary)
- Two-tab test at same origin: main (index.html) + control panel (control-panel.html)
- QA passes:
  1) Connectivity and mode switches
  2) Scenes (manual + AUTO cadence vs slider)
  3) Trigger FX (incl. RIPPLE)
  4) Animation triggers coverage
  5) Effects & Layers toggles
  6) Performance snapshots before/after

## Running Changes Log
- [Pending] Initialize report and checklist; prepare branch; set up message-level debug logging.
- 2025-09-19: M1 kick-off and implementation
  - Control panel: mapped connection UI to new matrix header (#connectionStatus + #systemStatus)
  - BroadcastChannel: now treats pong/settings_sync as alive; added control_connect and initial ping
  - LocalStorage fallback: treats settings_sync like pong for connectivity
  - Performance modes: bound new .mode-btn buttons to send performance_mode and toggle UI
  - Next: verify in-browser with main page tab for ONLINE/ OFFLINE transitions and mode switching logs
- 2025-09-19: M2 in progress
  - Deterministic AUTO cadence in chaos-init using phaseDurationMs; added stop/start utilities
  - vj-receiver now applies Phase Duration (seconds→ms), restarts cadence
  - Main now sends scene_changed on each AUTO switch; panel highlights active scene via auto-active class
  - Panel highlight refined: removes stale 'active' on non-AUTO, keeps AUTO button active, applies auto-active to current scene
  - Fix: Implemented fxController.registerEffect to support anime-enhanced-effects plasma registration
- 2025-09-19: M3 complete
  - Ripple alias supported ("ripple" routes to triggerRipple)
  - Switched to SVG rings for anti-aliased ripple; added logo glow pulse
  - Ripple layered below blackout (full blackout preserved)
  - Click/touch ripple (pointer-centered) enabled; optional BPM ripple toggle in code (disabled by default)
- 2025-09-19: M4 started
  - Animation triggers broadened:
    - Matrix targets include #data-streams-overlay, .data-streams
    - Text targets include .text-3886 and .logo-text where applicable
  - Added BPM Ripple UI toggle (control panel TEMPO section)
    - Sends bpm_ripple_toggle to main page; also toggles locally if same-tab
    - Uses SVG-based ripple, optional BPM beat timer

## Checklist (will be updated)
- [ ] M1: Connection UI fixed; perf modes wired; transport logs OK
- [ ] M2: AUTO uses Phase Duration; scene_changed feedback; panel highlights
- [ ] M3: RIPPLE alias + z-order verified
- [ ] M4: Animation triggers coverage improved
- [ ] M5: Effects/Layers unified toggles
- [ ] M6: Speed timeScale fix; adaptive DPR; particle gating
- [ ] M7: QA 1–6 completed; ~60 FPS target validated

## Status Update — 2025-09-23 18:44 UTC

### Current Status
- M1 Transport/Control Panel wiring: Completed.
  - Connection UI mapped to `#connectionStatus`/`#systemStatus`; BroadcastChannel + localStorage fallback verified in code.
  - Performance modes bound to `.mode-btn` and messages are sent appropriately.
- M2 AUTO Mode: In progress.
  - Phase Duration now drives cadence via `vj-receiver` → `chaos-init` (seconds→ms). AUTO sends `scene_changed` back to panel.
  - Panel highlight behavior implemented (AUTO button + active scene). Needs in-browser verification for highlight + manual-cancel behavior.
- M3 Ripple FX: Completed.
  - Alias "ripple" supported; SVG ring implementation with anti-aliasing, pointer-centered ripple, optional BPM pulses.
  - Layered beneath blackout overlay; synchronized logo glow pulse implemented.
- M4 Animation Triggers: Partially completed.
  - Broadened selectors (text/logo/data streams, etc.).
  - Added Diagnostics Runner in main + diagnostics UI in control panel. Pending: run and capture report in this doc.
- M5 Visual Effects & Layers: Preparation done.
  - Unified/tolerant layer map drafted in `vj-receiver` for overlay ID differences (e.g., `#vignette-overlay` vs `#vignette-effect`). Implementation/QA next.
- M6 Performance/Stability: Pending.
  - timeScale percent mapping fix and adaptive DPR/particle gating still to implement.
- M7 QA/Validation: Not started.

### Tasks Left (Actionable)
- [ ] Run Animation Trigger Diagnostics and paste summary results (success/fail per trigger) into this report.
- [ ] M5: Implement unified/tolerant layer toggles. Verify visibility for: background, matrix rain, logo layer, text elements, overlays (vignette, film grain, scanlines), particles, debug HUD.
- [ ] Fix Time Scale mapping: set GSAP global `timeScale = percent/100` with clamping (e.g., 0.25–2.0). Audit any per-timeline overrides.
- [ ] Adaptive DPR: monitor FPS and reduce device pixel ratio or effect resolution when FPS < threshold; restore when FPS recovers.
- [ ] Particle/Heavy FX gating: gracefully disable expensive effects (particles, complex post FX) at low FPS; re-enable when stable.
- [ ] Confirm AUTO scene UI behavior: ensure AUTO stays active while cycling; manual scene select cancels AUTO and clears highlight state.
- [ ] Verify RIPPLE z-index across all overlays; ensure visibility beneath blackout; no pointer-event interference.
- [ ] Persist BPM ripple toggle (settings_sync). Ensure idempotent setup/teardown for timers and DOM containers.
- [ ] Add non-blocking warnings when selectors resolve 0 targets; ensure fallbacks (e.g., body-level effects) where sensible.
- [ ] Update README/docs: BPM ripple usage, Diagnostics Runner workflow, and expanded animation trigger coverage.
- [ ] Final QA pass: capture FPS/memory snapshots before/after; record short demo video for regression archive.

### Notes & Useful Insights
- Transport: `BroadcastChannel('3886_vj_control')` with localStorage fallback is solid. Treating `settings_sync` as an alive signal improves reliability.
- Ripple Strategy: SVG circles with animated stroke provide crisp rings versus DIV borders; minimal perf impact. Keep container fixed and non-clipping; check HDPI scaling.
- Layering: Keep ripple below blackout for intentional full blackouts; audit `z-index` stacks and ensure no `overflow: hidden` clipping in ancestors.
- Selector Coverage: Expanded to `.logo-text`, `.text-3886`, `#data-streams-overlay`, plus generic headings where present. Log warnings for missing targets; fallback to page-level effects when appropriate.
- Effects/Layers Unification: Tolerant querying (try multiple IDs/selectors) prevents silent no-ops across differing overlay implementations.
- Performance: Fixing timeScale units is critical—percent values (e.g., 120) must map to 1.2, not 120x. Add clamps and reflect percent in UI.
- Diagnostics: The runner provides quick coverage verification and a repeatable test harness. Consider console/table output in addition to UI summary.
- Stability: Ensure cleanup paths are idempotent (ripple containers, timers, observers) to avoid leaks on repeated toggles.

### Next Actions (Short)
1) Execute Diagnostics Runner and add the results here.
2) Implement M5 unified layer toggles and test visually.
3) Apply timeScale mapping fix and add adaptive performance gates.
4) Quick QA round (2 tabs, same origin) to validate AUTO highlight + ripple visibility.
