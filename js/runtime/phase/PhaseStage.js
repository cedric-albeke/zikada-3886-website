/**
 * PhaseStage - Smooth dual-slot cross-fade system for scene transitions
 * 
 * Replaces jarring blackout transitions with smooth cross-fades using
 * two alternating slots (A/B) with GPU-accelerated opacity transitions.
 */

// Legacy compatibility exports for existing code
let _stage;
let _active = 'A';

function ensureStyle() {
  // No longer needed - styles are in transitions-and-overlays.css
  return;
}

class PhaseStage {
    constructor() {
        this.root = this.ensureRoot();
        this.slots = { A: this.createSlot('A'), B: this.createSlot('B') };
        this.active = 'A';
        this.transitioning = false;
        this.queue = Promise.resolve();
        this.abortController = null;
        
        // Performance monitoring
        this.transitionCount = 0;
        this.lastFallbackTime = 0;
        
        console.log('🎬 PhaseStage initialized with dual-slot cross-fade system');
    }

    ensureRoot() {
        let el = document.getElementById('phase-stage');
        if (!el) {
            el = document.createElement('div');
            el.id = 'phase-stage';
            document.body.appendChild(el);
        }
        return el;
    }

    createSlot(name) {
        const el = document.createElement('div');
        el.className = 'phase-slot';
        el.dataset.slot = name;
        this.root.appendChild(el);
        return { el, name };
    }

    getActiveSlot() {
        return this.slots[this.active];
    }

    getInactiveSlot() {
        return this.slots[this.active === 'A' ? 'B' : 'A'];
    }
}

