// FX Controller centralizes effect intensities and provides helpers to apply them

class FXController {
  constructor() {
    this.intensities = {
      glitch: 0.5,
      particles: 0.5,
      distortion: 0, // REMOVED from controls - only applies blur to logo elements
      noise: 0.25, // Fixed: Default to 25% to match control panel
    };
    this.globalMult = 1.0;
    // Registry for effect handlers provided by other modules (e.g., anime-enhanced-effects)
    this.effectRegistry = {};
    // Track on/off states for toggleable effects
    this.effectStates = this.effectStates || {};
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
    if (!this.dataStreamsInterval) {
      if (enabled) {
        // Create data stream overlay if it doesn't exist
        let overlay = document.getElementById('data-streams-overlay');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.id = 'data-streams-overlay';
          overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            opacity: 0.1;
            color: #00ff85;
            font-family: monospace;
            font-size: 10px;
            overflow: hidden;
          `;
          document.body.appendChild(overlay);
        }

        // Animate data streams
        this.dataStreamsInterval = setInterval(() => {
          const stream = document.createElement('div');
          stream.style.cssText = `
            position: absolute;
            left: ${Math.random() * 100}%;
            top: -20px;
            writing-mode: vertical-rl;
            animation: fall 3s linear;
          `;
          stream.textContent = Math.random().toString(36).substring(2, 15);
          overlay.appendChild(stream);

          setTimeout(() => stream.remove(), 3000);
        }, 200);

        // Add CSS animation
        if (!document.getElementById('data-streams-style')) {
          const style = document.createElement('style');
          style.id = 'data-streams-style';
          style.textContent = `
            @keyframes fall {
              to { transform: translateY(100vh); }
            }
          `;
          document.head.appendChild(style);
        }
      }
    } else if (!enabled) {
      clearInterval(this.dataStreamsInterval);
      this.dataStreamsInterval = null;
      const overlay = document.getElementById('data-streams-overlay');
      if (overlay) overlay.remove();
    }
  }

  // Strobe circles effect implementation
  applyStrobeCirclesEffect(enabled) {
    let strobeOverlay = document.getElementById('strobe-circles-overlay');

    if (enabled && !strobeOverlay) {
      strobeOverlay = document.createElement('div');
      strobeOverlay.id = 'strobe-circles-overlay';
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
      document.body.appendChild(strobeOverlay);

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
          mainWrapper.parentNode.insertBefore(plasmaOverlay, mainWrapper);
        } else {
          document.body.insertBefore(plasmaOverlay, document.body.firstChild);
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
    let gridOverlay = document.getElementById('cyber-grid-overlay');

    if (enabled && !gridOverlay) {
      gridOverlay = document.createElement('div');
      gridOverlay.id = 'cyber-grid-overlay';
      gridOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9997;
        background-image:
          linear-gradient(rgba(0, 255, 133, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 133, 0.1) 1px, transparent 1px);
        background-size: 50px 50px;
        animation: grid-move 10s linear infinite;
      `;
      document.body.appendChild(gridOverlay);

      // Add grid animation
      if (!document.getElementById('grid-style')) {
        const style = document.createElement('style');
        style.id = 'grid-style';
        style.textContent = `
          @keyframes grid-move {
            0% { transform: translate(0, 0); }
            100% { transform: translate(50px, 50px); }
          }
        `;
        document.head.appendChild(style);
      }
    } else if (!enabled && gridOverlay) {
      gridOverlay.remove();
    }
  }

  // RGB Split Effect
  applyRGBSplitEffect(enabled) {
    let rgbStyle = document.getElementById('rgb-split-style');

    if (enabled) {
      if (!rgbStyle) {
        rgbStyle = document.createElement('style');
        rgbStyle.id = 'rgb-split-style';
        rgbStyle.textContent = `
          .main-wrapper {
            animation: rgb-split 0.5s infinite;
          }
          @keyframes rgb-split {
            0%, 100% {
              text-shadow: 2px 0 #ff0000, -2px 0 #00ffff;
              filter: none;
            }
            25% {
              text-shadow: -2px 0 #ff0000, 2px 0 #00ffff;
              filter: contrast(1.1);
            }
            50% {
              text-shadow: 3px 0 #ff00ff, -3px 0 #00ff00;
              filter: contrast(1.2);
            }
            75% {
              text-shadow: -3px 0 #ff00ff, 3px 0 #00ff00;
              filter: contrast(1.1);
            }
          }
        `;
        document.head.appendChild(rgbStyle);
      }

      // Apply to main elements
      const mainWrapper = document.querySelector('.main-wrapper');
      if (mainWrapper) {
        mainWrapper.style.animation = 'rgb-split 0.5s infinite';
      }
    } else {
      if (rgbStyle) rgbStyle.remove();
      const mainWrapper = document.querySelector('.main-wrapper');
      if (mainWrapper) {
        mainWrapper.style.animation = '';
      }
    }
  }

  // Chromatic Aberration Effect
  applyChromaticAberrationEffect(enabled) {
    const elements = document.querySelectorAll('.text-3886, .logo-text-wrapper, h1, h2, h3');

    if (enabled) {
      // Create chromatic style if needed
      let chromStyle = document.getElementById('chromatic-style');
      if (!chromStyle) {
        chromStyle = document.createElement('style');
        chromStyle.id = 'chromatic-style';
        chromStyle.textContent = `
          .chromatic-active {
            position: relative;
          }
          .chromatic-active::before,
          .chromatic-active::after {
            content: attr(data-text);
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0.8;
            pointer-events: none;
          }
          .chromatic-active::before {
            color: #ff0000;
            transform: translate(-2px, -1px);
            mix-blend-mode: screen;
          }
          .chromatic-active::after {
            color: #00ffff;
            transform: translate(2px, 1px);
            mix-blend-mode: screen;
          }
        `;
        document.head.appendChild(chromStyle);
      }

      elements.forEach(el => {
        el.classList.add('chromatic-active');
        el.setAttribute('data-text', el.textContent);
      });
    } else {
      elements.forEach(el => {
        el.classList.remove('chromatic-active');
        el.removeAttribute('data-text');
      });
    }
  }

  // Scanlines Effect
  applyScanlinesEffect(enabled) {
    let scanlinesOverlay = document.getElementById('scanlines-overlay');

    if (enabled && !scanlinesOverlay) {
      scanlinesOverlay = document.createElement('div');
      scanlinesOverlay.id = 'scanlines-overlay';
      scanlinesOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9995;
        background-image: repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(0, 255, 133, 0.03) 2px,
          rgba(0, 255, 133, 0.03) 4px
        );
        animation: scanlines-move 8s linear infinite;
      `;
      document.body.appendChild(scanlinesOverlay);

      // Add animation
      if (!document.getElementById('scanlines-anim-style')) {
        const style = document.createElement('style');
        style.id = 'scanlines-anim-style';
        style.textContent = `
          @keyframes scanlines-move {
            0% { background-position: 0 0; }
            100% { background-position: 0 10px; }
          }
        `;
        document.head.appendChild(style);
      }
    } else if (!enabled && scanlinesOverlay) {
      scanlinesOverlay.remove();
    }
  }

  // Vignette Effect
  applyVignetteEffect(enabled) {
    let vignetteOverlay = document.getElementById('vignette-overlay');

    if (enabled && !vignetteOverlay) {
      vignetteOverlay = document.createElement('div');
      vignetteOverlay.id = 'vignette-overlay';
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
      document.body.appendChild(vignetteOverlay);
    } else if (!enabled && vignetteOverlay) {
      vignetteOverlay.remove();
    }
  }

  // Film Grain Effect
  applyFilmGrainEffect(enabled) {
    let grainOverlay = document.getElementById('grain-overlay');

    if (enabled && !grainOverlay) {
      grainOverlay = document.createElement('div');
      grainOverlay.id = 'grain-overlay';
      grainOverlay.style.cssText = `
        position: fixed;
        top: -100%;
        left: -100%;
        width: 200%;
        height: 200%;
        pointer-events: none;
        z-index: 9993;
        opacity: 0.05;
        animation: grain 0.5s steps(1) infinite;
      `;

      // Create noise pattern
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 255;
        data[i] = noise;     // R
        data[i+1] = noise;   // G
        data[i+2] = noise;   // B
        data[i+3] = 255;     // A
      }

      ctx.putImageData(imageData, 0, 0);
      grainOverlay.style.backgroundImage = `url(${canvas.toDataURL()})`;
      grainOverlay.style.backgroundSize = '200px 200px';

      document.body.appendChild(grainOverlay);

      // Add animation
      if (!document.getElementById('grain-anim-style')) {
        const style = document.createElement('style');
        style.id = 'grain-anim-style';
        style.textContent = `
          @keyframes grain {
            0%, 100% { transform: translate(0, 0); }
            25% { transform: translate(-5%, -5%); }
            50% { transform: translate(-10%, 5%); }
            75% { transform: translate(5%, -10%); }
          }
        `;
        document.head.appendChild(style);
      }
    } else if (!enabled && grainOverlay) {
      grainOverlay.remove();
    }
  }

  // Apply to live systems (chaosEngine and DOM)
  _applySideEffect(name, rawValue) {
    const value = rawValue * this.globalMult;
    if (name === 'glitch') {
      if (window.chaosEngine && window.chaosEngine.glitchPass) {
        window.chaosEngine.glitchPass.enabled = value > 0.1;
      }
    }
    if (name === 'particles') {
      if (window.chaosEngine && window.chaosEngine.particles) {
        const mat = window.chaosEngine.particles.material;
        if (mat) {
          mat.opacity = Math.min(1, 0.2 + value * 0.8);
          mat.size = 0.2 + value * 1.2;
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
      const noiseCanvas = document.getElementById('static-noise');
      if (noiseCanvas) {
        // Primary method: Use the static-noise canvas
        if (value === 0) {
          // Completely hide noise when set to 0%
          noiseCanvas.style.display = 'none';
          noiseCanvas.style.opacity = '0';
        } else {
          // Show and set opacity for non-zero values
          noiseCanvas.style.display = 'block';
          noiseCanvas.style.opacity = (value * 0.05).toFixed(3);
        }

        // Clear any body background noise fallback when canvas is available
        if (document.body.style.backgroundImage && document.body.style.backgroundImage.includes('noise')) {
          document.body.style.removeProperty('background-image');
        }
      } else {
        // FALLBACK: Canvas missing, try to recreate it first
        console.warn('⚠️ Static noise canvas missing, attempting to recreate...');
        if (window.chaosInitializer && typeof window.chaosInitializer.addStaticNoise === 'function') {
          window.chaosInitializer.addStaticNoise();
          // Try again after recreation
          const recreatedCanvas = document.getElementById('static-noise');
          if (recreatedCanvas) {
            if (value === 0) {
              // Completely hide noise when set to 0%
              recreatedCanvas.style.display = 'none';
              recreatedCanvas.style.opacity = '0';
            } else {
              // Show and set opacity for non-zero values
              recreatedCanvas.style.display = 'block';
              recreatedCanvas.style.opacity = (value * 0.05).toFixed(3);
            }
            return; // Success, don't use body fallback
          }
        }

        // FALLBACK: Use body background SVG noise if canvas recreation failed
        if (value > 0) {
          document.body.style.setProperty('background-image',
            `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='${(value * 0.03).toFixed(3)}'/%3E%3C/svg%3E")`,
            'important'
          );
        } else {
          // Completely remove background noise when set to 0%
          document.body.style.removeProperty('background-image');
        }
      }
    }
  }
}

const fxController = new FXController();
if (typeof window !== 'undefined') window.fxController = fxController;
export default fxController;