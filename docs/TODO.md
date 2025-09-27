# TODOs – Stability, Performance, and Guardrails

Owner: ZIKADA 3886 Engineering
Status: Open (tracked per CODEX.md Acceptance/Backlog)

## Build & Tooling
- [ ] Align Vite minifier:
  - EITHER install `terser` (vite.config.js sets `build.minify = 'terser'`).
  - OR switch to default esbuild minification. Document decision in DEV-BRANCH-SUMMARY.md.
- [ ] Fix Vite HTML legacy script bundling error:
  - `index.html: <script src="js/3886.js" type="text/javascript">` fails build.
  - Options: move `js/3886.js` under `public/js/` and reference `/js/3886.js`, or convert to module entry if compatible, or exclude from bundling.
  
Progress:
- [x] Switched minifier to esbuild in vite.config.js.
- [x] Moved Webflow bundle to `public/js/3886.js` and updated `index.html` to `<script src="/js/3886.js" defer></script>`.

## Filter Safety Remediation (Body filter must route via filter-manager.js)
- [x] visual-effects-complete.js
  - [x] Replace direct `document.body.style.filter` writes with `filterManager.applyImmediate()` in:
    - enableHolographic()
    - disableHolographic()
- [x] vj-receiver.js
  - [x] Replace GSAP body filter timeline in `triggerRGBSplit()` with sequential `filterManager.applyImmediate()` calls.
  - [x] Replace direct body filter write/reset in `full-chaos` branch.
  - [x] Route midnight invert filter via `filterManager.applyImmediate()` in `subtle-effects.js`.
  - [x] Audit other filter uses; keep non-body element filters as-is (only filter-manager fallback and emergency reset remain).

## Intervals & Loops
- [ ] Convert matrix rain loop to requestAnimationFrame
  - File: `js/text-effects.js` (`setInterval(drawMatrix, 50)`).
  - Add hidden-tab backoff; keep visual parity.
- [ ] Ensure BPM ripple intervals are cleaned up on disable
  - File: `js/vj-receiver.js` (`setupBpmRippleTimer`).

## Performance Monitor Policy
- [ ] Keep `safe-performance-monitor.js` enabled on `index.html` (non-intrusive).
- [ ] Gate `performance-monitor.js` optimizations behind a debug flag in production contexts.
  - Option: only auto-start on control-panel.html or when `window.__3886_DEBUG?.perfMonitor` is true.

Progress:
- [x] Gated auto-start in `js/performance-monitor.js` (control-panel or `__3886_DEBUG.perfMonitor`).

## Repo Hygiene
- [x] Remove stray `*:Zone.Identifier` files (Windows origin markers).
- [x] Remove invalid wildcard keyframes in `styles/logo-protection.css` (build warning).

## Guard Checks (npm scripts)
- [x] Add scripts:
  - `check:hover-translate` – grep for translate on :hover.
  - `check:filters` – grep for direct body filter writes/tweens.
  - `check:guardrails` – run both checks.

## Documentation
- [ ] Update CODEX.md acceptance notes once remediations are merged.
- [ ] Note decisions/metrics in TEST-REPORT.md and DEV-BRANCH-SUMMARY.md.
Progress:
- [x] Converted matrix rain to rAF + hidden-tab backoff in `js/text-effects.js`.
