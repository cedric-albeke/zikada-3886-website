// PerformanceProfileManager
// Centralized runtime performance profiler and orchestrator for ZIKADA 3886

// Design goals:
// - Subscribe to FPS updates and apply tiered actions with hysteresis
// - Coordinate DPR, post-processing quality, particle density, and non-critical visual systems
// - Be safe to import on server or tests (no DOM work at import)

export class PerformanceProfileManager {
  constructor(opts = {}) {
    this.engine = opts.engine || (typeof window !== 'undefined' ? window.chaosEngine : null);
    this.lottie = opts.lottie || (typeof window !== 'undefined' ? window.lottieAnimations : null);
    this.effects = opts.effects || (typeof window !== 'undefined' ? (window.fxController || null) : null);

    this.currentProfile = 'high';
    this._targetProfile = 'high';
    this._demoteStreak = 0;
    this._promoteStreak = 0;

    // Lock mode: when set, ignore FPS updates and keep the locked profile
    this._lockProfile = null; // 'high' | 'medium' | 'low' | null

    this.thresholds = {
      demoteHighToMedFPS: 45,
      demoteMedToLowFPS: 33,
      promoteLowToMedFPS: 46,
      promoteMedToHighFPS: 60,
      demoteConsecutiveSecs: 3,   // ~3 seconds under threshold
      promoteMedSecs: 60,         // ~60 seconds at/over 60 FPS to go high
      promoteLowSecs: 15          // ~15 seconds at/over 46 FPS to go medium
    };

    this.profiles = {
      high: {
        ppQuality: 'high',
        dprClamp: 1.0,
        particleScale: 1.0,
        lottieSpeed: 1.0,
        lottiePaused: false,
        overlays: { rgbSplit: true, chromatic: true, scanlines: true }
      },
      medium: {
        ppQuality: 'medium',
        dprClamp: 0.9,
        particleScale: 0.7,
        lottieSpeed: 0.9,
        lottiePaused: false,
        overlays: { rgbSplit: true, chromatic: false, scanlines: true }
      },
      low: {
        ppQuality: 'low',
        dprClamp: 0.7,
        particleScale: 0.4,
        lottieSpeed: 0.75,
        lottiePaused: true,
        overlays: { rgbSplit: false, chromatic: false, scanlines: true }
      }
    };

    this._unsub = null;
    this._fpsSampleTimer = null;
    this._basePixelRatio = null;
    this._lastApplied = null;
  }

