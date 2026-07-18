import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function moduleUrl(relativePath) {
  const absolutePath = path.join(root, relativePath);
  return `${pathToFileURL(absolutePath).href}?runtimeGuard=${Date.now()}-${Math.random()}`;
}

function sourceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing source marker: ${startNeedle}`);

  const end = source.indexOf(endNeedle, start);
  assert.notEqual(end, -1, `missing source marker: ${endNeedle}`);

  return source.slice(start, end);
}

async function check(name, fn) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.error(`FAIL ${name}: ${error.message}`);
  }
}

await check('production entrypoint does not directly load debug or test modules', () => {
  const html = read('index.html');
  const blockedDirectScripts = [
    '/js/performance-inspector.js',
    '/js/dev/timer-instrumentation.js',
    '/js/test-fixes.js'
  ];

  blockedDirectScripts.forEach((scriptPath) => {
    assert.doesNotMatch(
      html,
      new RegExp(`<script[^>]+src=["']${scriptPath.replaceAll('/', '\\/')}["']`, 'i'),
      `${scriptPath} must be gated behind runtime-debug-loader`
    );
  });

  assert.match(html, /src=["']\/js\/runtime-debug-loader\.js["']/);
});

await check('chaos init does not statically import test/debug suites', () => {
  const source = read('js/chaos-init.js');
  const blockedImports = [
    'debug-console.js',
    'performance-ladder-test.js',
    'smart-preloader-test.js',
    'predictive-alerting-tests.js'
  ];

  blockedImports.forEach((importPath) => {
    assert.doesNotMatch(
      source,
      new RegExp(`^\\s*import\\s+.*${importPath.replace('.', '\\.')}`, 'm'),
      `${importPath} must be dynamically imported only when debug/tests are enabled`
    );
  });
});

await check('optional performance infrastructure stays off the critical startup path', () => {
  const chaosInit = read('js/chaos-init.js');
  const featureFlags = read('js/feature-flags-safe.js');
  const optionalModules = [
    'smart-preloader.js',
    'predictive-performance-alerting.js',
    'predictive-trend-analysis.js',
    'predictive-ladder-integration.js',
    'monitor/dashboard.js'
  ];

  optionalModules.forEach((modulePath) => {
    assert.doesNotMatch(
      chaosInit,
      new RegExp(`^\\s*import\\s+.*${modulePath.replaceAll('/', '\\/').replaceAll('.', '\\.')}`, 'm'),
      `${modulePath} must not add parse/compile cost to the normal startup path`
    );
    assert.match(
      chaosInit,
      new RegExp(`import\\(['\"]\\./${modulePath.replaceAll('/', '\\/').replaceAll('.', '\\.')}['\"]\\)`),
      `${modulePath} should remain available through an explicit dynamic import`
    );
  });

  assert.match(featureFlags, /window\.SAFE_FEATURE_FLAGS\s*=\s*safeFeatureFlags/, 'the compatibility feature-flag API must be published');
  assert.match(featureFlags, /isEnabled\(flag\)/, 'the compatibility feature-flag API must be queryable');
  assert.match(chaosInit, /lifecycleGeneration/, 'late optional imports must be invalidated across restart/teardown');
  assert.match(chaosInit, /destroyOptionalSubsystems/, 'optional subsystem resources need one teardown path');
  assert.match(chaosInit, /disposeOwner\(CHAOS_OPTIONAL_OWNER\)/, 'optional timers and listeners must be owner-scoped');
});

