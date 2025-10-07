/**
 * ZIKADA 3886 PWA Performance Monitoring - Dashboard UI
 * Main orchestration with overlay, controls, and accessibility
 */

import { CoreMonitor } from './core.js';
import { GraphRenderer, NetworkQueueRenderer } from './graphs.js';
import { PredictiveAnalyzer } from './predictive.js';

class MonitorDashboard {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.visible = false;
    this.initialized = false;
    
    // Component instances
    this.coreMonitor = null;
    this.graphRenderer = null;
    this.networkRenderer = null;
    this.predictiveAnalyzer = null;
    
    // UI elements
    this.container = null;
    this.kpiPanel = null;
    this.alertPanel = null;
    this.stateLadder = null;
    
    // State
    this.currentState = 'normal';
    this.stateHistory = [];
    this.alerts = [];
    
    // Performance state colors
    this.stateColors = {
      'normal': '#00ff88',
      'warning': '#ffaa00',
      'critical': '#ff4444',
      'recovery': '#88aaff',
      'unknown': '#666666'
    };
    
    // Accessibility
    this.reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false;
    
    this.setupKeyboardHandler();
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize core components
      this.coreMonitor = new CoreMonitor(this.eventBus);
      this.predictiveAnalyzer = new PredictiveAnalyzer(this.eventBus);
      
      // Create UI
      this.createUI();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Start monitoring
      this.coreMonitor.start();
      
