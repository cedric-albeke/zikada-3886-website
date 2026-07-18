import { expect, test } from '@playwright/test';

test('LOW preserves a complete Lottie contract and queues the next clip', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.lottieAnimations?.isInitialized === true);

  const admitted = await page.evaluate(() => {
    const lottie = window.lottieAnimations;
    window.performanceProfile = 'low';
    lottie.setPerformanceProfile('low');
    const first = lottie.showAnimation('planetLogo');
    const second = lottie.showAnimation('circuitRound');
    return {
      first,
      second,
      duration: lottie.getDisplayDuration('planetLogo'),
      visible: lottie.getVisibleAnimationNames(),
      pending: [...lottie.pendingAnimations],
      playType: typeof document.querySelector('#lottie-planetLogo')?.play
    };
  });

  expect(admitted.first).toBe(true);
  expect(admitted.second).toBe(false);
  expect(admitted.duration).toBeGreaterThanOrEqual(15_000);
  expect(admitted.visible).toEqual(['planetLogo']);
  expect(admitted.pending).toContain('circuitRound');
  expect(admitted.playType).toBe('function');

  const loadStart = await page.evaluate(async () => {
    const canvas = document.querySelector('#lottie-planetLogo');
    try {
      await canvas?.ensureLottieLoaded?.();
      const response = await fetch('/animations/lottie-json/Planet-Logo.json');
      return { ok: true, assetStatus: response.status, assetBytes: (await response.arrayBuffer()).byteLength };
    } catch (error) {
      return { ok: false, error: String(error?.message || error) };
    }
  });
  expect(loadStart.ok).toBe(true);
  expect(loadStart.assetStatus).toBe(200);
  expect(loadStart.assetBytes).toBeGreaterThan(0);

  await expect.poll(() => page.evaluate(() => {
    const canvas = document.querySelector('#lottie-planetLogo');
    const player = canvas?.getLottieInstance?.();
    if (player?.isLoaded === true) return 'loaded';
    if (canvas?.dataset.lottieError) return canvas.dataset.lottieError;
    return JSON.stringify({
      ready: player?.isReady,
      loaded: player?.isLoaded,
      duration: player?.duration,
      totalFrames: player?.totalFrames
    });
  }), { timeout: 10_000 }).toBe('loaded');
  const renderBudget = await page.evaluate(() => {
    const canvas = document.querySelector('#lottie-planetLogo');
    const player = canvas?.getLottieInstance?.();
    return {
      managed: canvas?.dataset.lottieManaged,
      profile: canvas?.dataset.lottieProfile,
      dpr: player?.renderConfig?.devicePixelRatio,
      quality: player?.renderConfig?.quality
    };
  });
  expect(renderBudget.managed).toBe('true');
  expect(renderBudget.profile).toBe('low');
  expect(renderBudget.dpr).toBeLessThanOrEqual(0.45);
  expect(renderBudget.quality).toBeLessThanOrEqual(40);

  const compositorBudget = await page.evaluate(() => ({
    activeCanvasCount: document.querySelectorAll('.lottie-wrapper-planetLogo canvas').length,
    inactiveDisplays: Array.from(document.querySelectorAll('[class^="lottie-wrapper-"]'))
      .filter(node => !node.classList.contains('lottie-wrapper-planetLogo'))
      .map(node => getComputedStyle(node).display)
  }));
  expect(compositorBudget.activeCanvasCount).toBe(1);
  expect(compositorBudget.inactiveDisplays.every(display => display === 'none')).toBe(true);

  await page.waitForTimeout(4_000);
  const afterFourSeconds = await page.evaluate(() => ({
    visible: window.lottieAnimations.getVisibleAnimationNames(),
    opacity: Number(getComputedStyle(document.querySelector('.lottie-wrapper-planetLogo')).opacity)
  }));
  expect(afterFourSeconds.visible).toContain('planetLogo');
  expect(afterFourSeconds.opacity).toBeGreaterThan(0);

  await page.evaluate(() => window.lottieAnimations.fadeOutAnimation('planetLogo', 0));
  await expect.poll(() => page.evaluate(() => window.lottieAnimations.getVisibleAnimationNames()))
    .toContain('circuitRound');
});

test('trigger admission never preempts an active visual for capacity', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.triggerRuntime && window.animationRuntime));

  const result = await page.evaluate(() => {
    const TriggerRuntime = window.triggerRuntime.constructor;
    const animationRuntime = window.animationRuntime;
    const runtime = new TriggerRuntime({ runtime: animationRuntime, maxConcurrent: 1 });
    let firstScope;
    let secondStarted = false;

    runtime.start('first-contract', scope => { firstScope = scope; }, { watchdogDuration: 30_000 });
    runtime.start('second-contract', () => { secondStarted = true; }, { watchdogDuration: 30_000 });
    const before = runtime.getStats();
    firstScope.finish();
    const after = runtime.getStats();
    runtime.stopAll('test-cleanup');

    return { before, after, secondStarted };
  });

  expect(result.before.effects).toEqual(['first-contract']);
  expect(result.before.queuedEffects).toEqual(['second-contract']);
  expect(result.after.effects).toEqual(['second-contract']);
  expect(result.secondStarted).toBe(true);
});
