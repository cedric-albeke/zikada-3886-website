// ZIKADA 3886 MIDI Controller
// Core MIDI functionality with Web MIDI API integration
// Handles device management, mapping, routing, and feedback

class MIDIController {
    constructor(options = {}) {
        this.mode = options.mode || 'auto'; // 'direct', 'broadcast', 'auto'
        this.debugMode = options.debug || false;
        this.isActive = false;
        this.midiAccess = null;
        
        // Device tracking
        this.inputs = new Map();
        this.outputs = new Map();
        this.deviceActivity = new Map(); // Track last activity per device
        
        // Mapping and routing
        this.mappings = new Map();
        this.pendingLearnTarget = null;
        this.smoothingBuffers = new Map(); // For CC smoothing
        
        // MIDI clock tracking
        this.midiClock = {
            enabled: false,
            pulses: [],
            bpm: null,
            lastPulseTime: 0,
            isLocked: false
        };
        
        // Performance tracking
        this.eventStats = {
            total: 0,
            lastMinute: 0,
            startTime: Date.now()
        };
        
        // Auto-detect routing mode
        this.detectRouting();
        
        // Feature flag check
        this.enabled = this.checkFeatureFlag();
        
        if (this.enabled) {
            console.log('🎹 MIDI Controller initializing...', { mode: this.mode });
            this.init();
        } else {
            console.log('🎹 MIDI disabled by feature flag');
        }
    }
    
