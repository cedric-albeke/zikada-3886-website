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
            this.initActionCatalog();
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
            
            // Load existing mappings
            this.loadMappings();
            
            this.isActive = true;
            this.onReady();
            return true;
            
        } catch (error) {
            console.error('🎹 MIDI Access denied or failed:', error);
            this.onError('PERMISSION_DENIED', error.message);
            return false;
        }
    }
    
    // Initialize action catalog integration
    initActionCatalog() {
        if (window.MIDIActionCatalog && !window.midiActionCatalog) {
            window.midiActionCatalog = new window.MIDIActionCatalog({ mode: this.mode });
            console.log('✅ MIDI Action Catalog initialized');
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
        
        // Apply custom range
        const min = transform.min !== undefined ? transform.min : 0;
        const max = transform.max !== undefined ? transform.max : 1;
        
        return min + normalized * (max - min);
    }
    
    routeAction(action) {
        if (this.mode === 'direct' && window.vjReceiver) {
            this.executeDirectAction(action);
        } else {
            this.broadcastAction(action);
        }
    }
    
    executeDirectAction(action) {
        // Try action catalog first for unified handling
        if (window.midiActionCatalog) {
            this.executeViaActionCatalog(action);
            return;
        }
        
        // Fallback to legacy direct actions
        const vj = window.vjReceiver;
        const fx = window.fxController;
        
        try {
            switch (action.type) {
                case 'trigger':
                    if (vj && vj.triggerEffect) {
                        vj.triggerEffect(action.params.effect);
                    }
                    break;
                    
                case 'scene':
                    if (vj && vj.changeScene) {
                        vj.changeScene(action.params.scene);
                    }
                    break;
            }
        } catch (error) {
            console.error('🎹 Error executing direct action:', error, action);
        }
    }
    
    executeViaActionCatalog(action) {
        const catalog = window.midiActionCatalog;
        const value = action.processedValue;
        const params = action.params;
        
        try {
            switch (action.type) {
                case 'trigger':
                    catalog.triggerEffect(params.effect || params.target);
                    break;
                case 'scene':
                    catalog.changeScene(params.scene);
                    break;
                case 'animation':
                    if (value > 0.5) {
                        catalog.triggerAnimation(params.anime);
                    }
                    break;
                case 'effect_toggle':
                    catalog.toggleEffect(params.effect, value > 0.5);
                    break;
            }
        } catch (error) {
            console.error('🎹 Error executing action via catalog:', error, action);
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
                
            case 'scene':
                message = {
                    type: 'scene_change',
                    scene: action.params.scene,
                    timestamp: Date.now()
                };
                break;
                
            case 'animation':
                message = {
                    type: 'trigger_animation',
                    animation: action.params.anime,
                    timestamp: Date.now()
                };
                break;
                
            case 'effect_toggle':
                message = {
                    type: 'effect_toggle',
                    effect: action.params.effect,
                    enabled: action.processedValue > 0.5,
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

// Create singleton instance and global export
if (typeof window !== 'undefined') {
    window.MIDIController = MIDIController;
    console.log('🎹 MIDIController class available globally');
}