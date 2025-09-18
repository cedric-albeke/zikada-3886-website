// Professional VJ Control Panel for ZIKADA 3886
// Comprehensive control system for all animations and effects

class ProfessionalVJControlPanel {
    constructor() {
        this.isConnected = false;
        this.currentScene = 'auto';
        this.currentBPM = 120;
        this.lastMessageId = null;

        // Effect states
        this.effects = {
            holographic: { enabled: true, intensity: 50 },
            dataStreams: { enabled: true, intensity: 75 },
            strobeCircles: { enabled: false, intensity: 30 },
            plasma: { enabled: true, intensity: 15 },
            particles: { enabled: true, intensity: 50 },
            noise: { enabled: true, intensity: 25 },
            cyberGrid: { enabled: true, intensity: 80 }
        };

        // Animation system states
        this.animeSystem = {
            enabled: false,
            logoOutlines: false,
            logoAnimations: [],
            matrixFlash: false,
            backgroundWarp: false
        };

        // Color controls
        this.colorMatrix = {
            hue: 0,
            saturation: 100,
            brightness: 100,
            contrast: 100
        };

        // Performance settings
        this.performance = {
            mode: 'auto',
            maxEffects: 5,
            fpsTarget: 60
        };

        this.init();
    }

    init() {
        this.initBroadcastChannel();
        this.createProfessionalUI();
        this.initEventListeners();
        this.startConnectionMonitoring();
        this.startSystemMonitoring();

        console.log('🎛️ Professional VJ Control Panel initialized');
    }

    initBroadcastChannel() {
        try {
            this.channel = new BroadcastChannel('3886_vj_control');
            this.channel.onmessage = (event) => {
                this.handleMainPageMessage(event.data);
            };
            this.isConnected = true;
            this.updateConnectionStatus();
        } catch (error) {
            console.warn('BroadcastChannel not supported, using localStorage');
            this.setupLocalStorageMonitoring();
        }
    }

    setupLocalStorageMonitoring() {
        // Poll for main page responses
        setInterval(() => {
            const response = localStorage.getItem('3886_vj_response');
            if (response) {
                try {
                    const data = JSON.parse(response);
                    if (data._id && data._id !== this.lastResponseId) {
                        this.lastResponseId = data._id;
                        this.handleMainPageMessage(data);
                    }
                } catch (e) {}
            }
        }, 100);
    }

