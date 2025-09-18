// VJ Control Panel for 3886 Records
// Cross-tab communication via BroadcastChannel API

import safePerformanceMonitor from './safe-performance-monitor.js';

class VJControlPanel {
    constructor() {
        this.channel = null;
        this.isConnected = false;
        this.currentScene = 'auto';
        this.tapTimes = [];
        this.currentBPM = 120;
        this.presets = this.loadPresets();
        this.currentPreset = null;
        this.performanceMode = 'auto';
        this.sequenceData = [];
        this.isRecording = false;
        this.isPlaying = false;

        this.init();
    }

    init() {
        // Initialize BroadcastChannel
        this.initBroadcastChannel();

        // Initialize controls
        this.initSceneControls();
        this.initColorControls();
        this.initSpeedControls();
        this.initEffectsControls();
        this.initTriggerControls();
        this.initPresetControls();
        this.initPerformanceControls();
        this.initTimelineControls();

        // Initialize emergency stop
        this.initEmergencyStop();

        // Start monitoring
        this.startMonitoring();

        // Initialize performance monitor UI on control panel
        this.initPerformanceMonitor();

        console.log('🎛️ VJ Control Panel initialized');
    }

    initBroadcastChannel() {
        try {
            // Create broadcast channel
            this.channel = new BroadcastChannel('3886_vj_control');

            // Listen for messages from main site
            this.channel.onmessage = (event) => {
                this.handleMessage(event.data);
            };

            // Send initial connection ping
            this.sendMessage({
                type: 'control_connect',
                timestamp: Date.now()
            });

            // Set connection status
            this.setConnectionStatus(true);

            // Ping every 5 seconds to maintain connection
            setInterval(() => {
                this.sendMessage({
                    type: 'ping',
                    timestamp: Date.now()
                });
            }, 5000);

        } catch (error) {
            console.error('Failed to initialize BroadcastChannel:', error);
            this.setConnectionStatus(false);

            // Fallback to localStorage events
            this.initLocalStorageFallback();
        }
    }

    initLocalStorageFallback() {
        console.log('Using localStorage fallback for cross-tab communication');

        // Listen for storage events
        window.addEventListener('storage', (e) => {
            if (e.key === '3886_vj_message') {
                const data = JSON.parse(e.newValue);
                this.handleMessage(data);
            }
        });

        // Override sendMessage for localStorage
        this.sendMessage = (data) => {
            localStorage.setItem('3886_vj_message', JSON.stringify({
                ...data,
                timestamp: Date.now()
            }));
        };

        // Send initial connection
        this.sendMessage({
            type: 'control_connect',
            timestamp: Date.now()
        });
    }

    sendMessage(data) {
        if (this.channel) {
            this.channel.postMessage(data);
        }
    }

    handleMessage(data) {
        switch(data.type) {
            case 'pong':
                this.setConnectionStatus(true);
                break;

            case 'performance_update':
                this.updatePerformanceMonitor(data);
                break;

            case 'scene_changed':
                this.updateSceneButtons(data.scene);
                break;

            case 'settings_sync':
                this.syncSettings(data.settings);
                break;
        }
    }

    setConnectionStatus(connected) {
        this.isConnected = connected;
        const statusEl = document.getElementById('connectionStatus');
        const dot = statusEl.querySelector('.status-dot');
        const text = statusEl.querySelector('.status-text');

        if (connected) {
            dot.classList.add('connected');
            text.textContent = 'CONNECTED';
        } else {
            dot.classList.remove('connected');
            text.textContent = 'DISCONNECTED';
        }
    }

