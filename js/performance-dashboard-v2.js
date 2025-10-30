// Performance Dashboard V2 - Advanced monitoring and control interface
// Integrates with Performance Optimizer V2 and Stability Manager

class PerformanceDashboardV2 {
    constructor() {
        this.isVisible = false;
        this.updateInterval = null;
        this.charts = new Map();
        this.metrics = {
            fps: [],
            memory: [],
            domNodes: [],
            activeAnimations: [],
            errors: []
        };
        
        this.maxDataPoints = 60; // 60 seconds of data
        this.alertThresholds = {
            fps: 30,
            memory: 100,
            domNodes: 5000,
            activeAnimations: 50,
            errors: 5
        };
        
        this.init();
    }
    
    init() {
        this.createDashboard();
        this.setupEventListeners();
        this.startMonitoring();
        
        console.log('📊 Performance Dashboard V2 initialized');
    }
    
    createDashboard() {
        // Create dashboard container
        this.container = document.createElement('div');
        this.container.id = 'performance-dashboard-v2';
        this.container.className = 'performance-dashboard';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 400px;
            max-height: 80vh;
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #00ff00;
            border-radius: 10px;
            padding: 20px;
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            z-index: 10000;
            overflow-y: auto;
            display: none;
            backdrop-filter: blur(10px);
        `;
        
        // Create header
        const header = document.createElement('div');
        header.className = 'dashboard-header';
        header.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #00ff00; text-align: center;">
                🚀 Performance Dashboard V2
            </h3>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <button id="toggle-monitoring" class="btn-toggle">⏸️ Pause</button>
                <button id="emergency-cleanup" class="btn-emergency">🚨 Emergency</button>
                <button id="close-dashboard" class="btn-close">❌</button>
            </div>
        `;
        
        // Create metrics display
        const metricsContainer = document.createElement('div');
        metricsContainer.className = 'metrics-container';
        metricsContainer.innerHTML = `
            <div class="metric-row">
                <span class="metric-label">FPS:</span>
                <span id="fps-value" class="metric-value">--</span>
                <div id="fps-chart" class="mini-chart"></div>
            </div>
            <div class="metric-row">
                <span class="metric-label">Memory:</span>
                <span id="memory-value" class="metric-value">--</span>
                <div id="memory-chart" class="mini-chart"></div>
            </div>
            <div class="metric-row">
                <span class="metric-label">DOM Nodes:</span>
                <span id="dom-value" class="metric-value">--</span>
                <div id="dom-chart" class="mini-chart"></div>
            </div>
            <div class="metric-row">
                <span class="metric-label">Animations:</span>
                <span id="animations-value" class="metric-value">--</span>
                <div id="animations-chart" class="mini-chart"></div>
            </div>
            <div class="metric-row">
                <span class="metric-label">Errors:</span>
                <span id="errors-value" class="metric-value">--</span>
                <div id="errors-chart" class="mini-chart"></div>
            </div>
        `;
        
        // Create system status
        const statusContainer = document.createElement('div');
        statusContainer.className = 'status-container';
        statusContainer.innerHTML = `
            <h4 style="margin: 15px 0 10px 0; color: #00ff00;">System Status</h4>
            <div id="system-status" class="status-grid">
                <div class="status-item">
                    <span class="status-label">Performance Mode:</span>
                    <span id="perf-mode" class="status-value">--</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Stability:</span>
                    <span id="stability-status" class="status-value">--</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Circuit Breakers:</span>
                    <span id="circuit-breakers" class="status-value">--</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Fallback Modes:</span>
                    <span id="fallback-modes" class="status-value">--</span>
                </div>
            </div>
        `;
        
        // Create controls
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'controls-container';
        controlsContainer.innerHTML = `
            <h4 style="margin: 15px 0 10px 0; color: #00ff00;">Controls</h4>
            <div class="control-group">
                <label for="perf-mode-select">Performance Mode:</label>
                <select id="perf-mode-select" class="control-select">
                    <option value="low">Low</option>
                    <option value="balanced" selected>Balanced</option>
                    <option value="high">High</option>
                </select>
            </div>
            <div class="control-group">
                <label for="cleanup-interval">Cleanup Interval:</label>
                <input type="range" id="cleanup-interval" min="5" max="60" value="30" class="control-slider">
                <span id="cleanup-interval-value">30s</span>
            </div>
            <div class="control-group">
                <label for="max-animations">Max Animations:</label>
                <input type="range" id="max-animations" min="10" max="100" value="50" class="control-slider">
                <span id="max-animations-value">50</span>
            </div>
            <div class="control-group">
                <label for="max-particles">Max Particles:</label>
                <input type="range" id="max-particles" min="20" max="200" value="100" class="control-slider">
                <span id="max-particles-value">100</span>
            </div>
        `;
        
        // Create logs
        const logsContainer = document.createElement('div');
        logsContainer.className = 'logs-container';
        logsContainer.innerHTML = `
            <h4 style="margin: 15px 0 10px 0; color: #00ff00;">System Logs</h4>
            <div id="system-logs" class="logs-display" style="
                height: 150px;
                overflow-y: auto;
                background: rgba(0, 0, 0, 0.5);
                padding: 10px;
                border-radius: 5px;
                font-size: 10px;
                line-height: 1.4;
            "></div>
        `;
        
        // Assemble dashboard
        this.container.appendChild(header);
        this.container.appendChild(metricsContainer);
        this.container.appendChild(statusContainer);
        this.container.appendChild(controlsContainer);
        this.container.appendChild(logsContainer);
        
        // Add styles
        this.addStyles();
        
        // Add to page
        document.body.appendChild(this.container);
    }
    
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .performance-dashboard {
                box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
            }
            
