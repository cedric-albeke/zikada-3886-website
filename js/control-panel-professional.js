// Professional VJ Control Panel for ZIKADA 3886
// Comprehensive control system for all animations and effects

import MATRIX_MESSAGES from './matrix-message-pool.js';
import intervalManager from './interval-manager.js';

class ProfessionalVJControlPanel {
    constructor() {
        // Use localStorage bridge only when BroadcastChannel is unavailable
        this._useLocalStorageBridge = true;
        this.isConnected = false;
        this.currentScene = 'auto';
        this.currentBPM = 120;
        this.lastMessageId = null;

        // Dice roll system for matrix messages
        this.diceRollInterval = null;
        this.diceCountdown = 15;
        this.lastDiceRoll = 0;
        this.matrixMessages = MATRIX_MESSAGES;

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
            fpsTarget: 60,
            fps: 0,
            frameCount: 0,
            lastFrameTime: performance.now(),
            memory: 0,
            domNodes: 0
        };

        this.init();
    }

    // Phase transition orchestrator for smooth cross-fades
    async transitionPhase(nextPhaseId) {
        if (this.isTransitioning) {
            console.log('Phase transition already in progress, skipping');
            return;
        }
        
        this.isTransitioning = true;
        try {
            const current = document.querySelector('[data-phase].active, .phase-container.active');
            const next = document.querySelector(`[data-phase="${nextPhaseId}"], .phase-container[data-phase="${nextPhaseId}"]`);
            
            console.log('Phase transition:', current?.dataset?.phase, '->', nextPhaseId);
            
            // Fade out current phase
            if (current && current.dataset.phase !== nextPhaseId) {
                current.classList.add('phase-fade-out');
                await this.waitForAnimation(current, 650); // match --phase-fade-ms
                current.classList.remove('active', 'phase-fade-out');
            }
            
            // Fade in next phase
            if (next) {
                next.classList.add('active', 'phase-fade-in');
                await this.waitForAnimation(next, 650);
                next.classList.remove('phase-fade-in');
            }
        } finally {
            this.isTransitioning = false;
        }
    }
    
    // Animation helper that waits for CSS animation to complete or timeout
    waitForAnimation(element, timeoutMs) {
        return new Promise(resolve => {
            if (!element) return resolve();
            
            let done = false;
            const timeout = setTimeout(() => {
                if (!done) {
                    done = true;
                    resolve();
                }
            }, timeoutMs);
            
            const handler = () => {
                if (!done) {
                    done = true;
                    clearTimeout(timeout);
                    resolve();
                }
            };
            
            element.addEventListener('animationend', handler, { once: true });
            element.addEventListener('transitionend', handler, { once: true });
        });
    }

    // Lightweight debounce for high-frequency UI events
    _debounce(fn, wait = 32) {
        let t;
        return (...args) => {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), wait);
        };
    }

    init() {
        this.initBroadcastChannel();
        // Don't replace the original HTML - just enhance it
        // this.createProfessionalUI();
        this.initEventListeners();
        this.startConnectionMonitoring();
        this.startSystemMonitoring();
        this.startDiceRollCountdown();
        this.startPerformanceMonitoring();
        // Ensure the scenes section centers the active button on load
        this.scheduleInitialSceneScroll();

        console.log('🎛️ Professional VJ Control Panel initialized with original HTML');
    }

    initBroadcastChannel() {
        try {
            this.channel = new BroadcastChannel('3886_vj_control');
            // Disable LS bridge when BroadcastChannel is available
            this._useLocalStorageBridge = false;
            this.channel.onmessage = (event) => {
                this.handleMainPageMessage(event.data);
                // Treat pong/settings_sync as a live link signal over BC
                if (event.data && (event.data.type === 'pong' || event.data.type === 'settings_sync')) {
                    this.lastPingResponse = Date.now();
                    if (!this.isConnected) {
                        this.isConnected = true;
                        this.updateConnectionStatus(true);
                    }
                }
            };
            // Do not flip to connected until pong/settings received
            this.isConnected = false;
            this.updateConnectionStatus(false);
            // Proactively announce and ping
            this.sendControlConnect();
            this.sendPing();
        } catch (error) {
            console.warn('BroadcastChannel not supported, using localStorage');
            this.setupLocalStorageMonitoring();
        }
    }

    setupLocalStorageMonitoring() {
        // Enable LS bridge when BC is not available
        this._useLocalStorageBridge = true;
        // Simplified polling to avoid infinite loops (managed)
        this.pollInterval = intervalManager.set('prof-panel-localStorage-polling', () => {
            try {
                const response = localStorage.getItem('3886_vj_response');
                if (response) {
                    const data = JSON.parse(response);
                    if (data._id && data._id !== this.lastResponseId) {
                        this.lastResponseId = data._id;
                        this.handleMainPageMessage(data);
                    }
                }
            } catch (e) {
                console.warn('LocalStorage polling error:', e);
            }
        }, 10000); // Further reduced to 10 seconds to prevent issues
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
        // Scene buttons - with smooth phase transitions
        document.querySelectorAll('.scene-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const newScene = btn.dataset.scene;
                if (newScene === this.currentScene) return; // Skip if already active
                
                // Use phase transition orchestrator for smooth cross-fade
                await this.transitionPhase(newScene);
                
                // Update UI state
                document.querySelectorAll('.scene-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentScene = newScene;
                
                // Send control message
                this.sendMessage({
                    type: 'scene_change',
                    scene: this.currentScene,
                    timestamp: Date.now()
                });
                
                // Auto-scroll the scenes container to center the selected scene
                this.scrollScenesTo(this.currentScene);
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

        // Animation System Toggle Button (V3)
        document.getElementById('animeToggle')?.addEventListener('click', () => {
            const btn = document.getElementById('animeToggle');
            if (!btn) return;
            
            const currentState = btn.getAttribute('data-state');
            const newState = currentState === 'enabled' ? 'disabled' : 'enabled';
            const isEnabled = newState === 'enabled';
            
            // Update button state
            btn.setAttribute('data-state', newState);
            btn.querySelector('.toggle-status').textContent = newState.toUpperCase();
            
            // Toggle active class
            if (isEnabled) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
            
            // Update internal state
            this.animeSystem.enabled = isEnabled;
            this.updateAnimeSystemStatus();
            
            // Send message to main page
            this.sendMessage({
                type: isEnabled ? 'anime_enable' : 'anime_disable',
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

        // BPM Ripple toggle
        document.getElementById('toggleBpmRipple')?.addEventListener('click', () => {
            const btn = document.getElementById('toggleBpmRipple');
            if (!btn) return;
            const isOn = btn.getAttribute('data-state') === 'on';
            const newState = !isOn;
            btn.setAttribute('data-state', newState ? 'on' : 'off');
            btn.textContent = newState ? 'ON' : 'OFF';
            this.sendMessage({ type: 'bpm_ripple_toggle', enabled: newState, timestamp: Date.now() });
            // If same tab, toggle immediately for responsiveness
            if (window.vjReceiver && typeof window.vjReceiver.setBpmRippleEnabled === 'function') {
                window.vjReceiver.setBpmRippleEnabled(newState);
            }
        });

        // Effect sliders
        document.querySelectorAll('.effect-slider input[type="range"]').forEach(slider => {
            const updateImmediate = () => {
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
            const updateSlider = this._debounce(updateImmediate, 32);
            slider.addEventListener('input', updateSlider);
            slider.addEventListener('change', updateImmediate);
        });

        // Color controls
        ['hue', 'saturation', 'brightness', 'contrast'].forEach(property => {
            const slider = document.getElementById(property + 'Slider');
            if (slider) {
                const updateImmediate = () => {
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
                const updateColor = this._debounce(updateImmediate, 32);
                slider.addEventListener('input', updateColor);
                slider.addEventListener('change', updateImmediate);
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

        // System reload (full restart)
        document.getElementById('systemReload')?.addEventListener('click', () => {
            // Immediate UI feedback
            const container = document.getElementById('connectionStatus');
            if (container) {
                const statusText = container.querySelector('.status-text');
                if (statusText) statusText.textContent = 'RELOADING…';
                container.classList.add('reloading');
            }
            this.sendMessage({
                type: 'system_reload',
                timestamp: Date.now()
            });
        });

        // === ADDITIONAL V1 CONTROL PANEL EVENT LISTENERS ===

        // Speed/Tempo controls
        const speedSlider = document.getElementById('speedSlider');
        if (speedSlider) {
            const updateImmediate = () => {
                const value = parseInt(speedSlider.value);
                const valueSpan = speedSlider.parentElement.querySelector('.slider-value');
                if (valueSpan) valueSpan.textContent = value + '%';

                this.sendMessage({
                    type: 'speed_change',
                    speed: value,
                    timestamp: Date.now()
                });
            };
            const updateSpeed = this._debounce(updateImmediate, 32);
            speedSlider.addEventListener('input', updateSpeed);
            speedSlider.addEventListener('change', updateImmediate);
        }

        const phaseDurationSlider = document.getElementById('phaseDurationSlider');
        if (phaseDurationSlider) {
            const updateImmediate = () => {
                const value = parseInt(phaseDurationSlider.value);
                const valueSpan = phaseDurationSlider.parentElement.querySelector('.slider-value');
                if (valueSpan) valueSpan.textContent = value + 's';

                this.sendMessage({
                    type: 'phase_duration_change',
                    duration: value,
                    timestamp: Date.now()
                });
            };
            const updatePhaseDuration = this._debounce(updateImmediate, 32);
            phaseDurationSlider.addEventListener('input', updatePhaseDuration);
            phaseDurationSlider.addEventListener('change', updateImmediate);
        }

        // BPM Tap
        const tapBPMBtn = document.getElementById('tapBPM');
        const bpmInput = document.getElementById('bpmInput');
        const bpmDisplay = document.getElementById('bpmValue');
        
        if (tapBPMBtn) {
            tapBPMBtn.addEventListener('click', () => {
                const now = Date.now();
                if (this.lastTap && (now - this.lastTap) < 3000) {
                    const bpm = Math.round(60000 / (now - this.lastTap));
                    this.currentBPM = bpm;
                    
                    // Update all displays
                    if (bpmDisplay) bpmDisplay.textContent = bpm;
                    if (bpmInput) bpmInput.value = bpm;

                    this.sendMessage({
                        type: 'bpm_change',
                        bpm: bpm,
                        timestamp: now
                    });
                }
                this.lastTap = now;
            });
        }
        
        // Manual BPM Input + steppers
        if (bpmInput) {
            const applyBpm = (val) => {
                const bpm = Math.max(20, Math.min(300, parseInt(val)));
                if (!Number.isFinite(bpm)) return;
                this.currentBPM = bpm;
                bpmInput.value = String(bpm);
                if (bpmDisplay) bpmDisplay.textContent = bpm;
                this.sendMessage({ type: 'bpm_change', bpm, timestamp: Date.now() });
            };

            bpmInput.addEventListener('change', () => applyBpm(bpmInput.value));
            
            // Allow Enter key to apply
            bpmInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    applyBpm(bpmInput.value);
                    bpmInput.blur();
                }
            });

            // Stepper buttons
            const bump = (delta, shift) => {
                const current = parseInt(bpmInput.value || this.currentBPM || 120) || 120;
                const step = shift ? 5 : 1;
                applyBpm(current + delta * step);
            };
            document.getElementById('bpmUp')?.addEventListener('click', (e) => { e.preventDefault(); bump(1, e.shiftKey); });
            document.getElementById('bpmDown')?.addEventListener('click', (e) => { e.preventDefault(); bump(-1, e.shiftKey); });
        }

        // FX Intensity sliders (glitch, particles, noise)
        ['glitch', 'particles', 'noise'].forEach(effect => {
            const slider = document.getElementById(effect + 'Slider');
            if (slider) {
                const updateImmediate = () => {
                    const value = parseInt(slider.value);
                    const valueSpan = slider.parentElement.querySelector('.slider-value');
                    if (valueSpan) valueSpan.textContent = value + '%';

                    this.sendMessage({
                        type: 'fx_intensity',
                        effect: effect,
                        intensity: value,
                        timestamp: Date.now()
                    });
                };
                const updateFX = this._debounce(updateImmediate, 32);
                slider.addEventListener('input', updateFX);
                slider.addEventListener('change', updateImmediate);
            }
        });

        // Trigger FX buttons (with short cooldown to prevent spam)
        document.querySelectorAll('.trigger-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const effect = btn.dataset.effect;
                if (btn.disabled) return;
                this.sendMessage({
                    type: 'trigger_effect',
                    effect: effect,
                    timestamp: Date.now()
                });

                // Visual feedback
                btn.classList.add('active');
                setTimeout(() => btn.classList.remove('active'), 500);

                // Cooldown
                btn.disabled = true;
                btn.classList.add('cooldown');
                setTimeout(() => { btn.disabled = false; btn.classList.remove('cooldown'); }, 600);
            });
        });

        // Trigger theme + sliders - REMOVED
        // Feature removed from control panel
        // Default trigger settings without UI controls
        this.triggerSettings = { theme: 'green', intensity: 0.7, speed: 0.6 };

        // Macro triggers
        document.querySelectorAll('.macro-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const macro = btn.dataset.macro;
                this.sendMessage({ type: 'trigger_macro', macro, settings: this.triggerSettings, timestamp: Date.now() });
                btn.disabled = true; btn.classList.add('cooldown');
                setTimeout(() => { btn.disabled = false; btn.classList.remove('cooldown'); }, 1200);
            });
        });

        // Animation trigger buttons (data-anime)
        document.querySelectorAll('.anim-trigger-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const anime = btn.dataset.anime;
                console.log('Animation trigger clicked:', anime);

                this.sendMessage({
                    type: 'anime_trigger',
                    effect: anime,
                    id: anime,  // Also send as id for compatibility
                    timestamp: Date.now()
                });

                // Visual feedback
                btn.classList.add('active');
                setTimeout(() => btn.classList.remove('active'), 500);

                // Also trigger directly if on same page
                if (window.vjReceiver && typeof window.vjReceiver.handleAnimeTrigger === 'function') {
                    window.vjReceiver.handleAnimeTrigger(anime);
                }
            });
        });

        // Performance mode buttons (legacy)
        document.querySelectorAll('.perf-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                document.querySelectorAll('.perf-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.performance.mode = mode;

                const modeDisplay = document.getElementById('modeDisplay');
                if (modeDisplay) modeDisplay.textContent = mode.toUpperCase();

                this.sendMessage({
                    type: 'performance_mode',
                    mode: mode,
                    timestamp: Date.now()
                });
            });
        });

        // Performance mode buttons (new header .mode-btn)
        const modeBtns = document.querySelectorAll('.mode-btn');
        if (modeBtns && modeBtns.length) {
            modeBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const mode = btn.dataset.mode;
                    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.performance.mode = mode;
                    this.sendMessage({ type: 'performance_mode', mode, timestamp: Date.now() });
                });
            });
        }

        // Diagnostics
        document.getElementById('runAnimDiagnostics')?.addEventListener('click', () => {
            this.sendMessage({ type: 'run_animation_diagnostics', timestamp: Date.now() });
            const res = document.getElementById('animDiagnosticsResult');
            if (res) res.textContent = 'Running diagnostics...';
        });

        // Color reset button - REMOVED
        // Feature removed from control panel

        // Anime kill button (different from emergency stop)
        document.getElementById('animeKill')?.addEventListener('click', () => {
            this.animeSystem.enabled = false;
            this.updateAnimeSystemStatus();
            this.sendMessage({
                type: 'anime_kill_all',
                timestamp: Date.now()
            });
        });

        // === NEW EFFECT & LAYER CONTROLS ===

        // Manual dice roll button (if exists)
        document.getElementById('rollDiceNow')?.addEventListener('click', () => {
            this.rollDice();
            this.diceCountdown = 15; // Reset countdown after manual roll
            this.updateDiceCountdownDisplay();
        });

        // Effect toggle buttons (delegated) – supports dynamically injected Lottie buttons
        if (!this._effectToggleDelegated) {
            document.addEventListener('click', (e) => {
                const btn = e.target?.closest?.('.effect-toggle-btn');
                if (!btn) return;
                const effect = btn.dataset.effect;
                const currentState = btn.dataset.state === 'on';
                const newState = !currentState;

                // Update button UI
                btn.dataset.state = newState ? 'on' : 'off';
                btn.textContent = newState ? 'ON' : 'OFF';
                btn.classList.toggle('active', newState);

                // Lazily track effect state in panel state
                if (!this.effects[effect]) this.effects[effect] = { enabled: newState, intensity: 50 };
                this.effects[effect].enabled = newState;

                // Send toggle to main page; supports both built-in and lottie:* effects
                this.sendMessage({
                    type: 'effect_toggle',
                    effect: effect,
                    enabled: newState,
                    timestamp: Date.now()
                });

                // Update active effects counter and bars
                this.updateActiveEffectsCount();
                this.updatePerformanceBars();

                console.log(`Effect ${effect} toggled to ${newState ? 'ON' : 'OFF'}`);
            });
            this._effectToggleDelegated = true;
        }

        // Layer toggle buttons
        document.querySelectorAll('.layer-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const layer = btn.dataset.layer;
                const currentState = btn.dataset.state === 'on';
                const newState = !currentState;

                btn.dataset.state = newState ? 'on' : 'off';
                btn.textContent = newState ? 'ON' : 'OFF';
                btn.classList.toggle('active', newState);

                this.sendMessage({
                    type: 'layer_toggle',
                    layer: layer,
                    visible: newState,
                    timestamp: Date.now()
                });

                console.log(`Layer ${layer} toggled to ${newState ? 'VISIBLE' : 'HIDDEN'}`);
            });
        });

        // Master control buttons
        document.getElementById('toggleAllEffects')?.addEventListener('click', () => {
            // Check if majority are on
            const effectBtns = document.querySelectorAll('.effect-toggle-btn');
            const onCount = Array.from(effectBtns).filter(b => b.dataset.state === 'on').length;
            const newState = onCount < effectBtns.length / 2;

            effectBtns.forEach(btn => {
                btn.dataset.state = newState ? 'on' : 'off';
                btn.textContent = newState ? 'ON' : 'OFF';
                btn.classList.toggle('active', newState);

                this.sendMessage({
                    type: 'effect_toggle',
                    effect: btn.dataset.effect,
                    enabled: newState,
                    timestamp: Date.now()
                });
            });

            // Update active effects counter and bars
            this.updateActiveEffectsCount();
            this.updatePerformanceBars();

            console.log(`All effects toggled to ${newState ? 'ON' : 'OFF'}`);
        });

        document.getElementById('toggleAllLayers')?.addEventListener('click', () => {
            // Check if majority are on
            const layerBtns = document.querySelectorAll('.layer-toggle-btn');
            const onCount = Array.from(layerBtns).filter(b => b.dataset.state === 'on').length;
            const newState = onCount < layerBtns.length / 2;

            layerBtns.forEach(btn => {
                btn.dataset.state = newState ? 'on' : 'off';
                btn.textContent = newState ? 'ON' : 'OFF';
                btn.classList.toggle('active', newState);

                this.sendMessage({
                    type: 'layer_toggle',
                    layer: btn.dataset.layer,
                    visible: newState,
                    timestamp: Date.now()
                });
            });

            console.log(`All layers toggled to ${newState ? 'VISIBLE' : 'HIDDEN'}`);
        });

        document.getElementById('resetVisuals')?.addEventListener('click', () => {
            // Reset all effects to defaults
            const defaultEffects = {
                holographic: true,
                dataStreams: true,
                strobeCircles: false,
                plasma: true,
                particles: true,
                noise: true,
                cyberGrid: true,
                rgbSplit: false,
                chromatic: false,
                scanlines: false,
                vignette: true,
                filmgrain: false
            };

            document.querySelectorAll('.effect-toggle-btn').forEach(btn => {
                const effect = btn.dataset.effect;
                const defaultState = defaultEffects[effect] !== false;

                btn.dataset.state = defaultState ? 'on' : 'off';
                btn.textContent = defaultState ? 'ON' : 'OFF';
                btn.classList.toggle('active', defaultState);

                this.sendMessage({
                    type: 'effect_toggle',
                    effect: effect,
                    enabled: defaultState,
                    timestamp: Date.now()
                });
            });

            // Update active effects counter and bars
            this.updateActiveEffectsCount();
            this.updatePerformanceBars();

            // Reset all layers to visible
            document.querySelectorAll('.layer-toggle-btn').forEach(btn => {
                const isDebug = btn.dataset.layer === 'debug';
                const defaultState = !isDebug;

                btn.dataset.state = defaultState ? 'on' : 'off';
                btn.textContent = defaultState ? 'ON' : 'OFF';
                btn.classList.toggle('active', defaultState);

                this.sendMessage({
                    type: 'layer_toggle',
                    layer: btn.dataset.layer,
                    visible: defaultState,
                    timestamp: Date.now()
                });
            });

            console.log('Visual settings reset to defaults');
        });
    }

    updateAnimeSystemStatus() {
        // Update the status text in the original HTML
        const statusElement = document.getElementById('animeStatus');
        if (statusElement) {
            statusElement.textContent = this.animeSystem.enabled ? 'ENABLED' : 'DISABLED';
            statusElement.className = this.animeSystem.enabled ? 'status-display enabled' : 'status-display';
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

    updateAutoSceneHighlight(scene) {
        // Remove auto-active from all and clear stale 'active' from non-auto buttons
        const buttons = document.querySelectorAll('.scene-btn');
        buttons.forEach(btn => {
            btn.classList.remove('auto-active');
            if (btn.dataset.scene !== 'auto') {
                btn.classList.remove('active');
            }
        });
        // Highlight current scene for AUTO mode
        const currentBtn = document.querySelector(`.scene-btn[data-scene="${scene}"]`);
        if (currentBtn) currentBtn.classList.add('auto-active');
        // Ensure AUTO button shows active state to indicate auto mode
        const autoBtn = document.querySelector('.scene-btn[data-scene="auto"], .scene-auto');
        if (autoBtn) autoBtn.classList.add('active');
    }

    // Smoothly center the given scene button or the currently active one
    scrollScenesTo(scene) {
        try {
            const grid = document.querySelector('.scene-section .scene-grid');
            if (!grid) return;
            const target = scene
                ? grid.querySelector(`.scene-btn[data-scene="${scene}"]`)
                : (grid.querySelector('.scene-btn.active') || grid.querySelector('.scene-btn[data-scene="auto"]'));
            if (target && typeof target.scrollIntoView === 'function') {
                target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            } else {
                grid.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
            }
        } catch (_) {}
    }

    // Schedule initial scroll after layout is ready
    scheduleInitialSceneScroll() {
        // Two RAFs to ensure layout calculations are settled
        requestAnimationFrame(() => requestAnimationFrame(() => this.scrollScenesTo()));
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

        // Use localStorage bridge only when BroadcastChannel is unavailable
        if (this._useLocalStorageBridge) {
            try { localStorage.setItem('3886_vj_message', JSON.stringify(data)); } catch {}
        }
    }

    handleMainPageMessage(data) {
        // Handle responses from main page
        switch (data.type) {
            case 'performance_update': {
                if (typeof data.fps === 'number' && window.performanceBus && typeof window.performanceBus.ingestRemote === 'function') {
                    window.performanceBus.ingestRemote(data.fps);
                }
                this.updatePerformanceDisplay(data);
                break;
            }
            case 'matrix_message_displayed': {
                // Update LAST MSG strictly on ACK from animation page
                const lastMsgElement = document.getElementById('lastMatrixMessage');
                if (lastMsgElement) {
                    lastMsgElement.textContent = data.message || '—';
                    lastMsgElement.style.color = '#00ff85';
                    lastMsgElement.classList.add('triggered');
                    setTimeout(() => {
                        lastMsgElement.style.color = '#ff00ff';
                        lastMsgElement.classList.remove('triggered');
                    }, 3000);
                }
                break;
            }
            case 'detailed_performance_update': {
                if (typeof data.fps === 'number' && window.performanceBus && typeof window.performanceBus.ingestRemote === 'function') {
                    window.performanceBus.ingestRemote(data.fps);
                }
                this.updatePerformanceDisplay({ fps: data.fps, memory: data.memory, activeFx: data.activeFx });
                break;
            }
            case 'performance_stats':
                this.updatePerformanceDisplay(data);
                break;
            case 'anime_status':
                if (typeof data.enabled === 'boolean') {
                    this.animeSystem.enabled = data.enabled;
                }
                this.updateAnimeSystemStatus();
                break;
            case 'pong':
                this.lastPingResponse = Date.now();
                if (!this.isConnected) {
                    this.isConnected = true;
                    this.updateConnectionStatus(true);
                }
                break;
            case 'settings_sync':
                this.lastPingResponse = Date.now();
                if (!this.isConnected) {
                    this.isConnected = true;
                    this.updateConnectionStatus(true);
                }
                break;
            case 'scene_changed': {
                const scene = (data.scene || '').toLowerCase();
                this.updateAutoSceneHighlight(scene);
                // Also center the scene button in view
                this.scrollScenesTo(scene);
                break;
            }
            case 'performance_mode_updated': {
                // Reflect active mode in UI buttons
                try {
                    const mode = data.mode;
                    document.querySelectorAll('.mode-btn').forEach(btn => {
                        btn.classList.toggle('active', btn.dataset.mode === mode);
                    });
                } catch (_) {}
                break;
            }
            case 'diagnostics_report': {
                const res = document.getElementById('animDiagnosticsResult');
                if (res) {
                    const ok = data.successes?.length || 0;
                    const fail = data.failures?.length || 0;
                    res.textContent = `Diagnostics: ${ok} ok, ${fail} failed`;
                }
                console.log('Diagnostics report:', data);
                break;
            }
            case 'system_reset_complete': {
                // Light UI acknowledgment
                const el = document.querySelector('#connectionStatus .status-text');
                if (el) el.textContent = this.isConnected ? 'ONLINE' : 'STANDBY';
                console.log('✅ System reset complete (ack received)');
                break;
            }
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
        // Update connection container
        const connectionContainer = document.getElementById('connectionStatus');
        if (connectionContainer && connectionContainer.classList.contains('reloading') && this.isConnected) {
            // Clear reloading state once reconnected
            connectionContainer.classList.remove('reloading');
        }
        if (connectionContainer) {
            const statusText = connectionContainer.querySelector('.status-text');
            const statusDot = connectionContainer.querySelector('.status-dot');

            if (statusText) {
                statusText.textContent = this.isConnected ? 'ONLINE' : 'OFFLINE';
                statusText.className = this.isConnected ? 'status-text connected' : 'status-text disconnected';
            }

            if (statusDot) {
                statusDot.className = this.isConnected ? 'status-dot connected' : 'status-dot';
                statusDot.style.backgroundColor = this.isConnected ? '#00ff85' : '#ff4444';
            }

            // Update container classes for wave animation
            if (this.isConnected) {
                connectionContainer.classList.add('connected');
            } else {
                connectionContainer.classList.remove('connected');
            }
        }
    }

    startConnectionMonitoring() {
        // Start as disconnected until we get a response
        this.isConnected = false;
        this.lastPingResponse = 0;
        this.pingTimeout = 3000; // 3 seconds timeout
        this.updateConnectionStatus();

        // Send initial ping
        this.sendPing();

        // Monitor connection with ping/pong (managed)
        this.connectionInterval = intervalManager.set('prof-panel-connection-monitor', () => {
            // Check if last ping was answered
            const timeSinceLastResponse = Date.now() - this.lastPingResponse;

            if (timeSinceLastResponse > this.pingTimeout * 2) {
                // No response for too long - mark as disconnected
                if (this.isConnected) {
                    this.isConnected = false;
                    this.updateConnectionStatus();
                    console.log('📡 Connection lost - no ping response');
                }
            }

            // Send new ping
            this.sendPing();
        }, this.pingTimeout);

        // Listen for pong responses
        window.addEventListener('storage', (e) => {
            if (e.key === '3886_vj_response') {
                try {
                    const data = JSON.parse(e.newValue);
                    if (data.type === 'pong' || data.type === 'settings_sync') {
                        this.lastPingResponse = Date.now();
                        if (!this.isConnected) {
                            this.isConnected = true;
                            this.updateConnectionStatus(true);
                            console.log('📡 Connection established');
                        }
                    }
                } catch (err) {
                    // Ignore parse errors
                }
            }
        });

        // Also check for window focus/blur events
        window.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Tab is hidden, but don't immediately disconnect
                console.log('📡 Control panel tab hidden');
            } else {
                // Tab is visible again, send ping
                console.log('📡 Control panel tab visible');
                this.sendPing();
            }
        });

        // Keyboard shortcuts for performance mode: L (low), A (auto), H (high)
        document.addEventListener('keydown', (e) => {
            const tag = (e.target && e.target.tagName) || '';
            if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;
            const k = e.key?.toLowerCase?.();
            if (k === 'l' || k === 'a' || k === 'h') {
                const mode = k === 'l' ? 'low' : (k === 'a' ? 'auto' : 'high');
                document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
                this.performance.mode = mode;
                this.sendMessage({ type: 'performance_mode', mode, timestamp: Date.now() });
            }
        });
    }

    sendPing() {
        this.sendMessage({
            type: 'ping',
            timestamp: Date.now()
        });
    }

    sendControlConnect() {
        this.sendMessage({
            type: 'control_connect',
            timestamp: Date.now()
        });
    }

    startDiceRollCountdown() {
        // Initialize countdown display
        this.updateDiceCountdownDisplay();
        this.updateLastDiceRollDisplay();

        // Use interval manager's shared 1Hz ticker instead of custom implementation
        const ensureTicker = () => {
            return {
                subscribe(fn) {
                    const intervalId = intervalManager.set('prof-panel-dice-ticker-' + Math.random().toString(36).substr(2, 9), fn, 1000);
                    return () => intervalManager.clear(intervalId);
                }
            };
        };
        const ticker = ensureTicker();
        if (this._diceUnsub) this._diceUnsub();
        this._diceUnsub = ticker.subscribe(() => {
            this.diceCountdown--;
            if (this.diceCountdown <= 0) {
                this.rollDice();
                this.diceCountdown = 15;
            }
            this.updateDiceCountdownDisplay();
        });
    }

    // Test method to force a high roll (for testing message display)
    testHighRoll() {
        // Force a roll of 95 for testing
        this.lastDiceRoll = 95;
        this.updateLastDiceRollDisplay();

        // Trigger message display
        const randomMessage = this.matrixMessages[Math.floor(Math.random() * this.matrixMessages.length)];
        const lastMsgElement = document.getElementById('lastMatrixMessage');
        if (lastMsgElement) {
            lastMsgElement.textContent = randomMessage;
            lastMsgElement.style.color = '#00ff85';
            lastMsgElement.classList.add('triggered');
            setTimeout(() => {
                lastMsgElement.style.color = '';
                lastMsgElement.classList.remove('triggered');
            }, 3000);
        }

        console.log('🎲 Test high roll triggered:', randomMessage);
    }

    rollDice() {
        // Roll a single dice 1-100
        const roll = Math.floor(Math.random() * 100) + 1;
        this.lastDiceRoll = roll;

        // Update the display
        this.updateLastDiceRollDisplay();

        // Check if we should trigger a matrix message (>=90)
        if (roll >= 90) {
            // Pick a random matrix message
            const randomMessage = this.matrixMessages[Math.floor(Math.random() * this.matrixMessages.length)];
            // Mark as pending until animation page acknowledges
            const lastMsgElement = document.getElementById('lastMatrixMessage');
            if (lastMsgElement) {
                lastMsgElement.textContent = 'PENDING…';
                lastMsgElement.style.color = '#ffaa00';
            }

            // Send matrix message to main page; will be ACKed via matrix_message_displayed
            this.sendMessage({
                type: 'matrix_message',
                message: randomMessage,
                roll: roll,
                timestamp: Date.now()
            });

            console.log(`🎲 Matrix roll ${roll}/100 - TRIGGERED! Message: "${randomMessage}"`);
        } else {
            console.log(`🎲 Matrix roll: ${roll}/100 (no trigger)`);
        }
    }

    updateDiceCountdownDisplay() {
        const countdownEl = document.getElementById('diceCountdown');
        if (countdownEl) {
            countdownEl.textContent = this.diceCountdown;

            // Add urgency styling for low countdown
            if (this.diceCountdown <= 3) {
                countdownEl.style.color = '#ff0041'; // Red for urgency
                countdownEl.style.fontWeight = 'bold';
            } else if (this.diceCountdown <= 5) {
                countdownEl.style.color = '#ffaa00'; // Orange for warning
                countdownEl.style.fontWeight = 'bold';
            } else {
                countdownEl.style.color = '#ff00ff'; // Magenta for normal
                countdownEl.style.fontWeight = 'bold';
            }
        }

        // Update countdown SVG circle animation
        const countdownCircle = document.getElementById('countdownCircle');
        if (countdownCircle) {
            // Calculate stroke-dashoffset based on countdown (0-15 seconds)
            const circumference = 176; // 2 * PI * 28 (radius)
            const progress = (15 - this.diceCountdown) / 15;
            const offset = circumference * (1 - progress);
            countdownCircle.style.strokeDashoffset = offset;

            // Change color based on countdown
            if (this.diceCountdown <= 3) {
                countdownCircle.style.stroke = '#ff0041';
            } else if (this.diceCountdown <= 5) {
                countdownCircle.style.stroke = '#ffaa00';
            } else {
                countdownCircle.style.stroke = '#00ff85';
            }
        }

        // Update performance metric bars
        this.updatePerformanceBars();
    }

    updatePerformanceBars() {
        // Update FPS bar
        const fpsBar = document.querySelector('.fps-bar');
        if (fpsBar) {
            const fps = parseInt(document.getElementById('fpsCounter')?.textContent) || 0;
            const fpsPercent = Math.min((fps / 60) * 100, 100);
            fpsBar.style.width = fpsPercent + '%';

            // Color coding
            if (fps < 30) {
                fpsBar.style.background = 'linear-gradient(90deg, #ff4444, #ff6666)';
            } else if (fps < 50) {
                fpsBar.style.background = 'linear-gradient(90deg, #ffaa00, #ffcc00)';
            } else {
                fpsBar.style.background = 'linear-gradient(90deg, #00ff85, #00ffcc)';
            }
        }

        // Update Memory bar
        const memBar = document.querySelector('.mem-bar');
        if (memBar && window.performanceStatsController) {
            const memPercent = window.performanceStatsController.memory.percent || 0;
            memBar.style.width = memPercent + '%';

            // Color coding
            if (memPercent > 80) {
                memBar.style.background = 'linear-gradient(90deg, #ff4444, #ff6666)';
            } else if (memPercent > 60) {
                memBar.style.background = 'linear-gradient(90deg, #ffaa00, #ffcc00)';
            } else {
                memBar.style.background = 'linear-gradient(90deg, #00ff85, #00ffcc)';
            }
        }

        // Update DOM bar
        const domBar = document.querySelector('.dom-bar');
        if (domBar && window.performanceStatsController) {
            const domNodes = window.performanceStatsController.domNodes || 0;
            const domPercent = Math.min((domNodes / 10000) * 100, 100);
            domBar.style.width = domPercent + '%';

            // Color coding
            if (domNodes > 5000) {
                domBar.style.background = 'linear-gradient(90deg, #ff4444, #ff6666)';
            } else if (domNodes > 3000) {
                domBar.style.background = 'linear-gradient(90deg, #ffaa00, #ffcc00)';
            } else {
                domBar.style.background = 'linear-gradient(90deg, #00ff85, #00ffcc)';
            }
        }

        // Update FX bar
        const fxBar = document.querySelector('.fx-bar');
        if (fxBar) {
            const activeEffects = parseInt(document.getElementById('activeEffects')?.textContent) || 0;
            const fxPercent = Math.min((activeEffects / 10) * 100, 100);
            fxBar.style.width = fxPercent + '%';
        }
    }

    /**
     * Update active effects counter display
     */
    updateActiveEffectsCount() {
        const effectBtns = document.querySelectorAll('.effect-toggle-btn[data-state="on"]');
        const count = effectBtns.length;
        const fxElement = document.getElementById('activeEffects');
        if (fxElement) {
            fxElement.textContent = count;
        }
    }

    updateLastDiceRollDisplay() {
        const lastRollEl = document.getElementById('lastDiceRoll');
        if (lastRollEl) {
            const roll = this.lastDiceRoll;
            const triggered = roll > 90;

            // Simple display showing roll value and trigger status
            lastRollEl.textContent = `${roll}/100 ${triggered ? '✓' : ''}`;

            // Update color based on trigger
            lastRollEl.style.color = triggered ? '#00ff41' : '#666';
            lastRollEl.style.fontWeight = triggered ? 'bold' : 'normal';

            // Add pulse animation if triggered
            if (triggered) {
                lastRollEl.style.animation = 'none';
                setTimeout(() => {
                    lastRollEl.style.animation = 'pulse 0.5s ease';
                }, 10);
            }
        }
    }

    startSystemMonitoring() {
        // Update system uptime (managed)
        const startTime = Date.now();
        intervalManager.set('prof-panel-system-monitoring', () => {
            const uptime = Date.now() - startTime;
            const hours = Math.floor(uptime / 3600000).toString().padStart(2, '0');
            const minutes = Math.floor((uptime % 3600000) / 60000).toString().padStart(2, '0');
            const seconds = Math.floor((uptime % 60000) / 1000).toString().padStart(2, '0');

            const uptimeElement = document.getElementById('systemUptime');
            if (uptimeElement) {
                uptimeElement.textContent = `${hours}:${minutes}:${seconds}`;
            }

            // Update system status
            const systemStatus = document.getElementById('systemStatus');
            if (systemStatus) {
                systemStatus.textContent = this.isConnected ? 'ONLINE' : 'STANDBY';
                systemStatus.style.color = this.isConnected ? '#00ff85' : '#ffaa00';
            }
        }, 1000);
    }

    startPerformanceMonitoring() {
        // Prefer shared performance bus so values match the main page
        if (window.performanceBus && typeof window.performanceBus.subscribe === 'function') {
            window.performanceBus.subscribe(({ fps }) => {
                const value = Number.isFinite(fps) ? fps : 0;
                this.performance.fps = value;
                const fpsElement = document.getElementById('fpsCounter');
                if (fpsElement) {
                    fpsElement.textContent = value;
                    fpsElement.classList.remove('warning', 'danger');
                    if (value < 30) {
                        fpsElement.classList.add('danger');
                    } else if (value < 50) {
                        fpsElement.classList.add('warning');
                    }
                }
            });
        } else {
            // Fallback: local rAF averaging (kept for offline debugging)
            let frameTimes = [];
            let lastTime = performance.now();
            let lastUpdateTime = 0;
            const updateInterval = 500; // Update every 500ms
            const measureFPS = (currentTime) => {
                const deltaTime = currentTime - lastTime;
                lastTime = currentTime;
                frameTimes.push(deltaTime);
                if (frameTimes.length > 60) frameTimes.shift();
                if (currentTime - lastUpdateTime > updateInterval) {
                    const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
                    const fps = Math.round(1000 / avgFrameTime);
                    this.performance.fps = fps;
                    const fpsElement = document.getElementById('fpsCounter');
                    if (fpsElement) {
                        fpsElement.textContent = fps;
                        fpsElement.classList.remove('warning', 'danger');
                        if (fps < 30) fpsElement.classList.add('danger');
                        else if (fps < 50) fpsElement.classList.add('warning');
                    }
                    lastUpdateTime = currentTime;
                }
                requestAnimationFrame(measureFPS);
            };
            requestAnimationFrame(measureFPS);
        }

        // Memory and DOM monitoring (managed)
        intervalManager.set('prof-panel-performance-monitoring', () => {
            // Memory usage (if available)
            if (performance.memory) {
                const memUsed = performance.memory.usedJSHeapSize / (1024 * 1024);
                this.performance.memory = Math.round(memUsed);

                const memElement = document.getElementById('memoryUsage');
                if (memElement) {
                    memElement.textContent = this.performance.memory;
                }
            }

            // DOM node count
            this.performance.domNodes = document.querySelectorAll('*').length;
            const domElement = document.getElementById('domNodes');
            if (domElement) {
                domElement.textContent = this.performance.domNodes;
            }

            // Count active effects
            let activeCount = 0;
            for (let effect in this.effects) {
                if (this.effects[effect].enabled) activeCount++;
            }
            const effectsElement = document.getElementById('activeEffects');
            if (effectsElement) {
                effectsElement.textContent = activeCount;
            }

            // Send performance data to main page
            this.sendMessage({
                type: 'performance_stats',
                fps: this.performance.fps,
                memory: this.performance.memory,
                domNodes: this.performance.domNodes,
                activeEffects: activeCount,
                timestamp: Date.now()
            });
        }, 2000); // Update every 2 seconds

        // Request the main page's live performance once per second (managed)
        intervalManager.set('prof-panel-performance-requests', () => {
            this.sendMessage({ type: 'request_performance', timestamp: Date.now() });
        }, 1000);
    }
}

// Initialize the professional control panel
const professionalVJPanel = new ProfessionalVJControlPanel();
window.VJControlPanel = professionalVJPanel;

console.log('🎛️ Professional VJ Control Panel loaded and ready');
