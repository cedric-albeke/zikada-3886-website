// Safety Feature Flags for Debugging
// These flags allow granular control over effect systems during development

class SafeFeatureFlags {
    constructor() {
        // Get flags from URL params, localStorage, or defaults
        const urlParams = new URLSearchParams(window.location.search);
        
        // Primary safety flags - default to safer values during development
        this.FX_ENABLED = this.getFlag(urlParams, 'fx', 'FX_ENABLED', true);
        this.TEXT_EFFECTS_ENABLED = this.getFlag(urlParams, 'text', 'TEXT_EFFECTS_ENABLED', true); // ENABLED by default
        this.PERF_SAFE_MODE = this.getFlag(urlParams, 'safe', 'PERF_SAFE_MODE', false);
        this.DOM_MONITORING = this.getFlag(urlParams, 'dom', 'DOM_MONITORING', true);
        
        // Fine-grained effect controls
        this.CHROMA_ENABLED = this.getFlag(urlParams, 'chroma', 'CHROMA_ENABLED', true);
        this.SPOTLIGHT_ENABLED = this.getFlag(urlParams, 'spotlight', 'SPOTLIGHT_ENABLED', true);
        this.SHIMMER_ENABLED = this.getFlag(urlParams, 'shimmer', 'SHIMMER_ENABLED', true);
        this.MATRIX_RAIN_ENABLED = this.getFlag(urlParams, 'matrix', 'MATRIX_RAIN_ENABLED', true); // Enable by default for visual parity
        this.TEXT_SCRAMBLE_ENABLED = this.getFlag(urlParams, 'scramble', 'TEXT_SCRAMBLE_ENABLED', true); // Enabled by default
        this.DATA_CORRUPTION_ENABLED = this.getFlag(urlParams, 'corruption', 'DATA_CORRUPTION_ENABLED', false); // DOM bloat
        // Animation group switches (gate heavy DOM effects)
        this.EXTENDED_ANIMATIONS_ENABLED = this.getFlag(urlParams, 'extanim', 'EXTENDED_ANIMATIONS_ENABLED', false); // DISABLED by default - causes DOM explosion
        this.RANDOM_ANIMATIONS_ENABLED = this.getFlag(urlParams, 'randanim', 'RANDOM_ANIMATIONS_ENABLED', false);  // DISABLED by default - causes DOM explosion
        
        // Performance limits
        this.MAX_CONCURRENT_FX = parseInt(urlParams.get('maxfx') || localStorage.getItem('MAX_CONCURRENT_FX') || '6');
        this.MAX_DOM_NODES_GROWTH = parseInt(urlParams.get('maxdom') || localStorage.getItem('MAX_DOM_NODES_GROWTH') || '300');
        this.MEMORY_WARNING_MB = parseInt(urlParams.get('maxmem') || localStorage.getItem('MEMORY_WARNING_MB') || '500');
        
        // Debug flags
        this.DEBUG_FX = this.getFlag(urlParams, 'debugfx', 'DEBUG_FX', false);
        this.DEBUG_PERFORMANCE = this.getFlag(urlParams, 'debugperf', 'DEBUG_PERFORMANCE', false);
        
        this.logConfig();
    }
    
    getFlag(urlParams, urlKey, storageKey, defaultValue) {
        // URL params take precedence, then localStorage, then default
        if (urlParams.has(urlKey)) {
            const value = urlParams.get(urlKey);
            return value === 'true' || value === '1' || value === 'on';
        }
        
        const stored = localStorage.getItem(storageKey);
        if (stored !== null) {
            return stored === 'true';
        }
        
        return defaultValue;
    }
    
    setFlag(key, value) {
        this[key] = value;
        localStorage.setItem(key, String(value));
        console.log(`🚩 Feature flag updated: ${key} = ${value}`);
    }
    
