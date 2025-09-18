export const chaosApi = {
  // Basic scene switch entrypoints used by VJ Receiver
  changeScene(scene) {
    try {
      if (typeof window.chaosInit?.[`phase${capitalize(scene)}`] === 'function') {
        window.chaosInit[`phase${capitalize(scene)}`]();
        return true;
      }
      // Fallback: dispatch a phase event for any listeners
      window.dispatchEvent(new CustomEvent('animationPhase', { detail: { phase: scene } }));
      return true;
    } catch (e) {
      console.warn('chaosApi.changeScene failed:', e);
      return false;
    }
  }
};

function capitalize(s) { return (s || '').charAt(0).toUpperCase() + (s || '').slice(1); }

window.chaosApi = chaosApi;
export default chaosApi;
