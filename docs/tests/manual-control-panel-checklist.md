# Manual test checklist: 3886 Control Panel and Animation System

This checklist validates connectivity, scene control, color matrix, tempo, FX intensities, trigger FX, animation system status, visual effects & layers, master controls, performance modes, and stability.

Prereqs
- Dev server running on port 3886 (npm run dev or npm run preview)
- Two tabs in the same browser profile:
  - Main: http://localhost:3886/
  - Control Panel: http://localhost:3886/control-panel.html

1) Bring-up & Connectivity
- [ ] Control Panel header shows ONLINE within 2–5 seconds.
- [ ] Uptime timer increments.
- [ ] Performance metrics (FPS, MEM, DOM, FX) update at least every 2 seconds.
- [ ] No console errors on either tab.

2) Scene Select
- Click through each scene: INTENSE, CALM, GLITCH, TECHNO, MATRIX, MINIMAL, CHAOTIC, RETRO, VAPORWAVE, CYBERPUNK, NEON, AURORA, SUNSET, OCEAN, FOREST, FIRE, ICE, GALAXY.
- [ ] Main page reflects phase changes (visual tone/effects align with scene).
- [ ] AUTO mode highlights the current scene periodically (auto-active styling).
- [ ] No errors when switching rapidly between scenes.

3) Color Matrix (Hue, Saturation, Brightness, Contrast)
- [ ] Moving each slider changes the main page’s color filters smoothly.
- [ ] No grey/white flashes during transitions.
- [ ] Reset Colors restores defaults (Hue 0°, Sat 100%, Bri 100%, Con 100%).

4) Tempo (Global Speed, Phase Duration, BPM Tap)
- [ ] Adjusting Global Speed affects overall motion speed within ~1s.
- [ ] Changing Phase Duration affects auto scene cadence (verify over a minute).
- [ ] Tapping BPM updates BPM value; periodic ripple occurs when BPM ripple is ON.

5) FX Intensity Sliders
- Glitch, Particles, Noise
- [ ] Changes are visible and reversible.
- [ ] No duplicate overlays or stuck effects after repeated changes.
- [ ] Noise intensity 0% stops noise and reduces CPU (verify via browser task manager if possible).

6) Trigger FX
- STROBE, BLACKOUT, WHITEOUT, RGB SPLIT, RIPPLE, LOGO PULSE, DIGITAL WAVE, COSMIC (SOFT)
- [ ] Each trigger produces a transient effect and cleans up after its duration.
- [ ] Repeated triggers do not accumulate overlays or cause stutters.

7) Animation System
- ENABLE, DISABLE, EMERGENCY STOP
- [ ] UI status reflects actual engine state within ~200ms.
- [ ] Emergency Stop halts all animations and resets visuals safely.
- [ ] Enabling resumes normal operation without errors.

8) Visual Effects & Layers
- Effect Toggles (Holographic, Data Streams, Strobe Circles, Plasma, Particles, Noise, Cyber Grid, RGB Split, Chromatic, Scan Lines, Vignette, Film Grain)
- [ ] Toggling effects adds at most one overlay; OFF removes it.
- [ ] Overlays are attached under #fx-root (inspect DOM once to confirm).
- Layer Toggles (Background, Matrix Rain, Logo, Text, Overlay, Debug)
- [ ] Visibility responds as expected; OFF hides; ON restores.

9) Master Controls
- TOGGLE ALL EFFECTS / TOGGLE ALL LAYERS / RESET VISUALS
- [ ] TOGGLE ALL flips majority state consistently without leaving duplicates.
- [ ] RESET VISUALS restores defaults for effects and layers.

10) Performance Modes
- LOW, AUTO, HIGH
- [ ] Mode changes affect load (e.g., glitch pass, particle sizes/intensity).
- [ ] No visual artifacts or stuck overlays when switching modes.

11) Stability & Soak (Short)
- [ ] Let both tabs idle for 10–15 minutes (minimal user interaction).
- [ ] Verify FPS remains reasonable; memory and DOM node count do not grow without bound.
- [ ] Logs show no recurring errors or warnings.

Notes / Anomalies
- Record any flickers, mis-synced statuses, or overlays that fail to clean up.
- Include timestamps and steps to reproduce.

Pass/Fail Criteria
- All toggles/controls function and clean up correctly.
- No duplicate overlays or stuck effects after repeated interactions.
- UI status matches engine state.
- DOM and memory stable during soak.
