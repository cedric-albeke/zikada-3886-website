import '@lottiefiles/lottie-player';

// Lottie Effect Loader
// Looks for /lotties/manifest.json with entries: [{ id, src, loop=true, autoplay=false, speed=1.0, style }]
// Registers handlers with fxController under keys 'lottie:<id>'

import fxController from './fx-controller.js';

async function fetchManifest() {
  try {
    const res = await fetch('/lotties/manifest.json', { cache: 'no-cache' });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : (Array.isArray(json?.effects) ? json.effects : []);
  } catch (e) {
    console.warn('Lottie manifest not found (optional):', e?.message || e);
    return [];
  }
}

function createPlayer(entry) {
  const isDotLottie = typeof entry.src === 'string' && entry.src.toLowerCase().endsWith('.lottie');
  const tag = isDotLottie ? 'dotlottie-player' : 'lottie-player';
  const player = document.createElement(tag);

  // Common attributes
  player.setAttribute('mode', 'normal');
  player.setAttribute('background', 'transparent');
  player.setAttribute('loop', String(entry.loop ?? true));
  player.setAttribute('autoplay', '');
  player.setAttribute('src', entry.src);

  // Speed handling (supported by both players; ignore if not supported)
  const spd = String(entry.speed ?? 1);
  try { player.setAttribute('speed', spd); } catch {}

  const z = (entry.z ?? entry.tune?.z ?? 5);
  const blend = (entry.blend ?? entry.tune?.blend ?? entry.tune?.blendMode ?? 'screen');
  const baseStyle = `position: fixed; inset: 0; pointer-events: none; will-change: opacity, transform; contain: layout paint size; mix-blend-mode: ${blend}; z-index: ${z}; opacity: 0; transform: scale(0.97);`;
  player.style.cssText = entry.style || baseStyle;

  // Basic error logging to help diagnose missing assets
  player.addEventListener('error', (e) => {
    console.warn('Lottie player error for', entry.id, entry.src, e?.detail || e);
  });

  return player;
}

function applyTuning(player, entry) {
  try {
    if (entry.speed || entry.tune?.speed) player.setAttribute('speed', String(entry.tune?.speed ?? entry.speed));
    // Opacity target stored for entrance animation
    player.dataset.targetOpacity = String(entry.tune?.opacity ?? entry.opacity ?? 0.6);

    // Ensure base anim properties exist even when entry.style is provided
    player.style.willChange = player.style.willChange || 'opacity, transform';
    const currentTransform = player.style.transform || 'none';
    if (!currentTransform || currentTransform === 'none') {
      player.style.transform = 'scale(0.97)';
    }
    if (!player.style.opacity) {
      player.style.opacity = '0';
    }
    // Blend and z-index from tuning if not already set via style
    const t = entry.tune || {};
    if (t.blend && !player.style.mixBlendMode) player.style.mixBlendMode = t.blend;
    if (typeof t.z !== 'undefined' && !player.style.zIndex) player.style.zIndex = String(t.z);

    // Optional size/region tuning: width/height + top/left
    if (t.width) player.style.width = t.width;
    if (t.height) player.style.height = t.height;
    if (t.top) player.style.top = t.top;
    if (t.left) player.style.left = t.left;
    if (t.right) player.style.right = t.right;
    if (t.bottom) player.style.bottom = t.bottom;
  } catch {}
}

async function init() {
  const manifest = await fetchManifest();
  if (!manifest.length) return;

  const root = document.getElementById('fx-root') || document.body;
  window.lottieEffects = window.lottieEffects || {};

  // Pause/resume players on tab visibility change
  document.addEventListener('visibilitychange', () => {
    const hidden = document.hidden;
    Object.values(window.lottieEffects).forEach((el) => {
      try {
        if (hidden) el.pause(); else el.play();
      } catch {}
    });
  });

  function dynamicSpeed(base) {
    try {
      const fps = (window.performanceBus?.metrics?.fps) ?? 60;
      if (fps < 20) return Math.max(0.6, base * 0.7);
      if (fps < 30) return Math.max(0.75, base * 0.85);
      return base;
    } catch { return base; }
  }

  for (const entry of manifest) {
    if (!entry?.id || !entry?.src) { console.warn('Skipping invalid lottie manifest entry', entry); continue; }
    const key = `lottie:${entry.id}`;
    fxController.registerEffect(key, {
      enable: () => {
        try {
          if (window.lottieEffects[entry.id]) return;
          const el = createPlayer(entry);
          applyTuning(el, entry);
          // Entrance animation (fade+scale)
          root.appendChild(el);
          requestAnimationFrame(() => {
            el.style.transition = 'opacity 320ms ease, transform 320ms ease';
            el.style.opacity = String(el.dataset.targetOpacity ?? '0.6');
            el.style.transform = 'scale(1)';
          });
          // Performance-aware speed adjustment (no-op if attribute unsupported)
          const baseSpeed = Number(el.getAttribute('speed') || '1');
          try { el.setAttribute('speed', String(dynamicSpeed(baseSpeed))); } catch {}
          window.lottieEffects[entry.id] = el;
        } catch (e) { console.warn('Lottie enable failed', entry.id, e); }
      },
      disable: () => {
        try {
          const el = window.lottieEffects[entry.id];
          if (!el) return;
          el.style.transition = 'opacity 220ms ease, transform 220ms ease';
          el.style.opacity = '0';
          el.style.transform = 'scale(0.98)';
          setTimeout(() => { try { el.remove(); } catch {} }, 240);
          delete window.lottieEffects[entry.id];
        } catch (e) { console.warn('Lottie disable failed', entry.id, e); }
      }
    });
  }
}

init();
