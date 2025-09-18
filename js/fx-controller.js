// FX Controller centralizes effect intensities and provides helpers to apply them

class FXController {
  constructor() {
    this.intensities = {
      glitch: 0.5,
      particles: 0.5,
      distortion: 0, // REMOVED from controls - only applies blur to logo elements
      noise: 0.5,
    };
    this.globalMult = 1.0;
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
        noiseCanvas.style.opacity = (value * 0.05).toFixed(3);
        
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
            recreatedCanvas.style.opacity = (value * 0.05).toFixed(3);
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
          document.body.style.removeProperty('background-image');
        }
      }
    }
  }
}

const fxController = new FXController();
if (typeof window !== 'undefined') window.fxController = fxController;
export default fxController;