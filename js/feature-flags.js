/**
 * ZIKADA 3886 Feature Flags System
 * 
 * Centralized feature flag management with runtime override support.
 * Enables safe rollout and rollback of PWA features without performance impact.
 */

class FeatureFlags {
    constructor() {
        // Default flags - conservative approach (all PWA features OFF initially)
        this.defaultFlags = {
            pwaEnabled: false,              // Master PWA toggle
            serviceWorkerEnabled: false,    // Service worker caching
            offlineMode: false,            // Offline fallback scenes
            backgroundSync: false,         // Background metrics sync
            installPrompt: false,          // PWA install prompts
            performanceBudgets: true,      // Always enforce performance budgets
            debugMetrics: false           // Detailed performance logging
        };
        
        this.flags = { ...this.defaultFlags };
        this.overrides = new Map();
        
        // Initialize flags from various sources
        this.initializeFlags();
        
        // Expose global for debugging
        if (typeof window !== 'undefined') {
            window.FEATURE_FLAGS = this;
        }
        
        console.log('🚩 Feature Flags initialized:', this.flags);
    }
    
    initializeFlags() {
        try {
            // 1. URL parameters (highest priority)
            this.loadFromURL();
            
            // 2. Environment config (if available)
            this.loadFromEnvironment();
            
            // 3. Local storage overrides (developer overrides)
            this.loadFromStorage();
            
            // 4. Apply any programmatic overrides
            this.applyOverrides();
            
        } catch (error) {
            console.warn('Feature flags initialization error:', error);
            // Fall back to defaults on any error
            this.flags = { ...this.defaultFlags };
        }
    }
    
    loadFromURL() {
        if (typeof window === 'undefined' || !window.location) return;
        
        const params = new URLSearchParams(window.location.search);
        
        // Master PWA toggle via URL
        if (params.has('pwa')) {
            const pwaValue = params.get('pwa');
            this.flags.pwaEnabled = pwaValue === '1' || pwaValue === 'true';
            
            // When PWA is enabled via URL, enable core components
            if (this.flags.pwaEnabled) {
                this.flags.serviceWorkerEnabled = true;
                this.flags.offlineMode = true;
                this.flags.installPrompt = true;
            }
        }
        
        // Individual feature overrides
        for (const flag of Object.keys(this.defaultFlags)) {
            if (params.has(flag)) {
                const value = params.get(flag);
                this.flags[flag] = value === '1' || value === 'true';
            }
        }
        
        // Debug mode
        if (params.has('debug') && params.get('debug') === '1') {
            this.flags.debugMetrics = true;
        }
    }
    
    loadFromEnvironment() {
        // Check for environment-specific config
        if (typeof window !== 'undefined' && window.__ZIKADA_CONFIG__) {
            const config = window.__ZIKADA_CONFIG__;
            if (config.features) {
                Object.assign(this.flags, config.features);
            }
        }
    }
    
    loadFromStorage() {
        if (typeof window === 'undefined' || !window.localStorage) return;
        
        try {
            // Load individual flag overrides from localStorage
            for (const flag of Object.keys(this.defaultFlags)) {
                const storageKey = `zikada_flag_${flag}`;
                const stored = localStorage.getItem(storageKey);
                if (stored !== null) {
                    this.flags[flag] = stored === '1' || stored === 'true';
                }
            }
        } catch (error) {
            console.warn('Could not read feature flags from localStorage:', error);
        }
    }
    
    applyOverrides() {
        // Apply any programmatic overrides set by other modules
        for (const [flag, value] of this.overrides) {
            this.flags[flag] = value;
        }
    }
    
    /**
     * Get a feature flag value
     */
    isEnabled(flagName) {
        return this.flags[flagName] === true;
    }
    
    /**
     * Set a runtime override for a flag
     */
    override(flagName, value) {
        if (!this.defaultFlags.hasOwnProperty(flagName)) {
            console.warn(`Unknown feature flag: ${flagName}`);
            return false;
        }
        
        this.overrides.set(flagName, value);
        this.flags[flagName] = value;
        
        console.log(`🚩 Flag override: ${flagName} = ${value}`);
        
        // Persist to localStorage for developer convenience
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                localStorage.setItem(`zikada_flag_${flagName}`, value ? '1' : '0');
            } catch (error) {
                console.warn('Could not persist flag to localStorage:', error);
            }
        }
        
        return true;
    }
    
    /**
     * Reset a flag to its default value
     */
    reset(flagName) {
        if (!this.defaultFlags.hasOwnProperty(flagName)) {
            return false;
        }
        
        this.overrides.delete(flagName);
        this.flags[flagName] = this.defaultFlags[flagName];
        
        // Remove from localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                localStorage.removeItem(`zikada_flag_${flagName}`);
            } catch (error) {
                // Ignore storage errors
            }
        }
        
        console.log(`🚩 Flag reset: ${flagName} = ${this.flags[flagName]}`);
        return true;
    }
    
    /**
     * Get current flag state for debugging
     */
    getState() {
        return {
            flags: { ...this.flags },
            overrides: Object.fromEntries(this.overrides),
            source: this.getFlagSources()
        };
    }
    
    getFlagSources() {
        const sources = {};
        for (const flag of Object.keys(this.flags)) {
            if (this.overrides.has(flag)) {
                sources[flag] = 'override';
            } else if (this.flags[flag] !== this.defaultFlags[flag]) {
                sources[flag] = 'config';
            } else {
                sources[flag] = 'default';
            }
        }
        return sources;
    }
    
    /**
     * Performance-aware flag checking with caching
     */
    static cachedFlag = new Map();
    static getCached(flagName) {
        if (!FeatureFlags.cachedFlag.has(flagName)) {
            const instance = FeatureFlags.getInstance();
            FeatureFlags.cachedFlag.set(flagName, instance.isEnabled(flagName));
        }
        return FeatureFlags.cachedFlag.get(flagName);
    }
    
    static clearCache() {
        FeatureFlags.cachedFlag.clear();
    }
    
    static getInstance() {
        if (!FeatureFlags.instance) {
            FeatureFlags.instance = new FeatureFlags();
        }
        return FeatureFlags.instance;
    }
}

// Global instance
const featureFlags = FeatureFlags.getInstance();

// Export for modules
export default featureFlags;

// Also make available globally for console debugging
if (typeof window !== 'undefined') {
    window.featureFlags = featureFlags;
    
    // Console helpers
    window.enablePWA = () => featureFlags.override('pwaEnabled', true);
    window.disablePWA = () => featureFlags.override('pwaEnabled', false);
    window.flagStatus = () => console.table(featureFlags.getState());
}