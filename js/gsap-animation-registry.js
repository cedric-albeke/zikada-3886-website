// GSAP Animation Registry - Tracks and manages all GSAP animations to prevent accumulation

import gsap from 'gsap';

// Ensure GSAP is globally available
if (typeof window !== 'undefined' && !window.gsap) {
    window.gsap = gsap;
}

class GSAPAnimationRegistry {
    constructor() {
        this.animations = new Map(); // Track all animations
        this.animationCounter = 0;
        this.maxAnimations = 150; // Maximum concurrent animations
        this.categories = {
            'phase': { maxAnimations: 30, priority: 1 },
            'effect': { maxAnimations: 40, priority: 2 },
            'ui': { maxAnimations: 20, priority: 3 },
            'background': { maxAnimations: 30, priority: 4 },
            'particle': { maxAnimations: 50, priority: 5 },
            'stream': { maxAnimations: 5, priority: 6 }  // Data streams - very limited
        };
        
        // Logging controls
        this.verbose = !!(window.__3886_DEBUG && window.__3886_DEBUG.gsapRegistryVerbose);
        this.logEvery = 20; // Only log every N registrations when not verbose
        
        // Override GSAP methods to auto-register
        this.patchGSAPMethods();
        
        if (this.verbose) {
            console.log('🎬 GSAP Animation Registry initialized (verbose)');
        } else {
            console.log('🎬 GSAP Animation Registry initialized');
        }
    }

    /**
     * Patch GSAP methods to automatically register animations
     */
    patchGSAPMethods() {
        // Check if already patched
        if (gsap._3886_patched) {
            if (this.verbose) console.log('⚠️ GSAP already patched, skipping...');
            return;
        }

        // Store original methods
        const originalTo = gsap.to;
        const originalFrom = gsap.from;
        const originalFromTo = gsap.fromTo;
        const originalTimeline = gsap.timeline;
        const originalSet = gsap.set;

        // Store registry reference for closures
        const registry = this;

        const resolveCategory = (vars) => (vars && vars._regCategory) || 'effect';
        const wantsSoftCap = (vars) => !!(vars && vars._regSoftCap === true);
        
        // Soft-cap helper (only enforced when explicitly requested)
        const canCreateInCategory = (category, vars) => {
            if (!wantsSoftCap(vars)) return true; // default: do not soft-cap unless opted-in
            const cfg = registry.categories[category] || { maxAnimations: 30 };
            const count = registry.getCategoryActiveCount(category);
            return count < cfg.maxAnimations;
        };

        // Patch gsap.to
        gsap.to = function(targets, vars = {}) {
            const category = resolveCategory(vars);
            if (!canCreateInCategory(category, vars)) {
                if (registry.verbose) console.log(`⏳ Skipping creation in category '${category}' (soft cap reached)`);
                return registry.createNoopTween();
            }
            const tween = originalTo.call(this, targets, vars);
            if (tween && registry) {
                registry.registerAnimation(tween, 'auto-to', category);
            }
            return tween;
        };

        // Patch gsap.from
        gsap.from = function(targets, vars = {}) {
            const category = resolveCategory(vars);
            if (!canCreateInCategory(category, vars)) {
                if (registry.verbose) console.log(`⏳ Skipping creation in category '${category}' (soft cap reached)`);
                return registry.createNoopTween();
            }
            const tween = originalFrom.call(this, targets, vars);
            if (tween && registry) {
                registry.registerAnimation(tween, 'auto-from', category);
            }
            return tween;
        };

        // Patch gsap.fromTo
        gsap.fromTo = function(targets, fromVars = {}, toVars = {}) {
            const category = resolveCategory(toVars);
            if (!canCreateInCategory(category, toVars)) {
                if (registry.verbose) console.log(`⏳ Skipping creation in category '${category}' (soft cap reached)`);
                return registry.createNoopTween();
            }
            const tween = originalFromTo.call(this, targets, fromVars, toVars);
            if (tween && registry) {
                registry.registerAnimation(tween, 'auto-fromTo', category);
            }
            return tween;
        };

        // Patch gsap.timeline
        gsap.timeline = function(vars = {}) {
            const category = resolveCategory(vars);
            if (!canCreateInCategory(category, vars)) {
                if (registry.verbose) console.log(`⏳ Skipping creation in category '${category}' (soft cap reached)`);
                return registry.createNoopTimeline();
            }
            const timeline = originalTimeline.call(this, vars);
            if (timeline && registry) {
                registry.registerAnimation(timeline, 'auto-timeline', category);
            }
            return timeline;
        };

        // Patch gsap.set (static positioning, doesn't need tracking but good to know)
        gsap.set = function(targets, vars = {}) {
            return originalSet.call(this, targets, vars);
        };

        // Mark as patched
        gsap._3886_patched = true;
        gsap._3886_originalMethods = {
            to: originalTo,
            from: originalFrom,
            fromTo: originalFromTo,
            timeline: originalTimeline,
            set: originalSet
        };

        if (this.verbose) console.log('🔧 GSAP methods patched for auto-registration');
    }

