import { test, expect } from '@playwright/test';

test.describe('Matrix message overlay', () => {
  test('message display darkens the app before showing text', async ({ page }) => {
    await page.goto('http://localhost:3886/?runtimeSmoke=1');

    await expect.poll(async () => {
      return await page.evaluate(() => Boolean((window as any).ChaosControl?.showMatrixMessage));
    }, { timeout: 20_000 }).toBeTruthy();

    const initial = {
      messages: await page.locator('.matrix-messages').count(),
      blackouts: await page.locator('.matrix-blackout').count()
    };
    expect(initial.messages).toBe(1);
    expect(initial.blackouts).toBe(1);

    await page.evaluate(() => {
      (window as any).ChaosControl.showMatrixMessage('DOWNLOAD ENLIGHTENMENT');
    });

    await page.waitForTimeout(140);

    const preparing = await page.evaluate(() => {
      const blackout = document.querySelector('.matrix-blackout') as HTMLElement | null;
      const preGlitch = document.querySelector('.matrix-pre-glitch') as HTMLElement | null;
      const message = document.querySelector('.matrix-messages') as HTMLElement | null;
      return {
        bodyPreparing: document.body.classList.contains('matrix-message-preparing'),
        bodyActive: document.body.classList.contains('matrix-message-active'),
        preGlitchDisplay: preGlitch ? getComputedStyle(preGlitch).display : null,
        blackoutDisplay: blackout ? getComputedStyle(blackout).display : null,
        messageOpacity: message ? Number(getComputedStyle(message).opacity) : null
      };
    });

    expect(preparing.bodyPreparing).toBeTruthy();
    expect(preparing.bodyActive).toBeFalsy();
    expect(preparing.preGlitchDisplay).not.toBe('none');
    expect(preparing.blackoutDisplay).toBe('none');
    expect(preparing.messageOpacity).toBe(0);

    await page.waitForTimeout(600);

    const active = await page.evaluate(() => {
      const read = (selector: string) => {
        const el = document.querySelector(selector) as HTMLElement | null;
        if (!el) return null;
        const style = getComputedStyle(el);
        return {
          display: style.display,
          opacity: Number(style.opacity),
          zIndex: Number(style.zIndex || 0),
          filter: style.filter,
          text: el.textContent?.trim() || ''
        };
      };

      return {
        bodyPreparing: document.body.classList.contains('matrix-message-preparing'),
        bodyActive: document.body.classList.contains('matrix-message-active'),
        counts: {
          messages: document.getElementsByClassName('matrix-messages').length,
          blackouts: document.getElementsByClassName('matrix-blackout').length
        },
        preLoader: read('.pre-loader'),
        blackout: read('.matrix-blackout'),
        message: read('.matrix-messages'),
        logo: read('.image-2')
      };
    });

    expect(active.counts.messages).toBe(1);
    expect(active.counts.blackouts).toBe(1);
    expect(active.bodyPreparing).toBeFalsy();
    expect(active.bodyActive).toBeTruthy();
    expect(active.blackout?.display).not.toBe('none');
    expect(active.blackout?.opacity).toBeGreaterThanOrEqual(0.7);
    expect(active.blackout?.zIndex).toBeGreaterThan(active.preLoader?.zIndex || 0);
    expect(active.message?.zIndex).toBeGreaterThan(active.blackout?.zIndex || 0);
    expect(active.logo?.opacity).toBeLessThan(0.5);
    expect(active.logo?.filter).toContain('brightness');

    await page.evaluate(() => {
      (window as any).ChaosControl.cleanupMatrixMessage();
    });

    const cleaned = await page.evaluate(() => {
      const blackout = document.querySelector('.matrix-blackout') as HTMLElement | null;
      const message = document.querySelector('.matrix-messages') as HTMLElement | null;
      return {
        bodyActive: document.body.classList.contains('matrix-message-active'),
        counts: {
          messages: document.getElementsByClassName('matrix-messages').length,
          blackouts: document.getElementsByClassName('matrix-blackout').length
        },
        blackoutDisplay: blackout ? getComputedStyle(blackout).display : null,
        blackoutOpacity: blackout ? Number(getComputedStyle(blackout).opacity) : null,
        messageOpacity: message ? Number(getComputedStyle(message).opacity) : null
      };
    });

    expect(cleaned.bodyActive).toBeFalsy();
    expect(cleaned.counts.messages).toBe(1);
    expect(cleaned.counts.blackouts).toBe(1);
    expect(cleaned.blackoutDisplay).toBe('none');
    expect(cleaned.blackoutOpacity).toBe(0);
    expect(cleaned.messageOpacity).toBe(0);
  });
});
