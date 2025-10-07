// InitGuard: once/bindOnce/listen helpers (HMR resilient)
const _cache = new Map();
const _listeners = new Set();

export function once(key, fn) {
  if (_cache.has(key)) return _cache.get(key);
  const marker = 'init_' + key;
  if (typeof document !== 'undefined' && document.body?.dataset) {
    if (document.body.dataset[marker]) return _cache.get(key);
  }
  const val = fn();
  _cache.set(key, val);
  if (typeof document !== 'undefined' && document.body?.dataset) document.body.dataset[marker] = '1';
  return val;
}

export function bindOnce(el, key, fn) {
  const dataKey = 'initKey_' + key;
  if (!el || !el.dataset) { fn(el); return; }
  if (el.dataset[dataKey]) return;
  fn(el);
  el.dataset[dataKey] = '1';
}

export function listen(target, type, handler, options) {
  const ctrl = new AbortController();
  target.addEventListener(type, handler, { ...(options||{}), signal: ctrl.signal });
  _listeners.add(ctrl);
  return () => { try { ctrl.abort(); } catch(_){} _listeners.delete(ctrl); };
}

export function abortAll() {
  for (const ctrl of Array.from(_listeners)) { try { ctrl.abort(); } catch(_){} _listeners.delete(ctrl); }
}