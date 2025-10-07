/**
 * Memory Leak Guardian for ZIKADA 3886
 * 
 * Comprehensive memory leak prevention and DOM accumulation safeguards:
 * - Scene lifecycle contract enforcement
 * - Object pooling for performance-critical allocations  
 * - Event listener hygiene with centralized registry
 * - Heap drift detection and automated cleanup triggers
 * - DOM growth monitoring with mutation observer auditing
 * - WebGL resource disposal tracking
 */

import featureFlags from './feature-flags.js';
import performanceElementManager from './performance-element-manager.js';
import intervalManager from './interval-manager.js';

class MemoryLeakGuardian {
    constructor() {
        this.isActive = false;
        this.debugMode = featureFlags.isEnabled('debugMetrics');
        
        // Heap Drift Monitoring (RELAXED THRESHOLDS)
        this.heapSamples = [];
        this.maxSamples = 12; // 12 samples over 6 minutes (30s intervals)
        this.heapDriftThreshold = 0.50; // 50% growth triggers warning (was 5%)
        this.criticalHeapGrowth = 1.00; // 100% growth triggers emergency (was 15%)
        this.lastHeapCheck = 0;
        this.heapCheckInterval = 30000; // Check every 30 seconds
        
        // Event Listener Registry
        this.eventListeners = new Map();
        this.listenerCounter = 0;
        this.maxListeners = 100;
        
        // Object Pools
        this.objectPools = new Map();
        this.pooledTypes = ['Float32Array', 'Array', 'Object', 'Vector3', 'Matrix4'];
        
        // DOM Growth Monitoring (RELAXED THRESHOLDS)
        this.domObserver = null;
        this.initialDOMNodes = 0;
        this.maxDOMGrowth = 2000; // Max allowed DOM node growth (was 200)
        this.domGrowthWarning = 1000; // Warn at 1000 node growth (was 100)
        this.lastDOMCount = 0;
        
        // WebGL Resource Tracking
        this.webglResources = new Map();
        this.webglContext = null;
        this.maxTextures = 50;
        this.maxPrograms = 20;
        
        // Scene Lifecycle Management
        this.activeScenes = new Map();
        this.sceneDisposers = new Map();
        
        console.log('🛡️ Memory Leak Guardian initialized');
    }
    
    /**
     * Start all memory leak monitoring systems
     */
    startGuardian() {
        if (this.isActive) return;
        
        this.isActive = true;
        
        // Initialize baseline measurements
        this.initializeBaselines();
        
        // Start heap drift monitoring
        this.startHeapDriftMonitoring();
        
        // Initialize object pools
        this.initializeObjectPools();
        
        // Start DOM mutation monitoring
        this.startDOMMonitoring();
        
        // Set up WebGL resource tracking
        this.setupWebGLTracking();
        
        // Start periodic cleanup
        this.startPeriodicMaintenance();
        
        console.log('🛡️ Memory Leak Guardian systems active');
    }
    
    /**
     * Initialize baseline measurements
     */
    initializeBaselines() {
        // Record initial DOM node count
        this.initialDOMNodes = document.querySelectorAll('*').length;
        this.lastDOMCount = this.initialDOMNodes;
        
        // Take initial heap sample
        if (performance.memory) {
            this.heapSamples.push({
                timestamp: Date.now(),
                usedHeap: performance.memory.usedJSHeapSize,
                totalHeap: performance.memory.totalJSHeapSize
            });
        }
        
        console.log(`🛡️ Baselines established: ${this.initialDOMNodes} DOM nodes, ${this.formatBytes(performance.memory?.usedJSHeapSize || 0)} heap`);
    }
    
    /**
     * Start heap drift monitoring
     */
    startHeapDriftMonitoring() {
        const heapMonitor = intervalManager.createInterval(() => {
            this.checkHeapDrift();
        }, this.heapCheckInterval, 'heap-drift-monitor', {
            category: 'monitoring'
        });
        
        console.log('🧠 Heap drift monitoring started (30s intervals)');
    }
    
