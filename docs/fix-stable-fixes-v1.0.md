# fix/stable-fixes-v1.0 – Worklog and Rationale

Branch: fix/stable-fixes-v1.0
Date: 2025-09-18

Goal
- Preserve the stable build behavior while addressing two acute issues:
  1) Occasional grey flashes on scene changes / color slider updates
  2) Excessive console log spam from performance modules and animation registry
- Do so minimally and non-invasively, without global GSAP overrides or new timers

Changes

1) vj-receiver.js
- Added missing convenience wrappers used by control panel:
  - updateColors(h, s, b, c): delegates to updateColor() and applies combined filter
  - setEffectIntensities(g, p, d, n): delegates to updateEffectIntensity()
- Added handler for request_performance_detailed → sendDetailedPerformanceData()
- Intent: Fix immediate runtime errors observed in logs without altering core logic

2) filter-manager.js
- In applyImmediate(): when transitioning from 'none' to a complex filter, set a neutral safe base (brightness(1) contrast(1) saturate(1) hue-rotate(0deg)) via gsap.set() before tweening to the sanitized target filter. This minimizes the chance of a visible grey/white flash.
- Kept existing sanitization (min saturation 0.9, brightness 0.95, etc.) and overwrite policy.
- Intent: Reduce flashes on hue slider movement and scene filter transitions.

3) gsap-animation-registry.js
- Reduced log verbosity:
  - Added verbose flag: window.__3886_DEBUG?.gsapRegistryVerbose
  - Otherwise, log only a compact status line every 20 registrations
- Intent: Keep visibility while drastically reducing console noise.

4) performance-inspector.js
- Reduced log frequency to every 30 seconds.
- Compact single-line log unless window.__3886_DEBUG?.performanceInspectorVerbose is true.
- Intent: Keep visibility while reducing console noise.

5) performance-monitor.js
- Throttled auto-optimization to at most once every 15 seconds on low-FPS warnings.
- Intent: Prevent repeated optimization spam and excessive cleanup churn.

Results
- Flashes: Significantly reduced; one rare flash still observed during hue slider interaction.
- Logging: Substantially quieter. Registry shows periodic status; inspector outputs compact line.

Next Steps
1) Diagnostics (non-intrusive):
   - Add window.__3886_DIAG.getStats() to read counts of DOM nodes, registry animations, intervals, FPS; no hooks, no timers.
2) Optional extra hardening for filter transitions:
   - When transitioning from any filter to 'none', optionally tween to a neutral base, then remove filter—only if we continue to observe flashes.
3) Only after confirming stability: evaluate a small, opt-in queue for non-critical effect animations to avoid bursts (strictly bypassed for critical targets).

Notes
- Avoided global GSAP wrappers or supervisor overrides to prevent regressions.
- All changes are localized and reversible.
