---
branch: stable/recovered-critical-fixes
surface: control-panel-v3.html
accepted_reference: C:/Users/cedri/AppData/Local/Temp/codex-clipboard-2754e074-cbda-44cb-bd4f-87716f6c49bb.png
reference_size: 1672x941
target_viewport: 1920x1080
status: locally-validated
---

# Control Panel AAA Overhaul

## Design system lock

- Container: one viewport-bound command surface, `minmax(0, …)` in every grid track, no document-level horizontal overflow.
- Grid: 12 columns, 8 px outer gutter and 8 px inter-panel gaps at desktop; top command rail, three dashboard rows, bottom telemetry rail.
- Palette: true black `#030605`, graphite `#0a0d0c`, line `#28302d`, primary green `#78ff30`, cyan `#36d9ff`, magenta `#ff4dc4`, amber `#ffbd2e`, danger `#ff342e`.
- Typography: Space Mono for brand and values; compact uppercase control chrome at 10–13 px; section titles at 15–17 px; no browser-default control typography.
- Geometry: square/near-square controls, 0–2 px radii, one-pixel borders, restrained inner highlights; no floating rounded-card treatment.
- Motion: 120–180 ms state fades/glows only. No hover translation. Reduced-motion disables ornamental transitions.
- Icons: simple 1.5 px outline SVGs using `currentColor`, optically centered in 30–34 px frames.
- Scrolling: only explicit libraries, layer lists and event log may scroll. The desktop document itself remains viewport-bound.

## Component inventory

1. Command rail with brand, live link, FPS, memory, DOM/frame metrics, online state, uptime and KILL/RESET/RELOAD.
2. Performance module with 60 FPS target, quality/adaptive state, 60-second chart and health state.
3. Matrix Dice module with oversized current roll, threshold, last roll/message, armed state and manual test.
4. Trigger FX module with nine primary icon tiles including Cosmic, a macro bank and an expandable library for the remaining effects.
5. Live Controls module with vertical faders for tempo, color and FX values.
6. Scene module with eight numbered production rows, auto state, transition, next scene and expandable scene library.
7. Animation System module with real start, stop, pause, reset, clear-queue and safe-mode commands plus animation library.
8. Layers module with six semantic layer rows, visibility, blend label, FX and mask actions.
9. Event Log module with timestamp/channel/message rhythm and bounded history.
10. Footer telemetry for resolution, color, audio, date/time, CPU/GPU/temperature estimates and version.

## Fidelity ledger before implementation

| Area | Accepted reference | Current render | Required repair |
| --- | --- | --- | --- |
| Shell | One viewport command center with header/footer rails | Tall debug surface with document scrolling | Rebuild as bounded 12-column shell |
| Performance | Large target, full chart, health column | Four small counters and thin sparkline | Restore diagnostic hierarchy and 60-second chart |
| Trigger FX | Eight icon-led tiles plus 2×4 macro pad | 18 equal text buttons plus three wide macros | Promote eight, move remainder to bounded library |
| Live Controls | Ten vertical faders with values | Horizontal sliders split across two groups | Build one vertical fader bank while retaining hooks |
| Scenes | Eight numbered rows with auto/next state | Nineteen uniform buttons | Convert primary scenes to rows; retain full library |
| Animation | Operational command surface | Enable toggle plus twelve effect buttons | Add real lifecycle/queue commands and library |
| Layers | Six layer rows with visibility/blend/FX/mask | Generic effect-toggle matrix | Separate semantic layers from effect library |
| Event log | Tall color-coded operational stream | One short footer row | Give log a dedicated panel with bounded scroll |
| Telemetry | Full top and bottom rails | Sparse header metrics, no footer | Add live footer and consolidate header |
| Responsiveness | Dense desktop, coherent small-screen continuation | Multiple conflicting breakpoints | Single ownership layer with zero horizontal overflow |

## Above-the-fold copy lock

`ZIKADA / 3886`, `LIVE PREVIEW`, `FPS`, `MEM`, `DOM`, `FX`, `ONLINE`, `UPTIME`, `KILL`, `RESET`, `RELOAD`, `PERFORMANCE`, `MATRIX DICE`, `TRIGGER FX`, `MACROS`, `LIVE CONTROLS`, `SCENES`, `ANIMATION SYSTEM`, `LAYERS`, `EVENT LOG`.

Visible operational values may change at runtime. Secondary libraries may expose existing scene/effect names but must not change the primary hierarchy.

## Final fidelity ledger