    createProfessionalUI() {
        // Replace the entire control panel content
        const controlPanel = document.querySelector('.control-panel');
        if (!controlPanel) return;

        controlPanel.innerHTML = `
            <!-- Enhanced Header -->
            <header class="vj-header">
                <div class="header-brand">
                    <div class="brand-icon">◉</div>
                    <div class="brand-info">
                        <h1>ZIKADA 3886 VJ</h1>
                        <div class="brand-subtitle">Professional Visual Control System</div>
                    </div>
                </div>

                <div class="header-status">
                    <div class="connection-indicator" id="connectionIndicator">
                        <div class="status-dot"></div>
                        <span class="status-text">INITIALIZING</span>
                    </div>
                    <div class="system-metrics">
                        <div class="metric">
                            <label>UPTIME</label>
                            <span id="systemUptime">00:00:00</span>
                        </div>
                        <div class="metric">
                            <label>FPS</label>
                            <span id="fpsCounter">--</span>
                        </div>
                    </div>
                </div>

                <div class="header-controls">
                    <button class="emergency-btn" id="emergencyStop">
                        <span class="btn-icon">⏹</span>
                        <span class="btn-text">EMERGENCY</span>
                    </button>
                    <button class="system-btn" id="systemReset">
                        <span class="btn-icon">↻</span>
                        <span class="btn-text">RESET</span>
                    </button>
                </div>
            </header>

            <!-- Main Control Grid -->
            <div class="vj-control-grid">

                <!-- Scene Control -->
                <section class="vj-section scene-control">
                    <h2>SCENE PRESETS</h2>
                    <div class="scene-grid">
                        <button class="scene-btn" data-scene="intense">INTENSE</button>
                        <button class="scene-btn" data-scene="calm">CALM</button>
                        <button class="scene-btn" data-scene="glitch">GLITCH</button>
                        <button class="scene-btn" data-scene="techno">TECHNO</button>
                        <button class="scene-btn" data-scene="matrix">MATRIX</button>
                        <button class="scene-btn" data-scene="cyberpunk">CYBERPUNK</button>
                        <button class="scene-btn" data-scene="vaporwave">VAPORWAVE</button>
                        <button class="scene-btn" data-scene="minimal">MINIMAL</button>
                        <button class="scene-btn scene-auto active" data-scene="auto">AUTO MODE</button>
                    </div>
                </section>

                <!-- Animation System Control -->
                <section class="vj-section anime-control">
                    <h2>ANIME.JS SYSTEM</h2>

                    <div class="anime-status-panel">
                        <div class="status-display">
                            <label>SYSTEM STATUS</label>
                            <span id="animeSystemStatus" class="status-indicator">DISABLED</span>
                        </div>
                        <div class="status-display">
                            <label>ACTIVE ANIMATIONS</label>
                            <span id="activeAnimationCount">0</span>
                        </div>
                    </div>

                    <div class="anime-system-controls">
                        <button class="system-control-btn enable" id="animeEnable">
                            <span class="btn-icon">▶</span>
                            <span class="btn-text">ENABLE SYSTEM</span>
                        </button>
                        <button class="system-control-btn disable" id="animeDisable">
                            <span class="btn-icon">⏸</span>
                            <span class="btn-text">DISABLE SYSTEM</span>
                        </button>
                        <button class="system-control-btn emergency" id="animeEmergencyStop">
                            <span class="btn-icon">⏹</span>
                            <span class="btn-text">EMERGENCY STOP</span>
                        </button>
                    </div>

                    <div class="anime-logo-controls">
                        <h3>LOGO ANIMATIONS</h3>
                        <div class="logo-control-grid">
                            <button class="logo-btn" id="logoOutlineToggle">
                                <span class="btn-label">OUTLINE MODE</span>
                                <span class="btn-status">OFF</span>
                            </button>
                            <button class="logo-btn" id="logoPulse">
                                <span class="btn-label">PULSE</span>
                                <span class="btn-status">TRIGGER</span>
                            </button>
                            <button class="logo-btn" id="logoGlow">
                                <span class="btn-label">ENHANCED GLOW</span>
                                <span class="btn-status">OFF</span>
                            </button>
                        </div>
                    </div>

                    <div class="anime-effect-triggers">
                        <h3>EFFECT TRIGGERS</h3>
                        <div class="effect-trigger-grid">
                            <button class="effect-trigger-btn" data-anime="matrix-flash">MATRIX FLASH</button>
                            <button class="effect-trigger-btn" data-anime="bg-warp">BACKGROUND WARP</button>
                            <button class="effect-trigger-btn" data-anime="logo-burst">LOGO BURST</button>
                            <button class="effect-trigger-btn" data-anime="system-glitch">SYSTEM GLITCH</button>
                        </div>
                    </div>
                </section>

                <!-- Visual Effects Control -->
                <section class="vj-section effects-control">
                    <h2>VISUAL EFFECTS</h2>

                    <div class="effects-grid">
                        <div class="effect-control">
                            <div class="effect-header">
                                <label>HOLOGRAPHIC SCAN</label>
                                <button class="effect-toggle" data-effect="holographic">ON</button>
                            </div>
                            <div class="effect-slider">
                                <input type="range" id="holographicIntensity" min="0" max="100" value="50">
                                <span class="slider-value">50%</span>
                            </div>
                        </div>

                        <div class="effect-control">
                            <div class="effect-header">
                                <label>DATA STREAMS</label>
                                <button class="effect-toggle" data-effect="dataStreams">ON</button>
                            </div>
                            <div class="effect-slider">
                                <input type="range" id="dataStreamsIntensity" min="0" max="100" value="75">
                                <span class="slider-value">75%</span>
                            </div>
                        </div>

                        <div class="effect-control">
                            <div class="effect-header">
                                <label>STROBE CIRCLES</label>
                                <button class="effect-toggle" data-effect="strobeCircles">OFF</button>
                            </div>
                            <div class="effect-slider">
                                <input type="range" id="strobeCirclesIntensity" min="0" max="100" value="30">
                                <span class="slider-value">30%</span>
                            </div>
                        </div>

                        <div class="effect-control">
                            <div class="effect-header">
                                <label>PLASMA FIELD</label>
                                <button class="effect-toggle" data-effect="plasma">ON</button>
                            </div>
                            <div class="effect-slider">
                                <input type="range" id="plasmaIntensity" min="0" max="100" value="15">
                                <span class="slider-value">15%</span>
                            </div>
                        </div>

                        <div class="effect-control">
                            <div class="effect-header">
                                <label>PARTICLES</label>
                                <button class="effect-toggle" data-effect="particles">ON</button>
                            </div>
                            <div class="effect-slider">
                                <input type="range" id="particlesIntensity" min="0" max="100" value="50">
                                <span class="slider-value">50%</span>
                            </div>
                        </div>

                        <div class="effect-control">
                            <div class="effect-header">
                                <label>STATIC NOISE</label>
                                <button class="effect-toggle" data-effect="noise">ON</button>
                            </div>
                            <div class="effect-slider">
                                <input type="range" id="noiseIntensity" min="0" max="100" value="25">
                                <span class="slider-value">25%</span>
                            </div>
                        </div>

                        <div class="effect-control">
                            <div class="effect-header">
                                <label>CYBER GRID</label>
                                <button class="effect-toggle" data-effect="cyberGrid">ON</button>
                            </div>
                            <div class="effect-slider">
                                <input type="range" id="cyberGridIntensity" min="0" max="100" value="80">
                                <span class="slider-value">80%</span>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Color Matrix Control -->
                <section class="vj-section color-control">
                    <h2>COLOR MATRIX</h2>

                    <div class="color-sliders">
                        <div class="color-slider-group">
                            <label>HUE SHIFT</label>
                            <input type="range" id="hueSlider" min="-180" max="180" value="0">
                            <span class="slider-value">0°</span>
                        </div>
                        <div class="color-slider-group">
                            <label>SATURATION</label>
                            <input type="range" id="saturationSlider" min="50" max="200" value="100">
                            <span class="slider-value">100%</span>
                        </div>
                        <div class="color-slider-group">
                            <label>BRIGHTNESS</label>
                            <input type="range" id="brightnessSlider" min="80" max="150" value="100">
                            <span class="slider-value">100%</span>
                        </div>
                        <div class="color-slider-group">
                            <label>CONTRAST</label>
                            <input type="range" id="contrastSlider" min="80" max="150" value="100">
                            <span class="slider-value">100%</span>
                        </div>
                    </div>

                    <div class="color-presets">
                        <button class="color-preset-btn" data-preset="default">DEFAULT</button>
                        <button class="color-preset-btn" data-preset="warm">WARM</button>
                        <button class="color-preset-btn" data-preset="cool">COOL</button>
                        <button class="color-preset-btn" data-preset="cyberpunk">CYBERPUNK</button>
                        <button class="color-preset-btn" data-preset="reset">RESET</button>
                    </div>
                </section>

                <!-- Performance Monitor -->
                <section class="vj-section performance-monitor">
                    <h2>PERFORMANCE</h2>

                    <div class="performance-metrics">
                        <div class="metric-display">
                            <label>FRAME RATE</label>
                            <span id="performanceFPS" class="metric-value">60</span>
                            <span class="metric-unit">FPS</span>
                        </div>
                        <div class="metric-display">
                            <label>MEMORY USAGE</label>
                            <span id="memoryUsage" class="metric-value">--</span>
                            <span class="metric-unit">MB</span>
                        </div>
                        <div class="metric-display">
                            <label>ACTIVE EFFECTS</label>
                            <span id="activeEffects" class="metric-value">5</span>
                            <span class="metric-unit">FX</span>
                        </div>
                    </div>

                    <div class="performance-controls">
                        <button class="perf-mode-btn" data-mode="low">LOW</button>
                        <button class="perf-mode-btn active" data-mode="auto">AUTO</button>
                        <button class="perf-mode-btn" data-mode="high">HIGH</button>
                    </div>

                    <div class="performance-actions">
                        <button class="action-btn" id="optimizePerformance">OPTIMIZE</button>
                        <button class="action-btn" id="clearEffects">CLEAR EFFECTS</button>
                    </div>
                </section>
            </div>
        `;

        this.addProfessionalStyles();
    }

    addProfessionalStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Professional VJ Control Panel Styles */
            .control-panel {
                background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
                border: 2px solid #00ff85;
                border-radius: 8px;
                box-shadow: 0 0 30px rgba(0, 255, 133, 0.3);
                font-family: 'Space Mono', monospace;
                color: #00ff85;
                padding: 0;
                overflow: hidden;
            }

            .vj-header {
                background: linear-gradient(90deg, #001a0d 0%, #002415 100%);
                border-bottom: 2px solid #00ff85;
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .header-brand {
                display: flex;
                align-items: center;
                gap: 15px;
            }

            .brand-icon {
                width: 40px;
                height: 40px;
                background: radial-gradient(circle, #00ff85 0%, #00cc6a 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                font-weight: bold;
                color: #000;
                box-shadow: 0 0 15px rgba(0, 255, 133, 0.5);
            }

            .brand-info h1 {
                margin: 0;
                font-size: 1.8rem;
                font-weight: bold;
                color: #00ff85;
                text-shadow: 0 0 10px rgba(0, 255, 133, 0.5);
            }

            .brand-subtitle {
                font-size: 0.9rem;
                color: #66ff99;
                margin-top: 2px;
            }

            .header-status {
                display: flex;
                align-items: center;
                gap: 20px;
            }

            .connection-indicator {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 15px;
                background: rgba(0, 255, 133, 0.1);
                border: 1px solid #00ff85;
                border-radius: 20px;
            }

            .status-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #00ff85;
                box-shadow: 0 0 10px rgba(0, 255, 133, 0.8);
                animation: pulse 2s infinite;
            }

            .system-metrics {
                display: flex;
                gap: 15px;
            }

            .metric {
                text-align: center;
            }

            .metric label {
                display: block;
                font-size: 0.8rem;
                color: #66ff99;
                margin-bottom: 2px;
            }

            .metric span {
                font-size: 1.1rem;
                font-weight: bold;
                color: #00ff85;
            }

            .header-controls {
                display: flex;
                gap: 10px;
            }

            .emergency-btn, .system-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 15px;
                border: 2px solid #ff3333;
                background: rgba(255, 51, 51, 0.1);
                color: #ff3333;
                border-radius: 5px;
                font-family: inherit;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .system-btn {
                border-color: #00ff85;
                background: rgba(0, 255, 133, 0.1);
                color: #00ff85;
            }

            .emergency-btn:hover {
                background: rgba(255, 51, 51, 0.3);
                box-shadow: 0 0 15px rgba(255, 51, 51, 0.5);
            }

            .system-btn:hover {
                background: rgba(0, 255, 133, 0.3);
                box-shadow: 0 0 15px rgba(0, 255, 133, 0.5);
            }

            .vj-control-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                gap: 20px;
                padding: 20px;
                max-height: 80vh;
                overflow-y: auto;
            }

            .vj-section {
                background: rgba(0, 255, 133, 0.05);
                border: 1px solid rgba(0, 255, 133, 0.3);
                border-radius: 8px;
                padding: 20px;
            }

            .vj-section h2 {
                margin: 0 0 15px 0;
                font-size: 1.3rem;
                color: #00ff85;
                text-align: center;
                border-bottom: 2px solid rgba(0, 255, 133, 0.3);
                padding-bottom: 10px;
            }

            .scene-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
            }

