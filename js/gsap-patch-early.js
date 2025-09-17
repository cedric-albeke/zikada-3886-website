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

        // Create smart cleanup function that preserves essential animations
        const smartCleanup = (tween, vars) => {
            if (!tween || !tween.kill) return;
            
            // Check if this is an essential animation that should run forever
            const isEssential = this.isEssentialAnimation(tween, vars);
            
            if (!isEssential) {
                // Only auto-kill temporary animations
                const originalComplete = vars.onComplete;
                vars.onComplete = function() {
                    if (originalComplete) originalComplete.apply(this, arguments);
                    // Kill temporary animations after completion
                    setTimeout(() => {
                        if (tween && tween.kill) tween.kill();
                    }, 1000);
                };
            } else {
                console.log('🛡️ Protecting essential animation from auto-cleanup');
            }
        };

        // Patch gsap.to with smart cleanup
        gsap.to = (targets, vars = {}) => {
            // Only enforce limits for non-essential animations
            if (!this.isEssentialAnimation(null, vars) && this.animations.size >= this.maxAnimations) {
                console.warn('🚨 GSAP animation limit reached, killing oldest non-essential animations');
                this.killOldestNonEssentialAnimations(20);
            }
            
            const tween = originalTo.call(gsap, targets, vars);
            if (tween) {
                this.registerAnimation(tween, vars);
                smartCleanup(tween, vars);
            }
            return tween;
        };

        // Patch gsap.from
        gsap.from = (targets, vars = {}) => {
            if (!this.isEssentialAnimation(null, vars) && this.animations.size >= this.maxAnimations) {
                this.killOldestNonEssentialAnimations(20);
            }
            
            const tween = originalFrom.call(gsap, targets, vars);
            if (tween) {
                this.registerAnimation(tween, vars);
                smartCleanup(tween, vars);
            }
            return tween;
        };

        // Patch gsap.fromTo
        gsap.fromTo = (targets, fromVars = {}, toVars = {}) => {
            if (!this.isEssentialAnimation(null, toVars) && this.animations.size >= this.maxAnimations) {
                this.killOldestNonEssentialAnimations(20);
            }
            
            const tween = originalFromTo.call(gsap, targets, fromVars, toVars);
            if (tween) {
                this.registerAnimation(tween, toVars);
                smartCleanup(tween, toVars);
            }
            return tween;
        };

        // Patch gsap.timeline
        gsap.timeline = (vars = {}) => {
            if (!this.isEssentialAnimation(null, vars) && this.animations.size >= this.maxAnimations) {
                this.killOldestNonEssentialAnimations(10);
            }
            
            const timeline = originalTimeline.call(gsap, vars);
            if (timeline) {
                this.registerAnimation(timeline, vars);
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

        console.log('✅ Early GSAP patching complete - smart animation management active');

        // Start smart cleanup timer
        this.startSmartCleanup();
    }

    /**
     * Determine if an animation is essential (should never be auto-killed)
     */
    isEssentialAnimation(tween, vars = {}) {
        // Check for infinite repeat animations (these are usually essential background effects)
        if (vars.repeat === -1 || vars.repeat === 'infinite') {
            return true;
        }

        // Check for essential CSS properties that indicate background animations
        const essentialProps = ['backgroundPosition', 'rotate', 'rotationZ', 'scale'];
        if (essentialProps.some(prop => vars.hasOwnProperty(prop))) {
            return true;
        }

        // Check for essential selectors (logo, background elements)
        if (tween && tween.targets) {
            const targets = Array.isArray(tween.targets()) ? tween.targets() : [tween.targets()];
            const hasEssentialTargets = targets.some(target => {
                if (!target || typeof target !== 'object') return false;
                
                // Check CSS classes
                if (target.classList) {
                    const essentialClasses = ['logo-text', 'image-wrapper', 'bg', 'scanlines', 'cyber-grid'];
                    return essentialClasses.some(cls => target.classList.contains(cls));
                }
                
                // Check IDs
                if (target.id) {
                    const essentialIds = ['chaos-canvas', 'cyber-grid', 'static-noise'];
                    return essentialIds.includes(target.id);
                }
                
                return false;
            });
            
            if (hasEssentialTargets) return true;
        }

        // Check animation duration - very long animations are likely essential
        if (vars.duration && vars.duration > 10) {
            return true;
        }

        return false;
    }

    registerAnimation(animation, vars = {}) {
        const id = ++this.animationCounter;
        const isEssential = this.isEssentialAnimation(animation, vars);
        
        this.animations.set(id, {
            animation: animation,
            createdAt: Date.now(),
            id: id,
            isEssential: isEssential,
            vars: vars
        });

        // Only auto-cleanup temporary animations
        if (!isEssential) {
            setTimeout(() => {
                this.killAnimation(id);
            }, 60000); // Increased from 30 to 60 seconds for temporary animations
        }
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

    killOldestNonEssentialAnimations(count = 10) {
        const nonEssentialAnims = Array.from(this.animations.entries())
            .filter(([id, data]) => !data.isEssential)
            .sort((a, b) => a[1].createdAt - b[1].createdAt)
            .slice(0, count);

        nonEssentialAnims.forEach(([id]) => {
            this.killAnimation(id);
        });

        console.log(`🗑️ Early cleanup: killed ${nonEssentialAnims.length} non-essential animations`);
    }

    startSmartCleanup() {
        setInterval(() => {
            const nonEssentialCount = Array.from(this.animations.values())
                .filter(data => !data.isEssential).length;
                
            if (nonEssentialCount > 75) { // Only clean non-essential animations
                this.killOldestNonEssentialAnimations(25);
                console.log(`🧹 Smart cleanup: ${this.animations.size} total animations (${nonEssentialCount} non-essential)`);
            }
        }, 10000); // Every 10 seconds
    }

    getStats() {
        const essential = Array.from(this.animations.values()).filter(data => data.isEssential).length;
        const nonEssential = this.animations.size - essential;
        
        return {
            totalAnimations: this.animations.size,
            essentialAnimations: essential,
            nonEssentialAnimations: nonEssential,
            maxAnimations: this.maxAnimations,
            isPatched: this.isPatched
        };
    }

    emergencyStop() {
        console.log('🚨 Early GSAP Registry Emergency Stop - preserving essential animations');
        
        // Kill only non-essential animations
        const nonEssentialIds = [];
        this.animations.forEach((data, id) => {
            if (!data.isEssential) {
                nonEssentialIds.push(id);
            }
        });
        
        nonEssentialIds.forEach(id => this.killAnimation(id));
        
        console.log(`🛡️ Emergency stop: killed ${nonEssentialIds.length} non-essential animations, preserved ${this.animations.size} essential ones`);
    }
}

// Create and apply early patching immediately
const earlyGSAPRegistry = new EarlyGSAPRegistry();

// Make it globally available
window.earlyGSAPRegistry = earlyGSAPRegistry;

// Export for module usage
export default earlyGSAPRegistry;