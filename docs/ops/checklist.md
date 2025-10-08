# Ops Checklist: Phase/Effects Stability (Dev)

Use this checklist during local development or review:

1) Startup
- Open http://127.0.0.1:3886/
- Ensure only one "CHAOS ENGINE ONLINE" appears (no double init)

2) Transition smoothness
- Observe automatic phase change (~30s). Expect: short fade-to-black (~200–300ms) and fade-in (~300ms)
- Trigger manually: `window.chaosInit.phaseController.setPhase('neon')`

3) Overlay sanity
- Verify exactly one overlay: `document.querySelectorAll('#viz-blackout').length === 1`
- matrix messages should reuse same overlay; no new `.matrix-blackout` nodes should appear

4) Effects budgets
- Default flags: extended/random disabled.
- Enable for test: `?extanim=1&randanim=1`
- Check container size: `.extended-effects-root` total nodes should remain under ~800 and not grow unbounded

5) Emergency watchdogs
- No emergency stops during steady state with default flags.

6) HMR safety
- Save chaos-init.js or extended-animations.js repeatedly; no duplicate loops or extra overlays should accumulate.

7) Quick remediation
- To re-disable heavy effects: reload without flags or run in console:
  - `window.SAFE_FLAGS.setFlag('EXTENDED_ANIMATIONS_ENABLED', false)`
  - `window.SAFE_FLAGS.setFlag('RANDOM_ANIMATIONS_ENABLED', false)`
