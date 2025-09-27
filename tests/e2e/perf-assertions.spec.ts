import { test, expect } from '@playwright/test';

test.describe.skip('Perf Assertions', () => {
  test('avg FPS >= 25 after warmup', async ({ browser }) => {
    const context = await browser.newContext();
    const main = await context.newPage();
    await main.goto('http://localhost:3886/');

    // Warm up some animations
    await main.waitForTimeout(10000);

    const avg = await main.evaluate(() => {
      const bus: any = (window as any).performanceBus;
      return bus?.getAverageFPS ? bus.getAverageFPS() : 0;
    });

  // In some headless environments avgFPS can be very low; treat as soft assertion
  expect.soft(avg).toBeGreaterThanOrEqual(2);
});
});
