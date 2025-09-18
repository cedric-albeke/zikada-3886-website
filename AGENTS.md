# Repository Guidelines

## Project Structure & Module Organization
- Root entry points live in `index.html` and `control-panel.html`, with bundling handled by `vite.config.js`.
- Runtime logic resides in `js/` as ES modules; feature areas stay grouped (`chaos-*`, `anime-*`, `performance-*`). Extend features by creating a new module within the matching namespace.
- Styling lives in `css/` for global layers and `styles/` for scoped overrides, while media assets are stored in `images/`, `videos/`, and animation data under `animations/`.
- Research notes such as `ANIMEJS-INTEGRATION-PLAN.md`, `PERFORMANCE-IMPROVEMENTS.md`, and `DEV-BRANCH-SUMMARY.md` must stay aligned with animation work.

## Build, Test, and Development Commands
- `npm install` installs Vite, GSAP, and helper tooling after dependency updates.
- `npm run dev` clears caches, frees port 3886, and launches Vite with `--force` to surface module mismatches early.
- `npm run build` outputs the production bundle to `dist/` with manual chunking for `three`, `gsap`, and post-processing utilities.
- `npm run preview` serves the built bundle on port 3886 for pre-release smoke checks.
- `npm run serve` uses `http-server` to mimic static hosting; pair it with CDN caching investigations.

## Coding Style & Naming Conventions
- JavaScript uses ES modules, 2-space indentation, semicolons, and `const`/`let`; files stay kebab-case (`chaos-engine.js`). Prefer exporting factories over singletons when state must be shared.
- Keep descriptive prefixes (`chaos-`, `performance-`, `anime-`) to signal feature areas, and reuse helpers like `animeManager.register` instead of re-implementing lifecycle logic.
- CSS favors BEM-leaning class names with namespace prefixes (`chaos__panel`); isolate experimental tweaks in dedicated files rather than editing `components.css` directly.

## Testing Guidelines
- No automated runner is configured; rely on manual QA via `control-panel.html` toggles and the dashboards in `js/performance-*`.
- Before opening a PR, run `npm run build`, scan the console for warnings, and capture FPS/memory observations when touching animation loops.
- Toggle the anime.js stack with `?anime=1` or dispatch `3886:enable-anime`, then exercise the control panel Anime Tests buttons to confirm GSAP/anime timelines stay in sync.

## Commit & Pull Request Guidelines
- Follow the repo's Conventional Commit pattern (`feat:`, `fix:`, `docs:`) with concise subjects (~72 chars).
- PRs should ship with a clear summary, linked issue or task ID, visuals for UI changes, and notes on manual verification steps.
- Call out dependency updates and refresh companion docs when controls or behavior shift.
