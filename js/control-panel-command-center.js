import animationRuntime from './runtime/animation-runtime.js';

const OWNER = 'control-panel-command-center';

class CommandCenterController {
  constructor() {
    this.abortController = new AbortController();
    this.destroyed = false;
    this.performanceHistory = [];
    this.init();
  }

  init() {
    this.setupDrawers();
    this.setupUtilityDrawer();
    this.setupBpmBridge();
    this.setupAnimationCommands();
    this.setupLayerTools();
    this.setupMIDI();
    this.updateTelemetry();
    animationRuntime.scheduleInterval(OWNER, () => this.updateTelemetry(), 1000);
    this.listen(window, 'pagehide', () => this.destroy(), { once: true });
    this.listen(window, 'beforeunload', () => this.destroy(), { once: true });
  }

  listen(target, type, handler, options = {}) {
    target?.addEventListener?.(type, handler, {
      ...options,
      signal: this.abortController.signal
    });
  }

  send(message) {
    const payload = { ...message, timestamp: Date.now() };
    if (window.VJControlPanel?.sendMessage) {
      window.VJControlPanel.sendMessage(payload);
      return;
    }
    window.vjMessaging?.sendMessage?.(payload);
  }

  setupDrawers() {
    document.querySelectorAll('[data-drawer-toggle]').forEach((button) => {
      this.listen(button, 'click', () => {
        const drawer = document.getElementById(button.dataset.drawerToggle);
        if (!drawer) return;
        const willOpen = drawer.hidden;
        document.querySelectorAll('.panel-drawer:not([hidden])').forEach((openDrawer) => {
          if (openDrawer !== drawer) openDrawer.hidden = true;
        });
        document.querySelectorAll('[data-drawer-toggle][aria-expanded="true"]').forEach((openButton) => {
          if (openButton !== button) openButton.setAttribute('aria-expanded', 'false');
        });
        drawer.hidden = !willOpen;
        button.setAttribute('aria-expanded', String(willOpen));
      });
    });

    this.listen(document, 'keydown', (event) => {
      if (event.key !== 'Escape') return;
      const openDrawers = document.querySelectorAll('.panel-drawer:not([hidden]), .utility-drawer:not([hidden])');
      if (!openDrawers.length) return;
      event.stopImmediatePropagation();
      openDrawers.forEach((drawer) => { drawer.hidden = true; });
      document.querySelectorAll('[aria-expanded="true"]').forEach((button) => button.setAttribute('aria-expanded', 'false'));
    }, { capture: true });
  }

  setupUtilityDrawer() {
    const toggle = document.getElementById('utilityToggle');
    const close = document.getElementById('utilityClose');
    const drawer = document.getElementById('utilityDrawer');
    if (!toggle || !drawer) return;

    const setOpen = (open) => {
      drawer.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
    };
    this.listen(toggle, 'click', () => setOpen(drawer.hidden));
    this.listen(close, 'click', () => setOpen(false));
  }

  setupBpmBridge() {
    const slider = document.getElementById('bpmSlider');
    const input = document.getElementById('bpmInput');
    const output = document.getElementById('bpmValue');
    if (!slider || !input) return;

    const sync = (value, commit = false) => {
      const bpm = Math.max(20, Math.min(300, Number(value) || 120));
      slider.value = String(bpm);
      input.value = String(bpm);
      if (output) output.textContent = bpm.toFixed(1);
      if (commit) input.dispatchEvent(new Event('change', { bubbles: true }));
    };
    this.listen(slider, 'input', () => sync(slider.value));
    this.listen(slider, 'change', () => sync(slider.value, true));
    this.listen(input, 'change', () => sync(input.value));
  }

