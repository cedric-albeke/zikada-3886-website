// Performance Budgets Manager
// Enforces configurable thresholds for DOM nodes, timers, animations, and WebGL resources

class PerformanceBudgetsManager {
    constructor() {
        this.budgets = {
            // DOM-related budgets
            maxDOMNodes: 800, // Increased from 500
            maxDOMGrowthRate: 75, // Increased from 50 nodes per minute
            maxDOMDepth: 25, // Increased from 20
            
            // Timer-related budgets
            maxTimers: 80, // Increased from 50
            maxIntervals: 30, // Increased from 20
            maxTimeouts: 50, // Increased from 30
            
            // Animation budgets - significantly increased for visual effects site
            maxConcurrentAnimations: 25, // Increased from 10
            maxGSAPTweens: 300, // Dramatically increased from 25
            maxCSSAnimations: 50, // Increased from 15
            
            // Memory budgets (in MB)
            maxHeapSize: 350, // Increased from 200
            maxHeapGrowthRate: 100, // Increased from 50 MB per minute
            heapGrowthWarningThreshold: 200, // Increased from 100 MB
            
            // WebGL budgets
            maxWebGLTextures: 50,
            maxWebGLBuffers: 100,
            maxWebGLPrograms: 20,
            
            // Event listener budgets
            maxEventListeners: 100,
            maxMutationObservers: 10,
            
            // Network budgets
            maxNetworkRequests: 50,
            maxWebSocketConnections: 5
        };
        
        this.currentUsage = {
            domNodes: 0,
            timers: 0,
            intervals: 0,
            timeouts: 0,
            animations: 0,
            gsapTweens: 0,
            cssAnimations: 0,
            heapSize: 0,
            webglTextures: 0,
            webglBuffers: 0,
            webglPrograms: 0,
            eventListeners: 0,
            mutationObservers: 0,
            networkRequests: 0,
            webSocketConnections: 0
        };
        
        this.violations = [];
        this.warningCallbacks = new Set();
        this.criticalCallbacks = new Set();
        
        this.init();
        console.log('💰 Performance Budgets Manager initialized');
    }
    
    init() {
        // Start monitoring
        this.startMonitoring();
        
        // Setup periodic budget checks
        if (window.intervalManager) {
            window.intervalManager.createInterval(() => {
                this.checkAllBudgets();
            }, 5000, 'budget-check', { category: 'monitoring' });
        } else {
            setInterval(() => this.checkAllBudgets(), 5000);
        }
        
        // Expose globally
        window.performanceBudgetsManager = this;
    }
    
    startMonitoring() {
        // Monitor DOM changes
        this.startDOMMonitoring();
        
        // Monitor memory usage
        this.startMemoryMonitoring();
        
        // Monitor animations
        this.startAnimationMonitoring();
        
        // Monitor WebGL resources
        this.startWebGLMonitoring();
    }
    
