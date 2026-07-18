import { test, expect } from '@playwright/test';

test('support schedulers stay single-owner across rebinds and retriggers', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://localhost:3886/?runtimeSmoke=1');

  await expect.poll(async () => page.evaluate(() => Boolean(
    (window as any).vjReceiver &&
    (window as any).matrixMessages &&
    (window as any).animationRuntime &&
    (window as any).performanceOptimizerV2
  )), { timeout: 20_000 }).toBeTruthy();

  const rebound = await page.evaluate(() => {
    const receiver = (window as any).vjReceiver;
    receiver.startPerformanceMonitoring();
    receiver.startPerformanceMonitoring();
    receiver.startPerformanceMonitoring();
    receiver.setBpmRippleEnabled(true);
    receiver.setBpmRippleEnabled(true);
    receiver.showDebugInfo();
    receiver.showDebugInfo();

    const owners = (window as any).animationRuntime.getStats().owners;
    return {
      performance: owners['vj-receiver:performance'],
      bpm: owners['vj-receiver:bpm-ripple'],
      debug: owners['vj-receiver:debug'],
      legacyOptimizer: owners['performance-optimizer-v2'],
      performanceBus: owners['performance-bus'],
      safeMonitor: owners['safe-performance-monitor'],
      chaosTelemetry: owners['chaos-init:fps-monitor'],
      watchdog: owners['enhanced-watchdog'],
      sharedCadence: (window as any).animationRuntime.getStats().sharedCadence
    };
  });

  expect(rebound.performance?.disposers).toBe(1);
  expect(rebound.performance?.rafLoops ?? 0).toBe(0);
  expect(rebound.bpm?.intervals).toBe(1);
  expect(rebound.debug?.intervals).toBe(1);
  expect(rebound.debug?.nodes).toBe(1);
  expect(rebound.legacyOptimizer?.rafLoops ?? 0).toBe(0);
  expect(rebound.performanceBus?.rafLoops).toBe(1);
  expect(rebound.safeMonitor?.rafLoops ?? 0).toBe(0);
  expect(rebound.chaosTelemetry?.rafLoops ?? 0).toBe(0);
  expect(rebound.watchdog?.rafLoops ?? 0).toBe(0);
  expect(rebound.watchdog?.intervals).toBe(1);
  expect(rebound.watchdog?.disposers).toBeGreaterThan(0);
  expect(rebound.sharedCadence?.tasks).toBeGreaterThan(0);
  expect(rebound.sharedCadence?.drivers).toBe(1);

  const diceEnabled = await page.evaluate(() => {
    const matrix = (window as any).matrixMessages;
    matrix.enableAutonomousDiceMode();
    matrix.enableAutonomousDiceMode();
    const owners = (window as any).animationRuntime.getStats().owners;
    return owners['matrix-message:one-hz'];
  });
  expect(diceEnabled?.intervals).toBe(1);

  const released = await page.evaluate(() => {
    const receiver = (window as any).vjReceiver;
    const matrix = (window as any).matrixMessages;
    receiver.setBpmRippleEnabled(false);
    matrix.disableAutonomousDiceMode();
    matrix.showMessage('SCHEDULER INTEGRITY');
    matrix.forceCleanup();
    matrix.forceCleanup();

    const owners = (window as any).animationRuntime.getStats().owners;
    const intervalNames = Array.from((window as any).intervalManager?.intervals?.values?.() || [])
      .map((entry: any) => entry.name);
    return {
      bpm: owners['vj-receiver:bpm-ripple'],
      dice: owners['matrix-message:one-hz'],
      matrixSequence: owners['matrix-message:sequence'],
      matrixScramble: owners['matrix-message:scramble'],
      matrixFailsafe: owners['matrix-message:failsafe'],
      lottieIntervals: intervalNames.filter((name: string) => name.includes('lottie-')),
      lottieScheduler: owners['lottie-animations']?.intervals ?? 0
    };
  });

  expect(released.bpm).toBeUndefined();
  expect(released.dice).toBeUndefined();
  expect(released.matrixSequence).toBeUndefined();
  expect(released.matrixScramble).toBeUndefined();
  expect(released.matrixFailsafe).toBeUndefined();
  expect(released.lottieIntervals).toEqual([]);
  expect(released.lottieScheduler).toBe(1);
  expect(errors).toEqual([]);
});
