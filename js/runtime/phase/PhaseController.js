// PhaseController: minimal finite-state machine with lifecycle hooks and cancellation
export class PhaseController {
  constructor() {
    this.currentPhase = null;
    this.previousPhase = null;
    this.isTransitioning = false;
    this._abort = null;
    this._hooks = {
      before: new Set(),
      after: new Set(),
      error: new Set(),
      willLeave: new Set(),
      didLeave: new Set(),
      willEnter: new Set(),
      didEnter: new Set(),
    };
    this._exec = null; // transition executor installed by PhaseStage or app
  }
  setTransitionExecutor(fn) { this._exec = fn; }
  on(hook, cb) { this._hooks[hook]?.add(cb); return () => this._hooks[hook]?.delete(cb); }
  onBeforeChange(cb) { return this.on('before', cb); }
  onAfterChange(cb) { return this.on('after', cb); }
  onError(cb) { return this.on('error', cb); }
  async setPhase(next, opts = {}) {
    if (this.currentPhase === next && !opts.force) return;
    if (this.isTransitioning) { try { this._abort?.abort(); } catch (_) {} }
    this.isTransitioning = true;
    this._abort = new AbortController();
    const signal = this._abort.signal;
    const prev = this.currentPhase;
    try {
      this._emit('before', { prev, next });
      if (prev) this._emit('willLeave', { prev, next, signal });
      this._emit('willEnter', { prev, next, signal });
      if (!this._exec) throw new Error('No transition executor configured');
      await this._exec({ prev, next, signal });
      this.previousPhase = prev;
      this.currentPhase = next;
      if (prev) this._emit('didLeave', { prev, next });
      this._emit('didEnter', { prev, next });
      this._emit('after', { prev, next });
    } catch (err) {
      if (!signal.aborted) this._emit('error', err);
    } finally {
      this.isTransitioning = false;
      this._abort = null;
    }
  }
  _emit(hook, payload) {
    for (const cb of this._hooks[hook] || []) {
      try { cb(payload); } catch (e) { console.warn('PhaseController hook error', e); }
    }
  }
}

let _singleton;
export function getPhaseController() {
  if (!_singleton) _singleton = new PhaseController();
  return _singleton;
}