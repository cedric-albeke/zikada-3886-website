import vjReceiver from './vj-receiver.js';
import animationRuntime from './runtime/animation-runtime.js';

const DEFAULT_ZENTRALE_WS_URL = 'ws://127.0.0.1:8788/api/bus/ws';
const MAX_QUEUE = 50;
const HEARTBEAT_MS = 8000;
const RUNTIME_OWNER = 'zentrale-ws-bridge';

function translateTypedMessage(typed) {
  if (!typed || !typed.type) return null;
  switch (typed.type) {
    case 'SET_RENDERER':
      return { type: 'renderer_select', role: typed.payload?.role };
    case 'TRIGGER_MACRO':
      return { type: 'trigger_macro', macro: typed.payload?.macro };
    case 'TRIGGER_EFFECT':
      return { type: 'trigger_effect', effect: typed.payload?.effect, settings: typed.payload?.settings || {} };
    case 'MATRIX_MESSAGE_HIDE':
      return { type: 'matrix_message', message: '' };
    case 'EMERGENCY_STOP':
      return { type: 'emergency_stop' };
    default:
      return null;
  }
}

function normalizeLegacyMessage(frame) {
  if (frame?.legacy?.type) return frame.legacy;
  if (frame?.typed?.type) {
    const legacy = translateTypedMessage(frame.typed);
    if (legacy) return legacy;
  }
  if (frame?.type && !String(frame.type).startsWith('bus.')) return frame;
  return null;
}

class ZentraleWsBridge {
  constructor(receiver) {
    this.receiver = receiver;
    const configuredUrl = window.localStorage?.getItem('ZENTRALE_BUS_WS');
    const queryEnabled = new URLSearchParams(window.location.search).get('zentrale') === '1';
    const storedEnabled = window.localStorage?.getItem('ZENTRALE_BUS_ENABLED') === '1';
    this.enabled = Boolean(configuredUrl || queryEnabled || storedEnabled);
    this.url = configuredUrl || DEFAULT_ZENTRALE_WS_URL;
    this.ws = null;
    this.queue = [];
    this.reconnectDelay = 1000;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.connected = false;
    this.connectionErrorAnnounced = false;
    this.destroyed = false;
    this.rendererId = window.localStorage?.getItem('ZENTRALE_RENDERER_ID') || `zikada-${Date.now().toString(36)}`;
    window.localStorage?.setItem('ZENTRALE_RENDERER_ID', this.rendererId);
    this.patchReceiverResponses();
    if (this.enabled) {
      this.connect();
    } else {
      console.debug('[ZENTRALE] Optional local bridge disabled (set ZENTRALE_BUS_ENABLED=1 or use ?zentrale=1)');
    }
  }

  connect() {
    if (this.destroyed) return;
    if (!('WebSocket' in window)) {
      console.warn('[ZENTRALE] WebSocket unavailable');
      return;
    }
    if (this.ws && [WebSocket.CONNECTING, WebSocket.OPEN].includes(this.ws.readyState)) return;

    this.ws = new WebSocket(this.url);
    this.ws.addEventListener('open', () => this.handleOpen());
    this.ws.addEventListener('message', (event) => this.handleMessage(event));
    this.ws.addEventListener('close', () => this.handleClose());
    this.ws.addEventListener('error', () => {
      if (!this.connectionErrorAnnounced) {
        console.debug('[ZENTRALE] Optional local bridge unavailable; retrying in background');
        this.connectionErrorAnnounced = true;
      }
    });
  }

  handleOpen() {
    this.connected = true;
    this.connectionErrorAnnounced = false;
    this.reconnectDelay = 1000;
    this.sendClientFrame('bus.client');
    this.startHeartbeat();
    this.flushQueue();
    console.log('[ZENTRALE] WebSocket bridge connected');
  }

