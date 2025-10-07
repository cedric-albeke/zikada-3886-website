# Plasma Suppression Feature Implementation

## Overview
Implemented comprehensive plasma overlay suppression controls to reduce visual noise and improve user experience during the initial loading phase and phase transitions.

## Changes Made

### 1. 120-Second Boot Suppression Gate
**Location**: `js/chaos-init.js` - Constructor (line 93) and `enablePlasmaEffect()` (lines 1593-1597)

**Purpose**: Prevents plasma overlay from appearing during the first 120 seconds after page load, ensuring users have time to orient themselves before visual effects begin.

**Implementation**:
```javascript
// In constructor
this.bootTs = performance.now(); // Prevent plasma for first 120s

// In enablePlasmaEffect()
if (performance.now() - this.bootTs < 120000) {
    if (this.debugMetrics) console.log('⏳ Plasma suppressed: within first 120s');
    return;
}
```

### 2. Configurable Skip Probability (80% Default)
**Location**: `js/chaos-init.js` - `enablePlasmaEffect()` (lines 1599-1603)

**Purpose**: Reduces plasma appearance frequency from 50% to 20% (80% skip rate), making plasma a rarer, more special effect.

**Implementation**:
```javascript
// Default: skip plasma 80% of the time. Allow runtime override via SAFE_FLAGS for tuning.
const skipProb = (window.SAFE_FLAGS?.PLASMA_SKIP_PROBABILITY ?? 0.8);
if (Math.random() < skipProb) {
    return;
}
```

**Testing Override**:
```javascript
// Force plasma to always appear (for testing)
window.SAFE_FLAGS = { PLASMA_SKIP_PROBABILITY: 0.0 };

// Make plasma very rare (99% skip)
window.SAFE_FLAGS = { PLASMA_SKIP_PROBABILITY: 0.99 };
```

### 3. 40% Opacity Reduction
**Location**: `js/chaos-init.js` - `enablePlasmaEffect()` (line 1619)

**Purpose**: Reduces plasma overlay intensity to make it less overwhelming and more subtle.

**Implementation**:
```javascript
// Changed from cur * 0.85 to cur * 0.6 (40% reduction)
plasmaCanvas.style.opacity = String(Math.max(0, (cur * 0.6).toFixed(3)));
```

## Backward Compatibility
- All existing plasma disable/cleanup functionality remains unchanged
- Phase transition handling is unmodified
- Runtime configuration available via `window.SAFE_FLAGS` for testing and tuning
- No breaking changes to existing APIs

## Testing Recommendations
1. **Boot Suppression**: Load page and attempt to force-enable plasma before 120 seconds
2. **Skip Probability**: Test with different `PLASMA_SKIP_PROBABILITY` values
3. **Opacity**: Verify plasma appears with reduced intensity when enabled
4. **Phase Transitions**: Confirm plasma is properly disabled during phase changes
5. **Performance**: Monitor for any FPS impact from the changes

## Acceptance Criteria Met
- ✅ 120-second boot suppression gate implemented
- ✅ Skip probability increased from 50% to 80% (configurable)
- ✅ Opacity reduced by 40% (from 0.85 to 0.6 multiplier)
- ✅ Cleanup and disable behavior preserved
- ✅ No breaking changes to existing functionality
- ✅ Runtime configuration available for testing

## Files Modified
- `js/chaos-init.js`: Primary implementation file with all plasma effect logic

## Commit Hash
- `8e81d9c`: feat(vfx): suppress plasma for 120s, 80% skip rate in phases, and 40% opacity reduction