// PhaseRegistry: simple registry of phases
const _map = new Map();
let _minVisibleMs = 300;
let _lastEnterAt = 0;

export function setMinVisibleMs(v) { _minVisibleMs = Number(v) || 300; }
export function registerPhase(name, def) { _map.set(name, def); }
export function getPhaseDef(name) { return _map.get(name); }
export function getRegistry() { return _map; }
export function markEntered() { _lastEnterAt = performance.now(); }
export async function readyGuard(readyFn, signal) {
  const start = performance.now();
  if (readyFn) await readyFn();
  const sinceEnter = performance.now() - _lastEnterAt;
  const wait = Math.max(0, _minVisibleMs - sinceEnter);
  if (!signal?.aborted && wait > 0) await new Promise((r) => setTimeout(r, wait));
}