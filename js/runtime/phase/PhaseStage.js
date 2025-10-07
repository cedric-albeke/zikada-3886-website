// PhaseStage: dual-slot crossfade stage using CSS transitions
let _stage;
let _active = 'A';

function ensureStyle() {
  if (document.getElementById('phase-stage-style')) return;
  const s = document.createElement('style');
  s.id = 'phase-stage-style';
  s.textContent = `
    :root { --phase-xfade-ms: 450; --phase-xfade-ease: cubic-bezier(0.2,0,0,1); }
    #phase-stage { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; }
    #phase-stage .slot { position: absolute; inset: 0; opacity: 0; transition: opacity calc(var(--phase-xfade-ms) * 1ms) var(--phase-xfade-ease); will-change: opacity; }
    #phase-stage .slot.active { opacity: 1; }
  `;
  document.head.appendChild(s);
}

export function mountPhaseStage() {
  ensureStyle();
  if (!_stage) {
    _stage = document.createElement('div');
    _stage.id = 'phase-stage';
    const a = document.createElement('div'); a.dataset.slot = 'A'; a.className = 'slot active';
    const b = document.createElement('div'); b.dataset.slot = 'B'; b.className = 'slot';
    _stage.appendChild(a); _stage.appendChild(b);
    document.body.appendChild(_stage);
  }
  return _stage;
}

function getSlots() {
  const a = _stage.querySelector('[data-slot="A"]');
  const b = _stage.querySelector('[data-slot="B"]');
  return { a, b };
}

export async function crossfade({ prev, next, signal, mountNext, ready }) {
  mountPhaseStage();
  const { a, b } = getSlots();
  const from = _active === 'A' ? a : b;
  const to = _active === 'A' ? b : a;
  to.innerHTML = '';
  if (mountNext) await mountNext(to, signal);
  if (ready) await ready(to, signal);
  const done = new Promise((resolve) => {
    let count = 0;
    function onEnd(e) { if (e.target === from || e.target === to) { count += 1; if (count === 2) resolve(); } }
    from.addEventListener('transitionend', onEnd, { once: true });
    to.addEventListener('transitionend', onEnd, { once: true });
  });
  from.classList.remove('active');
  to.classList.add('active');
  if (!signal?.aborted) await Promise.race([done, new Promise((r)=>setTimeout(r, 600))]);
  from.innerHTML = '';
  _active = _active === 'A' ? 'B' : 'A';
}

export function installPhaseTransition(controller, registry) {
  controller.setTransitionExecutor(async ({ prev, next, signal }) => {
    const def = registry.get(next);
    if (!def) throw new Error('Unknown phase ' + next);
    await crossfade({ prev, next, signal, mountNext: def.mount, ready: def.onReady });
  });
}