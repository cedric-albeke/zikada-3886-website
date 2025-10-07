# Debugging and Logging Guide

## Console Log Spam Reduction

This project implements a centralized logging system to reduce console spam while maintaining useful debugging capabilities.

## Logger Controls

### Quick Access
- **Hotkey**: Press `Shift+L` to cycle through log levels (silent, error, warn, info, debug, trace)
- **Window API**: Use `window.__LOG` in DevTools for immediate control

### Log Levels (in order of verbosity)
- `silent` (0): No logs
- `error` (1): Only errors
- `warn` (2): Errors and warnings  
- `info` (3): Errors, warnings, and general info
- `debug` (4): Everything except trace
- `trace` (5): Maximum verbosity

### Namespaces
Logs are organized by namespace to allow fine-grained control:
- `anim` - Animation system (GSAP registry)
- `alert` - Performance alerting system  
- `perf` - Performance monitoring
- `monitor` - System monitoring
- `chaos` - Chaos engine initialization

## Usage Examples

### URL Query Parameters
```
http://127.0.0.1:3886/?logLevel=debug&logNS=anim,perf
```

### DevTools Commands
```javascript
// Set log level
window.__LOG.setLevel('debug');
window.__LOG.setLevel('silent'); // Silence all logs

// Enable specific namespaces
window.__LOG.enable('anim');     // Show animation logs
window.__LOG.enable('alert');    // Show performance alerts
window.__LOG.enableAll();        // Show all namespaces

// Disable namespaces  
window.__LOG.disable('perf');    // Hide performance logs
window.__LOG.clear();            // Clear all namespaces

// Check current status
window.__LOG.status();           // Shows current level and enabled namespaces
```

### localStorage (Persistent)
```javascript
// Persist log level across browser sessions
localStorage.setItem('log:level', 'debug');
localStorage.setItem('log:namespaces', 'anim,alert');

// Clear persistent settings
localStorage.removeItem('log:level');
localStorage.removeItem('log:namespaces');
```

## Default Behavior

- **Development**: Log level `info`, no namespaces enabled (shows warn/error only)
- **Production**: Log level `warn`, no namespaces enabled (shows warn/error only)
- **With namespaces enabled**: Shows debug/trace logs for enabled namespaces only

## Before vs After

### Before (Console Spam)
```
🗑️ Killed animation: auto-to-1234 (Remaining: 782)
🗑️ Killed animation: auto-to-1235 (Remaining: 781)
🗑️ Killed animation: auto-to-1236 (Remaining: 780)
🔮 Performance Alert [WARNING]: FPS declining at -2.1/s
🔮 Performance Alert [WARNING]: FPS declining at -2.3/s
🔮 Performance Alert [WARNING]: FPS declining at -2.5/s
🎬 Animation registry status - Total: 596
🎬 Animation registry status - Total: 696
```
*Hundreds of repetitive messages...*

### After (Clean & Controlled)
```
[logger] Initialized
[logger] Use window.__LOG to control logging, or Shift+L to cycle levels

// Only with namespaces enabled:
[anim] Animation cleanup in progress - Current count: 45
[alert] Performance Alert [CRITICAL]: FPS declining at -15.2/s
[perf] Performance inspection started
```

## Development Workflow

1. **Normal Development**: Default settings show only important warnings/errors
2. **Animation Debugging**: `window.__LOG.enable('anim')` to see animation lifecycle
3. **Performance Issues**: `window.__LOG.enable('alert')` to see performance alerts  
4. **Deep Debugging**: `window.__LOG.setLevel('debug')` + enable relevant namespaces
5. **Silent Mode**: `window.__LOG.setLevel('silent')` for clean console

## Throttling & De-duplication

The logger includes built-in spam prevention:
- `log.once(key, fn)` - Log only once per key
- `log.throttle(key, ms, fn)` - Throttle high-frequency logs
- Automatic grouping with `log.group(label, fn)`

## Migration Status

✅ **Completed**:
- gsap-animation-registry.js (namespace: `anim`)
- predictive-performance-alerting.js (namespace: `alert`) 
- performance-inspector.js (namespace: `perf`)
- safe-performance-monitor.js (namespace: `monitor`)

⏳ **Remaining**: 
- chaos-init.js and other initialization modules
- Individual animation modules
- VJ receiver and other subsystems

## Policy

- **Default builds**: Show warn/error only to keep console clean
- **Error/warn messages**: Avoid emojis unless essential for quick visual scanning
- **Debug messages**: Can include emojis for better categorization
- **High-frequency logs**: Must use throttling (2-10 second intervals)
- **Startup messages**: Use `log.once()` to prevent spam on hot reload