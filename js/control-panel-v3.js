/**
 * ============================================
 * CONTROL PANEL V3 - LIGHTWEIGHT ENHANCEMENTS
 * ============================================
 * 
 * Adds interactive features to the v3 control panel:
 * - Optional features toggle
 * - Keyboard shortcuts
 * - Visual feedback enhancements
 * - Integration with existing control-panel-professional.js
 */

class ControlPanelV3 {
    constructor() {
        this.midiLearnActive = false;
        this.midiController = null;
        this.initialized = false;
        this.destroyed = false;
        this.abortController = new AbortController();
        this.timeoutIds = new Set();
        this.rafIds = new Set();
        this.init();
    }

    init() {
        if (this.initialized || this.destroyed) return;
        this.initialized = true;
        this.setupKeyboardShortcuts();
        this.setupSpeedSliderSync();
        this.enhanceButtonFeedback();
        this.initMIDIIntegration();
        // The professional controller owns uptime, connection state and
        // performance-mode dispatch. Keeping a second owner here previously
        // doubled intervals and every L/A/H click.
        this.listen(window, 'pagehide', () => this.destroy(), { once: true });
        this.listen(window, 'beforeunload', () => this.destroy(), { once: true });

        console.log('🎹️ Control Panel V3 enhancements loaded');
    }

    listen(target, type, handler, options = {}) {
        if (this.destroyed) return;
        target?.addEventListener?.(type, handler, {
            ...options,
            signal: this.abortController.signal
        });
    }

    scheduleTimeout(callback, delay = 0) {
        if (this.destroyed) return null;
        const id = window.setTimeout(() => {
            this.timeoutIds.delete(id);
            if (!this.destroyed) callback();
        }, Math.max(0, Number(delay) || 0));
        this.timeoutIds.add(id);
        return id;
    }

    scheduleFrame(callback) {
        if (this.destroyed) return null;
        const id = window.requestAnimationFrame((timestamp) => {
            this.rafIds.delete(id);
            if (!this.destroyed) callback(timestamp);
        });
        this.rafIds.add(id);
        return id;
    }
    
    /**
     * Initialize matrix control buttons and VJ messaging
     */
    initMatrixControls() {
        // Wait for VJ messaging to be available
        const vjMessaging = window.vjMessaging;
        if (!vjMessaging) {
            this.scheduleTimeout(() => this.initMatrixControls(), 100);
            return;
        }
        
        // System controls are owned by control-panel-professional.js. Keeping
        // legacy handlers here sent every KILL/RESET/RELOAD twice.
        
        // Performance mode buttons
        const perfLowBtn = document.getElementById('perfLow');
        const perfAutoBtn = document.getElementById('perfAuto');
        const perfHighBtn = document.getElementById('perfHigh');
        
        if (perfLowBtn) {
            this.listen(perfLowBtn, 'click', () => {
                vjMessaging.setPerformanceMode('low');
                this.updatePerformanceModeUI('low');
                this.showButtonFeedback(perfLowBtn, 'LOW MODE');
            });
        }
        
        if (perfAutoBtn) {
            this.listen(perfAutoBtn, 'click', () => {
                vjMessaging.setPerformanceMode('auto');
                this.updatePerformanceModeUI('auto');
                this.showButtonFeedback(perfAutoBtn, 'AUTO MODE');
            });
        }
        
        if (perfHighBtn) {
            this.listen(perfHighBtn, 'click', () => {
                vjMessaging.setPerformanceMode('high');
                this.updatePerformanceModeUI('high');
                this.showButtonFeedback(perfHighBtn, 'HIGH MODE');
            });
        }
        
        // Set up connection status handling
        vjMessaging.onConnectionChange = (connected) => {
            this.updateControlsState(connected);
        };
        
        console.log('⚡ Matrix controls initialized with VJ messaging');
    }
    
