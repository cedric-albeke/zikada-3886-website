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
    // Clear any pending filter applications
    clearTimeout(this.applyTimeout);
    this.applyTimeout = null;

    // Reset state to defaults
    this.state = { hue: 0, saturation: 100, brightness: 100, contrast: 100 };

    // Kill any existing GSAP animations on body filter
    gsap.killTweensOf(document.body, 'filter');

    // Remove filter completely to ensure clean reset
    document.body.style.removeProperty('filter');

    console.log('✅ Filter Manager reset to defaults');
  }

  scheduleApply(debounceMs = 300) {
    clearTimeout(this.applyTimeout);
    this.applyTimeout = setTimeout(() => {
      const filter = this.buildFilterFromState();
      this.applyImmediate(filter, 1.2);
    }, debounceMs);
  }

  // Immediate application for scene transitions or effects
  // Supports applyImmediate(filter, duration) or applyImmediate(filter, { duration, ease })
  applyImmediate(filter, durationOrOpts = 1.2) {
    try {
      const opts = (typeof durationOrOpts === 'object' && durationOrOpts !== null)
        ? { duration: Number(durationOrOpts.duration ?? 1.2), ease: String(durationOrOpts.ease || 'power1.inOut') }
        : { duration: Number(durationOrOpts), ease: 'power1.inOut' };
      const safeFilter = this._sanitize(filter);
      gsap.killTweensOf(document.body, 'filter');
      
      // Atomic transition: neutralize edges when transitioning to/from 'none'
      const current = window.getComputedStyle(document.body).filter;

      if (current === 'none' && safeFilter !== 'none') {
        // Start from neutral base to avoid grey flash when applying new filter from none
        gsap.set(document.body, { filter: 'brightness(1) contrast(1) saturate(1) hue-rotate(0deg)' });
        gsap.to(document.body, {
          filter: safeFilter,
          duration: opts.duration,
          ease: opts.ease,
          overwrite: 'auto'
        });
      } else if (safeFilter === 'none' && current && current !== 'none') {
        // Fade to neutral first, then remove filter entirely
        gsap.to(document.body, {
          filter: 'brightness(1) contrast(1) saturate(1) hue-rotate(0deg)',
          duration: Math.max(0.1, opts.duration * 0.5),
          ease: opts.ease,
          overwrite: 'auto',
          onComplete: () => {
            document.body.style.removeProperty('filter');
          }
        });
      } else {
        // Normal transition between filters
        gsap.to(document.body, {
          filter: safeFilter,
          duration: opts.duration,
          ease: opts.ease,
          overwrite: 'auto'
        });
      }
    } catch (e) {
      // Fallback - use regular style setting
      if (filter === 'none') {
        document.body.style.removeProperty('filter');
      } else {
        document.body.style.filter = filter;
      }
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
