# Death Spiral Fix - October 31, 2025

## Critical Issue: Emergency Stop Death Spiral

### Problem Description

The application was experiencing a catastrophic "death spiral" where:

1. **Low FPS triggers emergency stop** - When FPS drops below 10 for 5+ seconds, an automatic emergency stop is triggered
2. **Emergency stop reinitializes system** - The emergency stop calls `restartEssentialAnimations()` which forces a complete system reinitialization
3. **Reinitialization causes temporary FPS drop** - During the reinitialization process, FPS temporarily drops even lower as resources are recreated
4. **Immediate re-trigger** - Before the system can stabilize, the low FPS triggers another emergency stop
5. **Infinite loop** - This creates an infinite loop of emergency stops, preventing the system from ever stabilizing

### Symptoms Observed

- Repeated "AUTO EMERGENCY STOP" messages in console
- FPS stuck at 1.0-10.0
- Repeated "ENHANCED EMERGENCY STOP - Full System Reset!" messages
- DOM node count explosion (11,000+ nodes)
- Animation accumulation (94+ animations removed repeatedly)
- `TypeError: Cannot set properties of null (setting 'aspect')` errors

### Root Causes

1. **No cooldown mechanism** - Emergency stops could be triggered repeatedly without any delay
2. **No grace period** - FPS monitoring continued immediately after reinitialization, catching the temporary performance dip
3. **Unsafe resize handler** - `ChaosEngine.handleResize()` attempted to access `camera.aspect` without checking if camera/renderer/composer were initialized

## Fixes Implemented

### 1. Emergency Stop Cooldown (`js/vj-receiver.js`)

Added cooldown mechanism to prevent rapid emergency stops:

```javascript
// In constructor
this.lastEmergencyStop = 0;
this.emergencyStopCooldown = 15000; // 15 seconds cooldown
this.emergencyStopCount = 0;

// In emergencyStop()
const now = performance.now();
const timeSinceLastStop = now - this.lastEmergencyStop;

if (timeSinceLastStop < this.emergencyStopCooldown) {
    console.warn(`⚠️ Emergency stop on cooldown (${((this.emergencyStopCooldown - timeSinceLastStop) / 1000).toFixed(1)}s remaining)`);
    
    // If we're getting repeated emergency stops, increase the cooldown
    this.emergencyStopCount++;
    if (this.emergencyStopCount > 3) {
        this.emergencyStopCooldown = Math.min(60000, this.emergencyStopCooldown * 1.5); // Cap at 60s
        console.warn(`🚨 Repeated emergency stops detected! Increasing cooldown to ${(this.emergencyStopCooldown / 1000).toFixed(0)}s`);
    }
    return;
}

this.lastEmergencyStop = now;
this.emergencyStopCount = 0;
```

**Benefits:**
- Prevents emergency stops from firing more than once every 15 seconds
- Adaptive cooldown increases to 60 seconds if repeated stops are detected
- Allows system time to stabilize after reinitialization

### 2. Grace Period After Emergency Stop (`js/vj-receiver.js`)

Added grace period to FPS monitoring after emergency stops:

```javascript
// In FPS monitoring loop
const timeSinceLastStop = currentTime - this.lastEmergencyStop;
const GRACE_PERIOD = 10000; // 10 seconds grace period after emergency stop

if (timeSinceLastStop > GRACE_PERIOD) {
    // Only check FPS after grace period
    if (fps < LOW_FPS_THRESHOLD) {
        lowFpsCount++;
        // ... emergency stop logic
    }
} else {
    // During grace period, don't count low FPS
    if (lowFpsCount > 0) {
        lowFpsCount = 0;
    }
}
```

**Benefits:**
- Gives system 10 seconds to stabilize after reinitialization
- Prevents temporary FPS dips during restart from triggering another emergency stop
- Resets low FPS counter during grace period

### 3. Safe Resize Handler (`js/chaos-engine.js`)

Added defensive checks to `handleResize()` method:

```javascript
handleResize() {
    // Defensive checks to prevent errors during reinitialization
    if (!this.camera || !this.renderer || !this.composer) {
        console.debug('[ChaosEngine] handleResize called but resources not ready, skipping');
        return;
    }

    try {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
        this.composer.setSize(width, height);
    } catch (error) {
        console.warn('[ChaosEngine] Error during handleResize:', error);
    }
}
```

**Benefits:**
- Prevents `TypeError: Cannot set properties of null (setting 'aspect')` errors
- Gracefully handles resize events during reinitialization
- Provides clear debug logging when resize is skipped

## Expected Behavior After Fix

1. **Emergency stops are rate-limited** - Maximum one emergency stop per 15 seconds
2. **System has time to stabilize** - 10-second grace period after each emergency stop
3. **No resize errors** - `handleResize()` safely handles calls during reinitialization
4. **Adaptive protection** - Cooldown increases if repeated issues are detected
5. **Stable long-term operation** - System can recover from temporary performance issues without entering death spiral

## Testing Recommendations

1. **Monitor for 12+ minutes** - Verify system remains stable over extended period
2. **Check console logs** - Confirm no repeated emergency stops
3. **Verify FPS recovery** - Ensure FPS stabilizes after temporary dips
4. **Test scene transitions** - Confirm smooth transitions without errors
5. **Monitor DOM growth** - Ensure DOM node count remains stable

## Files Modified

- `js/vj-receiver.js` - Added emergency stop cooldown and grace period
- `js/chaos-engine.js` - Added defensive checks to `handleResize()`
- `docs/sessions/DEATH_SPIRAL_FIX_2025-10-31.md` - This documentation

## Related Issues

- `TypeError: Cannot set properties of null (setting 'aspect')` - Fixed by safe resize handler
- DOM explosion (11,000+ nodes) - Prevented by stopping death spiral
- Animation accumulation - Prevented by stopping death spiral
- Repeated emergency stops - Fixed by cooldown mechanism

## Next Steps

1. Build and deploy the fixes
2. Monitor the deployed application for 12+ minutes
3. Verify stable FPS and DOM node count
4. Confirm no repeated emergency stops in console
5. Test various scenes and transitions

