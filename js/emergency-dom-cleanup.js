// Emergency DOM Cleanup System
// Prevents DOM bloat and implements aggressive cleanup when thresholds exceeded

class EmergencyDOMCleanup {
    constructor() {
        this.CRITICAL_NODE_THRESHOLD = 45000; // Emergency cleanup at 45k nodes
        this.WARNING_NODE_THRESHOLD = 35000;  // Warning at 35k nodes
        this.TARGET_NODE_COUNT = 25000;       // Target after cleanup
        this.MIN_CLEANUP_INTERVAL = 5000;     // Min 5s between cleanups
        
        this.lastCleanupTime = 0;
        this.cleanupCount = 0;
        this.isMonitoring = false;
        this.monitoringInterval = null;
        
        // Track cleanup statistics
        this.stats = {
            totalCleanupsRun: 0,
            nodesRemovedTotal: 0,
            largestCleanup: 0,
            avgNodesBefore: 0,
            avgNodesAfter: 0
        };
        
        console.log('🧹 Emergency DOM Cleanup System initialized');
    }
    
    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        this.monitoringInterval = setInterval(() => {
            this.checkDOMHealth();
        }, 3000); // Check every 3 seconds
        
        console.log('👁️ DOM monitoring started');
    }
    
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.isMonitoring = false;
        console.log('🛑 DOM monitoring stopped');
    }
    
    getCurrentNodeCount() {
        return document.querySelectorAll('*').length;
    }
    
    checkDOMHealth() {
        const nodeCount = this.getCurrentNodeCount();
        const now = Date.now();
        
        // Update running average
        this.stats.avgNodesBefore = (this.stats.avgNodesBefore + nodeCount) / 2;
        
        if (nodeCount >= this.CRITICAL_NODE_THRESHOLD) {
            console.error(`🚨 CRITICAL DOM BLOAT: ${nodeCount} nodes! Executing emergency cleanup...`);
            this.executeEmergencyCleanup();
            
        } else if (nodeCount >= this.WARNING_NODE_THRESHOLD) {
            // Only warn every 30 seconds to avoid spam
            if (now - this.lastWarningTime > 30000) {
                console.warn(`⚠️ DOM Warning: ${nodeCount} nodes (threshold: ${this.WARNING_NODE_THRESHOLD})`);
                this.lastWarningTime = now;
                
                // Execute preventive cleanup
                this.executePreventiveCleanup();
            }
        }
    }
    
    executeEmergencyCleanup() {
        const now = Date.now();
        if (now - this.lastCleanupTime < this.MIN_CLEANUP_INTERVAL) {
            console.log('⏳ Emergency cleanup throttled, waiting...');
            return;
        }
        
        const nodesBefore = this.getCurrentNodeCount();
        console.log(`🧹 Starting emergency DOM cleanup (${nodesBefore} nodes)`);
        
        let nodesRemoved = 0;
        
        // 1. Remove temporary effect elements
        nodesRemoved += this.removeTemporaryElements();
        
        // 2. Clean up orphaned containers
        nodesRemoved += this.removeOrphanedContainers();
        
        // 3. Remove duplicate style elements
        nodesRemoved += this.removeDuplicateStyles();
        
        // 4. Clean up abandoned canvases
        nodesRemoved += this.removeAbandonedCanvases();
        
        // 5. Remove old animation artifacts
        nodesRemoved += this.removeAnimationArtifacts();
        
        // 6. Clean up performance manager elements if available
        if (window.performanceElementManager?.emergencyCleanup) {
            const pmRemoved = window.performanceElementManager.emergencyCleanup();
            nodesRemoved += pmRemoved || 0;
        }
        
        const nodesAfter = this.getCurrentNodeCount();
        const actualRemoved = nodesBefore - nodesAfter;
        
        // Update statistics
        this.stats.totalCleanupsRun++;
        this.stats.nodesRemovedTotal += actualRemoved;
        this.stats.largestCleanup = Math.max(this.stats.largestCleanup, actualRemoved);
        this.stats.avgNodesAfter = (this.stats.avgNodesAfter + nodesAfter) / 2;
        
        this.lastCleanupTime = now;
        this.cleanupCount++;
        
        console.log(`✅ Emergency cleanup completed: ${nodesBefore} → ${nodesAfter} (removed ${actualRemoved} nodes)`);
        
        // If still critical, try more aggressive cleanup
        if (nodesAfter >= this.CRITICAL_NODE_THRESHOLD) {
            console.warn('🔥 Still critical after cleanup, applying aggressive measures...');
            setTimeout(() => this.executeAggressiveCleanup(), 1000);
        }
    }
    
    executePreventiveCleanup() {
        console.log('🧹 Executing preventive DOM cleanup...');
        let removed = 0;
        
        // Light cleanup - just remove obvious temporary elements
        removed += this.removeTemporaryElements(true); // Light mode
        removed += this.removeAnimationArtifacts(true); // Light mode
        
        console.log(`✅ Preventive cleanup removed ${removed} elements`);
    }
    
    executeAggressiveCleanup() {
        console.log('🔥 Executing aggressive DOM cleanup...');
        const nodesBefore = this.getCurrentNodeCount();
        
        let removed = 0;
        
        // More aggressive removal
        removed += this.removeAllEffectElements();
        removed += this.removeNonEssentialElements();
        removed += this.resetAnimationSystems();
        
        const nodesAfter = this.getCurrentNodeCount();
        const actualRemoved = nodesBefore - nodesAfter;
        
        console.log(`🔥 Aggressive cleanup completed: ${nodesBefore} → ${nodesAfter} (removed ${actualRemoved} nodes)`);
        
        // If STILL critical, force a hard reset
        if (nodesAfter >= this.CRITICAL_NODE_THRESHOLD) {
            console.error('💀 DOM still critical, triggering hard reset...');
            this.executeHardReset();
        }
    }
    
    removeTemporaryElements(lightMode = false) {
        const selectors = [
            // Animation containers and temporary elements
            'div[style*="position: fixed"]:not(.control-panel):not([id])',
            '.extended-effects-root > *', // Children of effects container
            '.anime-particles > *',
            '.sonar-container:not(.sonar-container:first-of-type)', // Remove duplicate sonars
            
            // Effect overlays
            '.data-corruption-safe > *',
            '.vhs-glitch-overlay',
            '.matrix-cascade',
            '.neon-pulse',
            '.digital-rain > *',
            '.color-wave-overlay',
            '.electric-arc',
            '.hologram-flicker',
            '.warp-field',
            '.cyber-glitch',
            '.quantum-shift',
            '.plasma-field > *',
            '.circuit-trace',
            '.data-fragmentation',
            
            // Random animation artifacts
            '.ripple-pulse',
            '.digital-corruption',
            '.prismatic-burst',
            '.temporal-glitch',
            '.synthwave-grid',
            '.neon-city-lights',
            '.cyberpunk-noise',
            '.analog-tv-distortion',
            '.digital-meltdown',
            '.holographic-interference',
            
            // Text effect artifacts
            '.glitch-layer',
            '.corruption-block',
            '.matrix-rain-safe', // Duplicate matrix canvases
            
            // SVG elements from ripples
            '#vj-ripple-svg circle',
            '.vj-effect-overlay'
        ];
        
        let removed = 0;
        
        for (const selector of selectors) {
            try {
                const elements = document.querySelectorAll(selector);
                
                // In light mode, only remove half to be conservative
                const elementsToRemove = lightMode ? 
                    Array.from(elements).slice(0, Math.ceil(elements.length / 2)) : 
                    elements;
                
                elementsToRemove.forEach(el => {
                    if (el && el.parentNode) {
                        el.remove();
                        removed++;
                    }
                });
            } catch (e) {
                // Ignore selector errors
            }
        }
        
        return removed;
    }
    
    removeOrphanedContainers() {
        let removed = 0;
        
        // Find containers with no children or only empty children
        const containers = document.querySelectorAll('div[class*="container"], div[class*="effect"], div[class*="anime"]');
        
        containers.forEach(container => {
            if (!container.children.length || 
                (container.children.length === 1 && !container.children[0].textContent.trim())) {
                container.remove();
                removed++;
            }
        });
        
        return removed;
    }
    
    removeDuplicateStyles() {
        let removed = 0;
        const seenStyles = new Set();
        
        document.querySelectorAll('style').forEach(style => {
            const content = style.textContent?.trim();
            if (content && seenStyles.has(content)) {
                style.remove();
                removed++;
            } else if (content) {
                seenStyles.add(content);
            }
        });
        
        return removed;
    }
    
    removeAbandonedCanvases() {
        let removed = 0;
        
        // Remove canvases that aren't essential
        const canvases = document.querySelectorAll('canvas');
        const essentialCanvases = ['chaos-canvas', 'matrix-rain', 'static-noise', 'cyber-grid'];
        
        canvases.forEach(canvas => {
            if (!essentialCanvases.includes(canvas.id) && 
                !canvas.getContext('2d')?.canvas.isConnected) {
                canvas.remove();
                removed++;
            }
        });
        
        return removed;
    }
    
    removeAnimationArtifacts(lightMode = false) {
        let removed = 0;
        
        // Find elements with temporary animation classes
        const animationClasses = [
            '.gsap-marker',
            '[data-gsap-target]',
            '.anime-target',
            '.temp-animation',
            '.fade-in-complete',
            '.fade-out-complete'
        ];
        
        animationClasses.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                const toRemove = lightMode ? 
                    Array.from(elements).slice(0, Math.ceil(elements.length / 2)) :
                    elements;
                
                toRemove.forEach(el => {
                    if (el?.parentNode) {
                        el.remove();
                        removed++;
                    }
                });
            } catch (e) {
                // Ignore selector errors
            }
        });
        
        return removed;
    }
    
    removeAllEffectElements() {
        let removed = 0;
        
        // More aggressive - remove entire effect containers
        const effectContainers = [
            '.extended-effects-root',
            '.anime-particles',
            '.anime-holographic-container',
            '.anime-strobe-circles',
            '.anime-plasma-field',
            '.anime-data-streams',
            '.sonar-container',
            '.random-animations-container'
        ];
        
        effectContainers.forEach(selector => {
            const containers = document.querySelectorAll(selector);
            containers.forEach(container => {
                if (container?.parentNode) {
                    removed += container.querySelectorAll('*').length + 1;
                    container.remove();
                }
            });
        });
        
        return removed;
    }
    
    removeNonEssentialElements() {
        let removed = 0;
        
        // Remove elements that aren't critical for basic functionality
        const nonEssential = document.querySelectorAll(`
            div:not(.pre-loader):not(.control-panel):not([class*="logo"]):not([class*="text"]):empty,
            div[style*="opacity: 0"]:not(.control-panel),
            div[style*="display: none"]:not(.control-panel)
        `);
        
        nonEssential.forEach(el => {
            if (el?.parentNode) {
                el.remove();
                removed++;
            }
        });
        
        return removed;
    }
    
    resetAnimationSystems() {
        let removed = 0;
        
        // Clear GSAP animations on non-essential elements
        if (window.gsap) {
            window.gsap.killTweensOf('div:not(.logo-text-wrapper):not(.image-wrapper):not(.pre-loader)');
        }
        
        // Clear anime.js animations if available
        if (window.animeManager?.killNonCritical) {
            window.animeManager.killNonCritical();
        }
        
        // Clear interval manager non-essential intervals
        if (window.intervalManager?.clearByCategory) {
            window.intervalManager.clearByCategory('effect');
            window.intervalManager.clearByCategory('particle');
        }
        
        return removed;
    }
    
    executeHardReset() {
        console.error('💀 Executing hard DOM reset - this will be disruptive!');
        
        const nodesBefore = this.getCurrentNodeCount();
        
        // Remove everything except essential elements
        const essential = document.querySelectorAll(`
            html, body, head, title, meta, link, script,
            .pre-loader, .image-wrapper, .image-2, .logo-text-wrapper, .text-3886,
            .control-panel, .control-panel *
        `);
        
        const essentialSet = new Set(essential);
        
        // Get all elements
        const allElements = document.querySelectorAll('*');
        let removed = 0;
        
        allElements.forEach(el => {
            if (!essentialSet.has(el) && 
                !el.closest('.control-panel') && 
                !el.closest('.pre-loader')) {
                try {
                    el.remove();
                    removed++;
                } catch (e) {
                    // Ignore removal errors
                }
            }
        });
        
        const nodesAfter = this.getCurrentNodeCount();
        console.error(`💀 Hard reset completed: ${nodesBefore} → ${nodesAfter} (removed ${nodesBefore - nodesAfter} nodes)`);
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        // Trigger system restart
        setTimeout(() => {
            if (window.vjReceiver?.restartEssentialAnimations) {
                console.log('🔄 Restarting essential animations after hard reset...');
                window.vjReceiver.restartEssentialAnimations();
            }
        }, 2000);
    }
    
    getStats() {
        return {
            ...this.stats,
            currentNodeCount: this.getCurrentNodeCount(),
            isMonitoring: this.isMonitoring,
            cleanupCount: this.cleanupCount,
            lastCleanupTime: new Date(this.lastCleanupTime).toLocaleTimeString()
        };
    }
    
    forceCleanup() {
        console.log('🧹 Force cleanup requested');
        this.executeEmergencyCleanup();
    }
    
    destroy() {
        this.stopMonitoring();
        console.log('🗑️ Emergency DOM Cleanup destroyed');
    }
}

// Create and expose global instance
const emergencyDOMCleanup = new EmergencyDOMCleanup();

// Start monitoring immediately
emergencyDOMCleanup.startMonitoring();

// Export for module usage and expose globally
window.emergencyDOMCleanup = emergencyDOMCleanup;
export default emergencyDOMCleanup;