  setupAnimationCommands() {
    const status = document.getElementById('animeSystemStatus');
    const toggle = document.getElementById('animeToggle');

    const setStatus = (label, enabled) => {
      if (status) status.textContent = label;
      if (toggle) {
        toggle.dataset.state = enabled ? 'enabled' : 'disabled';
        toggle.classList.toggle('active', enabled);
        toggle.setAttribute('aria-pressed', String(enabled));
        toggle.setAttribute('aria-label', enabled ? 'Disable animation system' : 'Enable animation system');
        toggle.querySelector('.toggle-status')?.replaceChildren(enabled ? 'ON' : 'OFF');
      }
    };

    document.querySelectorAll('[data-animation-command]').forEach((button) => {
      this.listen(button, 'click', () => {
        const command = button.dataset.animationCommand;
        const commands = {
          start: ['anime_enable', 'Enabled', true],
          stop: ['anime_kill_all', 'Stopped', false],
          pause: ['anime_pause_all', 'Paused', false],
          reset: ['anime_reset_all', 'Enabled', true],
          clear: ['anime_clear_queue', 'Queue clear', true],
          safe: ['anime_safe_mode', 'Safe mode', true]
        };
        const action = commands[command];
        if (!action) return;
        this.send({ type: action[0] });
        setStatus(action[1], action[2]);
        button.classList.add('active');
        animationRuntime.scheduleTimeout(OWNER, () => button.classList.remove('active'), 320);
      });
    });

    if (toggle) {
      const savedEnabled = localStorage.getItem('3886_anime_enabled') === '1';
      setStatus(savedEnabled ? 'Enabled' : 'Disabled', savedEnabled);
      this.listen(toggle, 'click', () => {
        const enabled = toggle.dataset.state !== 'enabled';
        if (enabled) localStorage.setItem('3886_anime_enabled', '1');
        else localStorage.removeItem('3886_anime_enabled');
        this.send({ type: enabled ? 'anime_enable' : 'anime_disable' });
        setStatus(enabled ? 'Enabled' : 'Disabled', enabled);
      });
    }
  }

  setupLayerTools() {
    const blends = ['Normal', 'Blend', 'Add', 'Screen', 'Multiply'];
    document.querySelectorAll('.blend-btn').forEach((button) => {
      this.listen(button, 'click', () => {
        const row = button.closest('.layer-row');
        const layer = row?.querySelector('.layer-toggle-btn')?.dataset.layer;
        const next = blends[(blends.indexOf(button.textContent.trim()) + 1) % blends.length];
        button.textContent = next;
        if (layer) this.send({ type: 'layer_blend', layer, blend: next.toLowerCase() });
      });
    });

    document.querySelectorAll('.layer-fx-btn, .layer-mask-btn').forEach((button) => {
      this.listen(button, 'click', () => {
        const active = button.getAttribute('aria-pressed') !== 'true';
        button.setAttribute('aria-pressed', String(active));
        button.classList.toggle('active', active);
        const row = button.closest('.layer-row');
        const layer = row?.querySelector('.layer-toggle-btn')?.dataset.layer;
        if (layer) this.send({
          type: button.classList.contains('layer-fx-btn') ? 'layer_fx' : 'layer_mask',
          layer,
          enabled: active
        });
      });
    });

    document.querySelectorAll('.layer-toggle-btn').forEach((button) => {
      this.listen(button, 'click', () => {
        button.textContent = button.dataset.state === 'on' ? '◉' : '○';
      });
    });
  }

  setupMIDI() {
    try {
      localStorage.setItem('3886_midi_enabled', '1');
      if (window.MIDIController && !window.midiController) {
        window.midiController = new window.MIDIController({
          mode: 'broadcast',
          debug: localStorage.getItem('3886_midi_debug') === '1'
        });
      }
    } catch (error) {
      console.warn('MIDI initialization unavailable:', error);
    }
  }

  updateTelemetry() {
    if (this.destroyed) return;
    const now = new Date();
    const fps = Number.parseFloat(document.getElementById('fpsCounter')?.textContent) || 0;
    const activeFx = Number.parseInt(document.getElementById('activeEffects')?.textContent, 10) || 0;
    const framePressure = fps > 0 ? Math.max(0, Math.min(1, (60 - fps) / 45)) : 0;
    const cpu = Math.round(Math.min(99, 11 + activeFx * 2.2 + framePressure * 58));
    const gpu = Math.round(Math.min(99, 18 + activeFx * 3.4 + framePressure * 62));
    const temperature = Math.round(Math.min(92, 42 + gpu * .28));

    this.setText('telemetryResolution', `${window.innerWidth}×${window.innerHeight}`);
    this.setText('telemetryTime', now.toLocaleTimeString('en-GB', { hour12: false }));
    this.setText('telemetryDate', now.toISOString().slice(0, 10));
    this.setText('telemetryCpu', `${cpu}%`);
    this.setText('telemetryGpu', `${gpu}%`);
    this.setText('telemetryTemp', `${temperature}°C`);
    this.setBar('telemetryCpuBar', cpu);
    this.setBar('telemetryGpuBar', gpu);
    this.setBar('telemetryTempBar', temperature);
  }

  setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  setBar(id, value) {
    const element = document.getElementById(id);
    if (element) element.style.width = `${Math.max(0, Math.min(100, value))}%`;
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.abortController.abort();
    animationRuntime.disposeOwner(OWNER);
  }
}

if (!window.commandCenterController) {
  window.commandCenterController = new CommandCenterController();
}

export default window.commandCenterController;