    logConfig() {
        console.log('🚩 Safe Feature Flags Configuration:');
        console.log('  Core Systems:');
        console.log(`    FX_ENABLED: ${this.FX_ENABLED}`);
        console.log(`    TEXT_EFFECTS_ENABLED: ${this.TEXT_EFFECTS_ENABLED}`);
        console.log(`    PERF_SAFE_MODE: ${this.PERF_SAFE_MODE}`);
        console.log('  Individual Effects:');
        console.log(`    CHROMA_ENABLED: ${this.CHROMA_ENABLED}`);
        console.log(`    SPOTLIGHT_ENABLED: ${this.SPOTLIGHT_ENABLED}`);
        console.log(`    SHIMMER_ENABLED: ${this.SHIMMER_ENABLED}`);
        console.log(`    MATRIX_RAIN_ENABLED: ${this.MATRIX_RAIN_ENABLED}`);
        console.log(`    TEXT_SCRAMBLE_ENABLED: ${this.TEXT_SCRAMBLE_ENABLED}`);
        console.log(`    DATA_CORRUPTION_ENABLED: ${this.DATA_CORRUPTION_ENABLED}`);
        console.log(`    EXTENDED_ANIMATIONS_ENABLED: ${this.EXTENDED_ANIMATIONS_ENABLED}`);
        console.log(`    RANDOM_ANIMATIONS_ENABLED: ${this.RANDOM_ANIMATIONS_ENABLED}`);
        console.log('  Performance Limits:');
        console.log(`    MAX_CONCURRENT_FX: ${this.MAX_CONCURRENT_FX}`);
        console.log(`    MAX_DOM_NODES_GROWTH: ${this.MAX_DOM_NODES_GROWTH}`);
        console.log(`    MEMORY_WARNING_MB: ${this.MEMORY_WARNING_MB}`);
        
        // Show override instructions
        console.log('');
        console.log('🎛️  To enable text effects: ?text=1');
        console.log('🎛️  To enable all: ?fx=1&text=1&matrix=1&scramble=1&corruption=1');
        console.log('🎛️  To debug: ?debugfx=1&debugperf=1');
    }
    
    // Quick checks
    shouldEnableEffect(effectName) {
        if (!this.FX_ENABLED) return false;
        
        switch (effectName.toLowerCase()) {
            case 'chroma': return this.CHROMA_ENABLED;
            case 'spotlight': return this.SPOTLIGHT_ENABLED;
            case 'shimmer': return this.SHIMMER_ENABLED;
            case 'matrix': return this.MATRIX_RAIN_ENABLED;
            case 'scramble': return this.TEXT_SCRAMBLE_ENABLED;
            case 'corruption': return this.DATA_CORRUPTION_ENABLED;
            default: return true; // Unknown effects are enabled by default
        }
    }
    
    // Emergency shutdown
    emergencyDisable() {
        console.warn('🚨 Emergency shutdown of all effects');
        this.FX_ENABLED = false;
        this.TEXT_EFFECTS_ENABLED = false;
        this.PERF_SAFE_MODE = true;
        
        // Disable all individual effects
        this.CHROMA_ENABLED = false;
        this.SPOTLIGHT_ENABLED = false;
        this.SHIMMER_ENABLED = false;
        this.MATRIX_RAIN_ENABLED = false;
        this.TEXT_SCRAMBLE_ENABLED = false;
        this.DATA_CORRUPTION_ENABLED = false;
        
        // Emit event for other systems to respond
        window.dispatchEvent(new CustomEvent('fx:emergency-shutdown'));
    }
}

// Create global instance
const safeFeatureFlags = new SafeFeatureFlags();

// Make it globally available
window.safeFeatureFlags = safeFeatureFlags;
window.SAFE_FLAGS = safeFeatureFlags; // Shorter alias

// Expose control functions globally for debugging
window.enableTextEffects = () => safeFeatureFlags.setFlag('TEXT_EFFECTS_ENABLED', true);
window.disableTextEffects = () => safeFeatureFlags.setFlag('TEXT_EFFECTS_ENABLED', false);
window.emergencyStop = () => safeFeatureFlags.emergencyDisable();

export default safeFeatureFlags;