            .scene-btn {
                padding: 12px 8px;
                border: 2px solid #00ff85;
                background: rgba(0, 255, 133, 0.1);
                color: #00ff85;
                font-family: inherit;
                font-weight: bold;
                font-size: 0.9rem;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .scene-btn:hover, .scene-btn.active {
                background: #00ff85;
                color: #000;
                box-shadow: 0 0 15px rgba(0, 255, 133, 0.5);
            }

            .scene-auto {
                grid-column: span 3;
                background: rgba(255, 204, 0, 0.1);
                border-color: #ffcc00;
                color: #ffcc00;
            }

            .scene-auto:hover, .scene-auto.active {
                background: #ffcc00;
                color: #000;
            }

            .anime-status-panel {
                display: flex;
                justify-content: space-between;
                margin-bottom: 15px;
                padding: 10px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 5px;
            }

            .status-display {
                text-align: center;
            }

            .status-display label {
                display: block;
                font-size: 0.8rem;
                color: #66ff99;
                margin-bottom: 5px;
            }

            .status-indicator {
                font-weight: bold;
                padding: 5px 10px;
                border-radius: 3px;
                background: rgba(255, 51, 51, 0.2);
                color: #ff3333;
            }

            .status-indicator.enabled {
                background: rgba(0, 255, 133, 0.2);
                color: #00ff85;
            }

            .anime-system-controls {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
            }

            .system-control-btn {
                flex: 1;
                padding: 12px 8px;
                border: 2px solid;
                background: rgba(0, 0, 0, 0.2);
                font-family: inherit;
                font-weight: bold;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }

            .system-control-btn.enable {
                border-color: #00ff85;
                color: #00ff85;
            }

            .system-control-btn.disable {
                border-color: #ffcc00;
                color: #ffcc00;
            }

            .system-control-btn.emergency {
                border-color: #ff3333;
                color: #ff3333;
            }

            .system-control-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                box-shadow: 0 0 15px currentColor;
                opacity: 0.7;
            }

