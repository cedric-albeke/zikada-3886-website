// EffectManager: register long-lived loops and enforce budgets
import animationRuntime from '../animation-runtime.js';

const _effects = new Map();
let _nextId = 1;

export function register(start) {
  const id = _nextId++;
  const owner = `effect-manager:${id}`;
  let stopped = false;
  const local = { owner, nodesProduced: 0, container: null };
  function loop(fn) {
    const token = animationRuntime.scheduleRafLoop(owner, () => {
      if (!stopped) fn();
    });
    return () => token.clear();
  }
  function every(ms, fn) {
    const token = animationRuntime.scheduleInterval(owner, () => {
      if (!stopped) fn();
    }, ms);
    return () => token.clear();
  }
  function timeout(ms, fn) {
    const token = animationRuntime.scheduleTimeout(owner, () => {
      if (!stopped) fn();
    }, ms);
    return () => token.clear();
  }
  const ctx = { loop, every, timeout, setContainer(c){local.container=c;}, addNodesProduced(n){local.nodesProduced+=Number(n)||0;} };
  const cleanup = start(ctx);
  const stop = () => {
    if (stopped) return;
    stopped = true;
    try { cleanup && cleanup(); } catch(_){}
    animationRuntime.disposeOwner(owner);
    _effects.delete(id);
  };
  _effects.set(id, { stop, meta: local });
  return { id, stop: _effects.get(id).stop };
}

export function stopAll() { for (const e of _effects.values()) { try { e.stop(); } catch(_){} } _effects.clear(); }

export function enforceBudget(container, maxNodes, onBreach){
  const obs = new MutationObserver(()=>{
    try {
      const count = container.querySelectorAll('*').length;
      if (count > maxNodes) onBreach?.({ count, maxNodes });
    } catch(_){}
  });
  obs.observe(container, { childList: true, subtree: true });
  return () => obs.disconnect();
}
