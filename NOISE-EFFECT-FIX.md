# Noise Effect Persistence Fix

## Issue Description
The noise effect was randomly disappearing and never coming back, causing inconsistent visual effects in the FX controller system.

## Root Cause Analysis
The static-noise canvas was being created through the `performanceElementManager.createElement()` system with category 'effect', which has a `cleanupAge` of 15 seconds. This caused the canvas to be automatically removed after 15 seconds, breaking the noise effect permanently.

### Investigation Timeline
1. **Symptom**: Noise effect worked initially but disappeared after ~15 seconds
2. **Discovery**: FX controller was falling back to body background SVG when canvas missing
3. **Root Cause**: Performance element manager auto-cleanup removing static-noise canvas
4. **Verification**: 36-second stress test confirmed canvas persistence after fix

## Solution Implemented

### 1. Modified `chaos-init.js` - `addStaticNoise()` method
- **BEFORE**: Created canvas via `performanceElementManager.createElement('canvas', 'effect')`
- **AFTER**: Created canvas directly with `document.createElement('canvas')` and appended to DOM
- **Result**: Canvas bypasses performance manager auto-cleanup entirely

### 2. Enhanced `fx-controller.js` - noise effect handling
- Added canvas recreation attempt when missing
- Improved fallback logic to SVG background noise
- Added cleanup of fallback when canvas is available
- Better error handling and logging

## Code Changes

### chaos-init.js (lines 807-858)
```javascript
addStaticNoise() {
    // CRITICAL FIX: Create static-noise canvas outside performance manager
    // to prevent auto-cleanup that was causing noise effect to disappear
    const canvas = document.createElement('canvas');
    canvas.id = 'static-noise';
    // ... direct DOM manipulation instead of performance manager
}
```

### fx-controller.js (lines 60-95)
```javascript
if (name === 'noise') {
    const noiseCanvas = document.getElementById('static-noise');
    if (noiseCanvas) {
        // Primary method: Use the static-noise canvas
        noiseCanvas.style.opacity = (value * 0.05).toFixed(3);
        // Clear fallback when canvas available
    } else {
        // FALLBACK: Canvas missing, try to recreate it first
        // ... auto-recreation and fallback logic
    }
}
```

## Test Results
✅ **36-second comprehensive stress test PASSED**
- Canvas persisted through 25+ second wait (beyond old 15s cleanup)
- Survived matrix message stress test
- Perfect opacity responsiveness (0.04 → 0.01 → 0.045)
- No fallback needed throughout test
- FX controller remained fully responsive

## Impact
- **FIXED**: Noise effect now persists indefinitely
- **IMPROVED**: Auto-recreation safety mechanism
- **ENHANCED**: Better fallback handling
- **PERFORMANCE**: No impact on performance management for other elements

## Files Modified
- `js/chaos-init.js` - Static noise canvas creation
- `js/fx-controller.js` - Noise effect handling logic

Date: 2025-01-18
Status: ✅ RESOLVED