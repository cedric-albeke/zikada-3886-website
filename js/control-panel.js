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
        this.animeStatus = { enabled: false, lastAction: 'status' };

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
        this.initAnimeControls();

        // Initialize system reset
        this.initSystemReset();

        // Start monitoring
        this.startMonitoring();

        // Initialize performance monitor UI on control panel
        this.initPerformanceMonitor();

        console.log('🎛️ VJ Control Panel initialized');
    }

    initBroadcastChannel() {
        // Always use localStorage for reliable cross-tab communication
        console.log('🔄 Using localStorage for cross-tab communication');
        this.initLocalStorageFallback();

        // Still try BroadcastChannel as backup
        try {
            this.channel = new BroadcastChannel('3886_vj_control');
            this.channel.addEventListener('message', (event) => {
                console.log('📨 BC: Control Panel received:', event.data.type);
                this.handleMessage(event.data);
            });
        } catch (error) {
            console.log('BroadcastChannel not available, using localStorage only');
        }
    }

    initLocalStorageFallback() {
        // Listen for responses from main site
        window.addEventListener('storage', (e) => {
            if (e.key === '3886_vj_response') {
                try {
                    const data = JSON.parse(e.newValue);
                    console.log('📨 LS: Control Panel received:', data.type);
                    this.handleMessage(data);
                } catch (err) {
                    console.error('Failed to parse storage message:', err);
                }
            }
        });

        // Send initial connection
        this.sendMessage({
            type: 'control_connect',
            timestamp: Date.now()
        });

        // Set connection status
        this.setConnectionStatus(true);

        // Ping every 5 seconds
        setInterval(() => {
            this.sendMessage({
                type: 'ping',
                timestamp: Date.now()
            });
        }, 5000);
    }

    sendMessage(data) {
        const messageData = {
            ...data,
            timestamp: Date.now(),
            _id: Math.random().toString(36).substr(2, 9)
        };

        // Always use localStorage for reliability
        console.log('📤 Control Panel sending via LS:', messageData.type);
        localStorage.setItem('3886_vj_message', JSON.stringify(messageData));

        // Also try BroadcastChannel if available
        if (this.channel) {
            try {
                this.channel.postMessage(messageData);
            } catch (err) {
                // Ignore BC errors, localStorage is primary
            }
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

            case 'performance_mode_updated':
                this.applyPerformanceMode(data.mode);
                break;

            case 'anime_status':
                console.log('📊 Processing anime_status:', data);
                this.applyAnimeStatus(data);
                break;

            case 'detailed_performance_update':
                this.updateDetailedPerformanceData(data);
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

        // Set AUTO as default active scene
        const autoButton = document.querySelector('[data-scene="auto"]');
        if (autoButton) {
            autoButton.classList.add('active');
            this.currentScene = 'auto';
        }

        sceneButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const scene = btn.dataset.scene;

                // Always do normal scene switching
                this.setScene(scene, btn);

                // Update active state
                sceneButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Clear auto-active indicators when switching away from auto
                if (scene !== 'auto') {
                    sceneButtons.forEach(b => b.classList.remove('auto-active'));
                    this.currentActiveAutoScene = null;
                }
            });
        });

        // Start auto scene rotation tracking if in auto mode
        this.startAutoSceneTracking();

        // Add test simulator for AUTO mode (for development)
        this.startAutoModeSimulator();
    }

    setScene(scene, btn = null) {
        const wasInAutoMode = this.currentScene === 'auto';
        this.currentScene = scene;

        // Clear auto indicator and interval if switching away from auto
        if (scene !== 'auto') {
            this.updateAutoSceneIndicator(null);
            this.currentActiveAutoScene = null;

            // Stop auto mode interval
            if (this.autoModeInterval) {
                clearInterval(this.autoModeInterval);
                this.autoModeInterval = null;
            }
        } else if (scene === 'auto' && !wasInAutoMode) {
            // Starting auto mode - restart the simulator
            this.startAutoModeSimulator();
        }

        this.sendMessage({
            type: 'scene_change',
            scene: scene,
            timestamp: Date.now(),
            autoMode: scene === 'auto'
        });

        // Add visual feedback if the initiating button is known
        if (btn) {
            this.flashButton(btn);
        }
    }

    updateSceneButtons(scene) {
        // This method is called when receiving scene updates from the main site
        console.log(`🎬 Scene update received: ${scene}, current mode: ${this.currentScene}`);

        // Always clear existing auto-active indicators first
        const sceneButtons = document.querySelectorAll('.scene-btn');
        sceneButtons.forEach(btn => btn.classList.remove('auto-active'));

        // If we're in auto mode, show the active scene with auto-active indicator
        if (this.currentScene === 'auto' && scene !== 'auto') {
            this.currentActiveAutoScene = scene;
            this.updateAutoSceneIndicator(scene);

            // Ensure AUTO button stays active
            const autoBtn = document.querySelector('[data-scene="auto"]');
            sceneButtons.forEach(b => b.classList.remove('active'));
            if (autoBtn) autoBtn.classList.add('active');
        } else if (this.currentScene !== 'auto') {
            // Normal mode - update active button
            sceneButtons.forEach(btn => {
                if (btn.dataset.scene === scene) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }
    }

    startAutoSceneTracking() {
        // Track which scene is active when in auto mode
        this.currentActiveAutoScene = null;
    }

    startAutoModeSimulator() {
        // Clear existing interval first
        if (this.autoModeInterval) {
            clearInterval(this.autoModeInterval);
            this.autoModeInterval = null;
        }

        // Real auto scene rotation that sends actual scene changes
        const scenes = ['intense', 'calm', 'glitch', 'techno', 'matrix', 'minimal', 'chaotic', 'retro'];
        let currentIndex = 0;

        console.log(`🎬 Starting auto mode simulator with ${this.getAutoModeInterval()}ms interval`);

        this.autoModeInterval = setInterval(() => {
            if (this.currentScene === 'auto') {
                const nextScene = scenes[currentIndex % scenes.length];
                console.log(`🎲 Auto mode: actually switching to ${nextScene}`);

                // Send actual scene change message (not just visual update)
                this.sendMessage({
                    type: 'scene_change',
                    scene: nextScene,
                    timestamp: Date.now(),
                    autoMode: true
                });

                // Update visual indicator
                this.updateSceneButtons(nextScene);
                currentIndex++;
            } else {
                console.log('⏸️ Auto mode paused - not in auto scene');
            }
        }, this.getAutoModeInterval());

        // Update interval when phase duration changes
        this.updateAutoModeInterval();
    }

    getAutoModeInterval() {
        // Get phase duration from the tempo slider (convert seconds to milliseconds)
        const phaseDurationSlider = document.getElementById('phaseDurationSlider');
        const phaseDuration = phaseDurationSlider ? parseInt(phaseDurationSlider.value) : 30;
        return phaseDuration * 1000;
    }

    updateAutoModeInterval() {
        // Watch for changes to phase duration
        const phaseDurationSlider = document.getElementById('phaseDurationSlider');
        if (phaseDurationSlider) {
            phaseDurationSlider.addEventListener('input', () => {
                if (this.autoModeInterval) {
                    clearInterval(this.autoModeInterval);
                    this.startAutoModeSimulator();
                }
            });
        }
    }

    updateAutoSceneIndicator(activeScene) {
        console.log(`🎯 Updating auto scene indicator: ${activeScene}`);

        // Remove any existing auto-active indicators
        const sceneButtons = document.querySelectorAll('.scene-btn');
        sceneButtons.forEach(btn => {
            btn.classList.remove('auto-active');
        });

        // Only add indicator if we're in auto mode and have a valid scene
        if (this.currentScene === 'auto' && activeScene && activeScene !== 'auto') {
            const activeBtn = document.querySelector(`[data-scene="${activeScene}"]`);
            if (activeBtn) {
                activeBtn.classList.add('auto-active');
                console.log(`✅ Auto-active class added to ${activeScene}`);
            } else {
                console.warn(`❌ Scene button not found for: ${activeScene}`);
            }
        }
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
            // REMOVED: distortion slider - now handled automatically at 0
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
            // REMOVED: distortion preset handling
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
        // REMOVED: distortion preset loading
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
        const perfButtons = document.querySelectorAll('.perf-btn[data-mode]');

        // Set AUTO as default performance mode
        const autoModeBtn = document.querySelector('[data-mode="auto"]');
        if (autoModeBtn) {
            autoModeBtn.classList.add('active');
            this.performanceMode = 'auto';
            const modeDisplay = document.getElementById('modeDisplay');
            if (modeDisplay) {
                modeDisplay.textContent = 'AUTO';
            }
        }

        perfButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;

                this.sendMessage({
                    type: 'performance_mode',
                    mode: mode,
                    timestamp: Date.now()
                });

                this.applyPerformanceMode(mode);
                this.flashButton(btn);
            });
        });
    }

    applyPerformanceMode(mode) {
        if (!mode) return;

        this.performanceMode = mode;

        const perfButtons = document.querySelectorAll('.perf-btn');
        perfButtons.forEach(b => {
            if (b.dataset.mode === mode) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });

        const modeDisplay = document.getElementById('modeDisplay');
        if (modeDisplay) {
            modeDisplay.textContent = (mode || '').toUpperCase();
        }
    }

    initAnimeControls() {
        const enableBtn = document.getElementById('animeEnable');
        const disableBtn = document.getElementById('animeDisable');
        const killBtn = document.getElementById('animeKill');
        const statusValue = document.getElementById('animeStatus');

        if (statusValue) {
            statusValue.dataset.waiting = '0';
        }

        const setBusy = (busy) => {
            if (!statusValue) return;
            statusValue.dataset.waiting = busy ? '1' : '0';
            if (busy) {
                statusValue.textContent = 'WAITING...';
                statusValue.classList.remove('error');
            }
        };

        if (enableBtn) {
            enableBtn.addEventListener('click', () => {
                console.log('🔵 ENABLE STACK clicked');
                setBusy(true);
                const msg = {
                    type: 'anime_enable',
                    timestamp: Date.now()
                };
                console.log('📤 Sending anime_enable message:', msg);
                this.sendMessage(msg);
                this.flashButton(enableBtn);

                // Set timeout to reset if no response
                setTimeout(() => {
                    const statusEl = document.getElementById('animeStatus');
                    if (statusEl && statusEl.dataset.waiting === '1') {
                        console.warn('⚠️ No response received for anime_enable');
                        statusEl.textContent = 'NO RESPONSE';
                        statusEl.dataset.waiting = '0';
                        statusEl.classList.add('error');
                    }
                }, 5000);
            });
        }

        if (disableBtn) {
            disableBtn.addEventListener('click', () => {
                setBusy(true);
                this.sendMessage({
                    type: 'anime_disable',
                    timestamp: Date.now()
                });
                this.flashButton(disableBtn);
            });
        }

        if (killBtn) {
            killBtn.addEventListener('click', () => {
                this.sendMessage({
                    type: 'anime_kill',
                    timestamp: Date.now()
                });
                this.flashButton(killBtn);
            });
        }

        const triggers = document.querySelectorAll('[data-anime]');
        triggers.forEach(btn => {
            btn.addEventListener('click', () => {
                const testId = btn.dataset.anime;
                if (!testId) return;
                setBusy(true);
                this.sendMessage({
                    type: 'anime_trigger',
                    id: testId,
                    timestamp: Date.now()
                });
                this.flashButton(btn);
            });
        });

        this.applyAnimeStatus(this.animeStatus);
    }

    applyAnimeStatus(data = {}) {
        const nextStatus = {
            enabled: data.enabled !== undefined ? Boolean(data.enabled) : Boolean(this.animeStatus.enabled),
            lastAction: data.action || data.lastAction || this.animeStatus.lastAction || 'status',
            actionId: data.actionId || null,
            success: data.success !== undefined ? data.success : true,
            error: data.error || null
        };

        this.animeStatus = nextStatus;

        const statusValue = document.getElementById('animeStatus');
        if (statusValue) {
            const parts = [];
            parts.push(nextStatus.enabled ? 'ENABLED' : 'DISABLED');
            const normalizedAction = (nextStatus.lastAction || '').toLowerCase();
            if (normalizedAction && normalizedAction !== 'status' && normalizedAction !== 'enabled' && normalizedAction !== 'disabled') {
                parts.push(normalizedAction.toUpperCase());
            }
            if (nextStatus.actionId) {
                parts.push(`#${nextStatus.actionId}`);
            }
            if (nextStatus.error) {
                parts.push(`ERR: ${nextStatus.error}`);
            } else if (nextStatus.success === false) {
                parts.push('FAILED');
            }

            statusValue.textContent = parts.join(' | ');
            statusValue.classList.toggle('error', Boolean(nextStatus.error) || nextStatus.success === false);
            statusValue.dataset.waiting = '0';
        }

        const enableBtn = document.getElementById('animeEnable');
        const disableBtn = document.getElementById('animeDisable');
        if (enableBtn) enableBtn.disabled = Boolean(nextStatus.enabled);
        if (disableBtn) disableBtn.disabled = !nextStatus.enabled;
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

    // System Reset
    initSystemReset() {
        const resetBtn = document.getElementById('systemReset');

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                console.log('🔄 SYSTEM RESET INITIATED');

                // MINIMAL RESET: Only reset control values, don't break animations
                this.performMinimalReset();

                // Visual feedback
                this.flashButton(resetBtn);
                resetBtn.textContent = 'RESETTING...';
                resetBtn.disabled = true;

                setTimeout(() => {
                    resetBtn.textContent = 'RESET';
                    resetBtn.disabled = false;
                    console.log('✅ SYSTEM RESET COMPLETED');
                }, 3000);
            });
        }
    }

    performMinimalReset() {
        try {
            console.log('🔄 Performing minimal reset - control values only...');

            // 1. Reset all control panel sliders and buttons to defaults
            this.resetAllControls();

            // 2. Reset scene to AUTO
            this.currentScene = 'auto';
            this.updateAutoSceneIndicator('auto');

            // 3. Send default settings to main site (let animations continue)
            this.sendMessage({
                type: 'apply_settings',
                data: {
                    colors: { hue: 0, saturation: 100, brightness: 100, contrast: 100 },
                    effects: { glitch: 0.5, particles: 0.5, distortion: 0.5, noise: 0.25 },
                    speed: 1.0,
                    bpm: 120,
                    scene: 'auto'
                },
                timestamp: Date.now()
            });

            // 4. Reset performance mode
            this.sendMessage({
                type: 'performance_mode',
                mode: 'auto',
                timestamp: Date.now()
            });
            this.currentActiveAutoScene = null;
            this.updateAutoSceneIndicator(null);

            // 5. Reset anime.js state
            this.animeStatus = { enabled: false, lastAction: 'reset' };
            this.applyAnimeStatus(this.animeStatus);

            console.log('✅ Minimal reset completed - controls reset, animations preserved');

        } catch (error) {
            console.error('❌ Error during minimal reset:', error);
        }
    }

    resetAllControls() {
        try {
            console.log('🔧 Resetting all control values...');

            // Reset sliders to default values
            const sliderResets = {
                'hueSlider': 0,
                'saturationSlider': 100,
                'brightnessSlider': 100,
                'contrastSlider': 100,
                'speedSlider': 100,
                'phaseDurationSlider': 30,
                'glitchSlider': 50,
                'particlesSlider': 50,
                'noiseSlider': 25
            };

            Object.entries(sliderResets).forEach(([id, value]) => {
                const slider = document.getElementById(id);
                if (slider) {
                    slider.value = value;
                }
            });

            // Update displays
            this.updateSliderDisplays();

            // Reset scene buttons - set AUTO as active
            const sceneButtons = document.querySelectorAll('.scene-btn');
            sceneButtons.forEach(btn => {
                btn.classList.remove('active', 'auto-active');
            });

            const autoBtn = document.querySelector('[data-scene="auto"]');
            if (autoBtn) {
                autoBtn.classList.add('active');
            }

            // Reset performance mode to AUTO
            const perfButtons = document.querySelectorAll('.perf-btn[data-mode]');
            perfButtons.forEach(btn => {
                btn.classList.remove('active');
            });

            const autoPerfBtn = document.querySelector('[data-mode="auto"]');
            if (autoPerfBtn) {
                autoPerfBtn.classList.add('active');
            }

            // Update mode display
            const modeDisplay = document.getElementById('modeDisplay');
            if (modeDisplay) {
                modeDisplay.textContent = 'AUTO';
            }

            // Stop any sequences (safely)
            try {
                this.stopSequence();
                this.isRecording = false;
            } catch (e) {
                // Ignore sequence errors during reset
            }

            // Reset BPM
            this.currentBPM = 120;
            const bpmDisplay = document.querySelector('.bpm-value');
            if (bpmDisplay) {
                bpmDisplay.textContent = '120';
            }

            // Clear tap times
            this.tapTimes = [];

            console.log('✅ All controls reset to defaults');

        } catch (error) {
            console.error('❌ Error resetting controls:', error);
        }
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

        if (settings.performanceMode) {
            this.applyPerformanceMode(settings.performanceMode);
        }

        if (settings.animeEnabled !== undefined) {
            this.applyAnimeStatus({ enabled: settings.animeEnabled, action: 'sync' });
        }

        this.updateSliderDisplays();
    }

    updateDetailedPerformanceData(data) {
        console.log('📊 Received detailed performance data:', data);
        
        // Cache the data for display
        this.lastPerformanceData = {
            animations: data.animations,
            managedElements: data.managedElements,
            intervals: data.intervals,
            activeFx: data.activeFx
        };
        
        // Update displays immediately
        const animationsDisplay = document.getElementById('animations-display');
        if (animationsDisplay) {
            animationsDisplay.textContent = data.animations || '--';
        }
        
        const managedElementsDisplay = document.getElementById('managed-elements-display');
        if (managedElementsDisplay) {
            managedElementsDisplay.textContent = data.managedElements || '--';
        }
        
        const intervalsDisplay = document.getElementById('intervals-display');
        if (intervalsDisplay) {
            intervalsDisplay.textContent = data.intervals || '--';
        }
        
        // Update Active FX display
        const activeFxDisplay = document.getElementById('activeFxDisplay');
        if (activeFxDisplay) {
            activeFxDisplay.textContent = data.activeFx || 0;
        }
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