    /**
     * Update the state of control buttons based on connection status
     */
    updateControlsState(connected) {
        const controls = [
            'emergencyStop', 'systemReset', 'systemReload',
            'perfLow', 'perfAuto', 'perfHigh'
        ];
        
        controls.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                if (connected) {
                    btn.disabled = false;
                    btn.title = btn.title.replace(' (Offline)', '');
                    btn.style.opacity = '';
                } else {
                    btn.disabled = true;
                    btn.title = (btn.title.includes('(Offline)') ? btn.title : btn.title + ' (Offline)');
                    btn.style.opacity = '0.5';
                }
            }
        });
        
        // Update connection indicator if it exists
        const connectionStatus = document.getElementById('connectionStatus');
        if (connectionStatus) {
            const statusText = connectionStatus.querySelector('.status-text');
            if (statusText) {
                statusText.textContent = connected ? 'ONLINE' : 'OFFLINE';
            }
            connectionStatus.classList.toggle('connected', connected);
        }
    }
    
    /**
     * Update performance mode UI
     */
    updatePerformanceModeUI(mode) {
        const modes = ['perfLow', 'perfAuto', 'perfHigh'];
        modes.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.classList.remove('active');
            }
        });
        
        const activeBtn = document.getElementById('perf' + mode.charAt(0).toUpperCase() + mode.slice(1));
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }
    
    /**
     * Show visual feedback for button presses
     */
    showButtonFeedback(button, message) {
        const originalText = button.textContent;
        button.textContent = message;
        button.classList.add('active');
        
        this.scheduleTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('active');
        }, 800);
    }

    /**
     * Setup keyboard shortcuts for quick access
     */
    setupKeyboardShortcuts() {
        this.listen(document, 'keydown', (e) => {
            // Don't trigger if typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            // ESC - Emergency stop
            if (e.key === 'Escape') {
                e.preventDefault();
                const vjMessaging = window.vjMessaging;
                if (vjMessaging) {
                    vjMessaging.emergencyKill();
                    this.showButtonFeedback(document.getElementById('emergencyStop'), 'ESC KILL');
                } else {
                    document.getElementById('emergencyStop')?.click();
                }
                return;
            }

            // Ctrl/Cmd + key combinations
            if (e.ctrlKey || e.metaKey) {
                switch(e.key.toLowerCase()) {
                    case 'r':
                        e.preventDefault();
                        const vjMessaging = window.vjMessaging;
                        if (vjMessaging && confirm('Reset the system? This will restore defaults.')) {
                            vjMessaging.systemReset();
                            this.showButtonFeedback(document.getElementById('systemReset'), 'CTRL+R RESET');
                        } else {
                            document.getElementById('systemReset')?.click();
                        }
                        break;
                    case 'e':
                        e.preventDefault();
                        document.getElementById('animeEnable')?.click();
                        break;
                    case 'd':
                        e.preventDefault();
                        document.getElementById('animeDisable')?.click();
                        break;
                }
            }

            // Number keys 1-9 for scene selection
            if (e.key >= '1' && e.key <= '9' && !e.ctrlKey && !e.metaKey) {
                const sceneButtons = document.querySelectorAll('.scene-btn');
                const index = parseInt(e.key) - 1;
                if (sceneButtons[index]) {
                    sceneButtons[index].click();
                }
            }

            // Space for AUTO mode
            if (e.key === ' ' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                document.querySelector('.scene-auto')?.click();
            }
        });
    }

    /**
     * Sync speed slider with display value
     */
    setupSpeedSliderSync() {
        const speedSlider = document.getElementById('speedSlider');
        const speedValue = document.getElementById('speedValue');

        if (speedSlider && speedValue) {
            this.listen(speedSlider, 'input', (e) => {
                speedValue.textContent = `${e.target.value}%`;
            });
        }

        const phaseSlider = document.getElementById('phaseDurationSlider');
        const phaseValue = document.getElementById('phaseValue');
        if (phaseSlider && phaseValue) {
            this.listen(phaseSlider, 'input', (e) => {
                phaseValue.textContent = `${e.target.value}s`;
            });
        }
    }

    /**
     * Enhanced button feedback
     */
    enhanceButtonFeedback() {
        // Add ripple effect to all buttons
        document.querySelectorAll('.scene-btn, .trigger-btn, .macro-btn, .anim-trigger-btn').forEach(btn => {
            this.listen(btn, 'click', (e) => {
                this.createRipple(e);
            });
        });

        // Scene button active states
        document.querySelectorAll('.scene-btn').forEach(btn => {
            this.listen(btn, 'click', () => {
                // Remove active from all scene buttons
                document.querySelectorAll('.scene-btn').forEach(b => b.classList.remove('active'));
                // Add active to clicked button
                btn.classList.add('active');
            });
        });

        // Performance mode button active states
        document.querySelectorAll('.btn--small[data-mode]').forEach(btn => {
            this.listen(btn, 'click', () => {
                // Remove active from all mode buttons
                document.querySelectorAll('.btn--small[data-mode]').forEach(b => b.classList.remove('active'));
                // Add active to clicked button
                btn.classList.add('active');
            });
        });

        // Animation system button states
        const enableBtn = document.getElementById('animeEnable');
        const disableBtn = document.getElementById('animeDisable');
        
        if (enableBtn && disableBtn) {
            this.listen(enableBtn, 'click', () => {
                enableBtn.classList.add('active');
                disableBtn.classList.remove('active');
            });
            
            this.listen(disableBtn, 'click', () => {
                disableBtn.classList.add('active');
                enableBtn.classList.remove('active');
            });
        }

        // Note: Toggle buttons are handled by control-panel-professional.js
        // which uses event delegation and sends messages to the main page
    }

    /**
     * Create ripple effect on button click
     */
    createRipple(event) {
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const ripple = document.createElement('span');
        ripple.className = 'v3-ripple';
        ripple.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: rgba(0, 255, 133, 0.6);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            animation: rippleEffect 0.6s ease-out;
            left: ${x}px;
            top: ${y}px;
        `;

        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);

        this.scheduleTimeout(() => ripple.remove(), 600);
    }

    /**
     * Initialize MIDI integration for V3 controls
     */
    async initMIDIIntegration() {
        // Wait for MIDI controller to be available
        const waitForMIDI = () => {
            return new Promise((resolve) => {
                if (window.midiController) {
                    resolve(window.midiController);
                } else {
                    this.scheduleTimeout(() => {
                        resolve(window.midiController || null);
                    }, 1000);
                }
            });
        };
        
        this.midiController = await waitForMIDI();
        
        if (this.midiController) {
            console.log('🎹 V3 MIDI integration initialized');
            this.setupMIDIEventListeners();
            this.setupMIDIActivityMonitor();
        } else {
            console.log('🎹 MIDI controller not available for V3 integration');
        }
    }

    /**
     * Setup MIDI event listeners for V3 controls
     */
    setupMIDIEventListeners() {
        // MIDI Learn button
        const learnBtn = document.getElementById('midiLearnBtn');
        this.listen(learnBtn, 'click', () => this.toggleMIDILearn());
        
        // Device selection
        const deviceSelect = document.getElementById('midiDeviceSelect');
        this.listen(deviceSelect, 'change', (e) => this.selectMIDIDevice(e.target.value));
        
        // Action buttons
        const loadPresetBtn = document.getElementById('midiLoadPresetBtn');
        const clearBtn = document.getElementById('midiClearBtn');
        const debugBtn = document.getElementById('midiDebugBtn');
        
        this.listen(loadPresetBtn, 'click', () => this.loadMIDIPreset());
        this.listen(clearBtn, 'click', () => this.clearAllMappings());
        this.listen(debugBtn, 'click', () => this.toggleMIDIDebug());
        
        // Listen for MIDI events
        this.listen(window, 'midiready', (e) => this.onMIDIReady(e));
        this.listen(window, 'midierror', (e) => this.onMIDIError(e));
        this.listen(window, 'mididevicechange', (e) => this.onMIDIDeviceChange(e));
        this.listen(window, 'midimappinglearned', (e) => this.onMIDIMappingLearned(e));
        
        // Make V3 controls learnable
        this.makeV3ControlsLearnable();
    }

    /**
     * Make V3 controls learnable for MIDI
     */
    makeV3ControlsLearnable() {
        // Scene buttons
        document.querySelectorAll('.scene-btn').forEach(btn => {
            const originalClickHandler = (e) => {
                if (this.midiLearnActive) {
                    this.setMIDILearnTarget({
                        element: btn,
                        action: {
                            type: 'scene',
                            params: { scene: btn.dataset.scene }
                        },
                        name: `Scene: ${btn.dataset.scene?.toUpperCase() || 'Unknown'}`
                    });
                    e.preventDefault();
                    e.stopPropagation();
                }
            };
            
            // Add to beginning of event chain
            this.listen(btn, 'click', originalClickHandler, { capture: true });
        });

        // Trigger FX buttons
        document.querySelectorAll('.trigger-btn').forEach(btn => {
            const originalClickHandler = (e) => {
                if (this.midiLearnActive) {
                    this.setMIDILearnTarget({
                        element: btn,
                        action: {
                            type: 'trigger',
                            params: { effect: btn.dataset.effect }
                        },
                        name: `Trigger: ${btn.dataset.effect?.toUpperCase() || 'Unknown'}`
                    });
                    e.preventDefault();
                    e.stopPropagation();
                }
            };
            
            this.listen(btn, 'click', originalClickHandler, { capture: true });
        });

        // Animation trigger buttons
        document.querySelectorAll('.anim-trigger-btn').forEach(btn => {
            const originalClickHandler = (e) => {
                if (this.midiLearnActive) {
                    this.setMIDILearnTarget({
                        element: btn,
                        action: {
                            type: 'animation',
                            params: { anime: btn.dataset.anime }
                        },
                        name: `Animation: ${btn.dataset.anime?.toUpperCase() || 'Unknown'}`
                    });
                    e.preventDefault();
                    e.stopPropagation();
                }
            };
            
            this.listen(btn, 'click', originalClickHandler, { capture: true });
        });

        // Effect toggle buttons
        document.querySelectorAll('.effect-toggle-btn').forEach(btn => {
            const originalClickHandler = (e) => {
                if (this.midiLearnActive) {
                    this.setMIDILearnTarget({
                        element: btn,
                        action: {
                            type: 'effect_toggle',
                            params: { effect: btn.dataset.effect }
                        },
                        name: `Effect Toggle: ${btn.dataset.effect?.toUpperCase() || 'Unknown'}`
                    });
                    e.preventDefault();
                    e.stopPropagation();
                }
            };
            
            this.listen(btn, 'click', originalClickHandler, { capture: true });
        });

        // Layer toggle buttons
        document.querySelectorAll('.layer-toggle-btn').forEach(btn => {
            const originalClickHandler = (e) => {
                if (this.midiLearnActive) {
                    this.setMIDILearnTarget({
                        element: btn,
                        action: {
                            type: 'layer_toggle',
                            params: { layer: btn.dataset.layer }
                        },
                        name: `Layer Toggle: ${btn.dataset.layer?.toUpperCase() || 'Unknown'}`
                    });
                    e.preventDefault();
                    e.stopPropagation();
                }
            };
            
            this.listen(btn, 'click', originalClickHandler, { capture: true });
        });

        // Sliders (speed, phase, BPM)
        const sliders = {
            'speedSlider': { name: 'Global Speed', type: 'speed' },
            'phaseDurationSlider': { name: 'Phase Duration', type: 'phase' }
        };

        Object.entries(sliders).forEach(([sliderId, config]) => {
            const slider = document.getElementById(sliderId);
            this.listen(slider, 'mousedown', (e) => {
                if (this.midiLearnActive) {
                    this.setMIDILearnTarget({
                        element: slider,
                        action: {
                            type: 'slider',
                            params: { target: config.type }
                        },
                        transform: { min: parseInt(slider.min), max: parseInt(slider.max) },
                        name: config.name
                    });
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
        });
    }

    /**
     * Toggle MIDI Learn mode
     */
    toggleMIDILearn() {
        const learnBtn = document.getElementById('midiLearnBtn');
        
        if (this.midiLearnActive) {
            this.stopMIDILearn();
            learnBtn.textContent = 'LEARN.OFF';
            learnBtn.classList.remove('learning');
        } else {
            this.startMIDILearn();
            learnBtn.textContent = 'LEARN.ON';
            learnBtn.classList.add('learning');
        }
    }

    /**
     * Start MIDI Learn mode
     */
    startMIDILearn() {
        this.midiLearnActive = true;
        this.showToast('MIDI Learn active - Click any control, then move a MIDI controller', 'info', 5000);
        
        // Auto-disable after 30 seconds
        this.midiLearnTimeout = this.scheduleTimeout(() => {
            this.stopMIDILearn();
            this.showToast('MIDI Learn timed out', 'warning');
        }, 30000);
    }

    /**
     * Stop MIDI Learn mode
     */
    stopMIDILearn() {
        this.midiLearnActive = false;
        this.clearMIDILearnTarget();
        
        if (this.midiLearnTimeout) {
            window.clearTimeout(this.midiLearnTimeout);
            this.timeoutIds.delete(this.midiLearnTimeout);
            this.midiLearnTimeout = null;
        }
        
        const learnBtn = document.getElementById('midiLearnBtn');
        learnBtn.textContent = 'LEARN.OFF';
        learnBtn.classList.remove('learning');
    }

    /**
     * Set MIDI learn target
     */
    setMIDILearnTarget(target) {
        this.clearMIDILearnTarget();
        
        this.midiLearnTarget = target;
        target.element.classList.add('learn-target-indicator');
        
        if (this.midiController && this.midiController.startLearn) {
            this.midiController.startLearn(target);
        }
        
        this.showToast(`Learning target: ${target.name}`, 'info', 3000);
    }

    /**
     * Clear MIDI learn target
     */
    clearMIDILearnTarget() {
        if (this.midiLearnTarget) {
            this.midiLearnTarget.element.classList.remove('learn-target-indicator');
            this.midiLearnTarget = null;
        }
        
        if (this.midiController && this.midiController.stopLearn) {
            this.midiController.stopLearn();
        }
    }

    /**
     * Setup MIDI activity monitor for compact display
     */
    setupMIDIActivityMonitor() {
        if (!this.midiController) return;
        
        // Listen for MIDI activity
        this.listen(window, 'midiactivity', (e) => {
            this.updateMIDIActivity(e.detail);
        });
    }

    /**
     * Update MIDI activity display
     */
    updateMIDIActivity(activityData) {
        const activityDisplay = document.getElementById('activityDisplay');
        const activityText = activityDisplay?.querySelector('.activity-text-compact');
        
        if (!activityText) return;
        
        // Format activity for compact display
        let displayText = 'NO.ACTIVITY';
        
        if (activityData && activityData.device) {
            const { device, type, data } = activityData;
            
            switch (type) {
                case 'note':
                    displayText = `${device.name.substring(0, 8)}.NOTE.${data.note}`;
                    break;
                case 'cc':
                    displayText = `${device.name.substring(0, 8)}.CC${data.controller}.${data.value}`;
                    break;
                case 'clock':
                    displayText = `${device.name.substring(0, 8)}.CLOCK`;
                    break;
                default:
                    displayText = `${device.name.substring(0, 8)}.${type.toUpperCase()}`;
            }
        }
        
        activityText.textContent = displayText;
        activityText.classList.add('active');
        
        // Remove active class after animation
        this.scheduleTimeout(() => {
            activityText.classList.remove('active');
        }, 500);
    }

    /**
     * MIDI event handlers
     */
    onMIDIReady(event) {
        console.log('🎹 V3 MIDI Ready:', event.detail);
        this.updateMIDIStatus('connected');
        this.updateDeviceList();
    }

    onMIDIError(event) {
        const code = event.detail?.code;
        const expectedUnavailable = code === 'PERMISSION_DENIED' || code === 'NOT_SUPPORTED';
        const log = expectedUnavailable ? console.warn : console.error;
        log('🎹 V3 MIDI Error:', event.detail);
        this.updateMIDIStatus('error');
        this.showToast(`MIDI Error: ${event.detail.message}`, expectedUnavailable ? 'warning' : 'error');
    }

    onMIDIDeviceChange(event) {
        console.log('🎹 V3 Device Change:', event.detail);
        this.updateDeviceList();
        
        if (event.detail.action === 'connected') {
            this.showToast(`Connected: ${event.detail.device.name}`, 'success');
        } else {
            this.showToast(`Disconnected: ${event.detail.device.name}`, 'warning');
        }
    }

    onMIDIMappingLearned(event) {
        const { mapping, target } = event.detail;
        this.showToast(`Learned: ${target.name}`, 'success');
        this.stopMIDILearn();
    }

    /**
     * Update MIDI status indicators
     */
    updateMIDIStatus(status) {
        const statusDot = document.getElementById('midiStatusDot');
        const statusText = document.getElementById('midiStatusText');
        
        statusDot?.classList.remove('connected');
        
        switch (status) {
            case 'connected':
                statusDot?.classList.add('connected');
                statusText.textContent = 'CONNECTED';
                break;
            case 'error':
                statusText.textContent = 'ERROR';
                break;
            default:
                statusText.textContent = 'NO.DEV';
        }
    }

    /**
     * Update device list
     */
    updateDeviceList() {
        const deviceSelect = document.getElementById('midiDeviceSelect');
        if (!deviceSelect || !this.midiController) return;
        
        const devices = this.midiController.getDevices ? this.midiController.getDevices() : { inputs: [] };
        
        // Clear existing options
        deviceSelect.innerHTML = '<option value="">SELECT.DEVICE</option>';
        
        // Add input devices
        if (devices.inputs) {
            devices.inputs.forEach(device => {
                const option = document.createElement('option');
                option.value = device.id;
                option.textContent = device.name.length > 15 
                    ? device.name.substring(0, 12) + '...'
                    : device.name.toUpperCase();
                deviceSelect.appendChild(option);
            });
        }
        
        // Update status
        const statusText = document.getElementById('midiStatusText');
        if (devices.inputs && devices.inputs.length > 0) {
            statusText.textContent = `${devices.inputs.length}.DEV`;
            this.updateMIDIStatus('connected');
        } else {
            this.updateMIDIStatus('disconnected');
        }
    }

    /**
     * Utility methods
     */
    selectMIDIDevice(deviceId) {
        if (this.midiController && this.midiController.selectDevice) {
            this.midiController.selectDevice(deviceId);
        }
    }

    loadMIDIPreset() {
        this.showToast('Preset loading not implemented in V3', 'warning');
    }

    clearAllMappings() {
        if (!confirm('Clear all MIDI mappings?')) return;
        
        if (this.midiController && this.midiController.clearMappings) {
            this.midiController.clearMappings();
        }
        
        this.showToast('All mappings cleared', 'success');
    }

    toggleMIDIDebug() {
        const debugBtn = document.getElementById('midiDebugBtn');
        const isDebugOn = debugBtn.textContent === 'DEBUG.ON';
        
        debugBtn.textContent = isDebugOn ? 'DEBUG' : 'DEBUG.ON';
        debugBtn.style.background = isDebugOn ? '#333' : '#00ff85';
        debugBtn.style.color = isDebugOn ? '#00ff85' : '#000';
        
        if (this.midiController) {
            this.midiController.debugMode = !isDebugOn;
        }
        
        this.showToast(`Debug mode: ${isDebugOn ? 'OFF' : 'ON'}`, 'info');
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `v3-toast v3-toast-${type}`;
        toast.textContent = message;
        
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '8px 12px',
            borderRadius: '3px',
            color: '#fff',
            fontSize: '11px',
            fontWeight: '700',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
        });
        
        switch (type) {
            case 'success':
                toast.style.background = '#00ff85';
                toast.style.color = '#000';
                break;
            case 'error':
                toast.style.background = '#ff4444';
                break;
            case 'warning':
                toast.style.background = '#ff9900';
                break;
            default:
                toast.style.background = '#333';
        }
        
        document.body.appendChild(toast);
        
        this.scheduleFrame(() => {
            toast.style.transform = 'translateX(0)';
        });
        
        this.scheduleTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            this.scheduleTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
        this.abortController.abort();
        this.timeoutIds.forEach(id => window.clearTimeout(id));
        this.timeoutIds.clear();
        this.rafIds.forEach(id => window.cancelAnimationFrame(id));
        this.rafIds.clear();
        this.midiLearnTimeout = null;
        this.midiLearnTarget?.element?.classList?.remove('learn-target-indicator');
        this.midiController?.stopLearn?.();
        document.querySelectorAll('.v3-toast, .v3-ripple').forEach(node => node.remove());
        this.initialized = false;
        if (window.controlPanelV3 === this) window.controlPanelV3 = null;
    }
}

// Add ripple animation styles
if (!document.getElementById('control-panel-v3-runtime-styles')) {
    const style = document.createElement('style');
    style.id = 'control-panel-v3-runtime-styles';
    style.textContent = `
    @keyframes rippleEffect {
        from {
            width: 4px;
            height: 4px;
            opacity: 1;
        }
        to {
            width: 100px;
            height: 100px;
            opacity: 0;
        }
    }
`;
    document.head.appendChild(style);
}

const initializeControlPanelV3 = () => {
    window.controlPanelV3?.destroy?.();
    window.controlPanelV3 = new ControlPanelV3();
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeControlPanelV3, { once: true });
} else {
    initializeControlPanelV3();
}

// Export for use in other modules
export default ControlPanelV3;
