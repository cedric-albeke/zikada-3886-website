# Open Questions

This file tracks environment and configuration mismatches or items requiring a decision.

## Ports and servers
- Vite dev server: configured at port 3886 (vite.config.js server.port = 3886).
- npm scripts:
  - dev uses: vite --port 3886 --host 127.0.0.1 --force
  - preview uses: vite preview --port 3886
- Status: unified on 3886 for this effort.

## Node.js version
- Detected: Node v24.8.0, npm 11.6.1
- Prereqs noted: Node 18.x/20.x, npm 8+
- Observation: Node 24 works with Vite 5; leaving as-is, but we can pin to LTS 20.x if desired.

## Browser profile
- Tests and manual plan assume two tabs in the same browser profile for BroadcastChannel/localStorage comms.
- Action: Ensure manual testing uses the same profile/session.

## Follow-ups
- If any port conflict occurs on 3886, document the conflicting process and whether we should adopt a fallback (e.g., 3887) for local dev only.
