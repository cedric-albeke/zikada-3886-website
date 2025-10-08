// Performance Budgets Manager - Enforces configurable performance limits
class PerformanceBudgets {
    constructor() {
        this.config = null;
        this.currentMetrics = {
            dom: { nodes: 0, growth: 0 },
            memory: { used: 0, growth: 0 },
            timers: { active: 0, total: 0 },
            animations: { active: 0, total: 0 },
            webgl: { programs: 0, textures: 0, buffers: 0 }
        };
        
        this.budgets = {
            MAX_ANIM_NODES: 50,
            MAX_TIMERS: 15,
            MAX_MEMORY_GROWTH: 0.05,
            MAX_DOM_NODES: 500,
            MAX_WEBGL_PROGRAMS: 50,
            MAX_WEBGL_TEXTURES: 100,
            FPS_EMERGENCY_THRESHOLD: 30,
            CLEANUP_INTERVALS: {
                idle: 30000,
                moderate: 10000,
                aggressive: 5000
            }
        };
        
        this.featureFlags = {
            enableMatrixCanvasMode: false,
            pauseOnHiddenTab: true,
            aggressiveCleanup: false,
            debugMode: false,
            memoryPressureAPI: true
        };
        
        this.loadConfiguration();
        this.applyEnvironmentOverrides();
        
        console.log('📊 Performance Budgets Manager initialized', {
            budgets: this.budgets,
            flags: this.featureFlags
        });
    }
    
    async loadConfiguration() {
        try {
            const response = await fetch('/perf-budgets.json');
            if (response.ok) {
                this.config = await response.json();
                
                if (this.config.budgets?.performance) {
                    const perfBudgets = this.config.budgets.performance;
                    
                    if (perfBudgets.memory?.maxDOMNodes) {
                        this.budgets.MAX_DOM_NODES = perfBudgets.memory.maxDOMNodes;
                    }
                    
                    if (perfBudgets.fps?.emergencyThreshold) {
                        this.budgets.FPS_EMERGENCY_THRESHOLD = perfBudgets.fps.emergencyThreshold;
                    }
                    
                    if (perfBudgets.memory?.maxHeapGrowth) {
                        const growthStr = perfBudgets.memory.maxHeapGrowth.toString();
                        if (growthStr.includes('%')) {
                            this.budgets.MAX_MEMORY_GROWTH = parseFloat(growthStr) / 100;
                        }
                    }
                    
                    if (perfBudgets.webgl) {
                        this.budgets.MAX_WEBGL_PROGRAMS = perfBudgets.webgl.maxPrograms || 50;
                        this.budgets.MAX_WEBGL_TEXTURES = perfBudgets.webgl.maxTextures || 100;
                    }
                }
                
                console.log('📄 Loaded performance configuration:', this.config.budgets?.performance);
            }
        } catch (error) {
            console.warn('⚠️ Could not load perf-budgets.json, using defaults:', error);
        }
    }
    
    applyEnvironmentOverrides() {
        const params = new URLSearchParams(window.location.search);
        
        if (params.has('debug') || params.get('debug') === '1') {
            this.featureFlags.debugMode = true;
            console.log('🐛 Debug mode enabled via URL parameter');
        }
        
        if (params.has('canvas-matrix') || params.get('matrix') === 'canvas') {
            this.featureFlags.enableMatrixCanvasMode = true;
            console.log('🎨 Canvas matrix mode enabled via URL parameter');
        }
        
        if (params.has('aggressive-cleanup') || params.get('cleanup') === 'aggressive') {
            this.featureFlags.aggressiveCleanup = true;
            this.budgets.CLEANUP_INTERVALS.idle = 10000;
            console.log('🚨 Aggressive cleanup mode enabled via URL parameter');
        }
        
        if (params.has('max-nodes')) {
            const maxNodes = parseInt(params.get('max-nodes'));
            if (maxNodes > 0 && maxNodes <= 1000) {
                this.budgets.MAX_ANIM_NODES = maxNodes;
                console.log(`📊 Custom animation node limit: ${maxNodes}`);
            }
        }
        
        if (params.has('max-timers')) {
            const maxTimers = parseInt(params.get('max-timers'));
            if (maxTimers > 0 && maxTimers <= 50) {
                this.budgets.MAX_TIMERS = maxTimers;
                console.log(`⏰ Custom timer limit: ${maxTimers}`);
            }
        }
        
        const body = document.body;
        if (body.dataset.performanceMode) {
            switch (body.dataset.performanceMode) {
                case 'low-power':
                    this.budgets.MAX_ANIM_NODES = 25;
                    this.budgets.MAX_TIMERS = 8;
                    this.featureFlags.enableMatrixCanvasMode = true;
                    this.featureFlags.aggressiveCleanup = true;
                    console.log('🔋 Low power performance mode activated');
                    break;
                    
                case 'high-performance':
                    this.budgets.MAX_ANIM_NODES = 100;
                    this.budgets.MAX_TIMERS = 25;
                    this.featureFlags.aggressiveCleanup = false;
                    console.log('⚡ High performance mode activated');
                    break;
            }
        }
    }
    
