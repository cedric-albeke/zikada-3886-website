// Performance Configuration and Feature Flags
// Centralized control for debugging and performance tuning

class PerfConfig {
    constructor() {
        this.isDebugEnabled = this.checkDebugMode();
        this.flags = this.initializeFlags();
        
        if (this.isDebugEnabled) {
            console.log('🔬 Debug mode enabled - performance monitoring active');
            this.exposeDebugAPI();
        }
        
        // Performance counters for monitoring
        this.counters = {
            animations: 0,
            intervals: 0,
            domNodes: 0,
            lottieInstances: 0,
            fps: 60,
            lastUpdate: Date.now()
        };
        
        // Make counters globally accessible
        if (typeof window !== 'undefined') {
            window.__perf = this.counters;
        }
    }
    
    checkDebugMode() {
        try {
            // Check URL parameter first
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('debug') === '1') {
                localStorage.setItem('3886:debug', '1');
                return true;
            }
            
            // Check localStorage
            return localStorage.getItem('3886:debug') === '1';
        } catch (e) {
            return false;
        }
    }
    
    initializeFlags() {
        const defaults = {
            // Animation controls
            enableHeavyAnimations: !this.isDebugEnabled, // Conservative in debug mode
            enableLottie: true,
            enableTextScramble: true,
            enableBackgroundGlow: true,
            enableMatrixRain: true,
            enableDataCorruption: false, // Known performance hog
            
            // Performance limits
            maxActiveAnimations: this.isDebugEnabled ? 24 : 48,
            maxIntervalsGlobal: this.isDebugEnabled ? 12 : 24,
            maxIntervalsPerOwner: 4,
            maxDomGrowthPercent: 15,
            
            // Emergency handling
            enableSoftDegrade: true,
            enableEmergencyRestart: false, // Prefer soft degrade
            emergencyRestartBackoffMs: 60000,
            
            // Visibility optimizations
            pauseOnHidden: true,
            pauseOffscreen: true,
            
            // Debug features
            showDebugPanel: this.isDebugEnabled,
            logPerformanceEvents: this.isDebugEnabled,
            assertStableDom: this.isDebugEnabled
        };
        
        // Allow URL overrides for testing
        const urlParams = new URLSearchParams(window.location.search);
        Object.keys(defaults).forEach(key => {
            const paramValue = urlParams.get(key);
            if (paramValue !== null) {
                if (paramValue === 'true' || paramValue === '1') {
                    defaults[key] = true;
                } else if (paramValue === 'false' || paramValue === '0') {
                    defaults[key] = false;
                } else if (!isNaN(paramValue)) {
                    defaults[key] = parseInt(paramValue, 10);
                }
            }
        });
        
        return defaults;
    }
    
    exposeDebugAPI() {
        window.__3886Debug = {
            config: this,
            flags: this.flags,
            counters: this.counters,
            
            // Quick toggles
            enableDebug: () => {
                localStorage.setItem('3886:debug', '1');
                console.log('🔬 Debug mode enabled - reload to take effect');
            },
            
            disableDebug: () => {
                localStorage.removeItem('3886:debug');
                console.log('🔬 Debug mode disabled - reload to take effect');
            },
            
            dumpCounters: () => {
                console.table(this.counters);
                return this.counters;
            },
            
            setFlag: (name, value) => {
                if (name in this.flags) {
                    this.flags[name] = value;
                    console.log(`🚩 Flag ${name} set to ${value}`);
                    this.notifyFlagChange(name, value);
                } else {
                    console.warn(`⚠️ Unknown flag: ${name}`);
                }
            },
            
            // Emergency controls
            emergencyStop: () => {
                console.log('🛑 Emergency stop requested');
                window.dispatchEvent(new CustomEvent('perf:emergency-stop'));
            },
            
            softDegrade: () => {
                console.log('📉 Soft degrade requested');
                window.dispatchEvent(new CustomEvent('perf:soft-degrade'));
            },
            
            restore: () => {
                console.log('📈 Performance restore requested');
                window.dispatchEvent(new CustomEvent('perf:restore'));
            }
        };
        
        console.log('🔬 Debug API exposed as window.__3886Debug');
    }
    
    notifyFlagChange(name, value) {
        window.dispatchEvent(new CustomEvent('perf:flag-changed', {
            detail: { name, value }
        }));
    }
    
    updateCounter(name, value) {
        if (name in this.counters) {
            this.counters[name] = value;
            this.counters.lastUpdate = Date.now();
        }
    }
    
    incrementCounter(name) {
        if (name in this.counters) {
            this.counters[name]++;
            this.counters.lastUpdate = Date.now();
        }
    }
    
    decrementCounter(name) {
        if (name in this.counters) {
            this.counters[name] = Math.max(0, this.counters[name] - 1);
            this.counters.lastUpdate = Date.now();
        }
    }
    
    // Utility methods for modules
    isFeatureEnabled(featureName) {
        return this.flags[featureName] === true;
    }
    
    getLimit(limitName) {
        return this.flags[limitName] || 0;
    }
    
    shouldLog(category = 'general') {
        return this.isDebugEnabled && this.flags.logPerformanceEvents;
    }
}

// Create global instance
const perfConfig = new PerfConfig();

// Make it globally available with multiple aliases for compatibility
if (typeof window !== 'undefined') {
    window.perfConfig = perfConfig;
    window.PERF_CONFIG = perfConfig;
    window.FLAGS = perfConfig.flags;
}

export default perfConfig;