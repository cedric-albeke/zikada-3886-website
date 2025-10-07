// ZIKADA 3886 MIDI Feedback Manager
// Handles LED feedback for MIDI controllers

class MIDIFeedbackManager {
    constructor(midiController) {
        this.midiController = midiController;
        this.deviceProfiles = new Map();
        this.feedbackState = new Map(); // Track current LED states
        this.feedbackQueue = [];
        this.isProcessing = false;
        this.batchSize = 8; // Max messages per batch
        
        // Define device profiles for popular controllers
        this.initDeviceProfiles();
        
        // Subscribe to state changes
        this.setupStateSubscriptions();
        
        console.log('🔥 MIDI Feedback Manager initialized');
    }
    
    initDeviceProfiles() {
        // APC40 mk2 Profile
        this.deviceProfiles.set('apc40', {
            matchers: ['apc40', 'apc 40'],
            type: 'apc',
            gridSize: [8, 5], // 8x5 clip launch grid
            colors: {
                off: 0,
                red: 3,
                yellow: 5,
                green: 1,
                cyan: 33,
                blue: 45,
                magenta: 53,
                white: 119
            },
            controls: {
                clipGrid: { start: 0, end: 39 }, // Notes 0-39
                sceneButtons: { start: 82, end: 89 }, // Notes 82-89
                trackSelect: { start: 51, end: 58 }, // Notes 51-58
                recordArm: { start: 48, end: 55 }, // Notes 48-55
                solo: { start: 49, end: 56 }, // Notes 49-56
                mute: { start: 50, end: 57 }, // Notes 50-57
                stop: { start: 52, end: 59 }, // Notes 52-59
            },
            channel: 1
        });
        
        // Launchpad X Profile
        this.deviceProfiles.set('launchpad', {
            matchers: ['launchpad', 'lpx'],
            type: 'novation',
            gridSize: [8, 8], // 8x8 main grid
            colors: {
                off: 0,
                red: 5,
                yellow: 13,
                green: 21,
                cyan: 37,
                blue: 45,
                magenta: 53,
                white: 3
            },
            controls: {
                mainGrid: { start: 11, end: 88 }, // 8x8 grid
                topButtons: { start: 91, end: 98 }, // Top row
                sideButtons: { start: 19, end: 89, step: 10 }, // Right side
            },
            channel: 1
        });
        
        // Generic MIDI Controller Profile
        this.deviceProfiles.set('generic', {
            matchers: ['*'],
            type: 'generic',
            gridSize: [4, 4],
            colors: {
                off: 0,
                on: 127
            },
            controls: {
                pads: { start: 36, end: 51 }, // Common pad range
                knobs: { start: 1, end: 8 }, // Common CC knob range
            },
            channel: 1
        });
    }
    
    setupStateSubscriptions() {
        // Subscribe to BroadcastChannel updates if available
        if (window.BroadcastChannel) {
            try {
                this.feedbackChannel = new BroadcastChannel('3886_vj_control');
                this.feedbackChannel.addEventListener('message', (event) => {
                    this.handleStateUpdate(event.data);
                });
            } catch (e) {
                console.warn('🔥 Could not subscribe to feedback channel:', e);
            }
        }
        
        // Subscribe to direct state changes
        window.addEventListener('effecttoggle', (e) => {
            this.updateEffectLED(e.detail.effect, e.detail.enabled);
        });
        
        window.addEventListener('scenechange', (e) => {
            this.updateSceneLEDs(e.detail.scene);
        });
        
        // Throttled feedback processing
        this.startFeedbackProcessor();
    }
    
    handleStateUpdate(message) {
        switch (message.type) {
            case 'effect_toggle':
                this.updateEffectLED(message.effect, message.enabled);
                break;
            case 'scene_change':
                this.updateSceneLEDs(message.scene);
                break;
            case 'layer_toggle':
                this.updateLayerLED(message.layer, message.visible);
                break;
        }
    }
    
    detectDeviceProfile(deviceName, manufacturer) {
        const searchText = `${deviceName} ${manufacturer}`.toLowerCase();
        
        for (const [profileId, profile] of this.deviceProfiles) {
            if (profileId === 'generic') continue; // Skip generic, use as fallback
            
            for (const matcher of profile.matchers) {
                if (searchText.includes(matcher.toLowerCase())) {
                    console.log(`🔥 Detected device profile: ${profileId} for ${deviceName}`);
                    return profile;
                }
            }
        }
        
        // Fallback to generic
        console.log(`🔥 Using generic profile for ${deviceName}`);
        return this.deviceProfiles.get('generic');
    }
    
    registerDevice(deviceId, deviceName, manufacturer) {
        const profile = this.detectDeviceProfile(deviceName, manufacturer);
        this.feedbackState.set(deviceId, {
            profile,
            name: deviceName,
            leds: new Map() // Current LED states
        });
        
        // Initialize all LEDs to off
        this.initializeLEDs(deviceId);
    }
    
    unregisterDevice(deviceId) {
        this.feedbackState.delete(deviceId);
        console.log(`🔥 Unregistered device: ${deviceId}`);
    }
    
