/**
 * Smart Preloader System for ZIKADA 3886
 * 
 * Implements intelligent resource preloading with:
 * - requestIdleCallback for non-blocking background loading
 * - Network Information API for connection-aware strategies
 * - Performance ladder integration for adaptive behavior
 * - Resource prioritization with cache management
 * - Strict 100KB budget enforcement
 */

import featureFlags from './feature-flags.js';

class SmartPreloader {
    constructor() {
        this.isActive = false;
        this.debugMode = featureFlags.isEnabled('debugMetrics');
        
        // Network Information API support
        this.networkInfo = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        this.networkType = 'unknown';
        this.effectiveType = 'unknown';
        this.downlink = 1; // Default to 1 Mbps
        this.saveData = false;
        
        // Preload queue and management
        this.preloadQueue = [];
        this.activePreloads = new Map(); // Track ongoing preloads
        this.loadedResources = new Map(); // Cache of loaded resources
        this.failedResources = new Set(); // Track failed loads to avoid retry loops
        
        // Performance integration
        this.currentPerformanceState = 'S0';
        this.isPerformanceEmergency = false;
        this.lastIdleCallback = 0;
        this.idleCallbackId = null;
        
        // Budget management (100KB total budget)
        this.budgetUsed = 0;
        this.maxBudget = 100 * 1024; // 100KB in bytes
        this.reservedBudget = 20 * 1024; // Reserve 20KB for critical resources
        
        // Timing and throttling
        this.maxConcurrentLoads = 3;
        this.idleTimeThreshold = 16; // ms - minimum idle time required
        this.networkTimeoutMs = 10000; // 10s timeout for resource loads
        
        // Resource type configurations
        this.resourceTypes = {
            'critical': { 
                priority: 100, 
                maxSize: 20 * 1024, // 20KB max per critical resource
                networkRestriction: 'none',
                performanceStates: ['S0', 'S1', 'S2', 'S3', 'S4', 'S5']
            },
            'important': { 
                priority: 75, 
                maxSize: 15 * 1024, // 15KB max
                networkRestriction: 'fast',
                performanceStates: ['S0', 'S1', 'S2', 'S3']
            },
            'normal': { 
                priority: 50, 
                maxSize: 10 * 1024, // 10KB max
                networkRestriction: 'wifi',
                performanceStates: ['S0', 'S1', 'S2']
            },
            'low': { 
                priority: 25, 
                maxSize: 5 * 1024, // 5KB max
                networkRestriction: 'wifi',
                performanceStates: ['S0', 'S1']
            },
            'optional': { 
                priority: 10, 
                maxSize: 3 * 1024, // 3KB max
                networkRestriction: 'wifi-only',
                performanceStates: ['S0']
            }
        };
        
        // Statistics tracking
        this.stats = {
            totalRequested: 0,
            totalLoaded: 0,
            totalFailed: 0,
            totalSkipped: 0,
            bytesLoaded: 0,
            averageLoadTime: 0,
            networkConditions: new Map()
        };
        
        this.initializeNetworkMonitoring();
        this.setupPerformanceIntegration();
        
        console.log('🚀 Smart Preloader initialized');
        if (this.debugMode) {
            this.logNetworkInfo();
        }
    }
    
    /**
     * Initialize network monitoring
     */
    initializeNetworkMonitoring() {
        if (this.networkInfo) {
            this.updateNetworkInfo();
            
            // Listen for network changes
            this.networkInfo.addEventListener('change', () => {
                this.updateNetworkInfo();
                this.adaptToNetworkChange();
            });
        }
        
        // Check for data saver preference
        if ('connection' in navigator && 'saveData' in navigator.connection) {
            this.saveData = navigator.connection.saveData;
        }
        
        if (this.debugMode) {
            console.log('🌐 Network monitoring initialized');
        }
    }
    
    /**
     * Update network information from API
     */
    updateNetworkInfo() {
        if (!this.networkInfo) return;
        
        this.networkType = this.networkInfo.type || 'unknown';
        this.effectiveType = this.networkInfo.effectiveType || 'unknown';
        this.downlink = this.networkInfo.downlink || 1;
        this.saveData = this.networkInfo.saveData || false;
        
        // Log network condition stats
        const condition = `${this.effectiveType}-${this.downlink}mbps`;
        const count = this.stats.networkConditions.get(condition) || 0;
        this.stats.networkConditions.set(condition, count + 1);
        
        if (this.debugMode) {
            console.log(`🌐 Network updated: ${this.effectiveType} (${this.downlink} Mbps)${this.saveData ? ' [Save Data]' : ''}`);
        }
    }
    
