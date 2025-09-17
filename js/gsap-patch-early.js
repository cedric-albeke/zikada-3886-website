// Early GSAP Patching - Must load before any other modules that use GSAP
// This ensures ALL GSAP animations are tracked from the very beginning

import gsap from 'gsap';

// Global animation registry for early patching
class EarlyGSAPRegistry {
    constructor() {
        this.animations = new Map();
        this.animationCounter = 0;
        this.maxAnimations = 100; // Strict limit
        this.isPatched = false;
        
        console.log('🔧 Early GSAP Registry initializing...');
        this.patchGSAPMethods();
    }

    patchGSAPMethods() {
        if (gsap._3886_patched || this.isPatched) {
            console.log('⚠️ GSAP already patched, skipping early patch');
            return;
        }

        // Store original methods
        const originalTo = gsap.to;
        const originalFrom = gsap.from;
        const originalFromTo = gsap.fromTo;
        const originalTimeline = gsap.timeline;

        // Create cleanup function
        const cleanup = (tween) => {
            if (tween && tween.kill) {
                // Auto-kill after completion with delay
                const originalComplete = tween.vars.onComplete;
                tween.vars.onComplete = function() {
                    if (originalComplete) originalComplete.apply(this, arguments);
                    // Kill after 1 second to allow for cleanup
                    setTimeout(() => {
                        if (tween && tween.kill) tween.kill();
                    }, 1000);
                };
            }
        };

        // Patch gsap.to with aggressive cleanup
        gsap.to = (targets, vars = {}) => {
            // Enforce animation limits BEFORE creating
            if (this.animations.size >= this.maxAnimations) {
                console.warn('🚨 GSAP animation limit reached, killing oldest animations');
                this.killOldestAnimations(20);
            }
            
            const tween = originalTo.call(gsap, targets, vars);
            if (tween) {
                this.registerAnimation(tween);
                cleanup(tween);
            }
            return tween;
        };

        // Patch gsap.from
        gsap.from = (targets, vars = {}) => {
            if (this.animations.size >= this.maxAnimations) {
                this.killOldestAnimations(20);
            }
            
            const tween = originalFrom.call(gsap, targets, vars);
            if (tween) {
                this.registerAnimation(tween);
                cleanup(tween);
            }
            return tween;
        };

        // Patch gsap.fromTo
        gsap.fromTo = (targets, fromVars = {}, toVars = {}) => {
            if (this.animations.size >= this.maxAnimations) {
                this.killOldestAnimations(20);
            }
            
            const tween = originalFromTo.call(gsap, targets, fromVars, toVars);
            if (tween) {
                this.registerAnimation(tween);
                cleanup(tween);
            }
            return tween;
        };

        // Patch gsap.timeline
        gsap.timeline = (vars = {}) => {
            if (this.animations.size >= this.maxAnimations) {
                this.killOldestAnimations(10);
            }
            
            const timeline = originalTimeline.call(gsap, vars);
            if (timeline) {
                this.registerAnimation(timeline);
            }
            return timeline;
        };

        // Mark as patched
        gsap._3886_patched = true;
        this.isPatched = true;
        
        // Store originals for restoration if needed
        gsap._3886_originalMethods = {
            to: originalTo,
            from: originalFrom,
            fromTo: originalFromTo,
            timeline: originalTimeline
        };

        console.log('✅ Early GSAP patching complete - all animations will be tracked and limited');

        // Start aggressive cleanup timer
        this.startAggressiveCleanup();
    }

    registerAnimation(animation) {
        const id = ++this.animationCounter;
        this.animations.set(id, {
            animation: animation,
            createdAt: Date.now(),
            id: id
        });

        // Auto-cleanup after 30 seconds
        setTimeout(() => {
            this.killAnimation(id);
        }, 30000);
    }

    killAnimation(id) {
        const animData = this.animations.get(id);
        if (animData && animData.animation && animData.animation.kill) {
            try {
                animData.animation.kill();
            } catch (e) {
                // Silent fail
            }
            this.animations.delete(id);
        }
    }

    killOldestAnimations(count = 10) {
        const sortedAnims = Array.from(this.animations.entries())
            .sort((a, b) => a[1].createdAt - b[1].createdAt)
            .slice(0, count);

        sortedAnims.forEach(([id]) => {
            this.killAnimation(id);
        });

        console.log(`🗑️ Early cleanup: killed ${sortedAnims.length} oldest animations`);
    }

    startAggressiveCleanup() {
        setInterval(() => {
            if (this.animations.size > 50) {
                this.killOldestAnimations(20);
                console.log(`🧹 Aggressive cleanup: ${this.animations.size} animations remaining`);
            }
        }, 5000); // Every 5 seconds
    }

    getStats() {
        return {
            totalAnimations: this.animations.size,
            maxAnimations: this.maxAnimations,
            isPatched: this.isPatched
        };
    }

    emergencyStop() {
        console.log('🚨 Early GSAP Registry Emergency Stop');
        gsap.killTweensOf('*');
        this.animations.clear();
    }
}

// Create and apply early patching immediately
const earlyGSAPRegistry = new EarlyGSAPRegistry();

// Make it globally available
window.earlyGSAPRegistry = earlyGSAPRegistry;

// Export for module usage
export default earlyGSAPRegistry;