      this.initialized = true;
      console.log('[ZIKADA][Dashboard] Monitoring dashboard initialized');
      
    } catch (error) {
      console.error('[ZIKADA][Dashboard] Initialization failed:', error);
    }
  }

  createUI() {
    // Main container
    this.container = document.createElement('div');
    this.container.className = 'zikada-monitor-dashboard';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: 420px;
      height: 100vh;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace;
      font-size: 11px;
      z-index: 10000;
      display: none;
      flex-direction: column;
      padding: 0;
      margin: 0;
      box-sizing: border-box;
      backdrop-filter: blur(8px);
      border-left: 2px solid rgba(0, 255, 136, 0.3);
      overflow: hidden;
    `;

    // Header with controls
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 12px 16px;
      background: rgba(0, 0, 0, 0.8);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    `;

    const title = document.createElement('h3');
    title.textContent = 'ZIKADA Performance Monitor';
    title.style.cssText = `
      margin: 0;
      font-size: 13px;
      font-weight: 600;
      color: #00ff88;
    `;

    const controls = document.createElement('div');
    controls.style.cssText = 'display: flex; gap: 8px; align-items: center;';

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: #ccc;
      font-size: 16px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 3px;
    `;
    closeBtn.addEventListener('click', () => this.hide());

    controls.appendChild(closeBtn);
    header.appendChild(title);
    header.appendChild(controls);

    // KPI Panel
    this.kpiPanel = document.createElement('div');
    this.kpiPanel.className = 'zikada-kpi-panel';
    this.kpiPanel.style.cssText = `
      padding: 12px 16px;
      background: rgba(0, 0, 0, 0.6);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      flex-shrink: 0;
    `;

    // Alert Panel
    this.alertPanel = document.createElement('div');
    this.alertPanel.className = 'zikada-alert-panel';
    this.alertPanel.style.cssText = `
      padding: 8px 16px;
      background: rgba(40, 0, 0, 0.8);
      border-bottom: 1px solid rgba(255, 68, 68, 0.3);
      display: none;
      flex-direction: column;
      gap: 4px;
      flex-shrink: 0;
      max-height: 120px;
      overflow-y: auto;
    `;

    // State Ladder
    this.stateLadder = document.createElement('div');
    this.stateLadder.className = 'zikada-state-ladder';
    this.stateLadder.style.cssText = `
      padding: 8px 16px;
      background: rgba(0, 0, 0, 0.6);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      height: 40px;
      flex-shrink: 0;
      overflow: hidden;
      position: relative;
    `;

    // Graph Container
    const graphContainer = document.createElement('div');
    graphContainer.className = 'zikada-graph-container';
    graphContainer.style.cssText = `
      flex: 1;
      position: relative;
      overflow: hidden;
    `;

    // Assemble UI
    this.container.appendChild(header);
    this.container.appendChild(this.kpiPanel);
    this.container.appendChild(this.alertPanel);
    this.container.appendChild(this.stateLadder);
    this.container.appendChild(graphContainer);

    // Initialize graph renderer
    this.graphRenderer = new GraphRenderer(graphContainer, {
      width: 388, // Container width - padding
      height: 300,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      padding: { top: 20, right: 20, bottom: 20, left: 50 }
    });

    // Setup graphs
    this.setupGraphs();

    // Initialize network renderer
    this.networkRenderer = new NetworkQueueRenderer(this.graphRenderer);

    document.body.appendChild(this.container);
  }

  setupGraphs() {
    // FPS Graph with derivative
    this.graphRenderer.createGraph('fps', {
      color: '#00ff88',
      label: 'FPS',
      unit: '',
      yMin: 0,
      yMax: 144,
      autoScale: false,
      showDerivative: true,
      derivativeColor: '#ff8800'
    });

    // Memory Graph
    this.graphRenderer.createGraph('memory', {
      color: '#88aaff',
      label: 'Memory',
      unit: 'MB',
      yMin: 0,
      yMax: 256,
      autoScale: true,
      showDerivative: false
    });

    // Frame Time Graph
    this.graphRenderer.createGraph('frametime', {
      color: '#ffaa88',
      label: 'Frame Time',
      unit: 'ms',
      yMin: 0,
      yMax: 33.33,
      autoScale: false,
      showDerivative: false
    });
  }

  setupEventListeners() {
    if (!this.eventBus) return;

    // Performance metrics
    this.eventBus.on?.('performance:tick', (data) => {
      this.updateFPSGraph(data);
      this.updateKPIs(data);
    });

    this.eventBus.on?.('memory:sample', (data) => {
      this.updateMemoryGraph(data);
      this.updateKPIs(data);
    });

    this.eventBus.on?.('performance:longtask', (data) => {
      this.graphRenderer.addLongTaskMarker(data.startTime, data.duration);
    });

    // State changes
    this.eventBus.on?.('watchdog:stateChange', (data) => {
      this.updatePerformanceState(data);
    });

    // Predictive alerts
    this.eventBus.on?.('predictive:alert', (data) => {
      this.handlePredictiveAlert(data);
    });

    // Network events (if available)
    this.eventBus.on?.('preloader:queueUpdate', (data) => {
      this.networkRenderer.updateQueue(data);
    });

    // Render loop
    this.startRenderLoop();
  }

  updateFPSGraph(data) {
    const { fps, frame } = data;
    
    this.graphRenderer.updateGraph('fps', fps.ewma);
    this.graphRenderer.updateGraph('frametime', frame.p95 || frame.time);
  }

  updateMemoryGraph(data) {
    const memoryMB = data.used / (1024 * 1024);
    this.graphRenderer.updateGraph('memory', memoryMB);
  }

  updateKPIs(data) {
    if (!this.kpiPanel) return;

    // Get current metrics snapshot
    const snapshot = this.coreMonitor?.getSnapshot() || {};
    
    const kpis = [
      {
        label: 'FPS',
        value: snapshot.fps?.ewma?.toFixed(1) || '0.0',
        status: this.getFPSStatus(snapshot.fps?.ewma || 0)
      },
      {
        label: 'Frame P95',
        value: `${(snapshot.frame?.p95 || 0).toFixed(1)}ms`,
        status: this.getFrameStatus(snapshot.frame?.p95 || 0)
      },
      {
        label: 'Memory',
        value: `${((snapshot.memory?.used || 0) / (1024 * 1024)).toFixed(1)}MB`,
        status: this.getMemoryStatus(snapshot.memory?.used || 0)
      },
      {
        label: 'Long Tasks',
        value: `${snapshot.longTask?.count || 0}`,
        status: this.getLongTaskStatus(snapshot.longTask?.count || 0)
      }
    ];

    this.renderKPIs(kpis);
  }

  renderKPIs(kpis) {
    this.kpiPanel.innerHTML = '';
    
    kpis.forEach(kpi => {
      const pill = document.createElement('div');
      pill.style.cssText = `
        background: rgba(${this.getStatusColor(kpi.status)}, 0.2);
        border: 1px solid rgba(${this.getStatusColor(kpi.status)}, 0.4);
        border-radius: 4px;
        padding: 6px 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      `;

      const label = document.createElement('span');
      label.textContent = kpi.label;
      label.style.cssText = 'color: #ccc; font-size: 10px;';

      const value = document.createElement('span');
      value.textContent = kpi.value;
      value.style.cssText = `color: rgb(${this.getStatusColor(kpi.status)}); font-weight: 600;`;

      pill.appendChild(label);
      pill.appendChild(value);
      this.kpiPanel.appendChild(pill);
    });
  }

  getFPSStatus(fps) {
    if (fps >= 58) return 'good';
    if (fps >= 45) return 'warning';
    return 'critical';
  }

  getFrameStatus(frameTime) {
    if (frameTime <= 16.67) return 'good';
    if (frameTime <= 33.33) return 'warning';
    return 'critical';
  }

  getMemoryStatus(bytes) {
    const mb = bytes / (1024 * 1024);
    if (mb <= 128) return 'good';
    if (mb <= 256) return 'warning';
    return 'critical';
  }

  getLongTaskStatus(count) {
    if (count === 0) return 'good';
    if (count <= 3) return 'warning';
    return 'critical';
  }

  getStatusColor(status) {
    switch (status) {
      case 'good': return '0, 255, 136';
      case 'warning': return '255, 170, 0';
      case 'critical': return '255, 68, 68';
      default: return '136, 136, 136';
    }
  }

  updatePerformanceState(stateData) {
    const { state, timestamp, cause } = stateData;
    
    this.currentState = state;
    
    // Add to history
    this.stateHistory.push({
      state,
      timestamp: timestamp || performance.now(),
      cause: cause || 'unknown'
    });

    // Keep only recent history
    if (this.stateHistory.length > 10) {
      this.stateHistory = this.stateHistory.slice(-5);
    }

    this.renderStateLadder();
  }

  renderStateLadder() {
    if (!this.stateLadder || this.stateHistory.length === 0) return;

    this.stateLadder.innerHTML = '';

    const now = performance.now();
    const windowMs = 60000; // 1 minute window
    const recentStates = this.stateHistory.filter(s => now - s.timestamp <= windowMs);

    if (recentStates.length === 0) return;

    recentStates.forEach((stateEntry, index) => {
      const duration = index < recentStates.length - 1 
        ? recentStates[index + 1].timestamp - stateEntry.timestamp
        : now - stateEntry.timestamp;

      const widthPercent = (duration / windowMs) * 100;
      
      const segment = document.createElement('div');
      segment.style.cssText = `
        position: absolute;
        left: ${(stateEntry.timestamp - (now - windowMs)) / windowMs * 100}%;
        width: ${widthPercent}%;
        height: 100%;
        background: ${this.stateColors[stateEntry.state] || this.stateColors.unknown};
        opacity: 0.7;
        border-right: 1px solid rgba(255, 255, 255, 0.2);
        cursor: help;
      `;
      
      segment.title = `${stateEntry.state} (${stateEntry.cause})`;
      this.stateLadder.appendChild(segment);
    });

    // Current state indicator
    const currentIndicator = document.createElement('div');
    currentIndicator.style.cssText = `
      position: absolute;
      right: 0;
      top: 0;
      width: 4px;
      height: 100%;
      background: ${this.stateColors[this.currentState] || this.stateColors.unknown};
    `;
    this.stateLadder.appendChild(currentIndicator);
  }

  handlePredictiveAlert(alert) {
    // Add to alerts list
    this.alerts.push(alert);
    
    // Keep only recent alerts
    if (this.alerts.length > 5) {
      this.alerts = this.alerts.slice(-3);
    }

    this.renderAlerts();
  }

  renderAlerts() {
    if (this.alerts.length === 0) {
      this.alertPanel.style.display = 'none';
      return;
    }

    this.alertPanel.style.display = 'flex';
    this.alertPanel.innerHTML = '';

    this.alerts.forEach(alert => {
      const alertEl = document.createElement('div');
      alertEl.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 8px;
        background: rgba(255, 68, 68, ${alert.severity === 'high' ? '0.3' : '0.2'});
        border-radius: 3px;
        font-size: 10px;
      `;

      const message = document.createElement('span');
      message.textContent = alert.rationale;
      message.style.cssText = 'flex: 1; margin-right: 8px;';

      const confidence = document.createElement('span');
      confidence.textContent = `${Math.round(alert.confidence * 100)}%`;
      confidence.style.cssText = 'color: #ffaa00; font-weight: 600;';

      alertEl.appendChild(message);
      alertEl.appendChild(confidence);
      this.alertPanel.appendChild(alertEl);
    });
  }

  startRenderLoop() {
    const render = () => {
      if (this.visible && this.graphRenderer) {
        this.graphRenderer.render();
      }
      
      if (!this.reduceMotion) {
        requestAnimationFrame(render);
      } else {
        // Reduced motion: update less frequently
        setTimeout(render, 100);
      }
    };
    
    render();
  }

  setupKeyboardHandler() {
    document.addEventListener('keydown', (event) => {
      // Ctrl+Alt+M to toggle dashboard
      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'm') {
        event.preventDefault();
        this.toggle();
      }
    });
  }

  async show() {
    if (!this.initialized) {
      await this.initialize();
    }
    
    this.visible = true;
    if (this.container) {
      this.container.style.display = 'flex';
    }
  }

  hide() {
    this.visible = false;
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  destroy() {
    if (this.coreMonitor) {
      this.coreMonitor.stop();
    }
    
    if (this.graphRenderer) {
      this.graphRenderer.destroy();
    }
    
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    this.initialized = false;
    this.visible = false;
  }

  // Expose API for external access and MCP verification
  getSnapshot() {
    return this.coreMonitor?.getSnapshot() || null;
  }
}

// Registration function for chaos-init.js
function registerMonitor(eventBus) {
  if (typeof window === 'undefined') return null;

  const dashboard = new MonitorDashboard(eventBus);
  
  // Expose to global scope
  if (!window.ZIKADA) window.ZIKADA = {};
  if (!window.ZIKADA.monitor) window.ZIKADA.monitor = {};
  
  Object.assign(window.ZIKADA.monitor, {
    toggle: () => dashboard.toggle(),
    show: () => dashboard.show(),
    hide: () => dashboard.hide(),
    getSnapshot: () => dashboard.getSnapshot(),
    destroy: () => dashboard.destroy()
  });

  return dashboard;
}

export { MonitorDashboard, registerMonitor };