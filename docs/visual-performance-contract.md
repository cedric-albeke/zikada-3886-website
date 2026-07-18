# Visual Performance Contract

## Non-negotiable runtime rule

Automatic performance control may reduce rendering cost, but it must not shorten an admitted visual sequence or remove an entire effect family. A running effect owns its authored duration and cleanup boundary. Only explicit operator actions, teardown, navigation, unrecoverable errors and emergency safety controls may interrupt it.

This rule applies engine-wide to every visual family: Lottie, GSAP, Anime.js, CSS, DOM/SVG particles, Canvas, Three.js/WebGL, post-processing and Matrix/message effects. Lottie is one validation case, not a special exemption.

## Allowed adaptive levers

- Render resolution and device pixel ratio
- Particle or geometry density within the same visual composition
- RAF/update cadence for continuously sampled simulations
- Post-processing pass count and shader precision
- Spawn frequency for ambient effects
- Concurrent admission limits, using a bounded queue rather than eviction
- Offscreen/background-tab suspension with resumable state
- Resource pooling, decoded-asset reuse and lazy initialization
- Replacing filters, layout animation or oversized paint surfaces with compositor-friendly equivalents

## Disallowed automatic shortcuts

- Killing the oldest running effect to admit a new one
- Fading an animation after an arbitrary global two-to-three-second timeout
- Setting a complete effect family to zero capacity in LOW
- Pausing every timeline owned by a subsystem solely because FPS dipped
- Deleting live visual nodes before their effect-level completion signal
- Treating a performance deadline as the intended visual duration
- Expiring a healthy ambient producer because it has existed for an arbitrary wall-clock age
- Reloading the page or globally clearing GSAP/timers as an automatic FPS or memory response

## Admission and cleanup

One-shot trigger FX use bounded owner scopes for nodes, timers and animations. If concurrency or an exclusive render resource is busy, the request is coalesced into a bounded pending queue. The active visual finishes first; then the next compatible request starts. A long watchdog deadline remains only to recover broken executors that never call their completion path. The watchdog has a hard 30-second minimum and cannot be configured as a short authored duration; normal one-shot completion remains effect-owned.

Cleanup remains deterministic after completion, explicit disable, reset, emergency stop or module destruction. The distinction is timing: cleanup follows the visual contract instead of substituting for performance engineering.

Periodic work shares one deadline-based cadence driver. Background-tab stalls skip missed periods instead of replaying a catch-up burst. Interval age is telemetry, not a cleanup criterion; finite producers must declare an explicit authored lifetime and long-lived ambient producers remain owner-scoped until teardown.

## Lottie policy

Ambient `.lottie` clips use source metadata for their cycle length. Once admitted, they remain visible for an explicit number of complete cycles, with a minimum 12-second presentation window. LOW keeps one active Lottie lane, MEDIUM one and HIGH two. A busy lane queues the next distinct clip rather than fading the current clip out.

Hidden and completed players are paused, not recreated on every cycle. Legacy `.lottie` archives are converted deterministically to JSON during prebuild and rendered by a pinned local `lottie-web` Canvas-only runtime; no unversioned CDN component is used. Players initialize lazily after admission, share a source-data cache and cap backing DPR/curve quality by profile. Player containers and listeners have one disposable runtime owner. The performance profile controls admission and rendering cost, not authored playback speed or lifetime.

## Current low-cost substitutions

