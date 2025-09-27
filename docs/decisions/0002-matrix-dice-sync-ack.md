# ADR 0002: Matrix Dice System — Single Source, ACK Sync, and Fallback

Date: 2025-09-26

## Status
Accepted

## Context
The Matrix Dice System had two independent 15s timers (control panel and animation page), each rolling and sometimes triggering messages. This led to:
- Countdown/trigger desynchronization between control panel and animation page.
- Mismatched “LAST MSG” vs what actually rendered, because the animation page picked a random message locally and not the one shown on the control panel.

## Decision
1) Single source of truth for dice
- The control panel is authoritative: it rolls every 15s and sends `matrix_message` to the animation page when a trigger occurs.
- The animation page (`js/matrix-messages.js`) no longer auto-starts its dice cycle at init.

2) Display acknowledgment
- When the animation page receives `matrix_message`, it calls `window.matrixMessages.showMessage(message)` and emits `matrix_message_displayed` back to the control panel.
- The control panel updates “LAST MSG” only upon this ACK, ensuring text parity with the display.

3) Fallback, standalone mode
- If no control panel connects within ~25s, the receiver enables an autonomous dice mode via `matrixMessages.enableAutonomousDiceMode()` (15s cadence, 1–100, trigger ≥90 — same odds as the panel).
- If a control panel later connects, the receiver disables the fallback via `disableAutonomousDiceMode()`.

## Consequences
- Removes double-roll conflicts and random out-of-band messages.
- Provides deterministic control panel ↔ animation page synchronization.
- Maintains a graceful standalone experience when the panel isn’t present.

## Implementation Notes
- `js/matrix-messages.js`
  - `init()` no longer starts an internal dice cycle.
  - `showMessage(message?)` now accepts an optional message string and uses it when provided.
  - New `enableAutonomousDiceMode()` / `disableAutonomousDiceMode()` manage a self-contained fallback countdown.
- `js/vj-receiver.js`
  - Tracks control panel presence (`hasControlPanel`). Arms fallback after ~25s if absent; disables when panel connects.
  - Sends `matrix_message_displayed` ACK right after invoking `showMessage`.
- `js/control-panel-professional.js`
  - Shows `PENDING…` immediately after a triggering roll.
  - Updates LAST MSG only on `matrix_message_displayed`.

## Rollback Plan
- Re-enable the animation page’s internal cycle by calling `startMessageCycle()` from `matrix-messages.init()` and remove the ACK logic in `vj-receiver` and the “PENDING…” UX.