    initializeLEDs(deviceId) {
        const device = this.feedbackState.get(deviceId);
        if (!device) return;
        
        // Turn off all LEDs based on profile
        const { profile } = device;
        
        for (const [controlType, range] of Object.entries(profile.controls)) {
            if (range.start !== undefined && range.end !== undefined) {
                for (let note = range.start; note <= range.end; note += range.step || 1) {
                    this.queueFeedback(deviceId, note, profile.colors.off, profile.channel);
                }
            }
        }
        
        console.log(`🔥 Initialized LEDs for ${device.name}`);
    }
    
    updateEffectLED(effectName, enabled) {
        // Map effect names to controller positions
        const effectMapping = {
            // Row 1 - Basic Effects
            'glow': 0,
            'blur': 1, 
            'shake': 2,
            'spin': 3,
            
            // Row 2 - Transform Effects
            'zoom': 8,
            'flip': 9,
            'wave': 10,
            'pixel': 11,
            
            // Row 3 - Color Effects  
            'rgb': 16,
            'chroma': 17,
            'scan': 18,
            'static': 19,
            
            // Row 4 - Complex Effects
            'grid': 24,
            'mirror': 25,
            'echo': 26,
            'trail': 27
        };
        
        const position = effectMapping[effectName];
        if (position === undefined) return;
        
        // Update all registered devices
        for (const [deviceId, deviceState] of this.feedbackState) {
            const { profile } = deviceState;
            const color = enabled ? this.getEffectColor(effectName, profile) : profile.colors.off;
            
            // Map position to actual MIDI note based on device
            const note = this.positionToNote(position, profile);
            if (note !== null) {
                this.queueFeedback(deviceId, note, color, profile.channel);
            }
        }
    }
    
    updateSceneLEDs(activeScene) {
        const sceneMapping = {
            'intense': 0,
            'calm': 1,
            'glitch': 2,
            'techno': 3,
            'matrix': 4,
            'minimal': 5,
            'chaotic': 6,
            'retro': 7
        };
        
        for (const [deviceId, deviceState] of this.feedbackState) {
            const { profile } = deviceState;
            
            // Update scene button LEDs
            for (const [sceneName, index] of Object.entries(sceneMapping)) {
                const isActive = sceneName === activeScene;
                const color = isActive ? profile.colors.green : profile.colors.off;
                
                // Map to scene buttons if available
                if (profile.controls.sceneButtons) {
                    const note = profile.controls.sceneButtons.start + index;
                    if (note <= profile.controls.sceneButtons.end) {
                        this.queueFeedback(deviceId, note, color, profile.channel);
                    }
                }
            }
        }
    }
    
    updateLayerLED(layerName, visible) {
        // Map common layers to side buttons
        const layerMapping = {
            'background': 0,
            'matrix-rain': 1,
            'logo': 2,
            'particles': 3,
            'animations': 4,
            'overlay': 5,
            'debug': 6
        };
        
        const position = layerMapping[layerName];
        if (position === undefined) return;
        
        for (const [deviceId, deviceState] of this.feedbackState) {
            const { profile } = deviceState;
            const color = visible ? profile.colors.cyan : profile.colors.off;
            
            // Map to side buttons if available
            if (profile.controls.sideButtons) {
                const note = profile.controls.sideButtons.start + (position * (profile.controls.sideButtons.step || 1));
                if (note <= profile.controls.sideButtons.end) {
                    this.queueFeedback(deviceId, note, color, profile.channel);
                }
            }
        }
    }
    
    positionToNote(position, profile) {
        // Convert 0-based position to MIDI note based on device layout
        if (profile.type === 'apc' && profile.controls.clipGrid) {
            const note = profile.controls.clipGrid.start + position;
            return note <= profile.controls.clipGrid.end ? note : null;
        } else if (profile.type === 'novation' && profile.controls.mainGrid) {
            // Launchpad grid mapping (8x8)
            const row = Math.floor(position / 4) + 1; // Offset for top row
            const col = (position % 4) * 2; // Spread across 8 columns
            const note = (row * 10) + col + 1;
            return (note >= 11 && note <= 88) ? note : null;
        } else if (profile.controls.pads) {
            const note = profile.controls.pads.start + position;
            return note <= profile.controls.pads.end ? note : null;
        }
        
        return null;
    }
    
    getEffectColor(effectName, profile) {
        // Color-code effects by category
        const colorMap = {
            // Visual enhancement effects - Green
            'glow': profile.colors.green,
            'blur': profile.colors.green,
            
            // Motion effects - Yellow  
            'shake': profile.colors.yellow,
            'spin': profile.colors.yellow,
            'zoom': profile.colors.yellow,
            
            // Color effects - Magenta
            'rgb': profile.colors.magenta,
            'chroma': profile.colors.magenta,
            'pixel': profile.colors.magenta,
            
            // Pattern effects - Cyan
            'scan': profile.colors.cyan,
            'static': profile.colors.cyan,
            'grid': profile.colors.cyan,
            
            // Complex effects - Red
            'wave': profile.colors.red,
            'flip': profile.colors.red,
            'mirror': profile.colors.red,
            'echo': profile.colors.red,
            'trail': profile.colors.red
        };
        
        return colorMap[effectName] || profile.colors.white;
    }
    
