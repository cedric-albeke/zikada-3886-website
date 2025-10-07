// Emergency Cleanup Script - Immediate performance fix
// Run this to clean up existing performance issues

import gsap from 'gsap';

class EmergencyCleanup {
    constructor() {
        this.isRunning = false;
        console.log('🚨 Emergency Cleanup System loaded');
    }

    /**
     * Execute immediate emergency cleanup
     */
    executeEmergencyCleanup() {
        if (this.isRunning) {
            console.log('⚠️ Emergency cleanup already running');
            return;
        }

        this.isRunning = true;
        console.log('🚨 EXECUTING EMERGENCY CLEANUP...');

        // 1. Kill only non-essential GSAP animations
        console.log('🗑️ Killing non-essential GSAP animations...');
        if (window.earlyGSAPRegistry) {
            window.earlyGSAPRegistry.emergencyStop(); // This now preserves essential animations
        } else {
            // Fallback: kill animations on temporary elements only
            const temporarySelectors = [
                '.matrix-overlay', '.vhs-overlay', '.flash-overlay', 
                '.phase-overlay', '.glitch-overlay', '[data-perf-id]'
            ];
            temporarySelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => gsap.killTweensOf(el));
            });
        }

        // 2. Remove problematic DOM elements
        console.log('🗑️ Removing problematic DOM elements...');
        this.removeProblemElements();

        // 3. Clear all intervals
        console.log('🗑️ Clearing all intervals...');
        this.clearAllIntervals();

        // 4. Force garbage collection
        console.log('🗑️ Forcing garbage collection...');
        if (window.gc) {
            window.gc();
        }

        // 5. Reset CSS filters via filter-manager
        console.log('🗑️ Resetting CSS filters...');
        if (window.filterManager) {
            window.filterManager.reset();
        } else {
            // Fallback if filter-manager not available
            document.body.style.filter = 'none';
        }
        document.body.style.transform = 'none';

        // 6. Restart with conservative settings
        console.log('🔄 Restarting with conservative settings...');
        setTimeout(() => {
            this.restartConservative();
            this.isRunning = false;
        }, 2000);

        console.log('✅ Emergency cleanup completed');
    }

    /**
     * Remove problematic DOM elements
     */
    removeProblemElements() {
        const problematicSelectors = [
            'div[style*="position: fixed"]',
            'canvas[style*="position: fixed"]',
            '.matrix-overlay',
            '.vhs-overlay', 
            '.flash-overlay',
            '.warp-effect',
            '.phase-overlay',
            '.glitch-overlay',
            '.energy-field',
            '.quantum-particles',
            '.data-streams',
            '.holographic-shimmer',
            '.chromatic-pulse',
            '.scanlines',
            'div[style*="z-index: 999"]',
            'div[style*="z-index: 1000"]',
            '[data-perf-id]',
            '.perf-managed'
        ];

        let removedCount = 0;
        
        problematicSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                // Skip essential elements
                if (el.id === 'chaos-canvas' || 
                    el.classList.contains('pre-loader') ||
                    el.classList.contains('control-panel') ||
                    el.classList.contains('matrix-blackout') ||
                    el.classList.contains('matrix-messages') ||
                    el.querySelector('.logo-text') ||
                    el.querySelector('.image-2')) {
                    return;
                }
                
                try {
                    if (el.parentNode) {
                        el.parentNode.removeChild(el);
                        removedCount++;
                    }
                } catch (e) {
                    // Silent fail
                }
            });
        });

        console.log(`🗑️ Removed ${removedCount} problematic DOM elements`);
    }

    /**
     * Clear all intervals (brute force)
     */
    clearAllIntervals() {
        // Clear intervals by ID (brute force method)
        let cleared = 0;
        for (let i = 1; i < 10000; i++) {
            try {
                clearInterval(i);
                cleared++;
            } catch (e) {
                // Silent fail
            }
        }
        console.log(`🗑️ Attempted to clear ${cleared} potential intervals`);
    }

    /**
     * Restart with conservative settings
     */
    restartConservative() {
        // Reset chaos engine if available
        if (window.chaosInit) {
            window.chaosInit.phaseRunning = false;
            
            // Set conservative performance mode
            if (window.chaosInit.setPerformanceMode) {
                window.chaosInit.setPerformanceMode('low');
            }
        }

        // Disable heavy effects temporarily
        this.disableHeavyEffects();

        console.log('🔄 Conservative restart completed');
    }

    /**
     * Disable heavy effects temporarily (but preserve essential animations)
     */
    disableHeavyEffects() {
        // Remove existing emergency limits first
        const existingStyle = document.getElementById('emergency-performance-limits');
        if (existingStyle) existingStyle.remove();
        
        // Add targeted performance-limiting CSS
        const perfStyle = document.createElement('style');
        perfStyle.id = 'emergency-performance-limits';
        perfStyle.textContent = `
            /* Emergency performance limits - target only heavy effects */
            .quantum-particles { display: none !important; }
            .holographic-shimmer { display: none !important; }
            .chromatic-pulse { opacity: 0.001 !important; }
            .energy-field { display: none !important; }
            
            /* Reduce static noise but keep some */
            #static-noise { opacity: 0.005 !important; }
            
            /* Keep data streams but reduce opacity */
            .data-streams { opacity: 0.3 !important; }
            
            /* PRESERVE essential animations */
            .scanlines { display: block !important; opacity: 0.001 !important; }
            .logo-text, .image-wrapper, .bg { animation-play-state: running !important; }
            #cyber-grid { display: block !important; opacity: 0.002 !important; }
            
            /* Reduce complexity of temporary effects only */
            .matrix-overlay, .vhs-overlay, .flash-overlay {
                animation-duration: 1s !important;
                transition-duration: 0.2s !important;
            }
        `;
        
        document.head.appendChild(perfStyle);
        
        console.log('🔧 Heavy effects reduced while preserving essential animations');
    }

    /**
     * Get current performance status
     */
    getPerformanceStatus() {
        const domNodes = document.querySelectorAll('*').length;
        const problematicElements = document.querySelectorAll('div[style*="position: fixed"], canvas[style*="position: fixed"]').length;
        
        return {
            domNodes: domNodes,
            problematicElements: problematicElements,
            gsapAnimations: this.animations ? this.animations.size : 0,
            memoryUsage: performance.memory ? performance.memory.usedJSHeapSize : 0
        };
    }

    /**
     * Monitor and auto-cleanup
     */
    startAutoMonitoring() {
        setInterval(() => {
            const status = this.getPerformanceStatus();
            
            // Auto-trigger emergency cleanup if performance is critical
            if (status.problematicElements > 100 || status.domNodes > 2000) {
                console.log('🚨 Auto-triggering emergency cleanup due to critical performance');
                this.executeEmergencyCleanup();
            }
        }, 30000); // Check every 30 seconds
    }
}

// Create global instance
const emergencyCleanup = new EmergencyCleanup();

// Make it globally accessible
window.emergencyCleanup = emergencyCleanup;

// Start monitoring
emergencyCleanup.startAutoMonitoring();

// Add global cleanup function
window.EMERGENCY_CLEANUP = () => emergencyCleanup.executeEmergencyCleanup();

console.log('🚨 Emergency cleanup system ready. Use window.EMERGENCY_CLEANUP() for immediate cleanup');

export default emergencyCleanup;