            .anime-logo-controls, .anime-effect-triggers {
                margin-bottom: 15px;
            }

            .anime-logo-controls h3, .anime-effect-triggers h3 {
                margin: 0 0 10px 0;
                font-size: 1rem;
                color: #66ff99;
                border-bottom: 1px solid rgba(0, 255, 133, 0.2);
                padding-bottom: 5px;
            }

            .logo-control-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 8px;
            }

            .logo-btn {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 15px;
                border: 1px solid rgba(0, 255, 133, 0.5);
                background: rgba(0, 255, 133, 0.05);
                color: #00ff85;
                font-family: inherit;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .logo-btn:hover {
                background: rgba(0, 255, 133, 0.15);
                border-color: #00ff85;
            }

            .btn-status {
                font-size: 0.8rem;
                color: #66ff99;
                font-weight: bold;
            }

            .effect-trigger-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
            }

            .effect-trigger-btn {
                padding: 10px 8px;
                border: 2px solid #ff6600;
                background: rgba(255, 102, 0, 0.1);
                color: #ff6600;
                font-family: inherit;
                font-weight: bold;
                font-size: 0.9rem;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .effect-trigger-btn:hover {
                background: rgba(255, 102, 0, 0.3);
                box-shadow: 0 0 15px rgba(255, 102, 0, 0.5);
            }

            .effects-grid {
                display: grid;
                gap: 15px;
            }

            .effect-control {
                background: rgba(0, 0, 0, 0.2);
                border: 1px solid rgba(0, 255, 133, 0.2);
                border-radius: 5px;
                padding: 15px;
            }

            .effect-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }

            .effect-header label {
                font-weight: bold;
                color: #00ff85;
                font-size: 0.9rem;
            }

            .effect-toggle {
                padding: 5px 12px;
                border: 2px solid;
                background: transparent;
                font-family: inherit;
                font-weight: bold;
                font-size: 0.8rem;
                border-radius: 3px;
                cursor: pointer;
                transition: all 0.3s ease;
                min-width: 50px;
            }

            .effect-toggle[data-state="on"] {
                border-color: #00ff85;
                color: #00ff85;
            }

            .effect-toggle[data-state="off"] {
                border-color: #666;
                color: #666;
            }

            .effect-toggle:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            .effect-slider {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .effect-slider input[type="range"] {
                flex: 1;
                height: 6px;
                background: rgba(0, 255, 133, 0.2);
                border-radius: 3px;
                outline: none;
                -webkit-appearance: none;
            }

            .effect-slider input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 18px;
                height: 18px;
                background: #00ff85;
                border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 0 10px rgba(0, 255, 133, 0.5);
            }

            .slider-value {
                font-weight: bold;
                color: #00ff85;
                min-width: 40px;
                text-align: right;
                font-size: 0.9rem;
            }

            .color-sliders {
                display: grid;
                gap: 15px;
                margin-bottom: 20px;
            }

            .color-slider-group {
                display: flex;
                align-items: center;
                gap: 15px;
            }

            .color-slider-group label {
                min-width: 100px;
                font-weight: bold;
                color: #00ff85;
                font-size: 0.9rem;
            }

            .color-slider-group input[type="range"] {
                flex: 1;
                height: 8px;
                background: linear-gradient(90deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000);
                border-radius: 4px;
                outline: none;
                -webkit-appearance: none;
            }

            .color-slider-group input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 20px;
                height: 20px;
                background: #fff;
                border: 2px solid #00ff85;
                border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 0 15px rgba(0, 255, 133, 0.8);
            }

            .color-presets {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }

            .color-preset-btn {
                padding: 8px 15px;
                border: 2px solid #00ff85;
                background: rgba(0, 255, 133, 0.1);
                color: #00ff85;
                font-family: inherit;
                font-weight: bold;
                font-size: 0.8rem;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.3s ease;
                flex: 1;
                min-width: 70px;
            }

            .color-preset-btn:hover {
                background: rgba(0, 255, 133, 0.3);
                box-shadow: 0 0 10px rgba(0, 255, 133, 0.5);
            }

            .performance-metrics {
                display: flex;
                justify-content: space-around;
                margin-bottom: 20px;
                padding: 15px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 5px;
            }

            .metric-display {
                text-align: center;
            }

            .metric-display label {
                display: block;
                font-size: 0.8rem;
                color: #66ff99;
                margin-bottom: 5px;
            }

            .metric-value {
                font-size: 1.8rem;
                font-weight: bold;
                color: #00ff85;
                display: block;
            }

            .metric-unit {
                font-size: 0.8rem;
                color: #66ff99;
            }

            .performance-controls {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
            }

            .perf-mode-btn {
                flex: 1;
                padding: 10px;
                border: 2px solid #666;
                background: rgba(0, 0, 0, 0.3);
                color: #666;
                font-family: inherit;
                font-weight: bold;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .perf-mode-btn.active, .perf-mode-btn:hover {
                border-color: #00ff85;
                color: #00ff85;
                background: rgba(0, 255, 133, 0.1);
            }

            .performance-actions {
                display: flex;
                gap: 10px;
            }

            .action-btn {
                flex: 1;
                padding: 10px;
                border: 2px solid #ffcc00;
                background: rgba(255, 204, 0, 0.1);
                color: #ffcc00;
                font-family: inherit;
                font-weight: bold;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .action-btn:hover {
                background: rgba(255, 204, 0, 0.3);
                box-shadow: 0 0 15px rgba(255, 204, 0, 0.5);
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            /* Scrollbar styling */
            .vj-control-grid::-webkit-scrollbar {
                width: 8px;
            }

            .vj-control-grid::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.2);
                border-radius: 4px;
            }

            .vj-control-grid::-webkit-scrollbar-thumb {
                background: rgba(0, 255, 133, 0.5);
                border-radius: 4px;
            }

            .vj-control-grid::-webkit-scrollbar-thumb:hover {
                background: rgba(0, 255, 133, 0.8);
            }
        `;
        document.head.appendChild(style);
    }

    initEventListeners() {
        // Scene buttons
        document.querySelectorAll('.scene-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.scene-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentScene = btn.dataset.scene;
                this.sendMessage({
                    type: 'scene_change',
                    scene: this.currentScene,
                    timestamp: Date.now()
                });
            });
        });

        // Anime.js system controls
        document.getElementById('animeEnable')?.addEventListener('click', () => {
            this.animeSystem.enabled = true;
            this.updateAnimeSystemStatus();
            this.sendMessage({
                type: 'anime_enable',
                timestamp: Date.now()
            });
        });

        document.getElementById('animeDisable')?.addEventListener('click', () => {
            this.animeSystem.enabled = false;
            this.updateAnimeSystemStatus();
            this.sendMessage({
                type: 'anime_disable',
                timestamp: Date.now()
            });
        });

        document.getElementById('animeEmergencyStop')?.addEventListener('click', () => {
            this.animeSystem.enabled = false;
            this.updateAnimeSystemStatus();
            this.sendMessage({
                type: 'anime_emergency_stop',
                timestamp: Date.now()
            });
        });

        // Logo controls
        document.getElementById('logoOutlineToggle')?.addEventListener('click', () => {
            this.animeSystem.logoOutlines = !this.animeSystem.logoOutlines;
            this.updateLogoControlStatus();
            this.sendMessage({
                type: 'logo_outline_toggle',
                enabled: this.animeSystem.logoOutlines,
                timestamp: Date.now()
            });
        });

        document.getElementById('logoPulse')?.addEventListener('click', () => {
            this.sendMessage({
                type: 'logo_pulse_trigger',
                timestamp: Date.now()
            });
        });

        document.getElementById('logoGlow')?.addEventListener('click', () => {
            // Toggle enhanced glow
            this.sendMessage({
                type: 'logo_glow_toggle',
                timestamp: Date.now()
            });
        });

        // Effect triggers
        document.querySelectorAll('.effect-trigger-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const effect = btn.dataset.anime;
                this.sendMessage({
                    type: 'anime_trigger',
                    effect: effect,
                    timestamp: Date.now()
                });
            });
        });

        // Effect toggles
        document.querySelectorAll('.effect-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                const effect = btn.dataset.effect;
                const currentState = this.effects[effect]?.enabled || false;
                const newState = !currentState;

                this.effects[effect].enabled = newState;
                btn.textContent = newState ? 'ON' : 'OFF';
                btn.setAttribute('data-state', newState ? 'on' : 'off');

                this.sendMessage({
                    type: 'effect_toggle',
                    effect: effect,
                    enabled: newState,
                    timestamp: Date.now()
                });
            });
        });

        // Effect sliders
        document.querySelectorAll('.effect-slider input[type="range"]').forEach(slider => {
            const updateSlider = () => {
                const value = slider.value;
                const valueSpan = slider.parentElement.querySelector('.slider-value');
                if (valueSpan) {
                    valueSpan.textContent = value + '%';
                }

                const effectName = slider.id.replace('Intensity', '');
                if (this.effects[effectName]) {
                    this.effects[effectName].intensity = parseInt(value);

                    this.sendMessage({
                        type: 'effect_intensity',
                        effect: effectName,
                        intensity: parseInt(value),
                        timestamp: Date.now()
                    });
                }
            };

            slider.addEventListener('input', updateSlider);
            slider.addEventListener('change', updateSlider);
        });

        // Color controls
        ['hue', 'saturation', 'brightness', 'contrast'].forEach(property => {
            const slider = document.getElementById(property + 'Slider');
            if (slider) {
                const updateColor = () => {
                    const value = parseInt(slider.value);
                    this.colorMatrix[property] = value;

                    const valueSpan = slider.parentElement.querySelector('.slider-value');
                    if (valueSpan) {
                        const unit = property === 'hue' ? '°' : '%';
                        valueSpan.textContent = value + unit;
                    }

                    this.sendMessage({
                        type: 'color_change',
                        property: property,
                        value: value,
                        matrix: this.colorMatrix,
                        timestamp: Date.now()
                    });
                };

                slider.addEventListener('input', updateColor);
                slider.addEventListener('change', updateColor);
            }
        });

        // Emergency controls
        document.getElementById('emergencyStop')?.addEventListener('click', () => {
            this.sendMessage({
                type: 'emergency_stop',
                timestamp: Date.now()
            });
        });

        document.getElementById('systemReset')?.addEventListener('click', () => {
            this.resetAllControls();
            this.sendMessage({
                type: 'system_reset',
                timestamp: Date.now()
            });
        });
    }

    updateAnimeSystemStatus() {
        const statusElement = document.getElementById('animeSystemStatus');
        if (statusElement) {
            statusElement.textContent = this.animeSystem.enabled ? 'ENABLED' : 'DISABLED';
            statusElement.className = this.animeSystem.enabled ? 'status-indicator enabled' : 'status-indicator';
        }
    }

    updateLogoControlStatus() {
        const logoToggle = document.getElementById('logoOutlineToggle');
        if (logoToggle) {
            const statusSpan = logoToggle.querySelector('.btn-status');
            if (statusSpan) {
                statusSpan.textContent = this.animeSystem.logoOutlines ? 'ON' : 'OFF';
            }
        }
    }

    resetAllControls() {
        // Reset all controls to default values
        this.effects = {
            holographic: { enabled: true, intensity: 50 },
            dataStreams: { enabled: true, intensity: 75 },
            strobeCircles: { enabled: false, intensity: 30 },
            plasma: { enabled: true, intensity: 15 },
            particles: { enabled: true, intensity: 50 },
            noise: { enabled: true, intensity: 25 },
            cyberGrid: { enabled: true, intensity: 80 }
        };

        this.colorMatrix = {
            hue: 0,
            saturation: 100,
            brightness: 100,
            contrast: 100
        };

        this.animeSystem.enabled = false;
        this.animeSystem.logoOutlines = false;

        // Update UI
        this.updateAllControlStates();
    }

    updateAllControlStates() {
        // Update effect toggles and sliders
        Object.entries(this.effects).forEach(([effect, state]) => {
            const toggle = document.querySelector(`[data-effect="${effect}"]`);
            if (toggle) {
                toggle.textContent = state.enabled ? 'ON' : 'OFF';
                toggle.setAttribute('data-state', state.enabled ? 'on' : 'off');
            }

            const slider = document.getElementById(effect + 'Intensity');
            if (slider) {
                slider.value = state.intensity;
                const valueSpan = slider.parentElement.querySelector('.slider-value');
                if (valueSpan) {
                    valueSpan.textContent = state.intensity + '%';
                }
            }
        });

        // Update color sliders
        Object.entries(this.colorMatrix).forEach(([property, value]) => {
            const slider = document.getElementById(property + 'Slider');
            if (slider) {
                slider.value = value;
                const valueSpan = slider.parentElement.querySelector('.slider-value');
                if (valueSpan) {
                    const unit = property === 'hue' ? '°' : '%';
                    valueSpan.textContent = value + unit;
                }
            }
        });

        this.updateAnimeSystemStatus();
        this.updateLogoControlStatus();
    }

    sendMessage(data) {
        data._id = Date.now().toString(36) + Math.random().toString(36).substr(2);

        if (this.channel) {
            this.channel.postMessage(data);
        }

        // Also use localStorage for cross-tab communication
        localStorage.setItem('3886_vj_message', JSON.stringify(data));
    }

    handleMainPageMessage(data) {
        // Handle responses from main page
        switch (data.type) {
            case 'performance_stats':
                this.updatePerformanceDisplay(data);
                break;
            case 'anime_status':
                this.updateAnimeStatus(data);
                break;
        }
    }

    updatePerformanceDisplay(data) {
        if (data.fps !== undefined) {
            const fpsElement = document.getElementById('performanceFPS');
            if (fpsElement) {
                fpsElement.textContent = Math.round(data.fps);
            }
        }

        if (data.memory !== undefined) {
            const memoryElement = document.getElementById('memoryUsage');
            if (memoryElement) {
                memoryElement.textContent = Math.round(data.memory / 1024 / 1024);
            }
        }

        if (data.activeEffects !== undefined) {
            const effectsElement = document.getElementById('activeEffects');
            if (effectsElement) {
                effectsElement.textContent = data.activeEffects;
            }
        }
    }

    updateConnectionStatus() {
        const indicator = document.getElementById('connectionIndicator');
        if (indicator) {
            const statusText = indicator.querySelector('.status-text');
            if (statusText) {
                statusText.textContent = this.isConnected ? 'CONNECTED' : 'DISCONNECTED';
            }
        }
    }

    startConnectionMonitoring() {
        // Monitor connection to main page
        setInterval(() => {
            this.sendMessage({
                type: 'ping',
                timestamp: Date.now()
            });
        }, 5000);
    }

    startSystemMonitoring() {
        // Update system uptime
        const startTime = Date.now();
        setInterval(() => {
            const uptime = Date.now() - startTime;
            const hours = Math.floor(uptime / 3600000).toString().padStart(2, '0');
            const minutes = Math.floor((uptime % 3600000) / 60000).toString().padStart(2, '0');
            const seconds = Math.floor((uptime % 60000) / 1000).toString().padStart(2, '0');

            const uptimeElement = document.getElementById('systemUptime');
            if (uptimeElement) {
                uptimeElement.textContent = `${hours}:${minutes}:${seconds}`;
            }
        }, 1000);

        // Request performance stats periodically
        setInterval(() => {
            this.sendMessage({
                type: 'get_performance_stats',
                timestamp: Date.now()
            });
        }, 2000);
    }
}

// Initialize the professional control panel
const professionalVJPanel = new ProfessionalVJControlPanel();
window.VJControlPanel = professionalVJPanel;

console.log('🎛️ Professional VJ Control Panel loaded and ready');