    /**
     * Create a managed GSAP animation with automatic registration
     * @param {string} method - GSAP method ('to', 'from', 'fromTo', 'timeline')
     * @param {*} targets - Animation targets
     * @param {Object} vars - Animation variables
     * @param {string} name - Animation name for debugging
     * @param {string} category - Animation category
     * @param {Object} options - Additional options
     * @returns {GSAPTween|GSAPTimeline} The created animation
     */
    createAnimation(method, targets, vars, name = 'unnamed', category = 'effect', options = {}) {
        // Check limits
        this.enforceAnimationLimits(category);

        let animation;
        const animationId = ++this.animationCounter;
        const animationName = `${name}-${animationId}`;

        // Create animation based on method
        switch (method) {
            case 'to':
                animation = gsap.to(targets, {
                    ...vars,
                    onComplete: this.wrapCallback(vars.onComplete, animationId),
                    onUpdate: this.wrapCallback(vars.onUpdate, animationId)
                });
                break;
            case 'from':
                animation = gsap.from(targets, {
                    ...vars,
                    onComplete: this.wrapCallback(vars.onComplete, animationId),
                    onUpdate: this.wrapCallback(vars.onUpdate, animationId)
                });
                break;
            case 'fromTo':
                animation = gsap.fromTo(targets, options.fromVars || {}, {
                    ...vars,
                    onComplete: this.wrapCallback(vars.onComplete, animationId),
                    onUpdate: this.wrapCallback(vars.onUpdate, animationId)
                });
                break;
            case 'timeline':
                animation = gsap.timeline({
                    ...vars,
                    onComplete: this.wrapCallback(vars.onComplete, animationId),
                    onUpdate: this.wrapCallback(vars.onUpdate, animationId)
                });
                break;
            default:
                throw new Error(`Unknown GSAP method: ${method}`);
        }

        // Register the animation
        this.registerAnimation(animation, animationName, category, options);

        return animation;
    }

    /**
     * Register an existing animation
     */
    registerAnimation(animation, name = 'unnamed', category = 'effect', options = {}) {
        if (!animation) return null;

        const animationId = animation._gsapRegistryId || ++this.animationCounter;
        animation._gsapRegistryId = animationId;

        const animationData = {
            id: animationId,
            animation: animation,
            name: name,
            category: category,
            createdAt: Date.now(),
            lastUsed: Date.now(),
            isActive: true,
            targets: this.getAnimationTargets(animation),
            duration: animation.duration ? animation.duration() : 0,
            progress: 0,
            maxAge: options.maxAge || 60000, // Default 1 minute max age
            autoCleanup: options.autoCleanup !== false
        };

        // Preserve infinite repeat animations (repeat:-1) — never age out core loops
        try {
            if (animation && typeof animation.repeat === 'function' && animation.repeat() === -1) {
                animationData.autoCleanup = false;
                animationData.maxAge = Infinity;
            }
        } catch (e) {
            // ignore capability probing errors
        }

        this.animations.set(animationId, animationData);

        // Reduce logging noise: only log occasionally unless verbose enabled
        if (this.verbose) {
            console.log(`🎬 Registered animation: ${name} (${category}) - Total: ${this.animations.size}`);
        } else if (this.animationCounter % this.logEvery === 0) {
            console.log(`🎬 Animation registry status - Total: ${this.animations.size}`);
        }

        return animationId;
    }

    /**
     * Wrap callback functions to track animation lifecycle
     */
    wrapCallback(originalCallback, animationId) {
        return (...args) => {
            // Update last used time
            const animationData = this.animations.get(animationId);
            if (animationData) {
                animationData.lastUsed = Date.now();
                animationData.progress = animationData.animation.progress ? animationData.animation.progress() : 1;
            }

            // Call original callback
            if (originalCallback) {
                originalCallback.apply(this, args);
            }

            // Auto-cleanup on complete if enabled
            if (animationData && animationData.autoCleanup && animationData.progress >= 1) {
                setTimeout(() => this.killAnimation(animationId), 100);
            }
        };
    }

    /**
     * Get animation targets
     */
    getAnimationTargets(animation) {
        if (!animation) return [];
        if (animation.targets) {
            try { return animation.targets(); } catch (_) {}
        }
        if (animation._targets) {
            return animation._targets;
        }
        return [];
    }

