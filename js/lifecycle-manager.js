// Lifecycle Manager - Handles page lifecycle events and cleanup
// This system manages memory pressure, visibility changes, and cleanup scheduling

class LifecycleManager {
    constructor() {
        this.isVisible = !document.hidden;
        this.isPaused = false;
        this.cleanupScheduled = false;
        this.idleCleanupId = null;
        this.visibilityTimeouts = new Map();
        
        // Memory pressure thresholds
        this.memoryThresholds = {
            warning: 100 * 1024 * 1024,   // 100MB
            critical: 200 * 1024 * 1024   // 200MB
        };
        
        this.setupLifecycleListeners();
        this.scheduleIdleCleanup();
        
        console.log('🔄 Lifecycle Manager initialized');
    }
    
    setupLifecycleListeners() {
        // Visibility change handling
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
        
        // Page blur/focus
        window.addEventListener('blur', () => {
            this.handlePageBlur();
        });
        
        window.addEventListener('focus', () => {
            this.handlePageFocus();
        });
        
        // Page unload events
        window.addEventListener('pagehide', () => {
            this.performGlobalCleanup('pagehide');
        });
        
        window.addEventListener('beforeunload', () => {
            this.performGlobalCleanup('beforeunload');
        });
        
        // Memory pressure events (if supported)
        if ('memory' in performance && 'addEventListener' in performance.memory) {
            try {
                performance.addEventListener('memorypressure', (event) => {
                    this.handleMemoryPressure(event.detail.level);
                });
            } catch (e) {
                // Memory pressure events not supported, use fallback
                console.log('📊 Memory pressure events not supported, using periodic monitoring');
            }
        }
        
        console.log('🎧 Lifecycle event listeners attached');
    }
    
    handleVisibilityChange() {
        const wasVisible = this.isVisible;
        this.isVisible = !document.hidden;
        
        console.log(`👁️ Visibility changed: ${this.isVisible ? 'visible' : 'hidden'}`);
        
        if (!this.isVisible && wasVisible) {
            // Page became hidden - pause animations and schedule cleanup
            this.handlePageHidden();
        } else if (this.isVisible && !wasVisible) {
            // Page became visible - resume animations
            this.handlePageVisible();
        }
    }
    
    handlePageHidden() {
        console.log('🙈 Page hidden - pausing animations and scheduling cleanup');
        
        // Pause animations through global event
        window.dispatchEvent(new CustomEvent('lifecycle:pause-animations'));
        
        // Schedule cleanup after a delay to avoid rapid on/off cycles
        const cleanupTimeout = setTimeout(() => {
            this.performGlobalCleanup('visibility-hidden');
        }, 5000); // Wait 5 seconds before cleanup
        
        this.visibilityTimeouts.set('cleanup', cleanupTimeout);
        this.isPaused = true;
    }
    
    handlePageVisible() {
        console.log('👀 Page visible - resuming animations');
        
        // Cancel any pending cleanup
        if (this.visibilityTimeouts.has('cleanup')) {
            clearTimeout(this.visibilityTimeouts.get('cleanup'));
            this.visibilityTimeouts.delete('cleanup');
        }
        
        // Resume animations through global event
        window.dispatchEvent(new CustomEvent('lifecycle:resume-animations'));
        this.isPaused = false;
    }
    
    handlePageBlur() {
        console.log('🔲 Page blurred - reducing activity');
        // Reduce animation intensity but don't fully pause
        window.dispatchEvent(new CustomEvent('lifecycle:reduce-activity'));
    }
    
    handlePageFocus() {
        console.log('🔳 Page focused - resuming activity');
        // Resume full activity
        window.dispatchEvent(new CustomEvent('lifecycle:resume-activity'));
    }
    
    handleMemoryPressure(level) {
        console.warn(`⚠️ Memory pressure detected: ${level}`);
        
        switch (level) {
            case 'low':
                this.performLightCleanup();
                break;
            case 'moderate':
                this.performModerateCleanup();
                break;
            case 'critical':
                this.performAggressiveCleanup();
                break;
        }
    }
    
