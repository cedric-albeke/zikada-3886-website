// Enhanced VJ Control Panel for ZIKADA 3886
// Professional VJ interface with advanced features

import safePerformanceMonitor from './safe-performance-monitor.js';

class EnhancedVJControlPanel {
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
        this.animeStatus = { enabled: true, lastAction: 'status' };

        // Enhanced features
        this.effectMatrix = {};
        this.waveformData = [];
        this.beatDetector = null;
        this.colorPalettes = this.initColorPalettes();
        this.currentPalette = 'cyberpunk';
        this.automationPatterns = [];
        this.midiController = null;

        // Performance tracking
        this.startTime = Date.now();
        this.diceCountdown = 15; // Updated to 15 seconds
        this.lastDiceRoll = null;

        this.init();
    }

    init() {
        // Initialize communication
        this.initBroadcastChannel();

        // Initialize enhanced UI
        this.createEnhancedUI();

        // Initialize all control modules
        this.initSceneControls();
        this.initColorControls();
        this.initSpeedControls();
        this.initEffectsControls();
        this.initTriggerControls();
        this.initPresetControls();
        this.initPerformanceControls();
        this.initTimelineControls();
        this.initAnimeControls();

        // Initialize new enhanced features
        this.initEffectMatrix();
        this.initWaveformVisualizer();
        this.initBeatSync();
        this.initColorPaletteControls();
        this.initAutomation();
        this.initMIDISupport();
        this.initKeyboardShortcuts();

        // Start monitoring
        this.startMonitoring();

        console.log('🎛️ Enhanced VJ Control Panel initialized');
    }

    createEnhancedUI() {
        // Check if we're on the control panel page
        const controlContainer = document.getElementById('controlPanel');
        if (!controlContainer) return;

        // Clear existing content
        controlContainer.innerHTML = '';

        // Create new enhanced UI structure
        const uiHTML = `
            <div class="enhanced-control-panel">
                <!-- Header Section -->
                <header class="control-header">
                    <div class="header-left">
                        <h1 class="control-title">
                            <span class="logo-text-small">ZIKADA</span>
                            <span class="subtitle">VJ CONTROL</span>
                        </h1>
                        <div class="connection-status" id="connectionStatus">
                            <span class="status-dot"></span>
                            <span class="status-text">CONNECTING...</span>
                        </div>
                    </div>
                    <div class="header-center">
                        <div class="bpm-display">
                            <span class="bpm-value" id="bpmValue">120</span>
                            <span class="bpm-label">BPM</span>
                        </div>
                        <button class="tap-tempo-btn" id="tapTempo">TAP</button>
                    </div>
                    <div class="header-right">
                        <div class="performance-meter">
                            <span class="fps-display">FPS: <span id="fpsValue">60</span></span>
                            <div class="cpu-meter">
                                <div class="meter-fill" id="cpuMeter"></div>
                            </div>
                        </div>
                    </div>
                </header>

                <!-- Main Control Grid -->
                <div class="control-grid">

                    <!-- Scene Selector -->
                    <section class="control-section scene-selector">
                        <h2>SCENES</h2>
                        <div class="scene-grid">
                            <button class="scene-btn" data-scene="auto">AUTO</button>
                            <button class="scene-btn" data-scene="intro">INTRO</button>
                            <button class="scene-btn" data-scene="buildup">BUILD</button>
                            <button class="scene-btn" data-scene="drop">DROP</button>
                            <button class="scene-btn" data-scene="breakdown">BREAK</button>
                            <button class="scene-btn" data-scene="outro">OUTRO</button>
                            <button class="scene-btn" data-scene="ambient">AMBIENT</button>
                            <button class="scene-btn" data-scene="chaos">CHAOS</button>
                        </div>
                    </section>

                    <!-- Effect Matrix -->
                    <section class="control-section effect-matrix">
                        <h2>EFFECT MATRIX</h2>
                        <div class="matrix-grid" id="effectMatrix">
                            <!-- 4x4 effect toggle grid -->
                            ${this.generateEffectMatrix()}
                        </div>
                    </section>

                    <!-- Color Palette -->
                    <section class="control-section color-palette">
                        <h2>COLOR PALETTE</h2>
                        <div class="palette-selector">
                            <select id="paletteSelect" class="palette-dropdown">
                                <option value="cyberpunk">Cyberpunk</option>
                                <option value="neon">Neon Dreams</option>
                                <option value="matrix">Matrix Green</option>
                                <option value="vaporwave">Vaporwave</option>
                                <option value="monochrome">Monochrome</option>
                                <option value="fire">Fire</option>
                                <option value="ice">Ice</option>
                                <option value="rainbow">Rainbow</option>
                            </select>
                        </div>
                        <div class="color-preview" id="colorPreview"></div>
                        <div class="color-sliders">
                            <div class="slider-group">
                                <label>HUE SHIFT</label>
                                <input type="range" id="hueShift" min="-180" max="180" value="0" />
                                <span class="slider-value">0°</span>
                            </div>
                            <div class="slider-group">
                                <label>SATURATION</label>
                                <input type="range" id="saturation" min="0" max="200" value="100" />
                                <span class="slider-value">100%</span>
                            </div>
                            <div class="slider-group">
                                <label>BRIGHTNESS</label>
                                <input type="range" id="brightness" min="0" max="200" value="100" />
                                <span class="slider-value">100%</span>
                            </div>
                        </div>
                    </section>

                    <!-- Waveform Visualizer -->
                    <section class="control-section waveform-section">
                        <h2>WAVEFORM</h2>
                        <canvas id="waveformCanvas" class="waveform-canvas"></canvas>
                        <div class="beat-indicator" id="beatIndicator"></div>
                    </section>

                    <!-- Effect Intensities -->
                    <section class="control-section intensities">
                        <h2>INTENSITIES</h2>
                        <div class="intensity-controls">
                            <div class="slider-group">
                                <label>GLITCH</label>
                                <input type="range" id="glitchSlider" min="0" max="100" value="50" />
                                <span class="slider-value">50%</span>
                            </div>
                            <div class="slider-group">
                                <label>PARTICLES</label>
                                <input type="range" id="particlesSlider" min="0" max="100" value="50" />
                                <span class="slider-value">50%</span>
                            </div>
                            <div class="slider-group">
                                <label>NOISE</label>
                                <input type="range" id="noiseSlider" min="0" max="100" value="25" />
                                <span class="slider-value">25%</span>
                            </div>
                            <div class="slider-group">
                                <label>PLASMA</label>
                                <input type="range" id="plasmaSlider" min="0" max="100" value="50" />
                                <span class="slider-value">50%</span>
                            </div>
                            <div class="slider-group">
                                <label>STROBES</label>
                                <input type="range" id="strobeSlider" min="0" max="100" value="30" />
                                <span class="slider-value">30%</span>
                            </div>
                        </div>
                    </section>

                    <!-- Automation Patterns -->
                    <section class="control-section automation">
                        <h2>AUTOMATION</h2>
                        <div class="automation-controls">
                            <div class="pattern-selector">
                                <button class="pattern-btn" data-pattern="sine">SINE</button>
                                <button class="pattern-btn" data-pattern="saw">SAW</button>
                                <button class="pattern-btn" data-pattern="square">SQUARE</button>
                                <button class="pattern-btn" data-pattern="random">RANDOM</button>
                            </div>
                            <div class="automation-target">
                                <label>TARGET</label>
                                <select id="automationTarget">
                                    <option value="none">None</option>
                                    <option value="glitch">Glitch</option>
                                    <option value="particles">Particles</option>
                                    <option value="hue">Hue Shift</option>
                                    <option value="zoom">Zoom</option>
                                </select>
                            </div>
                            <div class="automation-speed">
                                <label>SPEED</label>
                                <input type="range" id="automationSpeed" min="0.1" max="10" step="0.1" value="1" />
                                <span class="slider-value">1.0x</span>
                            </div>
                        </div>
                    </section>

                    <!-- Trigger Pad -->
                    <section class="control-section trigger-pad">
                        <h2>TRIGGERS</h2>
                        <div class="trigger-grid">
                            <button class="trigger-btn" data-trigger="glitch">GLITCH</button>
                            <button class="trigger-btn" data-trigger="flash">FLASH</button>
                            <button class="trigger-btn" data-trigger="matrix">MATRIX</button>
                            <button class="trigger-btn" data-trigger="dice">DICE</button>
                            <button class="trigger-btn" data-trigger="warp">WARP</button>
                            <button class="trigger-btn" data-trigger="shake">SHAKE</button>
                            <button class="trigger-btn" data-trigger="pulse">PULSE</button>
                            <button class="trigger-btn" data-trigger="reset">RESET</button>
                        </div>
                    </section>

                    <!-- Preset Manager -->
                    <section class="control-section presets">
                        <h2>PRESETS</h2>
                        <div class="preset-controls">
                            <div class="preset-list">
                                <button class="preset-btn" data-preset="minimal">MINIMAL</button>
                                <button class="preset-btn" data-preset="balanced">BALANCED</button>
                                <button class="preset-btn" data-preset="intense">INTENSE</button>
                                <button class="preset-btn" data-preset="maximum">MAXIMUM</button>
                            </div>
                            <div class="preset-actions">
                                <button id="savePreset">SAVE</button>
                                <button id="loadPreset">LOAD</button>
                            </div>
                        </div>
                    </section>

                    <!-- Timeline Sequencer -->
                    <section class="control-section timeline">
                        <h2>SEQUENCER</h2>
                        <div class="timeline-controls">
                            <div class="transport">
                                <button id="recordBtn" class="transport-btn">●</button>
                                <button id="playBtn" class="transport-btn">▶</button>
                                <button id="stopBtn" class="transport-btn">■</button>
                            </div>
                            <div class="timeline-display" id="timelineDisplay">
                                <div class="timeline-cursor"></div>
                            </div>
                        </div>
                    </section>

                    <!-- MIDI Control Section -->
                    <section class="control-section midi-control">
                        <h2>MIDI CONTROL</h2>
                        <div class="midi-status">
                            <div class="device-status">
                                <span class="midi-dot" id="midiStatusDot"></span>
                                <span id="midiStatusText">No Devices</span>
                            </div>
                            <div class="clock-status">
                                <span class="clock-dot" id="clockStatusDot"></span>
                                <span id="clockStatusText">Internal Clock</span>
                            </div>
                        </div>
                        <div class="midi-controls">
                            <div class="device-selector">
                                <label>DEVICE</label>
                                <select id="midiDeviceSelect" class="midi-dropdown">
                                    <option value="">Select Device...</option>
                                </select>
                            </div>
                            <div class="midi-actions">
                                <button id="midiLearnBtn" class="midi-learn-btn">LEARN OFF</button>
                                <button id="midiLoadPresetBtn" class="midi-action-btn">LOAD PRESET</button>
                                <button id="midiClearBtn" class="midi-action-btn">CLEAR ALL</button>
                            </div>
                        </div>
                        <div class="midi-activity" id="midiActivity">
                            <div class="activity-header">
                                <span>LAST EVENT</span>
                                <button id="midiDebugBtn" class="debug-btn">DEBUG</button>
                            </div>
                            <div class="activity-display" id="activityDisplay">
                                <span class="activity-text">No MIDI activity</span>
                            </div>
                        </div>
                        <div class="midi-mappings" id="midiMappings">
                            <div class="mappings-header">
                                <span>MAPPINGS</span>
                                <div class="mapping-actions">
                                    <button id="exportMappingsBtn">EXPORT</button>
                                    <button id="importMappingsBtn">IMPORT</button>
                                </div>
                            </div>
                            <div class="mappings-list" id="mappingsList">
                                <div class="no-mappings">No mappings configured</div>
                            </div>
                        </div>
                        <input type="file" id="importMappingsFile" accept=".json" style="display: none;">
                    </section>
                </div>

                <!-- Footer Controls -->
                <footer class="control-footer">
                    <div class="master-controls">
                        <button class="emergency-btn" id="emergencyStop">EMERGENCY STOP</button>
                        <button class="blackout-btn" id="blackout">BLACKOUT</button>
                        <button class="whiteout-btn" id="whiteout">WHITEOUT</button>
                    </div>
                    <div class="info-display">
                        <span class="uptime">UPTIME: <span id="uptime">00:00:00</span></span>
                        <span class="dice-timer">NEXT DICE: <span id="diceTimer">15</span>s</span>
                    </div>
                </footer>
            </div>
        `;

        controlContainer.innerHTML = uiHTML;

        // Apply enhanced styles
        this.applyEnhancedStyles();
    }

    generateEffectMatrix() {
        const effects = [
            'GLOW', 'BLUR', 'SHAKE', 'SPIN',
            'ZOOM', 'FLIP', 'WAVE', 'PIXEL',
            'RGB', 'CHROMA', 'SCAN', 'STATIC',
            'GRID', 'MIRROR', 'ECHO', 'TRAIL'
        ];

        return effects.map((effect, i) => `
            <button class="matrix-btn" data-effect="${effect.toLowerCase()}" data-index="${i}">
                <span class="effect-label">${effect}</span>
                <span class="effect-indicator"></span>
            </button>
        `).join('');
    }

    applyEnhancedStyles() {
        // Check if styles already exist
        if (document.getElementById('enhanced-control-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'enhanced-control-styles';
        styles.textContent = `
            .enhanced-control-panel {
                background: #0a0a0a;
                color: #00ff85;
                font-family: 'Space Mono', monospace;
                min-height: 100vh;
                padding: 20px;
            }

            .control-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                background: linear-gradient(90deg, #0a0a0a, #1a1a1a);
                border: 1px solid #00ff85;
                margin-bottom: 20px;
            }

            .control-title {
                font-size: 24px;
                margin: 0;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .logo-text-small {
                color: #00ff85;
                text-shadow: 0 0 10px rgba(0, 255, 133, 0.5);
            }

            .subtitle {
                color: #00ffff;
                font-size: 14px;
            }

            .connection-status {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 10px;
            }

            .status-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: #ff0000;
                animation: pulse 2s infinite;
            }

            .status-dot.connected {
                background: #00ff85;
            }

            .bpm-display {
                text-align: center;
            }

            .bpm-value {
                font-size: 36px;
                color: #00ffff;
                display: block;
            }

            .tap-tempo-btn {
                background: #00ff85;
                color: #000;
                border: none;
                padding: 10px 20px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s;
            }

            .tap-tempo-btn:hover {
                background: #00ffff;
                box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
            }

            .control-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
            }

            .control-section {
                background: #1a1a1a;
                border: 1px solid #00ff85;
                padding: 15px;
                position: relative;
            }

            .control-section h2 {
                color: #00ffff;
                font-size: 14px;
                margin: 0 0 15px 0;
                padding-bottom: 5px;
                border-bottom: 1px solid #00ff85;
            }

            .scene-grid, .trigger-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 10px;
            }

            .scene-btn, .trigger-btn, .preset-btn {
                background: #2a2a2a;
                color: #00ff85;
                border: 1px solid #00ff85;
                padding: 15px 5px;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 12px;
                font-weight: bold;
            }

            .scene-btn:hover, .trigger-btn:hover, .preset-btn:hover {
                background: #00ff85;
                color: #000;
            }

            .scene-btn.active {
                background: #00ff85;
                color: #000;
                box-shadow: 0 0 20px rgba(0, 255, 133, 0.5);
            }

            .matrix-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 5px;
            }

            .matrix-btn {
                aspect-ratio: 1;
                background: #1a1a1a;
                border: 1px solid #333;
                color: #666;
                cursor: pointer;
                transition: all 0.3s;
                position: relative;
                overflow: hidden;
            }

            .matrix-btn.active {
                background: #00ff85;
                color: #000;
                border-color: #00ff85;
                box-shadow: 0 0 15px rgba(0, 255, 133, 0.7);
            }

            .effect-label {
                font-size: 10px;
                font-weight: bold;
            }

            .slider-group {
                margin: 10px 0;
            }

            .slider-group label {
                display: block;
                font-size: 11px;
                color: #00ffff;
                margin-bottom: 5px;
            }

            .slider-group input[type="range"] {
                width: 100%;
                height: 5px;
                background: #333;
                outline: none;
                -webkit-appearance: none;
            }

            .slider-group input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 15px;
                height: 15px;
                background: #00ff85;
                cursor: pointer;
                border-radius: 50%;
            }

            .slider-value {
                color: #00ff85;
                font-size: 10px;
                float: right;
            }

            .waveform-canvas {
                width: 100%;
                height: 100px;
                background: #0a0a0a;
                border: 1px solid #00ff85;
            }

            .emergency-btn {
                background: #ff0000;
                color: #fff;
                border: none;
                padding: 15px 30px;
                font-weight: bold;
                cursor: pointer;
                text-transform: uppercase;
                animation: emergency-pulse 1s infinite;
            }

            @keyframes emergency-pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            /* MIDI Control Styles */
            .midi-control {
                background: #1a1a2e;
                border: 1px solid #00ff85;
            }

            .midi-status {
                display: flex;
                justify-content: space-between;
                margin-bottom: 15px;
                padding: 10px;
                background: #0f0f23;
                border: 1px solid #333;
            }

            .midi-dot, .clock-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #666;
                display: inline-block;
                margin-right: 8px;
            }

            .midi-dot.connected {
                background: #00ff85;
                animation: pulse 2s infinite;
            }

            .clock-dot.locked {
                background: #00ffff;
                animation: pulse 1s infinite;
            }

            .midi-controls {
                margin-bottom: 15px;
            }

            .device-selector {
                margin-bottom: 10px;
            }

            .midi-dropdown {
                width: 100%;
                background: #2a2a2a;
                color: #00ff85;
                border: 1px solid #00ff85;
                padding: 8px;
                font-size: 12px;
            }

            .midi-actions {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }

            .midi-learn-btn {
                background: #ff6b35;
                color: #fff;
                border: none;
                padding: 10px 15px;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 11px;
                font-weight: bold;
            }

            .midi-learn-btn.learning {
                background: #00ff85;
                color: #000;
                animation: pulse 1s infinite;
            }

            .midi-action-btn {
                background: #333;
                color: #00ff85;
                border: 1px solid #00ff85;
                padding: 8px 12px;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 10px;
            }

            .midi-action-btn:hover {
                background: #00ff85;
                color: #000;
            }

            .midi-activity {
                margin-bottom: 15px;
                background: #0f0f23;
                border: 1px solid #333;
                padding: 10px;
            }

            .activity-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 5px;
                font-size: 10px;
                color: #00ffff;
            }

            .debug-btn {
                background: #444;
                color: #fff;
                border: none;
                padding: 4px 8px;
                cursor: pointer;
                font-size: 8px;
            }

            .activity-display {
                font-size: 10px;
                color: #888;
                min-height: 20px;
            }

            .activity-text {
                font-family: monospace;
            }

            .midi-mappings {
                background: #0f0f23;
                border: 1px solid #333;
                padding: 10px;
            }

            .mappings-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
                font-size: 10px;
                color: #00ffff;
            }

            .mapping-actions {
                display: flex;
                gap: 5px;
            }

            .mapping-actions button {
                background: #444;
                color: #fff;
                border: none;
                padding: 4px 8px;
                cursor: pointer;
                font-size: 8px;
            }

            .mappings-list {
                max-height: 100px;
                overflow-y: auto;
                font-size: 10px;
            }

            .mapping-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 5px;
                border-bottom: 1px solid #333;
                color: #ccc;
            }

            .mapping-source {
                color: #00ffff;
                font-family: monospace;
            }

            .mapping-target {
                color: #00ff85;
            }

            .mapping-remove {
                background: #ff4444;
                color: #fff;
                border: none;
                padding: 2px 6px;
                cursor: pointer;
                font-size: 8px;
            }

            .no-mappings {
                color: #666;
                font-style: italic;
                text-align: center;
                padding: 20px;
            }

            .learn-target-indicator {
                background: rgba(0, 255, 133, 0.2);
                border: 2px solid #00ff85;
                animation: learn-pulse 1s infinite;
            }

            @keyframes learn-pulse {
                0%, 100% { border-color: #00ff85; }
                50% { border-color: #00ffff; }
            }
        `;

        document.head.appendChild(styles);
    }

    initColorPalettes() {
        return {
            cyberpunk: ['#00ff85', '#00ffff', '#ff00ff', '#ffff00'],
            neon: ['#ff006e', '#fb5607', '#ffbe0b', '#8338ec'],
            matrix: ['#00ff00', '#008f00', '#00ff00', '#90ff90'],
            vaporwave: ['#ff71ce', '#01cdfe', '#05ffa1', '#b967ff'],
            monochrome: ['#ffffff', '#cccccc', '#999999', '#666666'],
            fire: ['#ff0000', '#ff6600', '#ffaa00', '#ffff00'],
            ice: ['#00ffff', '#0099ff', '#0066ff', '#ffffff'],
            rainbow: ['#ff0000', '#ff9900', '#ffff00', '#00ff00', '#0099ff', '#9900ff']
        };
    }

    // ==================== MIDI SUPPORT ====================
    
    async initMIDISupport() {
        console.log('🎹 Initializing MIDI support...');
        
        // Initialize MIDI controller in broadcast mode for control panel
        if (window.midiController) {
            this.midiController = window.midiController;
            this.midiController.setMode('broadcast');
        } else {
            console.warn('🎹 MIDI Controller not available');
            this.hideMIDIControls();
            return;
        }
        
        // MIDI Learn state
        this.midiLearnActive = false;
        this.midiLearnTarget = null;
        this.midiLearnTimeout = null;
        this.debugMode = false;
        
        // Bind UI events
        this.bindMIDIEvents();
        
        // Load existing mappings
        this.loadMIDIMappings();
        
        // Listen for MIDI events
        window.addEventListener('midiready', (e) => this.onMIDIReady(e));
        window.addEventListener('midierror', (e) => this.onMIDIError(e));
        window.addEventListener('mididevicechange', (e) => this.onMIDIDeviceChange(e));
        window.addEventListener('midimappinglearned', (e) => this.onMIDIMappingLearned(e));
        
        // Start activity monitoring
        this.startMIDIActivityMonitoring();
        
        // Load presets
        this.loadMIDIPresets();
        
        console.log('✅ MIDI support initialized');
    }
    
    bindMIDIEvents() {
        const learnBtn = document.getElementById('midiLearnBtn');
        const deviceSelect = document.getElementById('midiDeviceSelect');
        const loadPresetBtn = document.getElementById('midiLoadPresetBtn');
        const clearBtn = document.getElementById('midiClearBtn');
        const debugBtn = document.getElementById('midiDebugBtn');
        const exportBtn = document.getElementById('exportMappingsBtn');
        const importBtn = document.getElementById('importMappingsBtn');
        const importFile = document.getElementById('importMappingsFile');
        
        // MIDI Learn toggle
        learnBtn?.addEventListener('click', () => this.toggleMIDILearn());
        
        // Device selection
        deviceSelect?.addEventListener('change', (e) => this.selectMIDIDevice(e.target.value));
        
        // Preset loading
        loadPresetBtn?.addEventListener('click', () => this.loadMIDIPreset());
        
        // Clear all mappings
        clearBtn?.addEventListener('click', () => this.clearAllMappings());
        
        // Debug mode toggle
        debugBtn?.addEventListener('click', () => this.toggleMIDIDebug());
        
        // Export mappings
        exportBtn?.addEventListener('click', () => this.exportMIDIMappings());
        
        // Import mappings
        importBtn?.addEventListener('click', () => importFile.click());
        importFile?.addEventListener('change', (e) => this.importMIDIMappings(e));
        
        // Make all controls learnable
        this.makeControlsLearnable();
    }
    
    makeControlsLearnable() {
        // Scene buttons
        document.querySelectorAll('.scene-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.midiLearnActive) {
                    this.setLearnTarget({
                        element: btn,
                        action: {
                            type: 'scene',
                            params: { scene: btn.dataset.scene }
                        },
                        name: `Scene: ${btn.dataset.scene.toUpperCase()}`
                    });
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
        });
        
        // Effect matrix buttons
        document.querySelectorAll('.matrix-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.midiLearnActive) {
                    this.setLearnTarget({
                        element: btn,
                        action: {
                            type: 'matrix',
                            params: { effect: btn.dataset.effect }
                        },
                        name: `Effect: ${btn.dataset.effect.toUpperCase()}`
                    });
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
        });
        
        // Intensity sliders
        const intensitySliders = {
            'glitchSlider': 'glitch',
            'particlesSlider': 'particles',
            'noiseSlider': 'noise',
            'plasmaSlider': 'plasma',
            'strobeSlider': 'strobe'
        };
        
        Object.entries(intensitySliders).forEach(([sliderId, target]) => {
            const slider = document.getElementById(sliderId);
            slider?.addEventListener('mousedown', (e) => {
                if (this.midiLearnActive) {
                    this.setLearnTarget({
                        element: slider,
                        action: {
                            type: 'intensity',
                            params: { target }
                        },
                        transform: { min: 0, max: 1 },
                        name: `${target.toUpperCase()} Intensity`
                    });
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
        });
        
        // Color sliders
        const colorSliders = {
            'hueShift': { component: 'hue', range: [-180, 180] },
            'saturation': { component: 'saturation', range: [0, 200] },
            'brightness': { component: 'brightness', range: [0, 200] }
        };
        
        Object.entries(colorSliders).forEach(([sliderId, config]) => {
            const slider = document.getElementById(sliderId);
            slider?.addEventListener('mousedown', (e) => {
                if (this.midiLearnActive) {
                    this.setLearnTarget({
                        element: slider,
                        action: {
                            type: 'color',
                            params: { property: config.component }
                        },
                        transform: { 
                            min: config.range[0], 
                            max: config.range[1] 
                        },
                        name: `${config.component.toUpperCase()}`
                    });
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
        });
        
        // Trigger buttons
        document.querySelectorAll('.trigger-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.midiLearnActive) {
                    const triggerMap = {
                        'glitch': 'rgbsplit',
                        'flash': 'strobe',
                        'matrix': 'matrix-rain',
                        'dice': 'cosmic',
                        'warp': 'zoom-blur',
                        'shake': 'ripple',
                        'pulse': 'pulse',
                        'reset': 'blackout'
                    };
                    
                    this.setLearnTarget({
                        element: btn,
                        action: {
                            type: 'trigger',
                            params: { effect: triggerMap[btn.dataset.trigger] || btn.dataset.trigger }
                        },
                        name: `Trigger: ${btn.dataset.trigger.toUpperCase()}`
                    });
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
        });
    }
    
    toggleMIDILearn() {
        const learnBtn = document.getElementById('midiLearnBtn');
        
        if (this.midiLearnActive) {
            // Stop learning
            this.stopMIDILearn();
            learnBtn.textContent = 'LEARN OFF';
            learnBtn.classList.remove('learning');
        } else {
            // Start learning
            this.startMIDILearn();
            learnBtn.textContent = 'LEARN ON';
            learnBtn.classList.add('learning');
        }
    }
    
    startMIDILearn() {
        this.midiLearnActive = true;
        
        // Show learn instructions
        this.showToast('MIDI Learn active - Click any control, then move a MIDI controller', 'info', 5000);
        
        // Set timeout to auto-disable learn mode
        this.midiLearnTimeout = setTimeout(() => {
            this.stopMIDILearn();
            this.showToast('MIDI Learn timed out', 'warning');
        }, 30000); // 30 second timeout
    }
    
    stopMIDILearn() {
        this.midiLearnActive = false;
        this.clearLearnTarget();
        
        if (this.midiLearnTimeout) {
            clearTimeout(this.midiLearnTimeout);
            this.midiLearnTimeout = null;
        }
        
        const learnBtn = document.getElementById('midiLearnBtn');
        learnBtn.textContent = 'LEARN OFF';
        learnBtn.classList.remove('learning');
    }
    
    setLearnTarget(target) {
        this.clearLearnTarget();
        
        this.midiLearnTarget = target;
        
        // Visual indicator
        target.element.classList.add('learn-target-indicator');
        
        // Prepare for MIDI input
        if (this.midiController) {
            this.midiController.startLearn(target);
        }
        
        this.showToast(`Learning target: ${target.name}`, 'info', 3000);
    }
    
    clearLearnTarget() {
        if (this.midiLearnTarget) {
            this.midiLearnTarget.element.classList.remove('learn-target-indicator');
            this.midiLearnTarget = null;
        }
        
        if (this.midiController) {
            this.midiController.stopLearn();
        }
    }
    
    onMIDIReady(event) {
        console.log('🎹 MIDI Ready:', event.detail);
        this.updateMIDIStatus('connected');
        this.updateDeviceList();
    }
    
    onMIDIError(event) {
        console.error('🎹 MIDI Error:', event.detail);
        this.updateMIDIStatus('error');
        this.showToast(`MIDI Error: ${event.detail.message}`, 'error');
    }
    
    onMIDIDeviceChange(event) {
        console.log('🎹 MIDI Device Change:', event.detail);
        this.updateDeviceList();
        
        if (event.detail.action === 'connected') {
            this.showToast(`Connected: ${event.detail.device.name}`, 'success');
            this.offerPresetForDevice(event.detail.device);
        } else {
            this.showToast(`Disconnected: ${event.detail.device.name}`, 'warning');
        }
    }
    
    onMIDIMappingLearned(event) {
        const { mapping, target } = event.detail;
        
        this.showToast(`Learned: ${target.name}`, 'success');
        this.addMappingToUI(mapping, target);
        this.stopMIDILearn();
    }
    
    updateMIDIStatus(status) {
        const statusDot = document.getElementById('midiStatusDot');
        const statusText = document.getElementById('midiStatusText');
        
        statusDot?.classList.remove('connected');
        
        switch (status) {
            case 'connected':
                statusDot?.classList.add('connected');
                statusText.textContent = 'Connected';
                break;
            case 'error':
                statusText.textContent = 'Error';
                break;
            default:
                statusText.textContent = 'No Devices';
        }
    }
    
    updateDeviceList() {
        const deviceSelect = document.getElementById('midiDeviceSelect');
        if (!deviceSelect || !this.midiController) return;
        
        const devices = this.midiController.getDevices();
        
        // Clear existing options
        deviceSelect.innerHTML = '<option value="">Select Device...</option>';
        
        // Add input devices
        devices.inputs.forEach(device => {
            const option = document.createElement('option');
            option.value = device.id;
            option.textContent = `${device.name} (${device.manufacturer})`;
            deviceSelect.appendChild(option);
        });
        
        // Update status
        const statusText = document.getElementById('midiStatusText');
        if (devices.inputs.length > 0) {
            statusText.textContent = `${devices.inputs.length} device(s)`;
            this.updateMIDIStatus('connected');
        } else {
            this.updateMIDIStatus('disconnected');
        }
    }
    
    startMIDIActivityMonitoring() {
        // Listen for raw MIDI events for activity display
        if (this.midiController) {
            // Override the controller's debug mode to capture events
            const originalOnMessage = this.midiController.onMIDIMessage;
            this.midiController.onMIDIMessage = (event, deviceInfo) => {
                this.updateMIDIActivity(event, deviceInfo);
                return originalOnMessage.call(this.midiController, event, deviceInfo);
            };
        }
    }
    
    updateMIDIActivity(event, deviceInfo) {
        const activityDisplay = document.getElementById('activityDisplay');
        if (!activityDisplay) return;
        
        const data = event.data;
        const [status, data1, data2] = data;
        
        // Create activity text
        let activityText = `${deviceInfo.name}: `;
        
        // Parse message type
        const command = status & 0xF0;
        const channel = (status & 0x0F) + 1;
        
        switch (command) {
            case 0x90:
                if (data2 > 0) {
                    activityText += `Note On Ch${channel} Note${data1} Vel${data2}`;
                } else {
                    activityText += `Note Off Ch${channel} Note${data1}`;
                }
                break;
            case 0x80:
                activityText += `Note Off Ch${channel} Note${data1} Vel${data2}`;
                break;
            case 0xB0:
                activityText += `CC Ch${channel} CC${data1} Val${data2}`;
                break;
            case 0xF0:
                if (status === 0xF8) {
                    activityText += `Clock`;
                } else {
                    activityText += `System: 0x${status.toString(16)}`;
                }
                break;
            default:
                activityText += `Unknown: 0x${status.toString(16)}`;
        }
        
        // Update display
        activityDisplay.innerHTML = `<span class="activity-text">${activityText}</span>`;
        
        // Debug mode console output
        if (this.debugMode) {
            console.log('🎹 MIDI:', {
                device: deviceInfo.name,
                raw: Array.from(data),
                parsed: activityText
            });
        }
    }
    
    addMappingToUI(mapping, target) {
        const mappingsList = document.getElementById('mappingsList');
        if (!mappingsList) return;
        
        // Remove "no mappings" message
        const noMappings = mappingsList.querySelector('.no-mappings');
        if (noMappings) {
            noMappings.remove();
        }
        
        // Create mapping item
        const mappingItem = document.createElement('div');
        mappingItem.className = 'mapping-item';
        mappingItem.dataset.mappingId = mapping.id;
        
        const sourceText = this.formatMappingSource(mapping.match);
        const targetText = target.name;
        
        mappingItem.innerHTML = `
            <div>
                <div class="mapping-source">${sourceText}</div>
                <div class="mapping-target">${targetText}</div>
            </div>
            <button class="mapping-remove" data-mapping-id="${mapping.id}">✕</button>
        `;
        
        // Add remove functionality
        const removeBtn = mappingItem.querySelector('.mapping-remove');
        removeBtn.addEventListener('click', () => this.removeMapping(mapping.id));
        
        mappingsList.appendChild(mappingItem);
    }
    
    formatMappingSource(match) {
        let source = '';
        
        if (match.type === 'note') {
            source = `Note ${match.number}`;
            if (match.subtype) {
                source += ` (${match.subtype})`;
            }
        } else if (match.type === 'cc') {
            source = `CC ${match.number}`;
        }
        
        if (match.channel) {
            source += ` Ch${match.channel}`;
        }
        
        return source;
    }
    
    removeMapping(mappingId) {
        if (this.midiController) {
            // Remove from controller
            this.midiController.mappings.delete(mappingId);
            this.midiController.saveMappings();
        }
        
        // Remove from UI
        const mappingItem = document.querySelector(`[data-mapping-id="${mappingId}"]`);
        if (mappingItem) {
            mappingItem.remove();
        }
        
        // Show "no mappings" if empty
        const mappingsList = document.getElementById('mappingsList');
        if (mappingsList && mappingsList.children.length === 0) {
            mappingsList.innerHTML = '<div class="no-mappings">No mappings configured</div>';
        }
        
        this.showToast('Mapping removed', 'success');
    }
    
    loadMIDIMappings() {
        if (!this.midiController) return;
        
        const mappings = this.midiController.getMappings();
        const mappingsList = document.getElementById('mappingsList');
        
        if (mappings.length === 0) {
            mappingsList.innerHTML = '<div class="no-mappings">No mappings configured</div>';
            return;
        }
        
        mappingsList.innerHTML = '';
        
        mappings.forEach(mapping => {
            // Try to reconstruct target info
            const target = {
                name: this.getTargetDisplayName(mapping.action)
            };
            this.addMappingToUI(mapping, target);
        });
    }
    
    getTargetDisplayName(action) {
        switch (action.type) {
            case 'scene':
                return `Scene: ${(action.params.scene || '').toUpperCase()}`;
            case 'intensity':
                return `${(action.params.target || '').toUpperCase()} Intensity`;
            case 'trigger':
                return `Trigger: ${(action.params.effect || '').toUpperCase()}`;
            case 'matrix':
                return `Effect: ${(action.params.effect || '').toUpperCase()}`;
            case 'color':
                return `${(action.params.property || '').toUpperCase()}`;
            default:
                return 'Unknown';
        }
    }
    
    clearAllMappings() {
        if (!confirm('Clear all MIDI mappings?')) return;
        
        if (this.midiController) {
            this.midiController.clearMappings();
        }
        
        const mappingsList = document.getElementById('mappingsList');
        mappingsList.innerHTML = '<div class="no-mappings">No mappings configured</div>';
        
        this.showToast('All mappings cleared', 'success');
    }
    
    toggleMIDIDebug() {
        this.debugMode = !this.debugMode;
        const debugBtn = document.getElementById('midiDebugBtn');
        debugBtn.textContent = this.debugMode ? 'DEBUG ON' : 'DEBUG';
        debugBtn.style.background = this.debugMode ? '#00ff85' : '#444';
        debugBtn.style.color = this.debugMode ? '#000' : '#fff';
        
        this.showToast(`Debug mode: ${this.debugMode ? 'ON' : 'OFF'}`, 'info');
    }
    
    exportMIDIMappings() {
        if (!this.midiController) return;
        
        const mappingsJSON = this.midiController.exportMappings();
        
        // Create download
        const blob = new Blob([mappingsJSON], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zikada-midi-mappings-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast('Mappings exported', 'success');
    }
    
    importMIDIMappings(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const success = this.midiController.importMappings(e.target.result);
                if (success) {
                    this.loadMIDIMappings();
                    this.showToast('Mappings imported successfully', 'success');
                } else {
                    this.showToast('Failed to import mappings', 'error');
                }
            } catch (error) {
                this.showToast('Invalid mapping file', 'error');
            }
        };
        reader.readAsText(file);
        
        // Clear file input
        event.target.value = '';
    }
    
    loadMIDIPresets() {
        // This could load presets from files or hardcoded presets
        this.midiPresets = {
            'apc40-mk2': '/presets/apc40-mk2.json',
            'launchpad-x': '/presets/launchpad-x.json',
            'push2': '/presets/push2.json',
            'kontrol-s-series': '/presets/kontrol-s-series.json'
        };
    }
    
    async loadMIDIPreset() {
        const deviceSelect = document.getElementById('midiDeviceSelect');
        const selectedDevice = deviceSelect.value;
        
        if (!selectedDevice) {
            this.showToast('Select a device first', 'warning');
            return;
        }
        
        // Get device info
        const devices = this.midiController.getDevices();
        const device = devices.inputs.find(d => d.id === selectedDevice);
        
        if (!device) {
            this.showToast('Device not found', 'error');
            return;
        }
        
        // Try to find matching preset
        const preset = this.findPresetForDevice(device);
        if (!preset) {
            this.showToast('No preset found for this device', 'warning');
            return;
        }
        
        try {
            const response = await fetch(preset.path);
            const presetData = await response.json();
            
            // Apply preset mappings
            this.applyMIDIPreset(presetData, device);
            
            this.showToast(`Loaded preset: ${preset.name}`, 'success');
        } catch (error) {
            this.showToast('Failed to load preset', 'error');
        }
    }
    
    findPresetForDevice(device) {
        const deviceName = device.name.toLowerCase();
        
        if (deviceName.includes('apc40')) {
            return { name: 'APC40 mk2', path: this.midiPresets['apc40-mk2'] };
        } else if (deviceName.includes('launchpad')) {
            return { name: 'Launchpad X', path: this.midiPresets['launchpad-x'] };
        } else if (deviceName.includes('push')) {
            return { name: 'Push 2', path: this.midiPresets['push2'] };
        } else if (deviceName.includes('kontrol')) {
            return { name: 'Kontrol S-Series', path: this.midiPresets['kontrol-s-series'] };
        }
        
        return null;
    }
    
    applyMIDIPreset(presetData, device) {
        if (!presetData.mappings) {
            throw new Error('Invalid preset format');
        }
        
        // Clear existing mappings for this device
        const existingMappings = this.midiController.getMappings();
        existingMappings.forEach(mapping => {
            if (mapping.deviceId === device.id) {
                this.midiController.mappings.delete(mapping.id);
            }
        });
        
        // Add preset mappings
        presetData.mappings.forEach(mapping => {
            const fullMapping = {
                ...mapping,
                id: `${device.id}_${mapping.match.type}_${mapping.match.channel || 0}_${mapping.match.number || 0}`,
                deviceId: device.id
            };
            
            this.midiController.setMapping(fullMapping);
        });
        
        // Refresh UI
        this.loadMIDIMappings();
    }
    
    offerPresetForDevice(device) {
        const preset = this.findPresetForDevice(device);
        if (preset) {
            const load = confirm(`Load ${preset.name} preset for ${device.name}?`);
            if (load) {
                this.loadMIDIPreset();
            }
        }
    }
    
    hideMIDIControls() {
        const midiSection = document.querySelector('.midi-control');
        if (midiSection) {
            midiSection.style.display = 'none';
        }
    }
    
    showToast(message, type = 'info', duration = 3000) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Style toast
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '10px 15px',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '12px',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });
        
        // Type-specific styling
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
        
        // Animate in
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
        });
        
        // Auto remove
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }
}

// Export enhanced control panel
export default EnhancedVJControlPanel;

// Initialize if on control panel page
if (document.getElementById('controlPanel')) {
    const enhancedPanel = new EnhancedVJControlPanel();
    window.enhancedVJControl = enhancedPanel;
}