    /**
     * Count active animations in a category
     */
    getCategoryActiveCount(category) {
        let count = 0;
        this.animations.forEach(data => {
            if (data.category === category && data.isActive !== false) count++;
        });
        return count;
    }

    /**
     * Create a no-op tween for safe skipping
     */
    createNoopTween() {
        return {
            kill: () => {},
            pause: () => {},
            resume: () => {},
            play: () => {},
            eventCallback: () => {},
            timeScale: () => {},
            progress: () => 0,
            duration: () => 0,
            then: (cb) => Promise.resolve().then(cb)
        };
    }

    /**
     * Create a no-op timeline for safe skipping
     */
    createNoopTimeline() {
        const self = this;
        const tl = self.createNoopTween();
        return {
            to: () => self.createNoopTimeline(),
            from: () => self.createNoopTimeline(),
            fromTo: () => self.createNoopTimeline(),
            set: () => self.createNoopTimeline(),
            add: () => self.createNoopTimeline(),
            call: () => self.createNoopTimeline(),
            addLabel: () => self.createNoopTimeline(),
            clear: () => self.createNoopTimeline(),
            kill: tl.kill,
            pause: tl.pause,
            play: tl.play,
            resume: tl.resume,
            eventCallback: tl.eventCallback,
            timeScale: tl.timeScale,
            progress: tl.progress,
            duration: tl.duration,
            then: tl.then
        };
    }

    /**
     * Kill a specific animation
     */
    killAnimation(animationId) {
        const animationData = this.animations.get(animationId);
        if (!animationData) return false;

        try {
            // Kill the GSAP animation
            if (animationData.animation && animationData.animation.kill) {
                animationData.animation.kill();
            }
        } catch (error) {
            console.warn(`⚠️ Error killing animation ${animationData.name}:`, error);
        }

        // Remove from registry
        this.animations.delete(animationId);

        console.log(`🗑️ Killed animation: ${animationData.name} (Remaining: ${this.animations.size})`);
        return true;
    }

    /**
     * Kill all animations in a category
     */
    killCategory(category) {
        const killed = [];
        
        this.animations.forEach((data, id) => {
            if (data.category === category) {
                this.killAnimation(id);
                killed.push(data.name);
            }
        });

        if (killed.length > 0) {
            console.log(`🗑️ Killed ${killed.length} animations in category '${category}':`, killed);
        }

        return killed.length;
    }

    /**
     * Enforce animation limits per category
     */
    enforceAnimationLimits(category) {
        const categoryConfig = this.categories[category] || { maxAnimations: 30, priority: 3 };
        const categoryAnimations = Array.from(this.animations.values())
            .filter(data => data.category === category && data.isActive);

        if (categoryAnimations.length >= categoryConfig.maxAnimations) {
            // Remove oldest animations in this category
            const oldestAnimations = categoryAnimations
                .sort((a, b) => a.createdAt - b.createdAt)
                .slice(0, categoryAnimations.length - categoryConfig.maxAnimations + 1);

            oldestAnimations.forEach(animationData => {
                this.killAnimation(animationData.id);
            });

            console.log(`⚖️ Enforced limits for category '${category}': removed ${oldestAnimations.length} animations`);
        }

        // Global limit check
        if (this.animations.size > this.maxAnimations) {
            this.performEmergencyCleanup();
        }
    }

    /**
     * Perform periodic cleanup of old and completed animations
     */
    performPeriodicCleanup() {
        const now = Date.now();
        const toRemove = [];

        this.animations.forEach((data, id) => {
            let shouldRemove = false;

            // Check if animation is complete
            if (data.animation && data.animation.progress && data.animation.progress() >= 1) {
                shouldRemove = true;
            }

            // Check age limit
            if ((now - data.createdAt) > data.maxAge) {
                shouldRemove = true;
            }

            // Check if animation object is null/undefined
            if (!data.animation) {
                shouldRemove = true;
            }

            // Check if targets are still in DOM (for DOM animations)
            if (data.targets && data.targets.length > 0) {
                const allTargetsRemoved = data.targets.every(target => {
                    return target && typeof target === 'object' && 
                           target.nodeType === 1 && 
                           !document.contains(target);
                });
                
                if (allTargetsRemoved) {
                    shouldRemove = true;
                }
            }

            if (shouldRemove) {
                toRemove.push(id);
            }
        });

        // Remove identified animations
        toRemove.forEach(id => this.killAnimation(id));

        if (toRemove.length > 0) {
            console.log(`🧹 Periodic cleanup: removed ${toRemove.length} animations`);
        }

        return toRemove.length;
    }

