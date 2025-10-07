/**
 * ============================================================================
 * TRIGGER EFFECT ORCHESTRATOR
 * ============================================================================
 * 
 * Provides robust effect orchestration for control panel trigger effects
 * Handles CHROMA, SPOTLIGHT, and SHIMMER effects with proper cleanup and debouncing
 * 
 * Version: 1.0.0
 * Dependencies: trigger-effects.css
 */

class TriggerEffectOrchestrator {
    constructor() {
        this.effectLock = false;
        this.activeEffects = new Set();
        this.effectTimers = new Map();
        this.spotlightPosition = { x: '50%', y: '50%' };
        this.screenReaderAnnouncements = true;
        
        // Check for user preferences
        this.checkAccessibilityPreferences();
        
        // Bind spotlight position tracking
        this.trackSpotlightPosition();
        
        // Initialize screen reader announcements
        this.initScreenReaderSupport();
        
        console.log('🎨 Trigger Effect Orchestrator initialized with accessibility support');
    }

    /**
     * Check accessibility preferences and adjust behavior
     */
    checkAccessibilityPreferences() {
        // Check for reduced motion preference
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Check for high contrast preference
        this.prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
        
        // Listen for preference changes
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            this.prefersReducedMotion = e.matches;
            console.log('🎨 Motion preference updated:', this.prefersReducedMotion ? 'reduced' : 'normal');
        });
        
        window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
            this.prefersHighContrast = e.matches;
            console.log('🎨 Contrast preference updated:', this.prefersHighContrast ? 'high' : 'normal');
        });
    }

    /**
     * Initialize screen reader support
     */
    initScreenReaderSupport() {
        // Create live region for announcements
        this.liveRegion = document.createElement('div');
        this.liveRegion.setAttribute('aria-live', 'polite');
        this.liveRegion.setAttribute('aria-atomic', 'true');
        this.liveRegion.className = 'sr-announcement';
        document.body.appendChild(this.liveRegion);
        
        // Create status region for continuous updates
        this.statusRegion = document.createElement('div');
        this.statusRegion.setAttribute('aria-live', 'polite');
        this.statusRegion.setAttribute('role', 'status');
        this.statusRegion.className = 'sr-announcement';
        document.body.appendChild(this.statusRegion);
    }

    /**
     * Announce effect to screen readers
     * @param {string} effectName - Name of the effect
     */
    announceEffect(effectName) {
        if (!this.screenReaderAnnouncements || !this.liveRegion) return;
        
        const effectMappings = {
            'CHROMA': 'Chromatic pulse effect activated',
            'SPOTLIGHT': 'Spotlight sweep effect activated', 
            'SHIMMER': 'Heat shimmer effect activated'
        };
        
        const announcement = effectMappings[effectName] || `${effectName} effect activated`;
        
        // Clear previous announcement and add new one
        this.liveRegion.textContent = '';
        setTimeout(() => {
            this.liveRegion.textContent = announcement;
        }, 10);
    }

    /**
     * Add visual feedback to trigger buttons
     * @param {string} effectName - Name of the effect
     */
    addButtonFeedback(effectName) {
        // Find button with matching data-effect attribute
        const effectMap = {
            'CHROMA': 'chroma-pulse',
            'SPOTLIGHT': 'spotlight-sweep',
            'SHIMMER': 'heat-shimmer'
        };
        
        const dataEffect = effectMap[effectName];
        if (!dataEffect) return;
        
        const button = document.querySelector(`[data-effect="${dataEffect}"]`);
        if (!button) return;
        
        // Add active class for visual feedback
        button.classList.add('fx-active');
        
        // Add aria attributes
        button.setAttribute('aria-pressed', 'true');
        button.setAttribute('aria-describedby', 'effect-status');
        
        // Remove feedback after effect duration
        const duration = this.getEffectDuration(effectName);
        setTimeout(() => {
            button.classList.remove('fx-active');
            button.setAttribute('aria-pressed', 'false');
            button.removeAttribute('aria-describedby');
        }, Math.min(duration, 300)); // Cap visual feedback to 300ms
    }

    /**
     * Get effect duration based on effect name
     * @param {string} effectName - Name of the effect
     * @returns {number} Duration in milliseconds
     */
    getEffectDuration(effectName) {
        const durations = {
            'CHROMA': 700,
            'SPOTLIGHT': 900,
            'SHIMMER': 850
        };
        
        return durations[effectName] || 800;
    }

    /**
     * Track mouse position for spotlight effect
     */
    trackSpotlightPosition() {
        document.addEventListener('mousemove', (e) => {
            this.spotlightPosition = {
                x: `${(e.clientX / window.innerWidth) * 100}%`,
                y: `${(e.clientY / window.innerHeight) * 100}%`
            };
        }, { passive: true });

        // Update CSS custom properties
        document.addEventListener('mousemove', (e) => {
            document.documentElement.style.setProperty('--spot-x', this.spotlightPosition.x);
            document.documentElement.style.setProperty('--spot-y', this.spotlightPosition.y);
        }, { passive: true });
    }

    /**
     * Apply transient effect with proper cleanup and re-triggering support
     * @param {Element} target - Target element to apply effect to
     * @param {string} className - CSS class name for the effect
     * @param {number} duration - Effect duration in milliseconds
     */
    applyTransientEffect(target, className, duration = 800) {
        if (!target) {
            console.warn('TriggerEffectOrchestrator: No target element provided');
            return;
        }

        // Clear any existing timer for this effect
        const effectKey = `${className}_${target.tagName}_${target.className}`;
        if (this.effectTimers.has(effectKey)) {
            clearTimeout(this.effectTimers.get(effectKey));
            this.effectTimers.delete(effectKey);
        }

        // Remove the class to reset animation
        target.classList.remove(className);
        
        // Force reflow to ensure class removal takes effect
        void target.offsetWidth;
        
        // Add the effect class
        target.classList.add(className);
        this.activeEffects.add(effectKey);

        // Set cleanup timer
        const timerId = setTimeout(() => {
            target.classList.remove(className);
            this.activeEffects.delete(effectKey);
            this.effectTimers.delete(effectKey);
            
            // Debug logging
            console.log(`🎨 Effect "${className}" completed and cleaned up`);
        }, duration);

        this.effectTimers.set(effectKey, timerId);
        
        // Debug logging
        console.log(`🎨 Applied effect "${className}" to`, target, `for ${duration}ms`);
    }

    /**
     * Trigger specific effects by name
     * @param {string} effectName - Name of the effect to trigger
     * @param {Element} target - Optional target element (defaults to document.body)
     */
    triggerEffect(effectName, target = null) {
        if (this.effectLock) {
            console.log(`🎨 Effect "${effectName}" blocked by lock`);
            return;
        }

        const effectTarget = target || document.body;
        const normalizedName = effectName.toUpperCase();
        
        // Check if user prefers reduced motion and adjust accordingly
        const lockDuration = this.prefersReducedMotion ? 150 : 350;

        // Set effect lock for debouncing
        this.setEffectLock(lockDuration);
        
        // Add accessibility attributes to target
        effectTarget.setAttribute('data-effect-name', normalizedName);
        effectTarget.setAttribute('aria-live', 'polite');

        switch (normalizedName) {
            case 'CHROMA':
            case 'CHROMA-PULSE':
                this.triggerChromaEffect(effectTarget);
                break;
                
            case 'SPOTLIGHT':
            case 'SPOTLIGHT-SWEEP':
                this.triggerSpotlightEffect(effectTarget);
                break;
                
            case 'SHIMMER':
            case 'HEAT-SHIMMER':
                this.triggerShimmerEffect(effectTarget);
                break;
                
            default:
                console.warn(`🎨 Unknown effect: "${effectName}"`);
                return;
        }
        
        // Accessibility enhancements
        this.announceEffect(normalizedName);
        this.addButtonFeedback(normalizedName);
        
        // Clean up accessibility attributes after effect
        setTimeout(() => {
            effectTarget.removeAttribute('data-effect-name');
            effectTarget.removeAttribute('aria-live');
        }, this.getEffectDuration(normalizedName));

        console.log(`🎨 Triggered effect: ${normalizedName} (accessibility: ${this.prefersReducedMotion ? 'reduced motion' : 'normal'})`);
    }

    /**
     * Trigger CHROMA effect
     */
    triggerChromaEffect(target) {
        // Update spotlight position for any mouse tracking
        document.documentElement.style.setProperty('--spot-x', this.spotlightPosition.x);
        document.documentElement.style.setProperty('--spot-y', this.spotlightPosition.y);
        
        this.applyTransientEffect(target, 'fx--chroma', 700);
    }

    /**
     * Trigger SPOTLIGHT effect
     */
    triggerSpotlightEffect(target) {
        // Ensure spotlight position is set
        document.documentElement.style.setProperty('--spot-x', this.spotlightPosition.x);
        document.documentElement.style.setProperty('--spot-y', this.spotlightPosition.y);
        
        this.applyTransientEffect(target, 'fx--spotlight', 900);
    }

    /**
     * Trigger SHIMMER effect
     */
    triggerShimmerEffect(target) {
        this.applyTransientEffect(target, 'fx--shimmer', 850);
    }

    /**
     * Set effect lock to prevent rapid triggering
     * @param {number} duration - Lock duration in milliseconds
     */
    setEffectLock(duration = 350) {
        if (this.effectLock) return;
        
        this.effectLock = true;
        setTimeout(() => {
            this.effectLock = false;
        }, duration);
    }

    /**
     * Clear all active effects immediately
     */
    clearAllEffects() {
        // Clear all timers
        for (const [effectKey, timerId] of this.effectTimers.entries()) {
            clearTimeout(timerId);
        }
        this.effectTimers.clear();
        this.activeEffects.clear();

        // Remove all effect classes from body
        document.body.classList.remove('fx--chroma', 'fx--spotlight', 'fx--shimmer');
        
        // Force cleanup of any remaining pseudo-elements
        document.body.classList.add('fx--clear');
        setTimeout(() => {
            document.body.classList.remove('fx--clear');
        }, 50);

        console.log('🎨 All effects cleared');
    }

    /**
     * Get current effect status
     */
    getStatus() {
        return {
            locked: this.effectLock,
            activeEffects: Array.from(this.activeEffects),
            activeCount: this.activeEffects.size,
            spotlightPosition: this.spotlightPosition
        };
    }
}

// Create global instance
const effectOrchestrator = new TriggerEffectOrchestrator();

// Global convenience functions
window.triggerEffect = (name, target) => effectOrchestrator.triggerEffect(name, target);
window.clearAllEffects = () => effectOrchestrator.clearAllEffects();

// Make orchestrator globally available for debugging
window.effectOrchestrator = effectOrchestrator;

// Export for module systems
export default effectOrchestrator;