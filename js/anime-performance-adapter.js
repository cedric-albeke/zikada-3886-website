import animeManager from './anime-init.js';

const NORMALIZED_MAP = {
  emergency: 'emergency',
  reduced: 'reduced',
  normal: 'normal',
  low: 'emergency',
  medium: 'reduced',
  high: 'normal',
  auto: 'normal'
};

function normalizeMode(raw) {
  if (!raw) return 'normal';
  const key = String(raw).toLowerCase();
  return NORMALIZED_MAP[key] || 'normal';
}

function applyMode(rawMode) {
  const mode = normalizeMode(rawMode);
  const a = animeManager.anime;

  switch (mode) {
    case 'normal':
      a.speed = 1.0;
      animeManager.playAll();
      break;
    case 'reduced':
      a.speed = 0.75;
      animeManager.pauseAll(inst => !inst.__meta?.critical);
      animeManager.playAll(inst => inst.__meta?.critical);
      break;
    case 'emergency':
      a.speed = 0.5;
      animeManager.pauseAll(inst => !inst.__meta?.critical);
      break;
    default:
      break;
  }
}

function onModeEvent(e) {
  const mode = e?.detail?.mode ?? e?.detail;
  if (mode) applyMode(mode);
}

const EVENT_NAMES = ['performanceMode', 'performanceModeChange'];
EVENT_NAMES.forEach(eventName => window.addEventListener(eventName, onModeEvent));

// Optional hooks if your optimizer exposes them
try {
  if (window.PerformanceOptimizer?.on) {
    window.PerformanceOptimizer.on('modechange', ({ mode }) => applyMode(mode));
    window.PerformanceOptimizer.on('pause', () => animeManager.pauseAll());
    window.PerformanceOptimizer.on('resume', () => animeManager.playAll());
  }
} catch (_) {}

window.animePerfAdapter = { applyMode, normalizeMode };

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    EVENT_NAMES.forEach(eventName => window.removeEventListener(eventName, onModeEvent));
  });
}
