/**
 * ZIKADA 3886 PWA Performance Monitoring - Graph Renderer
 * Canvas-based rendering with double-buffering and <16ms update latency
 */

class GraphRenderer {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      width: 400,
      height: 200,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      gridColor: 'rgba(255, 255, 255, 0.1)',
      textColor: '#fff',
      lineWidth: 1.5,
      padding: { top: 20, right: 20, bottom: 30, left: 50 },
      ...options
    };

    this.canvas = null;
    this.ctx = null;
    this.backBuffer = null;
    this.backCtx = null;
    this.needsRedraw = true;

    // Graph data
    this.graphs = new Map();
    this.lastUpdate = 0;
    this.updateThrottle = 16; // ~60fps max

    this.initialize();
  }

  initialize() {
    // Create main canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.options.width;
    this.canvas.height = this.options.height;
    this.canvas.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    `;
    
    this.ctx = this.canvas.getContext('2d', {
      alpha: true,
      desynchronized: true
    });

    // Create back buffer
    if (typeof OffscreenCanvas !== 'undefined') {
      this.backBuffer = new OffscreenCanvas(this.options.width, this.options.height);
    } else {
      this.backBuffer = document.createElement('canvas');
      this.backBuffer.width = this.options.width;
      this.backBuffer.height = this.options.height;
    }
    
    this.backCtx = this.backBuffer.getContext('2d', {
      alpha: true,
      desynchronized: true
    });

    // Optimize canvas contexts
    [this.ctx, this.backCtx].forEach(ctx => {
      ctx.imageSmoothingEnabled = false;
      ctx.textBaseline = 'middle';
      ctx.font = '11px monospace';
    });

    this.container.appendChild(this.canvas);
  }

  createGraph(id, config = {}) {
    const defaultConfig = {
      type: 'line',
      color: '#00ff88',
      maxDataPoints: 200,
      autoScale: true,
      yMin: 0,
      yMax: 100,
      label: id,
      unit: '',
      showDerivative: false,
      derivativeColor: '#ff8800'
    };

    const graph = {
      ...defaultConfig,
      ...config,
      data: [],
      derivativeData: [],
      yRange: { min: config.yMin || 0, max: config.yMax || 100 }
    };

    this.graphs.set(id, graph);
    this.needsRedraw = true;
    return graph;
  }

  updateGraph(id, value, timestamp = performance.now()) {
    const graph = this.graphs.get(id);
    if (!graph) return;

    // Add data point
    graph.data.push({ value, timestamp });

    // Trim to max data points
    if (graph.data.length > graph.maxDataPoints) {
      graph.data = graph.data.slice(-graph.maxDataPoints);
    }

    // Calculate derivative if enabled
    if (graph.showDerivative && graph.data.length >= 2) {
      const recent = graph.data.slice(-2);
      const derivative = (recent[1].value - recent[0].value) / 
                        Math.max(1, recent[1].timestamp - recent[0].timestamp) * 1000;
      
      graph.derivativeData.push({ value: derivative, timestamp });
      
      if (graph.derivativeData.length > graph.maxDataPoints) {
        graph.derivativeData = graph.derivativeData.slice(-graph.maxDataPoints);
      }
    }

    // Auto-scale Y axis
    if (graph.autoScale && graph.data.length > 10) {
      const values = graph.data.slice(-50).map(d => d.value);
      graph.yRange.min = Math.min(...values) * 0.9;
      graph.yRange.max = Math.max(...values) * 1.1;
    }

    this.needsRedraw = true;
  }

  addLongTaskMarker(startTime, duration) {
    // Mark long tasks on FPS graph
    const fpsGraph = this.graphs.get('fps');
    if (fpsGraph) {
      if (!fpsGraph.longTasks) fpsGraph.longTasks = [];
      
      fpsGraph.longTasks.push({ startTime, duration });
      
      // Keep only recent tasks
      if (fpsGraph.longTasks.length > 20) {
        fpsGraph.longTasks = fpsGraph.longTasks.slice(-10);
      }
      
      this.needsRedraw = true;
    }
  }

  render() {
    const now = performance.now();
    if (!this.needsRedraw || now - this.lastUpdate < this.updateThrottle) {
      return;
    }

    this.lastUpdate = now;
    this.needsRedraw = false;

    // Clear back buffer
    this.backCtx.clearRect(0, 0, this.options.width, this.options.height);

    // Draw background
    this.backCtx.fillStyle = this.options.backgroundColor;
    this.backCtx.fillRect(0, 0, this.options.width, this.options.height);

    // Calculate layout
    const graphHeight = (this.options.height - this.options.padding.top - this.options.padding.bottom) / this.graphs.size;
    let yOffset = this.options.padding.top;

    // Render each graph
    for (const [id, graph] of this.graphs) {
      this.renderGraph(graph, yOffset, graphHeight);
      yOffset += graphHeight;
    }

    // Blit to main canvas
    this.ctx.clearRect(0, 0, this.options.width, this.options.height);
    this.ctx.drawImage(this.backBuffer, 0, 0);
  }

  renderGraph(graph, yOffset, height) {
    const { padding } = this.options;
    const graphWidth = this.options.width - padding.left - padding.right;
    const graphHeight = height - 10; // Small gap between graphs

    // Draw graph background
    this.backCtx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    this.backCtx.fillRect(padding.left, yOffset, graphWidth, graphHeight);

    // Draw grid
    this.drawGrid(padding.left, yOffset, graphWidth, graphHeight);

    // Draw long task markers (for FPS graph)
    if (graph.longTasks) {
      this.drawLongTaskMarkers(graph, padding.left, yOffset, graphWidth, graphHeight);
    }

    // Draw main data line
    this.drawLine(graph.data, graph, padding.left, yOffset, graphWidth, graphHeight, graph.color);

    // Draw derivative overlay if enabled
    if (graph.showDerivative && graph.derivativeData.length > 1) {
      this.drawDerivativeLine(graph.derivativeData, padding.left, yOffset, graphWidth, graphHeight, graph.derivativeColor);
    }

    // Draw labels and current value
    this.drawLabels(graph, padding.left, yOffset, graphWidth, graphHeight);
  }

  drawGrid(x, y, width, height) {
    this.backCtx.strokeStyle = this.options.gridColor;
    this.backCtx.lineWidth = 0.5;
    this.backCtx.beginPath();

    // Horizontal lines
    for (let i = 0; i <= 4; i++) {
      const lineY = y + (height / 4) * i;
      this.backCtx.moveTo(x, lineY);
      this.backCtx.lineTo(x + width, lineY);
    }

    // Vertical lines
    for (let i = 0; i <= 4; i++) {
      const lineX = x + (width / 4) * i;
      this.backCtx.moveTo(lineX, y);
      this.backCtx.lineTo(lineX, y + height);
    }

    this.backCtx.stroke();
  }

  drawLongTaskMarkers(graph, x, y, width, height) {
    if (!graph.longTasks || graph.data.length < 2) return;

    const timeRange = this.getTimeRange(graph.data);
    if (timeRange.duration <= 0) return;

    this.backCtx.fillStyle = 'rgba(255, 0, 0, 0.3)';

    for (const task of graph.longTasks) {
      const startRatio = Math.max(0, (task.startTime - timeRange.start) / timeRange.duration);
      const endRatio = Math.min(1, (task.startTime + task.duration - timeRange.start) / timeRange.duration);
      
      const startX = x + startRatio * width;
      const endX = x + endRatio * width;
      
      if (endX > startX) {
        this.backCtx.fillRect(startX, y, endX - startX, height);
      }
    }
  }

  drawLine(data, graph, x, y, width, height, color) {
    if (data.length < 2) return;

    const timeRange = this.getTimeRange(data);
    if (timeRange.duration <= 0) return;

    this.backCtx.strokeStyle = color;
    this.backCtx.lineWidth = this.options.lineWidth;
    this.backCtx.beginPath();

    let started = false;

    for (const point of data) {
      const normalizedX = (point.timestamp - timeRange.start) / timeRange.duration;
      const normalizedY = (point.value - graph.yRange.min) / (graph.yRange.max - graph.yRange.min);
      
      const pixelX = x + normalizedX * width;
      const pixelY = y + height - (normalizedY * height);

      if (!started) {
        this.backCtx.moveTo(pixelX, pixelY);
        started = true;
      } else {
        this.backCtx.lineTo(pixelX, pixelY);
      }
    }

    this.backCtx.stroke();
  }

  drawDerivativeLine(derivativeData, x, y, width, height, color) {
    if (derivativeData.length < 2) return;

    // Auto-scale derivative
    const values = derivativeData.map(d => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal;

    if (range === 0) return;

    const timeRange = this.getTimeRange(derivativeData);
    if (timeRange.duration <= 0) return;

    this.backCtx.strokeStyle = color;
    this.backCtx.lineWidth = 1;
    this.backCtx.setLineDash([2, 2]);
    this.backCtx.beginPath();

    let started = false;

    for (const point of derivativeData) {
      const normalizedX = (point.timestamp - timeRange.start) / timeRange.duration;
      const normalizedY = (point.value - minVal) / range;
      
      const pixelX = x + normalizedX * width;
      const pixelY = y + height - (normalizedY * height);

      if (!started) {
        this.backCtx.moveTo(pixelX, pixelY);
        started = true;
      } else {
        this.backCtx.lineTo(pixelX, pixelY);
      }
    }

    this.backCtx.stroke();
    this.backCtx.setLineDash([]);
  }

  drawLabels(graph, x, y, width, height) {
    this.backCtx.fillStyle = this.options.textColor;
    this.backCtx.font = '11px monospace';

    // Graph label
    this.backCtx.textAlign = 'left';
    this.backCtx.fillText(graph.label, x + 4, y + 12);

    // Current value
    if (graph.data.length > 0) {
      const currentValue = graph.data[graph.data.length - 1].value;
      const valueText = `${currentValue.toFixed(1)}${graph.unit}`;
      
      this.backCtx.textAlign = 'right';
      this.backCtx.fillText(valueText, x + width - 4, y + 12);
    }

    // Y-axis labels
    this.backCtx.textAlign = 'right';
    this.backCtx.fillText(graph.yRange.max.toFixed(0), x - 4, y + 12);
    this.backCtx.fillText(graph.yRange.min.toFixed(0), x - 4, y + height - 4);
  }

  getTimeRange(data) {
    if (data.length === 0) return { start: 0, end: 0, duration: 0 };
    
    const start = data[0].timestamp;
    const end = data[data.length - 1].timestamp;
    return { start, end, duration: end - start };
  }

  updateGraphConfig(id, config) {
    const graph = this.graphs.get(id);
    if (graph) {
      Object.assign(graph, config);
      this.needsRedraw = true;
    }
  }

  hide() {
    if (this.canvas) {
      this.canvas.style.display = 'none';
    }
  }

  show() {
    if (this.canvas) {
      this.canvas.style.display = 'block';
    }
  }

  destroy() {
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.graphs.clear();
  }
}

// Network queue visualization helper
class NetworkQueueRenderer {
  constructor(graphRenderer) {
    this.graphRenderer = graphRenderer;
    this.setupGraphs();
  }

  setupGraphs() {
    this.graphRenderer.createGraph('network-queue', {
      type: 'bar',
      color: '#00aaff',
      label: 'Network Queue',
      unit: ' reqs',
      yMin: 0,
      yMax: 20,
      autoScale: true
    });

    this.graphRenderer.createGraph('network-throughput', {
      type: 'line',
      color: '#ffaa00',
      label: 'Throughput',
      unit: '/s',
      yMin: 0,
      yMax: 10,
      autoScale: true,
      showDerivative: false
    });
  }

  updateQueue(queueData) {
    const { queued, inFlight, completed, failed } = queueData;
    
    this.graphRenderer.updateGraph('network-queue', queued + inFlight);
    
    // Calculate throughput (completed requests per second)
    const now = performance.now();
    if (!this.lastThroughputUpdate) {
      this.lastThroughputUpdate = now;
      this.lastCompleted = completed;
      return;
    }

    const timeDelta = (now - this.lastThroughputUpdate) / 1000;
    if (timeDelta >= 1) {
      const throughput = (completed - this.lastCompleted) / timeDelta;
      this.graphRenderer.updateGraph('network-throughput', throughput);
      
      this.lastThroughputUpdate = now;
      this.lastCompleted = completed;
    }
  }
}

export { GraphRenderer, NetworkQueueRenderer };