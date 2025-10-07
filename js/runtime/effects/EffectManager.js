// EffectManager: register long-lived loops and enforce budgets
const _effects = new Map();
let _nextId = 1;

export function register(start) {
  const id = _nextId++;
  let stopped = false;
  const local = { raf: null, interval: null, timeouts: new Set(), nodesProduced: 0, container: null };
  function loop(fn) {
    function tick(){ if (stopped) return; try { fn(); } catch(_){} local.raf = requestAnimationFrame(tick); }
    local.raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(local.raf);
  }
  function every(ms, fn) { local.interval = setInterval(()=>{ if(!stopped) try{fn();}catch(_){} }, ms); return () => clearInterval(local.interval); }
  function timeout(ms, fn) { const t = setTimeout(()=>{ local.timeouts.delete(t); if(!stopped) try{fn();}catch(_){} }, ms); local.timeouts.add(t); return () => { clearTimeout(t); local.timeouts.delete(t); }; }
  const stop = () => { stopped = true; if (local.raf) cancelAnimationFrame(local.raf); if (local.interval) clearInterval(local.interval); for (const t of local.timeouts) clearTimeout(t); };
  const ctx = { loop, every, timeout, setContainer(c){local.container=c;}, addNodesProduced(n){local.nodesProduced+=Number(n)||0;} };
  const cleanup = start(ctx);
  _effects.set(id, { stop: () => { try { cleanup && cleanup(); } catch(_){} stop(); }, meta: local });
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