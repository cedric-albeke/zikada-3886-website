import vjReceiver from './vj-receiver.js';

const DEFAULT_ZENTRALE_WS_URL = 'ws://127.0.0.1:8788/api/bus/ws';
const MAX_QUEUE = 50;
const HEARTBEAT_MS = 8000;

function normalizeLegacyMessage(frame) {
  if (frame?.legacy?.type) return frame.legacy;
  if (frame?.type && !String(frame.type).startsWith('bus.')) return frame;
  return null;
}

class ZentraleWsBridge {
  constructor(receiver) {
    this.receiver = receiver;
    this.url = window.localStorage?.getItem('ZENTRALE_BUS_WS') || DEFAULT_ZENTRALE_WS_URL;
    this.ws = null;
    this.queue = [];
    this.reconnectDelay = 1000;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.connected = false;
    this.rendererId = window.localStorage?.getItem('ZENTRALE_RENDERER_ID') || `zikada-${Date.now().toString(36)}`;
    window.localStorage?.setItem('ZENTRALE_RENDERER_ID', this.rendererId);
    this.patchReceiverResponses();
    this.connect();
  }

  connect() {
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
      console.warn('[ZENTRALE] WebSocket bridge error');
    });
  }

  handleOpen() {
    this.connected = true;
    this.reconnectDelay = 1000;
    this.sendClientFrame('bus.client');
    this.startHeartbeat();
    this.flushQueue();
    console.log('[ZENTRALE] WebSocket bridge connected');
  }

  handleClose() {
    this.connected = false;
    window.clearInterval(this.heartbeatTimer);
    window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = window.setTimeout(() => this.connect(), this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 1.6, 10000);
  }

  sendClientFrame(type = 'bus.client') {
    this.send({
      type,
      client: 'zikada-renderer',
      role: window.localStorage?.getItem('ZENTRALE_RENDERER_ROLE') || 'program',
      renderer_id: this.rendererId,
      label: document.title || 'ZIKADA Renderer',
      url: window.location.href,
    });
  }

  startHeartbeat() {
    window.clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = window.setInterval(() => this.sendClientFrame('bus.heartbeat'), HEARTBEAT_MS);
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