    startDOMMonitoring() {
        // Initial DOM node count
        this.updateDOMNodeCount();
        
        // Monitor DOM mutations
        if (!this.domObserver) {
            this.domObserver = new MutationObserver((mutations) => {
                let addedNodes = 0;
                let removedNodes = 0;
                
                mutations.forEach(mutation => {
                    addedNodes += mutation.addedNodes.length;
                    removedNodes += mutation.removedNodes.length;
                });
                
                // Update DOM node count
                this.updateDOMNodeCount();
                
                // Check DOM depth
                this.checkDOMDepth();
                
                // Check for excessive growth
                if (addedNodes - removedNodes > 10) {
                    this.recordViolation('dom_growth_spike', {
                        added: addedNodes,
                        removed: removedNodes,
                        net: addedNodes - removedNodes
                    });
                    
                    // Immediate cleanup for DOM growth spikes
                    setTimeout(() => {
                        this.enforceDOMBudget();
                    }, 100);
                }
            });
            
            this.domObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }
    
    startMemoryMonitoring() {
        if (performance.memory) {
            setInterval(() => {
                this.currentUsage.heapSize = performance.memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
            }, 2000);
        }
    }
    
    startAnimationMonitoring() {
        // Monitor GSAP tweens if available
        if (window.gsap) {
            const originalTo = window.gsap.to;
            const originalFrom = window.gsap.from;
            const originalTimeline = window.gsap.timeline;
            
            window.gsap.to = (...args) => {
                this.currentUsage.gsapTweens++;
                const tween = originalTo.apply(window.gsap, args);
                
                // Decrement when complete
                tween.eventCallback('onComplete', () => {
                    this.currentUsage.gsapTweens = Math.max(0, this.currentUsage.gsapTweens - 1);
                });
                
                return tween;
            };
            
            window.gsap.from = (...args) => {
                this.currentUsage.gsapTweens++;
                const tween = originalFrom.apply(window.gsap, args);
                
                tween.eventCallback('onComplete', () => {
                    this.currentUsage.gsapTweens = Math.max(0, this.currentUsage.gsapTweens - 1);
                });
                
                return tween;
            };
        }
        
        // Monitor CSS animations
        this.monitorCSSAnimations();
    }
    
    monitorCSSAnimations() {
        const checkCSSAnimations = () => {
            const elements = document.querySelectorAll('*');
            let cssAnimationCount = 0;
            
            elements.forEach(el => {
                const computedStyle = getComputedStyle(el);
                if (computedStyle.animationName && computedStyle.animationName !== 'none') {
                    cssAnimationCount++;
                }
            });
            
            this.currentUsage.cssAnimations = cssAnimationCount;
        };
        
        setInterval(checkCSSAnimations, 3000);
    }
    
    startWebGLMonitoring() {
        // This would need integration with WebGL context monitoring
        // For now, we'll rely on external systems to report WebGL usage
    }
    
    updateDOMNodeCount() {
        this.currentUsage.domNodes = document.querySelectorAll('*').length;
    }
    
    checkDOMDepth() {
        let maxDepth = 0;
        
        const getDepth = (element, currentDepth = 0) => {
            maxDepth = Math.max(maxDepth, currentDepth);
            for (let child of element.children) {
                getDepth(child, currentDepth + 1);
            }
        };
        
        getDepth(document.body);
        return maxDepth;
    }
    
    checkAllBudgets() {
        // Check each budget category
        this.checkDOMBudgets();
        this.checkMemoryBudgets();
        this.checkAnimationBudgets();
        this.checkWebGLBudgets();
        
        // Emit budget status
        this.emitBudgetStatus();
    }
    
    checkDOMBudgets() {
        // Check DOM node count
        if (this.currentUsage.domNodes > this.budgets.maxDOMNodes) {
            this.recordViolation('max_dom_nodes', {
                current: this.currentUsage.domNodes,
                budget: this.budgets.maxDOMNodes,
                overage: this.currentUsage.domNodes - this.budgets.maxDOMNodes
            });
        }
        
        // Check DOM depth
        const currentDepth = this.checkDOMDepth();
        if (currentDepth > this.budgets.maxDOMDepth) {
            this.recordViolation('max_dom_depth', {
                current: currentDepth,
                budget: this.budgets.maxDOMDepth
            });
        }
    }
    
    checkMemoryBudgets() {
        if (this.currentUsage.heapSize > this.budgets.maxHeapSize) {
            this.recordViolation('max_heap_size', {
                current: this.currentUsage.heapSize.toFixed(1) + ' MB',
                budget: this.budgets.maxHeapSize + ' MB',
                overage: (this.currentUsage.heapSize - this.budgets.maxHeapSize).toFixed(1) + ' MB'
            });
        } else if (this.currentUsage.heapSize > this.budgets.heapGrowthWarningThreshold) {
            this.recordWarning('heap_size_warning', {
                current: this.currentUsage.heapSize.toFixed(1) + ' MB',
                threshold: this.budgets.heapGrowthWarningThreshold + ' MB'
            });
        }
    }
    
    checkAnimationBudgets() {
        // Check GSAP tweens
        if (this.currentUsage.gsapTweens > this.budgets.maxGSAPTweens) {
            this.recordViolation('max_gsap_tweens', {
                current: this.currentUsage.gsapTweens,
                budget: this.budgets.maxGSAPTweens
            });
        }
        
        // Check CSS animations
        if (this.currentUsage.cssAnimations > this.budgets.maxCSSAnimations) {
            this.recordViolation('max_css_animations', {
                current: this.currentUsage.cssAnimations,
                budget: this.budgets.maxCSSAnimations
            });
        }
    }
    
    checkWebGLBudgets() {
        // WebGL budget checking would be implemented here
        // Currently relies on external systems to report usage
    }
    
    recordViolation(type, details) {
        const violation = {
            type,
            details,
            timestamp: Date.now(),
            severity: 'critical'
        };
        
        this.violations.push(violation);
        
        // Keep only recent violations
        if (this.violations.length > 100) {
            this.violations = this.violations.slice(-50);
        }
        
        console.error(`🚨 Budget violation: ${type}`, details);
        
        // Notify critical callbacks
        this.criticalCallbacks.forEach(callback => {
            try {
                callback(violation);
            } catch (error) {
                console.error('Error in critical callback:', error);
            }
        });
        
        // Emit event
        window.dispatchEvent(new CustomEvent('budget:violation', {
            detail: violation
        }));
        
        // Auto-trigger emergency cleanup for severe violations
        if (this.isSevereViolation(type, details)) {
            this.triggerEmergencyMeasures(type, details);
        }
    }
    
    recordWarning(type, details) {
        const warning = {
            type,
            details,
            timestamp: Date.now(),
            severity: 'warning'
        };
        
        console.warn(`⚠️ Budget warning: ${type}`, details);
        
        // Notify warning callbacks
        this.warningCallbacks.forEach(callback => {
            try {
                callback(warning);
            } catch (error) {
                console.error('Error in warning callback:', error);
            }
        });
        
        // Emit event
        window.dispatchEvent(new CustomEvent('budget:warning', {
            detail: warning
        }));
    }
    
    isSevereViolation(type, details) {
        const severeThresholds = {
            'max_dom_nodes': 100, // 100+ nodes over budget
            'max_heap_size': 50,  // 50+ MB over budget
            'max_gsap_tweens': 10 // 10+ tweens over budget
        };
        
        const threshold = severeThresholds[type];
        if (!threshold) return false;
        
        return details.overage > threshold;
    }
    
    triggerEmergencyMeasures(type, details) {
        console.error(`🚨 Severe budget violation detected: ${type}. Triggering emergency measures.`);
        
        // Trigger emergency cleanup if available
        if (window.emergencyRecoverySystem) {
            window.emergencyRecoverySystem.enterEmergencyMode();
        } else if (window.EMERGENCY_STOP) {
            window.EMERGENCY_STOP();
        }
        
        // Emit severe violation event
        window.dispatchEvent(new CustomEvent('budget:severe-violation', {
            detail: { type, details }
        }));
    }
    
    emitBudgetStatus() {
        const status = {
            budgets: this.budgets,
            usage: this.currentUsage,
            utilization: this.calculateUtilization(),
            violations: this.violations.slice(-10), // Last 10 violations
            timestamp: Date.now()
        };
        
        // Emit status event
        window.dispatchEvent(new CustomEvent('budget:status', {
            detail: status
        }));
    }
    
    calculateUtilization() {
        const utilization = {};
        
        // Calculate percentage utilization for each budget
        Object.keys(this.budgets).forEach(key => {
            const budgetKey = key.replace('max', '').toLowerCase();
            const usageKey = budgetKey.replace('_', '').replace('size', '').replace('rate', '');
            
            if (this.currentUsage[usageKey] !== undefined) {
                utilization[key] = Math.round((this.currentUsage[usageKey] / this.budgets[key]) * 100);
            }
        });
        
        return utilization;
    }
    
    // Budget constraint checking methods
    canSpawnAnimationElement() {
        // Check if we're close to or over budget constraints
        const domUtilization = (this.currentUsage.domNodes / this.budgets.maxDOMNodes) * 100;
        const animationUtilization = (this.currentUsage.gsapTweens / this.budgets.maxGSAPTweens) * 100;
        const memoryUtilization = (this.currentUsage.heapSize / this.budgets.maxHeapSize) * 100;
        
        // Only block if we're over 95% utilization in critical areas (more permissive)
        if (domUtilization > 95 || memoryUtilization > 95) {
            console.log('🚫 Blocking animation creation - critical resource usage:', {
                dom: `${domUtilization.toFixed(1)}%`,
                memory: `${memoryUtilization.toFixed(1)}%`
            });
            return false;
        }
        
        // Be more lenient with GSAP tweens since this is a visual effects site
        if (animationUtilization > 98) {
            console.log('🚫 Blocking animation creation - GSAP tween limit reached:', `${animationUtilization.toFixed(1)}%`);
            return false;
        }
        
        // Only block if we've had many recent DOM growth violations (more permissive)
        const recentViolations = this.violations.filter(v => 
            v.type === 'dom_growth_spike' && 
            (Date.now() - v.timestamp) < 5000 // Within last 5 seconds
        );
        
        if (recentViolations.length > 5) { // Increased threshold
            console.log('🚫 Blocking animation creation - too many recent DOM growth spikes');
            return false;
        }
        
        return true;
    }
    
    canSpawnDOMElement(count = 1) {
        const projectedNodes = this.currentUsage.domNodes + count;
        return projectedNodes <= this.budgets.maxDOMNodes * 0.9; // 90% threshold
    }
    
    canSpawnAnimation() {
        const projectedTweens = this.currentUsage.gsapTweens + 1;
        return projectedTweens <= this.budgets.maxGSAPTweens * 0.9; // 90% threshold
    }
    
    // Public API methods
    setBudget(category, value) {
        if (this.budgets.hasOwnProperty(category)) {
            this.budgets[category] = value;
            console.log(`💰 Budget updated: ${category} = ${value}`);
        } else {
            console.error(`Unknown budget category: ${category}`);
        }
    }
    
    getBudget(category) {
        return this.budgets[category];
    }
    
    getAllBudgets() {
        return { ...this.budgets };
    }
    
    getCurrentUsage() {
        return { ...this.currentUsage };
    }
    
    getViolations(limit = 10) {
        return this.violations.slice(-limit);
    }
    
    clearViolations() {
        this.violations = [];
        console.log('💰 Budget violations cleared');
    }
    
    onWarning(callback) {
        this.warningCallbacks.add(callback);
    }
    
    onCritical(callback) {
        this.criticalCallbacks.add(callback);
    }
    
    removeWarningCallback(callback) {
        this.warningCallbacks.delete(callback);
    }
    
    removeCriticalCallback(callback) {
        this.criticalCallbacks.delete(callback);
    }
    
    // Report usage from external systems
    reportWebGLUsage(textures, buffers, programs) {
        this.currentUsage.webglTextures = textures || 0;
        this.currentUsage.webglBuffers = buffers || 0;
        this.currentUsage.webglPrograms = programs || 0;
    }
    
    reportTimerUsage(intervals, timeouts, total) {
        this.currentUsage.intervals = intervals || 0;
        this.currentUsage.timeouts = timeouts || 0;
        this.currentUsage.timers = total || (intervals + timeouts);
    }
    
    reportAnimationUsage(concurrent) {
        this.currentUsage.animations = concurrent || 0;
    }
    
    // Diagnostic methods
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            budgets: this.budgets,
            usage: this.currentUsage,
            utilization: this.calculateUtilization(),
            violations: this.violations,
            summary: {
                totalViolations: this.violations.length,
                criticalViolations: this.violations.filter(v => v.severity === 'critical').length,
                mostViolatedBudget: this.getMostViolatedBudget(),
                overallHealth: this.calculateOverallHealth()
            }
        };
        
