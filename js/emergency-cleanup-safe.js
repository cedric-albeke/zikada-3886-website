// Emergency Cleanup Utility - Immediate Runaway Effects Shutdown
// This script can be run at any time to immediately stop all problematic systems

class EmergencyCleanup {
    constructor() {
        this.cleanupOperations = [];
        this.originalIntervalCount = 0;
        this.originalRAFCount = 0;
        this.isEmergencyMode = false;
        
        console.log('🚨 Emergency Cleanup utility loaded');
    }
    
    // IMMEDIATE SHUTDOWN - stops everything running
    emergencyStop() {
        console.log('🚨🚨🚨 EMERGENCY STOP ACTIVATED 🚨🚨🚨');
        this.isEmergencyMode = true;
        
        let totalCleaned = 0;
        const startTime = performance.now();
        
        // 1. Stop all intervals
        totalCleaned += this.clearAllIntervals();
        
        // 2. Stop all animation frames
        totalCleaned += this.clearAllAnimationFrames();
        
        // 3. Kill all GSAP animations
        totalCleaned += this.killAllGSAPAnimations();
        
        // 4. Purge problematic DOM elements
        totalCleaned += this.purgeProblematicElements();
        
        // 5. Stop existing performance managers if broken
        totalCleaned += this.stopBrokenManagers();
        
        // 6. Disable feature flags
        this.disableAllFeatureFlags();
        
        // 7. Force garbage collection if available
        this.forceGarbageCollection();
        
        const elapsed = performance.now() - startTime;
        
        console.log(`🚨 EMERGENCY STOP COMPLETE:`)
        console.log(`   - Time taken: ${elapsed.toFixed(2)}ms`)
        console.log(`   - Operations: ${totalCleaned}`)
        console.log(`   - DOM nodes now: ${document.querySelectorAll('*').length}`)
        
        // Emit global event
        window.dispatchEvent(new CustomEvent('emergency-stop-complete', {
            detail: { operations: totalCleaned, timeMs: elapsed }
        }));
        
        return { operations: totalCleaned, timeMs: elapsed };
    }
    
    clearAllIntervals() {
        console.log('⏹️ Clearing all intervals...');
        let clearedCount = 0;
        
        // Get the highest interval ID by creating one and immediately clearing it
        const highestId = setInterval(() => {}, 0);
        clearInterval(highestId);
        
        // Clear all intervals from 1 to the highest ID
        for (let i = 1; i <= highestId; i++) {
            try {
                clearInterval(i);
                clearedCount++;
            } catch (e) {
                // Ignore errors for already cleared intervals
            }
        }
        
        console.log(`⏹️ Cleared ${clearedCount} intervals`);
        return clearedCount;
    }
    
    clearAllAnimationFrames() {
        console.log('⏹️ Cancelling all animation frames...');
        let clearedCount = 0;
        
        // Get the highest RAF ID
        const highestId = requestAnimationFrame(() => {});
        cancelAnimationFrame(highestId);
        
        // Cancel all animation frames from 1 to the highest ID
        for (let i = 1; i <= highestId; i++) {
            try {
                cancelAnimationFrame(i);
                clearedCount++;
            } catch (e) {
                // Ignore errors
            }
        }
        
        console.log(`⏹️ Cancelled ${clearedCount} animation frames`);
        return clearedCount;
    }
    
    killAllGSAPAnimations() {
        console.log('🎬 Killing GSAP animations...');
        let killedCount = 0;
        
        try {
            if (window.gsap) {
                // Kill all tweens
                window.gsap.killTweensOf("*");
                killedCount++;
                
                // Kill all timelines
                if (window.gsap.globalTimeline) {
                    window.gsap.globalTimeline.clear();
                    killedCount++;
                }
                
                console.log('🎬 GSAP animations killed');
            }
        } catch (error) {
            console.warn('⚠️ Error killing GSAP animations:', error);
        }
        
        return killedCount;
    }
    
