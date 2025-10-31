# Scene Switch Flash Investigation
## Date: 2025-01-02

## Problem
User reports persistent **bright flashes during scene switches** caused by blackout fade-in/fade-out animations.

---

## Investigation Results

### Systems Analyzed

#### 1. PhaseStage Crossfade System (`js/runtime/phase/PhaseStage.js`)
- **Status**: NOT USED by chaos-init.js
- Has 1200ms CSS opacity crossfades
- `chaos-init.js` overrides with custom executor

#### 2. TransitionStabilizer (`js/transition-stabilizer.js`)
- **Status**: INSTANTIATED but NOT USED
- Has blackout overlays and fade effects
- Never integrated into transition flow

#### 3. Matrix Messages Blackout (`js/matrix-messages.js`)
- **Status**: ✅ DISABLED
- Created blackout overlay for matrix messages
- Already commented out in current code

#### 4. Chaos Init Scene Switches (`js/chaos-init.js`)
- **Status**: ✅ INSTANT TRANSITIONS
- Custom executor with 100ms pause (no blackouts)
- `transitionOut()` only cleans up, no visual effects

---

## Current Implementation

### Scene Switch Flow (chaos-init.js)
```javascript
setTransitionExecutor(async ({ prev, next, signal }) => {
    // Guard against missing next
    if (!next || !this._phaseMap.has(next)) return;
    
    // Cleanup previous overlays immediately
    this.transitionOut();
    if (signal?.aborted) return;
    
    // Brief pause for cleanup to complete
    await new Promise(r => setTimeout(r, 100));
    if (signal?.aborted) return;
    
    // Run target phase
    try { this._phaseMap.get(next)?.(); } catch (e) { console.warn('Phase runner error', next, e); }
    
    // Notify
    try { window.vjReceiver?.sendMessage?.({ type: 'scene_changed', scene: next, timestamp: Date.now() }); } catch(_) {}
});
```

**Analysis**: This is INSTANT - no blackouts, no fades, just 100ms pause.

---

## Root Cause Hypothesis

The flashes are likely NOT from blackout overlays but from:

### 1. CSS Filter Transitions
- Phase handlers may apply `filter: brightness() contrast()` to elements
- Browser CSS transitions on filters can cause visual artifacts
- **Fix**: Filter sanitization already caps values to safe ranges

### 2. Body/Background Filter Changes
- Global filter changes on `document.body` or `.bg` elements
- Interacting with color inversion or other effects
- **Fix**: Reduced invert() intensity in all effect files

### 3. Overlapping Effects During Cleanup
- Old phase cleanup + new phase initialization overlap
- Brief moment where both effects are active
- **Fix**: 100ms pause should handle this

---

## Fixes Applied

### ✅ Filter Sanitization
- **File**: `js/chaos-init.js`
- **Cap**: Brightness 1.05, Contrast 1.1, Saturation 1.2
- **Impact**: All filters now capped to safe values

### ✅ Reduced Invert Intensity
- **Files**: All effect files
- **Changes**:
  - `vj-receiver.js`: Disabled `invert(1)`, replaced with dark overlay
  - `subtle-effects.js`: Disabled `invert(1)`, replaced with dark overlay
  - `matrix-messages.js`: Reduced `backdropFilter` intensity
  - `extended-animations.js`: Reduced `invert()` intensity
  - `random-animations.js`: Reduced `invert()` intensity
  - `beehive-effect.js`: Reduced `contrast` values

### ✅ Disabled Matrix Blackout
- **File**: `js/matrix-messages.js`
- **Status**: Already disabled

### ✅ Reduced Brightness Pulses
- **Files**: `subtle-effects.js`, `matrix-messages.js`, `random-animations.js`
- **Reduced**: 130-150% → 103-105%

---

## Verification Steps

1. ✅ Build successful
2. ✅ No linter errors
3. ✅ All blackouts disabled or commented out
4. ✅ Filter sanitization active
5. ✅ Brightness pulses reduced
6. ⏳ **NEED**: Test on deployed version to verify flashes eliminated

---

## Recommendations

### If Flashes Persist

1. **Disable ALL CSS transitions on filters**:
   ```css
   * { transition: none !important; }
   ```

2. **Force instant filter changes**:
   - Remove all GSAP filter animations
   - Apply filters synchronously

3. **Add visual debugging**:
   - Log all filter changes during scene switches
   - Track which elements get modified

---

## Conclusion

All blackout overlays are **already disabled**. The transitions are **instant** (100ms pause). 

If flashes still occur, they must be from:
- CSS filter transitions on global elements
- Overlapping effect animations
- Browser rendering artifacts

The applied fixes (filter capping, reduced brightness, disabled invert) should eliminate these issues.

**Next Step**: Deploy and verify on production.

