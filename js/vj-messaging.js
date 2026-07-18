/**
 * ============================================
 * ZIKADA 3886 - VJ MESSAGING SYSTEM
 * ============================================
 * 
 * Unified communication between control panel and main page
 * Handles BroadcastChannel and postMessage with fallback support
 */
import animationRuntime from './runtime/animation-runtime.js';

const RUNTIME_OWNER = 'vj-messaging';

const CHANNEL_NAME = 'zikada-vj';
const MESSAGE_KIND = 'ZIKADA_CONTROL';

// Message type constants
export const MESSAGE_TYPES = {
    EMERGENCY_KILL: 'EMERGENCY_KILL',
    SYSTEM_RESET: 'SYSTEM_RESET', 
    SYSTEM_RELOAD: 'SYSTEM_RELOAD',
    SET_PERFORMANCE_MODE: 'SET_PERFORMANCE_MODE',
    MATRIX_MESSAGE_SHOW: 'MATRIX_MESSAGE_SHOW',
    MATRIX_MESSAGE_HIDE: 'MATRIX_MESSAGE_HIDE',
    PING: 'PING',
    PONG: 'PONG'
};

class VJMessaging {
    constructor() {
        this.bc = null;
        this.messageHandlers = new Map();
        this.isControlPanel = window.location.pathname.includes('control-panel');
        this.connectionTimeout = null;
        this.handshakeInterval = null;
        this.handshakeAttempts = 0;
        this.maxHandshakeAttempts = 10;
        this.connected = false;
        
        this.initializeBroadcastChannel();
        this.setupWindowMessageListener();
        
        console.log(`🎛️ VJ Messaging initialized (${this.isControlPanel ? 'Control Panel' : 'Main Page'})`);
        
        // Control panel initiates handshake
        if (this.isControlPanel) {
            this.initiateHandshake();
        }
    }
    
    initializeBroadcastChannel() {
        try {
            this.bc = new BroadcastChannel(CHANNEL_NAME);
            this.bc.addEventListener('message', (event) => {
                this.handleMessage(event.data);
            });
            console.log('📡 BroadcastChannel initialized');
        } catch (error) {
            console.warn('BroadcastChannel not supported, using postMessage fallback:', error);
        }
    }
    
    setupWindowMessageListener() {
        this.windowMessageHandler = (event) => {
            // Only handle messages from same origin
            if (event.origin !== window.location.origin) return;
            
            const data = event.data;
            if (data && data.kind === MESSAGE_KIND) {
                this.handleMessage(data);
            }
        };
        window.addEventListener('message', this.windowMessageHandler);
        animationRuntime.trackDisposer(RUNTIME_OWNER, () => {
            window.removeEventListener('message', this.windowMessageHandler);
        });
    }
    
    initiateHandshake() {
        // Listen for pong response
        this.on(MESSAGE_TYPES.PONG, () => {
            this.connected = true;
            if (this.connectionTimeout) {
                this.connectionTimeout.clear();
                this.connectionTimeout = null;
            }
            if (this.handshakeInterval) {
                this.handshakeInterval.clear();
                this.handshakeInterval = null;
            }
            this.onConnectionChange(true);
            console.log('✅ Connection established with main page');
        });

        const sendHandshakePing = () => {
            if (this.connected) return;
            this.handshakeAttempts++;
            this.sendMessage(MESSAGE_TYPES.PING);

            if (this.handshakeAttempts >= this.maxHandshakeAttempts) {
                if (this.handshakeInterval) {
                    this.handshakeInterval.clear();
                    this.handshakeInterval = null;
                }
                this.connected = false;
                this.onConnectionChange(false);
                console.warn('⚠️ Connection handshake pending - main page not responding');
            }
        };

        sendHandshakePing();
        this.handshakeInterval = animationRuntime.scheduleInterval(
            RUNTIME_OWNER,
            sendHandshakePing,
            1000
        );
    }
    
    sendMessage(type, payload = {}) {
        const message = {
            kind: MESSAGE_KIND,
            type,
            payload,
            timestamp: Date.now(),
            source: this.isControlPanel ? 'control-panel' : 'main-page'
        };
        
        // Send via BroadcastChannel if available
        if (this.bc) {
            try {
                this.bc.postMessage(message);
            } catch (error) {
                console.warn('BroadcastChannel send failed:', error);
            }
        }
        
        // Send via postMessage as fallback
        try {
            if (window.opener && !window.opener.closed) {
                window.opener.postMessage(message, window.location.origin);
            }
            if (window.parent && window.parent !== window) {
                window.parent.postMessage(message, window.location.origin);
            }
        } catch (error) {
            console.warn('postMessage fallback failed:', error);
        }
        
        console.log(`📤 Sent: ${type}`, payload);
    }
    
    on(type, handler) {
        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, new Set());
        }
        this.messageHandlers.get(type).add(handler);
    }
    
    off(type, handler) {
        if (this.messageHandlers.has(type)) {
            this.messageHandlers.get(type).delete(handler);
        }
    }
    
    handleMessage(data) {
        if (!data || data.kind !== MESSAGE_KIND) return;
        
        const { type, payload, source, timestamp } = data;
        
        // Ignore messages from same source type to prevent loops
        const currentSource = this.isControlPanel ? 'control-panel' : 'main-page';
        if (source === currentSource) return;
        
        console.log(`📥 Received: ${type}`, payload);
        
        // Handle ping/pong automatically
        if (type === MESSAGE_TYPES.PING && !this.isControlPanel) {
            this.sendMessage(MESSAGE_TYPES.PONG);
            return;
        }
        
        // Call registered handlers
        if (this.messageHandlers.has(type)) {
            this.messageHandlers.get(type).forEach(handler => {
                try {
                    handler(payload, { type, source, timestamp });
                } catch (error) {
                    console.error(`Error in message handler for ${type}:`, error);
                }
            });
        }
    }
    
    onConnectionChange(connected) {
        // Override this method to handle connection status changes
        // Used by control panel to enable/disable buttons
    }
    
    // Convenience methods for common messages
    emergencyKill() {
        this.sendMessage(MESSAGE_TYPES.EMERGENCY_KILL);
    }
    
    systemReset() {
        this.sendMessage(MESSAGE_TYPES.SYSTEM_RESET);
    }
    
    systemReload() {
        this.sendMessage(MESSAGE_TYPES.SYSTEM_RELOAD);
    }
    
    setPerformanceMode(mode) {
        this.sendMessage(MESSAGE_TYPES.SET_PERFORMANCE_MODE, { mode });
    }
    
    showMatrixMessage(text) {
        this.sendMessage(MESSAGE_TYPES.MATRIX_MESSAGE_SHOW, { text });
    }
    
    hideMatrixMessage() {
        this.sendMessage(MESSAGE_TYPES.MATRIX_MESSAGE_HIDE);
    }
    
    destroy() {
        if (this.bc) {
            this.bc.close();
        }
        if (this.connectionTimeout) {
            this.connectionTimeout.clear();
        }
        if (this.handshakeInterval) {
            this.handshakeInterval.clear();
        }
        animationRuntime.disposeOwner(RUNTIME_OWNER);
        this.messageHandlers.clear();
    }
}

// Global singleton instance
export const vjMessaging = new VJMessaging();

// Export convenience functions for backward compatibility
export const sendControl = (type, payload) => vjMessaging.sendMessage(type, payload);

export default vjMessaging;