    purgeProblematicElements() {
        console.log('🧹 Purging problematic DOM elements...');
        let removedCount = 0;
        
        const problematicSelectors = [
            // Text effect elements
            '.scramble-text',
            '.glitch-text',
            '.corruption-block',
            '.glitch-element',
            '.data-corruption-safe',
            
            // Matrix and canvas effects
            '#matrix-rain-safe',
            'canvas:not([data-permanent])',
            '.matrix-char',
            '.matrix-column',
            
            // Performance tracked elements
            '.perf-managed',
            '[data-perf-tracked]',
            '[data-perf-id]',
            
            // Effect containers
            '.effect-element',
            '.particle-element',
            '.overlay-element',
            '[class*="glitch"]',
            '[class*="effect"]',
            '[class*="corruption"]',
            
            // Problematic animations
            '.fade-in-element',
            '.morph-element'
        ];
        
        problematicSelectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    try {
                        // Don't remove permanent elements
                        if (!element.hasAttribute('data-permanent') && 
                            !element.classList.contains('permanent')) {
                            element.remove();
                            removedCount++;
                        }
                    } catch (e) {
                        console.warn(`Error removing element with selector ${selector}:`, e);
                    }
                });
            } catch (e) {
                console.warn(`Invalid selector ${selector}:`, e);
            }
        });
        
        console.log(`🧹 Removed ${removedCount} problematic DOM elements`);
        return removedCount;
    }
    
    stopBrokenManagers() {
        console.log('🛠️ Stopping broken performance managers...');
        let stoppedCount = 0;
        
        // Stop text effects
        try {
            if (window.textEffects && typeof window.textEffects.destroy === 'function') {
                window.textEffects.destroy();
                stoppedCount++;
                console.log('🛠️ Stopped text effects manager');
            }
        } catch (error) {
            console.warn('⚠️ Error stopping text effects:', error);
        }
        
        // Reset performance element manager
        try {
            if (window.performanceElementManager) {
                if (typeof window.performanceElementManager.emergencyCleanup === 'function') {
                    window.performanceElementManager.emergencyCleanup();
                    stoppedCount++;
                    console.log('🛠️ Ran emergency cleanup on performance manager');
                }
            }
        } catch (error) {
            console.warn('⚠️ Error with performance manager cleanup:', error);
        }
        
        return stoppedCount;
    }
    
    disableAllFeatureFlags() {
        console.log('🚩 Disabling all feature flags...');
        
        try {
            if (window.SAFE_FLAGS) {
                window.SAFE_FLAGS.emergencyDisable();
                console.log('🚩 Feature flags disabled via SAFE_FLAGS');
            }
            
            if (window.emergencyStop && typeof window.emergencyStop === 'function') {
                window.emergencyStop();
                console.log('🚩 Global emergency stop called');
            }
            
        } catch (error) {
            console.warn('⚠️ Error disabling feature flags:', error);
        }
    }
    
    forceGarbageCollection() {
        try {
            if (window.gc) {
                window.gc();
                console.log('🗑️ Forced garbage collection');
            }
        } catch (error) {
            // GC not available, ignore
        }
    }
    
    // Get current system state
    getSystemState() {
        const domNodes = document.querySelectorAll('*').length;
        const intervals = this.countActiveIntervals();
        const rafs = this.countActiveRAFs();
        
        return {
            domNodes,
            intervals,
            animationFrames: rafs,
            memoryUsage: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            } : null,
            isEmergencyMode: this.isEmergencyMode
        };
    }
    
    countActiveIntervals() {
        // Approximation - check a reasonable range
        let count = 0;
        const testId = setInterval(() => {}, 100000); // Long delay
        clearInterval(testId);
        
        for (let i = 1; i < testId; i++) {
            const testInterval = setInterval(() => {}, 100000);
            if (testInterval > testId) {
                clearInterval(testInterval);
                count = testId - i;
                break;
            }
            clearInterval(testInterval);
        }
        
        return Math.max(0, count);
    }
    
    countActiveRAFs() {
        // Similar approximation for RAF
        const testId = requestAnimationFrame(() => {});
        cancelAnimationFrame(testId);
        return Math.max(0, testId - 1);
    }
    
    // Diagnostic report
    generateReport() {
        const state = this.getSystemState();
        
        console.log('📊 EMERGENCY CLEANUP DIAGNOSTIC REPORT');
        console.log('=====================================');
        console.log(`DOM Nodes: ${state.domNodes}`);
        console.log(`Active Intervals: ~${state.intervals}`);
        console.log(`Active Animation Frames: ~${state.animationFrames}`);
        
        if (state.memoryUsage) {
            console.log(`Memory Usage: ${state.memoryUsage.used}MB / ${state.memoryUsage.total}MB (Limit: ${state.memoryUsage.limit}MB)`);
        }
        
        console.log(`Emergency Mode: ${state.isEmergencyMode ? 'ACTIVE' : 'INACTIVE'}`);
        console.log('=====================================');
        
        return state;
    }
    
    // Safe restart - enables minimal systems
    safeRestart() {
        console.log('🔄 Safe restart initiated...');
        
        // Re-enable only essential feature flags
        try {
            if (window.SAFE_FLAGS) {
                window.SAFE_FLAGS.FX_ENABLED = true;
                window.SAFE_FLAGS.TEXT_EFFECTS_ENABLED = false; // Keep disabled
                window.SAFE_FLAGS.PERF_SAFE_MODE = true;
                console.log('🔄 Re-enabled essential feature flags in safe mode');
            }
        } catch (error) {
            console.warn('⚠️ Error during safe restart:', error);
        }
        
        this.isEmergencyMode = false;
        console.log('✅ Safe restart complete');
    }
}

// Create global instance
const emergencyCleanup = new EmergencyCleanup();

// Make it globally available
window.emergencyCleanup = emergencyCleanup;
window.EMERGENCY_STOP = () => emergencyCleanup.emergencyStop();
window.EMERGENCY_RESTART = () => emergencyCleanup.safeRestart();
window.EMERGENCY_REPORT = () => emergencyCleanup.generateReport();

// Global emergency hotkey (Ctrl+Shift+E)
document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.shiftKey && event.key === 'E') {
        console.log('🚨 Emergency hotkey pressed!');
        emergencyCleanup.emergencyStop();
        event.preventDefault();
    }
});

// Auto-emergency if DOM grows too large
let lastDOMCount = document.querySelectorAll('*').length;
setInterval(() => {
    const currentDOMCount = document.querySelectorAll('*').length;
    const growth = currentDOMCount - lastDOMCount;
    
    // If DOM grew by more than 1000 nodes in 5 seconds, trigger emergency
    if (growth > 1000 && !emergencyCleanup.isEmergencyMode) {
        console.warn(`🚨 Auto-emergency triggered: DOM grew by ${growth} nodes`);
        emergencyCleanup.emergencyStop();
    }
    
    lastDOMCount = currentDOMCount;
}, 5000);

console.log('🚨 Emergency cleanup utility ready');
console.log('   - Call window.EMERGENCY_STOP() to stop everything');
console.log('   - Call window.EMERGENCY_RESTART() to safely restart');
console.log('   - Call window.EMERGENCY_REPORT() for diagnostics');
console.log('   - Press Ctrl+Shift+E for emergency hotkey');

export default emergencyCleanup;