    updateMetrics() {
        this.currentMetrics.dom.nodes = document.querySelectorAll('*').length;
        
        if (performance.memory) {
            this.currentMetrics.memory.used = performance.memory.usedJSHeapSize;
        }
        
        if (window.intervalManager) {
            const stats = window.intervalManager.getStats();
            this.currentMetrics.timers.active = stats.totalIntervals || 0;
        }
        
        if (window.performanceElementManager) {
            this.currentMetrics.animations.active = window.performanceElementManager.trackedElements?.size || 0;
        }
        
        if (window.WEBGL_RESOURCE_MANAGER) {
            const stats = window.WEBGL_RESOURCE_MANAGER.getStats?.() || {};
            this.currentMetrics.webgl.programs = stats.programs || 0;
            this.currentMetrics.webgl.textures = stats.textures || 0;
        }
    }
    
    checkBudgets() {
        this.updateMetrics();
        const violations = [];
        
        if (this.currentMetrics.dom.nodes > this.budgets.MAX_DOM_NODES) {
            violations.push({
                type: 'dom-nodes',
                current: this.currentMetrics.dom.nodes,
                budget: this.budgets.MAX_DOM_NODES,
                severity: 'warning'
            });
        }
        
        if (this.currentMetrics.animations.active > this.budgets.MAX_ANIM_NODES) {
            violations.push({
                type: 'animation-nodes',
                current: this.currentMetrics.animations.active,
                budget: this.budgets.MAX_ANIM_NODES,
                severity: 'warning'
            });
        }
        
        if (this.currentMetrics.timers.active > this.budgets.MAX_TIMERS) {
            violations.push({
                type: 'timers',
                current: this.currentMetrics.timers.active,
                budget: this.budgets.MAX_TIMERS,
                severity: 'critical'
            });
        }
        
        if (this.currentMetrics.webgl.programs > this.budgets.MAX_WEBGL_PROGRAMS) {
            violations.push({
                type: 'webgl-programs',
                current: this.currentMetrics.webgl.programs,
                budget: this.budgets.MAX_WEBGL_PROGRAMS,
                severity: 'warning'
            });
        }
        
        if (violations.length > 0) {
            this.handleBudgetViolations(violations);
        }
        
        return violations;
    }
    
    handleBudgetViolations(violations) {
        violations.forEach(violation => {
            const message = `🚨 Performance budget exceeded: ${violation.type} (${violation.current}/${violation.budget})`;
            
            if (violation.severity === 'critical') {
                console.error(message);
                this.triggerEmergencyResponse(violation.type);
            } else {
                console.warn(message);
                this.triggerPreventiveMeasures(violation.type);
            }
        });
        
        window.dispatchEvent(new CustomEvent('performance:budget-violation', {
            detail: { violations }
        }));
    }
    
    triggerEmergencyResponse(budgetType) {
        console.log(`🚨 Emergency response for budget violation: ${budgetType}`);
        
        switch (budgetType) {
            case 'timers':
                if (window.intervalManager && window.intervalManager.cleanup) {
                    window.intervalManager.cleanup();
                }
                break;
                
            case 'animation-nodes':
            case 'dom-nodes':
                if (window.performanceElementManager && window.performanceElementManager.emergencyCleanup) {
                    window.performanceElementManager.emergencyCleanup();
                }
                break;
                
            case 'webgl-programs':
            case 'webgl-textures':
                if (window.WEBGL_RESOURCE_MANAGER && window.WEBGL_RESOURCE_MANAGER.performEmergencyCleanup) {
                    window.WEBGL_RESOURCE_MANAGER.performEmergencyCleanup();
                }
                break;
        }
    }
    