    // Scene Controls
    initSceneControls() {
        const sceneButtons = document.querySelectorAll('.scene-btn');

        sceneButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const scene = btn.dataset.scene;
                this.setScene(scene);

                // Update active state
                sceneButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    setScene(scene) {
        this.currentScene = scene;

        this.sendMessage({
            type: 'scene_change',
            scene: scene,
            timestamp: Date.now()
        });

        // Add visual feedback
        this.flashButton(event.target);
    }

    updateSceneButtons(scene) {
        const sceneButtons = document.querySelectorAll('.scene-btn');
        sceneButtons.forEach(btn => {
            if (btn.dataset.scene === scene) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // Color Controls
    initColorControls() {
        const colorSliders = {
            hue: document.getElementById('hueSlider'),
            saturation: document.getElementById('saturationSlider'),
            brightness: document.getElementById('brightnessSlider'),
            contrast: document.getElementById('contrastSlider')
        };

        Object.entries(colorSliders).forEach(([key, slider]) => {
            if (!slider) return;

            const valueDisplay = slider.parentElement.querySelector('.slider-value');

            slider.addEventListener('input', () => {
                const value = slider.value;

                // Update display
                switch(key) {
                    case 'hue':
                        valueDisplay.textContent = `${value}°`;
                        break;
                    default:
                        valueDisplay.textContent = `${value}%`;
                }

                // Send update
                this.sendMessage({
                    type: 'color_update',
                    parameter: key,
                    value: value,
                    timestamp: Date.now()
                });
            });
        });

        // Reset button
        const resetBtn = document.getElementById('resetColors');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                colorSliders.hue.value = 0;
                colorSliders.saturation.value = 100;
                colorSliders.brightness.value = 100;
                colorSliders.contrast.value = 100;

                // Update displays
                this.updateSliderDisplays();

                // Send reset
                this.sendMessage({
                    type: 'color_reset',
                    timestamp: Date.now()
                });

                this.flashButton(resetBtn);
            });
        }
    }

    // Speed Controls
    initSpeedControls() {
        const speedSlider = document.getElementById('speedSlider');
        const phaseDurationSlider = document.getElementById('phaseDurationSlider');

        if (speedSlider) {
            const valueDisplay = speedSlider.parentElement.querySelector('.slider-value');

            speedSlider.addEventListener('input', () => {
                const value = speedSlider.value;
                valueDisplay.textContent = `${value}%`;

                this.sendMessage({
                    type: 'speed_update',
                    value: value / 100,
                    timestamp: Date.now()
                });
            });
        }

        if (phaseDurationSlider) {
            const valueDisplay = phaseDurationSlider.parentElement.querySelector('.slider-value');

            phaseDurationSlider.addEventListener('input', () => {
                const value = phaseDurationSlider.value;
                valueDisplay.textContent = `${value}s`;

                this.sendMessage({
                    type: 'phase_duration_update',
                    value: value * 1000, // Convert to milliseconds
                    timestamp: Date.now()
                });
            });
        }

        // BPM Tap
        const tapBtn = document.getElementById('tapBPM');
        const bpmDisplay = document.querySelector('.bpm-value');

        if (tapBtn) {
            tapBtn.addEventListener('click', () => {
                this.tapBPM();
                bpmDisplay.textContent = Math.round(this.currentBPM);
                this.flashButton(tapBtn);
            });
        }
    }

    tapBPM() {
        const now = Date.now();

        // Add current tap time
        this.tapTimes.push(now);

        // Keep only last 8 taps
        if (this.tapTimes.length > 8) {
            this.tapTimes.shift();
        }

        // Calculate BPM if we have at least 2 taps
        if (this.tapTimes.length >= 2) {
            const intervals = [];
            for (let i = 1; i < this.tapTimes.length; i++) {
                intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
            }

            const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
            this.currentBPM = 60000 / avgInterval; // Convert to BPM

            // Send BPM update
            this.sendMessage({
                type: 'bpm_update',
                bpm: this.currentBPM,
                timestamp: Date.now()
            });
        }

        // Clear taps if more than 3 seconds since last tap
        clearTimeout(this.tapTimeout);
        this.tapTimeout = setTimeout(() => {
            this.tapTimes = [];
        }, 3000);
    }

    // Effects Controls
    initEffectsControls() {
        const effectSliders = {
            glitch: document.getElementById('glitchSlider'),
            particles: document.getElementById('particlesSlider'),
            distortion: document.getElementById('distortionSlider'),
            noise: document.getElementById('noiseSlider')
        };

        Object.entries(effectSliders).forEach(([key, slider]) => {
            if (!slider) return;

            const valueDisplay = slider.parentElement.querySelector('.slider-value');

            slider.addEventListener('input', () => {
                const value = slider.value;
                valueDisplay.textContent = `${value}%`;

                this.sendMessage({
                    type: 'effect_intensity',
                    effect: key,
                    value: value / 100,
                    timestamp: Date.now()
                });
            });
        });
    }

    // Trigger Controls
    initTriggerControls() {
        const triggerButtons = document.querySelectorAll('.trigger-btn');

        triggerButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const effect = btn.dataset.effect;

                this.sendMessage({
                    type: 'trigger_effect',
                    effect: effect,
                    timestamp: Date.now()
                });

                this.flashButton(btn);

                // Record if in recording mode
                if (this.isRecording) {
                    this.recordEvent('trigger', effect);
                }
            });
        });
    }

    // Preset Controls
    initPresetControls() {
        const presetButtons = document.querySelectorAll('.preset-btn');
        const saveBtn = document.querySelector('.save-preset-btn');
        const loadBtn = document.querySelector('.load-preset-btn');

        presetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const presetId = btn.dataset.preset;

                // Update active state
                presetButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                this.currentPreset = presetId;
            });
        });

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                if (this.currentPreset) {
                    this.savePreset(this.currentPreset);
                    this.flashButton(saveBtn);
                }
            });
        }

        if (loadBtn) {
            loadBtn.addEventListener('click', () => {
                if (this.currentPreset && this.presets[this.currentPreset]) {
                    this.loadPreset(this.currentPreset);
                    this.flashButton(loadBtn);
                }
            });
        }
    }

    savePreset(id) {
        // Gather current settings
        const preset = {
            hue: document.getElementById('hueSlider').value,
            saturation: document.getElementById('saturationSlider').value,
            brightness: document.getElementById('brightnessSlider').value,
            contrast: document.getElementById('contrastSlider').value,
            speed: document.getElementById('speedSlider').value,
            phaseDuration: document.getElementById('phaseDurationSlider').value,
            glitch: document.getElementById('glitchSlider').value,
            particles: document.getElementById('particlesSlider').value,
            distortion: document.getElementById('distortionSlider').value,
            noise: document.getElementById('noiseSlider').value,
            scene: this.currentScene
        };

        this.presets[id] = preset;

        // Save to localStorage
        localStorage.setItem('3886_vj_presets', JSON.stringify(this.presets));

        console.log(`💾 Preset ${id} saved`);
    }

    loadPreset(id) {
        const preset = this.presets[id];
        if (!preset) return;

        // Apply preset values
        document.getElementById('hueSlider').value = preset.hue;
        document.getElementById('saturationSlider').value = preset.saturation;
        document.getElementById('brightnessSlider').value = preset.brightness;
        document.getElementById('contrastSlider').value = preset.contrast;
        document.getElementById('speedSlider').value = preset.speed;
        document.getElementById('phaseDurationSlider').value = preset.phaseDuration;
        document.getElementById('glitchSlider').value = preset.glitch;
        document.getElementById('particlesSlider').value = preset.particles;
        document.getElementById('distortionSlider').value = preset.distortion;
        document.getElementById('noiseSlider').value = preset.noise;

        // Update displays
        this.updateSliderDisplays();

        // Send preset to main site
        this.sendMessage({
            type: 'preset_load',
            preset: preset,
            timestamp: Date.now()
        });

        // Set scene
        if (preset.scene) {
            this.setScene(preset.scene);
        }

        console.log(`📂 Preset ${id} loaded`);
    }

    loadPresets() {
        const saved = localStorage.getItem('3886_vj_presets');
        return saved ? JSON.parse(saved) : {};
    }

    // Performance Controls
    initPerformanceControls() {
        const perfButtons = document.querySelectorAll('.perf-btn');

        perfButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;

                this.sendMessage({
                    type: 'performance_mode',
                    mode: mode,
                    timestamp: Date.now()
                });

                // Update active state
                perfButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                this.performanceMode = mode;
                document.getElementById('modeDisplay').textContent = mode.toUpperCase();

                this.flashButton(btn);
            });
        });
    }

    // Timeline Controls
    initTimelineControls() {
        const playBtn = document.getElementById('playSequence');
        const stopBtn = document.getElementById('stopSequence');
        const recordBtn = document.getElementById('recordSequence');

        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.playSequence();
                this.flashButton(playBtn);
            });
        }

        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.stopSequence();
                this.flashButton(stopBtn);
            });
        }

        if (recordBtn) {
            recordBtn.addEventListener('click', () => {
                this.toggleRecording();
                this.flashButton(recordBtn);
            });
        }

        // Initialize timeline canvas
        this.initTimelineCanvas();
    }

    initTimelineCanvas() {
        const canvas = document.getElementById('timeline');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Style the timeline
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        ctx.strokeStyle = 'rgba(0, 255, 133, 0.1)';
        ctx.lineWidth = 1;

        // Vertical lines (time markers)
        for (let x = 0; x <= canvas.width; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }

        // Horizontal line (center)
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
    }

    toggleRecording() {
        this.isRecording = !this.isRecording;
        const recordBtn = document.getElementById('recordSequence');

        if (this.isRecording) {
            recordBtn.style.background = '#ff0000';
            recordBtn.style.color = '#fff';
            this.sequenceData = [];
            this.recordingStartTime = Date.now();
            console.log('🔴 Recording started');
        } else {
            recordBtn.style.background = '';
            recordBtn.style.color = '';
            console.log('⏹️ Recording stopped', this.sequenceData);
        }
    }

    recordEvent(type, data) {
        if (!this.isRecording) return;

        const timestamp = Date.now() - this.recordingStartTime;
        this.sequenceData.push({
            timestamp,
            type,
            data
        });

        // Draw on timeline
        this.drawTimelineEvent(timestamp, type);
    }

    drawTimelineEvent(timestamp, type) {
        const canvas = document.getElementById('timeline');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const x = (timestamp / 60000) * canvas.width; // 1 minute = full width
        const y = canvas.height / 2;

        // Choose color based on type
        const colors = {
            trigger: '#ff0088',
            scene: '#00ff85',
            color: '#00ffff',
            speed: '#ffff00'
        };

        ctx.fillStyle = colors[type] || '#ffffff';
        ctx.fillRect(x, y - 2, 2, 4);
    }

    playSequence() {
        if (this.sequenceData.length === 0) return;

        this.isPlaying = true;
        const playBtn = document.getElementById('playSequence');
        playBtn.style.background = '#00ff00';

        console.log('▶️ Playing sequence');

        // Play each event at its recorded time
        this.sequenceData.forEach(event => {
            setTimeout(() => {
                if (!this.isPlaying) return;

                // Send the recorded event
                this.sendMessage({
                    ...event,
                    type: 'sequence_event',
                    originalType: event.type
                });
            }, event.timestamp);
        });
    }

    stopSequence() {
        this.isPlaying = false;
        const playBtn = document.getElementById('playSequence');
        playBtn.style.background = '';

        console.log('⏹️ Sequence stopped');
    }

    // Emergency Stop
    initEmergencyStop() {
        const emergencyBtn = document.getElementById('emergencyStop');

        if (emergencyBtn) {
            emergencyBtn.addEventListener('click', () => {
                this.sendMessage({
                    type: 'emergency_stop',
                    timestamp: Date.now()
                });

                // Reset all controls
                this.resetAllControls();

                console.log('🚨 EMERGENCY STOP ACTIVATED');
            });
        }
    }

    resetAllControls() {
        // Reset sliders
        document.getElementById('hueSlider').value = 0;
        document.getElementById('saturationSlider').value = 100;
        document.getElementById('brightnessSlider').value = 100;
        document.getElementById('contrastSlider').value = 100;
        document.getElementById('speedSlider').value = 100;
        document.getElementById('glitchSlider').value = 50;
        document.getElementById('particlesSlider').value = 50;
        document.getElementById('distortionSlider').value = 50;
        document.getElementById('noiseSlider').value = 50;

        // Update displays
        this.updateSliderDisplays();

        // Stop any sequences
        this.stopSequence();
        this.isRecording = false;
    }

    // Monitoring
    startMonitoring() {
        // Request performance data periodically
        setInterval(() => {
            this.sendMessage({
                type: 'request_performance',
                timestamp: Date.now()
            });
        }, 1000);
    }

    updatePerformanceMonitor(data) {
        if (data.fps !== undefined) {
            document.getElementById('fpsDisplay').textContent = Math.round(data.fps);
        }

        if (data.cpu !== undefined) {
            document.getElementById('cpuDisplay').textContent = `${Math.round(data.cpu)}%`;
        }

        if (data.activeFx !== undefined) {
            document.getElementById('activeFxDisplay').textContent = data.activeFx;
        }
    }

    // Utility Functions
    updateSliderDisplays() {
        document.querySelectorAll('.control-slider').forEach(slider => {
            const valueDisplay = slider.parentElement.querySelector('.slider-value');
            if (!valueDisplay) return;

            const value = slider.value;

            if (slider.id === 'hueSlider') {
                valueDisplay.textContent = `${value}°`;
            } else if (slider.id === 'phaseDurationSlider') {
                valueDisplay.textContent = `${value}s`;
            } else {
                valueDisplay.textContent = `${value}%`;
            }
        });
    }

    flashButton(btn) {
        if (!btn) return;

        const originalBg = btn.style.background;
        const originalColor = btn.style.color;

        btn.style.background = '#fff';
        btn.style.color = '#000';

        setTimeout(() => {
            btn.style.background = originalBg;
            btn.style.color = originalColor;
        }, 100);
    }

    syncSettings(settings) {
        // Sync settings from main site
        if (settings.colors) {
            document.getElementById('hueSlider').value = settings.colors.hue || 0;
            document.getElementById('saturationSlider').value = settings.colors.saturation || 100;
            document.getElementById('brightnessSlider').value = settings.colors.brightness || 100;
            document.getElementById('contrastSlider').value = settings.colors.contrast || 100;
        }

        this.updateSliderDisplays();
    }

    // Initialize performance monitor for control panel
    initPerformanceMonitor() {
        // Enhance existing performance section
        const existingSection = document.querySelector('.monitor-section');
        if (!existingSection) return;

        // Add new stats to existing monitor display
        const monitorDisplay = existingSection.querySelector('.monitor-display');
        if (monitorDisplay) {
            // Add memory and DOM stats
            const newStats = `
                <div class="monitor-stat">
                    <label>Memory</label>
                    <span id="memory-display">-- MB</span>
                </div>
                <div class="monitor-stat">
                    <label>DOM Nodes</label>
                    <span id="dom-nodes-display">--</span>
                </div>
                <div class="monitor-stat">
                    <label>Managed Elements</label>
                    <span id="managed-elements-display">--</span>
                </div>
                <div class="monitor-stat">
                    <label>GSAP Animations</label>
                    <span id="animations-display">--</span>
                </div>
            `;
            monitorDisplay.insertAdjacentHTML('beforeend', newStats);
        }

        // Add performance alerts below existing controls
        const performanceControls = existingSection.querySelector('.performance-controls');
        if (performanceControls) {
            const alertsAndActions = `
                <div id="performance-alerts" style="margin-top: 15px;">
                    <h3 style="color: #00ff85; font-size: 12px; margin-bottom: 8px; border-bottom: 1px solid rgba(0, 255, 133, 0.2); padding-bottom: 4px;">Recent Alerts</h3>
                    <div id="alerts-list" style="max-height: 60px; overflow-y: auto; font-size: 10px; margin-bottom: 10px;">No recent alerts</div>
                </div>
                <div class="performance-actions" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <button class="perf-btn optimize-btn" onclick="window.vjControl.triggerOptimization()">OPTIMIZE</button>
                    <button class="perf-btn emergency-btn" onclick="window.vjControl.triggerEmergency()">EMERGENCY</button>
                </div>
            `;
            performanceControls.insertAdjacentHTML('afterend', alertsAndActions);
        }

        // Start performance monitoring updates
        this.startPerformanceUpdates();
    }

    startPerformanceUpdates() {
        setInterval(() => {
            this.updatePerformanceDisplay();
        }, 1000); // Update every second
    }

    updatePerformanceDisplay() {
        try {
            // Get performance data from the monitor (handle cross-tab access)
            const report = this.getPerformanceReport();
            
            // Update existing FPS display
            const existingFpsDisplay = document.getElementById('fpsDisplay');
            if (existingFpsDisplay && report.fps) {
                existingFpsDisplay.textContent = Math.round(report.fps.current || 0);
            }

            // Update memory
            const memoryDisplay = document.getElementById('memory-display');
            if (memoryDisplay && report.memory) {
                memoryDisplay.textContent = report.memory.formatted || '-- MB';
            }

            // Update DOM nodes
            const domNodesDisplay = document.getElementById('dom-nodes-display');
            if (domNodesDisplay && report.dom) {
                domNodesDisplay.textContent = report.dom.totalNodes || '--';
            }

            // Update managed elements
            const managedElementsDisplay = document.getElementById('managed-elements-display');
            if (managedElementsDisplay && report.dom) {
                managedElementsDisplay.textContent = report.dom.managedElements || '--';
            }

            // Update animations
            const animationsDisplay = document.getElementById('animations-display');
            if (animationsDisplay && report.animations) {
                animationsDisplay.textContent = report.animations.total || '--';
            }

            // Update existing active FX display
            const existingActiveFx = document.getElementById('activeFxDisplay');
            if (existingActiveFx && report.animations) {
                existingActiveFx.textContent = report.animations.total || 0;
            }

            // Update alerts
            const alertsList = document.getElementById('alerts-list');
            if (alertsList && report.alerts && report.alerts.recent.length > 0) {
                alertsList.innerHTML = report.alerts.recent.slice(-5).reverse().map(alert => `
                    <div style="color: ${alert.level === 'critical' ? '#ff4444' : '#ffaa00'}; margin-bottom: 2px; font-size: 10px;">
                        ${alert.category}: ${alert.message} ${alert.count > 1 ? `(x${alert.count})` : ''}
                    </div>
                `).join('');
            } else if (alertsList) {
                alertsList.innerHTML = '<div style="color: #888; font-size: 10px;">No recent alerts</div>';
            }
        } catch (error) {
            console.warn('Performance display update failed:', error);
        }
    }

    getPerformanceReport() {
        // Try to get performance data via cross-tab communication
        this.sendMessage({
            type: 'request_performance_detailed',
            timestamp: Date.now()
        });
        
        // Try to get performance data from safe monitor
        if (window.safePerformanceMonitor) {
            const basicReport = window.safePerformanceMonitor.getReport();
            
            // Get cross-tab performance data from main window
            let animations = '--';
            let managedElements = '--';
            let intervals = '--';
            
            // Request data from main window via message
            try {
                // Send request for detailed performance data
                this.sendMessage({
                    type: 'get_performance_stats',
                    timestamp: Date.now()
                });
                
                // Use cached data if available
                if (this.lastPerformanceData) {
                    animations = this.lastPerformanceData.animations || '--';
                    managedElements = this.lastPerformanceData.managedElements || '--';
                    intervals = this.lastPerformanceData.intervals || '--';
                }
            } catch (error) {
                console.warn('Could not get cross-tab performance data:', error);
            }
            
            const enhancedReport = {
                ...basicReport,
                animations: { total: animations },
                dom: {
                    ...basicReport.dom,
                    managedElements: managedElements
                },
                intervals: { total: intervals }
            };
            
            return enhancedReport;
        }
        
        // Fallback to basic metrics
        return {
            fps: { current: 0 },
            memory: { formatted: '-- MB' },
            dom: { totalNodes: 0 },
            animations: { total: '--' },
            intervals: { total: '--' },
            timestamp: new Date()
        };
    }

    triggerOptimization() {
        // Send optimization request to main site
        this.sendMessage({
            type: 'safe_cleanup',
            timestamp: Date.now()
        });
        
        if (window.safePerformanceMonitor) {
            window.safePerformanceMonitor.safeCleanup();
        }
        
        this.flashButton(document.querySelector('.optimize-btn'));
        console.log('🧹 Safe cleanup triggered from control panel');
    }

    triggerEmergency() {
        // Send emergency brake to main site
        this.sendMessage({
            type: 'emergency_brake',
            timestamp: Date.now()
        });
        
        if (window.safePerformanceMonitor) {
            window.safePerformanceMonitor.emergencyBrake();
        }
        
        this.flashButton(document.querySelector('.emergency-btn'));
        console.log('🚨 Emergency brake triggered from control panel');
    }
}

// Initialize control panel when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.vjControl = new VJControlPanel();
    });
} else {
    window.vjControl = new VJControlPanel();
}

export default VJControlPanel;