await check('animation runtime exposes owner-scoped scheduling and disposal', async () => {
  const originals = {
    window: globalThis.window,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    setInterval: globalThis.setInterval,
    clearInterval: globalThis.clearInterval
  };

  let nextId = 0;
  const cleared = [];

  globalThis.window = globalThis;
  globalThis.setTimeout = () => ({ type: 'timeout', id: ++nextId });
  globalThis.setInterval = () => ({ type: 'interval', id: ++nextId });
  globalThis.requestAnimationFrame = () => ({ type: 'raf', id: ++nextId });
  globalThis.clearTimeout = (handle) => cleared.push(handle);
  globalThis.clearInterval = (handle) => cleared.push(handle);
  globalThis.cancelAnimationFrame = (handle) => cleared.push(handle);

  try {
    const { default: animationRuntime } = await import(moduleUrl('js/runtime/animation-runtime.js'));

    const timeout = animationRuntime.scheduleTimeout('matrix', () => {}, 100);
    const interval = animationRuntime.scheduleInterval('matrix', () => {}, 100);
    const raf = animationRuntime.scheduleRafLoop('matrix', () => {});

    assert.equal(animationRuntime.getStats().owners.matrix.timeouts, 1);
    assert.equal(animationRuntime.getStats().owners.matrix.intervals, 1);
    assert.equal(animationRuntime.getStats().owners.matrix.rafLoops, 1);

    animationRuntime.disposeOwner('matrix');

    assert.ok(cleared.includes(timeout.handle), 'timeout handle cleared');
    assert.ok(cleared.includes(raf.handle), 'raf handle cleared');
    assert.equal(animationRuntime.getStats().owners.matrix, undefined);
    assert.equal(animationRuntime.getStats().sharedCadence.tasks, 0, 'shared cadence task released');
    assert.equal(animationRuntime.getStats().sharedCadence.drivers, 0, 'shared cadence driver sleeps when idle');
  } finally {
    globalThis.window = originals.window;
    globalThis.requestAnimationFrame = originals.requestAnimationFrame;
    globalThis.cancelAnimationFrame = originals.cancelAnimationFrame;
    globalThis.setTimeout = originals.setTimeout;
    globalThis.clearTimeout = originals.clearTimeout;
    globalThis.setInterval = originals.setInterval;
    globalThis.clearInterval = originals.clearInterval;
  }

  const runtimeSource = read('js/runtime/animation-runtime.js');
  assert.match(runtimeSource, /pauseOwnerAnimations/, 'runtime should pause owner animations without killing them');
  assert.match(runtimeSource, /resumeOwnerAnimations/, 'runtime should resume owner animations after quality recovery');
  assert.match(runtimeSource, /releaseOn\('onComplete'\)/, 'finite animations must release their bookkeeping token');
  assert.match(runtimeSource, /releaseOn\('onInterrupt'\)/, 'externally interrupted animations must release their bookkeeping token');
  assert.doesNotMatch(runtimeSource, /\bsetInterval\s*\(/, 'periodic runtime work must share one deadline driver');
  assert.match(runtimeSource, /periodsElapsed/, 'background throttling must skip missed periods instead of burst replay');
  assert.match(runtimeSource, /releaseOwnerIfIdle/, 'completed one-shot work must not leave empty owner buckets behind');
});

await check('automatic performance optimizers do not freeze auto mode', () => {
  const optimizer = read('js/performance-optimizer.js');
  const optimizerV2 = read('js/performance-optimizer-v2.js');
  const receiver = read('js/vj-receiver.js');
  const chaosInit = read('js/chaos-init.js');

  assert.doesNotMatch(
    optimizer,
    /window\.chaosInit\.phaseRunning\s*=\s*false/,
    'automatic optimizer must not stop the auto phase loop'
  );
  assert.doesNotMatch(
    optimizerV2,
    /animationPlayState\s*=\s*['"]paused['"]/,
    'automatic low-FPS optimizer must not pause CSS animations without owner recovery'
  );
  assert.match(
    optimizerV2,
    /performanceBus\.subscribe/,
    'legacy optimizer telemetry must reuse the central FPS publisher'
  );
  const optimizerFps = sourceBetween(optimizerV2, '    startFPSMonitoring() {', '    isPastStartupGrace() {');
  assert.doesNotMatch(optimizerFps, /scheduleRafLoop|requestAnimationFrame/, 'legacy optimizer must not run a duplicate FPS RAF');
  assert.doesNotMatch(
    optimizerV2,
    /window\.requestAnimationFrame\s*=/,
    'performance code must never replace the global RAF scheduler'
  );
  assert.doesNotMatch(
    optimizerV2,
    /\bsetInterval\s*\(/,
    'optimizer monitoring intervals must be owner-scoped and disposable'
  );
  assert.match(
    optimizer,
    /startupGraceMs/,
    'legacy optimizer must ignore startup FPS noise'
  );
  assert.match(
    optimizer,
    /autoMaxOptimizationLevel/,
    'legacy optimizer must cap automatic optimization separately from manual emergency controls'
  );
  assert.match(
    optimizer,
    /optimizationRecoveryHoldMs/,
    'legacy optimizer must debounce automatic recovery to avoid level 1/2 thrashing'
  );
  assert.match(
    optimizer,
    /pendingOptimizationLevel/,
    'legacy optimizer must require a stable lower target before reducing optimization'
  );
  assert.doesNotMatch(
    optimizer,
    /newOptLevel\s*=\s*3/,
    'automatic optimizer must not escalate to heavy level 3'
  );
  assert.doesNotMatch(
    optimizer,
    /gsap\.killTweensOf\(el\)/,
    'medium auto optimization must soften effects without killing their tweens'
  );
  assert.doesNotMatch(
    optimizer,
    /globalTimeline[\s\S]{0,80}timeScale\(/,
    'quality adaptation must not alter authored wall-clock durations'
  );
  assert.match(optimizer, /performanceBus\.subscribe/, 'compat optimizer must consume the central FPS bus');
  assert.doesNotMatch(optimizer, /\bsetInterval\s*\(/, 'compat optimizer must not own a native polling timer');
  const performanceManager = read('js/performance-manager.js');
  assert.match(performanceManager, /performanceBus\.subscribe/, 'legacy manager telemetry must consume the central FPS bus');
  assert.doesNotMatch(performanceManager, /\brequestAnimationFrame\s*\(/, 'legacy manager must not start a duplicate FPS RAF');
  assert.doesNotMatch(performanceManager, /globalTimeline\.timeScale\(/, 'legacy manager must preserve authored duration');
  const managerEvaluation = sourceBetween(performanceManager, '    evaluatePerformance(', '    profileManagerOwnsQuality() {');
  assert.doesNotMatch(managerEvaluation, /triggerCleanup\(/, 'heap pressure must be reported instead of cleaning live work');
  const timingController = read('js/timing-controller.js');
  assert.doesNotMatch(timingController, /globalTimeline\.timeScale\(/, 'phase pacing must not rewrite unrelated authored durations');
  assert.doesNotMatch(timingController, /\.forEach\(tween => tween\.kill\(\)\)/, 'capacity pressure must not kill arbitrary tweens');

  const intervalManager = read('js/interval-manager.js');
  assert.match(intervalManager, /options\.finiteLifetime === true/, 'wall-clock interval expiry must require an explicit finite lifetime contract');

  const sonar = read('js/sonar-effect.js');
  assert.doesNotMatch(sonar, /\bsetInterval\s*\(|\bsetTimeout\s*\(/, 'sonar sessions must not multiply native timers across repeated shows');
  assert.match(sonar, /disposeOwner\(SESSION_OWNER\)/, 'sonar hide must release the complete session owner');

  const watchdog = read('js/enhanced-watchdog.js');
  assert.doesNotMatch(watchdog, /window\.location\.reload\(/, 'automatic recovery must never enter a page reload loop');
  const chaosRecovery = sourceBetween(chaosInit, '    handleMemoryCritical(details) {', '    handleDOMGrowth(details) {');
  assert.doesNotMatch(chaosRecovery, /killTweensOf|emergencyStop|clearAllTimers/, 'memory pressure must lower render cost without truncating active work');
  assert.doesNotMatch(chaosInit, /animation-duration:\s*2s\s*!important/, 'watchdog CSS must not rewrite every authored animation duration');
  assert.match(
    optimizer,
    /softenNonEssentialEffects/,
    'medium auto optimization should keep recoverable softened effects'
  );

  const registry = read('js/gsap-animation-registry.js');
  const registryAudit = sourceBetween(registry, '    enforceAnimationLimits(category) {', '    performPeriodicCleanup() {');
  assert.doesNotMatch(registryAudit, /killAnimation|performEmergencyCleanup/, 'registry pressure must never evict admitted animations');
  const periodicRegistryCleanup = sourceBetween(registry, '    performPeriodicCleanup() {', '    performEmergencyCleanup() {');
  assert.doesNotMatch(periodicRegistryCleanup, /createdAt|maxAge/, 'periodic cleanup must be completion/ownership based, never age based');

  const elementManager = read('js/performance-element-manager.js');
  const defaultPurge = sourceBetween(elementManager, '    purge(selector = null) {', '    emergencyCleanup() {');
  assert.doesNotMatch(defaultPurge, /isStale/, 'default element purge must not age-evict connected visuals');

  const longevity = read('js/longevity-monitor.js');
  const longevityOldCleanup = sourceBetween(longevity, '    cleanupOldElements() {', '    triggerCorrectiveActions(metrics) {');
  assert.doesNotMatch(longevityOldCleanup, /Date\.now|maxAge|class\^=|class\*=/, 'longevity cleanup must require explicit completion markers');
  assert.match(longevity, /performanceBus\.metrics\.domNodes/, 'longevity must reuse the shared structural telemetry');
  assert.doesNotMatch(longevity, /querySelectorAll\(['"]\*['"]\)/, 'longevity must not rescan the complete DOM');

  const stability = read('js/stability-manager.js');
  const stabilityEmergencyRecovery = sourceBetween(stability, '    triggerEmergencyRecovery(issues) {', '    getStabilityReport() {');
  assert.doesNotMatch(stabilityEmergencyRecovery, /killTweensOf|killAll\(|emergencyCleanup\(/, 'automatic stability recovery must preserve admitted visual lifetimes');
  assert.match(stabilityEmergencyRecovery, /applyProfile\?\.\('low'/, 'automatic stability recovery must lower render cost');
  assert.doesNotMatch(stability, /querySelectorAll\(['"]\*['"]\)/, 'stability checks must reuse the shared structural telemetry');

  const performanceBus = read('js/performance-bus.js');
  assert.match(performanceBus, /memoryBytes[\s\S]*domNodes[\s\S]*activeAnimations/, 'performance bus must publish shared structural metrics');
  assert.match(performanceBus, /getElementsByTagName\('\*'\)/, 'the central bus must own the one complete DOM count');

  const safeMonitor = read('js/safe-performance-monitor.js');
  assert.doesNotMatch(safeMonitor, /querySelectorAll\(['"]\*['"]\)|usedJSHeapSize/, 'safe monitor must consume shared structural metrics');

  assert.doesNotMatch(optimizer, /querySelectorAll\(['"]\*['"]\)|usedJSHeapSize/, 'compat optimizer must consume shared structural metrics');

  const perfSampler = read('js/perf-sampler.js');
  assert.doesNotMatch(perfSampler, /scheduleInterval|querySelectorAll\(['"]\*['"]\)/, 'compat telemetry must consume the central bus without another poller');

  assert.doesNotMatch(optimizerV2, /querySelectorAll\(['"]\*['"]\)/, 'optimizer v2 must consume shared structural metrics without rescanning the DOM');

  const lifecycleAudit = sourceBetween(chaosInit, '    startPeriodicDOMCleanup() {', '    phaseIntense() {');
  assert.match(lifecycleAudit, /removeOrphanedElements/, 'periodic lifecycle work may untrack disconnected nodes');
  assert.match(lifecycleAudit, /performanceBus\.metrics\.domNodes/, 'periodic lifecycle audit must reuse central DOM telemetry');
  assert.doesNotMatch(lifecycleAudit, /aggressiveDOMCleanup|cleanupPhaseElements|\.remove\s*\(/, 'periodic lifecycle work must never delete connected visuals');

  const chaosWatchdog = sourceBetween(chaosInit, '    startAnimationWatchdog() {', '    startPeriodicDOMCleanup() {');
  assert.doesNotMatch(chaosWatchdog, /aggressiveDOMCleanup|cleanupPhaseElements|handleSoftRestart/, 'heap pressure must not trigger cleanup or automatic restart');
  assert.match(chaosWatchdog, /performanceBus\.metrics/, 'watchdog memory checks must consume central telemetry');

  const operatorOptimize = sourceBetween(receiver, '    executePerformanceOptimization() {', '    executeSystemReset(actions = []) {');
  assert.match(operatorOptimize, /applyProfile\?\.\('low'/, 'operator optimization must use the quality contract');
  assert.doesNotMatch(operatorOptimize, /aggressiveDOMCleanup|killByFilter|clearCategory|safeCleanup/, 'operator optimization must not interrupt active effect lifetimes');
});

await check('trigger effects have bounded ownership and idempotent emergency cleanup', () => {
  const triggerRuntime = read('js/runtime/trigger-runtime.js');
  const receiver = read('js/vj-receiver.js');
  const chaosInit = read('js/chaos-init.js');
  const legacyPanel = read('js/control-panel-v3.js');
  const emergencyStop = sourceBetween(
    receiver,
    '    emergencyStop() {',
    '    executeEmergencyCleanup() {'
  );
  const resetAllSystems = sourceBetween(
    receiver,
    '    resetAllSystems() {',
    '    toggleEffect(effectName'
  );

  assert.match(triggerRuntime, /maxConcurrent/, 'trigger runtime needs a concurrency budget');
  assert.match(triggerRuntime, /maxNodesPerTrigger/, 'trigger runtime needs a per-trigger DOM budget');
  assert.match(triggerRuntime, /maxStartsPerWindow/, 'trigger runtime needs a burst-rate budget');
  assert.match(triggerRuntime, /this\.pending/, 'busy trigger resources need a bounded admission queue');
  assert.match(triggerRuntime, /drainQueue/, 'queued trigger work must start after the active visual contract completes');
  const triggerRateGate = sourceBetween(triggerRuntime, '    canStart() {', '    recordStart(');
  assert.doesNotMatch(triggerRateGate, /rejected\+\+|return false/, 'burst pressure must queue intent instead of rejecting it at the rate gate');
  assert.match(triggerRuntime, /scheduleQueueWake/, 'rate-limited trigger intent must resume when the admission window opens');
  assert.doesNotMatch(triggerRuntime, /concurrency-budget/, 'automatic concurrency control must not evict a running effect');
  assert.match(triggerRuntime, /MIN_WATCHDOG_DURATION_MS\s*=\s*30000/, 'trigger leak watchdog needs a non-visual minimum');
  assert.match(triggerRuntime, /watchdogDuration/, 'trigger runtime needs a leak watchdog');
  assert.doesNotMatch(triggerRuntime, /maxDuration/, 'short effect manifests must not masquerade as leak watchdogs');
  assert.match(receiver, /this\.triggerRuntime\.start/, 'all one-shot FX must route through the trigger owner');
  assert.doesNotMatch(receiver, /this\.activeFx\+\+|this\.activeFx--/, 'active FX count must derive from owned scopes');
  assert.match(emergencyStop, /this\.triggerRuntime\.stopAll\('emergency-stop'\)/, 'emergency stop must always clear trigger scopes');
  assert.match(emergencyStop, /window\.chaosEngine\.stop\(\)/, 'emergency stop must halt the WebGL render loop');
  assert.match(emergencyStop, /stopNoiseAnimation/, 'emergency stop must halt the ambient noise renderer');
  assert.match(emergencyStop, /ambientCanvasRenderer\?\.pause/, 'emergency stop must fail-close the shared ambient renderer after FX resets');
  assert.match(emergencyStop, /stopAnimationPhases/, 'emergency stop must halt automatic phase scheduling');
  assert.doesNotMatch(emergencyStop, /restartEssentialAnimations/, 'emergency stop must remain fail-closed');
  assert.match(emergencyStop, /this\.lastEmergencyStop > 0/, 'the first emergency stop must never be mistaken for a cooldown repeat');
  assert.match(resetAllSystems, /_lastSystemResetAt/, 'duplicate reset transports must collapse into one action');
  assert.match(resetAllSystems, /window\.chaosEngine\.start\(\)/, 'explicit reset must resume the halted render loop');
  assert.match(resetAllSystems, /startNoiseAnimation/, 'explicit reset must resume the bounded noise renderer');
  assert.match(resetAllSystems, /fxController\?\.setIntensity\?\.\(this\.currentSettings\.effects\)/, 'reset must apply safe FX defaults before restarting noise');
  assert.match(resetAllSystems, /distortion:\s*0[\s\S]*noise:\s*0\.25/, 'reset defaults must avoid persistent blur while restoring bounded noise');
  assert.doesNotMatch(chaosInit, /chaos-localStorage-poll/, 'strobe must not have a second polling dispatcher');
  const legacyMatrixControls = sourceBetween(
    legacyPanel,
    '    initMatrixControls() {',
    '    showButtonFeedback(button, message) {'
  );
  assert.doesNotMatch(legacyMatrixControls, /vjMessaging\.(emergencyKill|systemReset|systemReload)/, 'legacy button wiring must not duplicate professional system controls');
});

await check('trigger admission queues instead of preempting active visuals', async () => {
  const fakeRuntime = {
    scheduleTimeout() { return { clear() {} }; },
    trackNode() { return { clear() {} }; },
    trackAnimation() { return { clear() {} }; },
    trackDisposer() { return { clear() {} }; },
    disposeOwner() {}
  };
  const { TriggerRuntime } = await import(moduleUrl('js/runtime/trigger-runtime.js'));
  const runtime = new TriggerRuntime({ runtime: fakeRuntime, maxConcurrent: 1 });
  let firstScope;
  let secondStarted = false;

  runtime.start('first', scope => { firstScope = scope; }, { watchdogDuration: 10000 });
  runtime.start('second', () => { secondStarted = true; }, { watchdogDuration: 10000 });

  assert.deepEqual(runtime.getStats().effects, ['first']);
  assert.deepEqual(runtime.getStats().queuedEffects, ['second']);
  assert.equal(secondStarted, false, 'queued visual must not preempt the active one');

  firstScope.finish();
  assert.deepEqual(runtime.getStats().effects, ['second']);
  assert.equal(secondStarted, true, 'queued visual should start as soon as capacity is released');
});

await check('trigger burst rate queues and resumes intent without eviction', async () => {
  let now = 0;
  const scheduled = [];
  const fakeRuntime = {
    scheduleTimeout(owner, callback, delay) {
      const token = { owner, callback, delay, cleared: false, clear() { this.cleared = true; } };
      scheduled.push(token);
      return token;
    },
    trackNode() { return { clear() {} }; },
    trackAnimation() { return { clear() {} }; },
    trackDisposer() { return { clear() {} }; },
    disposeOwner() {}
  };
  const { TriggerRuntime } = await import(moduleUrl('js/runtime/trigger-runtime.js'));
  const runtime = new TriggerRuntime({
    runtime: fakeRuntime,
    now: () => now,
    maxConcurrent: 2,
    maxStartsPerWindow: 1,
    startWindowMs: 1000
  });
  let firstScope;
  let secondStarted = false;

  runtime.start('rate-first', scope => { firstScope = scope; }, { watchdogDuration: 10000 });
  runtime.start('rate-second', () => { secondStarted = true; }, { watchdogDuration: 10000 });
  firstScope.finish();

  assert.equal(secondStarted, false, 'rate-limited intent must wait without preempting admitted work');
  assert.deepEqual(runtime.getStats().queuedEffects, ['rate-second']);
  assert.equal(runtime.getStats().rejected, 0, 'rate pressure is not a rejection');

  now = 1002;
  const wake = scheduled.find(token => token.owner === runtime.queueOwner && !token.cleared);
  assert.ok(wake, 'queue wake-up must be scheduled for the next admission window');
  wake.callback();

  assert.equal(secondStarted, true, 'queued intent must resume when the rate window opens');
  assert.deepEqual(runtime.getStats().effects, ['rate-second']);
  runtime.stopAll('test-cleanup');
});

await check('trigger leak watchdog cannot become an authored visual cutoff', async () => {
  const scheduled = [];
  const fakeRuntime = {
    scheduleTimeout(owner, callback, delay) {
      const token = { owner, callback, delay, clear() {} };
      scheduled.push(token);
      return token;
    },
    trackNode() { return { clear() {} }; },
    trackAnimation() { return { clear() {} }; },
    trackDisposer() { return { clear() {} }; },
    disposeOwner() {}
  };
  const { TriggerRuntime } = await import(moduleUrl('js/runtime/trigger-runtime.js'));
  const runtime = new TriggerRuntime({ runtime: fakeRuntime });
  let scope;

  runtime.start('visual-contract', nextScope => {
    scope = nextScope;
    nextScope.completeAfter(5000);
  }, { watchdogDuration: 2000 });

  const watchdog = scheduled.find(token => token.owner.startsWith('trigger:visual-contract:') && token.delay >= 30000);
  assert.ok(watchdog, 'watchdog must stay at least 30 seconds even when configured like a short effect duration');
  assert.ok(scheduled.some(token => token.delay === 5000), 'authored completion remains independently scheduled');
  scope.finish();
});

await check('animation manager bounds bursts and restores per-trigger state', () => {
  const manager = read('js/animation-manager.js');

  assert.match(manager, /maxQueueSize\s*=\s*12/, 'animation queue needs a hard upper bound');
  assert.match(manager, /maxActiveAnimations\s*=\s*4/, 'animation concurrency needs a hard upper bound');
  assert.match(manager, /duplicateIndex/, 'queued retriggers should replace stale work');
  assert.match(manager, /AbortController/, 'active animations must be cancellable');
  assert.match(manager, /elementSnapshots/, 'cleanup must restore the state captured for that trigger');
  assert.match(manager, /animationRuntime\.disposeOwner/, 'animation work must be owner-disposable');
  assert.doesNotMatch(manager, /\bsetTimeout\s*\(|\bsetInterval\s*\(/, 'animation manager timers must be owner-scoped');
});

await check('control panel dispatches animation triggers once with cooldown', () => {
  const html = read('control-panel-v3.html');
  const controller = read('js/control-panel-professional.js');

  assert.doesNotMatch(html, /setupAnimationTriggerButtons/, 'inline trigger wiring must not duplicate the panel controller');
  assert.doesNotMatch(html, /trigger-effects-diagnostic|trigger-effect-orchestrator/, 'diagnostic effect runtimes must not load in the production panel');
  assert.doesNotMatch(html, /initAnimationManager/, 'the control surface must not run engine animations locally');
  assert.match(controller, /anim-trigger-btn[\s\S]*btn\.disabled/, 'animation buttons need a bounded input cooldown');
});

await check('control panel supplemental lifecycle is single-owner and disposable', () => {
  const controller = read('js/control-panel-v3.js');
  const professional = read('js/control-panel-professional.js');
  const init = sourceBetween(controller, '    init() {', '    listen(target');
  const professionalInit = sourceBetween(professional, '    init() {', '    initBroadcastChannel() {');

  assert.match(controller, /new AbortController\(\)/, 'supplemental listeners need one abortable owner');
  assert.match(controller, /destroy\(\)[\s\S]*abortController\.abort\(\)/, 'supplemental listeners must be disposed together');
  assert.match(controller, /timeoutIds\.forEach[\s\S]*rafIds\.forEach/, 'pending callbacks must be cancelled during teardown');
  assert.doesNotMatch(controller, /\bsetInterval\s*\(/, 'the professional controller must remain the sole uptime owner');
  assert.doesNotMatch(init, /startUptimeCounter|initMatrixControls/, 'supplemental boot must not duplicate uptime or performance-mode dispatch');
  assert.doesNotMatch(controller, /scrollIntoView/, 'panel startup must never move the operator viewport');
  assert.match(controller, /window\.controlPanelV3\?\.destroy/, 'hot reload must replace the previous supplemental owner');
  assert.match(professional, /new AbortController\(\)/, 'the professional surface needs one abortable listener owner');
  assert.match(professional, /setManagedInterval/, 'all professional monitoring loops need a tracked interval owner');
  assert.match(professional, /destroy\(\)[\s\S]*channel\.close\(\)/, 'panel teardown must close its transport channel');
  assert.match(professional, /intervalIds\.forEach[\s\S]*rafIds\.forEach[\s\S]*disposers\.forEach/, 'panel teardown must release intervals, frames and subscriptions');
  assert.doesNotMatch(professionalInit, /scheduleInitialSceneScroll/, 'professional boot must leave the operator viewport untouched');
  assert.doesNotMatch(professional, /\b(document|window|btn|slider)\.addEventListener\s*\(/, 'panel event listeners must route through the abortable owner');
});

await check('cosmic trigger stays visually available within a bounded paint budget', () => {
  const receiver = read('js/vj-receiver.js');
  const cosmic = sourceBetween(
    receiver,
    '    triggerCosmicBurst(scope) {',
    '    loadPreset(preset) {'
  );

  assert.match(receiver, /cosmic:\s*\{[^}]*maxNodes:\s*1/s, 'cosmic trigger must keep a one-node hard budget');
  assert.doesNotMatch(receiver, /maxDuration/, 'trigger definitions must not encode visual duration as a hard deadline');
  assert.match(cosmic, /document\.createElement\('canvas'\)/, 'cosmic should use one canvas instead of a giant DOM gradient');
  assert.match(cosmic, /960\s*\/\s*Math\.max\(1, window\.innerWidth\)/, 'cosmic backing width must be capped');
  assert.match(cosmic, /540\s*\/\s*Math\.max\(1, window\.innerHeight\)/, 'cosmic backing height must be capped');
  assert.match(cosmic, /createLinearGradient/, 'cosmic needs one chromatic ring gradient');
  assert.match(cosmic, /context\.arc\(centerX, centerY, radius/, 'cosmic needs one circular pulse path');
  assert.doesNotMatch(cosmic, /Array\.from|context\.ellipse|Math\.cos|Math\.sin\([^)]*spiral/, 'cosmic must not reintroduce geometric objects or particles');
  assert.match(cosmic, /scope\.completeAfter\(1900\)/, 'cosmic must have a deterministic cleanup deadline');
  assert.doesNotMatch(cosmic, /2000px/, 'cosmic must not expand a giant painted DOM surface');
});

await check('command center countdown and animation switch have deterministic states', () => {
  const html = read('control-panel-v3.html');
  const controller = read('js/control-panel-command-center.js');
  const professional = read('js/control-panel-professional.js');
  const commandCss = read('css/control-panel-command-center.css');
  const receiver = read('js/vj-receiver.js');

  assert.match(html, /id="animeToggle"[^>]*data-state="disabled"[^>]*aria-pressed="false"[^>]*>[\s\S]*toggle-status">OFF</, 'animation switch needs an explicit safe initial OFF state');
  assert.match(controller, /aria-pressed[\s\S]*enabled \? 'ON' : 'OFF'/, 'animation switch must synchronize visual and accessibility states');
  assert.match(professional, /animeSystemStatus[\s\S]*animeToggle[\s\S]*aria-pressed[\s\S]*toggle-status/, 'runtime acknowledgements must synchronize the command-center animation switch');
  assert.match(professional, /case 'settings_sync':[\s\S]*settings\?\.animeEnabled[\s\S]*updateAnimeSystemStatus/, 'settings handshake must hydrate the animation switch from the engine');
  assert.match(professional, /const remaining[\s\S]*circumference \* \(1 - remaining\)/, 'countdown ring must drain from full to empty');
  assert.match(commandCss, /\.command-center \.countdown-progress[\s\S]*position:\s*static !important/, 'legacy absolute-position CSS must not deform the SVG circle');
  assert.match(commandCss, /\.command-center \.countdown-progress[\s\S]*animation:\s*none !important/, 'legacy border rotation must not move the SVG progress arc');
  assert.match(commandCss, /\.command-center \.countdown-progress[\s\S]*transform:\s*none !important/, 'the SVG circle must stay centered inside its own viewport');
  assert.match(commandCss, /\.system-toggle-btn\[data-state="disabled"\]/, 'animation switch needs a distinct OFF treatment');
  assert.doesNotMatch(commandCss, /\.command-center \.system-toggle-btn\s*\{[^}]*border-radius:\s*50%/s, 'animation switch must not regress to the ambiguous circular power glyph');
  assert.doesNotMatch(html, /performance-stats-controller|performance-dashboard-v2/, 'command center must not boot duplicate local telemetry dashboards');
  const panelPerformance = sourceBetween(professional, '    startPerformanceMonitoring() {', '    destroy() {');
  assert.doesNotMatch(panelPerformance, /requestAnimationFrame|scheduleFrame/, 'control panel must display engine telemetry without running a second FPS RAF');
  assert.doesNotMatch(panelPerformance, /type:\s*'performance_stats'/, 'control panel telemetry must not overwrite engine metrics with panel-local values');
  assert.match(panelPerformance, /type:\s*'request_performance'/, 'control panel must request canonical engine telemetry');
  assert.match(professional, /case 'settings_sync':[\s\S]*syncEffectStates/, 'persistent FX controls must hydrate from the engine state');
  assert.match(professional, /case 'effect_state':[\s\S]*syncEffectStates/, 'persistent FX controls must accept authoritative runtime acknowledgements');
  assert.match(professional, /case 'pong':[\s\S]*syncEffectStates/, 'late-mounted engines must hydrate panel FX state through the ping handshake');
  assert.match(professional, /SAFE_EFFECT_DEFAULTS[\s\S]*particles:\s*true[\s\S]*resetVisuals[\s\S]*SAFE_EFFECT_DEFAULTS\[effect\]/, 'visual reset must return to conservative persistent-FX defaults');
  assert.doesNotMatch(professional, /resetVisuals[\s\S]{0,1800}(?:holographic|dataStreams|plasma|noise|cyberGrid|vignette)\.enabled\s*=\s*true/, 'visual reset must not reactivate the heavy persistent FX bank');
  assert.match(receiver, /particles:\s*\(\)\s*=>\s*\{[\s\S]*setEffectEnabled\('particles', enabled\)/, 'particle toggles must update the canonical FX state, not only a legacy DOM selector');
});

await check('WebGL and performance loops are cancellable on restart', () => {
  const engine = read('js/chaos-engine.js');
  const webglManager = read('js/webgl-resource-manager.js');
  const chaosInit = read('js/chaos-init.js');
  const ambientRenderer = read('js/ambient-canvas-renderer.js');
  const backgroundAnimator = read('js/background-animator.js');
  const optimizerV2 = read('js/performance-optimizer-v2.js');
  const watchdog = read('js/enhanced-watchdog.js');

  assert.match(engine, /this\.animationFrameId\s*=\s*requestAnimationFrame/, 'engine RAF handle must be retained');
  assert.match(engine, /cancelAnimationFrame\(this\.animationFrameId\)/, 'engine RAF must be cancelled on destroy');
  assert.match(engine, /forceContextLoss/, 'renderer teardown must release the WebGL context');
  assert.match(engine, /this\.phaseTimeline\?\.pause\(\)/, 'engine stop must pause its infinite phase timeline');
  assert.match(engine, /this\.phaseTimeline\.kill\(\)/, 'engine destroy must kill its infinite phase timeline');
  assert.match(engine, /swiftshader\|llvmpipe\|software/, 'engine startup must detect software WebGL renderers');
  assert.match(engine, /this\.softwareRenderer \? 0\.5/, 'software renderers must start at half-resolution DPR');
  assert.match(engine, /if \(this\.softwareRenderer\)[\s\S]*this\.composer = null/, 'software renderers must bypass post-processing allocation');
  assert.match(engine, /SOFTWARE_RENDER_FPS\s*=\s*15/, 'software rendering needs a bounded cadence that leaves CPU time for authored UI motion');
  assert.match(engine, /SOFTWARE_PARTICLE_CAP\s*=\s*120/, 'software rendering must not boot at the hardware particle density');
  assert.doesNotMatch(engine, /import\s+\{\s*(GlitchPass|FilmPass)/, 'glitch and film grain must not allocate duplicate fullscreen post-processing passes');
  const postProcessingProfiles = sourceBetween(engine, '    adjustPostProcessing(quality) {', '    destroy() {');
  assert.doesNotMatch(postProcessingProfiles, /new\s+(GlitchPass|FilmPass)/, 'HIGH must reuse the bounded ambient compositor for glitch and grain');
  assert.doesNotMatch(webglManager, /this\.gl\.finish\s*\(/, 'periodic maintenance must never synchronously drain the GPU queue');
  assert.match(webglManager, /resourceWarmupUntil/, 'resource leak analysis must exclude shader warmup');
  assert.match(webglManager, /animationRuntime\.scheduleInterval\(this\.runtimeOwner/, 'WebGL maintenance must be owner-scoped');
  const composerCleanup = sourceBetween(
    webglManager,
    '    cleanupComposerTargets() {',
    '    getRenderTarget(width'
  );
  assert.doesNotMatch(composerCleanup, /\.dispose\s*\(/, 'periodic maintenance must not dispose reusable composer passes');
  assert.match(optimizerV2, /animationRuntime\.disposeOwner\(this\.runtimeOwner\)/, 'optimizer teardown must dispose all monitoring work');
  const optimizerDomAudit = sourceBetween(optimizerV2, '    performElementCleanup() {', '    isElementStale(element');
  assert.doesNotMatch(optimizerDomAudit, /\.remove\s*\(|replaceChild/, 'automatic optimizer maintenance must not remove connected visuals');
  const optimizerLowFps = sourceBetween(optimizerV2, '    triggerLowFPSOptimizations() {', '    applyAdaptivePerformanceProfile() {');
  assert.doesNotMatch(optimizerLowFps, /performElementCleanup|reduceAnimationQuality|softenNonEssentialAnimations/, 'low-FPS recovery must change quality instead of evicting visuals');
  const optimizerQuality = sourceBetween(optimizerV2, '    reduceAnimationQuality() {', '    softenNonEssentialAnimations() {');
  assert.doesNotMatch(optimizerQuality, /\.remove\s*\(/, 'quality reduction must preserve existing particles');
  assert.doesNotMatch(watchdog, /window\.requestAnimationFrame\s*=/, 'watchdog must observe RAF without replacing it');
  assert.doesNotMatch(watchdog, /OffscreenCanvas|watchdog-sentinel/, 'watchdog must not allocate a second WebGL context');
  assert.doesNotMatch(watchdog, /scheduleRafLoop\(this\.runtimeOwner/, 'watchdog heartbeat must consume the central FPS bus instead of adding a RAF');
  assert.match(watchdog, /scheduleInterval\(this\.runtimeOwner, checkEventLoopLag, 500\)/, 'watchdog health checks must share one low-cadence tick');
  assert.match(chaosInit, /CHAOS_MONITOR_OWNER/, 'initializer FPS sampling needs explicit ownership');
  assert.match(chaosInit, /performanceBus\.subscribe\(monitorFPS\)/, 'initializer telemetry must reuse the central FPS publisher');
  const fpsMonitor = sourceBetween(chaosInit, '    initPerformanceMonitor() {', '    setPerformanceMode(mode) {');
  assert.doesNotMatch(fpsMonitor, /scheduleRafLoop|requestAnimationFrame/, 'initializer telemetry must not create another measurement RAF');
  assert.match(chaosInit, /CHAOS_CLEANUP_OWNER/, 'periodic DOM cleanup needs explicit ownership');
  assert.match(chaosInit, /CHAOS_STARTUP_OWNER/, 'delayed phase startup needs explicit ownership');
  assert.match(chaosInit, /!window\.chaosEngine\.softwareRenderer/, 'software renderers must skip eager shader precompilation');

  const cyberGrid = sourceBetween(chaosInit, '    addCyberGrid() {', '    addGlowEffects() {');
  assert.doesNotMatch(
    cyberGrid,
    /requestAnimationFrame|scheduleRafLoop/,
    'static cyber grid must not redraw identical lines every frame'
  );

  assert.match(ambientRenderer, /scheduleRafLoop\(LOOP_OWNER/, 'ambient RAF must be owner-scoped');
  assert.match(ambientRenderer, /fps:\s*6/, 'LOW ambient rendering must retain a 6 FPS cap');
  assert.match(ambientRenderer, /pause\(\)[\s\S]*disposeOwner\(LOOP_OWNER\)/, 'emergency stop must be able to halt the shared ambient loop');
  assert.doesNotMatch(ambientRenderer, /\brequestAnimationFrame\s*\(/, 'ambient renderer must not leave a native RAF behind');
  assert.doesNotMatch(backgroundAnimator, /120vmax|rotation:\s*360/, 'background fidelity must not allocate a rotating oversized compositor square');
  assert.match(backgroundAnimator, /Math\.min\(1\.16/, 'HIGH background scale must stay within the shared viewport surface budget');
});

await check('health monitors cannot outlive their owners', () => {
  const monitorFiles = [
    'js/performance-optimizer-v2.js',
    'js/enhanced-watchdog.js',
    'js/safe-performance-monitor.js',
    'js/longevity-monitor.js',
    'js/stability-manager.js'
  ];

  monitorFiles.forEach(file => {
    const source = read(file);
    assert.doesNotMatch(source, /\bsetInterval\s*\(/, `${file} must not create unmanaged intervals`);
    assert.match(source, /animationRuntime\.disposeOwner/, `${file} must expose owner cleanup`);
  });

  const longevity = read('js/longevity-monitor.js');
  const stabilitySource = read('js/stability-manager.js');
  assert.match(longevity, /performanceBus\.subscribe/, 'longevity metrics must reuse the central FPS publisher');
  assert.match(longevity, /lastFpsDegradationAction[\s\S]*console\.warn/, 'longevity FPS warnings must be cooldown-deduplicated');
  const longevityEmergency = sourceBetween(longevity, '    triggerEmergencyActions() {', '    triggerWarningActions() {');
  assert.doesNotMatch(longevityEmergency, /pauseNonEssentialAnimations|aggressiveCleanup|enableMinimalMode/, 'automatic longevity actions must not interrupt effect families');
  const stabilityDomFallback = sourceBetween(stabilitySource, '    aggressiveDOMCleanup() {', '    disableProblematicFeatures() {');
  assert.doesNotMatch(stabilityDomFallback, /\.remove\s*\(|display\s*=\s*['"]none/, 'automatic stability fallback must not delete or hide live visuals');
  assert.match(stabilitySource, /profile === 'low'[\s\S]*\? 20/, 'stability FPS thresholds must respect the active low-cost profile');

  const stability = read('js/stability-manager.js');
  const safeMonitor = read('js/safe-performance-monitor.js');
  const enhancedWatchdog = read('js/enhanced-watchdog.js');
  const setupErrorHandling = sourceBetween(
    stability,
    '    setupErrorHandling() {',
    '    listen(type, handler'
  );
  assert.doesNotMatch(
    setupErrorHandling,
    /setupFetchInterceptor|setupConsoleInterceptor|setupGSAPErrorHandling|setupAnimeErrorHandling|setupThreeJSErrorHandling/,
    'stability observation must not monkey-patch global APIs'
  );
  assert.match(safeMonitor, /performanceBus\.subscribe\(updateMetrics\)/, 'safe monitor must reuse central FPS telemetry');
  assert.doesNotMatch(safeMonitor, /scheduleRafLoop|requestAnimationFrame/, 'safe monitor must not create a duplicate FPS RAF');
  const watchdogReporting = sourceBetween(enhancedWatchdog, '    setupFPSReporting() {', '    getStatus() {');
  assert.match(watchdogReporting, /performanceBus\.subscribe/, 'watchdog FPS reporting must reuse central telemetry');
  assert.doesNotMatch(watchdogReporting, /scheduleRafLoop|requestAnimationFrame/, 'watchdog reporting must not create a duplicate FPS RAF');

  const performanceBusSource = read('js/performance-bus.js');
  assert.match(performanceBusSource, /scheduleRafLoop\(PERFORMANCE_BUS_OWNER/, 'the central FPS publisher needs one owner-scoped RAF');
  assert.doesNotMatch(performanceBusSource, /\brequestAnimationFrame\s*\(/, 'the central FPS publisher must not leave a native RAF behind');
});

await check('performance optimizer v2 does not age GSAP timeline seconds as wall-clock time', () => {
  const optimizerV2 = read('js/performance-optimizer-v2.js');
  const staleCheck = sourceBetween(
    optimizerV2,
    '    isAnimationStale(animation',
    '    setupMemoryOptimizations()'
  );

  assert.match(
    staleCheck,
    /getAnimationWallClockCreatedAt/,
    'stale animation cleanup must derive age only from explicit wall-clock timestamps'
  );
  assert.doesNotMatch(
    staleCheck,
    /animation\._startTime|animation\.startTime/,
    'GSAP/anime timeline positions are not Date.now()-compatible timestamps'
  );
});

await check('auto mode preserves authored phase duration', () => {
  const chaosInit = read('js/chaos-init.js');
  const phaseDuration = sourceBetween(
    chaosInit,
    '    getPhaseDuration(phaseName) {',
    '    startAnimationPhases() {'
  );
  const startAnimationPhases = sourceBetween(
    chaosInit,
    '    startAnimationPhases() {',
    '    stopAnimationPhases() {'
  );

  assert.doesNotMatch(phaseDuration, /Math\.min\(configuredDuration/, 'automatic quality must not truncate a running phase');
  assert.match(
    chaosInit,
    /getPhaseDuration/,
    'auto mode should route scheduling through per-phase duration logic'
  );
  assert.match(
    startAnimationPhases,
    /getPhaseDuration\(choice\.name\)/,
    'auto mode must use the selected phase name when scheduling the next phase'
  );
});

await check('quality recovery keeps variety without disabling guardrails', () => {
  const optimizer = read('js/performance-optimizer.js');
  const lotties = read('js/lottie-animations.js');
  const matrix = read('js/matrix-messages.js');

  assert.match(
    optimizer,
    /maxActiveAnimations\s*=\s*(5\d|[6-9]\d|[1-9]\d{2,})/,
    'active animation budget should preserve visual richness'
  );
  assert.match(
    optimizer,
    /maxTotalAnimations\s*=\s*(1[2-9]\d|[2-9]\d{2,})/,
    'total animation budget should allow normal auto-mode variety'
  );
  assert.doesNotMatch(
    optimizer,
    /timeScale\(0\.5\)/,
    'automatic medium optimization must not halve all looping animation speed'
  );
  assert.match(
    lotties,
    /scheduleLottieCycle/,
    'lottie cycles should use a centralized stagger scheduler'
  );
  assert.doesNotMatch(
    lotties,
    /(135000|165000)/,
    'primary lottie variety should appear within the first auto-mode minute, not after several minutes'
  );
  assert.match(
    matrix,
    /autoDiceThreshold\s*=\s*90/,
    'standalone matrix rolls must honor the same >= 90 trigger contract as the control panel'
  );
  assert.match(
    matrix,
    /matrixDiceRoll/,
    'matrix dice rolls should dispatch an observable roll event'
  );
  assert.match(
    matrix,
    /matrixMessageShown/,
    'matrix message display should dispatch an observable shown event'
  );
  assert.match(
    lotties,
    /safeStopPlayer/,
    'lottie fade-out should avoid dotLottie stop() calls while the player is still loading'
  );
  assert.match(lotties, /cycleDurationMs/, 'Lottie lifetime should derive from source-cycle metadata');
  assert.match(lotties, /minCycles/, 'Lottie clips need an explicit complete-cycle contract');
  assert.match(lotties, /queueAnimation/, 'Lottie admission should queue instead of evicting an active clip');
  assert.doesNotMatch(lotties, /maxVisibleByProfile\s*=\s*\{[\s\S]*low:\s*0/, 'LOW must retain at least one Lottie lane');
  assert.match(lotties, /scheduledTasks\s*=\s*new Map/, 'Lottie variety should share one due-time scheduler');
  assert.match(lotties, /scheduleInterval\(RUNTIME_OWNER[\s\S]*}, 1000\)/, 'Lottie cycles should use one owner-scoped cadence');
  assert.doesNotMatch(lotties, /intervalManager|createInterval/, 'each Lottie family must not allocate its own permanent interval');
});

await check('Lottie runtime is local, lazy and render-budgeted', () => {
  const html = read('index.html');
  const packageJson = read('package.json');
  const factory = read('js/lottie-player-factory.js');
  const extractor = read('scripts/extract-lottie-json.mjs');

  assert.doesNotMatch(html, /unpkg\.com\/@dotlottie|@latest/, 'production must not depend on an unpinned remote Lottie player');
  assert.doesNotMatch(html, /cdnjs[^\n]*lottie|lottie(?:\.min)?\.js/, 'production must not load a second external Lottie runtime');
  assert.doesNotMatch(packageJson, /@lottiefiles\/lottie-player|@lottiefiles\/dotlottie-web/, 'retired Lottie runtimes should not remain bundled');
  assert.match(packageJson, /"lottie-web"\s*:\s*"\^?5\.13\.0"/, 'the local Canvas renderer must be versioned');
  assert.match(factory, /lottie_light_canvas/, 'the lighter Canvas-only renderer should be bundled');
  assert.match(factory, /ensureLoaded/, 'players must initialize lazily after admission');
  assert.match(factory, /devicePixelRatio:[\s\S]*0\.45/, 'LOW needs a bounded Lottie backing resolution');
  assert.match(factory, /ASSET_CACHE/, 'decoded source JSON should be fetched once and reused');
  assert.match(factory, /!canvas\.isConnected[\s\S]*clearPlayback\(\)/, 'detached Lottie surfaces must stop their RAF immediately');
  assert.match(extractor, /unzipSync/, 'legacy .lottie archives need deterministic JSON extraction');
});

await check('interactive schedulers are owner-scoped and idle when unused', () => {
  const receiver = read('js/vj-receiver.js');
  const matrix = read('js/matrix-messages.js');
  const textEffects = read('js/text-effects.js');
  const midiCatalog = read('js/midi-action-catalog.js');
  const midiFeedback = read('js/midi-feedback.js');

  const receiverPerformance = sourceBetween(receiver, '    startPerformanceMonitoring() {', '    sendPerformanceData() {');
  const receiverBpm = sourceBetween(receiver, '    setupBpmRippleTimer() {', '    setupClickRipple() {');
  const receiverHook = sourceBetween(receiver, '    hookIntoChaosEngine() {', '    // Add missing methods');
  const receiverDebug = sourceBetween(receiver, '    showDebugInfo() {', '    getCurrentFPS() {');

  assert.match(receiver, /import performanceBus from '\.\/performance-bus\.js'/, 'VJ telemetry must consume the shared FPS source');
  assert.match(receiverPerformance, /performanceBus\.subscribe/, 'VJ telemetry must subscribe instead of measuring frames again');
  assert.match(receiverPerformance, /trackDisposer\(VJ_PERFORMANCE_OWNER/, 'the performance subscription must be disposable');
  [receiverPerformance, receiverBpm, receiverHook, receiverDebug].forEach((source) => {
    assert.doesNotMatch(source, /\bsetTimeout\s*\(|\bsetInterval\s*\(|\brequestAnimationFrame\s*\(/, 'VJ support loops must not escape receiver owners');
  });

  assert.match(matrix, /MATRIX_SCRAMBLE_OWNER/, 'matrix scramble work needs a dedicated owner');
  assert.match(matrix, /MATRIX_FAILSAFE_OWNER/, 'matrix failsafe work needs a dedicated owner');
  assert.match(matrix, /subs\.size === 0/, 'the shared dice ticker must sleep without subscribers');
  assert.doesNotMatch(matrix, /\bsetTimeout\s*\(|\bsetInterval\s*\(|\brequestAnimationFrame\s*\(/, 'matrix sequences must not leave native schedulers behind');

  assert.match(textEffects, /createEffectOwner/, 'each text-effect instance needs isolated scheduler ownership');
  assert.match(textEffects, /trackDisposer\(TEXT_LIFECYCLE_OWNER/, 'the text mutation observer must be lifecycle-owned');
  assert.doesNotMatch(textEffects, /\bsetTimeout\s*\(|\bsetInterval\s*\(|\brequestAnimationFrame\s*\(/, 'text effects must not leave native schedulers behind');

  assert.match(midiCatalog, /scheduleRafLoop\(this\.trailOwner/, 'MIDI trail rendering needs a capped owner-scoped loop');
  assert.match(midiCatalog, /destroy\(\)[\s\S]*triggerIntervals/, 'MIDI repeats need a complete teardown');
  assert.doesNotMatch(midiCatalog, /\bsetTimeout\s*\(|\bsetInterval\s*\(|\brequestAnimationFrame\s*\(/, 'MIDI actions must not leave native schedulers behind');

  assert.match(midiFeedback, /feedbackQueue\.length === 0/, 'MIDI feedback must sleep while its queue is empty');
  assert.match(midiFeedback, /disposeOwner\(this\.processorOwner\)/, 'MIDI feedback processing needs deterministic teardown');
  assert.doesNotMatch(midiFeedback, /\bsetTimeout\s*\(|\bsetInterval\s*\(|\brequestAnimationFrame\s*\(/, 'MIDI feedback must not leave native schedulers behind');
});

await check('interval manager never evicts admitted work by age or capacity', async () => {
  const originals = {
    window: globalThis.window,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    setInterval: globalThis.setInterval,
    clearInterval: globalThis.clearInterval
  };

  let nextId = 0;
  let intervalManager;

  globalThis.window = globalThis;
  globalThis.setTimeout = () => ({ type: 'timeout', id: ++nextId });
  globalThis.clearTimeout = () => {};
  globalThis.setInterval = () => ({ type: 'interval', id: ++nextId });
  globalThis.clearInterval = () => {};

  try {
    const module = await import(moduleUrl('js/interval-manager.js'));
    intervalManager = module.default;
    intervalManager.emergencyStop();

    const essential = intervalManager.createInterval(
      () => {},
      5000,
      'essential-cleanup',
      { category: 'system', essential: true }
    );
    const transientA = intervalManager.createInterval(() => {}, 1000, 'transient-a');
    const transientB = intervalManager.createInterval(() => {}, 1000, 'transient-b');

    intervalManager.cleanupOldestIntervals(2);

    assert.equal(intervalManager.intervals.has(essential.id), true, 'essential interval should survive oldest cleanup');
    assert.equal(intervalManager.intervals.has(transientA.id), true, 'oldest admitted interval must remain active');
    assert.equal(intervalManager.intervals.has(transientB.id), true, 'next admitted interval must remain active');
  } finally {
    intervalManager?.destroy();
    globalThis.window = originals.window;
    globalThis.setTimeout = originals.setTimeout;
    globalThis.clearTimeout = originals.clearTimeout;
    globalThis.setInterval = originals.setInterval;
    globalThis.clearInterval = originals.clearInterval;
  }

  const source = read('js/interval-manager.js');
  assert.doesNotMatch(source, /\bsetInterval\s*\(/, 'managed intervals must use the shared cadence driver');
  assert.doesNotMatch(source, /stale \(no execution/, 'background-tab throttling must not look like a stale owner');
});

await check('gsap registry cleanup uses stable ids and protected timers', () => {
  const registry = read('js/gsap-animation-registry.js');
  const createAnimation = sourceBetween(
    registry,
    'createAnimation(method, targets, vars',
    'Register an existing animation'
  );

  assert.match(
    createAnimation,
    /_3886_originalMethods/,
    'managed createAnimation must bypass patched GSAP methods to avoid double-registration id drift'
  );
  assert.doesNotMatch(
    createAnimation,
    /animation\s*=\s*gsap\.(to|from|fromTo|timeline)\(/,
    'managed createAnimation must not call patched gsap methods directly'
  );
  assert.match(
    createAnimation,
    /animation\._gsapRegistryId\s*=\s*animationId/,
    'managed animations must register with the same id used by cleanup callbacks'
  );
  assert.match(
    registry,
    /attachCompletionCleanup/,
    'auto-registered animations need completion cleanup even when not created through createAnimation'
  );
  assert.match(
    registry,
    /'gsap-periodic-cleanup'[\s\S]*essential:\s*true/,
    'GSAP periodic cleanup interval must be protected from oldest-interval cleanup'
  );
});

await check('subtle parallax does not create a gsap tween every frame', () => {
  const subtleEffects = read('js/subtle-effects.js');
  const addSubtleParallax = sourceBetween(
    subtleEffects,
    '    addSubtleParallax() {',
    'Easter eggs'
  );

  assert.doesNotMatch(
    addSubtleParallax,
    /requestAnimationFrame[\s\S]*gsap\.to|gsap\.to[\s\S]*requestAnimationFrame/,
    'RAF parallax loop must not create long-lived GSAP tweens every frame'
  );
  assert.match(
    addSubtleParallax,
    /quickSetter/,
    'RAF parallax should update existing transform state without registering tweens'
  );
  assert.match(
    subtleEffects,
    /scheduleRafLoop\(RUNTIME_OWNER[\s\S]*\{ maxFps \}/,
    'parallax RAF must be owner-scoped and frame-capped'
  );
  assert.match(subtleEffects, /performanceProfile === 'low'[\s\S]*\? 12/, 'LOW parallax should sample at a reduced cadence');
  assert.doesNotMatch(
    addSubtleParallax,
    /querySelector\(['"]\.bg['"]\)|setBg[XY]/,
    'logo parallax must not move the full-viewport background surface every frame'
  );
  assert.match(
    subtleEffects,
    /animationRuntime\.disposeOwner\(RUNTIME_OWNER\)/,
    'subtle effects must cancel all ambient work on destroy'
  );
  assert.doesNotMatch(
    subtleEffects,
    /\bsetTimeout\s*\(|\bsetInterval\s*\(|\brequestAnimationFrame\s*\(/,
    'ambient work must not escape its runtime owner'
  );
  assert.match(
    subtleEffects,
    /trackAnimation\(RUNTIME_OWNER/,
    'infinite GSAP ambient timelines must be owner-tracked'
  );
  assert.match(subtleEffects, /childLimit[\s\S]*:\s*8/, 'binary-rain DOM needs a profile-aware hard node cap');
  assert.match(subtleEffects, /}, 500\);/, 'binary-rain spawn checks must be frame-budget friendly');
});

await check('ambient effect modules cannot multiply across resets', () => {
  const files = ['js/subtle-effects.js', 'js/extended-animations.js'];

  files.forEach(file => {
    const source = read(file);
    assert.match(source, /animationRuntime\.disposeOwner\(RUNTIME_OWNER\)/, `${file} must dispose its complete owner scope`);
    assert.doesNotMatch(
      source,
      /\bsetTimeout\s*\(|\bsetInterval\s*\(|\brequestAnimationFrame\s*\(/,
      `${file} must not leave native recurring work behind`
    );
  });

  const extended = read('js/extended-animations.js');
  const subtle = read('js/subtle-effects.js');
  const enhancedLogo = read('js/enhanced-logo-animator.js');
  const centerpiece = read('js/centerpiece-logo.js');
  const chaosInit = read('js/chaos-init.js');
  assert.doesNotMatch(extended, /setTimeout\(retroWave/, 'disabled retro effects must not keep a no-op scheduler alive');
  assert.match(extended, /backgroundTween\?\.kill/, 'background pulse retriggers must replace their previous tween');
  const dynamicBackground = sourceBetween(extended, '    addDynamicBackgroundEffects() {', '    add80sRetroEffects() {');
  assert.match(dynamicBackground, /extended-background-wash/, 'extended background color motion needs a dedicated composited wash');
  assert.doesNotMatch(dynamicBackground, /filter\s*:/, 'extended ambient motion must not animate a full-viewport CSS filter');
  assert.match(subtle, /setPerformanceProfile/, 'subtle ambient tweens must respond to the central quality profile');
  assert.match(enhancedLogo, /if \(this\.isInitialized\) return;/, 'enhanced logo init must be idempotent');
  assert.match(enhancedLogo, /animationRuntime\.disposeOwner\(RUNTIME_OWNER\)/, 'enhanced logo teardown must own its timers, listeners, and ambient tweens');
  assert.doesNotMatch(enhancedLogo, /\bsetTimeout\s*\(/, 'enhanced logo recursion must not leave native timers behind');
  const logoCoreAnimations = sourceBetween(enhancedLogo, '    startCoreAnimations() {', '    updateBreathing() {');
  assert.doesNotMatch(logoCoreAnimations, /startMicroMovements\(\)/, 'canonical logo ambient motion must not start a competing recursive transform writer');
  assert.match(chaosInit, /enhancedLogoAnimator\.destroy\(\)/, 'initializer teardown must destroy the enhanced logo runtime');
  assert.match(centerpiece, /animationRuntime\.trackDisposer\(RUNTIME_OWNER, \(\) => observer\.disconnect\(\)\)/, 'centerpiece observer must be disconnected on teardown');
  assert.match(centerpiece, /removeEventListener\('animationPhase'/, 'centerpiece phase listener must be disposable');
  assert.match(centerpiece, /animationRuntime\.disposeOwner\(RUNTIME_OWNER\)/, 'centerpiece timers and animations need a single runtime owner');
  assert.doesNotMatch(centerpiece, /\bsetTimeout\s*\(|\bsetInterval\s*\(|\brequestAnimationFrame\s*\(/, 'centerpiece cycle must not leave native schedulers behind');
  const centerpieceInit = sourceBetween(centerpiece, '    init() {', '    setupInitialState() {');
  assert.doesNotMatch(centerpieceInit, /startAmbientAnimations\(\)/, 'centerpiece reactions must not duplicate the enhanced logo ambient transform stack');
  assert.match(chaosInit, /applyAmbientPerformanceProfile/, 'central quality must tune decorative ambient work');

  const random = read('js/random-animations.js');
  assert.match(random, /if \(this\.isRunning\) return;/, 'random animation init must be idempotent');
  assert.match(
    random,
    /this\.randomSequenceTimeout\s*=\s*this\.scheduleTimeout\(\(\) => this\.triggerRandomAnimation\(\), 2000\)/,
    'the initial random-animation delay must be cancellable'
  );
  assert.match(random, /animationRuntime\.disposeOwner\(RUNTIME_OWNER\)/, 'random animation teardown must dispose its full scheduler owner');
  assert.doesNotMatch(random, /\bsetTimeout\s*\(|\bsetInterval\s*\(|\brequestAnimationFrame\s*\(/, 'random effects must not leave native schedulers behind');
  assert.match(random, /dataset\.randomFx\s*=\s*'true'/, 'temporary random-effect nodes need explicit cleanup ownership');

  const background = read('js/background-animator.js');
  const beehive = read('js/beehive-background.js');
  const fxController = read('js/fx-controller.js');
  assert.match(background, /if \(this\.initialized\) return;/, 'background animator init must be idempotent');
  assert.match(background, /animationRuntime\.disposeOwner\(RUNTIME_OWNER\)/, 'background ambient work needs one disposable owner');
  assert.match(background, /setPerformanceProfile/, 'background ambient work must accept central quality changes');
  assert.match(background, /resolveSurfaceScale/, 'background zooms must respect the active raster budget');
  const backgroundProfile = sourceBetween(background, '    setPerformanceProfile(profile) {', '    destroy() {');
  assert.doesNotMatch(backgroundProfile, /pauseOwnerAnimations/, 'automatic LOW must not freeze the complete background animation owner');
  assert.doesNotMatch(background, /backdropFilter:\s*'[^']*(saturate|blur)/, 'background hue motion must avoid full-viewport backdrop filters');
  assert.doesNotMatch(background, /\bsetTimeout\s*\(|\bsetInterval\s*\(|\brequestAnimationFrame\s*\(/, 'background animator must not leave native schedulers behind');
  assert.match(beehive, /animationRuntime\.disposeOwner\(RUNTIME_OWNER\)/, 'beehive ambient work needs one disposable owner');
  assert.match(beehive, /setPerformanceProfile/, 'beehive ambient work must accept central quality changes');
  assert.doesNotMatch(beehive, /\bsetTimeout\s*\(|\bsetInterval\s*\(|\brequestAnimationFrame\s*\(/, 'beehive must not recursively spawn native timers');
  assert.doesNotMatch(beehive, /filter:\s*blur|background-position[^;]*animation/, 'beehive must avoid large repaint-bound blur and pan surfaces');
  assert.match(fxController, /DATA_STREAMS_OWNER/, 'data streams need an explicit runtime owner');
  assert.match(fxController, /dataset\.persistentFx\s*=\s*'true'/, 'persistent control-panel FX need an explicit phase-cleanup exemption');
  const phaseCleanup = sourceBetween(chaosInit, '    cleanupPhaseElements() {', '    startAnimationWatchdog() {');
  assert.match(phaseCleanup, /dataset\.persistentFx/, 'phase cleanup must preserve operator-enabled persistent FX');
  assert.match(fxController, /SPAWN_INTERVAL_MS\s*=\s*650/, 'data streams must retain a conservative spawn cadence');
  assert.match(fxController, /MAX_CHILDREN\s*=\s*18/, 'data streams need a strict DOM child budget');
  assert.doesNotMatch(fxController, /\bsetTimeout\s*\(|\bsetInterval\s*\(|\brequestAnimationFrame\s*\(/, 'FX controller scheduling must stay owner-scoped');
  assert.doesNotMatch(fxController, /Keep-alive to guard/, 'decorative overlays must not run redundant keep-alive polling');
  assert.match(fxController, /destroy\(\)[\s\S]*runtimeOwners\.forEach/, 'FX controller needs a complete runtime teardown');
  assert.match(chaosInit, /backgroundAnimator\?\.setPerformanceProfile/, 'central quality must control background ambient work');
  const introAnimations = read('js/intro-animations.js');
  const matrixMessages = read('js/matrix-messages.js');
  assert.match(introAnimations, /backgroundAnimator\.resolveSurfaceScale\(8\)/, 'intro zoom must not bypass the background raster budget');
  assert.match(matrixMessages, /backgroundAnimator\.resolveSurfaceScale\(3\.2\)/, 'matrix reactions must not bypass the background raster budget');
  assert.match(chaosInit, /beehiveBackground\?\.setPerformanceProfile/, 'central quality must control beehive ambient work');
  assert.doesNotMatch(chaosInit, /pauseOwnerAnimations\('centerpiece-logo'\)/, 'automatic LOW must not freeze centerpiece timelines');
  assert.match(chaosInit, /randomAnimations\?\.setPerformanceProfile/, 'central quality must tune random ambient density');
  assert.match(random, /getProfileScale/, 'random visuals should reduce density rather than disappear');
  assert.doesNotMatch(random, /performanceProfile\s*!==\s*'low'/, 'LOW must not suppress the entire random effect family');
});

await check('ambient canvases use bounded render budgets', () => {
  const textEffects = read('js/text-effects.js');
  const chaosInit = read('js/chaos-init.js');
  const animeEnhanced = read('js/anime-enhanced-effects.js');
  const ambientRenderer = read('js/ambient-canvas-renderer.js');
  const backgroundAnimator = read('js/background-animator.js');
  const visualEffects = read('js/visual-effects-complete.js');
  const fxController = read('js/fx-controller.js');

  const matrixRain = sourceBetween(textEffects, '    initializeMatrixRain() {', '    initializeTextBreaking() {');
  assert.match(matrixRain, /ambientCanvasRenderer\.setMatrixEnabled\(true/, 'matrix rain must use the shared renderer channel');
  assert.doesNotMatch(matrixRain, /requestAnimationFrame/, 'matrix rain must not leave a native RAF behind');
  assert.match(textEffects, /if \(this\.initialized\) return;/, 'text effects init must be idempotent');
  assert.match(chaosInit, /window\.textEffects\.destroy/, 'initializer teardown must destroy the live text-effects instance');

  assert.match(ambientRenderer, /canvas\.id = 'ambient-effects-canvas'/, 'ambient families need exactly one named fullscreen canvas');
  assert.match(ambientRenderer, /scale:\s*0\.375, fps:\s*6/, 'LOW ambient rendering must use a reduced raster and cadence');
  assert.match(ambientRenderer, /scale:\s*0\.5, fps:\s*8/, 'MEDIUM ambient rendering needs a bounded raster and cadence');
  assert.match(ambientRenderer, /scale:\s*0\.65, fps:\s*12/, 'HIGH ambient rendering must remain below full viewport resolution');
  assert.match(ambientRenderer, /matrix:\s*\{[\s\S]*cyberGrid:\s*\{[\s\S]*noise:\s*\{[\s\S]*scanlines:\s*\{[\s\S]*filmGrain:\s*\{[\s\S]*glitch:\s*\{/, 'ambient effect families must remain independently controllable');
  assert.match(ambientRenderer, /scheduleRafLoop\(LOOP_OWNER/, 'shared ambient work must have one owner-scoped RAF');
  assert.doesNotMatch(ambientRenderer, /\brequestAnimationFrame\s*\(/, 'shared ambient work must not leave a native RAF behind');

  assert.match(visualEffects, /setCyberGridEnabled\(true\)/, 'legacy cybergrid controls must route to the shared channel');
  assert.match(visualEffects, /setScanlinesEnabled\(true, 0\.14\)/, 'legacy scanline controls must route to the shared channel');
  assert.match(visualEffects, /setNoiseStrength\(0\.25\)/, 'legacy noise controls must route to the shared channel');
  assert.match(visualEffects, /setFilmGrainEnabled\(true, 0\.15\)/, 'film grain must reuse the shared noise surface');
  assert.doesNotMatch(visualEffects, /\brequestAnimationFrame\s*\(/, 'legacy visual effects must not retain an unmanaged grain RAF');
  assert.doesNotMatch(visualEffects, /createElement\(['"]canvas['"]\)/, 'legacy visual effects must not allocate duplicate ambient canvases');
  assert.match(fxController, /setFilmGrainEnabled\(enabled, 0\.15\)/, 'primary film-grain controls must reuse the shared ambient surface');
  assert.match(fxController, /setGlitchStrength\(glitchPass \? 0 : value\)/, 'software WebGL must retain a shared-canvas glitch fallback');
  const primaryFilmGrain = sourceBetween(fxController, '  applyFilmGrainEffect(enabled) {', '  // Aurora Effect');
  assert.doesNotMatch(primaryFilmGrain, /createElement|toDataURL|backgroundImage/, 'primary film grain must not allocate a duplicate texture or layer');

  const plasma = sourceBetween(animeEnhanced, '    createPlasmaField() {', '    // Create Geometric Mandala');
  assert.match(plasma, /scheduleRafLoop\(PLASMA_RUNTIME_OWNER/, 'plasma rendering must be owner-scoped');
  assert.match(plasma, /maxFps/, 'plasma must use an explicit render cadence');
  assert.doesNotMatch(plasma, /\bsetTimeout\s*\(|\bsetInterval\s*\(|\brequestAnimationFrame\s*\(/, 'plasma must not leave native schedulers behind');
  assert.doesNotMatch(plasma, /filter:\s*blur/, 'plasma must not force a fullscreen blur pass');
  assert.doesNotMatch(animeEnhanced, /this\.createPlasmaField\(\);\s*\/\/ Keep/, 'plasma must be lazy instead of allocating a dormant fullscreen canvas');
  const animeInitEffects = sourceBetween(animeEnhanced, '    initEffects() {', '    // Effect 1:');
  assert.doesNotMatch(animeInitEffects, /createFloatingParticles|createDataStreamEffect/, 'anime enhancements must not duplicate the primary particle or data-stream renderers');
  assert.match(animeEnhanced, /animationRuntime\.disposeOwner\(RUNTIME_OWNER\)/, 'anime enhancements need an owner-scoped lifecycle');
  assert.doesNotMatch(animeEnhanced, /\bsetTimeout\s*\(|\bsetInterval\s*\(|\brequestAnimationFrame\s*\(/, 'anime enhancements must not leave native schedulers behind');

  const colorEnhancements = sourceBetween(chaosInit, '    addSubtleColorVariations() {', '// Auto-initialize');
  assert.doesNotMatch(
    colorEnhancements,
    /gsap\.to\(gridNodes/,
    'near-invisible cyber grid must not consume a continuous compositor filter animation'
  );
  assert.match(chaosInit, /ambientCanvasRenderer\.setPerformanceProfile/, 'LOW needs a shared compositor-cost policy in addition to density controls');
  assert.match(backgroundAnimator, /rotationAnimation\?\.pause/, 'LOW must not rotate an oversized viewport surface');
  assert.match(backgroundAnimator, /surfaceProps\.rotation\s*=\s*0/, 'LOW background bounds must be reset before profile application');
  assert.match(chaosInit, /Scanlines routed through the shared ambient texture/, 'baseline scanlines must share the ambient texture instead of adding a fullscreen layer');
  const scanlines = sourceBetween(chaosInit, '    addScanlines() {', '    addVHSDistortion() {');
  assert.doesNotMatch(scanlines, /createElement|safeCreateElement|gsap\.to/, 'baseline scanlines must not allocate or animate a standalone surface');

  const lottieAnimations = read('js/lottie-animations.js');
  assert.match(lottieAnimations, /getWrapperFilter/, 'Lottie compositor filters must follow the active quality profile');
  assert.match(lottieAnimations, /if \(lowCost\) return 'none'/, 'LOW Lottie must avoid large drop-shadow compositor passes');

  const enhancedLogo = read('js/enhanced-logo-animator.js');
  const glowLayers = sourceBetween(enhancedLogo, '    createGlowLayers() {', '    setupMouseTracking() {');
  assert.doesNotMatch(glowLayers, /filter:\s*blur/, 'logo glow depth should use radial gradients instead of stacked blur passes');
});

await check('performance profile manager owns stable quality targets', async () => {
  const originals = {
    window: globalThis.window,
    CustomEvent: globalThis.CustomEvent,
    localStorage: globalThis.localStorage
  };

  const events = [];
  const engine = {
    particleCount: 500,
    dprs: [],
    qualities: [],
    setPixelRatio(value) {
      this.dprs.push(value);
    },
    adjustPostProcessing(quality) {
      this.qualities.push(quality);
    }
  };

  globalThis.CustomEvent = class CustomEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail;
    }
  };
  globalThis.localStorage = {
    setItem() {},
    getItem() { return null; },
    removeItem() {}
  };
  globalThis.window = {
    dispatchEvent(event) {
      events.push(event);
      return true;
    },
    fxController: null
  };

  try {
    const { PerformanceProfileManager } = await import(moduleUrl('js/performance/profile-manager.js'));
    const manager = new PerformanceProfileManager({ engine });
    manager._basePixelRatio = 1;

    manager.applyProfile('medium', { reason: 'test' });
    engine.particleCount = 350;
    manager.applyProfile('high', { reason: 'test' });

    const particleCounts = events
      .filter(event => event.type === 'adjustParticles')
      .map(event => event.detail.count);

    assert.deepEqual(particleCounts, [350, 500], 'particle targets should be derived from the initial base count');
    assert.deepEqual(engine.qualities, ['medium', 'high']);

    let now = 0;
    const timedManager = new PerformanceProfileManager({ engine, now: () => now });
    timedManager._basePixelRatio = 1;
    timedManager.applyProfile('high', { reason: 'timing-test' });
    timedManager._onMetric(40);
    now = 2999;
    timedManager._onMetric(40);
    assert.equal(timedManager.currentProfile, 'high', 'quality must not demote before the wall-clock dwell expires');
    now = 3000;
    timedManager._onMetric(40);
    assert.equal(timedManager.currentProfile, 'medium', 'quality should demote after a sustained three-second deficit');
  } finally {
    globalThis.window = originals.window;
    globalThis.CustomEvent = originals.CustomEvent;
    globalThis.localStorage = originals.localStorage;
  }

  const profileManager = read('js/performance/profile-manager.js');
  assert.doesNotMatch(profileManager, /fx\.toggleEffect\(/, 'automatic profiles must not switch operator-owned effect families off');
  assert.match(profileManager, /performance:visual-quality/, 'automatic profiles should publish quality strengths instead of binary effect state');
  const chaosEngine = read('js/chaos-engine.js');
  const performanceManager = read('js/performance-manager.js');
  const performanceLadder = read('js/performance-degradation-ladder.js');
  const chaosInit = read('js/chaos-init.js');

  assert.match(
    profileManager,
    /_baseParticleCount/,
    'profile manager must keep a stable particle-count baseline'
  );
  assert.match(profileManager, /seed-software-renderer/, 'software renderers must seed the low safety profile');
  assert.match(profileManager, /SOFTWARE_PARTICLE_FLOOR\s*=\s*64/, 'LOW must be able to reduce software-rendered particle density below the hardware floor');
  assert.match(profileManager, /animationFps:\s*24/, 'LOW should reduce animation sampling cadence without changing timeline duration');
  assert.match(profileManager, /gsap\.ticker\.fps\(cfg\.animationFps\)/, 'central quality should own GSAP sampling cadence');
  assert.match(chaosEngine, /setRenderFpsCap/, 'WebGL rendering needs an explicit profile-owned cadence');
  assert.match(chaosEngine, /1000 \/ this\.renderFpsCap/, 'the WebGL loop should skip expensive frames while retaining wall-clock time');
  assert.doesNotMatch(chaosEngine, /getElapsedTime\(\)[\s\S]{0,80}getDelta\(\)/, 'Three.Clock must not be advanced twice in one render frame');
  assert.match(profileManager, /softwareRenderer[\s\S]*\? 0\.5/, 'profile changes must preserve the software-renderer DPR ceiling');
  assert.match(profileManager, /this\._lockProfile[\s\S]*softwareRenderer[\s\S]*applyProfile\('low'/, 'only an explicit operator lock may override software-renderer safety');
  assert.match(
    profileManager,
    /_isSustained/,
    'profile hysteresis must be based on elapsed wall-clock time rather than event count'
  );
  assert.doesNotMatch(
    profileManager,
    /_demoteStreak|_promoteStreak/,
    'high-frequency FPS events must not accelerate quality transitions'
  );
  assert.match(
    chaosInit,
    /__3886_PROFILE_MANAGER_ENABLED\s*=\s*true/,
    'chaos init must declare central profile ownership before legacy managers start'
  );
  assert.match(
    chaosInit,
    /this\.performanceMode === 'auto'[\s\S]*window\.__3886_PROFILE_MANAGER_ENABLED !== true/,
    'initializer FPS fallback must not override the central profile manager'
  );
  const fpsPublisher = sourceBetween(
    chaosInit,
    '    updatePredictiveAlerting(currentFPS, timestamp) {',
    '    async initMonitoringDashboard('
  );
  assert.match(
    fpsPublisher,
    /dispatchEvent\(fpsEvent\)[\s\S]*!this\.predictiveAlertingEnabled/,
    'core FPS events must be published before optional predictive-alerting checks'
  );
  assert.match(
    chaosEngine,
    /__3886_PROFILE_MANAGER_ENABLED[\s\S]*return/,
    'legacy chaos-engine adaptive loop must not run when profile manager owns quality'
  );
  assert.match(
    performanceManager,
    /profileManagerOwnsQuality/,
    'legacy performance manager must defer quality changes to the profile manager'
  );
  assert.match(
    performanceLadder,
    /__3886_PROFILE_MANAGER_ENABLED === true[\s\S]*return;/,
    'legacy degradation ladder must defer quality changes to the profile manager'
  );
});

if (failures.length > 0) {
  console.error(`\n${failures.length} runtime guardrail check(s) failed.`);
  process.exitCode = 1;
} else {
  console.log('\nAll runtime guardrails passed.');
}
