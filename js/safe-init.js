// Safe initialization script that replaces problematic components
import SafeTextEffects from './text-effects-safe.js';
import SafePerformanceElementManager from './performance-element-manager-safe.js';

// Initialize safe managers
let safeTextEffects = null;
let safePerformanceManager = null;

function initSafeManagers() {
    console.log('🔧 Initializing safe managers...');
    
    try {
        // Initialize safe performance manager first
        safePerformanceManager = new SafePerformanceElementManager();
        window.performanceElementManager = safePerformanceManager;
        console.log('✅ Safe PerformanceElementManager initialized');
        
        // Initialize safe text effects
        safeTextEffects = new SafeTextEffects();
        window.safeTextEffects = safeTextEffects;
        
        // Initialize text effects if feature flags allow
        if (window.SAFE_FLAGS?.TEXT_EFFECTS_ENABLED) {
            safeTextEffects.init();
            console.log('✅ Safe TextEffects initialized');
        } else {
            console.log('💤 TextEffects disabled by feature flags');
        }
        
        // Add global debug utilities
        window.debugSafeManagers = {
            purgeAll: () => {
                const purged = safePerformanceManager.purge();
                console.log(`🧹 Purged ${purged} elements`);
                return purged;
            },
            emergencyCleanup: () => {
                const cleaned = safePerformanceManager.emergencyCleanup();
                console.log(`🚨 Emergency cleanup removed ${cleaned} elements`);
                return cleaned;
            },
            getStats: () => {
                const stats = safePerformanceManager.getStats();
                console.table(stats);
                return stats;
            },
            getTrackedElements: () => {
                const elements = safePerformanceManager.getTrackedElements();
                console.log('📊 Tracked elements:', elements);
                return elements;
            },
            resetTextEffects: () => {
                if (safeTextEffects) {
                    safeTextEffects.destroy();
                    safeTextEffects = new SafeTextEffects();
                    safeTextEffects.init();
                    console.log('🔄 TextEffects reset');
                }
            },
            destroyAll: () => {
                if (safeTextEffects) {
                    safeTextEffects.destroy();
                    safeTextEffects = null;
                }
                if (safePerformanceManager) {
                    safePerformanceManager.destroy();
                    safePerformanceManager = null;
                }
                console.log('🧹 All safe managers destroyed');
            },
            toggleFeatureFlag: (flag, value) => {
                if (window.SAFE_FLAGS) {
                    window.SAFE_FLAGS[flag] = value;
                    console.log(`🚩 Feature flag ${flag} set to ${value}`);
                    
                    // Reinitialize text effects if needed
                    if (flag === 'TEXT_EFFECTS_ENABLED' && safeTextEffects) {
                        safeTextEffects.destroy();
                        safeTextEffects = new SafeTextEffects();
                        if (value) {
                            safeTextEffects.init();
                        }
                    }
                }
            }
        };
        
        console.log('✅ Safe managers initialization complete');
        console.log('💡 Debug utilities available at window.debugSafeManagers');
        
        // Add periodic health checks
        setInterval(() => {
            if (window.SAFE_FLAGS?.DEBUG_FX) {
                const stats = safePerformanceManager.getStats();
                if (stats.currentTracked > 100) {
                    console.warn(`⚠️ High element count: ${stats.currentTracked} tracked elements`);
                }
                
                if (stats.performanceState !== 'optimal') {
                    console.warn(`⚠️ Performance state: ${stats.performanceState}`);
                }
            }
        }, 60000); // Check every minute
        
    } catch (error) {
        console.error('❌ Error initializing safe managers:', error);
        
        // Fallback: create minimal performance manager to prevent crashes
        if (!window.performanceElementManager) {
            window.performanceElementManager = {
                track: () => {},
                untrack: () => {},
                purge: () => 0,
                emergencyCleanup: () => 0,
                removeOrphanedElements: () => 0
            };
            console.log('⚠️ Created fallback performance manager');
        }
    }
}

// Replace problematic original components if they exist
function replaceProblematicComponents() {
    console.log('🔧 Replacing problematic components...');
    
    // Disable original text effects if they exist
    if (window.textEffects && typeof window.textEffects.destroy === 'function') {
        try {
            window.textEffects.destroy();
            console.log('🧹 Destroyed original TextEffects');
        } catch (error) {
            console.warn('⚠️ Error destroying original TextEffects:', error);
        }
    }
    
    // Replace original performance element manager
    if (window.performanceElementManager && window.performanceElementManager !== safePerformanceManager) {
        try {
            if (typeof window.performanceElementManager.destroy === 'function') {
                window.performanceElementManager.destroy();
            }
            console.log('🧹 Destroyed original PerformanceElementManager');
        } catch (error) {
            console.warn('⚠️ Error destroying original PerformanceElementManager:', error);
        }
    }
    
    // Clear any problematic intervals that might be running
    const highestIntervalId = setInterval(() => {}, 0);
    for (let i = 0; i < highestIntervalId; i++) {
        try {
            clearInterval(i);
        } catch (e) {
            // Ignore errors
        }
    }
    clearInterval(highestIntervalId);
    console.log('🧹 Cleared potential problematic intervals');
    
    // Cancel all animation frames
    const highestRAFId = requestAnimationFrame(() => {});
    for (let i = 0; i < highestRAFId; i++) {
        try {
            cancelAnimationFrame(i);
        } catch (e) {
            // Ignore errors
        }
    }
    cancelAnimationFrame(highestRAFId);
    console.log('🧹 Cancelled potential problematic animation frames');
}

// Initialize everything when DOM is ready
function initWhenReady() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initSafeManagers();
            replaceProblematicComponents();
        });
    } else {
        initSafeManagers();
        replaceProblematicComponents();
    }
}

// Emergency stop function
window.emergencyStop = function() {
    console.log('🚨 EMERGENCY STOP ACTIVATED');
    
    // Stop all safe managers
    if (window.debugSafeManagers) {
        window.debugSafeManagers.destroyAll();
    }
    
    // Clear all intervals
    const highestIntervalId = setInterval(() => {}, 0);
    for (let i = 0; i < highestIntervalId; i++) {
        clearInterval(i);
    }
    clearInterval(highestIntervalId);
    
    // Cancel all animation frames
    const highestRAFId = requestAnimationFrame(() => {});
    for (let i = 0; i < highestRAFId; i++) {
        cancelAnimationFrame(i);
    }
    cancelAnimationFrame(highestRAFId);
    
    // Kill all GSAP animations
    if (window.gsap) {
        window.gsap.killTweensOf("*");
        console.log('🛑 Killed all GSAP animations');
    }
    
    // Set emergency feature flags
    if (window.SAFE_FLAGS) {
        window.SAFE_FLAGS.emergencyStop();
    }
    
    console.log('✅ Emergency stop complete');
};

// Start initialization
initWhenReady();

console.log('🚀 Safe initialization script loaded');

export { initSafeManagers, replaceProblematicComponents };