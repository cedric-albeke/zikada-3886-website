// Performance Monitor - Real-time performance monitoring and alerts

import performanceElementManager from './performance-element-manager.js';
import intervalManager from './interval-manager.js';
import gsapAnimationRegistry from './gsap-animation-registry.js';

class PerformanceMonitor {
    constructor() {
        this.isMonitoring = false;
        this.metrics = {
            fps: 60,
            fpsHistory: [],
            memoryUsage: 0,
            domNodes: 0,
            activeAnimations: 0,
            activeIntervals: 0,
            managedElements: 0
        };
        
        this.thresholds = {
            fps: { warning: 30, critical: 15 },
            memoryUsage: { warning: 100 * 1024 * 1024, critical: 200 * 1024 * 1024 }, // 100MB, 200MB
            domNodes: { warning: 5000, critical: 10000 },
            managedElements: { warning: 200, critical: 500 },
            animations: { warning: 100, critical: 200 },
            intervals: { warning: 15, critical: 25 }
        };

        this.alerts = [];
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        
        // UI Elements
        this.uiContainer = null;
        this.isUIVisible = false;
        
        console.log('📊 Performance Monitor initialized');
    }

    /**
     * Start performance monitoring
     */
    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        
        // Create monitoring UI
        this.createUI();
        
        // Start FPS monitoring
        this.startFPSMonitoring();
        
        // Start periodic system checks
        this.startSystemMonitoring();
        
