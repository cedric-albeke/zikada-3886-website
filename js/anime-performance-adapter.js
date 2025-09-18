import animeManager from './anime-init.js';

function applyMode(mode) {
  const a = animeManager.anime;
  switch (mode) {
    case 'normal':
      a.speed = 1.0;
      animeManager.playAll();
      break;
    case 'reduced':
      a.speed = 0.7;
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

window.addEventListener('performanceMode', onModeEvent);

// Optional hooks if your optimizer exposes them
try {
  if (window.PerformanceOptimizer?.on) {
    window.PerformanceOptimizer.on('modechange', ({ mode }) => applyMode(mode));
    window.PerformanceOptimizer.on('pause', () => animeManager.pauseAll());
    window.PerformanceOptimizer.on('resume', () => animeManager.playAll());
  }
} catch (_) {}

window.animePerfAdapter = { applyMode };

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.removeEventListener('performanceMode', onModeEvent);
  });
}