    /**
     * Emergency cleanup - remove animations by priority
     */
    performEmergencyCleanup() {
        console.log('🚨 EMERGENCY CLEANUP: Too many animations, removing by priority');

        // Group by priority
        const animationsByPriority = new Map();
        
        this.animations.forEach((data, id) => {
            const categoryConfig = this.categories[data.category] || { priority: 5 };
            const priority = categoryConfig.priority;
            
            if (!animationsByPriority.has(priority)) {
                animationsByPriority.set(priority, []);
            }
            animationsByPriority.get(priority).push({ id, data });
        });

        // Remove animations starting from lowest priority
        const priorities = Array.from(animationsByPriority.keys()).sort((a, b) => b - a);
        let removed = 0;
        const targetRemoval = Math.floor(this.animations.size * 0.3); // Remove 30%

        for (const priority of priorities) {
            if (removed >= targetRemoval) break;

            const animationsAtPriority = animationsByPriority.get(priority);
            const toRemoveCount = Math.min(animationsAtPriority.length, targetRemoval - removed);
            
            // Remove oldest first within this priority
            animationsAtPriority
                .sort((a, b) => a.data.createdAt - b.data.createdAt)
                .slice(0, toRemoveCount)
                .forEach(({ id }) => {
                    this.killAnimation(id);
                    removed++;
                });
        }

        console.log(`🚨 Emergency cleanup completed: removed ${removed} animations`);
    }

    killByFilter({ category, olderThan, excludeEssential = true } = {}) {
        const now = Date.now();
        const ids = [];
        this.animations.forEach((data, id) => {
            if (category && data.category !== category) return;
            if (excludeEssential && data.isEssential) return;
            if (olderThan && (now - data.createdAt) < olderThan) return;
            ids.push(id);
        });
        ids.forEach(id => this.killAnimation(id));
        if (ids.length) console.log(`🗑️ Killed ${ids.length} animations by filter`, { category, olderThan, excludeEssential });
        return ids.length;
    }

    /**
     * Pause all animations
     */
    pauseAll() {
        gsap.globalTimeline.pause();
        console.log('⏸️ All GSAP animations paused');
    }

    /**
     * Resume all animations
     */
    resumeAll() {
        gsap.globalTimeline.resume();
        console.log('▶️ All GSAP animations resumed');
    }

    /**
     * Get animation statistics
     */
    getStats() {
        const stats = {
            totalAnimations: this.animations.size,
            byCategory: {},
            byStatus: { active: 0, completed: 0, paused: 0 },
            averageDuration: 0,
            memoryEstimate: 0
        };

        let totalDuration = 0;

        this.animations.forEach(data => {
            // Count by category
            if (!stats.byCategory[data.category]) {
                stats.byCategory[data.category] = 0;
            }
            stats.byCategory[data.category]++;

            // Count by status
            if (data.animation && data.animation.progress) {
                const progress = data.animation.progress();
                if (progress >= 1) {
                    stats.byStatus.completed++;
                } else if (data.animation.paused && data.animation.paused()) {
                    stats.byStatus.paused++;
                } else {
                    stats.byStatus.active++;
                }
            }

            // Calculate duration average
            totalDuration += data.duration;
        });

        if (this.animations.size > 0) {
            stats.averageDuration = totalDuration / this.animations.size;
        }

        // Rough memory estimate (each animation ~2KB)
        stats.memoryEstimate = this.animations.size * 2048;

        return stats;
    }

    /**
     * Emergency stop - kill all animations
     */
    emergencyStop() {
        console.log('🚨 EMERGENCY STOP: Killing all GSAP animations');
        
        // Kill global timeline
        gsap.killTweensOf('*');
        
        // Clear our registry
        const animationIds = Array.from(this.animations.keys());
        animationIds.forEach(id => this.killAnimation(id));
        
        console.log(`🛑 Emergency stop completed: ${animationIds.length} animations killed`);
    }

    /**
     * Start periodic cleanup timer
     */
    startPeriodicCleanup(interval = 10000) { // Default: 10 seconds
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        this.cleanupInterval = setInterval(() => {
            this.performPeriodicCleanup();
        }, interval);

        console.log(`🧹 GSAP cleanup started (every ${interval}ms)`);
    }

    /**
     * Destroy the registry
     */
    destroy() {
        this.emergencyStop();
        
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        
        console.log('💀 GSAP Animation Registry destroyed');
    }
}

// Create global instance
const gsapAnimationRegistry = new GSAPAnimationRegistry();

// Start periodic cleanup
gsapAnimationRegistry.startPeriodicCleanup();

// Make it globally available
window.gsapAnimationRegistry = gsapAnimationRegistry;

export default gsapAnimationRegistry;