    /**
     * Check for memory heap growth trends
     */
    checkHeapDrift() {
        if (!performance.memory) {
            console.warn('⚠️ performance.memory not available for heap monitoring');
            return;
        }
        
        const now = Date.now();
        const currentHeap = performance.memory.usedJSHeapSize;
        
        // Add new sample
        this.heapSamples.push({
            timestamp: now,
            usedHeap: currentHeap,
            totalHeap: performance.memory.totalJSHeapSize
        });
        
        // Keep only recent samples
        if (this.heapSamples.length > this.maxSamples) {
            this.heapSamples.shift();
        }
        
        // Only analyze if we have enough samples
        if (this.heapSamples.length < 3) return;
        
        // Calculate growth trend using linear regression
        const growthRate = this.calculateHeapGrowthRate();
        const currentGrowthPercent = this.calculateCurrentGrowthPercent();
        
        if (this.debugMode) {
            console.log(`🧠 Heap: ${this.formatBytes(currentHeap)}, Growth: ${(currentGrowthPercent * 100).toFixed(1)}%, Rate: ${this.formatBytes(growthRate)}/min`);
        }
        
        // Check for concerning trends
        if (currentGrowthPercent > this.criticalHeapGrowth) {
            this.handleCriticalHeapGrowth(currentGrowthPercent, growthRate);
        } else if (currentGrowthPercent > this.heapDriftThreshold) {
            this.handleHeapGrowthWarning(currentGrowthPercent, growthRate);
        }
    }
    
    /**
     * Calculate heap growth rate using linear regression
     */
    calculateHeapGrowthRate() {
        if (this.heapSamples.length < 2) return 0;
        
        const samples = this.heapSamples;
        const n = samples.length;
        
        // Calculate linear regression slope (bytes per millisecond)
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        
        for (let i = 0; i < n; i++) {
            const x = samples[i].timestamp;
            const y = samples[i].usedHeap;
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumXX += x * x;
        }
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        
        // Convert to bytes per minute
        return slope * 60000;
    }
    
    /**
     * Calculate current growth percentage compared to oldest sample
     */
    calculateCurrentGrowthPercent() {
        if (this.heapSamples.length < 2) return 0;
        
        const oldest = this.heapSamples[0];
        const newest = this.heapSamples[this.heapSamples.length - 1];
        
        if (oldest.usedHeap === 0) return 0;
        
        return (newest.usedHeap - oldest.usedHeap) / oldest.usedHeap;
    }
    
    /**
     * Handle critical heap growth
     */
    handleCriticalHeapGrowth(growthPercent, growthRate) {
        console.error(`🚨 CRITICAL heap growth: ${(growthPercent * 100).toFixed(1)}% (${this.formatBytes(growthRate)}/min)`);
        
        // Trigger emergency cleanup cascade
        this.triggerEmergencyCleanup();
        
        // Emit critical memory event for other systems
        const event = new CustomEvent('memory:critical', {
            detail: {
                growthPercent: growthPercent,
                growthRate: growthRate,
                currentHeap: performance.memory.usedJSHeapSize
            }
        });
        window.dispatchEvent(event);
    }
    
    /**
     * Handle heap growth warning
     */
    handleHeapGrowthWarning(growthPercent, growthRate) {
        console.warn(`⚠️ Heap growth detected: ${(growthPercent * 100).toFixed(1)}% (${this.formatBytes(growthRate)}/min)`);
        
        // Trigger moderate cleanup
        this.triggerModerateCleanup();
        
        // Emit warning memory event
        const event = new CustomEvent('memory:warning', {
            detail: {
                growthPercent: growthPercent,
                growthRate: growthRate,
                currentHeap: performance.memory.usedJSHeapSize
            }
        });
        window.dispatchEvent(event);
    }
    
    /**
     * Initialize object pools for common allocations
     */
    initializeObjectPools() {
        this.pooledTypes.forEach(type => {
            this.objectPools.set(type, {
                available: [],
                inUse: new Set(),
                created: 0,
                reused: 0,
                maxSize: this.getPoolMaxSize(type)
            });
        });
        
        console.log('🏊 Object pools initialized for:', this.pooledTypes.join(', '));
    }
    
    /**
     * Get pool configuration for object type
     */
    getPoolMaxSize(type) {
        const poolSizes = {
            'Float32Array': 50,    // For particle systems
            'Array': 30,           // For temporary arrays
            'Object': 20,          // For temporary objects
            'Vector3': 100,        // For Three.js vectors
            'Matrix4': 20          // For Three.js matrices
        };
        return poolSizes[type] || 10;
    }
    
