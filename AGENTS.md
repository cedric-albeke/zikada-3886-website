# Repository Guidelines

Codex CLI agents should pair these repository rules with the role-specific checklist in `CODEX.md`.

## Project Structure & Module Organization
- Entry points: `index.html` and `control-panel.html`; Vite bundling is driven by `vite.config.js`.
- Source modules reside in `js/`, grouped by namespace prefixes. Add features by exporting a factory-based module within the matching `chaos-`, `anime-`, or `performance-` area.
- Global styles live in `css/`, scoped overrides in `styles/`; assets sit under `images/`, `videos/`, `animations/`, and `fonts/`, while control panel UI widgets live in `control-panel/`.
- Research notes in the root plus branch worklogs in `docs/` must ship alongside related animation or performance updates.

## Build, Test, and Development Commands
- `npm install` refreshes Vite, GSAP, Three.js helpers, and supporting tooling after dependency changes.
- `npm run dev` clears caches, frees port 3886, and starts Vite with `--force` to expose import issues early.
- `npm run build` emits the production bundle in `dist/`, with manual chunks for `three`, `gsap`, and post-processing utilities.
- `npm run preview` serves the built bundle on port 3886 for pre-release smoke checks.
- `npm run serve` launches `http-server` to mimic static hosting during CDN/cache investigations.

## Coding Style & Naming Conventions
- JavaScript uses ES modules, 2-space indentation, semicolons, and `const`/`let`; filenames stay kebab-case (e.g., `chaos-engine.js`).
- Prefix feature modules with `chaos-`, `anime-`, or `performance-`; favor shared helpers such as `animeManager.register` over bespoke lifecycle code.
- CSS favors namespace+BEM classes (`chaos__panel`). Keep experimental overrides isolated within dedicated files in `styles/`.

## Styling Guardrails
- Honor the **no hover movement** rule: never animate translate or other positional shifts on hover. Prefer color, border, shadow, opacity, or ≤1.02 scale tweaks.
- Preserve legacy Webflow data attributes and animation hooks when editing existing markup.
- Avoid white flashes by following the `filter-manager.js` pattern—sanitize filters before transitions and maintain safe defaults.

## Testing Guidelines
- Manual QA only: rely on `control-panel.html` toggles and the dashboards under `js/performance-*`.
- Before a PR, run `npm run build`, monitor the console for warnings, and log FPS/memory deltas when touching animation loops.
- Enable anime.js with `?anime=1` or dispatch `3886:enable-anime`, then trigger Anime Tests to verify GSAP/anime synchronization.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat:`, `fix:`, `docs:`) with imperative subjects under ~72 characters.
- PRs require a clear summary, linked task or issue, relevant visuals, and manual verification notes.
- Surface dependency updates and refresh companion docs (`ANIMEJS-INTEGRATION-PLAN.md`, `PERFORMANCE-IMPROVEMENTS.md`, `DEV-BRANCH-SUMMARY.md`, `docs/*`) whenever behavior or controls shift.
