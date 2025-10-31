// GSAP Animation Registry - Tracks and manages all GSAP animations to prevent accumulation

import gsap from 'gsap';
import intervalManager from './interval-manager.js';
import { createLogger } from './utils/logger.js';

// Create namespaced logger
const log = createLogger('anim');

// Ensure GSAP is globally available
if (typeof window !== 'undefined' && !window.gsap) {
    window.gsap = gsap;
}

class GSAPAnimationRegistry {
    constructor() {
        this.animations = new Map(); // Track all animations
        this.animationCounter = 0;
        this.maxAnimations = 100; // Reduced from 150 to prevent performance issues
        this.categories = {
            'phase': { maxAnimations: 20, priority: 1 }, // Reduced from 30
            'effect': { maxAnimations: 25, priority: 2 }, // Reduced from 40
            'ui': { maxAnimations: 15, priority: 3 }, // Reduced from 20
            'background': { maxAnimations: 20, priority: 4 }, // Reduced from 30
            'particle': { maxAnimations: 30, priority: 5 }, // Reduced from 50
            'stream': { maxAnimations: 5, priority: 6 } // Data streams - very limited
        };
        
        // Logging controls
        this.verbose = !!(window.__3886_DEBUG && window.__3886_DEBUG.gsapRegistryVerbose);
        this.logEvery = 20; // Only log every N registrations when not verbose
        this.cleanupIntervalHandle = null; // Track cleanup interval for proper management
        
        // Override GSAP methods to auto-register
        this.patchGSAPMethods();
        
        // Use structured logging
        log.once('anim:init', () => {
            log.info('GSAP Animation Registry initialized', { verbose: this.verbose });
        });
    }

    /**
     * Patch GSAP methods to automatically register animations
     */
    patchGSAPMethods() {
        // Check if already patched
        if (gsap._3886_patched) {
            log.debug('GSAP already patched, skipping...');
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

        log.debug('GSAP methods patched for auto-registration');
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
            ownerLabel: options.ownerLabel || null, // Add owner label support
            createdAt: Date.now(),
            lastUsed: Date.now(),
            isActive: true,
            targets: this.getAnimationTargets(animation),
            duration: animation.duration ? animation.duration() : 0,
            progress: 0,
            maxAge: options.maxAge || 30000, // Reduced from 60s to 30s for better memory management
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

        // Use throttled logging to reduce spam
        log.debug(`Registered animation: ${name} (${category}) - Total: ${this.animations.size}`);
        
        // Periodic status updates with heavy throttling
        log.throttle('anim:status', 5000, () => {
            log.info(`Animation registry status - Total: ${this.animations.size}`);
        });

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
            log.warn(`Error killing animation ${animationData.name}:`, error);
        }

        // Remove from registry
        this.animations.delete(animationId);

        // Use throttled logging to prevent spam from killing many animations
        log.throttle('anim:killed', 2000, () => {
            log.debug(`Animation cleanup in progress - Current count: ${this.animations.size}`);
        });
        
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
            log.debug(`Killed ${killed.length} animations in category '${category}'`, { animationNames: killed });
        }

        return killed.length;
    }
    
    /**
     * Kill all animations by owner label
     */
    killOwner(ownerLabel) {
        const killed = [];
        
        this.animations.forEach((data, id) => {
            if (data.ownerLabel === ownerLabel || data.name.startsWith(ownerLabel)) {
                this.killAnimation(id);
                killed.push(data.name);
            }
        });

        if (killed.length > 0) {
            log.debug(`Killed ${killed.length} animations with owner '${ownerLabel}'`, { animationNames: killed });
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

            log.info(`Enforced limits for category '${category}': removed ${oldestAnimations.length} animations`);
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

        // Use throttled logging for periodic cleanup
        if (toRemove.length > 0) {
            log.throttle('anim:cleanup', 10000, () => {
                log.info(`Periodic cleanup: removed ${toRemove.length} animations`);
            });
        }

        return toRemove.length;
    }

    /**
     * Emergency cleanup - remove animations by priority
     */
    performEmergencyCleanup() {
        log.warn('EMERGENCY CLEANUP: Too many animations, removing by priority');

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
        const targetRemoval = Math.floor(this.animations.size * 0.5); // Increased from 30% to 50% for more aggressive cleanup

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

        log.warn(`Emergency cleanup completed: removed ${removed} animations`);
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
        if (ids.length) log.debug(`Killed ${ids.length} animations by filter`, { category, olderThan, excludeEssential });
        return ids.length;
    }

    /**
     * Pause all animations
     */
    pauseAll() {
        gsap.globalTimeline.pause();
        log.info('All GSAP animations paused');
    }

    /**
     * Resume all animations
     */
    resumeAll() {
        gsap.globalTimeline.resume();
        log.info('All GSAP animations resumed');
    }

    /**
     * Get the total number of animations
     */
    size() {
        return this.animations.size;
    }
    
    /**
     * List all unique owner labels
     */
    listOwners() {
        const owners = new Set();
        
        this.animations.forEach(data => {
            if (data.ownerLabel) {
                owners.add(data.ownerLabel);
            } else if (data.name && data.name.includes('-')) {
                // Extract owner from name pattern
                const parts = data.name.split('-');
                if (parts.length > 1) {
                    owners.add(parts[0]);
                }
            }
        });
        
        return Array.from(owners);
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
        log.error('EMERGENCY STOP: Killing all GSAP animations');
        
        // Kill global timeline
        gsap.killTweensOf('*');
        
        // Clear our registry
        const animationIds = Array.from(this.animations.keys());
        animationIds.forEach(id => this.killAnimation(id));
        
        log.error(`Emergency stop completed: ${animationIds.length} animations killed`);
    }

    /**
     * Start periodic cleanup timer
     */
    startPeriodicCleanup(interval = 5000) { // Reduced from 10s to 5s for better performance
        // Clear existing cleanup interval
        if (this.cleanupIntervalHandle) {
            this.cleanupIntervalHandle.clear();
            this.cleanupIntervalHandle = null;
        }

        // Create managed interval for cleanup
        this.cleanupIntervalHandle = intervalManager.createInterval(() => {
            this.performPeriodicCleanup();
        }, interval, 'gsap-periodic-cleanup', {
            category: 'system',
            maxAge: Infinity // Keep running until explicitly cleared
        });

        log.once('anim:cleanup-start', () => {
            log.info(`GSAP periodic cleanup started (every ${interval}ms)`);
        });
    }

    /**
     * Destroy the registry
     */
    destroy() {
        this.emergencyStop();
        
        // Clear managed cleanup interval
        if (this.cleanupIntervalHandle) {
            this.cleanupIntervalHandle.clear();
            this.cleanupIntervalHandle = null;
        }
        
        log.info('GSAP Animation Registry destroyed');
    }
}

// Create global instance
const gsapAnimationRegistry = new GSAPAnimationRegistry();

// Start periodic cleanup
gsapAnimationRegistry.startPeriodicCleanup();

// Make it globally available
window.gsapAnimationRegistry = gsapAnimationRegistry;

export default gsapAnimationRegistry;