        return report;
    }
    
    getMostViolatedBudget() {
        const violationCounts = {};
        this.violations.forEach(v => {
            violationCounts[v.type] = (violationCounts[v.type] || 0) + 1;
        });
        
        let maxViolations = 0;
        let mostViolated = null;
        
        Object.entries(violationCounts).forEach(([type, count]) => {
            if (count > maxViolations) {
                maxViolations = count;
                mostViolated = type;
            }
        });
        
        return { type: mostViolated, count: maxViolations };
    }
    
    calculateOverallHealth() {
        const utilizations = Object.values(this.calculateUtilization());
        const avgUtilization = utilizations.reduce((sum, val) => sum + val, 0) / utilizations.length;
        
        if (avgUtilization < 50) return 'good';
        if (avgUtilization < 75) return 'warning';
        if (avgUtilization < 90) return 'critical';
        return 'severe';
    }
    
    // Emergency methods
    enforceBudgets() {
        console.log('🚨 Enforcing all budgets immediately...');
        
        // Force cleanup if over DOM budget
        if (this.currentUsage.domNodes > this.budgets.maxDOMNodes) {
            this.enforceDOMBudget();
        }
        
        // Force cleanup if over animation budget
        if (this.currentUsage.gsapTweens > this.budgets.maxGSAPTweens) {
            this.enforceAnimationBudget();
        }
    }
    
    enforceDOMBudget() {
        console.log('🧹 Enforcing DOM budget...');
        
        // Update current count first
        this.updateDOMNodeCount();
        const overage = this.currentUsage.domNodes - this.budgets.maxDOMNodes;
        
        if (overage <= 0) {
            console.log('🧹 DOM budget already within limits');
            return 0;
        }
        
        console.log(`🧹 DOM overage: ${overage} nodes need to be removed`);
        
        // Comprehensive cleanup selectors (ordered by priority)
        const cleanupSelectors = [
            // High priority - definitely temporary
            '[data-temp="true"]',
            '.matrix-char',
            '.phase-overlay',
            '.flash-overlay',
            '.glitch-overlay',
            '[data-animation="true"]',
            '[data-effect="true"]',
            
            // Medium priority - animation elements
            '.energy-field',
            '.quantum-particles',
            '.holographic-shimmer',
            '.matrix-overlay',
            
            // Lower priority - managed elements not marked permanent
            '.perf-managed:not([data-permanent])',
            '[data-managed="true"]:not([data-permanent])',
            
            // Last resort - any div with position fixed that's not critical
            'div[style*="position: fixed"]:not(.pre-loader):not(.control-panel)'
        ];
        
        let totalRemoved = 0;
        let targetRemoved = Math.min(overage * 2, 100); // Remove up to 2x overage or 100 elements max
        
        for (const selector of cleanupSelectors) {
            if (totalRemoved >= targetRemoved) break;
            
            try {
                const elements = document.querySelectorAll(selector);
                console.log(`🔍 Found ${elements.length} elements for selector: ${selector}`);
                
                for (const el of elements) {
                    if (totalRemoved >= targetRemoved) break;
                    
                    // Safety checks before removal
                    if (this.isSafeToRemove(el)) {
                        try {
                            // Untrack from performance manager if tracked
                            if (window.performanceElementManager) {
                                window.performanceElementManager.untrack(el);
                            }
                            
                            el.remove();
                            totalRemoved++;
                        } catch (e) {
                            console.warn('Failed to remove element:', e);
                        }
                    }
                }
            } catch (error) {
                console.warn(`Invalid selector: ${selector}`, error);
            }
        }
        
        // Update count after cleanup
        this.updateDOMNodeCount();
        const finalOverage = this.currentUsage.domNodes - this.budgets.maxDOMNodes;
        
        console.log(`🧹 DOM budget enforcement completed:`);
        console.log(`  - Elements removed: ${totalRemoved}`);
        console.log(`  - Final DOM count: ${this.currentUsage.domNodes}`);
        console.log(`  - Remaining overage: ${Math.max(0, finalOverage)}`);
        
        return totalRemoved;
    }
    
    isSafeToRemove(element) {
        if (!element || !element.nodeType) return false;
        
        // Never remove critical elements
        const criticalClasses = ['pre-loader', 'control-panel', 'logo-text', 'image-2'];
        const criticalSelectors = ['body', 'html', 'head', 'script', 'style', 'link'];
        
        if (criticalClasses.some(cls => element.classList?.contains(cls))) {
            return false;
        }
        
        if (criticalSelectors.includes(element.tagName?.toLowerCase())) {
            return false;
        }
        
        if (element.hasAttribute('data-permanent')) {
            return false;
        }
        
        // Don't remove elements that contain critical content
        if (element.querySelector('.logo-text, .image-2, .pre-loader')) {
            return false;
        }
        
        // Don't remove if it's the parent of critical elements
        const criticalChild = element.querySelector('.pre-loader, .control-panel, .logo-text, .image-2');
        if (criticalChild) {
            return false;
        }
        
        return true;
    }
    
    enforceAnimationBudget() {
        console.log('🎬 Enforcing animation budget...');
        
        if (window.gsap) {
            // Kill oldest tweens
            const overage = this.currentUsage.gsapTweens - this.budgets.maxGSAPTweens;
            if (overage > 0) {
                // This is a simplified approach - in reality you'd want more sophisticated tween management
                window.gsap.killTweensOf('*');
                console.log(`🎬 Killed excess GSAP tweens (overage: ${overage})`);
            }
        }
    }
}

// Initialize the Performance Budgets Manager
window.performanceBudgetsManager = new PerformanceBudgetsManager();

export default PerformanceBudgetsManager;