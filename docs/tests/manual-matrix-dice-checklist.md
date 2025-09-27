# Manual Test Checklist: Matrix Dice System

Goal: Verify synchronized 15s countdown, deterministic message display, and standalone fallback behavior.

## Setup
- Launch main page: `npm run dev`, open `index.html` (served by Vite).
- Launch control panel in a separate tab: open `control-panel.html` (same origin).

## Sync & Message Flow
- Observe the 15s countdown on the control panel.
- When a roll triggers (≥90), the control panel should display `PENDING…` under LAST MSG.
- The animation page should display the matrix message immediately after the trigger.
- The control panel should then update LAST MSG to the exact text shown on the animation page (on `matrix_message_displayed`).
- Confirm there are no additional, “random” messages in-between rolls.

## Edge Cases
- Trigger two rolls back-to-back by temporarily lowering the threshold (developer tool): confirm the ACK sequence still keeps LAST MSG in sync.
- While a message is active, if another trigger happens, ensure the latest ACK sets LAST MSG to what is actually shown (current message) and no stale text is left.

## Fallback Mode (no control panel)
- Close the control panel tab.
- After ~25 seconds, the animation page should begin autonomous dice behavior (15s countdown, 1–100, trigger ≥90).
- Reopen the control panel. Verify the animation page stops its fallback dice after the panel connects.

## Regression Checks
- Scene switching, color changes, FX toggles, and anime.js triggers remain unaffected.
- Performance stats (FPS, MEM, DOM, FX) still update as before.