        console.log('📊 Performance monitoring started');
    }

    /**
     * Stop performance monitoring
     */
    stopMonitoring() {
        if (!this.isMonitoring) return;
        
        this.isMonitoring = false;
        
        // Clear monitoring intervals
        if (this.fpsMonitorId) {
            cancelAnimationFrame(this.fpsMonitorId);
        }
        
        if (this.systemMonitorInterval) {
            clearInterval(this.systemMonitorInterval);
        }
        
        // Hide UI
        this.hideUI();
        
        console.log('📊 Performance monitoring stopped');
    }

    /**
     * Start FPS monitoring
     */
    startFPSMonitoring() {
        const measureFPS = () => {
            if (!this.isMonitoring) return;
            
            const now = performance.now();
            this.frameCount++;
            
            // Calculate FPS every second
            if (now >= this.lastFrameTime + 1000) {
                const currentFPS = (this.frameCount * 1000) / (now - this.lastFrameTime);
                
                this.metrics.fps = Math.round(currentFPS);
                this.metrics.fpsHistory.push(this.metrics.fps);
                
                // Keep only last 60 seconds
                if (this.metrics.fpsHistory.length > 60) {
                    this.metrics.fpsHistory.shift();
                }
                
                // Check FPS thresholds
                this.checkFPSThresholds();
                
                this.frameCount = 0;
                this.lastFrameTime = now;
            }
            
            this.fpsMonitorId = requestAnimationFrame(measureFPS);
        };
        
        measureFPS();
    }

    /**
     * Start system monitoring
     */
    startSystemMonitoring() {
        this.systemMonitorInterval = setInterval(() => {
            this.updateSystemMetrics();
            this.checkThresholds();
            this.updateUI();
        }, 2000); // Update every 2 seconds
    }

    /**
     * Update system metrics
     */
    updateSystemMetrics() {
        // Memory usage estimate
        if (performance.memory) {
            this.metrics.memoryUsage = performance.memory.usedJSHeapSize;
        }
        
        // DOM node count
        this.metrics.domNodes = document.querySelectorAll('*').length;
        
        // Managed elements count
        this.metrics.managedElements = performanceElementManager.elements.size;
        
        // Active animations count
        this.metrics.activeAnimations = gsapAnimationRegistry.animations.size;
        
        // Active intervals count
        this.metrics.activeIntervals = intervalManager.intervals.size;
    }

    /**
     * Check FPS thresholds
     */
    checkFPSThresholds() {
        const fps = this.metrics.fps;
        
        if (fps <= this.thresholds.fps.critical) {
            this.createAlert('critical', 'FPS', `Critical FPS: ${fps} (threshold: ${this.thresholds.fps.critical})`);
            this.triggerEmergencyCleanup();
        } else if (fps <= this.thresholds.fps.warning) {
            this.createAlert('warning', 'FPS', `Low FPS: ${fps} (threshold: ${this.thresholds.fps.warning})`);
            this.triggerPerformanceOptimization();
        }
    }

    /**
     * Check all performance thresholds
     */
    checkThresholds() {
        const metrics = this.metrics;
        
        // Memory usage
        if (metrics.memoryUsage > this.thresholds.memoryUsage.critical) {
            this.createAlert('critical', 'Memory', `Critical memory usage: ${this.formatBytes(metrics.memoryUsage)}`);
        } else if (metrics.memoryUsage > this.thresholds.memoryUsage.warning) {
            this.createAlert('warning', 'Memory', `High memory usage: ${this.formatBytes(metrics.memoryUsage)}`);
        }
        
        // DOM nodes
        if (metrics.domNodes > this.thresholds.domNodes.critical) {
            this.createAlert('critical', 'DOM', `Critical DOM node count: ${metrics.domNodes}`);
        } else if (metrics.domNodes > this.thresholds.domNodes.warning) {
            this.createAlert('warning', 'DOM', `High DOM node count: ${metrics.domNodes}`);
        }
        
        // Managed elements
        if (metrics.managedElements > this.thresholds.managedElements.critical) {
            this.createAlert('critical', 'Elements', `Critical managed elements: ${metrics.managedElements}`);
        } else if (metrics.managedElements > this.thresholds.managedElements.warning) {
            this.createAlert('warning', 'Elements', `High managed elements: ${metrics.managedElements}`);
        }
        
        // Animations
        if (metrics.activeAnimations > this.thresholds.animations.critical) {
            this.createAlert('critical', 'Animations', `Critical animation count: ${metrics.activeAnimations}`);
        } else if (metrics.activeAnimations > this.thresholds.animations.warning) {
            this.createAlert('warning', 'Animations', `High animation count: ${metrics.activeAnimations}`);
        }
        
        // Intervals
        if (metrics.activeIntervals > this.thresholds.intervals.critical) {
            this.createAlert('critical', 'Intervals', `Critical interval count: ${metrics.activeIntervals}`);
        } else if (metrics.activeIntervals > this.thresholds.intervals.warning) {
            this.createAlert('warning', 'Intervals', `High interval count: ${metrics.activeIntervals}`);
        }
    }

    /**
     * Create an alert
     */
    createAlert(level, category, message) {
        const alert = {
            id: Date.now(),
            level: level,
            category: category,
            message: message,
            timestamp: new Date(),
            count: 1
        };
        
        // Check for duplicate alerts (same category and level)
        const existingAlert = this.alerts.find(a => 
            a.category === category && a.level === level && 
            (Date.now() - a.timestamp.getTime()) < 30000 // Within 30 seconds
        );
        
        if (existingAlert) {
            existingAlert.count++;
            existingAlert.timestamp = new Date();
        } else {
            this.alerts.push(alert);
            console.warn(`🚨 Performance Alert [${level.toUpperCase()}] ${category}: ${message}`);
        }
        
        // Keep only last 50 alerts
        if (this.alerts.length > 50) {
            this.alerts = this.alerts.slice(-50);
        }
    }

    /**
     * Trigger performance optimization
     */
    triggerPerformanceOptimization() {
        console.log('⚡ Triggering performance optimization...');
        
        // Cleanup old elements
        performanceElementManager.performPeriodicCleanup();
        
        // Cleanup old animations
        gsapAnimationRegistry.performPeriodicCleanup();
        
        // Cleanup old intervals
        intervalManager.performAutoCleanup();
        
        // Set conservative performance mode
        performanceElementManager.setPerformanceMode('conservative');
    }

    /**
     * Trigger emergency cleanup
     */
    triggerEmergencyCleanup() {
        console.log('🚨 Triggering emergency cleanup...');
        
        // Emergency cleanup for all systems
        performanceElementManager.setPerformanceMode('aggressive');
        gsapAnimationRegistry.performEmergencyCleanup();
        intervalManager.cleanupOldestIntervals(10);
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
    }

    /**
     * Create monitoring UI - disabled for main site
     */
    createUI() {
        // Don't create UI on main site - only on control panel
        console.log('📊 Performance Monitor UI disabled on main site - use control panel');
    }

    /**
     * Create UI toggle button - disabled for main site
     */
    createToggleButton() {
        // Don't create toggle button on main site
    }

    /**
     * Toggle UI visibility
     */
    toggleUI() {
        this.isUIVisible = !this.isUIVisible;
        this.uiContainer.style.display = this.isUIVisible ? 'block' : 'none';
        
        if (this.isUIVisible) {
            this.updateUI();
        }
    }

    /**
     * Hide UI
     */
    hideUI() {
        if (this.uiContainer) {
            this.uiContainer.style.display = 'none';
            this.isUIVisible = false;
        }
    }

    /**
     * Update UI content
     */
    updateUI() {
        if (!this.uiContainer || !this.isUIVisible) return;
        
        const metrics = this.metrics;
        const avgFPS = metrics.fpsHistory.length > 0 ? 
            Math.round(metrics.fpsHistory.reduce((a, b) => a + b, 0) / metrics.fpsHistory.length) : 0;
        
        const html = `
            <div style="margin-bottom: 10px; font-weight: bold;">PERFORMANCE MONITOR</div>
            
            <div style="margin-bottom: 8px;">
                <strong>FPS:</strong> ${metrics.fps} (avg: ${avgFPS})
                <div style="width: 100%; height: 4px; background: #333; margin-top: 2px;">
                    <div style="width: ${Math.min(metrics.fps / 60 * 100, 100)}%; height: 100%; background: ${this.getFPSColor(metrics.fps)};"></div>
                </div>
            </div>
            
            <div style="margin-bottom: 5px;"><strong>Memory:</strong> ${this.formatBytes(metrics.memoryUsage)}</div>
            <div style="margin-bottom: 5px;"><strong>DOM Nodes:</strong> ${metrics.domNodes}</div>
            <div style="margin-bottom: 5px;"><strong>Managed Elements:</strong> ${metrics.managedElements}</div>
            <div style="margin-bottom: 5px;"><strong>GSAP Animations:</strong> ${metrics.activeAnimations}</div>
            <div style="margin-bottom: 10px;"><strong>Intervals:</strong> ${metrics.activeIntervals}</div>
            
            ${this.getRecentAlertsHTML()}
            
            <div style="margin-top: 10px; border-top: 1px solid #333; padding-top: 8px;">
                <button onclick="window.performanceMonitor.triggerPerformanceOptimization()" 
                        style="background: #333; color: #00ff85; border: 1px solid #00ff85; padding: 4px 8px; margin-right: 5px; cursor: pointer; font-size: 10px;">
                    OPTIMIZE
                </button>
                <button onclick="window.performanceMonitor.triggerEmergencyCleanup()" 
                        style="background: #660000; color: #ff6666; border: 1px solid #ff6666; padding: 4px 8px; cursor: pointer; font-size: 10px;">
                    EMERGENCY
                </button>
            </div>
        `;
        
        this.uiContainer.innerHTML = html;
    }

    /**
     * Get FPS color based on value
     */
    getFPSColor(fps) {
        if (fps >= 50) return '#00ff85';
        if (fps >= 30) return '#ffaa00';
        return '#ff4444';
    }

    /**
     * Get recent alerts HTML
     */
    getRecentAlertsHTML() {
        const recentAlerts = this.alerts.slice(-5).reverse();
        
        if (recentAlerts.length === 0) {
            return '<div style="color: #888; font-size: 10px;">No recent alerts</div>';
        }
        
        return `
            <div style="margin-bottom: 5px; font-size: 10px; color: #888;">RECENT ALERTS:</div>
            ${recentAlerts.map(alert => `
                <div style="font-size: 10px; color: ${alert.level === 'critical' ? '#ff4444' : '#ffaa00'}; margin-bottom: 2px;">
                    ${alert.category}: ${alert.message} ${alert.count > 1 ? `(x${alert.count})` : ''}
                </div>
            `).join('')}
        `;
    }

    /**
     * Format bytes to human readable
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    /**
     * Get comprehensive performance report
     */
    getPerformanceReport() {
        const elementStats = performanceElementManager.getStats();
        const animationStats = gsapAnimationRegistry.getStats();
        const intervalStats = intervalManager.getStats();
        
        return {
            timestamp: new Date(),
            fps: {
                current: this.metrics.fps,
                average: this.metrics.fpsHistory.length > 0 ? 
                    this.metrics.fpsHistory.reduce((a, b) => a + b, 0) / this.metrics.fpsHistory.length : 0,
                history: this.metrics.fpsHistory.slice()
            },
            memory: {
                usage: this.metrics.memoryUsage,
                formatted: this.formatBytes(this.metrics.memoryUsage)
            },
            dom: {
                totalNodes: this.metrics.domNodes,
                managedElements: elementStats.totalElements,
                elementsByCategory: elementStats.byCategory
            },
            animations: {
                total: animationStats.totalAnimations,
                byCategory: animationStats.byCategory,
                byStatus: animationStats.byStatus,
                memoryEstimate: animationStats.memoryEstimate
            },
            intervals: {
                total: intervalStats.totalIntervals,
                byCategory: intervalStats.byCategory,
                byStatus: intervalStats.byStatus
            },
            alerts: {
                total: this.alerts.length,
                recent: this.alerts.slice(-10)
            }
        };
    }

    /**
     * Destroy the performance monitor
     */
    destroy() {
        this.stopMonitoring();
        
        if (this.uiContainer) {
            this.uiContainer.remove();
        }
        
        if (this.toggleButton) {
            this.toggleButton.remove();
        }
        
        console.log('💀 Performance Monitor destroyed');
    }
}

// Create global instance
const performanceMonitor = new PerformanceMonitor();

// Make it globally available
window.performanceMonitor = performanceMonitor;

// Auto-start monitoring
performanceMonitor.startMonitoring();

export default performanceMonitor;