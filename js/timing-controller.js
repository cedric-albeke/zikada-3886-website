import gsap from 'gsap';

class TimingController {
    constructor() {
        this.masterTimeline = gsap.timeline({ repeat: -1 });
        this.animationSpeed = 1;
        this.intervals = new Map();
        this.timeouts = new Map();
    }

    init() {
        // Create a master timeline that controls overall pacing
        this.setupMasterTimeline();
        this.syncAnimationSpeeds();
    }

    setupMasterTimeline() {
        // Define coordinated timing phases
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
        // Sync all GSAP animations to a unified time scale
        gsap.globalTimeline.timeScale(this.animationSpeed);
    }

    setGlobalSpeed(speed) {
        this.animationSpeed = speed;
        gsap.globalTimeline.timeScale(speed);
    }

    // Centralized interval management for better performance
    addInterval(id, callback, delay) {
        if (this.intervals.has(id)) {
            clearInterval(this.intervals.get(id));
        }
        this.intervals.set(id, setInterval(callback, delay));
    }

    addTimeout(id, callback, delay) {
        if (this.timeouts.has(id)) {
            clearTimeout(this.timeouts.get(id));
        }
        this.timeouts.set(id, setTimeout(callback, delay));
    }

    clearInterval(id) {
        if (this.intervals.has(id)) {
            clearInterval(this.intervals.get(id));
            this.intervals.delete(id);
        }
    }

    clearTimeout(id) {
        if (this.timeouts.has(id)) {
            clearTimeout(this.timeouts.get(id));
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

    // Reduce number of simultaneous animations for performance
    throttleAnimations() {
        const activeAnimations = gsap.getTweensOf('*');
        if (activeAnimations.length > 30) {
            // Kill older, less important animations
            activeAnimations
                .filter(tween => !tween.data || tween.data.priority !== 'high')
                .slice(0, 10)
                .forEach(tween => tween.kill());
        }
    }

    destroy() {
        this.masterTimeline.kill();
        this.intervals.forEach(interval => clearInterval(interval));
        this.timeouts.forEach(timeout => clearTimeout(timeout));
        this.intervals.clear();
        this.timeouts.clear();
    }
}

export default new TimingController();