    triggerPreventiveMeasures(budgetType) {
        console.log(`⚠️ Preventive measures for budget warning: ${budgetType}`);
        
        switch (budgetType) {
            case 'dom-nodes':
            case 'animation-nodes':
                window.dispatchEvent(new CustomEvent('animations:reduce-spawn-rate', {
                    detail: { reduction: 0.5, duration: 30000 }
                }));
                break;
                
            case 'webgl-programs':
                window.dispatchEvent(new CustomEvent('webgl:optimize-resources'));
                break;
        }
    }
    
    canSpawnAnimationElement() {
        this.updateMetrics();
        return this.currentMetrics.animations.active < this.budgets.MAX_ANIM_NODES;
    }
    
    canCreateTimer() {
        this.updateMetrics();
        return this.currentMetrics.timers.active < this.budgets.MAX_TIMERS;
    }
    
    shouldUseCanvasMode() {
        return this.featureFlags.enableMatrixCanvasMode || 
               this.currentMetrics.dom.nodes > (this.budgets.MAX_DOM_NODES * 0.8);
    }
    
    getRecommendedCleanupInterval() {
        this.updateMetrics();
        
        const domUtilization = this.currentMetrics.dom.nodes / this.budgets.MAX_DOM_NODES;
        const animUtilization = this.currentMetrics.animations.active / this.budgets.MAX_ANIM_NODES;
        const timerUtilization = this.currentMetrics.timers.active / this.budgets.MAX_TIMERS;
        
        const maxUtilization = Math.max(domUtilization, animUtilization, timerUtilization);
        
        if (maxUtilization > 0.9) {
            return this.budgets.CLEANUP_INTERVALS.aggressive;
        } else if (maxUtilization > 0.7) {
            return this.budgets.CLEANUP_INTERVALS.moderate;
        } else {
            return this.budgets.CLEANUP_INTERVALS.idle;
        }
    }
    
    getBudgetStatus() {
        this.updateMetrics();
        
        return {
            budgets: this.budgets,
            current: this.currentMetrics,
            utilization: {
                dom: this.currentMetrics.dom.nodes / this.budgets.MAX_DOM_NODES,
                animations: this.currentMetrics.animations.active / this.budgets.MAX_ANIM_NODES,
                timers: this.currentMetrics.timers.active / this.budgets.MAX_TIMERS,
                webgl: {
                    programs: this.currentMetrics.webgl.programs / this.budgets.MAX_WEBGL_PROGRAMS,
                    textures: this.currentMetrics.webgl.textures / this.budgets.MAX_WEBGL_TEXTURES
                }
            },
            flags: this.featureFlags,
            recommendedCleanupInterval: this.getRecommendedCleanupInterval()
        };
    }
    
    updateBudget(budgetType, newValue) {
        if (this.budgets.hasOwnProperty(budgetType) && typeof newValue === 'number' && newValue > 0) {
            this.budgets[budgetType] = newValue;
            console.log(`📊 Updated budget ${budgetType}: ${newValue}`);
            return true;
        }
        return false;
    }
    
    setFeatureFlag(flag, value) {
        if (this.featureFlags.hasOwnProperty(flag)) {
            this.featureFlags[flag] = Boolean(value);
            console.log(`🏁 Updated feature flag ${flag}: ${value}`);
            return true;
        }
        return false;
    }
    
    startPeriodicBudgetCheck(intervalMs = 10000) {
        if (window.intervalManager && window.intervalManager.createInterval) {
            return window.intervalManager.createInterval(
                () => this.checkBudgets(),
                intervalMs,
                'budget-checker',
                { category: 'monitoring' }
            );
        } else {
            return setInterval(() => this.checkBudgets(), intervalMs);
        }
    }
}

// Create and expose global instance
window.performanceBudgets = new PerformanceBudgets();

export default PerformanceBudgets;