    performGlobalCleanup(reason = 'manual') {
        if (this.cleanupScheduled) {
            console.log('🧹 Cleanup already in progress, skipping');
            return;
        }
        
        this.cleanupScheduled = true;
        console.log(`🧹 Performing global cleanup - reason: ${reason}`);
        
        const results = {
            timers: { intervals: 0, timeouts: 0, raf: 0 },
            elements: { removed: 0, remaining: 0 },
            memory: null
        };
        
        try {
            // Cleanup intervals and timers
            if (window.intervalManager && typeof window.intervalManager.cleanup === 'function') {
                results.timers = window.intervalManager.cleanup();
            }
            
            // Cleanup DOM elements
            if (window.performanceElementManager && typeof window.performanceElementManager.purge === 'function') {
                const purgeResult = window.performanceElementManager.purge();
                results.elements = { 
                    removed: purgeResult,
                    remaining: window.performanceElementManager.trackedElements?.size || 0
                };
            }
            
            // Memory info if available
            if (performance.memory) {
                results.memory = {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                };
            }
            
            console.info(`[cleanup] ${reason}:`, results);
            
        } catch (error) {
            console.error('Cleanup failed:', error);
        } finally {
            this.cleanupScheduled = false;
        }
        
        return results;
    }
    
    performLightCleanup() {
        console.log('🧽 Performing light cleanup');
        
        // Clean up only stale elements (older than 5 minutes)
        if (window.performanceElementManager && typeof window.performanceElementManager.purge === 'function') {
            const ageThreshold = 5 * 60 * 1000; // 5 minutes
            const cleanedElements = [];
            
            window.performanceElementManager.trackedElements?.forEach(element => {
                const metadata = window.performanceElementManager.elementMetadata?.get(element);
                if (metadata && (Date.now() - metadata.trackedAt) > ageThreshold) {
                    cleanedElements.push(element);
                }
            });
            
            cleanedElements.forEach(element => {
                window.performanceElementManager.untrack(element);
                if (element.parentNode) element.remove();
            });
            
            console.log(`🧽 Light cleanup: ${cleanedElements.length} stale elements removed`);
        }
    }
    
    performModerateCleanup() {
        console.log('🧼 Performing moderate cleanup');
        
        // Clean up elements older than 2 minutes and perform some timer cleanup
        if (window.performanceElementManager) {
            window.performanceElementManager.purge();
        }
        
        if (window.intervalManager && window.intervalManager.performAutoCleanup) {
            window.intervalManager.performAutoCleanup();
        }
    }
    
    performAggressiveCleanup() {
        console.log('🚨 Performing aggressive cleanup');
        
        // Trigger emergency cleanup in all systems
        this.performGlobalCleanup('memory-pressure-critical');
        
        // Pause all non-essential animations
        window.dispatchEvent(new CustomEvent('lifecycle:emergency-pause'));
    }
    
    scheduleIdleCleanup() {
        const performIdleCleanup = (deadline) => {
            if (!this.isVisible) {
                // Only perform cleanup if page is hidden to avoid interrupting user experience
                const budget = deadline?.timeRemaining() || 5;
                if (budget > 2) {
                    this.performLightCleanup();
                }
            }
            
            // Schedule next idle cleanup
            this.idleCleanupId = requestIdleCallback(performIdleCleanup, { timeout: 30000 });
        };
        
        // Start idle cleanup cycle
        if (typeof requestIdleCallback === 'function') {
            this.idleCleanupId = requestIdleCallback(performIdleCleanup, { timeout: 30000 });
            console.log('⏳ Idle cleanup scheduled');
        } else {
            // Fallback for browsers without requestIdleCallback
            setInterval(() => {
                if (!this.isVisible) {
                    this.performLightCleanup();
                }
            }, 30000);
            console.log('⏳ Fallback cleanup scheduled (30s intervals)');
        }
    }
    
    getStats() {
        return {
            isVisible: this.isVisible,
            isPaused: this.isPaused,
            cleanupScheduled: this.cleanupScheduled,
            activeTimeouts: this.visibilityTimeouts.size,
            memoryThresholds: this.memoryThresholds
        };
    }
    
    destroy() {
        // Cancel idle cleanup
        if (this.idleCleanupId) {
            if (typeof cancelIdleCallback === 'function') {
                cancelIdleCallback(this.idleCleanupId);
            }
        }
        
        // Clear all timeouts
        this.visibilityTimeouts.forEach(timeout => clearTimeout(timeout));
        this.visibilityTimeouts.clear();
        
        console.log('🔄 Lifecycle Manager destroyed');
    }
}

// Create and expose global instance
window.lifecycleManager = new LifecycleManager();

export default LifecycleManager;