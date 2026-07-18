import { test, expect } from '@playwright/test';

test.describe('Matrix dice threshold', () => {
  test('countdown ring drains cleanly and animation toggle exposes ON/OFF', async ({ page }) => {
    await page.goto('http://localhost:3886/control-panel-v3.html');
    await page.evaluate(() => localStorage.removeItem('3886_anime_enabled'));
    await page.reload();

    await expect.poll(async () => page.evaluate(() => Boolean((window as any).VJControlPanel?.updateDiceCountdownDisplay)))
      .toBeTruthy();

    const ring = await page.evaluate(() => {
      const panel = (window as any).VJControlPanel;
      const circle = document.getElementById('countdownCircle') as SVGCircleElement;
      const offsets: string[] = [];
      panel.diceIntervalSeconds = 12;
      for (const value of [12, 6, 0]) {
        panel.diceCountdown = value;
        panel.updateDiceCountdownDisplay();
        offsets.push(circle.style.strokeDashoffset);
      }
      const style = getComputedStyle(circle);
      const ring = circle.closest('.dice-countdown-ring') as HTMLElement;
      return {
        offsets,
        position: style.position,
        borderWidth: style.borderTopWidth,
        animationName: style.animationName,
        transform: style.transform,
        bounds: circle.getBoundingClientRect().toJSON(),
        ringBounds: ring.getBoundingClientRect().toJSON()
      };
    });

    expect(ring.offsets).toEqual(['0', '50', '100']);
    expect(ring.position).toBe('static');
    expect(ring.borderWidth).toBe('0px');
    expect(ring.animationName).toBe('none');
    expect(ring.transform).toBe('none');
    expect(Math.abs(ring.bounds.width - ring.bounds.height)).toBeLessThan(1);
    expect(Math.abs(
      (ring.bounds.left + ring.bounds.width / 2) -
      (ring.ringBounds.left + ring.ringBounds.width / 2)
    )).toBeLessThan(1);
    expect(Math.abs(
      (ring.bounds.top + ring.bounds.height / 2) -
      (ring.ringBounds.top + ring.ringBounds.height / 2)
    )).toBeLessThan(1);

    const toggle = page.locator('#animeToggle');
    await expect(toggle).toHaveAttribute('data-state', 'disabled');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(toggle.locator('.toggle-status')).toHaveText('OFF');
    await toggle.click();
    await expect(toggle).toHaveAttribute('data-state', 'enabled');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(toggle.locator('.toggle-status')).toHaveText('ON');

    // Engine acknowledgements are authoritative and must correct every visual
    // and accessibility state, not only the legacy status label.
    await page.evaluate(() => {
      (window as any).VJControlPanel.handleMainPageMessage({
        type: 'anime_status',
        enabled: false
      });
    });
    await expect(toggle).toHaveAttribute('data-state', 'disabled');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(toggle).toHaveAttribute('aria-label', 'Enable animation system');
    await expect(toggle.locator('.toggle-status')).toHaveText('OFF');
    await expect(page.locator('#animeSystemStatus')).toHaveText('Disabled');

    await page.evaluate(() => {
      (window as any).VJControlPanel.handleMainPageMessage({
        type: 'settings_sync',
        settings: { animeEnabled: true },
        effectStates: {}
      });
    });
    await expect(toggle).toHaveAttribute('data-state', 'enabled');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(toggle).toHaveAttribute('aria-label', 'Disable animation system');
    await expect(toggle.locator('.toggle-status')).toHaveText('ON');
    await expect(page.locator('#animeSystemStatus')).toHaveText('Enabled');
  });

  test('89 does not trigger and 90 does trigger', async ({ page }) => {
    await page.goto('http://localhost:3886/control-panel-v3.html');

    await expect.poll(async () => {
      return await page.evaluate(() => Boolean((window as any).VJControlPanel?.rollDice));
    }, { timeout: 20_000 }).toBeTruthy();

    const result = await page.evaluate(() => {
      const panel = (window as any).VJControlPanel;
      const sent: any[] = [];
      const originalSend = panel.sendMessage.bind(panel);
      const originalRandom = Math.random;
      panel.sendMessage = (message: any) => sent.push(message);

      const rolls: any[] = [];
      window.addEventListener('matrixDiceRoll', (event: any) => rolls.push(event.detail));

      Math.random = () => 0.88; // floor(88) + 1 = 89
      panel.rollDice();
      const after89 = sent.filter((message) => message.type === 'matrix_message').length;

      Math.random = () => 0.89; // floor(89) + 1 = 90
      panel.rollDice();
      const after90 = sent.filter((message) => message.type === 'matrix_message').length;

      Math.random = originalRandom;
      panel.sendMessage = originalSend;

      return {
        threshold: panel.matrixMessageRollThreshold,
        rolls,
        after89,
        after90,
        display: document.getElementById('lastDiceRoll')?.textContent,
        triggered: document.getElementById('lastDiceRoll')?.dataset.triggered,
        label: document.getElementById('matrixDiceThreshold')?.textContent
      };
    });

    expect(result.threshold).toBe(90);
    expect(result.rolls.map((entry) => entry.roll)).toEqual([89, 90]);
    expect(result.rolls.every((entry) => entry.threshold === 90)).toBeTruthy();
    expect(result.after89).toBe(0);
    expect(result.after90).toBe(1);
    expect(result.display).toBe('90');
    expect(result.triggered).toBe('true');
    expect(result.label).toMatch(/(?:>=|≥)\s*90/);
  });
});