- Full-viewport animated backdrop filtering was replaced by a translucent color wash, avoiding a filtered repaint of the entire scene on every frame.
- The hero shell is exactly viewport-bound. The background texture stays on a roughly 1.08–1.16x viewport transform surface in every profile; its slow ±2° drift replaces the former rotating `120vmax` square. Intro, phase and Matrix zooms resolve through the same surface budget instead of inflating it to 3–8x viewport scale.
- The Beehive background uses one bounded texture, four fixed details and owner-scoped animation. Its former 150% blurred repaint plane and recursive native particle timers were removed.
- Matrix rain, Cybergrid, digital noise, scanlines, Film Grain and the software-WebGL glitch fallback are composed by one profile-scaled Ambient Canvas. LOW/MEDIUM/HIGH use 37.5%/50%/65% backing resolution at 6/8/12 FPS. Every family remains an independent channel; toggling one never creates a second fullscreen layer or disables another.
- Lottie keeps complete presentation cycles while LOW removes only the large wrapper `drop-shadow()` pass; MEDIUM uses a reduced color filter and HIGH retains the authored filter.
- Three stacked 20/40/60 px logo blurs are represented by radial gradients, and the holographic sweep uses a narrower, slower software-renderer surface.
- Anime enhancements no longer instantiate duplicate DOM particle and data-stream renderers beside the primary Three.js/GSAP families. Their remaining listeners and schedulers are owner-scoped.
- GSAP samples at 60/40/24 FPS for HIGH/MEDIUM/LOW while retaining wall-clock timeline duration and completion boundaries.
- Background, centerpiece, logo, random and subtle effect families remain available in LOW.
- Random/subtle effects scale their spawn density, child limits and sampling cadence instead of being suppressed.
- WebGL software-renderer safety continues to cap DPR, particles and post-processing, while DOM/SVG/Lottie visual variety remains available through bounded admission.
- Longevity and stability monitors consume the central Performance Bus and use profile-aware thresholds. Automatic health recovery may lower quality or untrack already disconnected nodes; it may not pause, hide, age-evict or delete a live visual. Browser validation across a full 30-second health cycle produced no current-bundle warning or error.
- FPS telemetry has exactly one frame-counting RAF, owned by the Performance Bus. VJ Receiver, Chaos Init, Safe Monitor, Performance Optimizer V2 and Watchdog reporting subscribe to that source. The watchdog retains only a low-cadence stall heartbeat; telemetry consumers never create another measurement loop.
- Lottie variety uses one 1 Hz due-time scheduler for all nine staggered families plus rotation reversal. It preserves each initial delay and recurrence interval without allocating one permanent interval per family.
- Matrix pre-glitch, scramble, failsafe, dice and restore work; text scramble/corruption; and MIDI repeat, trail, feedback and test-pattern work all have explicit runtime owners. Rebinding or retriggering replaces the relevant owner instead of stacking timers or RAFs.
- Automatic Performance Optimizer V2 maintenance is audit-only. It may request a lower-cost profile, clear caches and untrack disconnected or completed registry work; it may not remove connected particles/canvases, clone live DOM to erase listeners, or apply permanent opacity suppression.
- Watchdog recovery changes profile, DPR, resolution, cadence and density. It no longer kills unrelated GSAP timelines, clears the global timer set, installs CSS that rewrites every animation duration, or enters an automatic reload loop.
- Sonar show sessions own exactly one blip cadence task and release every session timer/tween/node together on authored hide. Repeated shows cannot multiply permanent intervals.
- Beehive Logo Blend completes its full timeline before hide; the former two-second wall timer no longer cuts its 6.3-second pulse sequence short.
- Structural telemetry is sampled centrally every two seconds. Safe Monitor, the compatibility optimizer, Chaos lifecycle audits, VJ trigger density and the watchdog consume that snapshot instead of performing competing full-DOM/heap scans.
- Heap or DOM pressure emits capacity telemetry and can lower DPR, resolution, cadence, density or future admission. It no longer invokes aggressive DOM cleanup, phase cleanup, global timeline kills or automatic soft restart.
- Digital Wave remains visually present under pressure; it scales from its full burst density down to a three-burst composition instead of aborting the admitted trigger.

## Root trace and measured envelope

A 10-second V8 CPU profile was roughly 90% idle, while the full output initially rendered at only 4–6 FPS and `about:blank`/the control panel reached about 60 FPS. The limiting resource was therefore software compositing/raster work, not JavaScript execution. Surface inspection found 14 canvas layers, dormant Lottie canvases, a roughly 6000x3700 background, a blurred fullscreen Plasma canvas and several simultaneous blend/filter passes.

The current deterministic 120-second SwiftShader stress run is `artifacts/soak/soak-20260718-202657.jsonl`. It exercises all twelve panel FX in a fixed flip/restore sequence:

- 120/120 samples completed with no page or console error.
- Average 26.97 FPS, warm average 28.50 FPS, minimum 11, maximum 42 and final 40 FPS.
- Heap remained exactly 9.54 MB at every exposed sample.
- DOM moved from 137 to 168 nodes with a peak of 190. The retained nodes are the persistent Lottie root and its nine reusable shells; the former periodic cleanup incorrectly detached that root after 60 seconds.
- Runtime tokens moved from 112 to 102 with a peak of 119. Explicit runtime-owner count moved from 32 to 33 with a peak of 35; the extra named owners replace unmanaged work and do not represent growing load.
- Visible canvas surfaces stayed between two and three, down from four to five.
- At most one Lottie canvas and one Lottie RAF were active. The Lottie root and all nine containers stayed connected for every sample.
- All 24 deterministic transitions (twelve FX flip/restore pairs) completed.
- The software-renderer safety profile remained LOW for 112/120 samples; visual families and admitted clip lifetimes still remained intact.

