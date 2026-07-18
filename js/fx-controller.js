// FX Controller centralizes effect intensities and provides helpers to apply them

import animationRuntime from './runtime/animation-runtime.js';
import ambientCanvasRenderer from './ambient-canvas-renderer.js';

const DATA_STREAMS_OWNER = 'fx-controller:data-streams';

class FXController {
  constructor() {
    this.intensities = {
      glitch: 0.5,
      particles: 0.5,
      distortion: 0, // REMOVED from controls - only applies blur to logo elements
      noise: 0.25, // Fixed: Default to 25% to match control panel
      plasma: 0, // New: Plasma effect intensity
      strobe: 0, // New: Strobe effect intensity
    };
    this.globalMult = 1.0;
    // Registry for effect handlers provided by other modules (e.g., anime-enhanced-effects)
    this.effectRegistry = {};
    // Track on/off states for toggleable effects
    this.effectStates = this.effectStates || {};
    this.runtimeOwners = new Set([DATA_STREAMS_OWNER]);
  }

  _runtimeOwner(name) {
    const owner = `fx-controller:${name}`;
    this.runtimeOwners.add(owner);
    return owner;
  }

  // Utility: create overlay lazily under #fx-root with fade-in
  _ensureOverlay(id, styleText) {
    const owner = this._runtimeOwner(`overlay:${id}`);
    animationRuntime.disposeOwner(owner);
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      el.dataset.persistentFx = 'true';
      el.style.cssText = styleText;
      el.style.opacity = '0';
      (document.getElementById('fx-root') || document.body).appendChild(el);
      // Fade-in
      animationRuntime.scheduleTimeout(owner, () => {
        el.style.transition = 'opacity 300ms ease';
        el.style.opacity = '1';
      }, 16);
    } else {
      el.style.opacity = '1';
    }
    return el;
  }

  // Utility: fade out and remove overlay by id
  _removeOverlay(id) {
    const owner = this._runtimeOwner(`overlay:${id}`);
    animationRuntime.disposeOwner(owner);
    const el = document.getElementById(id);
    if (el) {
      try {
        el.style.transition = 'opacity 200ms ease';
        el.style.opacity = '0';
        animationRuntime.scheduleTimeout(owner, () => { try { el.remove(); } catch {} }, 220);
      } catch { try { el.remove(); } catch {} }
    }
  }

  setIntensity(partial) {
    Object.entries(partial || {}).forEach(([k, v]) => {
      const clamped = Math.max(0, Math.min(1, Number(v)));
      this.intensities[k] = clamped;
      this._applySideEffect(k, clamped);
    });
  }

  getIntensity(name) {
    return this.intensities[name] ?? 0;
  }

  setGlobalIntensityMultiplier(mult) {
    this.globalMult = Math.max(0.1, Math.min(2.0, Number(mult || 1)));
    // Re-apply current states to reflect multiplier
    Object.keys(this.intensities).forEach(k => this._applySideEffect(k, this.intensities[k]));
  }

  // Enable/disable effects - used by control panel toggles
  setEffectEnabled(effectName, enabled, value = null) {
    console.log(`🎮 FX Controller: ${effectName} ${enabled ? 'enabled' : 'disabled'}${value !== null ? ` (${value})` : ''}`);

    // Store effect states
    if (!this.effectStates) {
      this.effectStates = {};
    }
    this.effectStates[effectName] = enabled;

    // If a module registered custom handlers for this effect, prefer those
    const reg = this.effectRegistry && this.effectRegistry[effectName];
    if (reg) {
      try {
        if (enabled && typeof reg.enable === 'function') reg.enable();
        if (!enabled && typeof reg.disable === 'function') reg.disable();
      } catch (err) {
        console.warn(`FX registry handler for ${effectName} threw`, err);
      }
      return; // Do not run fallback implementation if registry exists
    }

    // Apply effect-specific logic (fallbacks)
    switch(effectName) {
      case 'holographic':
        this.applyHolographicEffect(enabled);
        break;
      case 'dataStreams':
        this.applyDataStreamsEffect(enabled);
        break;
      case 'strobeCircles':
        this.applyStrobeCirclesEffect(enabled);
        break;
      case 'plasma':
        this.applyPlasmaEffect(enabled);
        break;
      case 'cyberGrid':
        this.applyCyberGridEffect(enabled);
        break;
      case 'glitch':
        this.setIntensity({ glitch: enabled ? 0.5 : 0 });
        break;
      case 'particles':
        this.setIntensity({ particles: enabled ? 0.5 : 0 });
        break;
      case 'noise':
        // Support both toggle and gradual values
        if (value !== null && value !== undefined) {
          // Slider value (0-100 converted to 0-1)
          this.setIntensity({ noise: value / 100 });
        } else {
          // Toggle on/off
          this.setIntensity({ noise: enabled ? 0.25 : 0 });
        }
        break;
      case 'rgbSplit':
        this.applyRGBSplitEffect(enabled);
        break;
      case 'chromatic':
        this.applyChromaticAberrationEffect(enabled);
        break;
      case 'scanlines':
        this.applyScanlinesEffect(enabled);
        break;
      case 'vignette':
        this.applyVignetteEffect(enabled);
        break;
      case 'filmgrain':
        this.applyFilmGrainEffect(enabled);
        break;
      case 'aurora':
        this.applyAuroraEffect(enabled);
        break;
      case 'neonRings':
        this.applyNeonRingsEffect(enabled);
        break;
      case 'circuitGrid':
        this.applyCircuitGrid(enabled);
        break;
      case 'chromaticPulse':
        this.applyChromaticPulse(enabled);
        break;
      default:
        console.warn(`Unknown effect: ${effectName}`);
    }
  }

  // Allow external modules to register effect handlers (enable/disable)
  registerEffect(name, handlers = {}) {
    this.effectRegistry[name] = handlers;
    // If the effect is currently marked as enabled, bring it up immediately
    if (this.effectStates && this.effectStates[name] === true && typeof handlers.enable === 'function') {
      try { handlers.enable(); } catch (_) {}
    }
  }

  // Holographic effect implementation
  applyHolographicEffect(enabled) {
    const elements = document.querySelectorAll('.text-3886, .logo-text-wrapper');
    elements.forEach(el => {
      if (enabled) {
        el.style.setProperty('filter', 'hue-rotate(180deg) saturate(2)', 'important');
        el.style.setProperty('mix-blend-mode', 'screen', 'important');
      } else {
        el.style.removeProperty('filter');
        el.style.removeProperty('mix-blend-mode');
      }
    });
  }

  // Data streams effect implementation
  applyDataStreamsEffect(enabled) {
    if (!enabled) {
      animationRuntime.disposeOwner(DATA_STREAMS_OWNER);
      this.dataStreamsInterval = null;
      const overlay = document.getElementById('data-streams-overlay');
      if (overlay) overlay.remove();
      return;
    }

    if (this.dataStreamsInterval) return;
    animationRuntime.disposeOwner(DATA_STREAMS_OWNER);

    let overlay = document.getElementById('data-streams-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'data-streams-overlay';
      overlay.dataset.persistentFx = 'true';
      overlay.style.cssText = `
        position: fixed; inset: 0; pointer-events: none; z-index: 9999;
        opacity: 0.25; color: #00ff85; font-family: monospace;
        font-size: 12px; letter-spacing: 1px; overflow: hidden;
      `;
      (document.getElementById('fx-root') || document.body).appendChild(overlay);
    }

    if (!document.getElementById('data-streams-style')) {
      const style = document.createElement('style');
      style.id = 'data-streams-style';
      style.textContent = '@keyframes fall { to { transform: translateY(100vh); } }';
      document.head.appendChild(style);
    }

    const SPAWN_INTERVAL_MS = 650;
    const MAX_CHILDREN = 18;
    this.dataStreamsInterval = animationRuntime.scheduleInterval(DATA_STREAMS_OWNER, () => {
      if (!overlay.isConnected) {
        animationRuntime.disposeOwner(DATA_STREAMS_OWNER);
        this.dataStreamsInterval = null;
        return;
      }

      const fps = window.performanceBus?.metrics?.fps || window.safePerformanceMonitor?.metrics?.fps || 60;
      if (fps < 24 || document.getElementsByTagName('*').length > 3000) return;
      while (overlay.childElementCount >= MAX_CHILDREN) overlay.firstElementChild?.remove();

      const stream = document.createElement('div');
      stream.style.cssText = `
        position: absolute; left: ${Math.random() * 100}%; top: -20px;
        writing-mode: vertical-rl; text-shadow: 0 0 6px rgba(0,255,133,0.6);
        animation: fall 3.2s linear;
      `;
      stream.textContent = Math.random().toString(36).substring(2, 15);
      overlay.appendChild(stream);
      animationRuntime.scheduleTimeout(DATA_STREAMS_OWNER, () => stream.remove(), 3300);
    }, SPAWN_INTERVAL_MS);
  }

  // Strobe circles effect implementation
  applyStrobeCirclesEffect(enabled) {
    let strobeOverlay = document.getElementById('strobe-circles-overlay');

    if (enabled && !strobeOverlay) {
      strobeOverlay = document.createElement('div');
      strobeOverlay.id = 'strobe-circles-overlay';
      strobeOverlay.dataset.persistentFx = 'true';
      strobeOverlay.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 200px;
        height: 200px;
        border: 2px solid #00ff85;
        border-radius: 50%;
        pointer-events: none;
        z-index: 9998;
        animation: strobe-pulse 0.5s infinite;
      `;
      (document.getElementById('fx-root') || document.body).appendChild(strobeOverlay);

      // Add strobe animation
      if (!document.getElementById('strobe-style')) {
        const style = document.createElement('style');
        style.id = 'strobe-style';
        style.textContent = `
          @keyframes strobe-pulse {
            0%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
            50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.5); }
          }
        `;
        document.head.appendChild(style);
      }
    } else if (!enabled && strobeOverlay) {
      strobeOverlay.remove();
    }
  }

  // Plasma effect implementation with masking like beehive
  applyPlasmaEffect(enabled) {
    let plasmaOverlay = document.getElementById('plasma-overlay');

    if (enabled) {
      if (!plasmaOverlay) {
        // Create plasma overlay container
        plasmaOverlay = document.createElement('div');
        plasmaOverlay.id = 'plasma-overlay';
        plasmaOverlay.dataset.persistentFx = 'true';
        plasmaOverlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
          overflow: hidden;
        `;

        // Create plasma canvas
        const plasmaCanvas = document.createElement('div');
        plasmaCanvas.id = 'plasma-canvas';
        plasmaCanvas.style.cssText = `
          position: absolute;
          top: -10%;
          left: -10%;
          width: 120%;
          height: 120%;
          background: linear-gradient(45deg, #ff00ff, #00ffff, #ffff00, #ff00ff);
          background-size: 400% 400%;
          animation: plasma-shift 10s ease infinite;
          opacity: 0.3;
          mix-blend-mode: screen;
        `;

        // Create mask for logo area (circular hole in center)
        const maskSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        maskSvg.style.cssText = `
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
        `;
        maskSvg.innerHTML = `
          <defs>
            <mask id="plasma-mask">
              <rect width="100%" height="100%" fill="white"/>
              <circle cx="50%" cy="50%" r="200" fill="black"/>
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="black" mask="url(#plasma-mask)"/>
        `;

        plasmaCanvas.style.mask = 'url(#plasma-mask)';
        plasmaCanvas.style.webkitMask = 'url(#plasma-mask)';

        plasmaOverlay.appendChild(plasmaCanvas);

        // Insert before main content but after background
        const mainWrapper = document.querySelector('.main-wrapper');
        if (mainWrapper) {
          (document.getElementById('fx-root') || mainWrapper.parentNode || document.body).appendChild(plasmaOverlay);
        } else {
          (document.getElementById('fx-root') || document.body).appendChild(plasmaOverlay);
        }

        // Add plasma animation
        if (!document.getElementById('plasma-style')) {
          const style = document.createElement('style');
          style.id = 'plasma-style';
          style.textContent = `
            @keyframes plasma-shift {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            #plasma-canvas {
              -webkit-mask-image: radial-gradient(circle at center, transparent 200px, black 250px);
              mask-image: radial-gradient(circle at center, transparent 200px, black 250px);
            }
          `;
          document.head.appendChild(style);
        }
      }
    } else {
      if (plasmaOverlay) {
        plasmaOverlay.remove();
      }
      const plasmaStyle = document.getElementById('plasma-style');
      if (plasmaStyle) {
        plasmaStyle.remove();
      }
    }
  }

  // Cyber grid effect implementation
  applyCyberGridEffect(enabled) {
    document.getElementById('cyber-grid-overlay')?.remove();
    ambientCanvasRenderer.setCyberGridEnabled(enabled);
  }

  // RGB Split Effect
  applyRGBSplitEffect(enabled) {
    let rgbStyle = document.getElementById('rgb-split-style');

    if (enabled) {
      if (!rgbStyle) {
        rgbStyle = document.createElement('style');
        rgbStyle.id = 'rgb-split-style';
        rgbStyle.textContent = `
          .rgb-split-target {
            position: relative;
            text-shadow: var(--fx-rgb-offset, 1px) 0 #ff0000, calc(var(--fx-rgb-offset, 1px) * -1) 0 #00ffff;
            transition: text-shadow 0.2s ease;
          }
          .rgb-split-target.rgb-anim {
            animation: rgb-split 1.2s ease-in-out infinite;
          }
          @keyframes rgb-split {
            0%, 100% { text-shadow: var(--fx-rgb-offset, 1px) 0 #ff0000, calc(var(--fx-rgb-offset, 1px) * -1) 0 #00ffff; }
            50% { text-shadow: calc(var(--fx-rgb-offset, 1px) * -1) 0 #ff0000, var(--fx-rgb-offset, 1px) 0 #00ffff; }
          }
        `;
        document.head.appendChild(rgbStyle);
      }

      // Apply to selected text/logo elements only
      const targets = document.querySelectorAll('.logo-text, .text-3886, h1, h2, h3');
      targets.forEach(el => el.classList.add('rgb-split-target', 'rgb-anim'));
    } else {
      const targets = document.querySelectorAll('.rgb-split-target');
      targets.forEach(el => {
        el.classList.remove('rgb-anim');
        el.classList.remove('rgb-split-target');
      });
      if (rgbStyle) rgbStyle.remove();
    }
  }

  // Chromatic Aberration Effect
  applyChromaticAberrationEffect(enabled) {
    const elements = document.querySelectorAll('.logo-text, .text-3886, h1, h2, h3');

    if (enabled) {
      // Create chromatic style if needed
      let chromStyle = document.getElementById('chromatic-style');
      if (!chromStyle) {
        chromStyle = document.createElement('style');
        chromStyle.id = 'chromatic-style';
        chromStyle.textContent = `
          .chromatic-active { position: relative; }
          .chromatic-active::before,
          .chromatic-active::after {
            content: attr(data-text);
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            opacity: var(--fx-chromatic-opacity, 0.7);
            mix-blend-mode: var(--fx-chromatic-blend, screen);
            pointer-events: none;
          }
          .chromatic-active::before { color: #ff0000; transform: translate(-1px, -1px); }
          .chromatic-active::after  { color: #00ffff; transform: translate(1px, 1px); }
        `;
        document.head.appendChild(chromStyle);
      }

      elements.forEach(el => {
        el.classList.add('chromatic-active');
        el.setAttribute('data-text', el.textContent || '');
      });
    } else {
      document.querySelectorAll('.chromatic-active').forEach(el => {
        el.classList.remove('chromatic-active');
        el.removeAttribute('data-text');
      });
      const chromStyle = document.getElementById('chromatic-style');
      if (chromStyle) chromStyle.remove();
    }
  }

  // Scanlines Effect
  applyScanlinesEffect(enabled) {
    document.getElementById('scanlines-overlay')?.remove();
    ambientCanvasRenderer.setScanlinesEnabled(true, enabled ? 0.14 : 0.035);
  }

  // Vignette Effect
  applyVignetteEffect(enabled) {
    let vignetteOverlay = document.getElementById('vignette-overlay');

    if (enabled && !vignetteOverlay) {
      vignetteOverlay = document.createElement('div');
      vignetteOverlay.id = 'vignette-overlay';
      vignetteOverlay.dataset.persistentFx = 'true';
      vignetteOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9994;
        background: radial-gradient(
          circle at center,
          transparent 40%,
          rgba(0, 0, 0, 0.2) 60%,
          rgba(0, 0, 0, 0.6) 100%
        );
      `;
      (document.getElementById('fx-root') || document.body).appendChild(vignetteOverlay);
    } else if (!enabled && vignetteOverlay) {
      vignetteOverlay.remove();
    }
  }

  // Film Grain Effect
  applyFilmGrainEffect(enabled) {
    document.getElementById('grain-overlay')?.remove();
    document.getElementById('grain-anim-style')?.remove();
    ambientCanvasRenderer.setFilmGrainEnabled(enabled, 0.15);
  }

  // Aurora Effect (soft animated gradient)
  applyAuroraEffect(enabled) {
    if (enabled) {
      this._ensureOverlay('aurora-overlay', `
        position: fixed; inset: 0; pointer-events: none; z-index: 2;
        background: radial-gradient(100% 60% at 30% 30%, rgba(0,255,133,0.08), transparent 60%),
                    radial-gradient(120% 70% at 70% 70%, rgba(0,170,255,0.06), transparent 60%);
        animation: aurora-shift 16s ease-in-out infinite;
        will-change: background-position, transform, opacity;
      `);
      if (!document.getElementById('aurora-style')) {
        const style = document.createElement('style');
        style.id = 'aurora-style';
        style.textContent = `
          @keyframes aurora-shift {
            0% { filter: hue-rotate(0deg); transform: translate3d(0,0,0); }
            50% { filter: hue-rotate(30deg); transform: translate3d(0, -1%, 0); }
            100% { filter: hue-rotate(0deg); transform: translate3d(0,0,0); }
          }
        `;
        document.head.appendChild(style);
      }
    } else {
      this._removeOverlay('aurora-overlay');
      const s = document.getElementById('aurora-style'); if (s) s.remove();
    }
  }

  // Neon Rings (center pulses)
  applyNeonRingsEffect(enabled) {
    if (enabled) {
      const el = this._ensureOverlay('neon-rings-overlay', `
        position: fixed; inset: 0; pointer-events: none; z-index: 3;
        display: grid; place-items: center;
      `);
      if (!document.getElementById('neon-rings-inner')) {
        const inner = document.createElement('div');
        inner.id = 'neon-rings-inner';
        inner.style.cssText = `
          width: 220px; height: 220px; border-radius: 50%;
          box-shadow: 0 0 24px rgba(0,255,133,0.3), inset 0 0 18px rgba(0,255,133,0.25);
          border: 2px solid rgba(0,255,133,0.4);
          animation: neon-ring 6s ease-in-out infinite; will-change: transform, opacity;
        `;
        el.appendChild(inner);
      }
      if (!document.getElementById('neon-rings-style')) {
        const style = document.createElement('style'); style.id = 'neon-rings-style';
        style.textContent = `@keyframes neon-ring { 0%,100% { transform: scale(1); opacity: .6 } 50% { transform: scale(1.2); opacity: .9 } }`;
        document.head.appendChild(style);
      }
    } else {
      this._removeOverlay('neon-rings-overlay');
      const s = document.getElementById('neon-rings-style'); if (s) s.remove();
    }
  }

  // Circuit Grid (slow drift grid)
  applyCircuitGrid(enabled) {
    if (enabled) {
      this._ensureOverlay('circuit-grid-overlay', `
        position: fixed; inset: 0; pointer-events: none; z-index: 2; opacity: 0.25;
        background-image:
          linear-gradient(rgba(0, 255, 133, 0.07) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 133, 0.07) 1px, transparent 1px);
        background-size: 60px 60px; animation: circuit-move 20s linear infinite; will-change: transform;
      `);
      if (!document.getElementById('circuit-style')) {
        const style = document.createElement('style'); style.id = 'circuit-style';
        style.textContent = `@keyframes circuit-move { 0% { transform: translate3d(0,0,0) } 100% { transform: translate3d(60px,60px,0) } }`;
        document.head.appendChild(style);
      }
    } else {
      this._removeOverlay('circuit-grid-overlay');
      const s = document.getElementById('circuit-style'); if (s) s.remove();
    }
  }

  // Chromatic pulse via chaosEngine shader if present
  applyChromaticPulse(enabled) {
    try {
      const pass = window.chaosEngine?.chromaticAberrationPass;
      if (!pass) return;
      if (enabled) {
        pass.uniforms.amount.value = 0.01;
      } else {
        pass.uniforms.amount.value = 0.002;
      }
    } catch {}
  }

  // Apply to live systems (chaosEngine and DOM)
  _applySideEffect(name, rawValue) {
    const value = rawValue * this.globalMult;
    if (name === 'glitch') {
      const glitchPass = window.chaosEngine?.glitchPass;
      if (glitchPass) glitchPass.enabled = value > 0.1;
      ambientCanvasRenderer.setGlitchStrength(glitchPass ? 0 : value);
    }
    if (name === 'particles') {
      if (window.chaosEngine && window.chaosEngine.particles) {
        const mat = window.chaosEngine.particles.material;
        if (mat) {
          // Boost visual range so slider/toggle produces noticeable change
          mat.opacity = Math.min(1, 0.1 + value * 0.9);
          mat.size = 0.5 + value * 3.0;
        }
      }
    }
    if (name === 'distortion') {
      const distortionElements = document.querySelectorAll('.image-wrapper, .logo-text-wrapper, .text-3886');
      distortionElements.forEach(el => {
        // Apply blur with !important to override other filters
        if (value > 0) {
          el.style.setProperty('filter', `blur(${(value * 3).toFixed(2)}px)`, 'important');
        } else {
          el.style.removeProperty('filter');
        }
      });
    }
    if (name === 'noise') {
      ambientCanvasRenderer.setNoiseStrength(value);
      if (window.chaosInitializer) {
        window.chaosInitializer._ambientNoiseStrength = Math.max(0, Math.min(1, value));
      }
      document.body.style.removeProperty('background-image');
    }
    if (name === 'plasma') {
      const plasmaOverlay = document.getElementById('plasma-overlay');
      if (plasmaOverlay) {
        // Adjust opacity and animation speed based on intensity
        if (value === 0) {
          plasmaOverlay.style.display = 'none';
        } else {
          plasmaOverlay.style.display = 'block';
          plasmaOverlay.style.opacity = Math.min(0.6, value * 0.6).toFixed(3);
          
          const plasmaCanvas = document.getElementById('plasma-canvas');
          if (plasmaCanvas) {
            // Adjust animation duration based on intensity (faster = more intense)
            const duration = Math.max(6, 15 - (value * 9)); // 6s to 15s range
            plasmaCanvas.style.animationDuration = `${duration}s`;
          }
        }
      } else if (value > 0) {
        // Auto-enable plasma effect if intensity set but not enabled
        this.applyPlasmaEffect(true);
      }
    }
    if (name === 'strobe') {
      const strobeOverlay = document.getElementById('strobe-circles-overlay');
      if (strobeOverlay) {
        // Adjust opacity and animation speed based on intensity
        if (value === 0) {
          strobeOverlay.style.display = 'none';
        } else {
          strobeOverlay.style.display = 'block';
          strobeOverlay.style.opacity = Math.min(0.8, value * 0.8).toFixed(3);
          
          // Adjust animation duration based on intensity (faster = more intense)
          const duration = Math.max(0.2, 0.6 - (value * 0.4)); // 0.2s to 0.6s range
          strobeOverlay.style.animationDuration = `${duration}s`;
        }
      } else if (value > 0) {
        // Auto-enable strobe effect if intensity set but not enabled
        this.applyStrobeCirclesEffect(true);
      }
    }
  }

  destroy() {
    this.runtimeOwners.forEach(owner => animationRuntime.disposeOwner(owner));
    this.runtimeOwners.clear();
    this.runtimeOwners.add(DATA_STREAMS_OWNER);
    this.dataStreamsInterval = null;
    this.dataStreamsKeepAlive = null;
    this.plasmaKeepAlive = null;

    Object.values(this.effectRegistry || {}).forEach(handler => {
      try { handler?.disable?.(); } catch (_) {}
    });
    Object.keys(this.effectStates || {}).forEach(name => { this.effectStates[name] = false; });

    [
      'data-streams-overlay', 'strobe-circles-overlay', 'plasma-overlay',
      'cyber-grid-overlay', 'scanlines-overlay', 'vignette-overlay',
      'grain-overlay', 'aurora-overlay', 'neon-rings-overlay',
      'circuit-grid-overlay'
    ].forEach(id => document.getElementById(id)?.remove());
    [
      'data-streams-style', 'strobe-style', 'plasma-style', 'grid-style',
      'rgb-split-style', 'chromatic-style', 'scanlines-anim-style',
      'grain-anim-style', 'aurora-style', 'neon-rings-style', 'circuit-style'
    ].forEach(id => document.getElementById(id)?.remove());

    this.applyHolographicEffect(false);
    this._applySideEffect('distortion', 0);
  }
}

const fxController = new FXController();
if (typeof window !== 'undefined') window.fxController = fxController;
export default fxController;