// Legacy compatibility function
export function mountPhaseStage() {
  ensureStyle();
  if (!_stage) {
    _stage = document.createElement('div');
    _stage.id = 'phase-stage';
    const a = document.createElement('div'); a.dataset.slot = 'A'; a.className = 'phase-slot active';
    const b = document.createElement('div'); b.dataset.slot = 'B'; b.className = 'phase-slot';
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

// Add the main crossFade method to PhaseStage class
PhaseStage.prototype.crossFade = async function(opts = {}) {
    const run = async () => {
        if (this.transitioning) {
            await this.queue;
        }
        
        this.transitioning = true;
        this.transitionCount++;
        
        const { 
            nextPhase, 
            prepare, 
            cleanupPrev, 
            timings = {}, 
            easing = {}, 
            signal 
        } = opts;
        
        const outMs = timings.outMs ?? this.getTimingFromCSS('--phase-xfade-out-ms', 320);
        const inMs = timings.inMs ?? this.getTimingFromCSS('--phase-xfade-in-ms', 380);

        if (this.abortController) {
            this.abortController.abort();
        }
        this.abortController = new AbortController();
        const acSignal = this.abortController.signal;
        const aborted = () => (signal?.aborted || acSignal.aborted);

        try {
            if (this.shouldUseFallback()) {
                console.log('🔄 Using performance fallback for transition');
                await this.quickFade(nextPhase, cleanupPrev);
                return;
            }

            const activeSlot = this.getActiveSlot();
            const nextSlot = this.getInactiveSlot();
            
            nextSlot.el.classList.remove('active', 'fade-out');
            nextSlot.el.style.opacity = '0';

            try {
                if (prepare) {
                    await prepare(nextSlot.el, acSignal);
                }
            } catch (error) {
                console.warn('Phase preparation failed:', error);
            }

            if (aborted()) return;

            if (nextPhase) {
                await nextPhase(nextSlot.el, acSignal);
            }

            if (aborted()) return;

            console.log(`🎬 Cross-fading: ${activeSlot.name} → ${nextSlot.name} (${outMs}ms/${inMs}ms)`);
            console.log('🔍 Active slot opacity before:', window.getComputedStyle(activeSlot.el).opacity);
            console.log('🔍 Next slot opacity before:', window.getComputedStyle(nextSlot.el).opacity);

            nextSlot.el.classList.add('active');
            activeSlot.el.classList.add('fade-out');
            
            console.log('🔍 Active slot classes after:', activeSlot.el.className);
            console.log('🔍 Next slot classes after:', nextSlot.el.className);

            await Promise.all([
                this.wait(inMs),
                this.wait(outMs),
            ]);

            if (aborted()) return;

            console.log('🔍 Final slot opacities - Active:', window.getComputedStyle(activeSlot.el).opacity, 'Next:', window.getComputedStyle(nextSlot.el).opacity);
            
            activeSlot.el.classList.remove('active', 'fade-out');
            this.active = nextSlot.name;

            try {
                if (cleanupPrev) {
                    console.log('🧹 Running custom cleanup...');
                    await cleanupPrev(activeSlot.el);
                } else {
                    console.log('🧹 Running default cleanup...');
                    const gsap = window.gsap;
                    if (gsap) {
                        gsap.killTweensOf(activeSlot.el.querySelectorAll('*'));
                    }
                    activeSlot.el.innerHTML = '';
                }
            } catch (error) {
                console.warn('Phase cleanup failed:', error);
                activeSlot.el.innerHTML = '';
            }

            console.log(`✅ Cross-fade complete: ${nextSlot.name} is now active`);
            console.log('🔍 Phase stage DOM:', document.getElementById('phase-stage')?.innerHTML.substring(0, 100) + '...');

        } catch (error) {
            console.error('Cross-fade error:', error);
            await this.quickFade(nextPhase, cleanupPrev);
        } finally {
            this.transitioning = false;
        }
    };

    this.queue = this.queue.then(run).catch((error) => {
        console.error('Transition queue error:', error);
        this.transitioning = false;
    });
    
    return this.queue;
};

// Add helper methods to PhaseStage
PhaseStage.prototype.shouldUseFallback = function() {
    try {
        const fps = window.safePerformanceMonitor?.metrics?.fps ?? 60;
        const dom = document.querySelectorAll('*').length;
        
        // More lenient thresholds - only fallback for severe performance issues
        const shouldFallback = fps < 10 || dom > 25000;
        
        if (shouldFallback) {
            console.log(`🔄 Performance fallback triggered - FPS: ${fps}, DOM: ${dom}`);
            this.lastFallbackTime = Date.now();
        }
        
        return shouldFallback;
    } catch {
        return false;
    }
};

PhaseStage.prototype.quickFade = async function(nextPhase, cleanupPrev) {
    console.log('🔄 Executing NO-FLASH quick-fade fallback');
    
    // FIXED: Use minimal visual disruption - no grey overlay at all
    // Just a quick pause and immediate execution
    try {
        // Very brief pause to let current animations settle
        await this.wait(50);
        
        if (nextPhase) {
            await nextPhase();
        }
        
        // Another brief pause before cleanup
        await this.wait(50);
        
        if (cleanupPrev) {
            await cleanupPrev();
        }
    } catch (error) {
        console.error('Quick fade execution failed:', error);
    }
    
    console.log('✅ No-flash quick-fade completed');
};

PhaseStage.prototype.getTimingFromCSS = function(property, fallback) {
    try {
        const value = getComputedStyle(document.documentElement)
            .getPropertyValue(property)
            .trim();
        
        if (value && value !== '') {
            return parseInt(value) || fallback;
        }
    } catch {}
    
    return fallback;
};

PhaseStage.prototype.wait = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

PhaseStage.prototype.cancel = function() {
    if (this.abortController) {
        this.abortController.abort();
        console.log('🛑 PhaseStage transition cancelled');
    }
};

// Legacy compatibility function - updated to use new PhaseStage
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
  if (!signal?.aborted) await Promise.race([done, new Promise((r)=>setTimeout(r, 1600))]);
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

// Export the main PhaseStage class as default
export default PhaseStage;
