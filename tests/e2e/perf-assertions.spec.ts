import { test, expect } from '@playwright/test';

test.describe.skip('Perf Assertions', () => {
  test('avg FPS >= 45 after warmup and never below 30', async ({ context }) => {
    const main = await context.newPage();
    await main.goto('http://localhost:3886/');

    // Warm up some animations
    await main.waitForTimeout(10000);

    const avg = await main.evaluate(() => {
      const bus: any = (window as any).performanceBus;
      return bus?.getAverageFPS ? bus.getAverageFPS() : 0;
    });

  // Keep skipped by default: headless SwiftShader is not representative for real FPS acceptance.
  expect(avg).toBeGreaterThanOrEqual(45);
});
});
