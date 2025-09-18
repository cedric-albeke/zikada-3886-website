import anime from 'animejs/lib/anime.es.js';

const registry = new Set();

const animeManager = {
  anime,
  instances: registry,
  register(instance, opts = {}) {
    if (!instance) return instance;
    instance.__meta = { critical: false, label: undefined, ...opts };
    registry.add(instance);
    if (instance.finished && typeof instance.finished.then === 'function') {
      instance.finished.finally(() => registry.delete(instance));
    }
    return instance;
  },
  pauseAll(filter) {
    registry.forEach(i => {
      if (filter && !filter(i)) return;
      try { i.pause(); } catch (_) {}
    });
  },
  playAll(filter) {
    registry.forEach(i => {
      if (filter && !filter(i)) return;
      try { i.play(); } catch (_) {}
    });
  },
  setSpeed(mult) {
    anime.speed = mult;
  },
  killAll() {
    registry.forEach(i => {
      try { i.pause(); } catch (_) {}
    });
    registry.clear();
  }
};

anime.suspendWhenDocumentHidden = true;

window.animeManager = animeManager;
export default animeManager;

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    animeManager.killAll();
  });
}