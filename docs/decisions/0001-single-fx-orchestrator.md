# Decision 0001: Single FX Orchestrator

Status: Adopted (development/testing)

## Context
Two systems could apply effects:
- VisualEffectsController (local toggler tied to UI)
- vj-receiver + fx-controller (cross-tab receiver and unified effects manager)

Running both can cause duplicate overlays and conflicting states.

## Decision
Use vj-receiver + fx-controller as the single runtime orchestrator for all FX application.
- VisualEffectsController acts only as a UI facade (delegates commands to vj-receiver/fx-controller).
- All overlays must be created/managed via fx-controller and appended to #fx-root.

## Consequences
- No duplicate overlays when toggling from the control panel.
- Centralized z-index management via #fx-root.
- Clear separation: UI vs. runtime application.

## Flags
Introduce a config flag for offline demos:
- SINGLE_FX_ORCHESTRATOR = "vj" | "local"
- Default: "vj" for dev/soak; "local" supported only when no cross-tab receiver is available.

## Mapping
Control panel effect names → fx-controller IDs
- holographic → holographic
- dataStreams → dataStreams
- strobeCircles → strobeCircles
- plasma → plasma
- particles → particles
- noise → noise
- cyberGrid → cyberGrid
- rgbSplit → rgbSplit
- chromatic → chromatic
- scanlines → scanlines
- vignette → vignette
- filmgrain → filmgrain

## Acceptance Criteria
- Toggling any effect ON/OFF does not increase overlay nodes beyond one per effect.
- DOM count returns to baseline once all effects are OFF.
- Z-index audit shows overlays under #fx-root using unified ranges.