    /**
     * Set up integration with performance systems
     */
    setupPerformanceIntegration() {
        // Listen for performance ladder state changes
        window.addEventListener('performance:state:changed', (event) => {
            const { to: newState } = event.detail;
            this.currentPerformanceState = newState;
            this.adaptToPerformanceState(newState);
        });
        
        // Listen for performance emergencies
        window.addEventListener('performance:emergency', () => {
            this.isPerformanceEmergency = true;
            this.pausePreloading('performance_emergency');
        });
        
        // Listen for performance restoration
        window.addEventListener('performance:restore', () => {
            this.isPerformanceEmergency = false;
            this.resumePreloading();
        });
        
        // Listen for memory warnings
        window.addEventListener('memory:warning', () => {
            this.reducePreloadingActivity('memory_warning');
        });
        
        window.addEventListener('memory:critical', () => {
            this.pausePreloading('memory_critical');
            this.clearNonCriticalCache();
        });
        
        if (this.debugMode) {
            console.log('📊 Performance integration initialized');
        }
    }
    
    /**
     * Start the preloader system
     */
    start() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.startIdleCallbackLoop();
        
        console.log('🚀 Smart Preloader started');
        
        // Emit start event
        this.emitEvent('preloader:started', {
            networkType: this.effectiveType,
            performanceState: this.currentPerformanceState,
            budgetAvailable: this.maxBudget - this.budgetUsed
        });
    }
    
    /**
     * Stop the preloader system
     */
    stop() {
        if (!this.isActive) return;
        
        this.isActive = false;
        
        // Cancel ongoing idle callback
        if (this.idleCallbackId) {
            cancelIdleCallback(this.idleCallbackId);
            this.idleCallbackId = null;
        }
        
        // Cancel all active preloads
        this.activePreloads.forEach((controller) => {
            controller.abort();
        });
        this.activePreloads.clear();
        
        console.log('⏹️ Smart Preloader stopped');
        this.emitEvent('preloader:stopped', { stats: this.getStats() });
    }
    
    /**
     * Schedule a resource for preloading
     */
    schedulePreload(resource) {
        if (!this.isActive || !this.validateResource(resource)) {
            return false;
        }
        
        // Check if already loaded or failed
        if (this.loadedResources.has(resource.url) || this.failedResources.has(resource.url)) {
            return false;
        }
        
        // Check if already in queue
        if (this.preloadQueue.find(r => r.url === resource.url)) {
            return false;
        }
        
        // Validate resource configuration
        const config = this.resourceTypes[resource.type] || this.resourceTypes.normal;
        
        // Check performance state compatibility
        if (!config.performanceStates.includes(this.currentPerformanceState)) {
            this.stats.totalSkipped++;
            if (this.debugMode) {
                console.log(`⏭️ Skipping ${resource.url} - incompatible with performance state ${this.currentPerformanceState}`);
            }
            return false;
        }
        
        // Check network restrictions
        if (!this.isNetworkSuitable(config.networkRestriction)) {
            this.stats.totalSkipped++;
            if (this.debugMode) {
                console.log(`⏭️ Skipping ${resource.url} - network restriction: ${config.networkRestriction}`);
            }
            return false;
        }
        
        // Check budget constraints
        const estimatedSize = resource.estimatedSize || config.maxSize;
        if (this.budgetUsed + estimatedSize > this.maxBudget) {
            this.stats.totalSkipped++;
            if (this.debugMode) {
                console.log(`⏭️ Skipping ${resource.url} - budget exceeded (${estimatedSize} bytes)`);
            }
            return false;
        }
        
        // Add to queue with configuration
        const enrichedResource = {
            ...resource,
            config,
            priority: resource.priority || config.priority,
            estimatedSize,
            scheduledAt: performance.now(),
            attempts: 0
        };
        
        this.preloadQueue.push(enrichedResource);
        this.preloadQueue.sort((a, b) => b.priority - a.priority); // Sort by priority
        
        this.stats.totalRequested++;
        
        if (this.debugMode) {
            console.log(`📋 Scheduled ${resource.url} (priority: ${enrichedResource.priority}, size: ${estimatedSize})`);
        }
        
        return true;
    }
    
    /**
     * Validate resource object
     */
    validateResource(resource) {
        if (!resource || typeof resource !== 'object') {
            console.warn('Invalid resource object');
            return false;
        }
        
        if (!resource.url || typeof resource.url !== 'string') {
            console.warn('Resource must have valid URL');
            return false;
        }
        
        if (!resource.type || !this.resourceTypes[resource.type]) {
            console.warn(`Unknown resource type: ${resource.type}`);
            return false;
        }
        
        return true;
    }
    
    /**
     * Check if network is suitable for loading
     */
    isNetworkSuitable(restriction) {
        if (this.saveData && restriction !== 'critical') {
            return false; // Respect data saver
        }
        
        switch (restriction) {
            case 'none':
                return true;
            
            case 'fast':
                return this.effectiveType === '4g' || this.effectiveType === '5g' || 
                       this.networkType === 'wifi' || this.downlink >= 4;
            
            case 'wifi':
                return this.networkType === 'wifi' || 
                       (this.effectiveType === '4g' && this.downlink >= 10);
            
            case 'wifi-only':
                return this.networkType === 'wifi';
            
            default:
                return true;
        }
    }
    
    /**
     * Start the idle callback loop for background loading
     */
    startIdleCallbackLoop() {
        if (!this.isActive || this.isPerformanceEmergency) return;
        
        const processQueue = (deadline) => {
            if (!this.isActive) return;
            
            // Process queue while we have idle time and resources to load
            while (deadline.timeRemaining() > this.idleTimeThreshold && 
                   this.preloadQueue.length > 0 && 
                   this.activePreloads.size < this.maxConcurrentLoads) {
                
                const resource = this.preloadQueue.shift();
                if (resource && this.shouldLoadNow(resource)) {
                    this.startResourceLoad(resource);
                }
                
                // Break if we've used too much time
                if (deadline.timeRemaining() <= this.idleTimeThreshold) {
                    break;
                }
            }
            
            // Schedule next idle callback
            if (this.isActive && (this.preloadQueue.length > 0 || this.activePreloads.size > 0)) {
                this.idleCallbackId = requestIdleCallback(processQueue, { timeout: 5000 });
            }
        };
        
        // Start the first idle callback
        this.idleCallbackId = requestIdleCallback(processQueue, { timeout: 1000 });
        
        if (this.debugMode) {
            console.log('⏰ Idle callback loop started');
        }
    }
    
    /**
     * Check if a resource should be loaded now
     */
    shouldLoadNow(resource) {
        // Check budget
        if (this.budgetUsed + resource.estimatedSize > this.maxBudget) {
            return false;
        }
        
        // Check performance state (may have changed since scheduling)
        if (!resource.config.performanceStates.includes(this.currentPerformanceState)) {
            return false;
        }
        
        // Check network (may have changed)
        if (!this.isNetworkSuitable(resource.config.networkRestriction)) {
            return false;
        }
        
        // Check if too many attempts
        if (resource.attempts >= 3) {
            this.failedResources.add(resource.url);
            return false;
        }
        
        return true;
    }
    
    /**
     * Start loading a resource
     */
    async startResourceLoad(resource) {
        const controller = new AbortController();
        const startTime = performance.now();
        
        this.activePreloads.set(resource.url, controller);
        resource.attempts++;
        
        try {
            if (this.debugMode) {
                console.log(`🔽 Loading ${resource.url} (attempt ${resource.attempts})`);
            }
            
            const response = await fetch(resource.url, {
                signal: controller.signal,
                cache: 'force-cache', // Try cache first
                priority: resource.priority > 75 ? 'high' : 'low'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            // Check actual size against budget
            const contentLength = response.headers.get('content-length');
            const actualSize = contentLength ? parseInt(contentLength, 10) : resource.estimatedSize;
            
            if (this.budgetUsed + actualSize > this.maxBudget) {
                throw new Error('Budget exceeded');
            }
            
            // Load the resource data
            const data = await response.blob();
            const finalSize = data.size;
            
            // Store in cache
            this.loadedResources.set(resource.url, {
                data,
                size: finalSize,
                loadedAt: performance.now(),
                type: resource.type,
                response
            });
            
            // Update budget
            this.budgetUsed += finalSize;
            
            // Update statistics
            const loadTime = performance.now() - startTime;
            this.stats.totalLoaded++;
            this.stats.bytesLoaded += finalSize;
            this.stats.averageLoadTime = (this.stats.averageLoadTime * (this.stats.totalLoaded - 1) + loadTime) / this.stats.totalLoaded;
            
            if (this.debugMode) {
                console.log(`✅ Loaded ${resource.url} (${finalSize} bytes, ${loadTime.toFixed(1)}ms)`);
            }
            
            // Emit success event
            this.emitEvent('preloader:loaded', {
                url: resource.url,
                size: finalSize,
                loadTime,
                type: resource.type,
                budgetUsed: this.budgetUsed
            });
            
        } catch (error) {
            // Handle load failure
            this.handleLoadFailure(resource, error, performance.now() - startTime);
        } finally {
            // Clean up
            this.activePreloads.delete(resource.url);
            
            // Continue processing if there's more work
            if (this.preloadQueue.length > 0 && this.activePreloads.size < this.maxConcurrentLoads) {
                this.scheduleNextIdleCallback();
            }
        }
    }
    
    /**
     * Handle resource load failure
     */
    handleLoadFailure(resource, error, loadTime) {
        this.stats.totalFailed++;
        
        // Determine if we should retry
        const shouldRetry = resource.attempts < 3 && 
                           !error.message.includes('Budget exceeded') &&
                           error.name !== 'AbortError';
        
        if (shouldRetry) {
            // Add back to queue with lower priority
            resource.priority = Math.max(10, resource.priority - 25);
            this.preloadQueue.push(resource);
            this.preloadQueue.sort((a, b) => b.priority - a.priority);
            
            if (this.debugMode) {
                console.log(`🔄 Retrying ${resource.url} with reduced priority (${resource.priority})`);
            }
        } else {
            // Mark as failed
            this.failedResources.add(resource.url);
            
            if (this.debugMode) {
                console.log(`❌ Failed to load ${resource.url}: ${error.message} (${loadTime.toFixed(1)}ms)`);
            }
        }
        
        // Emit failure event
        this.emitEvent('preloader:failed', {
            url: resource.url,
            error: error.message,
            attempts: resource.attempts,
            loadTime,
            willRetry: shouldRetry
        });
    }
    
    /**
     * Schedule next idle callback if needed
     */
    scheduleNextIdleCallback() {
        if (this.isActive && !this.idleCallbackId) {
            this.idleCallbackId = requestIdleCallback(() => this.startIdleCallbackLoop(), { timeout: 1000 });
        }
    }
    
    /**
     * Adapt to network changes
     */
    adaptToNetworkChange() {
        if (this.debugMode) {
            console.log(`🌐 Adapting to network change: ${this.effectiveType} (${this.downlink} Mbps)`);
        }
        
        // Adjust concurrent load limit based on network
        if (this.effectiveType === 'slow-2g' || this.effectiveType === '2g') {
            this.maxConcurrentLoads = 1;
        } else if (this.effectiveType === '3g') {
            this.maxConcurrentLoads = 2;
        } else {
            this.maxConcurrentLoads = 3;
        }
        
        // Re-evaluate queued resources
        this.preloadQueue = this.preloadQueue.filter(resource => {
            if (!this.isNetworkSuitable(resource.config.networkRestriction)) {
                this.stats.totalSkipped++;
                return false;
            }
            return true;
        });
        
        // Restart idle callback if needed
        if (this.preloadQueue.length > 0) {
            this.scheduleNextIdleCallback();
        }
    }
    
    /**
     * Adapt to performance state changes
     */
    adaptToPerformanceState(newState) {
        if (this.debugMode) {
            console.log(`📊 Adapting to performance state: ${newState}`);
        }
        
        // Adjust behavior based on performance state
        switch (newState) {
            case 'S0':
            case 'S1':
                // Normal operation
                this.maxConcurrentLoads = 3;
                this.idleTimeThreshold = 16;
                break;
                
            case 'S2':
            case 'S3':
                // Reduced activity
                this.maxConcurrentLoads = 2;
                this.idleTimeThreshold = 32;
                break;
                
            case 'S4':
            case 'S5':
                // Minimal activity
                this.maxConcurrentLoads = 1;
                this.idleTimeThreshold = 64;
                break;
        }
        
        // Filter queue based on new performance state
        this.preloadQueue = this.preloadQueue.filter(resource => {
            if (!resource.config.performanceStates.includes(newState)) {
                this.stats.totalSkipped++;
                return false;
            }
            return true;
        });
        
        // Cancel non-critical loads in severe performance degradation
        if (newState === 'S4' || newState === 'S5') {
            this.activePreloads.forEach((controller, url) => {
                const resource = Array.from(this.loadedResources.values())
                    .find(r => r.type !== 'critical');
                if (resource) {
                    controller.abort();
                }
            });
        }
    }
    
    /**
     * Pause preloading activity
     */
    pausePreloading(reason) {
        this.isActive = false;
        
        if (this.idleCallbackId) {
            cancelIdleCallback(this.idleCallbackId);
            this.idleCallbackId = null;
        }
        
        // Cancel non-critical active preloads
        this.activePreloads.forEach((controller, url) => {
            const cached = this.loadedResources.get(url);
            if (!cached || cached.type !== 'critical') {
                controller.abort();
            }
        });
        
        if (this.debugMode) {
            console.log(`⏸️ Preloading paused: ${reason}`);
        }
        
        this.emitEvent('preloader:paused', { reason });
    }
    
    /**
     * Resume preloading activity
     */
    resumePreloading() {
        if (this.isPerformanceEmergency) return;
        
        this.isActive = true;
        
        if (this.preloadQueue.length > 0) {
            this.scheduleNextIdleCallback();
        }
        
        if (this.debugMode) {
            console.log('▶️ Preloading resumed');
        }
        
        this.emitEvent('preloader:resumed', {});
    }
    
    /**
     * Reduce preloading activity
     */
    reducePreloadingActivity(reason) {
        // Reduce concurrent loads
        this.maxConcurrentLoads = Math.max(1, Math.floor(this.maxConcurrentLoads / 2));
        
        // Increase idle time threshold
        this.idleTimeThreshold *= 2;
        
        // Cancel lowest priority active loads
        const activeUrls = Array.from(this.activePreloads.keys());
        const lowestPriorityUrl = activeUrls
            .map(url => ({
                url,
                resource: this.preloadQueue.find(r => r.url === url) || { priority: 0 }
            }))
            .sort((a, b) => a.resource.priority - b.resource.priority)[0];
        
        if (lowestPriorityUrl) {
            const controller = this.activePreloads.get(lowestPriorityUrl.url);
            if (controller) {
                controller.abort();
            }
        }
        
        if (this.debugMode) {
            console.log(`🔽 Preloading activity reduced: ${reason}`);
        }
    }
    
    /**
     * Clear non-critical cache to free memory
     */
    clearNonCriticalCache() {
        let clearedBytes = 0;
        const urlsToRemove = [];
        
        for (const [url, cached] of this.loadedResources) {
            if (cached.type !== 'critical') {
                clearedBytes += cached.size;
                urlsToRemove.push(url);
            }
        }
        
        urlsToRemove.forEach(url => {
            this.loadedResources.delete(url);
        });
        
        this.budgetUsed -= clearedBytes;
        
        if (this.debugMode) {
            console.log(`🗑️ Cleared ${urlsToRemove.length} non-critical resources (${clearedBytes} bytes)`);
        }
        
        this.emitEvent('preloader:cache-cleared', {
            resourcesCleared: urlsToRemove.length,
            bytesCleared: clearedBytes,
            budgetUsed: this.budgetUsed
        });
    }
    
    /**
     * Get a cached resource
     */
    getResource(url) {
        return this.loadedResources.get(url) || null;
    }
    
    /**
     * Check if a resource is cached
     */
    isResourceCached(url) {
        return this.loadedResources.has(url);
    }
    
    /**
     * Get preloader statistics
     */
    getStats() {
        return {
            ...this.stats,
            budgetUsed: this.budgetUsed,
            budgetTotal: this.maxBudget,
            budgetUtilization: (this.budgetUsed / this.maxBudget) * 100,
            queueSize: this.preloadQueue.length,
            activeLoads: this.activePreloads.size,
            cachedResources: this.loadedResources.size,
            failedUrls: Array.from(this.failedResources),
            networkInfo: {
                type: this.networkType,
                effectiveType: this.effectiveType,
                downlink: this.downlink,
                saveData: this.saveData
            },
            performanceState: this.currentPerformanceState,
            isActive: this.isActive
        };
    }
    
    /**
     * Log network information
     */
    logNetworkInfo() {
        console.log('🌐 Network Information:');
        console.log(`  Type: ${this.networkType}`);
        console.log(`  Effective Type: ${this.effectiveType}`);
        console.log(`  Downlink: ${this.downlink} Mbps`);
        console.log(`  Save Data: ${this.saveData}`);
    }
    
    /**
     * Emit events for coordination with other systems
     */
    emitEvent(eventName, data) {
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            const event = new CustomEvent(eventName, { detail: data });
            window.dispatchEvent(event);
        }
    }
    
    /**
     * Cleanup and destroy
     */
    destroy() {
        this.stop();
        this.loadedResources.clear();
        this.preloadQueue = [];
        this.failedResources.clear();
        
        console.log('💀 Smart Preloader destroyed');
    }
}

// Create singleton instance
const smartPreloader = new SmartPreloader();

// Expose for debugging
if (typeof window !== 'undefined') {
    window.SMART_PRELOADER = smartPreloader;
}

export default smartPreloader;