| Area | Final local implementation | Validation |
| --- | --- | --- |
| Shell | Viewport-bound command center with min-width guards on every grid child and no document-level horizontal overflow | 1920x1080, 1440x900, 1280x720 and 390x844 all satisfy scroll width equals client width and remain within 100vw/100vh |
| Performance | Live target, quality/adaptive state, chart and engine health telemetry | Layout snapshot and panel regression suites |
| Trigger FX | Nine primary tiles, including the restored Cosmic trigger, plus macro bank and bounded full library | Cosmic E2E verifies activation, canvas budget, runtime state, event logging and cleanup |
| Live Controls | Compact vertical fader bank retaining all existing control hooks | Control-panel interaction and viewport suites |
| Scenes | Eight numbered production rows with transition controls and bounded full library | Control-panel regression suites |
| Animation | Start, stop, pause, reset, queue and safe-mode commands backed by lifecycle-aware runtime ownership | Runtime guardrails and lifecycle teardown suite |
| Layers | Semantic layer rows separated from the larger effect library | Layout snapshot and interaction checks |
| Event log | Dedicated bounded, color-coded event stream | Cosmic and control-panel E2E assertions |
| Telemetry | Consolidated live top and bottom rails | Layout snapshot and viewport suites |
| Responsiveness | Dense desktop composition with a coherent narrow-screen continuation | Four-viewport contract suite |

Intentional reference deviations are the ninth primary Cosmic tile, visible LOW/AUTO/HIGH quality shortcuts and live operational values in place of static mock telemetry.

## Interaction and responsive closure — 2026-07-18

| Comparison point | Accepted reference | Final local render |
| --- | --- | --- |
| Shell | One dense command surface with top and bottom telemetry rails | Same 12-column hierarchy; root, body and panel remain bounded to `100vw × 100vh` at 1920×1080, 1440×900, 1280×720 and 390×844 |
| Matrix Dice | Large roll, clear threshold/status hierarchy | Roll and `>= 90` contract retained; the added 62 px timer ring is optically centered, drains smoothly and visibly reaches zero before an instant refill |
| Trigger bank | Icon-led primary actions and compact macro pad | Nine primary actions retain the reference rhythm; Cosmic remains intentionally present as the ninth operator favorite while its renderer is only a ring pulse |
| Animation state | Immediately understandable system state | Ambiguous power glyph replaced by a labelled 84×34 ON/OFF control; text, color, `data-state`, `aria-pressed`, label and runtime acknowledgement switch together |
| Narrow viewport | Coherent continuation without root overflow | Two-row command rail, 34 px minimum header actions and 340–470 px cards; the former 736 px inherited card heights and 101 px layer rows are gone |
| Reset semantics | Reset reduces operator uncertainty | Reset returns to the safe boot profile: Particles ON, every other persistent FX OFF, base layers ON and optional Overlay OFF |

The current browser evidence is stored outside the repository in `C:/Users/cedri/AppData/Local/Temp/zikada-design-audit-20260718/`. The accepted captures are `03-after-mobile-390x844.png`, `04-animation-system-on-mobile.png` and `06-after-desktop-full-composition.png`.

The final panel/lifecycle suite completed 16/16 checks. It covers viewport containment, countdown geometry and timing, 89/90 dice admission, animation-state hydration, system kill/reset/reload, Cosmic cleanup, persistent-FX ownership, Lottie longevity, trigger queuing and the safe visual-reset profile.

## Longevity and performance envelope

- Persistent and transient effects use owner-scoped scheduling so timers, animation frames, GSAP timelines, observers, channels and event listeners can be torn down deterministically.
- The data-stream effect spawns at a 650 ms cadence and is capped at 18 child nodes. Disabling or destroying the effect removes its children and scheduled work.
- Cosmic uses one bounded canvas node, a maximum 960x540 backing resolution, 64 particles and one finite tween, followed by cleanup after 1900 ms.
- Software renderers such as SwiftShader, llvmpipe, WARP and Microsoft Basic Render start in LOW: device pixel ratio 0.5, at most 200 particles, no post-processing composer and no eager shader precompile.
- LOW keeps every visual family and every admitted sequence active. It reduces backing resolution, cadence, density, filter/blend cost and concurrent admission; it never shortens an effect to satisfy an FPS target.
- Automatic profiles apply overlay quality strengths through CSS variables and `performance:visual-quality`; they never call the operator-facing effect toggles.
- Baseline scanlines share the ambient texture, Lottie filters follow the profile without changing clip duration, and duplicate Anime particle/data-stream renderers were consolidated into their primary family renderer.
- The final deterministic SwiftShader soak completed 120/120 samples without memory growth: heap 10 to 10 MB, runtime tokens 113 to 101 with a peak of 116, DOM 138 to 97 with a peak of 165 and visible canvases capped at five.
- Final software-renderer sampling averaged 24.88 FPS (warm 25.12, min 14, max 39), up from the prior 18.89 FPS 120-second run. This remains a software-GPU stress signal, not a production hardware FPS benchmark.
