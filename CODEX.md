# Codex Agent Runbook (ZIKADA 3886)

This runbook complements `AGENTS.md`. Use it as a WARP-style, numbered checklist to diagnose builds, reproduce runtime issues, and document QA for this Vite/GSAP/Three setup.

1. Build diagnostics (capture signals; minimize variables)
   - Run `npm run build` (or `npx vite build --debug`) directly in the shell to capture full logs and any terminating signal.
   - If it fails or warns on chunking, retry with `npm run build -- --force` after clearing Vite caches; compare logs for changes.
   - Isolate config: temporarily disable manualChunks in `vite.config.js` (the `three`/`gsap` splits) to narrow import-graph problems; re-enable once stable.
   - Record environment in your notes: `node -v`, `npm -v`, OS, and which minifier is active (esbuild vs terser).

2. Reproduce runtime with explicit toggles (dev → preview → serve)
   - Launch `npm run dev` (clears caches, forces Vite, port 3886). Open `index.html` and `control-panel.html` in the same session.
   - If the server exits or hangs, rerun with `npx vite --host --debug` to capture a stack trace and exit code; note port conflicts or plugin errors.
   - Exercise control‑panel paths methodically: baseline → `?anime=1` or `window.dispatchEvent(new Event('3886:enable-anime'))` → dashboards under `js/performance-*`.
   - Verify guardrails: no hover movement (prefer color/border/shadow/opacity or ≤1.02 scale), sanitized filter transitions (no white flashes), preserve Webflow data attributes.
   - Repeat checks under `npm run preview` (built bundle on 3886) and `npm run serve` (static mimic) to compare dev vs build behaviour.

3. Draft the Control‑Panel QA + docs plan (frontmatter + metrics)
   - Create or update `docs/qa-<branch>.md` with:
     ---
     branch: <name>
     entrypoints: [index.html, control-panel.html]
     toggles: [anime, filters, postprocessing]
     fps_baseline: <value>
     fps_variant: <value>
     memory_delta: <value>
     warnings: []
     risks: []
     ---
   - List touched areas: `js/chaos-*`, `js/anime-*`, `js/performance-*`, `styles/*`, and any `vite.config.js` edits (e.g., manualChunks).
   - Sync companion docs when behaviour or controls shift: `ANIMEJS-INTEGRATION-PLAN.md`, `PERFORMANCE-IMPROVEMENTS.md`, `DEV-BRANCH-SUMMARY.md`, and `docs/*`.
   - Handoff notes: summarize build outcome, dev/preview observations (FPS/memory), open risks, and next steps; reference paths as `path:line` where relevant.

Quick refs
- Dev: `npm run dev` (port 3886). Preview: `npm run preview`. Static mimic: `npm run serve`.
- Anime toggle: `?anime=1` or `window.dispatchEvent(new Event('3886:enable-anime'))`.
- Guardrails live in `AGENTS.md` (Styling Guardrails). Defer to those rules when in doubt.