    checkFeatureFlag() {
        try {
            // Check URL param first
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('midi') === '1') return true;
            
            // Check localStorage
            const stored = localStorage.getItem('3886_midi_enabled');
            return stored === '1' || stored === 'true';
        } catch (e) {
            return false;
        }
    }
    
    detectRouting() {
        if (this.mode !== 'auto') return;
        
        // Direct mode if vjReceiver exists (viewer context)
        if (window.vjReceiver) {
            this.mode = 'direct';
            console.log('🎹 Auto-detected direct mode (vjReceiver present)');
        } else {
            this.mode = 'broadcast';
            console.log('🎹 Auto-detected broadcast mode (control panel context)');
        }
    }
    
    async init() {
        if (!navigator.requestMIDIAccess) {
            console.warn('🎹 Web MIDI API not supported in this browser');
            this.onError('NOT_SUPPORTED', 'Web MIDI API not available');
            return false;
        }
        
        try {
            this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
            console.log('🎹 MIDI Access granted');
            
            // Set up device monitoring
            this.midiAccess.addEventListener('statechange', (e) => this.onStateChange(e));
            
            // Initialize existing devices
            this.scanDevices();
            
            this.isActive = true;
            this.onReady();
            return true;
            
        } catch (error) {
            console.error('🎹 MIDI Access denied or failed:', error);
            this.onError('PERMISSION_DENIED', error.message);
            return false;
        }
    }
    
    scanDevices() {
        // Scan inputs
        for (const input of this.midiAccess.inputs.values()) {
            this.addInput(input);
        }
        
        // Scan outputs
        for (const output of this.midiAccess.outputs.values()) {
            this.addOutput(output);
        }
        
        console.log(`🎹 Found ${this.inputs.size} input(s) and ${this.outputs.size} output(s)`);
    }
    
    addInput(input) {
        const deviceInfo = {
            id: input.id,
            name: input.name || 'Unknown',
            manufacturer: input.manufacturer || 'Unknown',
            type: input.type || 'input',
            state: input.state
        };
        
        this.inputs.set(input.id, { ...deviceInfo, raw: input });
        
        // Set up message handler
        input.onmidimessage = (event) => this.onMIDIMessage(event, deviceInfo);
        
        console.log(`🎹 Added input: ${deviceInfo.name} (${deviceInfo.manufacturer})`);
        this.onDeviceChange('connected', deviceInfo);
    }
    
    addOutput(output) {
        const deviceInfo = {
            id: output.id,
            name: output.name || 'Unknown',
            manufacturer: output.manufacturer || 'Unknown',
            type: output.type || 'output',
            state: output.state
        };
        
        this.outputs.set(output.id, { ...deviceInfo, raw: output });
        
        console.log(`🎹 Added output: ${deviceInfo.name} (${deviceInfo.manufacturer})`);
        this.onDeviceChange('connected', deviceInfo);
    }
    
    onStateChange(event) {
        const port = event.port;
        const isInput = port.type === 'input';
        const deviceMap = isInput ? this.inputs : this.outputs;
        
        if (port.state === 'connected') {
            if (isInput) {
                this.addInput(port);
            } else {
                this.addOutput(port);
            }
        } else if (port.state === 'disconnected') {
            deviceMap.delete(port.id);
            console.log(`🎹 Removed ${port.type}: ${port.name}`);
            this.onDeviceChange('disconnected', {
                id: port.id,
                name: port.name,
                type: port.type
            });
        }
    }
    
    onMIDIMessage(event, deviceInfo) {
        const data = event.data;
        const timestamp = event.timeStamp || performance.now();
        
        // Update activity tracking
        this.deviceActivity.set(deviceInfo.id, timestamp);
        this.eventStats.total++;
        
        // Parse MIDI message
        const normalizedEvent = this.normalizeMIDIEvent(data, deviceInfo, timestamp);
        
        if (this.debugMode) {
            console.log('🎹 MIDI:', normalizedEvent);
        }
        
        // Handle MIDI clock messages
        if (normalizedEvent.type === 'clock') {
            this.handleMIDIClock(normalizedEvent);
            return;
        }
        
        // Route to action handler
        this.routeEvent(normalizedEvent);
    }
    
    normalizeMIDIEvent(data, deviceInfo, timestamp) {
        const [status, data1, data2] = data;
        const channel = (status & 0x0F) + 1; // 1-16
        const command = status & 0xF0;
        
        const normalized = {
            deviceId: deviceInfo.id,
            deviceName: deviceInfo.name,
            manufacturer: deviceInfo.manufacturer,
            timestamp,
            channel,
            raw: Array.from(data)
        };
        
        switch (command) {
            case 0x90: // Note On
                if (data2 > 0) {
                    normalized.type = 'note';
                    normalized.subtype = 'on';
                    normalized.number = data1;
                    normalized.velocity = data2;
                } else {
                    // Note on with velocity 0 = note off
                    normalized.type = 'note';
                    normalized.subtype = 'off';
                    normalized.number = data1;
                    normalized.velocity = 0;
                }
                break;
                
            case 0x80: // Note Off
                normalized.type = 'note';
                normalized.subtype = 'off';
                normalized.number = data1;
                normalized.velocity = data2;
                break;
                
            case 0xB0: // Control Change
                normalized.type = 'cc';
                normalized.number = data1;
                normalized.value = data2;
                break;
                
            case 0xF0: // System messages
                if (status === 0xF8) {
                    normalized.type = 'clock';
                } else if (status === 0xFA) {
                    normalized.type = 'start';
                } else if (status === 0xFB) {
                    normalized.type = 'continue';
                } else if (status === 0xFC) {
                    normalized.type = 'stop';
                } else {
                    normalized.type = 'system';
                    normalized.subtype = 'unknown';
                }
                break;
                
            default:
                normalized.type = 'unknown';
                break;
        }
        
        return normalized;
    }
    
    handleMIDIClock(event) {
        if (!this.midiClock.enabled) return;
        
        const now = event.timestamp;
        this.midiClock.pulses.push(now);
        
        // Keep only last 48 pulses (2 beats at 24 PPQ)
        if (this.midiClock.pulses.length > 48) {
            this.midiClock.pulses = this.midiClock.pulses.slice(-48);
        }
        
        // Calculate BPM from last 24 pulses (1 beat)
        if (this.midiClock.pulses.length >= 24) {
            const recentPulses = this.midiClock.pulses.slice(-24);
            const totalTime = recentPulses[recentPulses.length - 1] - recentPulses[0];
            const avgInterval = totalTime / 23; // 23 intervals between 24 pulses
            const bpm = Math.round(60000 / (avgInterval * 24));
            
            // Only update if BPM seems reasonable and stable
            if (bpm >= 60 && bpm <= 200 && Math.abs(bpm - (this.midiClock.bpm || bpm)) <= 2) {
                this.midiClock.bpm = bpm;
                this.midiClock.isLocked = true;
                
                // Update system BPM
                this.routeAction({
                    type: 'bpm',
                    params: { bpm }
                });
            }
        }
        
        this.midiClock.lastPulseTime = now;
    }
    
    routeEvent(event) {
        // Handle MIDI Learn mode
        if (this.pendingLearnTarget) {
            this.learnMapping(event, this.pendingLearnTarget);
            this.pendingLearnTarget = null;
            return;
        }
        
        // Find matching mappings
        const matchingMappings = this.findMatchingMappings(event);
        
        for (const mapping of matchingMappings) {
            try {
                let processedValue = event.value || event.velocity || 0;
                
                // Apply transforms
                if (mapping.transform && event.type === 'cc') {
                    processedValue = this.applyTransforms(processedValue, mapping.transform);
                }
                
                // Apply smoothing if configured
                if (mapping.transform?.smoothMs && event.type === 'cc') {
                    processedValue = this.applySmoothing(mapping.id, processedValue, mapping.transform.smoothMs);
                }
                
                // Create action
                const action = {
                    ...mapping.action,
                    sourceEvent: event,
                    processedValue
                };
                
                this.routeAction(action);
                
            } catch (error) {
                console.error('🎹 Error processing mapping:', error, mapping);
            }
        }
    }
    
    findMatchingMappings(event) {
        const matches = [];
        
        for (const mapping of this.mappings.values()) {
            const match = mapping.match;
            
            // Check device filter
            if (match.deviceId && match.deviceId !== 'any' && match.deviceId !== event.deviceId) {
                continue;
            }
            
            // Check event type
            if (match.type !== event.type) continue;
            
            // Check channel filter
            if (match.channel && match.channel !== event.channel) continue;
            
            // Check number/note filter
            if (match.number !== undefined && match.number !== event.number) continue;
            
            // Check subtype for notes (on/off)
            if (event.type === 'note' && match.subtype && match.subtype !== event.subtype) continue;
            
            matches.push(mapping);
        }
        
        return matches;
    }
    
    applyTransforms(value, transform) {
        // Normalize 0-127 to 0-1
        let normalized = Math.max(0, Math.min(127, value)) / 127;
        
        // Apply inversion
        if (transform.invert) {
            normalized = 1 - normalized;
        }
        
        // Apply curve
        if (transform.curve) {
            switch (transform.curve) {
                case 'exp':
                    normalized = normalized * normalized;
                    break;
                case 'log':
                    normalized = Math.sqrt(normalized);
                    break;
                case 'linear':
                default:
                    // Already linear
                    break;
            }
        }
        
        // Apply custom range
        const min = transform.min !== undefined ? transform.min : 0;
        const max = transform.max !== undefined ? transform.max : 1;
        
        return min + normalized * (max - min);
    }
    
    applySmoothing(mappingId, newValue, smoothMs) {
        const now = performance.now();
        const buffer = this.smoothingBuffers.get(mappingId) || { 
            value: newValue, 
            lastUpdate: now 
        };
        
        const timeDelta = now - buffer.lastUpdate;
        const alpha = Math.min(1, timeDelta / smoothMs);
        
        buffer.value = buffer.value * (1 - alpha) + newValue * alpha;
        buffer.lastUpdate = now;
        
        this.smoothingBuffers.set(mappingId, buffer);
        
        return buffer.value;
    }
    
    routeAction(action) {
        if (this.mode === 'direct' && window.vjReceiver) {
            this.executeDirectAction(action);
        } else {
            this.broadcastAction(action);
        }
    }
    
    executeDirectAction(action) {
        const vj = window.vjReceiver;
        const fx = window.fxController;
        
        try {
            switch (action.type) {
                case 'trigger':
                    if (vj && vj.triggerEffect) {
                        vj.triggerEffect(action.params.effect);
                    }
                    break;
                    
                case 'intensity':
                    if (fx && fx.setIntensity) {
                        const target = action.params.target;
                        const value = action.processedValue;
                        fx.setIntensity({ [target]: value });
                    }
                    break;
                    
                case 'toggle':
                    if (fx && fx.setEffectEnabled) {
                        const enabled = action.processedValue > 0.5;
                        fx.setEffectEnabled(action.params.effect, enabled);
                    }
                    break;
                    
                case 'scene':
                    if (vj && vj.changeScene) {
                        vj.changeScene(action.params.scene);
                    }
                    break;
                    
                case 'color':
                    if (vj && vj.updateColor) {
                        vj.updateColor(action.params.property, action.processedValue);
                    }
                    break;
                    
                case 'layer':
                    if (vj && vj.toggleLayer) {
                        const visible = action.processedValue > 0.5;
                        vj.toggleLayer(action.params.layer, visible);
                    }
                    break;
                    
                case 'bpm':
                    if (vj && vj.updateBPM) {
                        vj.updateBPM(action.params.bpm);
                    }
                    break;
            }
        } catch (error) {
            console.error('🎹 Error executing direct action:', error, action);
        }
    }
    
    broadcastAction(action) {
        // Convert to VJ control message format
        let message = null;
        
        switch (action.type) {
            case 'trigger':
                message = {
                    type: 'trigger_effect',
                    effect: action.params.effect,
                    timestamp: Date.now()
                };
                break;
                
            case 'intensity':
                message = {
                    type: 'fx_intensity',
                    effect: action.params.target,
                    intensity: action.processedValue,
                    timestamp: Date.now()
                };
                break;
                
            case 'toggle':
                message = {
                    type: 'effect_toggle',
                    effect: action.params.effect,
                    enabled: action.processedValue > 0.5,
                    timestamp: Date.now()
                };
                break;
                
            case 'scene':
                message = {
                    type: 'scene_change',
                    scene: action.params.scene,
                    timestamp: Date.now()
                };
                break;
                
            case 'color':
                message = {
                    type: 'color_change',
                    property: action.params.property,
                    value: action.processedValue,
                    timestamp: Date.now()
                };
                break;
                
            case 'layer':
                message = {
                    type: 'layer_toggle',
                    layer: action.params.layer,
                    visible: action.processedValue > 0.5,
                    timestamp: Date.now()
                };
                break;
                
            case 'bpm':
                message = {
                    type: 'bpm_change',
                    bpm: action.params.bpm,
                    timestamp: Date.now()
                };
                break;
        }
        
        if (message) {
            this.sendMessage(message);
        }
    }
    
    sendMessage(message) {
        try {
            // Try BroadcastChannel first
            if (window.BroadcastChannel) {
                const channel = new BroadcastChannel('3886_vj_control');
                channel.postMessage(message);
                channel.close();
            } else {
                // Fallback to localStorage
                localStorage.setItem('3886_vj_message', JSON.stringify({
                    ...message,
                    _id: Math.random().toString(36).substr(2, 9)
                }));
            }
        } catch (error) {
            console.error('🎹 Error broadcasting message:', error);
        }
    }
    
    learnMapping(event, target) {
        const mappingId = `${event.deviceId}_${event.type}_${event.channel || 0}_${event.number || 0}`;
        
        const mapping = {
            id: mappingId,
            deviceId: event.deviceId,
            match: {
                type: event.type,
                channel: event.channel,
                number: event.number,
                subtype: event.subtype
            },
            action: target.action,
            transform: target.transform || {},
            feedback: target.feedback || {}
        };
        
        this.mappings.set(mappingId, mapping);
        
        console.log('🎹 Learned mapping:', mapping);
        this.onMappingLearned(mapping, target);
        
        // Save to localStorage
        this.saveMappings();
    }
    
    // Public API methods
    start() {
        if (!this.isActive) {
            return this.init();
        }
        return Promise.resolve(true);
    }
    
    stop() {
        this.isActive = false;
        
        // Close all inputs
        for (const input of this.inputs.values()) {
            if (input.raw && input.raw.close) {
                input.raw.close();
            }
        }
        
        // Close all outputs  
        for (const output of this.outputs.values()) {
            if (output.raw && output.raw.close) {
                output.raw.close();
            }
        }
        
        this.inputs.clear();
        this.outputs.clear();
        
        console.log('🎹 MIDI Controller stopped');
    }
    
    getDevices() {
        return {
            inputs: Array.from(this.inputs.values()).map(d => ({
                id: d.id,
                name: d.name,
                manufacturer: d.manufacturer,
                state: d.state,
                lastActivity: this.deviceActivity.get(d.id)
            })),
            outputs: Array.from(this.outputs.values()).map(d => ({
                id: d.id,
                name: d.name,
                manufacturer: d.manufacturer,
                state: d.state
            }))
        };
    }
    
    setMapping(mapping) {
        this.mappings.set(mapping.id, mapping);
        this.saveMappings();
    }
    
    getMapping(id) {
        return this.mappings.get(id);
    }
    
    getMappings() {
        return Array.from(this.mappings.values());
    }
    
    clearMappings() {
        this.mappings.clear();
        this.saveMappings();
    }
    
    startLearn(target) {
        this.pendingLearnTarget = target;
        console.log('🎹 Learning mode activated for:', target);
    }
    
    stopLearn() {
        this.pendingLearnTarget = null;
        console.log('🎹 Learning mode deactivated');
    }
    
    setMode(mode) {
        if (['direct', 'broadcast', 'auto'].includes(mode)) {
            this.mode = mode;
            if (mode === 'auto') {
                this.detectRouting();
            }
            console.log('🎹 Mode changed to:', this.mode);
        }
    }
    
    enableMIDIClock(enabled = true) {
        this.midiClock.enabled = enabled;
        if (!enabled) {
            this.midiClock.pulses = [];
            this.midiClock.bpm = null;
            this.midiClock.isLocked = false;
        }
        console.log('🎹 MIDI Clock:', enabled ? 'enabled' : 'disabled');
    }
    
    sendFeedback(deviceId, note, velocity, channel = 1) {
        const device = this.outputs.get(deviceId);
        if (!device || !device.raw) return false;
        
        try {
            const status = 0x90 | (channel - 1); // Note On
            device.raw.send([status, note, velocity]);
            return true;
        } catch (error) {
            console.error('🎹 Error sending feedback:', error);
            return false;
        }
    }
    
    saveMappings() {
        try {
            const mappingsArray = Array.from(this.mappings.values());
            localStorage.setItem('3886_midi_mappings_v1', JSON.stringify(mappingsArray));
        } catch (error) {
            console.error('🎹 Error saving mappings:', error);
        }
    }
    
    loadMappings() {
        try {
            const stored = localStorage.getItem('3886_midi_mappings_v1');
            if (stored) {
                const mappingsArray = JSON.parse(stored);
                this.mappings.clear();
                mappingsArray.forEach(mapping => {
                    this.mappings.set(mapping.id, mapping);
                });
                console.log(`🎹 Loaded ${mappingsArray.length} mappings`);
            }
        } catch (error) {
            console.error('🎹 Error loading mappings:', error);
        }
    }
    
    exportMappings() {
        return JSON.stringify(Array.from(this.mappings.values()), null, 2);
    }
    
    importMappings(jsonString) {
        try {
            const mappingsArray = JSON.parse(jsonString);
            mappingsArray.forEach(mapping => {
                this.mappings.set(mapping.id, mapping);
            });
            this.saveMappings();
            console.log(`🎹 Imported ${mappingsArray.length} mappings`);
            return true;
        } catch (error) {
            console.error('🎹 Error importing mappings:', error);
            return false;
        }
    }
    
    // Event handlers (to be overridden)
    onReady() {
        console.log('🎹 MIDI Controller ready');
        this.dispatchEvent('ready', { controller: this });
    }
    
    onError(code, message) {
        console.error('🎹 MIDI Error:', code, message);
        this.dispatchEvent('error', { code, message });
    }
    
    onDeviceChange(action, device) {
        this.dispatchEvent('devicechange', { action, device });
    }
    
    onMappingLearned(mapping, target) {
        this.dispatchEvent('mappinglearned', { mapping, target });
    }
    
    dispatchEvent(type, detail) {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(`midi${type}`, { detail }));
        }
    }
}

// Create singleton instance
const midiController = new MIDIController();

// Global export
if (typeof window !== 'undefined') {
    window.midiController = midiController;
}

export default midiController;