            .metric-row {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
                padding: 5px;
                background: rgba(0, 255, 0, 0.1);
                border-radius: 3px;
            }
            
            .metric-label {
                width: 80px;
                font-weight: bold;
            }
            
            .metric-value {
                width: 60px;
                text-align: right;
                margin-right: 10px;
            }
            
            .mini-chart {
                flex: 1;
                height: 20px;
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid #00ff00;
                border-radius: 2px;
                position: relative;
                overflow: hidden;
            }
            
            .mini-chart::before {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 100%;
                background: linear-gradient(to top, #00ff00, transparent);
                opacity: 0.7;
                transform-origin: bottom;
                transform: scaleY(0);
                transition: transform 0.3s ease;
            }
            
            .status-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
            }
            
            .status-item {
                display: flex;
                justify-content: space-between;
                padding: 5px;
                background: rgba(0, 255, 0, 0.1);
                border-radius: 3px;
            }
            
            .status-label {
                font-weight: bold;
            }
            
            .status-value {
                color: #00ff00;
            }
            
            .control-group {
                margin-bottom: 10px;
            }
            
            .control-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
            }
            
            .control-select {
                width: 100%;
                padding: 5px;
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid #00ff00;
                color: #00ff00;
                border-radius: 3px;
            }
            
            .control-slider {
                width: 100%;
                margin: 5px 0;
            }
            
            .btn-toggle, .btn-emergency, .btn-close {
                padding: 5px 10px;
                background: rgba(0, 255, 0, 0.2);
                border: 1px solid #00ff00;
                color: #00ff00;
                border-radius: 3px;
                cursor: pointer;
                font-size: 10px;
            }
            
            .btn-toggle:hover, .btn-emergency:hover, .btn-close:hover {
                background: rgba(0, 255, 0, 0.3);
            }
            
            .btn-emergency {
                background: rgba(255, 0, 0, 0.2);
                border-color: #ff0000;
                color: #ff0000;
            }
            
            .btn-emergency:hover {
                background: rgba(255, 0, 0, 0.3);
            }
            
            .alert {
                color: #ff0000;
                font-weight: bold;
            }
            
            .warning {
                color: #ffff00;
                font-weight: bold;
            }
            
            .good {
                color: #00ff00;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    setupEventListeners() {
        // Toggle monitoring
        this.container.querySelector('#toggle-monitoring').addEventListener('click', () => {
            this.toggleMonitoring();
        });
        
        // Emergency cleanup
        this.container.querySelector('#emergency-cleanup').addEventListener('click', () => {
            this.triggerEmergencyCleanup();
        });
        
        // Close dashboard
        this.container.querySelector('#close-dashboard').addEventListener('click', () => {
            this.hide();
        });
        
        // Performance mode change
        this.container.querySelector('#perf-mode-select').addEventListener('change', (e) => {
            this.changePerformanceMode(e.target.value);
        });
        
        // Cleanup interval change
        this.container.querySelector('#cleanup-interval').addEventListener('input', (e) => {
            this.updateCleanupInterval(parseInt(e.target.value));
        });
        
        // Max animations change
        this.container.querySelector('#max-animations').addEventListener('input', (e) => {
            this.updateMaxAnimations(parseInt(e.target.value));
        });
        
        // Max particles change
        this.container.querySelector('#max-particles').addEventListener('input', (e) => {
            this.updateMaxParticles(parseInt(e.target.value));
        });
    }
    
    startMonitoring() {
        if (this.updateInterval) return;
        
        this.updateInterval = setInterval(() => {
            this.updateMetrics();
        }, 1000);
        
        this.log('Monitoring started');
    }
    
    stopMonitoring() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        this.log('Monitoring stopped');
    }
    
    toggleMonitoring() {
        if (this.updateInterval) {
            this.stopMonitoring();
            this.container.querySelector('#toggle-monitoring').textContent = '▶️ Start';
        } else {
            this.startMonitoring();
            this.container.querySelector('#toggle-monitoring').textContent = '⏸️ Pause';
        }
    }
    
    updateMetrics() {
        // Get metrics from performance optimizer
        let perfMetrics = {};
        if (window.performanceOptimizerV2) {
            perfMetrics = window.performanceOptimizerV2.getPerformanceMetrics();
        }
        
        // Get stability metrics
        let stabilityMetrics = {};
        if (window.stabilityManager) {
            stabilityMetrics = window.stabilityManager.getStabilityReport();
        }
        
        // Update FPS
        const fps = perfMetrics.fps || 0;
        this.updateMetric('fps', fps, 'fps-chart');
        this.updateMetricValue('fps-value', fps, fps < this.alertThresholds.fps ? 'alert' : 'good');
        
        // Update Memory
        const memory = perfMetrics.memory || 0;
        this.updateMetric('memory', memory, 'memory-chart');
        this.updateMetricValue('memory-value', `${memory}MB`, memory > this.alertThresholds.memory ? 'alert' : 'good');
        
        // Update DOM Nodes
        const domNodes = perfMetrics.domNodes || 0;
        this.updateMetric('domNodes', domNodes, 'dom-chart');
        this.updateMetricValue('dom-value', domNodes, domNodes > this.alertThresholds.domNodes ? 'alert' : 'good');
        
        // Update Animations
        const animations = perfMetrics.activeAnimations || 0;
        this.updateMetric('activeAnimations', animations, 'animations-chart');
        this.updateMetricValue('animations-value', animations, animations > this.alertThresholds.activeAnimations ? 'alert' : 'good');
        
        // Update Errors
        const errors = stabilityMetrics.recentErrors || 0;
        this.updateMetric('errors', errors, 'errors-chart');
        this.updateMetricValue('errors-value', errors, errors > this.alertThresholds.errors ? 'alert' : 'good');
        
        // Update system status
        this.updateSystemStatus(perfMetrics, stabilityMetrics);
        
        // Update mini charts
        this.updateMiniCharts();
    }
    
    updateMetric(metricName, value, chartId) {
        if (!this.metrics[metricName]) {
            this.metrics[metricName] = [];
        }
        
        this.metrics[metricName].push(value);
        
        // Keep only max data points
        if (this.metrics[metricName].length > this.maxDataPoints) {
            this.metrics[metricName].shift();
        }
    }
    
    updateMetricValue(elementId, value, className = '') {
        const element = this.container.querySelector(`#${elementId}`);
        if (element) {
            element.textContent = value;
            element.className = `metric-value ${className}`;
        }
    }
    
    updateMiniCharts() {
        Object.keys(this.metrics).forEach(metricName => {
            const chartId = `${metricName}-chart`;
            const chart = this.container.querySelector(`#${chartId}`);
            if (chart && this.metrics[metricName].length > 0) {
                this.drawMiniChart(chart, this.metrics[metricName]);
            }
        });
    }
    
    drawMiniChart(container, data) {
        if (!Array.isArray(data) || data.length === 0) return;
        // Filter out non-finite values
        const cleaned = data.filter(v => Number.isFinite(v));
        if (cleaned.length < 2) return;
        
        const max = Math.max(...cleaned);
        const min = Math.min(...cleaned);
        const range = (max - min) || 1;
        
        // Create SVG for mini chart
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        
        // Clear existing content
        container.innerHTML = '';
        container.appendChild(svg);
        
        // Draw line
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const points = cleaned.map((value, index) => {
            const denom = (cleaned.length - 1) || 1;
            const x = (index / denom) * 100;
            const yRaw = 100 - ((value - min) / range) * 100;
            const y = Number.isFinite(yRaw) ? Math.max(0, Math.min(100, yRaw)) : 100;
            return `${x},${y}`;
        }).join(' L');
        
        path.setAttribute('d', `M ${points}`);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#00ff00');
        path.setAttribute('stroke-width', '1');
        
        svg.appendChild(path);
    }
    
    updateSystemStatus(perfMetrics, stabilityMetrics) {
        // Performance mode
        this.updateStatusValue('perf-mode', perfMetrics.mode || 'unknown');
        
        // Stability status
        const errorCount = stabilityMetrics.recentErrors || 0;
        const stabilityStatus = errorCount > 5 ? 'Critical' : errorCount > 2 ? 'Warning' : 'Good';
        this.updateStatusValue('stability-status', stabilityStatus, 
            errorCount > 5 ? 'alert' : errorCount > 2 ? 'warning' : 'good');
        
        // Circuit breakers
        const circuitBreakers = stabilityMetrics.circuitBreakers || {};
        const openBreakers = Object.values(circuitBreakers).filter(cb => cb.state === 'OPEN').length;
        this.updateStatusValue('circuit-breakers', `${openBreakers} open`, 
            openBreakers > 0 ? 'alert' : 'good');
        
        // Fallback modes
        const fallbackModes = stabilityMetrics.fallbackModes || {};
        const activeFallbacks = Object.values(fallbackModes).filter(active => active).length;
        this.updateStatusValue('fallback-modes', `${activeFallbacks} active`, 
            activeFallbacks > 0 ? 'warning' : 'good');
    }
    
    updateStatusValue(elementId, value, className = '') {
        const element = this.container.querySelector(`#${elementId}`);
        if (element) {
            element.textContent = value;
            element.className = `status-value ${className}`;
        }
    }
    
    changePerformanceMode(mode) {
        if (window.performanceOptimizerV2) {
            window.performanceOptimizerV2.setMode(mode);
        }
        
        if (window.performanceModeManager) {
            window.performanceModeManager.setMode(mode);
        }
        
        this.log(`Performance mode changed to: ${mode}`);
    }
    
    updateCleanupInterval(interval) {
        this.container.querySelector('#cleanup-interval-value').textContent = `${interval}s`;
        
        if (window.performanceOptimizerV2) {
            // Update cleanup interval in performance optimizer
            const strategy = window.performanceOptimizerV2.optimizationStrategies[window.performanceOptimizerV2.currentMode];
            strategy.domCleanupInterval = interval * 1000;
        }
        
        this.log(`Cleanup interval updated to: ${interval}s`);
    }
    
    updateMaxAnimations(max) {
        this.container.querySelector('#max-animations-value').textContent = max;
        
        if (window.gsapAnimationRegistry) {
            window.gsapAnimationRegistry.maxAnimations = max;
        }
        
        this.log(`Max animations updated to: ${max}`);
    }
    
    updateMaxParticles(max) {
        this.container.querySelector('#max-particles-value').textContent = max;
        
        if (window.performanceOptimizerV2) {
            const strategy = window.performanceOptimizerV2.optimizationStrategies[window.performanceOptimizerV2.currentMode];
            strategy.maxParticles = max;
        }
        
        this.log(`Max particles updated to: ${max}`);
    }
    
    triggerEmergencyCleanup() {
        this.log('🚨 Emergency cleanup triggered');
        
        if (window.performanceOptimizerV2) {
            window.performanceOptimizerV2.emergencyCleanup();
        }
        
        if (window.stabilityManager) {
            window.stabilityManager.triggerEmergencyRecovery([]);
        }
        
        this.log('✅ Emergency cleanup completed');
    }
    
    log(message) {
        const logsContainer = this.container.querySelector('#system-logs');
        if (logsContainer) {
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = document.createElement('div');
            logEntry.textContent = `[${timestamp}] ${message}`;
            logEntry.style.marginBottom = '2px';
            
            logsContainer.appendChild(logEntry);
            
            // Keep only last 50 log entries
            while (logsContainer.children.length > 50) {
                logsContainer.removeChild(logsContainer.firstChild);
            }
            
            // Scroll to bottom
            logsContainer.scrollTop = logsContainer.scrollHeight;
        }
    }
    
    show() {
        this.container.style.display = 'block';
        this.isVisible = true;
        this.startMonitoring();
    }
    
    hide() {
        this.container.style.display = 'none';
        this.isVisible = false;
        this.stopMonitoring();
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    destroy() {
        this.stopMonitoring();
        
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        console.log('🧹 Performance Dashboard V2 destroyed');
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.performanceDashboardV2 = new PerformanceDashboardV2();
    
    // Add keyboard shortcut to toggle dashboard
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'P') {
            e.preventDefault();
            window.performanceDashboardV2.toggle();
        }
    });
}

export default PerformanceDashboardV2;
