// Teardown registry for HMR
const _disposers = new Set();
export function registerDisposer(fn) { _disposers.add(fn); return () => _disposers.delete(fn); }
export function teardownAll() {
  for (const d of Array.from(_disposers)) {
    try { d(); } catch (e) { console.warn('teardown error', e); }
    _disposers.delete(d);
  }
}