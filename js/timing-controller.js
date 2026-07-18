import gsap from 'gsap';
import animationRuntime from './runtime/animation-runtime.js';

const RUNTIME_OWNER = 'timing-controller';

class TimingController {
    constructor() {
        this.masterTimeline = null;
        this.animationSpeed = 1;
        this.intervals = new Map();
        this.timeouts = new Map();
    }

    init() {
        if (this.masterTimeline) return;
        // Create a master timeline that controls overall pacing
        this.setupMasterTimeline();
    }

    setupMasterTimeline() {
        // Define coordinated timing phases
        this.masterTimeline = gsap.timeline({ repeat: -1 });
        animationRuntime.trackAnimation(RUNTIME_OWNER, this.masterTimeline);
        this.masterTimeline
            .to({}, { duration: 10, onStart: () => this.phase('calm') })
            .to({}, { duration: 8, onStart: () => this.phase('buildup') })
            .to({}, { duration: 5, onStart: () => this.phase('intense') })
            .to({}, { duration: 12, onStart: () => this.phase('cooldown') });
    }

    phase(phaseName) {
        // Emit phase change to all animation components
        window.dispatchEvent(new CustomEvent('animationPhase', { detail: { phase: phaseName } }));
    }

    syncAnimationSpeeds() {
        // Compatibility hook only. Global timeScale changes rewrite authored
        // effect durations and can make unrelated triggers end prematurely.
        return this.animationSpeed;
    }

    setGlobalSpeed(speed) {
        this.animationSpeed = speed;
        window.dispatchEvent(new CustomEvent('animation:pacing', {
            detail: { multiplier: speed }
        }));
    }

    // Centralized interval management for better performance
    addInterval(id, callback, delay) {
        if (this.intervals.has(id)) {
            this.intervals.get(id).clear();
        }
        this.intervals.set(id, animationRuntime.scheduleInterval(
            `${RUNTIME_OWNER}:interval:${id}`,
            callback,
            delay
        ));
    }

    addTimeout(id, callback, delay) {
        if (this.timeouts.has(id)) {
            this.timeouts.get(id).clear();
        }
        const token = animationRuntime.scheduleTimeout(
            `${RUNTIME_OWNER}:timeout:${id}`,
            () => {
                this.timeouts.delete(id);
                callback();
            },
            delay
        );
        this.timeouts.set(id, token);
    }

    clearInterval(id) {
        if (this.intervals.has(id)) {
            this.intervals.get(id).clear();
            this.intervals.delete(id);
        }
    }

    clearTimeout(id) {
        if (this.timeouts.has(id)) {
            this.timeouts.get(id).clear();
            this.timeouts.delete(id);
        }
    }

    // Optimize by batching DOM reads/writes
    batchAnimations(animations) {
        gsap.set(animations.map(a => a.element), {
            willChange: 'transform, opacity'
        });

        animations.forEach(anim => {
            gsap.to(anim.element, {
                ...anim.properties,
                duration: anim.duration * (1 / this.animationSpeed),
                ease: anim.ease || 'power2.inOut'
            });
        });

        // Clean up will-change after animations
        gsap.delayedCall(Math.max(...animations.map(a => a.duration)) + 1, () => {
            gsap.set(animations.map(a => a.element), { willChange: 'auto' });
        });
    }

    // Compatibility telemetry only. Killing arbitrary tweens under load hides
    // the bottleneck and truncates authored animation lifetimes.
    throttleAnimations() {
        const activeAnimations = gsap.getTweensOf('*');
        window.dispatchEvent(new CustomEvent('animation:capacity-pressure', {
            detail: { source: RUNTIME_OWNER, activeTweens: activeAnimations.length }
        }));
        return activeAnimations.length;
    }

    destroy() {
        animationRuntime.disposeOwner(RUNTIME_OWNER);
        this.intervals.forEach(interval => interval.clear());
        this.timeouts.forEach(timeout => timeout.clear());
        this.intervals.clear();
        this.timeouts.clear();
        this.masterTimeline = null;
    }
}

export default new TimingController();
