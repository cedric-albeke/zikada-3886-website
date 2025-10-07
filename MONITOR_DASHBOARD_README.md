# ZIKADA 3886 Performance Monitoring Dashboard

## Overview

The ZIKADA 3886 Performance Monitoring Dashboard is a real-time performance monitoring overlay designed specifically for the PWA performance hardening project. It provides comprehensive FPS tracking, memory leak detection, network monitoring, and predictive performance alerts with <16ms update latency.

## Features

- **Real-time FPS Monitoring**: Tracks current FPS, EWMA smoothing, derivatives, and frame time P95 percentiles
- **Memory Leak Detection**: Rolling OLS trend analysis with predictive alerts for memory leaks
- **Long Task Visualization**: PerformanceObserver-based long task tracking with translucent overlay markers
- **Network Queue Monitoring**: Visualizes preloader queue status and throughput
- **Performance State Ladder**: Timeline view of performance state transitions
- **Predictive Alerting**: ML-based trend analysis with confidence indicators
- **Accessibility**: Respects `prefers-reduced-motion` and high-contrast preferences

## Architecture

### Core Modules

1. **`js/monitor/core.js`**: Metrics sampling engine with ring buffers and aggregation
2. **`js/monitor/graphs.js`**: Canvas-based graph renderer with double-buffering
3. **`js/monitor/predictive.js`**: Trend analysis and predictive alerting system
4. **`js/monitor/dashboard.js`**: Main UI orchestration and event handling
5. **`js/monitor/mcp-verify.js`**: Automated verification hooks for testing
6. **`css/monitor.css`**: Lightweight styling with performance optimizations

### Event-Driven Architecture

The dashboard subscribes to existing system events without modifying publishers:

- `performance:tick` - FPS and frame time updates
- `performance:longtask` - Long task notifications
- `memory:sample` - Memory usage samples
- `watchdog:stateChange` - Performance state transitions
- `predictive:alert` - Predictive performance alerts
- `preloader:queueUpdate` - Network queue status

## Setup and Usage

### Enabling the Dashboard

1. **Feature Flag Method** (Recommended):
   ```javascript
   // Via URL parameter
   ?monitorDashboard=1

   // Via localStorage
   localStorage.setItem('zikada_flag_monitorDashboard', '1');

   // Via window flags
   window.__ZIKADA_FLAGS__ = { monitorDashboard: true };
   ```

2. **Debug Mode** (Auto-enabled):
   ```javascript
   ?debug=1  // Also enables dashboard
   ```

### Keyboard Controls

- **`Ctrl+Alt+M`**: Toggle dashboard visibility
- **Close button**: Hide dashboard

### Programmatic API

```javascript
// Access dashboard instance
const dashboard = window.ZIKADA.monitor;

// Control visibility
dashboard.show();
dashboard.hide();
dashboard.toggle();

// Get performance snapshot
const metrics = dashboard.getSnapshot();

// Access verification tools
const verification = window.ZIKADA.verify;
const report = await verification.runCalibrationTest(5000);
```

## Performance Budget

The dashboard is designed to operate within strict performance constraints:

- **Update Latency**: ≤16ms P95 (sub-frame timing)
- **Memory Overhead**: Preallocated Float32Array ring buffers
- **Rendering**: Double-buffered canvas with incremental drawing
- **CPU Usage**: Minimal - aligned to rAF with throttling

## Verification and Testing

### Automated Calibration Test

```javascript
// Run performance calibration
const result = await window.ZIKADA.verify.runCalibrationTest(5000);
console.log('Update Latency P95:', result.updateLatencyP95, 'ms');
console.log('FPS/Frame Correlation:', result.fpsFrameCorr);

// Acceptance criteria
assert(result.updateLatencyP95 <= 16);  // Sub-frame updates
assert(result.fpsFrameCorr >= 0.99);    // High correlation
```

### Stress Testing

```javascript
// Run performance stress test
const stress = await window.ZIKADA.verify.runPerformanceStressTest(10000);
console.log('System Health Score:', stress.overallHealth.overall);
console.log('FPS Stability:', stress.overallHealth.fpsStability);
```

