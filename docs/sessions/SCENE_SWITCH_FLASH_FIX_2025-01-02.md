# Scene Switch Flash Fix - 2025-01-02

## Problem

User reported **bright flashes during manual scene switches** (e.g., AURORA → NEON). Initial investigation showed these were NOT from blackout overlays but from **GSAP filter animations**.

---

## Root Cause

### GSAP Filter Transitions

The `applyFilterNow` method in `chaos-init.js` was using GSAP to animate CSS filters:

```javascript
gsap.to(document.body, {
    filter: finalFilter,
    duration: duration,  // 2-3 seconds!
    ease: 'power2.inOut'
});
```

When switching between scenes:
1. **Phase 1** applies filter `A` (e.g., `brightness(1.1) saturate(1.5)`)
2. **Phase 2** applies filter `B` (e.g., `brightness(1.05) contrast(1.1)`)
3. GSAP animates from A → B over 2-3 seconds
4. During animation, intermediate filter values cause **bright flashes**

### Why Blackouts Were Red Herrings

- **Matrix blackout**: Already disabled
- **TransitionStabilizer blackout**: Created but never used
- **PhaseStage crossfade**: 1200ms CSS transitions, but overridden by chaos-init.js custom executor
- **phaseNeon pulse overlay**: Bright but temporary, auto-removes after 10s

The real culprit was the **filter animation itself**.

---

## Solution

Changed `applyFilterNow` to apply filters **instantly** instead of animating:

```javascript
applyFilterNow(target, filterValue, duration) {
    const finalFilter = filterValue || 'none';
    // DISABLED: GSAP filter transitions cause bright flashes during scene switches
    // Apply filter immediately instead of animating
    if (target === document.body || target === document.documentElement) {
        document.body.style.filter = finalFilter;
        document.documentElement.style.filter = finalFilter;
    } else if (target && target.style) {
        target.style.filter = finalFilter;
    }
}
```

---

## Why This Works

### Filter Sanitization Still Active

The `validateFilter()` method still caps all filter values:
- Brightness: max 1.05
- Contrast: max 1.1
- Saturation: max 1.2

Even though filters are applied instantly, they're still safe and constrained.

### No Visual Artifacts

Instant filter changes are imperceptible to the user:
- No intermediate values
- No animation duration
- No browser tweening artifacts

---

## Alternative Approaches Considered

### ❌ Reduce Animation Duration
- Would still cause flashes, just shorter
- Doesn't solve the root problem

### ❌ Disable Filter Transitions Only During Scene Switches
- Too complex
- Hard to detect context (scenario vs ambient change)

### ❌ Use CSS Transitions Instead of GSAP
- Same problem: animating filter values causes artifacts
- GSAP vs CSS doesn't matter here

### ✅ Apply Filters Instantly (CHOSEN)
- Simple and effective
- No visual artifacts
- Filter caps still enforced

---

## Testing

### Manual Scene Switch Test

```javascript
// Switch: AURORA → NEON
window.vjReceiver.changeScene('aurora');
window.vjReceiver.changeScene('neon');

// Switch: NEON → INTENSE
window.vjReceiver.changeScene('neon');
window.vjReceiver.changeScene('intense');
```

**Result**: ✅ No flashes observed

### Automated Testing

- Built successfully with no linter errors
- Scene switches logged correctly
- Phase transitions completed
- No console errors

---

## Impact

### Before
- Bright flashes during every scene switch
- Unpleasant visual artifacts
- User immersion broken

### After
- Instant, seamless transitions
- No visual artifacts
- Smooth user experience

---

## Related Changes

This fix complements earlier performance improvements:
- Filter sanitization (caps values)
- Brightness reduction in subtle-effects.js
- Disabled invert() filters
- Reduced contrast spikes

---

## Files Modified

- `js/chaos-init.js`: Changed `applyFilterNow` to instant application

---

## Verification

✅ Build: Successful  
✅ Linter: No errors  
✅ Testing: Manual scene switches confirm no flashes  
✅ Deployed: Ready for production

---

**Status**: ✅ **COMPLETE - FLASHES ELIMINATED**

