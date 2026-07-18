import { test, expect } from '@playwright/test';

test('visual reset disposes heavy persistent FX and restores safe states', async ({ context }) => {
  const control = await context.newPage();
  const main = await context.newPage();

  await control.goto('http://localhost:3886/control-panel-v3.html');
  await main.goto('http://localhost:3886/');

  await expect.poll(async () => main.evaluate(() => Boolean((window as any).vjReceiver && (window as any).fxController)), {
    timeout: 20_000
  }).toBeTruthy();

  await control.locator('[data-drawer-toggle="effectsLibrary"]').click();
  const dataStreams = control.locator('.effect-toggle-btn[data-effect="dataStreams"]');
  const plasma = control.locator('.effect-toggle-btn[data-effect="plasma"]');
  if (await dataStreams.getAttribute('data-state') !== 'on') await dataStreams.click();
  if (await plasma.getAttribute('data-state') !== 'on') await plasma.click();

  await expect.poll(async () => main.evaluate(() => ({
    dataStreams: Boolean((window as any).fxController?.effectStates?.dataStreams),
    plasma: Boolean((window as any).fxController?.effectStates?.plasma),
    dataStreamsNode: Boolean(document.getElementById('data-streams-overlay')),
    plasmaNode: Boolean(document.getElementById('plasma-overlay'))
  }))).toEqual({
    dataStreams: true,
    plasma: true,
    dataStreamsNode: true,
    plasmaNode: true
  });

  // Close the modal FX bank before using the persistent master controls.
  await control.locator('[data-drawer-toggle="effectsLibrary"]').click();
  await control.locator('#resetVisuals').click();

  await expect.poll(async () => main.evaluate(() => ({
    dataStreams: Boolean((window as any).fxController?.effectStates?.dataStreams),
    plasma: Boolean((window as any).fxController?.effectStates?.plasma),
    particles: Boolean((window as any).fxController?.effectStates?.particles),
    dataStreamsNode: Boolean(document.getElementById('data-streams-overlay')),
    plasmaNode: Boolean(document.getElementById('plasma-overlay')),
    dataStreamsOwner: Boolean((window as any).animationRuntime?.getStats?.().owners?.['fx-controller:data-streams'])
  }))).toEqual({
    dataStreams: false,
    plasma: false,
    particles: true,
    dataStreamsNode: false,
    plasmaNode: false,
    dataStreamsOwner: false
  });

  const states = await control.locator('.effect-toggle-btn').evaluateAll((buttons) => Object.fromEntries(
    buttons.map((button) => [
      (button as HTMLElement).dataset.effect,
      {
        state: (button as HTMLElement).dataset.state,
        pressed: button.getAttribute('aria-pressed'),
        label: button.textContent?.trim()
      }
    ])
  ));
  expect(states.particles).toEqual({ state: 'on', pressed: 'true', label: 'ON' });
  for (const [effect, state] of Object.entries(states)) {
    if (effect === 'particles') continue;
    expect(state).toEqual({ state: 'off', pressed: 'false', label: 'OFF' });
  }

  const overlay = control.locator('.layer-toggle-btn[data-layer="overlay"]');
  await expect(overlay).toHaveAttribute('data-state', 'off');
  await expect(overlay).toHaveAttribute('aria-pressed', 'false');
  await expect(overlay).toHaveText('○');
});