  start() {
    if (typeof window === 'undefined') return;

    // Prefer the app's dispatched FPS events (chaos-init emits performance:fps:update)
    const onFps = (e) => {
      try {
        const avgFPS = e?.detail?.avgFPS ?? e?.detail?.fps ?? null;
        if (typeof avgFPS === 'number' && Number.isFinite(avgFPS)) {
          this._onMetric(avgFPS);
        }
      } catch (_) {}
    };
    window.addEventListener('performance:fps:update', onFps);
    this._unsub = () => window.removeEventListener('performance:fps:update', onFps);

    // Seed base DPR
    this._basePixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    // Respect persisted lock or last settled profile
    let bootProfile = null;
    try {
      const lock = localStorage.getItem('3886_profile_lock');
      if (lock && this.profiles[lock]) {
        this._lockProfile = lock;
        bootProfile = lock;
      } else {
        const last = localStorage.getItem('3886_profile_last');
        if (last && this.profiles[last]) bootProfile = last;
      }
    } catch (_) {}

    // Apply initial profile based on lock/last or a quick capability probe
    try {
      const gl = document.createElement('canvas')?.getContext('webgl') || document.createElement('canvas')?.getContext('experimental-webgl');
      const vendor = gl?.getExtension('WEBGL_debug_renderer_info') ? gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL) : '';
      const cores = navigator?.hardwareConcurrency || 4;
      // Very conservative: if integrated / low cores, start medium; else high
      if (bootProfile && this.profiles[bootProfile]) {
        this.applyProfile(bootProfile, { reason: 'boot-persist' });
      } else if (/intel|iris|uhd|radeon\s*vega/i.test(String(vendor)) || cores <= 4) {
        this.applyProfile('medium', { reason: 'seed' });
      } else {
        this.applyProfile('high', { reason: 'seed' });
      }
    } catch (_) {
      this.applyProfile('medium', { reason: 'seed-fallback' });
    }
  }

  stop() {
    if (this._unsub) this._unsub();
    this._unsub = null;
    if (this._fpsSampleTimer) clearInterval(this._fpsSampleTimer);
    this._fpsSampleTimer = null;
  }

  _onMetric(avgFPS) {
    // Ignore metrics when locked
    if (this._lockProfile && this.profiles[this._lockProfile]) return;

    const t = this.thresholds;
    const cur = this.currentProfile;

    // Demotion hysteresis (fast response)
    if (cur === 'high' && avgFPS < t.demoteHighToMedFPS) {
      this._demoteStreak++;
      if (this._demoteStreak >= t.demoteConsecutiveSecs) {
        this.applyProfile('medium', { reason: 'fps-demote-high->med', fps: avgFPS });
        this._demoteStreak = 0;
        this._promoteStreak = 0;
        return;
      }
    } else if (cur === 'medium' && avgFPS < t.demoteMedToLowFPS) {
      this._demoteStreak++;
      if (this._demoteStreak >= t.demoteConsecutiveSecs) {
        this.applyProfile('low', { reason: 'fps-demote-med->low', fps: avgFPS });
        this._demoteStreak = 0;
        this._promoteStreak = 0;
        return;
      }
    } else {
      this._demoteStreak = 0;
    }

    // Promotion hysteresis (slow response)
    if (cur === 'low' && avgFPS >= t.promoteLowToMedFPS) {
      this._promoteStreak++;
      if (this._promoteStreak >= t.promoteLowSecs) {
        this.applyProfile('medium', { reason: 'fps-promote-low->med', fps: avgFPS });
        this._promoteStreak = 0;
      }
    } else if (cur === 'medium' && avgFPS >= t.promoteMedToHighFPS) {
      this._promoteStreak++;
      if (this._promoteStreak >= t.promoteMedSecs) {
        this.applyProfile('high', { reason: 'fps-promote-med->high', fps: avgFPS });
        this._promoteStreak = 0;
      }
    } else {
      this._promoteStreak = 0;
    }
  }

  applyProfile(profile, meta = {}) {
    if (!this.profiles[profile]) return;
    if (this.currentProfile === profile && this._lastApplied === profile) return;

    this._targetProfile = profile;
    const cfg = this.profiles[profile];

    try {
      // DPR: use engine.setPixelRatio if available
      const base = this._basePixelRatio || Math.min((typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1, 2);
      const targetDpr = Math.max(0.5, Math.min(base * cfg.dprClamp, base));
      if (this.engine && typeof this.engine.setPixelRatio === 'function') {
        try { this.engine.setPixelRatio(targetDpr); } catch (_) {}
      } else if (window?.WEBGL_RESOURCE_MANAGER && typeof window.WEBGL_RESOURCE_MANAGER.setPixelRatio === 'function') {
        try { window.WEBGL_RESOURCE_MANAGER.setPixelRatio(targetDpr); } catch (_) {}
      }

      // Post-processing quality
      if (this.engine && typeof this.engine.adjustPostProcessing === 'function') {
        try { this.engine.adjustPostProcessing(cfg.ppQuality); } catch (_) {}
      } else {
        // Fallback: emit an event some subsystems listen to
        try { window.dispatchEvent(new CustomEvent('adjustPostProcessing', { detail: { quality: cfg.ppQuality } })); } catch (_) {}
      }

      // Particles: scale relative to engine.particleCount if available
      try {
        const baseCount = (this.engine && typeof this.engine.particleCount === 'number') ? this.engine.particleCount : 800;
        const count = Math.max(200, Math.round(baseCount * cfg.particleScale));
        window.dispatchEvent(new CustomEvent('adjustParticles', { detail: { count } }));
      } catch (_) {}

      // Lottie control
      try {
        if (this.lottie) {
          if (cfg.lottiePaused && typeof this.lottie.pauseAll === 'function') this.lottie.pauseAll();
          if (!cfg.lottiePaused && typeof this.lottie.resumeAll === 'function') this.lottie.resumeAll();
          // Attempt to set speed on all players
          const animations = this.lottie.animations || {};
          Object.keys(animations).forEach((name) => {
            try {
              const player = animations[name];
              if (player && typeof player.setAttribute === 'function') {
                player.setAttribute('speed', String(cfg.lottieSpeed));
              }
            } catch (_) {}
          });
        }
      } catch (_) {}

      // Overlays (best-effort, depends on fx controller presence)
      try {
        const fx = this.effects || window.fxController;
        if (fx && typeof fx.toggleEffect === 'function') {
          ['rgbSplit','chromatic','scanlines'].forEach((key) => {
            const enabled = cfg.overlays[key];
            try { fx.toggleEffect(key, enabled); } catch (_) {}
          });
        } else {
          // Fallback via DOM styles for some effects if needed (best-effort, no-op by default)
        }
      } catch (_) {}

      this.currentProfile = profile;
      this._lastApplied = profile;

      // Persist last settled profile
      try { localStorage.setItem('3886_profile_last', profile); } catch (_) {}

      try {
        window.dispatchEvent(new CustomEvent('profile:changed', { detail: { profile, locked: !!this._lockProfile, ...meta } }));
      } catch (_) {}
      if (typeof window !== 'undefined') {
        window.performanceProfile = profile;
      }
      if (typeof console !== 'undefined') {
        console.log(`[ProfileManager] Applied profile: ${profile}`, meta);
      }
    } catch (error) {
      if (typeof console !== 'undefined') {
        console.warn('[ProfileManager] Failed to apply profile', profile, error);
      }
    }
  }

  // Lock/unlock API for control panel
  setLockProfile(profileOrNull) {
    if (profileOrNull && !this.profiles[profileOrNull]) return;
    this._lockProfile = profileOrNull || null;
    try {
      if (this._lockProfile) localStorage.setItem('3886_profile_lock', this._lockProfile);
      else localStorage.removeItem('3886_profile_lock');
    } catch (_) {}
    if (this._lockProfile) {
      this.applyProfile(this._lockProfile, { reason: 'lock' });
    } else {
      try { window.dispatchEvent(new CustomEvent('profile:changed', { detail: { profile: this.currentProfile, locked: false } })); } catch(_) {}
    }
  }
}

export default function createPerformanceProfileManager(opts) {
  const mgr = new PerformanceProfileManager(opts);
  if (typeof window !== 'undefined') window.performanceProfileManager = mgr;
  return mgr;
}