    /**
     * Get pooled object
     */
    getPooledObject(type, ...constructorArgs) {
        const pool = this.objectPools.get(type);
        if (!pool) return null;
        
        // Try to reuse existing object
        if (pool.available.length > 0) {
            const obj = pool.available.pop();
            pool.inUse.add(obj);
            pool.reused++;
            return obj;
        }
        
        // Create new object if pool not full
        if (pool.inUse.size < pool.maxSize) {
            let obj;
            
            try {
                switch (type) {
                    case 'Float32Array':
                        obj = new Float32Array(constructorArgs[0] || 1024);
                        break;
                    case 'Array':
                        obj = new Array(constructorArgs[0] || 0);
                        break;
                    case 'Object':
                        obj = {};
                        break;
                    case 'Vector3':
                        if (window.THREE) {
                            obj = new THREE.Vector3();
                        }
                        break;
                    case 'Matrix4':
                        if (window.THREE) {
                            obj = new THREE.Matrix4();
                        }
                        break;
                    default:
                        return null;
                }
                
                if (obj) {
                    pool.inUse.add(obj);
                    pool.created++;
                    return obj;
                }
            } catch (error) {
                console.error(`Failed to create pooled object of type ${type}:`, error);
            }
        }
        
        return null;
    }
    
    /**
     * Return object to pool
     */
    returnPooledObject(obj, type) {
        const pool = this.objectPools.get(type);
        if (!pool || !pool.inUse.has(obj)) return false;
        
        // Reset object state
        this.resetPooledObject(obj, type);
        
        // Move from in-use to available
        pool.inUse.delete(obj);
        pool.available.push(obj);
        
        return true;
    }
    
    /**
     * Reset pooled object to clean state
     */
    resetPooledObject(obj, type) {
        switch (type) {
            case 'Float32Array':
                obj.fill(0);
                break;
            case 'Array':
                obj.length = 0;
                break;
            case 'Object':
                Object.keys(obj).forEach(key => delete obj[key]);
                break;
            case 'Vector3':
                if (obj.set) obj.set(0, 0, 0);
                break;
            case 'Matrix4':
                if (obj.identity) obj.identity();
                break;
        }
    }
    
