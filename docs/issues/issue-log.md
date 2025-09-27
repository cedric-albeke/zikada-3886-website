# Issue Log

This log tracks defects and their status, root causes, fixes, and verification.

## ZK-001 Duplicate effects overlays
- Status: Resolved (Verified by E2E and soak)
- Env: Dev, Chromium
- Repro: Toggle effects from control panel; overlays duplicated
- Root cause: VisualEffectsController and vj-receiver/fx-controller both applying effects
- Fix: Single FX orchestrator decision; fx-controller as runtime authority; overlays appended to #fx-root
- Files: js/visual-effects-complete.js (defer toggles), js/fx-controller.js (append to #fx-root), js/chaos-init.js (#fx-root creation)
- Tests: E2E (runbook-duplicates), soak; DOM/overlay counts stable

## ZK-002 Animation status desync
- Status: Mitigated (Pending confirmation)
- Repro: Anime status LED didn’t reflect engine state; stale on refresh
- Root cause: Panel UI bound to button clicks rather than engine acks
- Fix: vj-receiver emits anime_status; panel binds to received status; enable triggers logo animation directly
- Files: js/control-panel-professional.js (updateAnimeSystemStatus via status), js/vj-receiver.js (sendAnimeStatus + logo start)
- Tests: E2E anime-system.spec (Enable/Disable/Emergency)

## ZK-003 Noise generator CPU burn
- Status: Resolved
- Repro: Static noise redraw loop runs even when invisible/disabled
- Root cause: setInterval loop without visibility gating
- Fix: rAF-based loop; start/stop on visibility/effect toggle; throttled
- Files: js/chaos-init.js, js/fx-controller.js
- Tests: Soak shows stable CPU; manual verification

## ZK-004 First-load z-index/flicker
- Status: Mitigated (Monitoring enabled)
- Repro: Flicker/popping overlays on first load
- Root cause: Uncoordinated overlay insertion with conflicting z-index
- Fix: #fx-root container; normalized z-index; deferred insertion; observer added
- Files: js/chaos-init.js (#fx-root), js/fx-controller.js; scripts/debug/overlay-observer.js
- Tests: first-load-flicker produces overlay-*.jsonl for analysis

## ZK-005 Over-aggressive localStorage polling
- Status: Resolved
- Repro: 100ms polling even when BroadcastChannel available
- Root cause: Always-on polling path
- Fix: Prefer BroadcastChannel; reduce LS polling (1.5–10s) only when BC unavailable
- Files: js/vj-receiver.js, js/control-panel-professional.js
- Tests: Soak and E2E stable; reduced CPU wakeups
