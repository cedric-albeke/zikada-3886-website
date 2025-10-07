// Performance Budgets Manager - Enforces configurable performance limits
// This system monitors and enforces the performance budgets defined in perf-budgets.json

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
            MAX_ANIM_NODES: 50,          // Configurable via environment
            MAX_TIMERS: 15,              // Default from interval manager
            MAX_MEMORY_GROWTH: 0.05,     // 5% growth threshold
            MAX_DOM_NODES: 500,          // From perf-budgets.json
            MAX_WEBGL_PROGRAMS: 50,
            MAX_WEBGL_TEXTURES: 100,
            FPS_EMERGENCY_THRESHOLD: 30,
            CLEANUP_INTERVALS: {
                idle: 30000,             // 30 seconds for idle cleanup
                moderate: 10000,         // 10 seconds for moderate cleanup  
                aggressive: 5000         // 5 seconds for aggressive cleanup
            }
        };
        
        this.featureFlags = {
            enableMatrixCanvasMode: false,      // Switch matrix rain to canvas
            pauseOnHiddenTab: true,             // Pause animations when tab hidden
            aggressiveCleanup: false,           // Enable aggressive cleanup mode
            debugMode: false,                   // Enable debug logging
            memoryPressureAPI: true            // Use memory pressure API if available
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
            // Load configuration from perf-budgets.json
            const response = await fetch('/perf-budgets.json');
            if (response.ok) {
                this.config = await response.json();
                
                // Apply budgets from configuration
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
        // Check URL parameters for overrides
        const params = new URLSearchParams(window.location.search);
        
        // Debug mode
        if (params.has('debug') || params.get('debug') === '1') {
            this.featureFlags.debugMode = true;
            console.log('🐛 Debug mode enabled via URL parameter');
        }
        
        // Canvas mode for matrix effects
        if (params.has('canvas-matrix') || params.get('matrix') === 'canvas') {
            this.featureFlags.enableMatrixCanvasMode = true;
            console.log('🎨 Canvas matrix mode enabled via URL parameter');
        }
        
        // Aggressive cleanup mode
        if (params.has('aggressive-cleanup') || params.get('cleanup') === 'aggressive') {
            this.featureFlags.aggressiveCleanup = true;
            this.budgets.CLEANUP_INTERVALS.idle = 10000;  // More frequent
            console.log('🚨 Aggressive cleanup mode enabled via URL parameter');
        }
        
        // Custom animation node limit
        if (params.has('max-nodes')) {
            const maxNodes = parseInt(params.get('max-nodes'));
            if (maxNodes > 0 && maxNodes <= 1000) {
                this.budgets.MAX_ANIM_NODES = maxNodes;
                console.log(`📊 Custom animation node limit: ${maxNodes}`);
            }
        }
        
        // Custom timer limit
        if (params.has('max-timers')) {
            const maxTimers = parseInt(params.get('max-timers'));
            if (maxTimers > 0 && maxTimers <= 50) {
                this.budgets.MAX_TIMERS = maxTimers;
                console.log(`⏰ Custom timer limit: ${maxTimers}`);
            }
        }
        
        // Check data attributes for persistent settings
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