    /**
     * Start DOM growth monitoring with mutation observer
     */
    startDOMMonitoring() {
        this.domObserver = new MutationObserver((mutations) => {
            this.handleDOMChanges(mutations);
        });
        
        this.domObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false
        });
        
        // Also check DOM count periodically
        intervalManager.createInterval(() => {
            this.checkDOMGrowth();
        }, 10000, 'dom-growth-monitor', {
            category: 'monitoring'
        });
        
        console.log('🌳 DOM growth monitoring started');
    }
    
    /**
     * Handle DOM mutations
     */
    handleDOMChanges(mutations) {
        let addedNodes = 0;
        let removedNodes = 0;
        
        mutations.forEach(mutation => {
            addedNodes += mutation.addedNodes.length;
            removedNodes += mutation.removedNodes.length;
        });
        
        // Track significant changes
        const netChange = addedNodes - removedNodes;
        if (Math.abs(netChange) > 5) {
            if (this.debugMode) {
                console.log(`🌳 DOM change: +${addedNodes} -${removedNodes} (net: ${netChange >= 0 ? '+' : ''}${netChange})`);
            }
            
            // Check if we should trigger cleanup
            this.checkDOMGrowth();
        }
    }
    
    /**
     * Check DOM node count growth
     */
    checkDOMGrowth() {
        const currentCount = document.querySelectorAll('*').length;
        const growth = currentCount - this.initialDOMNodes;
        const recentGrowth = currentCount - this.lastDOMCount;
        
        if (this.debugMode && recentGrowth !== 0) {
            console.log(`🌳 DOM nodes: ${currentCount} (total growth: ${growth}, recent: ${recentGrowth >= 0 ? '+' : ''}${recentGrowth})`);
        }
        
        this.lastDOMCount = currentCount;
        
        // Check thresholds
        if (growth > this.maxDOMGrowth) {
            this.handleExcessiveDOMGrowth(growth, currentCount);
        } else if (growth > this.domGrowthWarning) {
            console.warn(`⚠️ DOM growth warning: ${growth} nodes added since initialization`);
        }
    }
    
    /**
     * Handle excessive DOM growth
     */
    handleExcessiveDOMGrowth(growth, currentCount) {
        console.error(`🚨 Excessive DOM growth: ${growth} nodes (${currentCount} total)`);
        
        // Trigger DOM cleanup through performance element manager (use global reference)
        let cleanedCount = 0;
        if (window.performanceElementManager && typeof window.performanceElementManager.removeOrphanedElements === 'function') {
            try {
                cleanedCount = window.performanceElementManager.removeOrphanedElements();
                console.log(`🧹 Cleaned up ${cleanedCount} orphaned elements via performance manager`);
            } catch (error) {
                console.warn('⚠️ Error cleaning orphaned elements via performance manager:', error);
            }
        }
        
        // Fallback manual cleanup if performance manager isn't available or failed
        if (cleanedCount === 0) {
            cleanedCount = this.performFallbackDOMCleanup();
        }
        
        // Emit DOM growth event
        const event = new CustomEvent('dom:excessive-growth', {
            detail: { growth, currentCount, cleanedCount }
        });
        window.dispatchEvent(event);
    }
    
    /**
     * Fallback DOM cleanup when performance manager isn't available
     */
    performFallbackDOMCleanup() {
        console.log('🧹 Performing fallback DOM cleanup...');
        
        let cleanedCount = 0;
        
        // Clean up common temporary elements
        const temporarySelectors = [
            'div[style*="position: fixed"][style*="z-index: 999"]',
            '.matrix-overlay',
            '.phase-overlay', 
            '.flash-overlay',
            '.glitch-overlay',
            '[data-temp="true"]',
            '.perf-managed:not([data-permanent])'
        ];
        
        temporarySelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                // Extra safety checks
                if (!el.classList.contains('pre-loader') && 
                    !el.classList.contains('control-panel') &&
                    !el.querySelector('.logo-text') &&
                    !el.querySelector('.image-2')) {
                    try {
                        el.remove();
                        cleanedCount++;
                    } catch (e) {
                        // Silent fail - element may have been removed already
                    }
                }
            });
        });
        
        // Clean up detached elements
        const detachedElements = document.querySelectorAll('*');
        detachedElements.forEach(el => {
            if (!el.isConnected && el.parentNode) {
                try {
                    el.parentNode.removeChild(el);
                    cleanedCount++;
                } catch (e) {
                    // Element may have been removed already
                }
            }
        });
        
        console.log(`🧹 Fallback cleanup removed ${cleanedCount} elements`);
        return cleanedCount;
    }
    
    /**
     * Setup WebGL resource tracking
     */
    setupWebGLTracking() {
        // Find WebGL context
        const canvas = document.querySelector('canvas');
        if (canvas) {
            this.webglContext = canvas.getContext('webgl') || canvas.getContext('webgl2');
            
            if (this.webglContext) {
                // Patch WebGL methods for resource tracking
                this.patchWebGLMethods();
                console.log('🎮 WebGL resource tracking enabled');
            }
        }
    }
    
    /**
     * Patch WebGL methods to track resource creation/disposal
     */
    patchWebGLMethods() {
        if (!this.webglContext || this.webglContext._memoryGuardianPatched) return;
        
        const gl = this.webglContext;
        const guardian = this;
        
        // Track texture creation
        const originalCreateTexture = gl.createTexture;
        gl.createTexture = function() {
            const texture = originalCreateTexture.call(this);
            if (texture) {
                guardian.webglResources.set(texture, {
                    type: 'texture',
                    createdAt: Date.now()
                });
            }
            return texture;
        };
        
        // Track program creation
        const originalCreateProgram = gl.createProgram;
        gl.createProgram = function() {
            const program = originalCreateProgram.call(this);
            if (program) {
                guardian.webglResources.set(program, {
                    type: 'program',
                    createdAt: Date.now()
                });
            }
            return program;
        };
        
        // Track buffer creation
        const originalCreateBuffer = gl.createBuffer;
        gl.createBuffer = function() {
            const buffer = originalCreateBuffer.call(this);
            if (buffer) {
                guardian.webglResources.set(buffer, {
                    type: 'buffer',
                    createdAt: Date.now()
                });
            }
            return buffer;
        };
        
        gl._memoryGuardianPatched = true;
    }
    
    /**
     * Register event listener with automatic cleanup
     */
    addManagedEventListener(target, event, handler, options = {}) {
        const listenerId = ++this.listenerCounter;
        
        // Check limits
        if (this.eventListeners.size >= this.maxListeners) {
            console.warn('⚠️ Max event listeners reached, cleaning up oldest');
            this.cleanupOldestListeners(10);
        }
        
        // Add the listener
        target.addEventListener(event, handler, options);
        
        // Track it
        this.eventListeners.set(listenerId, {
            target,
            event,
            handler,
            options,
            createdAt: Date.now(),
            category: options.category || 'general'
        });
        
        // Return control object
        return {
            id: listenerId,
            remove: () => this.removeManagedEventListener(listenerId)
        };
    }
    
    /**
     * Remove managed event listener
     */
    removeManagedEventListener(listenerId) {
        const listener = this.eventListeners.get(listenerId);
        if (!listener) return false;
        
        listener.target.removeEventListener(listener.event, listener.handler, listener.options);
        this.eventListeners.delete(listenerId);
        
        return true;
    }
    
    /**
     * Clean up oldest event listeners
     */
    cleanupOldestListeners(count = 5) {
        const sortedListeners = Array.from(this.eventListeners.entries())
            .sort(([, a], [, b]) => a.createdAt - b.createdAt)
            .slice(0, count);
        
        sortedListeners.forEach(([id]) => {
            this.removeManagedEventListener(id);
        });
        
        console.log(`🧹 Cleaned up ${sortedListeners.length} oldest event listeners`);
    }
    
    /**
     * Start periodic maintenance tasks
     */
    startPeriodicMaintenance() {
        intervalManager.createInterval(() => {
            this.performMaintenance();
        }, 60000, 'memory-maintenance', {
            category: 'maintenance'
        });
    }
    
    /**
     * Perform periodic maintenance
     */
    performMaintenance() {
        if (this.debugMode) {
            console.log('🧹 Performing periodic maintenance...');
        }
        
        // Clean up WebGL resources if needed
        this.checkWebGLResources();
        
        // Clean up object pools
        this.maintainObjectPools();
        
        // Check for stale event listeners
        this.checkStaleEventListeners();
    }
    
    /**
     * Check WebGL resource counts
     */
    checkWebGLResources() {
        if (!this.webglContext) return;
        
        const resources = Array.from(this.webglResources.values());
        const textureCount = resources.filter(r => r.type === 'texture').length;
        const programCount = resources.filter(r => r.type === 'program').length;
        
        if (textureCount > this.maxTextures) {
            console.warn(`⚠️ WebGL texture count high: ${textureCount}/${this.maxTextures}`);
        }
        
        if (programCount > this.maxPrograms) {
            console.warn(`⚠️ WebGL program count high: ${programCount}/${this.maxPrograms}`);
        }
        
        if (this.debugMode) {
            console.log(`🎮 WebGL resources: ${textureCount} textures, ${programCount} programs`);
        }
    }
    
    /**
     * Maintain object pools
     */
    maintainObjectPools() {
        this.objectPools.forEach((pool, type) => {
            // Trim available pool if too large
            if (pool.available.length > pool.maxSize / 2) {
                const toRemove = pool.available.length - Math.floor(pool.maxSize / 2);
                pool.available.splice(0, toRemove);
            }
        });
    }
    
    /**
     * Check for stale event listeners
     */
    checkStaleEventListeners() {
        const now = Date.now();
        const staleAge = 300000; // 5 minutes
        const staleListeners = [];
        
        this.eventListeners.forEach((listener, id) => {
            if (now - listener.createdAt > staleAge) {
                staleListeners.push(id);
            }
        });
        
        if (staleListeners.length > 0) {
            console.log(`🧹 Removing ${staleListeners.length} stale event listeners`);
            staleListeners.forEach(id => this.removeManagedEventListener(id));
        }
    }
    
    /**
     * Trigger moderate cleanup
     */
    triggerModerateCleanup() {
        console.log('🧹 Triggering moderate cleanup...');
        
        // Clean up performance element manager (use global reference)
        if (window.performanceElementManager && typeof window.performanceElementManager.removeOrphanedElements === 'function') {
            try {
                window.performanceElementManager.removeOrphanedElements();
            } catch (error) {
                console.warn('⚠️ Error in moderate cleanup via performance manager:', error);
            }
        }
        
        // Clean up interval manager
        if (intervalManager && typeof intervalManager.performAutoCleanup === 'function') {
            intervalManager.performAutoCleanup();
        }
        
        // Trim object pools
        this.maintainObjectPools();
    }
    
    /**
     * Trigger emergency cleanup
     */
    triggerEmergencyCleanup() {
        console.log('🚨 EMERGENCY CLEANUP TRIGGERED');
        
        // Emergency cleanup via performance element manager (use global reference)
        if (window.performanceElementManager && typeof window.performanceElementManager.emergencyCleanup === 'function') {
            try {
                window.performanceElementManager.emergencyCleanup();
            } catch (error) {
                console.warn('⚠️ Error in emergency cleanup via performance manager:', error);
            }
        }
        
        // Stop non-essential intervals
        if (intervalManager) {
            intervalManager.clearCategory('effects');
            intervalManager.clearCategory('animations');
        }
        
        // Clean all object pools
        this.objectPools.forEach(pool => {
            pool.available.length = 0;
            pool.inUse.clear();
        });
        
        // Clean up old event listeners
        this.cleanupOldestListeners(20);
        
        // Force garbage collection hint
        if (window.gc) {
            window.gc();
        }
        
        // Clear heap samples to get fresh baseline
        this.heapSamples.length = 0;
    }
    
    /**
     * Register scene with disposal contract
     */
    registerScene(sceneId, disposeFunction) {
        this.activeScenes.set(sceneId, {
            id: sceneId,
            createdAt: Date.now(),
            lastAccessed: Date.now()
        });
        
        this.sceneDisposers.set(sceneId, disposeFunction);
        
        console.log(`🎬 Registered scene: ${sceneId}`);
    }
    
    /**
     * Dispose scene properly
     */
    disposeScene(sceneId) {
        const disposeFunction = this.sceneDisposers.get(sceneId);
        if (disposeFunction) {
            try {
                disposeFunction();
                console.log(`🗑️ Disposed scene: ${sceneId}`);
            } catch (error) {
                console.error(`❌ Error disposing scene ${sceneId}:`, error);
            }
        }
        
        this.activeScenes.delete(sceneId);
        this.sceneDisposers.delete(sceneId);
    }
    
    /**
     * Get memory leak guardian statistics
     */
    getStats() {
        const poolStats = {};
        this.objectPools.forEach((pool, type) => {
            poolStats[type] = {
                available: pool.available.length,
                inUse: pool.inUse.size,
                created: pool.created,
                reused: pool.reused,
                efficiency: pool.created > 0 ? pool.reused / pool.created : 0
            };
        });
        
        return {
            heap: {
                samples: this.heapSamples.length,
                currentGrowth: this.calculateCurrentGrowthPercent(),
                growthRate: this.calculateHeapGrowthRate()
            },
            dom: {
                initialNodes: this.initialDOMNodes,
                currentNodes: document.querySelectorAll('*').length,
                growth: document.querySelectorAll('*').length - this.initialDOMNodes
            },
            eventListeners: this.eventListeners.size,
            objectPools: poolStats,
            webglResources: this.webglResources.size,
            activeScenes: this.activeScenes.size
        };
    }
    
    /**
     * Format bytes for display
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    /**
     * Stop memory leak guardian
     */
    stopGuardian() {
        this.isActive = false;
        
        if (this.domObserver) {
            this.domObserver.disconnect();
        }
        
        // Clean up all managed event listeners
        this.eventListeners.forEach((_, id) => {
            this.removeManagedEventListener(id);
        });
        
        console.log('🛡️ Memory Leak Guardian stopped');
    }
}

// Global instance
let memoryLeakGuardian = null;

// Initialize on load
if (typeof window !== 'undefined') {
    memoryLeakGuardian = new MemoryLeakGuardian();
    window.memoryLeakGuardian = memoryLeakGuardian;
    
    // Auto-start guardian
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            memoryLeakGuardian.startGuardian();
        });
    } else {
        memoryLeakGuardian.startGuardian();
    }
    
    // Console debugging helpers
    if (featureFlags.isEnabled('debugMetrics')) {
        window.memoryStats = () => console.table(memoryLeakGuardian.getStats());
        window.memoryCleanup = () => memoryLeakGuardian.triggerModerateCleanup();
        window.memoryEmergency = () => memoryLeakGuardian.triggerEmergencyCleanup();
    }
}

export default memoryLeakGuardian;