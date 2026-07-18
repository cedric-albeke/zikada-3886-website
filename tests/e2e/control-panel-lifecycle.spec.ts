import { test, expect } from '@playwright/test';

test('command center releases owned listeners, timers, frames and channel on teardown', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://localhost:3886/control-panel-v3.html');

  await expect.poll(async () => page.evaluate(() => Boolean(
    (window as any).VJControlPanel && (window as any).controlPanelV3
  )), { timeout: 15_000 }).toBeTruthy();

  const before = await page.evaluate(() => ({
    intervals: (window as any).intervalManager?.getStats?.().totalIntervals ?? -1,
    professionalDestroyed: (window as any).VJControlPanel.destroyed,
    supplementalDestroyed: (window as any).controlPanelV3.destroyed
  }));
  expect(before.intervals).toBeGreaterThanOrEqual(5);
  expect(before.intervals).toBeLessThanOrEqual(7);
  expect(before.professionalDestroyed).toBe(false);
  expect(before.supplementalDestroyed).toBe(false);

  const after = await page.evaluate(() => {
    const professional = (window as any).VJControlPanel;
    const supplemental = (window as any).controlPanelV3;
    professional.destroy();
    supplemental.destroy();
    return {
      intervals: (window as any).intervalManager?.getStats?.().totalIntervals ?? -1,
      professionalDestroyed: professional.destroyed,
      supplementalDestroyed: supplemental.destroyed,
      channelClosed: professional.channel === null,
      timeouts: professional.timeoutIds.size + supplemental.timeoutIds.size,
      frames: professional.rafIds.size + supplemental.rafIds.size
    };
  });

  expect(after).toEqual({
    intervals: 1,
    professionalDestroyed: true,
    supplementalDestroyed: true,
    channelClosed: true,
    timeouts: 0,
    frames: 0
  });
  expect(errors).toEqual([]);
});
