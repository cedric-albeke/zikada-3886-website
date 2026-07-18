// PerformanceProfileManager
// Centralized runtime performance profiler and orchestrator for ZIKADA 3886

import gsap from 'gsap';
import performanceBus from '../performance-bus.js';

const SOFTWARE_RENDER_FPS = 15;
const SOFTWARE_PARTICLE_FLOOR = 64;
const HARDWARE_PARTICLE_FLOOR = 200;

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
    this._transitionKey = null;
    this._transitionSince = null;
    this._now = typeof opts.now === 'function'
      ? opts.now
      : () => (typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now());

    // Lock mode: when set, ignore FPS updates and keep the locked profile
    this._lockProfile = null; // 'high' | 'medium' | 'low' | null

    this.thresholds = {
      targetFPS: 60,
      actionFPS: 45,
      minimumAcceptableFPS: 30,
      demoteHighToMedFPS: 55,
      demoteMedToLowFPS: 55,
      promoteLowToMedFPS: 75,
      promoteMedToHighFPS: 75,
      demoteSustainMs: 3000,
      promoteMedSustainMs: 60000,
      promoteLowSustainMs: 60000
    };

    this.profiles = {
      high: {
        ppQuality: 'high',
        dprClamp: 1.0,
        particleScale: 1.0,
        animationFps: 60,
        renderFps: 60,
        lottieSpeed: 1.0,
        lottiePaused: false,
        overlays: { rgbSplit: 1, chromatic: 1, scanlines: 1 }
      },
      medium: {
        ppQuality: 'medium',
        dprClamp: 0.85,
        particleScale: 0.7,
        animationFps: 40,
        renderFps: 40,
        lottieSpeed: 0.85,
        lottiePaused: false,
        overlays: { rgbSplit: 0.65, chromatic: 0.45, scanlines: 0.75 }
      },
      low: {
        ppQuality: 'low',
        dprClamp: 0.65,
        particleScale: 0.3,
        animationFps: 24,
        renderFps: 24,
        lottieSpeed: 1.0,
        lottiePaused: false,
        overlays: { rgbSplit: 0.35, chromatic: 0.22, scanlines: 0.5 }
      }
    };

    this._unsub = null;
    this._fpsSampleTimer = null;
    this._basePixelRatio = null;
    this._baseParticleCount = Number.isFinite(opts.baseParticleCount)
      ? opts.baseParticleCount
      : ((this.engine && typeof this.engine.particleCount === 'number') ? this.engine.particleCount : 800);
    this._lastApplied = null;
  }

  start() {
    if (typeof window === 'undefined') return;

    const onMetrics = metrics => {
      const avgFPS = metrics?.avgFPS ?? metrics?.fps ?? null;
      if (typeof avgFPS === 'number' && Number.isFinite(avgFPS)) {
        this._onMetric(avgFPS);
      }
    };
    this._unsub = performanceBus.subscribe(onMetrics);
    onMetrics(performanceBus.metrics);

    // Seed base DPR
    // 1.5x is visually dense enough for the intentionally noisy/processed
    // output while avoiding the 4x pixel cost of DPR 2 on large displays.
    this._basePixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);

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
      const debugInfo = gl?.getExtension?.('WEBGL_debug_renderer_info');
      const vendor = debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : gl?.getParameter?.(gl.RENDERER) || '';
      const softwareRenderer = /swiftshader|llvmpipe|software|microsoft basic render|\bwarp\b/i.test(String(vendor));
      this.rendererInfo = String(vendor);
      this.softwareRenderer = softwareRenderer;
      const cores = navigator?.hardwareConcurrency || 4;
      // Explicit operator locks win. A persisted automatic profile must not
      // force a software renderer back into a dangerous high-load boot.
      if (this._lockProfile && this.profiles[this._lockProfile]) {
        this.applyProfile(this._lockProfile, { reason: 'boot-lock' });
      } else if (softwareRenderer) {
        this.applyProfile('low', { reason: 'seed-software-renderer', renderer: this.rendererInfo });
      } else if (bootProfile && this.profiles[bootProfile]) {
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
    const now = this._now();

    // The FPS event can arrive every 100ms. Count wall-clock dwell time rather
    // than samples so a busy producer cannot turn a three-second guard into a
    // 300ms quality oscillation.
    if (cur === 'high') {
      if (this._isSustained('demote-high', avgFPS < t.demoteHighToMedFPS, t.demoteSustainMs, now)) {
        this.applyProfile('medium', { reason: 'fps-demote-high->med', fps: avgFPS });
      }
      return;
    }

    if (cur === 'medium') {
      if (avgFPS < t.demoteMedToLowFPS) {
        if (this._isSustained('demote-medium', true, t.demoteSustainMs, now)) {
          this.applyProfile('low', { reason: 'fps-demote-med->low', fps: avgFPS });
        }
      } else if (avgFPS >= t.promoteMedToHighFPS) {
        if (this._isSustained('promote-medium', true, t.promoteMedSustainMs, now)) {
          this.applyProfile('high', { reason: 'fps-promote-med->high', fps: avgFPS });
        }
      } else {
        this._resetTransition();
      }
      return;
    }

    if (cur === 'low') {
      if (this._isSustained('promote-low', avgFPS >= t.promoteLowToMedFPS, t.promoteLowSustainMs, now)) {
        this.applyProfile('medium', { reason: 'fps-promote-low->med', fps: avgFPS });
      }
    }
  }

  _isSustained(key, condition, durationMs, now) {
    if (!condition) {
      this._resetTransition();
      return false;
    }

    if (this._transitionKey !== key || this._transitionSince === null) {
      this._transitionKey = key;
      this._transitionSince = now;
      return durationMs <= 0;
    }

    return now - this._transitionSince >= durationMs;
  }

  _resetTransition() {
    this._transitionKey = null;
    this._transitionSince = null;
  }

  applyProfile(profile, meta = {}) {
    if (!this.profiles[profile]) return;
    if (this.currentProfile === profile && this._lastApplied === profile) return;

    this._targetProfile = profile;
    const cfg = this.profiles[profile];

    try {
      // DPR: use engine.setPixelRatio if available
      const base = this._basePixelRatio || Math.min((typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1, 1.5);
      const softwareRenderer = this.softwareRenderer || this.engine?.softwareRenderer;
      const targetDpr = softwareRenderer
        ? 0.5
        : Math.max(0.5, Math.min(base * cfg.dprClamp, base));
      if (this.engine && typeof this.engine.setPixelRatio === 'function') {
        try { this.engine.setPixelRatio(targetDpr); } catch (_) {}
      } else if (window?.WEBGL_RESOURCE_MANAGER && typeof window.WEBGL_RESOURCE_MANAGER.setPixelRatio === 'function') {
        try { window.WEBGL_RESOURCE_MANAGER.setPixelRatio(targetDpr); } catch (_) {}
      }
      if (this.engine && typeof this.engine.setRenderFpsCap === 'function') {
        try { this.engine.setRenderFpsCap(softwareRenderer ? Math.min(SOFTWARE_RENDER_FPS, cfg.renderFps) : cfg.renderFps); } catch (_) {}
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
        const particleFloor = softwareRenderer ? SOFTWARE_PARTICLE_FLOOR : HARDWARE_PARTICLE_FLOOR;
        const count = Math.max(particleFloor, Math.round(this._baseParticleCount * cfg.particleScale));
        window.dispatchEvent(new CustomEvent('adjustParticles', { detail: { count } }));
      } catch (_) {}

      // Sampling cadence changes how often GSAP writes frames, not how much
      // authored time elapses. Timelines keep their full duration and finish
      // at the same wall-clock boundary in every profile.
      try { gsap.ticker.fps(cfg.animationFps); } catch (_) {}

      // Lottie control
      try {
        if (this.lottie) {
          if (typeof this.lottie.setPerformanceProfile === 'function') {
            this.lottie.setPerformanceProfile(profile);
          } else if (typeof this.lottie.resumeAll === 'function') {
            this.lottie.resumeAll();
          }
        }
      } catch (_) {}

      // Profiles tune visual cost; they never mutate the operator's on/off
      // state or terminate an admitted effect family.
      try {
        const root = document.documentElement;
        root.style.setProperty('--fx-rgb-offset', `${cfg.overlays.rgbSplit}px`);
        root.style.setProperty('--fx-chromatic-opacity', String(0.7 * cfg.overlays.chromatic));
        root.style.setProperty('--fx-chromatic-blend', profile === 'low' ? 'normal' : 'screen');
        root.style.setProperty('--fx-scanline-opacity', String(cfg.overlays.scanlines));
        window.dispatchEvent(new CustomEvent('performance:visual-quality', {
          detail: { profile, overlays: { ...cfg.overlays } }
        }));
      } catch (_) {}

      this.currentProfile = profile;
      this._lastApplied = profile;
      this._resetTransition();

      // Persist last settled profile
      try { localStorage.setItem('3886_profile_last', profile); } catch (_) {}

      try {
        window.dispatchEvent(new CustomEvent('profile:changed', { detail: { profile, locked: !!this._lockProfile, ...meta } }));
        window.dispatchEvent(new CustomEvent('performanceModeChange', {
          detail: {
            mode: profile,
            profile,
            locked: !!this._lockProfile,
            ...meta
          }
        }));
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
