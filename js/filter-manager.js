// Centralized Filter Manager for safe, coordinated filter transitions
// Ensures no grey/white flashes and coordinates slider vs. scene transitions

import gsap from 'gsap';

// Ensure GSAP is globally available
if (typeof window !== 'undefined' && !window.gsap) {
    window.gsap = gsap;
}

class FilterManager {
  constructor() {
    this.state = { hue: 0, saturation: 100, brightness: 100, contrast: 100 };
    this.applyTimeout = null;
  }

  // Clamp and build safe filter string
  buildFilterFromState(state = this.state) {
    const hue = Math.max(-180, Math.min(180, Number(state.hue || 0)));
    const saturation = Math.max(80, Math.min(200, Number(state.saturation || 100)));
    const brightness = Math.max(95, Math.min(150, Number(state.brightness || 100)));
    const contrast = Math.max(80, Math.min(150, Number(state.contrast || 100)));
    
    // IMPORTANT: CSS filters need percentage as decimal for saturate/brightness/contrast
    // 100% = 1, 150% = 1.5, etc.
    const saturationDecimal = saturation / 100;
    const brightnessDecimal = brightness / 100;
    const contrastDecimal = contrast / 100;
    
    return `hue-rotate(${hue}deg) saturate(${saturationDecimal}) brightness(${brightnessDecimal}) contrast(${contrastDecimal})`;
  }

  setPartial(partial, debounceMs = 300) {
    this.state = { ...this.state, ...partial };
    this.scheduleApply(debounceMs);
  }

  reset() {
    this.state = { hue: 0, saturation: 100, brightness: 100, contrast: 100 };
    this.applyImmediate('none', 0.5);
  }

  scheduleApply(debounceMs = 300) {
    clearTimeout(this.applyTimeout);
    this.applyTimeout = setTimeout(() => {
      const filter = this.buildFilterFromState();
      this.applyImmediate(filter, 1.2);
    }, debounceMs);
  }

  // Immediate application for scene transitions or effects
  applyImmediate(filter, duration = 1.2) {
    try {
      const safeFilter = this._sanitize(filter);
      gsap.killTweensOf(document.body, 'filter');
      
      // Use onUpdate to force the filter with setProperty for stronger application
      gsap.to({ dummy: 0 }, {
        dummy: 1,
        duration,
        ease: 'power1.inOut',
        onUpdate: function() {
          const progress = this.progress();
          // Interpolate from current to target
          document.body.style.setProperty('filter', safeFilter, 'important');
        },
        onComplete: () => {
          document.body.style.setProperty('filter', safeFilter, 'important');
        }
      });
    } catch (e) {
      // Fallback
      document.body.style.setProperty('filter', filter, 'important');
    }
  }

  _sanitize(filterValue) {
    if (!filterValue || filterValue === 'none') return 'none';
    let safeFilter = filterValue;
    
    // Fix brightness values that are too low (less than 0.95)
    safeFilter = safeFilter.replace(/brightness\((0\.[0-8]\d*|0\.9[0-4])\)/g, 'brightness(0.95)');
    
    // Fix saturation values that are too low (less than 0.9)
    safeFilter = safeFilter.replace(/saturate\((0\.[0-8]\d*|0)\)/g, 'saturate(0.9)');
    
    // Fix contrast values that are too low (less than 0.8)
    safeFilter = safeFilter.replace(/contrast\((0\.[0-7]\d*|0)\)/g, 'contrast(0.8)');
    
    // Remove grayscale/sepia entirely (they cause grey appearance)
    safeFilter = safeFilter.replace(/sepia\([^)]*\)/g, '');
    safeFilter = safeFilter.replace(/grayscale\([^)]*\)/g, '');
    
    return safeFilter.trim();
  }
}

const filterManager = new FilterManager();
if (typeof window !== 'undefined') {
  window.filterManager = filterManager;
}
export default filterManager;