    queueFeedback(deviceId, note, velocity, channel = 1) {
        // Avoid duplicate updates
        const key = `${deviceId}_${note}_${channel}`;
        const currentState = this.feedbackState.get(deviceId)?.leds.get(key);
        
        if (currentState === velocity) return; // No change needed
        
        this.feedbackQueue.push({
            deviceId,
            note,
            velocity,
            channel,
            timestamp: performance.now()
        });
        
        // Update state tracking
        if (this.feedbackState.has(deviceId)) {
            this.feedbackState.get(deviceId).leds.set(key, velocity);
        }
    }
    
    startFeedbackProcessor() {
        const processBatch = () => {
            if (this.feedbackQueue.length === 0 || this.isProcessing) {
                requestAnimationFrame(processBatch);
                return;
            }
            
            this.isProcessing = true;
            
            // Process up to batchSize messages
            const batch = this.feedbackQueue.splice(0, this.batchSize);
            
            for (const feedback of batch) {
                this.sendFeedback(feedback);
            }
            
            this.isProcessing = false;
            requestAnimationFrame(processBatch);
        };
        
        requestAnimationFrame(processBatch);
    }
    
    sendFeedback(feedback) {
        const { deviceId, note, velocity, channel } = feedback;
        
        try {
            const success = this.midiController.sendFeedback(deviceId, note, velocity, channel);
            if (!success) {
                console.warn(`🔥 Failed to send feedback to device ${deviceId}`);
            }
        } catch (error) {
            console.error('🔥 Error sending MIDI feedback:', error);
        }
    }
    
    // Public API
    updateTriggerFeedback(triggerName, active) {
        // Map triggers to positions (first 18 positions for trigger grid)
        const triggerMapping = {
            'strobe': 32, 'blackout': 33, 'whiteout': 34, 'rgbsplit': 35,
            'ripple': 40, 'pulse': 41, 'matrix-rain': 42, 'cosmic': 43,
            'vignette-pulse': 48, 'scanlines-sweep': 49, 'chroma-pulse': 50, 'noise-burst': 51,
            'grid-flash': 56, 'lens-flare': 57, 'zoom-blur': 58, 'invert-flicker': 59,
            'spotlight-sweep': 64, 'heat-shimmer': 65
        };
        
        const position = triggerMapping[triggerName];
        if (position === undefined) return;
        
        for (const [deviceId, deviceState] of this.feedbackState) {
            const { profile } = deviceState;
            const color = active ? profile.colors.red : profile.colors.off;
            
            // Use actual position for triggers
            this.queueFeedback(deviceId, position, color, profile.channel);
        }
    }
    
    updateIntensityFeedback(paramName, value) {
        // Map intensity parameters to knobs/faders
        const intensityMapping = {
            'glitch': 1,
            'particles': 2, 
            'noise': 3,
            'distortion': 4,
            'plasma': 5,
            'strobe': 6
        };
        
        const cc = intensityMapping[paramName];
        if (cc === undefined) return;
        
        const scaledValue = Math.round(value * 127);
        
        // CC feedback is less common, but some controllers support it
        for (const [deviceId, deviceState] of this.feedbackState) {
            if (deviceState.profile.type === 'apc') {
                // APC controllers can show fader positions via CC
                try {
                    this.midiController.sendCC?.(deviceId, cc, scaledValue, deviceState.profile.channel);
                } catch (e) {
                    // Ignore if CC feedback not supported
                }
            }
        }
    }
    
    testDevice(deviceId) {
        const device = this.feedbackState.get(deviceId);
        if (!device) return;
        
        const { profile } = device;
        const colors = Object.values(profile.colors).filter(c => c > 0);
        
        // Light up grid in sequence with different colors
        let delay = 0;
        for (const [controlType, range] of Object.entries(profile.controls)) {
            if (range.start !== undefined && range.end !== undefined) {
                for (let note = range.start; note <= range.end; note += range.step || 1) {
                    const color = colors[note % colors.length];
                    
                    setTimeout(() => {
                        this.queueFeedback(deviceId, note, color, profile.channel);
                        
                        // Turn off after 200ms
                        setTimeout(() => {
                            this.queueFeedback(deviceId, note, profile.colors.off, profile.channel);
                        }, 200);
                    }, delay);
                    
                    delay += 50;
                }
            }
        }
        
        console.log(`🔥 Test pattern sent to ${device.name}`);
    }
    
    destroy() {
        if (this.feedbackChannel) {
            this.feedbackChannel.close();
        }
        
        // Turn off all LEDs
        for (const [deviceId] of this.feedbackState) {
            this.initializeLEDs(deviceId);
        }
        
        console.log('🔥 MIDI Feedback Manager destroyed');
    }
}

// Export for global access
if (typeof window !== 'undefined') {
    window.MIDIFeedbackManager = MIDIFeedbackManager;
    console.log('🎹 MIDIFeedbackManager class available globally');
}
