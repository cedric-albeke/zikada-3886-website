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

    // Continue with remaining methods...
    // (All the other init methods and functionality would continue here)
}

// Export enhanced control panel
export default EnhancedVJControlPanel;

// Initialize if on control panel page
if (document.getElementById('controlPanel')) {
    const enhancedPanel = new EnhancedVJControlPanel();
    window.enhancedVJControl = enhancedPanel;
}