  handleClose() {
    this.connected = false;
    this.heartbeatTimer?.clear();
    this.reconnectTimer?.clear();
    this.heartbeatTimer = null;
    if (this.destroyed) return;
    this.reconnectTimer = animationRuntime.scheduleTimeout(
      RUNTIME_OWNER,
      () => {
        this.reconnectTimer = null;
        this.connect();
      },
      this.reconnectDelay
    );
    this.reconnectDelay = Math.min(this.reconnectDelay * 1.6, 10000);
  }

  sendClientFrame(type = 'bus.client', telemetry = null) {
    const frame = {
      type,
      client: 'zikada-renderer',
      role: window.localStorage?.getItem('ZENTRALE_RENDERER_ROLE') || 'program',
      renderer_id: this.rendererId,
      label: document.title || 'ZIKADA Renderer',
      url: window.location.href,
    };
    if (telemetry && Object.keys(telemetry).length > 0) {
      frame.telemetry = telemetry;
    }
    this.send(frame);
  }

  startHeartbeat() {
    this.heartbeatTimer?.clear();
    this.heartbeatTimer = animationRuntime.scheduleInterval(RUNTIME_OWNER, () => {
      const telemetry = {};
      const fps = window.chaosEngine?.fps ?? window.animationManager?.fps;
      if (fps !== undefined) telemetry.fps = fps;
      if (window.chaosEngine?.scene !== undefined) telemetry.scene = window.chaosEngine.scene;
      if (window.chaosEngine?.performanceMode !== undefined) telemetry.performance_mode = window.chaosEngine.performanceMode;
      this.sendClientFrame('bus.heartbeat', telemetry);
    }, HEARTBEAT_MS);
  }

  destroy() {
    this.destroyed = true;
    animationRuntime.disposeOwner(RUNTIME_OWNER);
    try { this.ws?.close(); } catch (_) {}
    this.ws = null;
    this.connected = false;
  }

  handleMessage(event) {
    let frame = null;
    try {
      frame = JSON.parse(event.data);
    } catch (error) {
      console.warn('[ZENTRALE] Invalid bus frame', error);
      return;
    }

    const legacy = normalizeLegacyMessage(frame);
    if (!legacy || legacy.source === 'zikada-renderer') return;

    if (frame.target && frame.target.type !== 'all') {
      const localRole = window.localStorage?.getItem('ZENTRALE_RENDERER_ROLE') || 'program';
      if (frame.target.type !== localRole) {
        console.log(`[ZENTRALE] Dropping message for target ${frame.target.type}, local role is ${localRole}`);
        return;
      }
    }

    console.log('[ZENTRALE] Bus command received:', legacy.type);
    if (legacy.type === 'ping') {
      this.send({
        type: 'bus.event',
        source: 'zikada-renderer',
        legacy: {
          type: 'pong',
          source: 'zikada-renderer',
          timestamp: Date.now(),
        },
      });
    }
    if (typeof this.receiver?.handleMessage === 'function') {
      this.receiver.handleMessage(legacy);
    }
  }

  patchReceiverResponses() {
    if (!this.receiver || this.receiver.__zentraleWsPatched || typeof this.receiver.sendMessage !== 'function') return;
    const originalSendMessage = this.receiver.sendMessage.bind(this.receiver);
    this.receiver.sendMessage = (message) => {
      originalSendMessage(message);
      this.send({
        type: 'bus.event',
        source: 'zikada-renderer',
        legacy: {
          ...message,
          source: 'zikada-renderer',
        },
      });
    };
    this.receiver.__zentraleWsPatched = true;
  }

  send(message) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.queue.push(message);
      this.queue = this.queue.slice(-MAX_QUEUE);
      return;
    }
    this.ws.send(JSON.stringify(message));
  }

  flushQueue() {
    const queue = this.queue;
    this.queue = [];
    for (const message of queue) this.send(message);
  }
}

const zentraleWsBridge = new ZentraleWsBridge(window.vjReceiver || vjReceiver);
window.zentraleWsBridge = zentraleWsBridge;

export default zentraleWsBridge;
