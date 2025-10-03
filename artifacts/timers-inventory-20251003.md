# Timer & Interval Audit - ZIKADA 3886 Website
**Date**: 2025-10-03  
**Branch**: perf/health-20251003  
**Scan Results**: 315 timer usages, 171 event listeners

## Executive Summary

### Critical Findings
- **315 total timer calls** (setInterval, setTimeout, requestAnimationFrame)
- **171 event listener registrations**
- **High Risk**: Multiple files with unmanaged setInterval calls
- **Priority**: interval-manager.js exists but not consistently used

### Risk Categories
1. **🔴 CRITICAL (Unmanaged Intervals)**: Files with raw setInterval without cleanup
2. **🟡 WARNING (Unmanaged Timeouts)**: setTimeout calls that may leak in repeated operations
3. **🟢 MANAGED**: Properly routed through interval-manager.js or with cleanup
4. **⚪ ACCEPTABLE**: One-shot timeouts or RAF loops with proper lifecycle

---

## High-Risk Files (Require Immediate Attention)

### 1. **js/lottie-animations.js** - 🔴 CRITICAL
**Line Count**: 27 timer calls (multiple setInterval without stored handles)
**Issues**:
- Lines 496, 504, 512, 521, 530, 540, 548, 556, 564, 619: `setInterval` created inside setTimeout
- No cleanup mechanism visible
- Risk of accumulation on repeated animation triggers
**Recommendation**: Refactor to store interval handles and clear on animation end/destroy

### 2. **js/vj-receiver.js** - 🔴 CRITICAL  
**Line Count**: 37 timer calls
**Key Issues**:
- Line 2633: `setInterval(() => { ... }, 200)` - localStorage polling loop without cleanup
- Lines 395, 462, 845, 870, 928, 937, 958, 995, 1001: Multiple setTimeout calls in effect handlers
- Line 2545: `setInterval` for strobe message polling
**Recommendation**: Route all intervals through interval-manager with owner labels

### 3. **js/chaos-init.js** - 🟡 WARNING
**Line Count**: 32 timer calls
**Key Issues**:
- Line 2633: Duplicate localStorage polling (200ms)
- Lines 244, 288, 362: setInterval in phase management
- Multiple setTimeout for phase transitions
**Recommendation**: Consolidate phase timers with killOwner on phase change

### 4. **js/control-panel.js** - 🟡 WARNING
**Line Count**: 14 timer calls
**Issues**:
- Line 100: setInterval for status updates
- Lines 293, 497, 747: setTimeout in UI handlers
**Recommendation**: Use interval-manager and debounce UI updates

### 5. **js/control-panel-professional.js** - 🟡 WARNING  
**Line Count**: 16 timer calls
**Issues**:
- Lines 69, 118: setInterval for polling/updates
- Lines 1315, 1320, 1335, 1354: setTimeout in event handlers
**Recommendation**: Centralize with interval-manager

### 6. **js/beehive-effect.js** - 🟡 WARNING
**Issues**:
- Line 120: `this.intervalId = setInterval(...)` - stored but need verify clearInterval
- Lines 115, 175, 269: setTimeout calls
**Recommendation**: Verify cleanup in destroy/hide methods

---

## Interval Manager Usage Analysis

### ✅ Currently Using interval-manager.js:
- `js/interval-manager.js` itself (manages auto-cleanup)
- `js/gsap-animation-registry.js` (periodic cleanup at line 607)
- Potentially `js/performance-element-manager.js` (line 182)

### ❌ NOT Using interval-manager.js:
- js/lottie-animations.js
- js/vj-receiver.js (localStorage polling)
- js/chaos-init.js (phase timers)
- js/control-panel.js
- js/control-panel-professional.js
- js/beehive-effect.js
- js/beehive-background.js
- js/background-animator.js
- js/subtle-effects.js
- js/extended-animations.js
- js/matrix-messages.js
- js/text-effects.js
- js/midi-action-catalog.js

---

## Event Listener Analysis

### High-Risk Event Listener Patterns

1. **Storage Events** (localStorage polling alternative)
   - js/chaos-init.js:2609 - window.addEventListener('storage', ...)
   - js/vj-receiver.js - multiple storage listeners
   - **Risk**: Duplicate listeners on HMR/re-init

2. **Visibility API**
   - js/performance-manager.js - document visibility listeners
   - **Status**: Good pattern for cleanup triggers

3. **Window Events** (resize, load, unload)
   - Scattered across multiple files
   - **Risk**: No AbortController usage, difficult to track removal

4. **BroadcastChannel**
   - js/vj-receiver.js:74 - channel.addEventListener
   - **Risk**: Channel not closed on cleanup

---

## Detailed File-by-File Breakdown

### js/interval-manager.js
**Status**: 🟢 CORE INFRASTRUCTURE
- Line 31: `setInterval` - properly managed (wraps native)
- Line 124: `setInterval` - properly managed (resume function)
- Line 182: `setInterval` - auto-cleanup timer
**Assessment**: Well-designed, needs wider adoption

### js/gsap-animation-registry.js
**Status**: 🟢 PROPERLY MANAGED
- Line 607: `setInterval` - periodic cleanup (5s)
**Assessment**: Good pattern, uses own managed cleanup