### Manual Testing

1. Open the dashboard with `Ctrl+Alt+M`
2. Observe real-time metrics during various conditions:
   - Page load and idle state
   - Heavy animations and interactions
   - Memory-intensive operations
   - Network activity

## Configuration

### Performance Thresholds

```javascript
// Memory leak detection (in predictive.js)
const config = {
  memory: {
    leakThreshold: 1024 * 10, // 10KB/s growth
    growthWindowSize: 60,     // 60s trend window
    cooldownMs: 15000         // 15s between alerts
  },
  fps: {
    criticalThreshold: 30,    // Critical FPS threshold
    warningThreshold: 45,     // Warning FPS threshold
    trendWindowSize: 30       // 30s trend analysis
  }
};
```

### Graph Customization

```javascript
// Modify graph appearance (in dashboard.js setupGraphs)
this.graphRenderer.createGraph('fps', {
  color: '#00ff88',           // Primary line color
  derivativeColor: '#ff8800', // Derivative overlay color
  yMin: 0,
  yMax: 144,                  // FPS range
  showDerivative: true        // Show acceleration overlay
});
```

## Integration with CI/CD

### Local Development

```bash
# Enable dashboard for development
npm run dev -- --monitor

# Or via URL
http://localhost:3886?monitorDashboard=1&debug=1
```

### Production Deployment

The dashboard is disabled by default in production. Enable via feature flags only for debugging:

```javascript
// Emergency debugging in production
localStorage.setItem('zikada_flag_monitorDashboard', '1');
window.location.reload();
```

## Troubleshooting

### Dashboard Not Appearing

1. Check feature flag status:
   ```javascript
   console.log(window.FEATURE_FLAGS?.isEnabled?.('monitorDashboard'));
   ```

2. Verify event bus connection:
   ```javascript
   console.log(window.ZIKADA_EVENT_BUS?.listeners?.size);
   ```

3. Check console for initialization errors

### Performance Issues

1. Verify update latency:
   ```javascript
   const test = await window.ZIKADA.verify.runCalibrationTest();
   console.log('Latency:', test.updateLatencyP95);
   ```

2. Monitor memory usage:
   ```javascript
   const snapshot = window.ZIKADA.monitor.getSnapshot();
   console.log('Memory:', snapshot.memory.used / 1024 / 1024, 'MB');
   ```

### Accessibility Issues

The dashboard automatically respects system preferences:

```css
/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .zikada-monitor-dashboard { animation: none; }
}

/* High contrast support */
@media (prefers-contrast: high) {
  .zikada-monitor-dashboard {
    background: rgba(0, 0, 0, 0.95) !important;
    border-left: 3px solid #00ff88 !important;
  }
}
```

## Technical Specifications

### Browser Compatibility

- **Required**: ES2018+ (async/await, dynamic imports)
- **Canvas**: 2D context with OffscreenCanvas optimization
- **WebGL**: Optional (graceful degradation)
- **APIs**: PerformanceObserver, performance.memory

### Resource Usage

- **Memory**: ~2MB baseline (ring buffers + UI)
- **Network**: Zero additional requests
- **Storage**: Feature flag preferences only
- **CPU**: <1% average on modern hardware

## Rollback Plan

### Immediate Disable

```javascript
// Feature flag disable (no code changes)
window.FEATURE_FLAGS.override('monitorDashboard', false);
```

### Emergency Rollback

1. Remove CSS import from `index.html`
2. Comment out dashboard import in `chaos-init.js`
3. Sentinel canvas creation is isolated and safe to remove

## Future Enhancements

- WebAssembly-based trend analysis for improved performance
- WebRTC-based remote monitoring dashboard
- Integration with external APM tools (DataDog, New Relic)
- Advanced ML models for anomaly detection
- Mobile-optimized compact view

---

## Support

For technical issues or questions about the monitoring dashboard, refer to the ZIKADA 3886 project documentation or contact the development team.