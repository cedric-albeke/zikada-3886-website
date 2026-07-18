import { test, expect } from '@playwright/test';

test('Cosmic remains visible in the command center and cleans up its bounded canvas', async ({ context }) => {
  const control = await context.newPage();
  const main = await context.newPage();
  const errors: string[] = [];

  main.on('pageerror', error => errors.push(error.message));
  await main.goto('http://localhost:3886/');
  await control.goto('http://localhost:3886/control-panel-v3.html');

  await expect.poll(async () => main.evaluate(() => Boolean((window as any).vjReceiver)), {
    timeout: 20_000
  }).toBeTruthy();

  const cosmic = control.locator('.trigger-effects-container .trigger-btn[data-effect="cosmic"]');
  await expect(cosmic).toBeVisible();
  await expect(control.locator('.trigger-btn[data-effect="cosmic"]')).toHaveCount(1);
  await cosmic.click();

  await expect.poll(async () => main.evaluate(() => ({
    canvases: document.querySelectorAll('canvas[data-trigger-fx="cosmic"]').length,
    active: (window as any).triggerRuntime?.getStats?.().effects?.includes('cosmic') ?? false,
    nodes: (window as any).triggerRuntime?.getStats?.().nodes ?? 0
  }))).toEqual({ canvases: 1, active: true, nodes: 1 });

  const backingSize = await main.locator('canvas[data-trigger-fx="cosmic"]').evaluate((canvas: HTMLCanvasElement) => ({
    width: canvas.width,
    height: canvas.height
  }));
  expect(backingSize.width).toBeLessThanOrEqual(960);
  expect(backingSize.height).toBeLessThanOrEqual(540);

  await expect.poll(async () => main.evaluate(() => ({
    canvases: document.querySelectorAll('canvas[data-trigger-fx="cosmic"]').length,
    active: (window as any).triggerRuntime?.getStats?.().effects?.includes('cosmic') ?? false
  })), { timeout: 5_000 }).toEqual({ canvases: 0, active: false });

  await expect(control.locator('#eventLog')).toContainText(/TRIGGER COSMIC/i);
  expect(errors).toEqual([]);
});