The intermediate run immediately before telemetry consolidation averaged 24.25 FPS with a 24.68 warm average. Removing duplicate measurement RAFs raised those figures by 11.2% and 15.5% respectively. Against the prior 27.28/28.77 best trace, the final result is within 1.1% average and 0.9% warm while spending substantially more time in strict LOW, avoiding all active-visual eviction, reducing the DOM peak from 204 to 190, and lowering start/end runtime tokens from 115/103 to 112/102. The lower single-frame minimum occurred during deterministic FX/Lottie overlap and did not lead to memory, token or lifecycle growth. SwiftShader remains a deliberately severe software-GPU signal rather than a production hardware benchmark.

### Focused hardware-browser validation after the engine-wide policy update

- A probe configured with a two-second watchdog remained active and connected after 3.2 seconds, proving the enforced 30-second watchdog floor. Explicit abort then removed its node and owner immediately.
- Digital Wave was admitted under simulated 10 FPS / 2,000-DOM-node pressure. It retained four low-density bursts at one second and released all four only after its authored 2.4-second completion path.
- Two staggered six-FX bursts over 15 samples produced 0 rejections and ended with 0 active/queued triggers and 0 trigger nodes. FPS averaged 63.7, ranged from 36 to 94 and recovered without intervention to 92–99 in the next idle window, ending at 82.
- Mixed-burst heap moved from 19.32 MB to a 20.84 MB peak and ended at 19.02 MB. DOM moved from 134 to a peak of 148 and ended at 137. Runtime owners began and ended at 44; tokens moved from 129 to 130.
- A concurrently admitted Morphing Particle Lottie remained visible throughout the following ten-second attribution window. The reusable Lottie root stayed connected throughout both runs.
- Seven targeted Chromium E2E checks passed: four viewport contracts, persistent-FX single ownership/release, LOW Lottie full-duration queueing and trigger admission without preemption.

## Validation contract

- A LOW-profile Lottie remains visible after four seconds and satisfies its metadata-derived cycle duration.
- A second Lottie queues while the single LOW lane is occupied and starts after the first releases it.
- Trigger capacity queues the next visual and never stops the active visual with a concurrency-budget reason.
- Emergency stop still clears active and pending work immediately.
- Soak tests continue to enforce bounded DOM, memory and runtime-token growth.
- The persistent Lottie root must remain connected across the 60-second lifecycle-audit boundary; detached players stop their RAF immediately as a final safety net.
- Soak traces record the exact effect, action and before/after state for deterministic attribution of future regressions.
- Scheduler ownership tests enforce one central FPS RAF, one Lottie due-time scheduler and deterministic release of VJ, Matrix and MIDI support owners.

## Safe-reset and final 60-second regression — 2026-07-18

The visual-reset path now reuses the conservative boot profile instead of re-enabling Holographic, Data Streams, Plasma, Noise, Cyber Grid and Vignette together. Particles are the only persistent FX default. The receiver records their state through `fxController` as well as the underlying Three.js material, so panel acknowledgements can no longer disagree with the renderer. Reset regression checks assert that Data Streams and Plasma nodes disappear, the Data Streams runtime owner is released, every FX control and `aria-pressed` value matches the engine, base layers remain visible and Overlay remains off.

The post-fix SwiftShader run is `artifacts/soak/soak-20260718-231731.jsonl`:

- 60/60 samples completed without a page failure.
- Heap remained fixed at the exposed 10 MB value.
- DOM moved from 136 to 141 nodes, within a 126–151 range.
- Runtime owners moved from 45 to 44 with a maximum of 46; tokens moved from 127 to 129 with a temporary maximum of 147 during authored overlap.
- Canvas count moved from two to five and remained capped at five; at most one Lottie player/RAF was active.
- SwiftShader averaged 22.6 FPS, ranged from 15 to 30 and stayed in the explicit software-renderer LOW path. The 15 FPS floor matches the bounded software cadence and is not treated as a hardware-browser benchmark.

The accompanying scheduler regression remained single-owner across repeated binds and retriggers. Combined with the 16/16 control-panel/lifecycle suite, the run shows bounded structural state rather than cleanup-driven visual truncation.
