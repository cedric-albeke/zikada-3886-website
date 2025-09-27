# Code Map: ZIKADA 3886 Website

This document summarizes the major subsystems, their responsibilities, and key integration points.

## Visual effects orchestration
- js/visual-effects-complete.js
  - Legacy/local effects toggling. Now defers to vj-receiver when present to avoid duplication.
- js/vj-receiver.js
  - Primary cross-tab receiver of control messages. Applies effects, scenes, tempos, and triggers. Sends performance updates.
- js/fx-controller.js
  - Centralizes effect intensity and enable/disable state. Appends overlays to #fx-root. Provides setEffectEnabled, setIntensity, etc.
- Overlay root
  - Introduced in chaos-init.js (ensure #fx-root exists); all FX overlays appended here to centralize z-indexing.

## Animation engine & triggers
- js/animation-manager.js
  - Professional animation manager abstraction. Provides trigger(id), pauseAll, resumeAll, killAll.
- js/anime-*.js modules
  - Concrete anime.js-based animation effects (logo, text, background).
- vj-receiver.js emits/consumes
  - anime_enable/disable/emergency_stop, anime_trigger(id), and anime_status acks.

## Color matrix and filters
- js/filter-manager.js
  - Debounced, clamped, GSAP-powered filter application with guardrails to avoid flashes.
- Controlled by control-panel-professional.js via color_change events.

## Noise generator and canvas loops
- js/chaos-init.js and js/fx-controller.js
  - Static noise loop reworked to requestAnimationFrame with start/stop. Visibility-aware.

## Cross-tab communication
- BroadcastChannel("3886_vj_control") preferred.
- Fallback to localStorage-based bridge with reduced polling (1.5–10s), guarded to prevent loops.

## Performance modules
- js/performance-bus.js
  - Shared bus for consistent FPS metrics across tabs. Exposes window.performanceBus.
- js/performance-stats-controller.js
  - UI/overlay/sampler using the bus, sends summarized stats.
- js/safe-performance-monitor.js
  - Lightweight sampler with safe cleanup functions (emergency brake/cleanup APIs used by vj-receiver).

## Control panel
- control-panel.html
  - Matrix-styled UI, sections for scenes, color, tempo, FX, triggers, anime system, and performance.
- js/control-panel-professional.js
  - Event wiring for UI, state representation, message sending, UI status updates from engine acks.

## Message names and flows (selected)
- Scene: scene_change → vj-receiver changeScene → settings_sync/scene_changed
- Color: color_change(property,value) → filter-manager.setPartial
- Speed/Phase: speed_change, phase_duration_change → apply to GSAP timeline and chaosInit
- BPM: bpm_change → vj-receiver.updateBPM → optional BPM ripple
- FX: effect_toggle(effect,enabled), fx_intensity(effect,intensity) → fx-controller
- Triggers: trigger_effect(effect) → transient overlays and GSAP anims
- Anime: anime_enable/disable/emergency_stop, anime_trigger(id) → ack via anime_status
- Performance: performance_update and detailed_performance_update → performance bus ingestion

## Matrix Dice System
- Source of truth: control panel (`js/control-panel-professional.js`). Countdown 15s → roll 1–100; if ≥90, select message and send `matrix_message`.
- Display path: `js/vj-receiver.js` receives `matrix_message` → calls `window.matrixMessages.showMessage(message)`.
- ACK: vj-receiver immediately emits `matrix_message_displayed` so the control panel updates LAST MSG based on display, not roll time.
- Standalone fallback: if no control panel connects within ~25s, `js/vj-receiver.js` enables `window.matrixMessages.enableAutonomousDiceMode()` (15s, 1–100, ≥90). When a control panel appears, it disables fallback via `disableAutonomousDiceMode()`.
- Removed duplication: the animation page no longer auto-starts its own dice cycle at init; it only displays messages sent by the control panel (or the explicit fallback mode).

## Z-index and layering
- #fx-root children: consolidated overlays; normalized ranges (typical target 400–599); UI overlays 1000+; debug overlays 2000+.
- Audit recommended: prefer class-based z-index via CSS and avoid inline zIndex where possible.
