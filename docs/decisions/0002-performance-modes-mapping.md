# Decision 0002: Performance Modes Mapping

Status: Adopted

## Problem
Multiple systems need to respond to a single performance mode (Low/Auto/High) consistently.

## Decision
Introduce a central PerformanceModeManager that normalizes mappings and applies them to all subsystems, then broadcasts an event.

- Input modes: `low`, `auto`, `high`
- Normalized:
  - performanceManager: `low|medium|high` (auto -> medium)
  - performanceElementManager: `aggressive|normal` (low -> aggressive, auto/high -> normal)
  - fxController intensity multiplier: low 0.7, auto 1.0, high 1.3
  - gsapAnimationRegistry.maxAnimations: low 50, auto 100, high 200

## Rationale
Keeps behavior consistent across all consumers and reduces duplicated logic in message receivers.

## Consequences
- vj-receiver delegates to the manager when present
- Other subsystems may subscribe to `performanceMode`/`performanceModeChange`

## Acceptance Criteria
- Switching modes updates all subscribers consistently
- E2E: No functional regressions; measurable load reduction in `low`