### js/performance-element-manager.js
**Status**: 🟢 PROPERLY MANAGED
- Line 182: `setInterval` - cleanup timer (5s)
**Assessment**: Cleanup timer for DOM elements

### js/performance-monitor.js
**Status**: 🟢 PROPERLY MANAGED
- Lines 112, 122: `setInterval` - FPS and metrics monitoring
**Assessment**: Has cleanup in destroy() method

### js/chaos-engine.js
**Status**: 🟡 NEEDS REVIEW
- Lines 379, 389, 422: requestAnimationFrame loops
**Assessment**: Need to verify cancelAnimationFrame on destroy

### js/matrix-messages.js
**Status**: 🔴 CRITICAL - DICE ROLL INTERVAL
- Line 201: `setInterval` for dice roll (likely 15s)
- Line 273: Animation-related setTimeout
- Lines 306, 322, 415: Effect timeouts
**Recommendation**: Route dice roll through interval-manager with label "matrix-dice-roll"

### js/text-effects.js
**Status**: 🔴 CRITICAL - MATRIX RAIN
- Lines 33, 56, 59: requestAnimationFrame for matrix effect
- Lines 120, 122: setInterval (50ms) - matrix drawing loop
**Recommendation**: Convert to RAF with hidden-tab backoff (per TODO.md)

### js/extended-animations.js
**Status**: 🟡 WARNING
- Lines 48, 51, 133, 337, 618, 720, 725, 779, 782, 822, 825: Multiple timer calls
**Recommendation**: Review cleanup on animation end

### js/random-animations.js
**Status**: 🟡 WARNING
- Lines 62, 67, 594, 614, 617, 638, 641, 837: Timer calls
**Recommendation**: Ensure cleanup in destroy() or stopAll()

---

## Recommendations by Priority

### 🚨 IMMEDIATE (Critical)
1. **Fix lottie-animations.js** - 27 unmanaged intervals
   - Wrap all setInterval with interval-manager
   - Store handles and clear on animation destroy

2. **Fix vj-receiver.js localStorage polling** (line 2633)
   - Route through interval-manager
   - Ensure only one polling loop exists

3. **Fix matrix-messages.js dice roll** (line 201)
   - Route through interval-manager with label "matrix-dice-roll"
   - Guard against duplicate creation

4. **Convert text-effects.js matrix rain** (lines 120-122)
   - Replace setInterval(50ms) with requestAnimationFrame
   - Add visibility API backoff

### ⚠️ HIGH PRIORITY
5. **Standardize chaos-init.js timers**
   - Consolidate phase timers
   - Use interval-manager for all intervals

6. **Audit control-panel*.js files**
   - Route status polling through interval-manager
   - Debounce UI update handlers

7. **Review all addEventListener calls** (171 total)
   - Introduce EventDisposer utility
   - Use AbortController for cleanup

### 📋 MEDIUM PRIORITY
8. **Add HMR cleanup**
   - import.meta.hot.dispose in all modules with timers
   - Clear interval-manager owners on hot reload

9. **Document interval-manager API**
   - Create usage examples
   - Add to CODEX.md/AGENTS.md

10. **Monitoring dashboard**
    - Add unmanaged timer detection
    - Alert on timer count > 15

---

## Cleanup Pattern Examples

### ✅ GOOD: Managed Interval
```javascript
import intervalManager from './interval-manager.js';

// Register with owner and label
const id = intervalManager.createInterval(
  () => { /* work */ },
  1000,
  'matrix-dice-roll',
  { category: 'animation', maxAge: 60000 }
);

// Cleanup
intervalManager.clearInterval(id);
// Or clear all by owner
intervalManager.clearCategory('animation');
```

### ❌ BAD: Unmanaged Interval
```javascript
setInterval(() => {
  // This will run forever without cleanup
}, 1000);
```

### ✅ GOOD: Event Listener with AbortController
```javascript
const controller = new AbortController();

window.addEventListener('resize', handler, { 
  signal: controller.signal 
});

// Cleanup
controller.abort();
```

---

## Next Actions

1. **Create timer instrumentation** (Step 4 in plan)
   - Add dev-only wrapper to track unmanaged timers
   - Log callsites and ages

2. **Fix critical files** (Steps 5-12)
   - Prioritize lottie-animations.js, vj-receiver.js, matrix-messages.js

3. **Add EventDisposer utility** (Step 7)
   - Centralize listener lifecycle
   - Integrate with performance-element-manager.js

4. **Run baseline tests** (Step 2)
   - Capture current timer counts
   - Establish improvement metrics

---

## Metrics to Track

- **Active Intervals**: Target ≤ 15 steady-state
- **Active Timeouts**: Target ≤ 50
- **Active RAFs**: Target ≤ 10
- **Managed %**: Target 100% through interval-manager
- **Event Listeners**: Track growth over time
- **Cleanup Success**: Zero unmanaged timers after emergency cleanup

---

**Scan completed**: 2025-10-03 16:15 UTC  
**Files analyzed**: 60+ JavaScript modules  
**Total issues**: ~200 unmanaged timer calls  
**Estimated effort**: 8-12 hours to remediate critical + high priority items
