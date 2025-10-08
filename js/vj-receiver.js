// VJ Receiver Module - Receives control messages from control panel
// Integrates with existing chaos engine

import gsap from 'gsap';
import intervalManager from './interval-manager.js';
const VJ_DEBUG = false;
import filterManager from './filter-manager.js';
import fxController from './fx-controller.js';
import animationManager from './animation-manager.js';
import vjMessaging, { MESSAGE_TYPES } from './vj-messaging.js';

// Ensure GSAP is globally available
if (typeof window !== 'undefined' && !window.gsap) {
    window.gsap = gsap;
}

// ============================================
// OVERLAY SYSTEM
// ============================================

// Ensure overlay root exists
function ensureOverlayRoot() {
    let root = document.getElementById('overlays-root');
    if (!root) {
        root = document.createElement('div');
        root.id = 'overlays-root';
        root.className = 'overlay-root';
        document.body.appendChild(root);
    }
    return root;
}

// Get or create blackout overlay element
function getBlackoutEl() {
    const root = ensureOverlayRoot();
    let el = root.querySelector('.overlay-blackout');
    if (!el) {
        el = document.createElement('div');
        el.className = 'overlay-blackout';
        root.appendChild(el);
    }
    return el;
}

// Get or create matrix message overlay element 
function getMatrixEl() {
    const root = ensureOverlayRoot();
    let el = root.querySelector('.overlay-matrix');
    if (!el) {
        el = document.createElement('div');
        el.className = 'overlay-matrix';
        root.appendChild(el);
    }
    return el;
}

// Public overlay API
export function setBlackout(on) {
    const el = getBlackoutEl();
    if (on) {
        el.classList.add('overlay-visible');
    } else {
        el.classList.remove('overlay-visible');
    }
}

export function showMatrixMessage(text) {
    const el = getMatrixEl();
    el.textContent = text || '';
    el.classList.add('overlay-visible');
}

export function hideMatrixMessage() {
    const el = getMatrixEl();
    el.classList.remove('overlay-visible');
}

// Debounce helper for matrix messages
let matrixMessageDebounceTimer = null;
function debouncedShowMatrixMessage(text) {
    if (matrixMessageDebounceTimer) {
        clearTimeout(matrixMessageDebounceTimer);
    }
    
    const currentEl = getMatrixEl();
    if (currentEl.textContent === text && currentEl.classList.contains('overlay-visible')) {
        return; // Same message already showing
    }
    
    showMatrixMessage(text);
}

class VJReceiver {
    constructor() {
        this.channel = null;
        this.isConnected = false;
        this.hasControlPanel = false; // set true once any message arrives from the control panel
        // Use localStorage bridge only when BroadcastChannel is unavailable
        this._useLocalStorageBridge = true;
        // Ripple feature flags
        this.bpmRippleEnabled = false;
        this.bpmRippleInterval = null;
        this.clickRippleEnabled = false; // disable click-based ripple by default to avoid on-click animations
        this.currentSettings = {
            colors: {
                hue: 0,
                saturation: 100,
                brightness: 100,
                contrast: 100
            },
            speed: 1.0,
            phaseDuration: 30000,
            effects: {
                glitch: 0.5,
                particles: 0.5,
                distortion: 0.5,
                noise: 0.5
            },
            scene: 'auto',
            bpm: 120,
            animeEnabled: false
        };
        this.triggerSettings = {
            theme: 'green',
            intensity: 0.7,
            speed: 0.6
        };

        this.animeEnabled = false;
        this.activeFx = 0;
        this.fpsMonitor = null;
        this.localStoragePollingHandle = null; // Track localStorage polling interval

        this.init();
    }

    init() {
        console.log('🎮 VJ Receiver initializing...');
        
        // Initialize VJ messaging system handlers
        this.initVJMessaging();

        // Initialize broadcast channel
        this.initBroadcastChannel();

        // Start performance monitoring
        this.startPerformanceMonitoring();

        // Hook into existing chaos system
        this.hookIntoChaosEngine();

        // Enable click/touch ripple (centered on pointer) if allowed
        this.setupClickRipple();

        // If no control panel connects shortly, enable autonomous MATRIX dice as fallback
        this._fallbackArmTimeout = setTimeout(() => {
            if (!this.hasControlPanel && window.matrixMessages && typeof window.matrixMessages.enableAutonomousDiceMode === 'function') {
                console.log('🕒 No control panel detected — enabling autonomous MATRIX dice mode');
                window.matrixMessages.enableAutonomousDiceMode();
                this._fallbackDiceEnabled = true;
            }
        }, 25000);
    }
    
    initVJMessaging() {
        // Set up handlers for the new VJ messaging system
        vjMessaging.on(MESSAGE_TYPES.EMERGENCY_KILL, () => {
            setBlackout(true);
            this.emergencyStop();
        });
        
        vjMessaging.on(MESSAGE_TYPES.SYSTEM_RESET, () => {
            setBlackout(false);
            this.resetAllSystems();
        });
        
        vjMessaging.on(MESSAGE_TYPES.SYSTEM_RELOAD, () => {
            window.location.reload();
        });
        
        vjMessaging.on(MESSAGE_TYPES.SET_PERFORMANCE_MODE, (payload) => {
            this.setPerformanceMode(payload.mode);
        });
        
        vjMessaging.on(MESSAGE_TYPES.MATRIX_MESSAGE_SHOW, (payload) => {
            debouncedShowMatrixMessage(payload.text);
        });
        
        vjMessaging.on(MESSAGE_TYPES.MATRIX_MESSAGE_HIDE, () => {
            hideMatrixMessage();
        });
        
        console.log('📡 VJ messaging handlers initialized');
    }

    initBroadcastChannel() {
        try {
            // Create broadcast channel
            this.channel = new BroadcastChannel('3886_vj_control');
            // Disable LS bridge when BroadcastChannel is available
            this._useLocalStorageBridge = false;

            // Use addEventListener for better reliability
            this.channel.addEventListener('message', (event) => {
                if (VJ_DEBUG) console.log('📨 VJ Receiver received:', event.data.type);
                this.handleMessage(event.data);
            });

            this.isConnected = true;
            console.log('📡 VJ Receiver connected via BroadcastChannel');

        } catch (error) {
            console.error('Failed to initialize BroadcastChannel:', error);

            // Fallback to localStorage events
            this.initLocalStorageFallback();
        }
    }

    initLocalStorageFallback() {
        // Enable LS bridge when BC is not available
        this._useLocalStorageBridge = true;
        console.log('Using localStorage fallback for VJ control');

        // Listen for storage events (cross-tab)
        window.addEventListener('storage', (e) => {
            if (e.key === '3886_vj_message') {
                const data = JSON.parse(e.newValue);
                this.handleMessage(data);
            }
        });

        // ADDED: Poll localStorage for changes (same-tab detection)
        this.lastMessageId = null;
        this.startLocalStoragePolling();

        // Override sendMessage for localStorage
        this.sendMessage = (data) => {
            const payload = {
                ...data,
                timestamp: Date.now()
            };
            if (this._useLocalStorageBridge) {
                try { localStorage.setItem('3886_vj_response', JSON.stringify(payload)); } catch {}
            }
            if (this.channel) {
                try { this.channel.postMessage(payload); } catch {}
            }
        };
    }

    startLocalStoragePolling() {
        // Guard against duplicate polling intervals
        if (this.localStoragePollingHandle) {
            console.warn('⚠️ localStorage polling already active, skipping duplicate');
            return;
        }
        
        this.localStoragePollingHandle = intervalManager.createInterval(() => {
            const messageData = localStorage.getItem('3886_vj_message');
            if (messageData) {
                try {
                    const parsed = JSON.parse(messageData);
                    if (parsed._id && parsed._id !== this.lastMessageId) {
                        this.lastMessageId = parsed._id;
                        console.log('📨 VJ Receiver (polling) received:', parsed.type);
                        this.handleMessage(parsed);
                    }
                } catch (e) {
                    // Ignore JSON parse errors
                }
            }
        }, 1500, 'vj-localStorage-poll', {
            category: 'system',
            maxAge: Infinity // Keep running until explicitly cleared
        });
    }

    sendMessage(data) {
        const messageData = {
            ...data,
            timestamp: Date.now(),
            _id: Math.random().toString(36).substr(2, 9)
        };

        // Prefer BroadcastChannel; LS bridge only when needed
        if (this._useLocalStorageBridge) {
            try {
                console.log('📤 VJ Receiver sending via LS:', messageData.type, messageData);
                localStorage.setItem('3886_vj_response', JSON.stringify(messageData));
            } catch {}
        }

        // Also try BroadcastChannel if available
        if (this.channel) {
            try {
                this.channel.postMessage(messageData);
            } catch (err) {
                // Ignore BC errors, localStorage is primary
            }
        }

        // Redundant safety: for critical connection messages, mirror to LS to wake legacy listeners
        if (!this._useLocalStorageBridge && (messageData.type === 'pong' || messageData.type === 'settings_sync')) {
            try { localStorage.setItem('3886_vj_response', JSON.stringify(messageData)); } catch {}
        }
    }

    handleMessage(data) {
        // console.log('📨 Received control message:', data);

        switch(data.type) {
            case 'control_connect':
                this.hasControlPanel = true;
                if (this._fallbackDiceEnabled && window.matrixMessages?.disableAutonomousDiceMode) {
                    window.matrixMessages.disableAutonomousDiceMode();
                    this._fallbackDiceEnabled = false;
                }
                this.handleConnection();
                break;

            case 'ping':
                this.hasControlPanel = true;
                if (this._fallbackDiceEnabled && window.matrixMessages?.disableAutonomousDiceMode) {
                    window.matrixMessages.disableAutonomousDiceMode();
                    this._fallbackDiceEnabled = false;
                }
                this.sendMessage({ type: 'pong' });
                break;

            case 'scene_change':
                this.changeScene(data.scene);
                break;

            // Support both 'color_update' and 'color_change' from control panel
            case 'color_update':
                this.updateColor(data.parameter, data.value);
                break;

            case 'color_change':
                // Handle the new control panel format
                if (data.property && data.value !== undefined) {
                    this.updateColor(data.property, data.value);
                }
                break;

            case 'color_reset':
                this.resetColors();
                break;

            case 'speed_update':
                this.updateSpeed(data.value);
                break;

            // Support 'speed_change' from control panel
            case 'speed_change':
                this.updateSpeed(data.speed);
                break;

            case 'phase_duration_update':
                this.updatePhaseDuration(data.value);
                break;

            // Support 'phase_duration_change' from control panel
            case 'phase_duration_change':
                this.updatePhaseDuration(data.duration);
                break;

            case 'bpm_update':
                this.updateBPM(data.bpm);
                break;

            // Support 'bpm_change' from control panel
            case 'bpm_change':
                this.updateBPM(data.bpm);
                break;

            case 'effect_intensity': {
                // Accept both value (0..1) and intensity (0..100) from different panels
                let raw = (data.value !== undefined) ? data.value : data.intensity;
                if (raw === undefined || raw === null) break;
                const val = Number(raw) > 1 ? Number(raw) / 100 : Number(raw);
                this.updateEffectIntensity(data.effect, val);
                break;
            }

            // Support 'fx_intensity' from control panel
            case 'fx_intensity': {
                // Normalized 0..1 expected; some send 0..100
                const val = Number(data.intensity) > 1 ? Number(data.intensity) / 100 : Number(data.intensity);
                this.updateEffectIntensity(data.effect, val);
                break;
            }

            case 'trigger_effect':
                if (data.settings) this._mergeTriggerSettings(data.settings);
                this.triggerEffect(data.effect, data.settings);
                break;

            case 'trigger_settings':
                if (data.settings) this._mergeTriggerSettings(data.settings);
                break;

            case 'trigger_macro':
                if (data.settings) this._mergeTriggerSettings(data.settings);
                this.runMacro(data.macro || 'impact', data.settings);
                break;

            case 'preset_load':
                this.loadPreset(data.preset);
                break;

            case 'performance_mode':
                this.setPerformanceMode(data.mode);
                break;

            case 'anime_enable': {
                console.log('🎯 Processing anime_enable request');
                this.handleAnimeEnable();
                break;
            }

            case 'anime_disable':
                console.log('🛑 Processing anime_disable');
                if (window.animeManager) {
                    window.animeManager.pauseAll();
                }
                this.setAnimeFlag(false);
                // Also stop enhanced effects and logo system, and cleanup custom animations
                try { window.animeEnhancedEffects?.pause?.(); } catch {}
                try { window.disableLogoAnimation?.(); } catch {}
                try { window.animationManager?.cleanup?.(); } catch {}
                this.sendAnimeStatus('disabled', false, { success: true });
                break;

            case 'anime_kill':
            case 'anime_kill_all':  // Support control panel alias
                console.log('💀 Processing anime_kill');
                if (window.animeManager) {
                    window.animeManager.killAll();
                }
                this.sendAnimeStatus('killed', this.animeEnabled, { success: true });
                break;

            case 'anime_emergency_stop':
                console.log('🚨 Processing anime_emergency_stop');
                if (window.animeManager) {
                    window.animeManager.killAll();
                }
                this.setAnimeFlag(false);
                this.sendAnimeStatus('emergency_stopped', false, { success: true });
                break;

            case 'anime_trigger': {
                const animationId = data.id || data.effect;
                console.log('🎬 Processing anime_trigger:', animationId);
                this.handleAnimeTrigger(animationId);
                break;
            }

            case 'layer_toggle': {
                console.log('🎭 Processing layer_toggle:', data.layer, data.visible);
                this.toggleLayer(data.layer, data.visible);
                break;
            }

            // Logo animation controls
            case 'logo_pulse_trigger':
                console.log('💫 Triggering logo pulse');
                if (this.animeEnabled === false) {
                    console.warn('⚠️ Logo pulse blocked: anime system disabled');
                    this.sendAnimeStatus('blocked', false, { actionId: 'logo-pulse', success: false, reason: 'disabled' });
                    break;
                }
                // Prefer the professional animation manager
                if (window.animationManager && typeof window.animationManager.trigger === 'function') {
                    window.animationManager.trigger('logo-pulse');
                } else if (window.triggerLogoPulse) {
                    window.triggerLogoPulse();
                } else if (window.logoAnimations?.drawIn) {
                    window.logoAnimations.drawIn.restart();
                } else {
                    // Last-resort GSAP pulse on the raster logo
                    const gsap = window.gsap;
                    const logo = document.querySelector('.image-2');
                    if (gsap && logo) {
                        gsap.to(logo, { scale: 1.2, duration: 0.3, yoyo: true, repeat: 1, ease: 'power2.inOut' });
                    }
                }
                this.sendMessage({ type: 'logo_pulse_triggered', timestamp: Date.now() });
                break;

            case 'logo_glow_toggle':
                console.log('✨ Toggling logo glow');
                if (this.animeEnabled === false) {
                    console.warn('⚠️ Logo glow toggle blocked: anime system disabled');
                    this.sendAnimeStatus('blocked', false, { actionId: 'logo-glow', success: false, reason: 'disabled' });
                    break;
                }
                if (window.animationManager && typeof window.animationManager.trigger === 'function') {
                    // Use a one-shot glow pulse
                    window.animationManager.trigger('logo-glow');
                } else if (window.toggleLogoGlow) {
                    window.toggleLogoGlow();
                } else if (window.logoAnimations?.glowPulse) {
                    if (window.logoAnimations.glowPulse.paused) {
                        window.logoAnimations.glowPulse.play();
                    } else {
                        window.logoAnimations.glowPulse.pause();
                    }
                } else {
                    // Basic CSS glow fallback
                    const el = document.querySelector('.image-2');
                    if (el) {
                        const prev = el.style.filter;
                        el.style.filter = 'drop-shadow(0 0 30px #00ff41) drop-shadow(0 0 60px #00ff41)';
                        setTimeout(() => { el.style.filter = prev; }, 1000);
                    }
                }
                this.sendMessage({ type: 'logo_glow_toggled', timestamp: Date.now() });
                break;

            case 'logo_outline_toggle':
                console.log('🔲 Toggling logo outline:', data.enabled);
                // Set outline mode for logo
                const logoSvg = document.querySelector('.anime-logo-container svg');
                if (logoSvg) {
                    const paths = logoSvg.querySelectorAll('path, line, polyline, polygon, circle, ellipse');
                    paths.forEach(path => {
                        if (data.enabled) {
                            path.style.fill = 'none';
                            path.style.stroke = '#00ff41';
                            path.style.strokeWidth = '2';
                        } else {
                            path.style.fill = '';
                            path.style.stroke = '';
                            path.style.strokeWidth = '';
                        }
                    });
                }
                this.sendMessage({ type: 'logo_outline_toggled', enabled: data.enabled, timestamp: Date.now() });
                break;

            case 'matrix_message':
                console.log('📝 Displaying matrix message:', data.message);
                // Trigger matrix message display
                if (window.matrixMessages && window.matrixMessages.showMessage) {
                    window.matrixMessages.showMessage(data.message);
                    // Acknowledge immediately that the message display has started
                    this.sendMessage({
                        type: 'matrix_message_displayed',
                        message: data.message,
                        timestamp: Date.now()
                    });
                } else {
                    // Fallback: dispatch event for other systems to handle
                    window.dispatchEvent(new CustomEvent('matrixMessage', {
                        detail: { message: data.message, roll: data.roll }
                    }));
                    this.sendMessage({
                        type: 'matrix_message_displayed',
                        message: data.message,
                        timestamp: Date.now()
                    });
                }
                break;

            case 'emergency_stop':
                this.emergencyStop();
                break;

            case 'system_reset':
                console.log('🔄 Processing system_reset');
                this.resetAllSystems();
                break;

            case 'system_reload':
                console.log('🌀 Processing system_reload (full restart)');
                try {
                    if (window.ChaosControl && typeof window.ChaosControl.restart === 'function') {
                        window.ChaosControl.restart();
                    } else if (window.chaosInit && typeof window.chaosInit.init === 'function') {
                        window.chaosInit.destroy?.();
                        setTimeout(() => window.chaosInit.init(), 100);
                    } else {
                        // Fallback: hard reload as last resort
                        window.location.reload();
                    }
                } catch (e) {
                    console.error('Failed to process system_reload, reloading page:', e);
                    try { window.location.reload(); } catch {}
                }
                break;

            case 'effect_toggle':
                console.log('🎛️ Processing effect_toggle:', data.effect, data.enabled);
                if (data.effect && data.enabled !== undefined) {
                    // Toggle the effect
                    this.toggleEffect(data.effect, data.enabled);
                }
                break;

            case 'emergency_cleanup':
                this.executeEmergencyCleanup();
                break;

            case 'safe_cleanup':
                this.executeSafeCleanup();
                break;

            case 'emergency_brake':
                this.executeEmergencyBrake();
                break;

            case 'performance_optimization':
                this.executePerformanceOptimization();
                break;

            case 'bpm_ripple_toggle':
                this.setBpmRippleEnabled(!!data.enabled);
                this.sendMessage({ type: 'bpm_ripple_toggled', enabled: !!data.enabled, timestamp: Date.now() });
                break;

            case 'request_performance':
                this.sendPerformanceData();
                break;

            case 'get_performance_stats':
                this.sendDetailedPerformanceData();
                break;

            // Some control panels send this alias
            case 'request_performance_detailed':
                this.sendDetailedPerformanceData();
                break;

            case 'run_animation_diagnostics':
                this.runAnimationDiagnostics();
                break;

            case 'sequence_event':
                this.handleSequenceEvent(data);
                break;

            case 'apply_settings':
                console.log('🔄 VJ Receiver: Applying settings from control panel');
                this.applyControlPanelSettings(data.data);
                break;

            // REMOVED: Complex reset handlers - now using minimal reset approach
            default:
                // Handle new VJ messaging system messages
                if (data.kind === 'ZIKADA_CONTROL') {
                    this.handleVJMessage(data);
                }
                break;
        }
    }

    handleVJMessage(data) {
        const { type, payload } = data;
        
        switch (type) {
            case MESSAGE_TYPES.EMERGENCY_KILL:
                console.log('🚨 Emergency Kill triggered via VJ messaging');
                setBlackout(true);
                this.emergencyStop();
                break;
                
            case MESSAGE_TYPES.SYSTEM_RESET:
                console.log('🔄 System Reset triggered via VJ messaging');
                setBlackout(false);
                this.resetAllSystems();
                break;
                
            case MESSAGE_TYPES.SYSTEM_RELOAD:
                console.log('🌀 System Reload triggered via VJ messaging');
                window.location.reload();
                break;
                
            case MESSAGE_TYPES.SET_PERFORMANCE_MODE:
                console.log('⚡ Performance mode change via VJ messaging:', payload.mode);
                this.setPerformanceMode(payload.mode);
                break;
                
            case MESSAGE_TYPES.MATRIX_MESSAGE_SHOW:
                console.log('📝 Matrix message show via VJ messaging:', payload.text);
                debouncedShowMatrixMessage(payload.text);
                break;
                
            case MESSAGE_TYPES.MATRIX_MESSAGE_HIDE:
                console.log('📝 Matrix message hide via VJ messaging');
                hideMatrixMessage();
                break;
        }
    }

    handleConnection() {
        console.log('🎛️ Control panel connected');

        // Send current settings
        this.sendMessage({
            type: 'settings_sync',
            settings: this.currentSettings
        });
        this.sendAnimeStatus('status', this.animeEnabled);
    }

    changeScene(scene) {
        console.log(`🎬 Changing scene to: ${scene}`);

        const chaosInit = window.chaosInit;
        if (!chaosInit) return;

        if (scene === 'auto') {
            // Resume auto phase switching
            chaosInit.phaseRunning = true;
            chaosInit.startAnimationPhases();
        } else {
            // Stop auto switching
            chaosInit.phaseRunning = false;

            // Trigger specific phase
            switch(scene) {
                case 'intense':
                    chaosInit.phaseIntense();
                    break;
                case 'calm':
                    chaosInit.phaseCalm();
                    break;
                case 'glitch':
                    chaosInit.phaseGlitch();
                    break;
                case 'techno':
                    chaosInit.phaseTechno();
                    break;
                case 'matrix':
                    chaosInit.phaseMatrix();
                    break;
                case 'minimal':
                    chaosInit.phaseMinimal();
                    break;
                case 'chaotic':
                    chaosInit.phaseChaotic();
                    break;
                case 'retro':
                    chaosInit.phaseRetro();
                    break;
                case 'vaporwave':
                    chaosInit.phaseVaporwave();
                    break;
                case 'cyberpunk':
                    chaosInit.phaseCyberpunk();
                    break;
                case 'neon':
                    chaosInit.phaseNeon();
                    break;
                case 'aurora':
                    chaosInit.phaseAurora();
                    break;
                case 'sunset':
                    chaosInit.phaseSunset();
                    break;
                case 'ocean':
                    chaosInit.phaseOcean();
                    break;
                case 'forest':
                    chaosInit.phaseForest();
                    break;
                case 'fire':
                    chaosInit.phaseFire();
                    break;
                case 'ice':
                    chaosInit.phaseIce();
                    break;
                case 'galaxy':
                    chaosInit.phaseGalaxy();
                    break;
            }
        }

        this.currentSettings.scene = scene;

        // Log and expose current scene for diagnostics
        try {
            console.log(`[VJ] Scene -> ${String(scene).toUpperCase()}`);
            // Provide a getter on ChaosControl when available (non-destructive)
            if (window.ChaosControl && typeof window.ChaosControl.getScene !== 'function') {
                window.ChaosControl.getScene = () => this.currentSettings.scene;
            }
        } catch (_) {}

        // Send confirmation
        this.sendMessage({
            type: 'scene_changed',
            scene: scene
        });
    }

    updateColor(parameter, value) {
        console.log(`🎛️ VJ Receiver: updateColor called - ${parameter}: ${value}`);
        
        this.currentSettings.colors[parameter] = value;
        
        console.log('🎛️ Updated color settings:', this.currentSettings.colors);
        
        // Route through centralized filter manager for smooth, safe updates
        filterManager.setPartial({ [parameter]: value }, 300);
    }

    // Convenience: update multiple colors at once (wrapper)
    updateColors(hue, saturation, brightness, contrast) {
        if (hue !== undefined) this.updateColor('hue', hue);
        if (saturation !== undefined) this.updateColor('saturation', saturation);
        if (brightness !== undefined) this.updateColor('brightness', brightness);
        if (contrast !== undefined) this.updateColor('contrast', contrast);
        // Apply current combined color state
        this.applyColorFilter();
    }

    applyColorFilter() {
        console.log('🎨 applyColorFilter called with settings:', this.currentSettings.colors);
        
        const { hue, saturation, brightness, contrast } = this.currentSettings.colors;
        // Delegate to filter manager
        filterManager.setPartial({ hue, saturation, brightness, contrast }, 0);
        console.log('✅ Color filter applied via FilterManager');
    }

    resetColors() {
        this.currentSettings.colors = {
            hue: 0,
            saturation: 100,
            brightness: 100,
            contrast: 100
        };

        // Use safe filter application to prevent grey flashes
        if (window.chaosInit && typeof window.chaosInit.safeApplyFilter === 'function') {
            window.chaosInit.safeApplyFilter(document.body, 'none', 0.5);
        } else {
            // Fallback: use filter manager
            filterManager.applyImmediate('none', 0.5);
        }
    }

    updateSpeed(value) {
        this.currentSettings.speed = value;

        // Update GSAP global timeline scale
        gsap.globalTimeline.timeScale(value);

        // Keep anime.js timelines in sync when available
        if (window.animeManager && typeof window.animeManager.setSpeed === 'function') {
            window.animeManager.setSpeed(value);
        }

        // Update timing controller if available
        if (window.timingController) {
            window.timingController.setGlobalSpeed(value);
        }
    }

    updatePhaseDuration(value) {
        // Accept seconds or ms; convert seconds (<1000) to ms
        const valueMs = Number(value) < 1000 ? Number(value) * 1000 : Number(value);
        this.currentSettings.phaseDuration = valueMs;

        // Update phase switching interval deterministically
        const chaosInit = window.chaosInit;
        if (chaosInit) {
            chaosInit.phaseDurationMs = valueMs;
            console.log(`Phase duration updated to ${valueMs}ms`);
            if (typeof chaosInit.stopAnimationPhases === 'function') chaosInit.stopAnimationPhases();
            if (typeof chaosInit.startAnimationPhases === 'function') chaosInit.startAnimationPhases();
        }
    }

    updateBPM(bpm) {
        this.currentSettings.bpm = bpm;

        // Calculate beat interval
        const beatInterval = 60000 / bpm;

        // Pulse effects to BPM
        if (window.enhancedLogoAnimator) {
            // Sync logo pulse to BPM
            gsap.to('.logo-text-wrapper, .image-wrapper', {
                scale: 1.02,
                duration: beatInterval / 2000,
                yoyo: true,
                repeat: -1,
                ease: 'sine.inOut'
            });
        }

        // Restart BPM ripple if enabled
        this.setupBpmRippleTimer();
    }

    updateEffectIntensity(effect, value) {
        this.currentSettings.effects[effect] = value;

        switch(effect) {
            case 'glitch':
                this.updateGlitchIntensity(value);
                break;
            case 'particles':
                this.updateParticleIntensity(value);
                break;
            case 'distortion':
                this.updateDistortionIntensity(value);
                break;
            case 'noise':
                this.updateNoiseIntensity(value);
                break;
        }
    }

    updateGlitchIntensity(value) {
        // Adjust glitch pass intensity
        fxController.setIntensity({ glitch: value });
    }

    updateParticleIntensity(value) {
        // Adjust particle system
        fxController.setIntensity({ particles: value });
    }

    updateDistortionIntensity(value) {
        // Adjust distortion effects
        fxController.setIntensity({ distortion: value });
    }

    updateNoiseIntensity(value) {
        // Adjust static noise
        fxController.setIntensity({ noise: value });
    }

    // Convenience: set all effect intensities in one call (wrapper)
    setEffectIntensities(glitch, particles, distortion, noise) {
        if (glitch !== undefined) this.updateEffectIntensity('glitch', glitch);
        if (particles !== undefined) this.updateEffectIntensity('particles', particles);
        if (distortion !== undefined) this.updateEffectIntensity('distortion', distortion);
        if (noise !== undefined) this.updateEffectIntensity('noise', noise);
    }

    triggerEffect(effect) {
        console.log(`⚡ Triggering effect: ${effect}`);
        this.activeFx++;

        // Adjust effect strength/duration using fx intensities
        const mult = window.fxController ? window.fxController.globalMult : 1;
        const glitchI = window.fxController ? window.fxController.getIntensity('glitch') : 0.5;
        const particlesI = window.fxController ? window.fxController.getIntensity('particles') : 0.5;
        const distortionI = window.fxController ? window.fxController.getIntensity('distortion') : 0.5;
        const noiseI = window.fxController ? window.fxController.getIntensity('noise') : 0.5;

        switch(effect) {
            case 'strobe':
                this.triggerStrobe();
                break;
            case 'blackout':
                this.triggerBlackout();
                break;
            case 'whiteout':
                this.triggerWhiteout();
                break;
            case 'rgbsplit':
                this.triggerRGBSplit();
                break;
            case 'shake':
                this.triggerShake();
                break;
            case 'ripple':
                this.triggerRipple();
                break;
            case 'pulse':
                this.triggerPulse();
                break;
            case 'matrix-rain':
                this.triggerMatrixRain();
                break;
            case 'cosmic':
                this.triggerCosmicBurst();
                break;
            case 'vignette-pulse':
                this.triggerVignettePulse();
                break;
            case 'scanlines-sweep':
                this.triggerScanlinesSweep();
                break;
            case 'chroma-pulse':
                this.triggerChromaticPulse();
                break;
            case 'noise-burst':
                this.triggerNoiseBurst();
                break;
            case 'grid-flash':
                this.triggerGridFlash();
                break;
            case 'lens-flare':
                this.triggerLensFlare();
                break;
            case 'zoom-blur':
                this.triggerZoomBlurPulse();
                break;
            case 'invert-flicker':
                this.triggerInvertFlicker();
                break;
            case 'spotlight-sweep':
                this.triggerSpotlightSweep();
                break;
            case 'heat-shimmer':
                this.triggerHeatShimmer();
                break;
        }

        // Decrement active effects counter after effect duration
        setTimeout(() => {
            this.activeFx--;
        }, 2000);
    }

    _mergeTriggerSettings(s) {
        if (!s) return;
        this.triggerSettings.theme = (s.theme || this.triggerSettings.theme);
        if (typeof s.intensity === 'number') this.triggerSettings.intensity = Math.max(0, Math.min(1, s.intensity));
        if (typeof s.speed === 'number') this.triggerSettings.speed = Math.max(0.1, Math.min(1, s.speed));
    }

    _themeColor() {
        const t = (this.triggerSettings.theme || 'green').toLowerCase();
        switch (t) {
            case 'cyan': return '#00ffff';
            case 'magenta': return '#ff00ff';
            case 'amber': return '#ffcc00';
            default: return '#00ff85';
        }
    }

    // Macro sequences
    runMacro(id) {
        const speed = this.triggerSettings.speed || 0.6;
        const delay = (ms) => new Promise(r => setTimeout(r, ms));
        const step = Math.max(80, Math.round(220 - speed * 150));
        const seq = async (arr) => {
            for (const e of arr) { this.triggerEffect(e); await delay(step + Math.random()*80); }
        };
        switch ((id || '').toLowerCase()) {
            case 'glitch':
                seq(['chroma-pulse', 'rgbsplit', 'invert-flicker', 'scanlines-sweep']);
                break;
            case 'wave':
                seq(['spotlight-sweep', 'ripple', 'digital-wave', 'lens-flare']);
                break;
            default:
                // impact
                seq(['zoom-blur', 'vignette-pulse', 'lens-flare', 'strobe']);
        }
    }

    triggerVignettePulse() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; inset: 0; pointer-events: none; z-index: 10000;
            background: radial-gradient(circle at center,
                rgba(0,0,0,0) 30%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.8) 100%);
            opacity: 0;
        `;
        document.body.appendChild(overlay);
        gsap.to(overlay, { opacity: 1, duration: 0.15, ease: 'power2.out' });
        gsap.to(overlay, { opacity: 0, duration: 0.4, ease: 'power2.in', delay: 0.15, onComplete: () => overlay.remove() });
    }

    triggerScanlinesSweep() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; inset: 0; pointer-events: none; z-index: 10000;
            background-image: repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 2px, transparent 2px, transparent 4px);
            transform: translateY(-10px);
            opacity: 0.8;
        `;
        document.body.appendChild(overlay);
        gsap.to(overlay, { y: window.innerHeight + 10, duration: 0.6, ease: 'linear' });
        gsap.to(overlay, { opacity: 0, duration: 0.2, delay: 0.45, onComplete: () => overlay.remove() });
    }

    triggerChromaticPulse() {
        try {
            const ce = window.chaosEngine;
            if (ce && ce.chromaticAberrationPass) {
                const u = ce.chromaticAberrationPass.uniforms;
                const base = u.amount.value;
                gsap.to(u.amount, { value: Math.max(base, 0.01), duration: 0.1, ease: 'power2.out' });
                gsap.to(u.amount, { value: base, duration: 0.25, delay: 0.12, ease: 'power2.in' });
                return;
            }
        } catch {}
        // Fallback: brief hue rotate on body via filter-manager
        if (window.filterManager) {
            const current = window.getComputedStyle(document.body).filter;
            const pulsedFilter = current === 'none' ? 'hue-rotate(45deg)' : `${current} hue-rotate(45deg)`;
            window.filterManager.applyImmediate(pulsedFilter, { duration: 0.1 });
            setTimeout(() => {
                window.filterManager.applyImmediate(current === 'none' ? 'none' : current, { duration: 0.15 });
            }, 250);
        }
    }

    triggerNoiseBurst() {
        // Prefer fxController intensity pulse
        try {
            if (window.fxController) {
                const current = window.fxController.getIntensity('noise');
                window.fxController.setIntensity({ noise: Math.min(1, current + 0.5) });
                setTimeout(() => window.fxController.setIntensity({ noise: current }), 300);
                return;
            }
        } catch {}
        // Fallback overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; inset: 0; pointer-events: none; z-index: 10000; opacity: 0.25;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.9'/%3E%3C/svg%3E");
            background-size: 200px 200px;
        `;
        document.body.appendChild(overlay);
        gsap.to(overlay, { opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: () => overlay.remove() });
    }
    triggerGridFlash() {
        // Pulse cyber grid via fxController state, restore after
        try {
            const fx = window.fxController;
            if (fx) {
                const wasOn = !!fx.effectStates?.cyberGrid;
                fx.setEffectEnabled('cyberGrid', true);
                setTimeout(() => fx.setEffectEnabled('cyberGrid', wasOn), 500);
                return;
            }
        } catch {}
        // Fallback: quick grid overlay
        const grid = document.createElement('div');
        grid.style.cssText = `
            position: fixed; inset: 0; pointer-events:none; z-index: 10000; opacity: 0.9;
            background-image:
                repeating-linear-gradient(0deg, rgba(0,255,133,0.15) 0px, transparent 1px, transparent 40px, rgba(0,255,133,0.15) 40px),
                repeating-linear-gradient(90deg, rgba(0,255,133,0.15) 0px, transparent 1px, transparent 40px, rgba(0,255,133,0.15) 40px);
        `;
        document.body.appendChild(grid);
        gsap.to(grid, { opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: () => grid.remove() });
    }

    triggerLensFlare() {
        // Lightweight diagonal flare sweep
        const flare = document.createElement('div');
        flare.style.cssText = `
            position: fixed; inset: -20% -20% -20% -20%; z-index: 10000; pointer-events: none;
            background: radial-gradient(closest-side, rgba(255,255,255,0.25), rgba(255,255,255,0) 60%);
            mix-blend-mode: screen; opacity: 0; transform: rotate(25deg) translateX(-50%);
        `;
        document.body.appendChild(flare);
        gsap.to(flare, { opacity: 1, duration: 0.05, ease: 'power2.out' });
        gsap.to(flare, { x: window.innerWidth * 1.5, duration: 0.6, ease: 'power2.inOut' });
        gsap.to(flare, { opacity: 0, duration: 0.25, delay: 0.35, onComplete: () => flare.remove() });
    }

    triggerZoomBlurPulse() {
        // Subtle zoom + blur pulse on main elements
        const targets = '.pre-loader, .bg, .image-wrapper, .image-2, .logo-text-wrapper';
        const current = window.getComputedStyle(document.body).filter;
        gsap.to(targets, { scale: 1.06, duration: 0.12, ease: 'power2.out' });
        // Apply blur via filter-manager
        if (window.filterManager) {
            const blurFilter = current === 'none' ? 'blur(2px)' : `${current} blur(2px)`;
            window.filterManager.applyImmediate(blurFilter, { duration: 0.1 });
        }
        gsap.to(targets, { scale: 1, duration: 0.25, delay: 0.12, ease: 'power2.in' });
        setTimeout(() => {
            if (window.filterManager) {
                window.filterManager.applyImmediate(current === 'none' ? 'none' : current, { duration: 0.15 });
            }
        }, 400);
    }

    triggerInvertFlicker() {
        const prev = document.documentElement.style.filter || '';
        document.documentElement.style.filter = 'invert(1)';
        setTimeout(() => { document.documentElement.style.filter = prev; }, 120);
    }

    triggerSpotlightSweep() {
        const spot = document.createElement('div');
        spot.style.cssText = `
            position: fixed; inset: 0; pointer-events: none; z-index: 10000;
            background: radial-gradient(350px 350px at -200px 50%, rgba(255,255,255,0.8), rgba(255,255,255,0) 60%);
            mix-blend-mode: screen; opacity: 0.7;
        `;
        document.body.appendChild(spot);
        gsap.to(spot, { backgroundPositionX: `${window.innerWidth + 400}px`, duration: 0.7, ease: 'power2.inOut' });
        gsap.to(spot, { opacity: 0, duration: 0.2, delay: 0.55, onComplete: () => spot.remove() });
    }

    triggerHeatShimmer() {
        // Quick heat shimmer overlay using subtle transform noise
        const shim = document.createElement('div');
        shim.style.cssText = `
            position: fixed; inset: 0; pointer-events: none; z-index: 10000; opacity: 0.35;
            background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='w'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.01' numOctaves='2'/%3E%3CfeDisplacementMap in='SourceGraphic' scale='20'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23w)' fill='rgba(255,255,255,0.0)'/%3E%3C/svg%3E");
            background-size: 240px 240px;
        `;
        document.body.appendChild(shim);
        gsap.to(shim, { opacity: 0, duration: 0.35, ease: 'power2.in', onComplete: () => shim.remove() });
    }

    triggerStrobe() {
        // Get FX intensities
        const mult = window.fxController ? window.fxController.globalMult : 1;
        const glitchI = window.fxController ? window.fxController.getIntensity('glitch') : 0.5;
        
        const strobe = document.createElement('div');
        strobe.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
            pointer-events: none;
            z-index: 10000;
        `;
        document.body.appendChild(strobe);

        // REDUCED: Faster, shorter strobe animation
        gsap.to(strobe, {
            opacity: 0,
            duration: 0.05 + (0.1 * (1 - glitchI)), // Reduced from 0.1 + 0.2
            repeat: Math.max(1, Math.round(1 + 3 * glitchI * mult)), // Reduced from 2 + 6
            yoyo: true,
            ease: 'none',
            onComplete: () => strobe.remove()
        });
    }

    triggerBlackout() {
        // Get FX intensities
        const glitchI = window.fxController ? window.fxController.getIntensity('glitch') : 0.5;
        
        const blackout = document.createElement('div');
        blackout.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: black;
            pointer-events: none;
            z-index: 10000;
            opacity: 0;
        `;
        document.body.appendChild(blackout);

        gsap.timeline()
            .to(blackout, { opacity: 1, duration: 0.15 + 0.25 * glitchI })
            .to(blackout, { opacity: 0, duration: 0.2 + 0.3 * (1 - glitchI), delay: 1 })
            .call(() => blackout.remove());
    }

    triggerWhiteout() {
        // Get FX intensities
        const glitchI = window.fxController ? window.fxController.getIntensity('glitch') : 0.5;
        
        const whiteout = document.createElement('div');
        whiteout.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
            pointer-events: none;
            z-index: 10000;
            opacity: 0;
        `;
        document.body.appendChild(whiteout);

        gsap.timeline()
            .to(whiteout, { opacity: 1, duration: 0.1 + 0.2 * glitchI })
            .to(whiteout, { opacity: 0, duration: 1 + 1 * (1 - glitchI), ease: 'power2.out' })
            .call(() => whiteout.remove());
    }

    triggerRGBSplit() {
        // Get FX intensities
        const glitchI = window.fxController ? window.fxController.getIntensity('glitch') : 0.5;
        const originalFilter = window.getComputedStyle(document.body).filter || 'none';

        // Durations in seconds (kept from previous behavior)
        const d1 = 0.6 + 1.0 * glitchI;
        const d2 = 0.6 + 1.0 * glitchI;
        const d3 = 1.6 + 1.2 * (1 - glitchI);

        // Sequence via Filter Manager (sanitized, atomic transitions)
        filterManager.applyImmediate('hue-rotate(120deg) saturate(2)', { duration: d1, ease: 'power2.inOut' });
        setTimeout(() => {
            filterManager.applyImmediate('hue-rotate(-120deg) saturate(2)', { duration: d2, ease: 'power2.inOut' });
            setTimeout(() => {
                filterManager.applyImmediate(originalFilter || 'none', { duration: d3, ease: 'power2.out' });
            }, Math.max(0, Math.round(d2 * 1000)));
        }, Math.max(0, Math.round(d1 * 1000)));
    }

    triggerShake() {
        // REPLACED: Ripple effect instead of shake
        this.triggerRipple();
    }

    // Public: enable/disable ripple on BPM
    setBpmRippleEnabled(enabled) {
        this.bpmRippleEnabled = !!enabled;
        this.setupBpmRippleTimer();
    }

    setupBpmRippleTimer() {
        if (this.bpmRippleInterval) {
            clearInterval(this.bpmRippleInterval);
            this.bpmRippleInterval = null;
        }
        if (!this.bpmRippleEnabled) return;
        const bpm = this.currentSettings.bpm || 120;
        const period = Math.max(200, Math.floor(60000 / bpm));
        this.bpmRippleInterval = setInterval(() => {
            // Center ripple on each beat
            this.triggerRipple();
        }, period);
    }

    setupClickRipple() {
        // Always remove any previously attached handlers (HMR safe)
        if (this._clickRippleHandler) {
            try { window.removeEventListener('click', this._clickRippleHandler); } catch (_) {}
            try { window.removeEventListener('touchstart', this._clickRippleHandler); } catch (_) {}
            this._clickRippleHandler = null;
        }
        // Respect flag: if disabled, do not attach click/touch handlers
        if (!this.clickRippleEnabled) return;
        const handler = (ev) => {
            try {
                const x = (ev.touches && ev.touches[0]?.clientX) || ev.clientX || (window.innerWidth / 2);
                const y = (ev.touches && ev.touches[0]?.clientY) || ev.clientY || (window.innerHeight / 2);
                this.triggerRippleAt(x, y);
            } catch (_) {}
        };
        window.addEventListener('click', handler);
        window.addEventListener('touchstart', handler, { passive: true });
        this._clickRippleHandler = handler;
    }

    triggerRipple() {
        // Get FX intensities
        const mult = window.fxController ? window.fxController.globalMult : 1;
        const particlesI = window.fxController ? window.fxController.getIntensity('particles') : 0.5;

        // Use SVG for crisp, anti-aliased rings
        let svg = document.getElementById('vj-ripple-svg');
        if (!svg) {
            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.id = 'vj-ripple-svg';
            svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            svg.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 9990; /* below blackout (10000) */
            `;
            document.body.appendChild(svg);
        }
        // Match viewport for crisp vectors
        svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);

        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        this.triggerRippleAt(cx, cy);
    }

    triggerRippleAt(x, y) {
        const mult = window.fxController ? window.fxController.globalMult : 1;
        const particlesI = window.fxController ? window.fxController.getIntensity('particles') : 0.5;

        let svg = document.getElementById('vj-ripple-svg');
        if (!svg) return; // safety

        const cx = Math.max(0, Math.min(window.innerWidth, x));
        const cy = Math.max(0, Math.min(window.innerHeight, y));

        const rippleCount = Math.max(2, Math.round(3 + 2 * particlesI * mult));
        const colors = [
            '#00ffff',
            '#00ff85',
            '#ff00ff',
            '#ffff00'
        ];

        const maxRadius = Math.sqrt(window.innerWidth * window.innerWidth + window.innerHeight * window.innerHeight) * 0.5;

        for (let i = 0; i < rippleCount; i++) {
            setTimeout(() => {
                const color = colors[i % colors.length];
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', cx);
                circle.setAttribute('cy', cy);
                circle.setAttribute('r', 0);
                circle.setAttribute('fill', 'none');
                circle.setAttribute('stroke', color);
                circle.setAttribute('stroke-width', String(2 + i));
                circle.setAttribute('opacity', '0.9');
                circle.style.filter = `drop-shadow(0 0 ${6 + i * 3}px ${color})`;
                circle.style.willChange = 'opacity';
                svg.appendChild(circle);

                const targetRadius = maxRadius * (0.45 + 0.2 * i);
                gsap.to(circle, {
                    attr: { r: targetRadius },
                    duration: (1.2 + 1.0 * (1 - particlesI)) * (1 + i * 0.15),
                    ease: 'power2.out'
                });
                gsap.to(circle, {
                    opacity: 0,
                    duration: (1.1 + 1.0 * (1 - particlesI)) * (1 + i * 0.15),
                    ease: 'power2.out',
                    onComplete: () => circle.remove()
                });

                // Synchronized glow pulse on logo
                this.logoGlowPulse();
            }, i * 120);
        }
    }

    triggerPulse() {
        // Include main logo in pulse animation
        gsap.to('.logo-text-wrapper, .image-wrapper, .text-3886, .image-2', {
            scale: 1.25,  // Slightly bigger pulse
            duration: 0.4,  // Slightly slower
            yoyo: true,
            repeat: 1,
            ease: 'power2.inOut'
        });
    }

    triggerMatrixRain() {
        // REPLACED: Digital wave effect instead of matrix rain
        this.triggerDigitalWave();
    }

    logoGlowPulse() {
        const targets = document.querySelectorAll('.image-2, .logo-text-wrapper');
        if (!targets.length) return;
        gsap.fromTo(targets, {
            filter: 'drop-shadow(0 0 0px rgba(0,255,133,0))'
        }, {
            filter: 'drop-shadow(0 0 20px rgba(0,255,133,0.9)) drop-shadow(0 0 40px rgba(0,255,133,0.6))',
            duration: 0.2,
            yoyo: true,
            repeat: 1,
            clearProps: 'filter',
            ease: 'power1.out'
        });
    }

    triggerDigitalWave() {
        // Performance-aware guard
        try {
            const fps = (window.performanceBus && window.performanceBus.metrics?.fps) || (window.safePerformanceMonitor && window.safePerformanceMonitor.metrics?.fps) || 60;
            const dom = document.querySelectorAll('*').length;
            if (fps < 25 || dom > 1500) return;
        } catch {}
        // Get FX intensities
        const mult = window.fxController ? window.fxController.globalMult : 1;
        const particlesI = window.fxController ? window.fxController.getIntensity('particles') : 0.5;
        
        const targetBursts = Math.min(15, Math.max(8, Math.round(20 * particlesI * mult)));
        for (let i = 0; i < targetBursts; i++) {
            const wave = document.createElement('div');
            wave.style.cssText = `
                position: fixed;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                width: 3px;
                height: 3px;
                background: rgba(0, 255, 133, 0.9);
                border-radius: 50%;
                pointer-events: none;
                z-index: 10000;
                box-shadow: 0 0 10px rgba(0, 255, 133, 0.6);
            `;
            document.body.appendChild(wave);

            gsap.to(wave, {
                scale: 15,
                opacity: 0,
                duration: Math.random() * (1 + (1 - particlesI)) + 0.4,
                delay: i * 0.1,
                ease: 'power2.out',
                onComplete: () => wave.remove()
            });
        }
    }

    triggerCosmicBurst() {
        if (window.lottieAnimations && window.lottieAnimations.triggerCosmicBurst) {
            window.lottieAnimations.triggerCosmicBurst();
        }
    }

    loadPreset(preset) {
        console.log('📂 Loading preset:', preset);

        // Apply all preset values
        if (preset.hue !== undefined) this.updateColor('hue', preset.hue);
        if (preset.saturation !== undefined) this.updateColor('saturation', preset.saturation);
        if (preset.brightness !== undefined) this.updateColor('brightness', preset.brightness);
        if (preset.contrast !== undefined) this.updateColor('contrast', preset.contrast);

        if (preset.speed !== undefined) this.updateSpeed(preset.speed / 100);
        if (preset.phaseDuration !== undefined) this.updatePhaseDuration(preset.phaseDuration * 1000);

        if (preset.glitch !== undefined) this.updateEffectIntensity('glitch', preset.glitch / 100);
        if (preset.particles !== undefined) this.updateEffectIntensity('particles', preset.particles / 100);
        if (preset.distortion !== undefined) this.updateEffectIntensity('distortion', preset.distortion / 100);
        if (preset.noise !== undefined) this.updateEffectIntensity('noise', preset.noise / 100);

        if (preset.scene !== undefined) this.changeScene(preset.scene);
    }

    setAnimeFlag(enabled) {
        const flag = Boolean(enabled);
        this.animeEnabled = flag;
        this.currentSettings.animeEnabled = flag;
        window.__ANIME_POC_ENABLED = flag;
        try {
            if (flag) {
                window.localStorage?.setItem('3886_anime_enabled', '1');
            } else {
                window.localStorage?.removeItem('3886_anime_enabled');
            }
        } catch (_) {}
    }

    loadAnimeStack() {
        return new Promise((resolve) => {
            // Load the proper anime stack through chaos init
            if (window.chaosInit && window.chaosInit.loadAnimeStack) {
                window.chaosInit.loadAnimeStack().then(() => {
                    if (window.animeManager) {
                        console.log('✅ Anime stack loaded');
                        resolve(true);
                    } else {
                        console.error('❌ AnimeManager not found after import');
                        resolve(false);
                    }
                }).catch(err => {
                    console.error('❌ Failed to load anime stack:', err);
                    resolve(false);
                });
            } else {
                console.error('❌ ChaosInit not available');
                resolve(false);
            }
        });
    }

    async handleAnimeEnable() {
        console.log('🎯 Enabling anime.js...');

        try {
            // Load anime stack if core managers are missing
            if (!window.animeManager || !window.animationManager) {
                const loaded = await this.loadAnimeStack();
                if (!loaded) {
                    this.sendAnimeStatus('error', false, { error: 'Failed to load anime stack', success: false });
                    return;
                }
            }

            // Set the anime enabled flag
            this.setAnimeFlag(true);
            window.__ANIME_POC_ENABLED = true;

            if (window.animeManager && window.animationManager) {
                try { window.animeEnhancedEffects?.resume?.(); } catch {}
                // Kick off the signature logo animation if available (retry for a short window)
                const tryStart = () => { try { window.enableLogoAnimation?.(); } catch {} };
                if (typeof window.enableLogoAnimation === 'function') {
                    tryStart();
                } else {
                    let retries = 10;
                    const iv = setInterval(() => {
                        if (typeof window.enableLogoAnimation === 'function') {
                            clearInterval(iv);
                            tryStart();
                        } else if (--retries <= 0) {
                            clearInterval(iv);
                        }
                    }, 200);
                }
                this.sendAnimeStatus('enabled', true, { success: true });
                console.log('✅ Anime enabled successfully');
            } else {
                this.sendAnimeStatus('error', false, { error: 'anime or animation manager not available', success: false });
            }

        } catch (error) {
            console.error('❌ Error in handleAnimeEnable:', error);
            this.sendAnimeStatus('error', false, { error: error.message || 'Failed to enable anime', success: false });
        }
    }

    async handleAnimeTrigger(animationId) {
        if (VJ_DEBUG) console.log('🎬 Triggering animation:', animationId);

        // If the animation system is explicitly disabled, block triggers
        if (this.animeEnabled === false) {
            console.warn('⚠️ Animation trigger blocked: anime system disabled');
            this.sendAnimeStatus('blocked', false, { actionId: animationId, success: false, reason: 'disabled' });
            return;
        }

        // Attempt lazy load if manager missing
        if (!window.animationManager) {
            try {
                const loaded = await this.loadAnimeStack();
                if (!loaded) {
                    console.warn('Animation stack failed to load lazily; using fallback');
                }
            } catch (e) {
                console.warn('Lazy load of animation stack threw:', e);
            }
        }

        // Alias legacy IDs to canonical ones
        const aliasMap = {
            'logo-burst': 'logo-pulse',
            'system-glitch': 'matrix-glitch'
        };
        const id = aliasMap[animationId] || animationId;

        // Use the new professional animation manager if available
        if (window.animationManager) {
            window.animationManager.trigger(id)
                .then(success => {
                    console.log(`✅ Animation ${id} completed: ${success}`);
                    this.sendAnimeStatus('trigger', this.animeEnabled, {
                        actionId: id,
                        success: success
                    });
                })
                .catch(error => {
                    console.error(`❌ Animation ${id} failed:`, error);
                    this.sendAnimeStatus('error', this.animeEnabled, {
                        error: error.message || 'trigger failed',
                        actionId: id,
                        success: false
                    });
                });
            return;
        }

        // Fallback to old implementation if animation manager not available
        const gsap = window.gsap;
        let success = false;

        try {
            switch(animationId) {
                case 'logo-outline':
                case 'logo-pulse':
                    // Trigger matrix message event which causes logo pulse in anime-svg-logo.js
                    if (window.animeManager && this.animeEnabled) {
                        window.dispatchEvent(new CustomEvent('matrixMessage'));
                    }
                    // Always provide fallback animation
                    if (window.triggerLogoPulse) {
                        window.triggerLogoPulse();
                    } else if (gsap) {
                        const logo = document.querySelector('.image-2');
                        if (logo) {
                            gsap.to(logo, {
                                scale: 1.2,
                                duration: 0.3,
                                yoyo: true,
                                repeat: 1,
                                ease: "power2.inOut"
                            });
                        }
                    }
                    success = true;
                    break;

                case 'logo-spin':
                    const logo = document.querySelector('.image-2');
                    if (logo) {
                        if (gsap) {
                            gsap.to(logo, {
                                rotation: 360,
                                duration: 1,
                                ease: "power3.inOut"
                            });
                        } else {
                            // CSS fallback
                            logo.style.transition = 'transform 1s ease-in-out';
                            logo.style.transform = 'rotate(360deg)';
                            setTimeout(() => {
                                logo.style.transition = '';
                                logo.style.transform = '';
                            }, 1000);
                        }
                        success = true;
                    }
                    break;

                case 'logo-glow':
                    const logoGlow = document.querySelector('.image-2');
                    if (logoGlow) {
                        logoGlow.style.filter = 'drop-shadow(0 0 30px #00ff41) drop-shadow(0 0 60px #00ff41)';
                        setTimeout(() => {
                            logoGlow.style.filter = '';
                        }, 1000);
                        success = true;
                    }
                    break;

                case 'matrix-flash':
                    // Trigger matrix flash with anime if available
                    if (window.animeManager && this.animeEnabled) {
                        window.dispatchEvent(new CustomEvent('matrixMessage'));
                    }
                    // Always provide fallback
                    const matrixElement = document.querySelector('.matrix-rain, .chaos-matrix');
                    if (matrixElement) {
                        matrixElement.style.transition = 'opacity 0.1s';
                        matrixElement.style.opacity = '0';
                        setTimeout(() => {
                            matrixElement.style.opacity = '1';
                        }, 100);
                        success = true;
                    }
                    break;

                case 'matrix-rain':
                    const matrixRain = document.querySelector('.matrix-rain, .chaos-matrix');
                    if (matrixRain && gsap) {
                        gsap.to(matrixRain, {
                            opacity: 1,
                            scale: 1.1,
                            duration: 0.5,
                            yoyo: true,
                            repeat: 3
                        });
                        success = true;
                    }
                    break;

                case 'matrix-glitch':
                    const matrixGlitch = document.querySelector('.matrix-rain, .chaos-matrix');
                    if (matrixGlitch) {
                        // Add glitch animation CSS if not exists
                        if (!document.getElementById('glitch-style')) {
                            const style = document.createElement('style');
                            style.id = 'glitch-style';
                            style.textContent = `
                                @keyframes glitch {
                                    0%, 100% { transform: translateX(0); filter: hue-rotate(0deg); }
                                    20% { transform: translateX(-2px); filter: hue-rotate(90deg); }
                                    40% { transform: translateX(2px); filter: hue-rotate(180deg); }
                                    60% { transform: translateX(-2px); filter: hue-rotate(270deg); }
                                    80% { transform: translateX(2px); filter: hue-rotate(360deg); }
                                }
                            `;
                            document.head.appendChild(style);
                        }
                        matrixGlitch.style.animation = 'glitch 0.3s infinite';
                        setTimeout(() => {
                            matrixGlitch.style.animation = '';
                        }, 1000);
                        success = true;
                    }
                    break;

                case 'bg-warp':
                    if (window.animeManager && this.animeEnabled) {
                        window.dispatchEvent(new CustomEvent('animationPhase', { detail: { phase: 'intense' } }));
                        setTimeout(() => {
                            window.dispatchEvent(new CustomEvent('animationPhase', { detail: { phase: 'auto' } }));
                        }, 2000);
                    }
                    // Fallback animation
                    if (gsap) {
                        gsap.to(document.body, {
                            scale: 1.05,
                            rotation: 2,
                            duration: 0.3,
                            yoyo: true,
                            repeat: 1,
                            ease: "power2.inOut"
                        });
                    } else {
                        document.body.style.transform = 'scale(1.05) rotate(2deg)';
                        setTimeout(() => {
                            document.body.style.transform = '';
                        }, 500);
                    }
                    success = true;
                    break;

                case 'bg-shake':
                    if (gsap) {
                        gsap.to(document.body, {
                            x: "+=10",
                            y: "+=5",
                            duration: 0.05,
                            repeat: 10,
                            yoyo: true,
                            ease: "power2.inOut"
                        });
                    } else {
                        // CSS fallback
                        if (!document.getElementById('shake-keyframes')) {
                            const style = document.createElement('style');
                            style.id = 'shake-keyframes';
                            style.textContent = `
                                @keyframes shake {
                                    0%, 100% { transform: translate(0, 0); }
                                    10% { transform: translate(-10px, -5px); }
                                    20% { transform: translate(10px, -5px); }
                                    30% { transform: translate(-10px, 5px); }
                                    40% { transform: translate(10px, 5px); }
                                    50% { transform: translate(-10px, -5px); }
                                    60% { transform: translate(10px, -5px); }
                                    70% { transform: translate(-10px, 5px); }
                                    80% { transform: translate(10px, 5px); }
                                    90% { transform: translate(-10px, -5px); }
                                }
                            `;
                            document.head.appendChild(style);
                        }
                        document.body.style.animation = 'shake 0.5s';
                        setTimeout(() => {
                            document.body.style.animation = '';
                        }, 500);
                    }
                    success = true;
                    break;

                case 'bg-zoom':
                    if (gsap) {
                        gsap.to(document.body, {
                            scale: 1.5,
                            duration: 0.5,
                            yoyo: true,
                            repeat: 1,
                            ease: "power3.inOut"
                        });
                    } else {
                        // CSS fallback
                        if (!document.getElementById('zoom-keyframes')) {
                            const style = document.createElement('style');
                            style.id = 'zoom-keyframes';
                            style.textContent = `
                                @keyframes zoom-burst {
                                    0%, 100% { transform: scale(1); }
                                    50% { transform: scale(1.5); }
                                }
                            `;
                            document.head.appendChild(style);
                        }
                        document.body.style.animation = 'zoom-burst 1s ease-in-out';
                        setTimeout(() => {
                            document.body.style.animation = '';
                        }, 1000);
                    }
                    success = true;
                    break;

                case 'text-scramble':
                    document.querySelectorAll('.text-26, .text-25, h1, h2, h3').forEach(el => {
                        const originalText = el.textContent;
                        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
                        let iterations = 0;

                        const interval = setInterval(() => {
                            el.textContent = originalText.split('').map((char, index) => {
                                if (index < iterations) {
                                    return originalText[index];
                                }
                                return chars[Math.floor(Math.random() * chars.length)];
                            }).join('');

                            iterations++;
                            if (iterations > originalText.length) {
                                clearInterval(interval);
                            }
                        }, 50);
                    });
                    success = true;
                    break;

                case 'text-wave':
                    if (gsap) {
                        document.querySelectorAll('.text-26, .text-25').forEach((el, i) => {
                            gsap.to(el, {
                                y: Math.sin(i * 0.5) * 20,
                                duration: 0.5,
                                yoyo: true,
                                repeat: 3,
                                ease: "sine.inOut",
                                delay: i * 0.1
                            });
                        });
                        success = true;
                    }
                    break;

                case 'full-chaos':
                    // Trigger multiple effects at once
                    this.handleAnimeTrigger('logo-pulse');
                    this.handleAnimeTrigger('matrix-flash');
                    this.handleAnimeTrigger('bg-shake');
                    this.handleAnimeTrigger('text-scramble');

                    // Add extra chaos (route via Filter Manager for safety)
                    filterManager.applyImmediate('hue-rotate(180deg) saturate(200%)', { duration: 0.5, ease: 'power2.inOut' });
                    setTimeout(() => {
                        filterManager.applyImmediate('none', { duration: 0.5, ease: 'power2.inOut' });
                    }, 2000);
                    success = true;
                    break;

                default:
                    console.warn('Unknown animation ID:', animationId);
                    success = false;
            }

            // Send status if anime system is enabled
            if (window.animeManager && this.animeEnabled) {
                this.sendAnimeStatus('trigger', this.animeEnabled, {
                    actionId: animationId,
                    success: success
                });
            } else {
                // Still send basic confirmation
                this.sendMessage({
                    type: 'anime_triggered',
                    id: animationId,
                    timestamp: Date.now()
                });
            }
        } catch (error) {
            console.error('❌ Animation trigger failed:', error);
            if (window.animeManager) {
                this.sendAnimeStatus('error', this.animeEnabled, {
                    error: error.message || 'trigger failed',
                    actionId: animationId,
                    success: false
                });
            }
        }
    }

    sendAnimeStatus(action, enabled, extra = {}) {
        if (typeof enabled === 'boolean') {
            this.setAnimeFlag(enabled);
        }

        console.log('📤 Sending anime_status:', { action, enabled: this.animeEnabled });

        this.sendMessage({
            type: 'anime_status',
            action: action || 'status',
            enabled: this.animeEnabled,
            ...extra,
            timestamp: Date.now()
        });
    }

    setPerformanceMode(mode) {
        console.log(`🎮 Setting performance mode: ${mode}`);

        // If centralized manager exists, delegate and return
        if (window.performanceModeManager && typeof window.performanceModeManager.applyMode === 'function') {
            window.performanceModeManager.applyMode(mode);
            this.sendMessage({ type: 'performance_mode_updated', mode, timestamp: Date.now() });
            return;
        }

        // Normalize for different subsystems
        // performanceManager expects: 'low' | 'medium' | 'high' (no 'auto')
        const pmMode = (mode === 'auto') ? 'medium' : mode;
        // performanceElementManager expects: 'aggressive' | 'conservative' | 'normal'
        const pemMode = (mode === 'low') ? 'aggressive' : 'normal'; // 'auto' and 'high' map to normal
        const perfDetail = { mode: pmMode, source: 'vj-receiver', raw: mode };

        if (window.animePerfAdapter && typeof window.animePerfAdapter.applyMode === 'function') {
            window.animePerfAdapter.applyMode(mappedMode);
        }

        window.dispatchEvent(new CustomEvent('performanceMode', { detail: perfDetail }));
        if (!window.performanceManager) {
            window.dispatchEvent(new CustomEvent('performanceModeChange', { detail: perfDetail }));
        }


        // Apply performance mode to all available systems
        if (window.ChaosControl && window.ChaosControl.setPerformance) {
            window.ChaosControl.setPerformance(pmMode);
        }

        if (window.performanceManager && typeof window.performanceManager.setPerformanceMode === 'function') {
            window.performanceManager.setPerformanceMode(pmMode);
        }

        if (window.performanceElementManager && typeof window.performanceElementManager.setPerformanceMode === 'function') {
            window.performanceElementManager.setPerformanceMode(pemMode);
        }

        if (window.fxController) {
            // Scale intensities by mode
            switch(mode) {
                case 'low':
                    window.fxController.setGlobalIntensityMultiplier(0.7);
                    break;
                case 'auto':
                    window.fxController.setGlobalIntensityMultiplier(1.0);
                    break;
                case 'high':
                    window.fxController.setGlobalIntensityMultiplier(1.3);
                    break;
            }
        }

        if (window.gsapAnimationRegistry) {
            // Adjust animation limits based on requested external mode
            switch(mode) {
                case 'low':
                    window.gsapAnimationRegistry.maxAnimations = 50;
                    break;
                case 'auto':
                    window.gsapAnimationRegistry.maxAnimations = 100;
                    break;
                case 'high':
                    window.gsapAnimationRegistry.maxAnimations = 200;
                    break;
            }
            console.log(`🎬 GSAP animation limit set to ${window.gsapAnimationRegistry.maxAnimations} for ${mode} mode (pm:${pmMode}, pem:${pemMode})`);
        }

        // Send confirmation back to control panel
        this.sendMessage({
            type: 'performance_mode_updated',
            mode: mode,
            timestamp: Date.now()
        });
    }

    emergencyStop() {
        console.log('🚨 ENHANCED EMERGENCY STOP - Full System Reset!');
        if (window.animeManager && typeof window.animeManager.killAll === 'function') {
            window.animeManager.killAll();
        }

        // 1. COMPLETE ANIMATION CLEANUP
        if (window.gsapAnimationRegistry && typeof window.gsapAnimationRegistry.killByFilter === 'function') {
            window.gsapAnimationRegistry.killByFilter({ category: 'effect', excludeEssential: true });
            window.gsapAnimationRegistry.killByFilter({ category: 'particle', excludeEssential: true });
        }
        if (window.intervalManager && typeof window.intervalManager.clearCategory === 'function') {
            window.intervalManager.clearCategory('effect');
            window.intervalManager.clearCategory('particle');
            window.intervalManager.clearCategory('artifact');
        }
        if (window.performanceElementManager && typeof window.performanceElementManager.removeAllByCategory === 'function') {
            window.performanceElementManager.removeAllByCategory('effect');
            window.performanceElementManager.removeAllByCategory('particle');
            window.performanceElementManager.removeAllByCategory('artifact');
            window.performanceElementManager.removeAllByCategory('stream');
        }

        // 2. RESET ALL VISUAL STATES
        this.resetColors();
        this.updateSpeed(1);

        // Reset body filters and styles completely - use removeProperty for clean reset
        document.body.style.removeProperty('filter');
        document.body.style.transform = 'none';
        document.body.style.removeProperty('background-image'); // Clear noise fallback
        document.body.style.removeProperty('opacity');

        // Also reset filter manager to ensure consistency
        if (window.filterManager) {
            window.filterManager.reset();
        }

        // 3. RESET ALL FX CONTROLLERS
        if (window.fxController) {
            window.fxController.setIntensity({ glitch: 0, particles: 0, distortion: 0, noise: 0 });
            window.fxController.setGlobalIntensityMultiplier(1.0);
        } else {
            Object.keys(this.currentSettings.effects).forEach(effect => {
                this.updateEffectIntensity(effect, 0);
            });
        }

        // 4. STOP ALL PHASE SYSTEMS
        if (window.chaosInit) {
            window.chaosInit.phaseRunning = false;
        }

        // 5. COMPLETE OVERLAY CLEANUP
        document.querySelectorAll('div[style*="position: fixed"]').forEach(el => {
            if (!el.classList.contains('control-panel') && 
                !el.id.includes('chaos-canvas') && 
                !el.id.includes('matrix-rain') &&
                !el.id.includes('static-noise')) {
                el.remove();
            }
        });
        
        // Clear temporary canvases (preserve essential ones)
        document.querySelectorAll('canvas').forEach(canvas => {
            if (canvas.id !== 'chaos-canvas' && 
                canvas.id !== 'matrix-rain' && 
                canvas.id !== 'static-noise' &&
                canvas.id !== 'cyber-grid') {
                canvas.remove();
            }
        });

        // 6. RESET MATRIX MESSAGE SYSTEM
        if (window.matrixMessages && typeof window.matrixMessages.forceCleanup === 'function') {
            window.matrixMessages.forceCleanup();
        }

        // 7. FORCE GARBAGE COLLECTION
        if (window.gc) {
            window.gc();
        }

        // 8. RESTART SYSTEM CLEANLY WITH FULL RECREATION
        setTimeout(() => {
            // Trigger FULL system restart (simulates F5)
            this.restartEssentialAnimations(); // Now this is a FULL restart

            // Start with auto scene after restart
            setTimeout(() => {
                this.changeScene('auto');
                console.log('✅ Enhanced emergency reset completed - Full system recreated!');
            }, 2000);

        }, 800); // Even faster recovery since we're doing full restart
    }

    executeEmergencyCleanup() {
        console.log('🚨 VJ Receiver executing emergency cleanup...');
        
        // Trigger emergency cleanup if available
        if (window.emergencyCleanup) {
            window.emergencyCleanup.executeEmergencyCleanup();
        }
        
        // Also trigger the regular emergency stop
        this.emergencyStop();
    }

    executeSafeCleanup() {
        console.log('🧹 VJ Receiver executing safe cleanup...');
        
        if (window.safePerformanceMonitor) {
            window.safePerformanceMonitor.safeCleanup();
        }
    }

    executeEmergencyBrake() {
        console.log('🚨 VJ Receiver executing emergency brake...');
        
        if (window.safePerformanceMonitor) {
            window.safePerformanceMonitor.emergencyBrake();
        }
    }

    executePerformanceOptimization() {
        console.log('🧹 VJ Receiver executing performance optimization...');
        
        // Trigger cleanup on all performance systems (selective FX focus)
        if (window.gsapAnimationRegistry && typeof window.gsapAnimationRegistry.killByFilter === 'function') {
            window.gsapAnimationRegistry.killByFilter({ category: 'effect', excludeEssential: true, olderThan: 10000 });
            window.gsapAnimationRegistry.killByFilter({ category: 'particle', excludeEssential: true, olderThan: 10000 });
        } else if (window.gsapAnimationRegistry) {
            window.gsapAnimationRegistry.performPeriodicCleanup();
        }

        if (window.performanceElementManager && typeof window.performanceElementManager.removeOrphanedElements === 'function') {
            window.performanceElementManager.removeOrphanedElements();
        } else if (window.performanceElementManager) {
            window.performanceElementManager.performPeriodicCleanup();
        }

        if (window.intervalManager && typeof window.intervalManager.clearCategory === 'function') {
            window.intervalManager.clearCategory('effect');
            window.intervalManager.clearCategory('particle');
            window.intervalManager.performAutoCleanup();
        }

        if (window.safePerformanceMonitor) {
            window.safePerformanceMonitor.safeCleanup();
        }
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        console.log('✅ Performance optimization completed');
    }

    /**
     * COMPREHENSIVE SYSTEM RESET - Handles all system reset actions from control panel
     * This is the main entry point for the system reset functionality
     */
    executeSystemReset(actions = []) {
        console.log('🔄 EXECUTING COMPREHENSIVE SYSTEM RESET...');
        console.log('📋 Reset actions requested:', actions);

        // Step 1: Kill all animations and clear memory
        this.killAllAnimations();

        // Step 2: Reset DOM nodes and clear intervals
        this.resetDOMNodes();

        // Step 3: Clear all intervals and timeouts
        this.clearAllIntervals();

        // Step 4: Reset scenes to auto mode
        this.resetScenes();

        // Step 5: Reset all FX and filters
        this.resetAllEffects();

        // Step 6: Reset performance systems
        this.resetPerformanceSystems();

        // Step 7: Restart the entire system (like F5 refresh)
        setTimeout(() => {
            console.log('🚀 RESTARTING ENTIRE SYSTEM...');
            this.restartEssentialAnimations();
        }, 1000);

        console.log('✅ COMPREHENSIVE SYSTEM RESET COMPLETED');
    }

    /**
     * Kill all animations across all systems
     */
    killAllAnimations() {
        console.log('🚫 Killing all animations...');

        // Kill GSAP animations
        gsap.killTweensOf('*');
        gsap.globalTimeline.clear();

        // Kill anime.js animations
        if (window.animeManager && typeof window.animeManager.killAll === 'function') {
            window.animeManager.killAll();
        }

        // Kill GSAP animation registry
        if (window.gsapAnimationRegistry && typeof window.gsapAnimationRegistry.emergencyStop === 'function') {
            window.gsapAnimationRegistry.emergencyStop();
        }

        console.log('✅ All animations killed');
    }

    /**
     * Reset all DOM nodes to initial state
     */
    resetDOMNodes() {
        console.log('🔄 Resetting DOM nodes...');

        // Remove all temporary elements
        const temporarySelectors = [
            'div[style*="position: fixed"]',
            'canvas:not(#chaos-canvas):not(#matrix-rain):not(#static-noise):not(#cyber-grid)',
            '.phase-overlay',
            '.glitch-overlay',
            '.vhs-overlay',
            '.flash-overlay',
            '.warp-effect',
            '.matrix-overlay',
            '.scanlines',
            '.data-streams',
            '.holographic-shimmer',
            '.glitch-lines',
            '.chromatic-pulse',
            '.energy-field',
            '.quantum-particles',
            '.perf-managed',
            '[data-perf-id]'
        ];

        temporarySelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                // Skip essential elements like control panel
                if (!el.classList.contains('control-panel') &&
                    !el.id.includes('chaos-canvas') &&
                    !el.id.includes('matrix-rain') &&
                    !el.id.includes('static-noise') &&
                    !el.id.includes('cyber-grid')) {
                    el.remove();
                }
            });
        });

        // Reset body styles - IMPORTANT: Remove filter with removeProperty to clear !important
        document.body.style.removeProperty('filter');
        document.body.style.transform = 'none';
        document.body.style.removeProperty('background-image');
        document.body.style.removeProperty('opacity');

        // Reset main logo elements to default state
        const mainElements = document.querySelectorAll('.logo-text-wrapper, .image-wrapper, .text-3886, .image-2, .logo-text, .glow');
        mainElements.forEach(el => {
            // Kill any GSAP animations on this element
            gsap.killTweensOf(el);
            // Clear all inline styles
            el.style.cssText = '';
            // Use GSAP to clear all properties it may have set
            gsap.set(el, {
                clearProps: 'all'
            });
        });

        // CRITICAL: Clean up anime.js artifacts
        // Remove any anime.js logo containers that may have been created
        const animeContainers = document.querySelectorAll('.anime-logo-container');
        animeContainers.forEach(container => {
            container.remove();
        });

        // Restore original image visibility if it was hidden by anime.js
        const originalImage = document.querySelector('.image-2');
        if (originalImage) {
            originalImage.style.display = '';
            originalImage.style.opacity = '';
        }

        // Kill all anime.js animations if anime manager exists
        if (window.animeManager && typeof window.animeManager.killAll === 'function') {
            window.animeManager.killAll();
        }

        // Disable anime.js flag to prevent re-initialization
        window.__ANIME_POC_ENABLED = false;

        console.log('✅ DOM nodes reset to initial state');
    }

    /**
     * Clear all intervals and timeouts
     */
    clearAllIntervals() {
        console.log('⏰ Clearing all intervals and timeouts...');

        // Clear interval manager intervals
        if (window.intervalManager && typeof window.intervalManager.emergencyStop === 'function') {
            window.intervalManager.emergencyStop();
        }

        // Clear performance element manager
        if (window.performanceElementManager && typeof window.performanceElementManager.emergencyCleanup === 'function') {
            window.performanceElementManager.emergencyCleanup();
        }

        console.log('✅ All intervals and timeouts cleared');
    }

    /**
     * Reset scenes to auto mode
     */
    resetScenes() {
        console.log('🎬 Resetting scenes to auto mode...');

        // Stop current phase system
        if (window.chaosInit) {
            window.chaosInit.phaseRunning = false;
        }

        // Reset to auto scene
        this.currentSettings.scene = 'auto';

        // Send scene change to control panel
        this.sendMessage({
            type: 'scene_changed',
            scene: 'auto'
        });

        console.log('✅ Scenes reset to auto mode');
    }

    /**
     * Reset all effects and filters
     */
    resetAllEffects() {
        console.log('🎨 Resetting all effects and filters...');

        // Reset color settings
        this.currentSettings.colors = {
            hue: 0,
            saturation: 100,
            brightness: 100,
            contrast: 100
        };

        // CRITICAL: Reset filter manager state to prevent brightness issues
        if (window.filterManager) {
            window.filterManager.reset();
        }

        // Reset effect intensities
        this.currentSettings.effects = {
            glitch: 0.5,
            particles: 0.5,
            distortion: 0.5,
            noise: 0.5
        };

        // Reset FX controller
        if (window.fxController) {
            window.fxController.setIntensity({ glitch: 0.5, particles: 0.5, distortion: 0.5, noise: 0.5 });
            window.fxController.setGlobalIntensityMultiplier(1.0);
        }

        // Reset speed
        this.currentSettings.speed = 1.0;
        gsap.globalTimeline.timeScale(1.0);

        // Reset BPM
        this.currentSettings.bpm = 120;

        console.log('✅ All effects and filters reset');
    }

    /**
     * Reset performance monitoring systems
     */
    resetPerformanceSystems() {
        console.log('📊 Resetting performance systems...');

        // Reset performance mode to auto
        this.setPerformanceMode('auto');

        // Reset and cleanup performance manager
        if (window.performanceManager) {
            if (typeof window.performanceManager.cleanup === 'function') {
                window.performanceManager.cleanup();
            }
            if (typeof window.performanceManager.cleanupElements === 'function') {
                window.performanceManager.cleanupElements();
            }
            if (typeof window.performanceManager.cleanupAnimations === 'function') {
                window.performanceManager.cleanupAnimations();
            }
        }

        // Reset safe performance monitor
        if (window.safePerformanceMonitor && typeof window.safePerformanceMonitor.reset === 'function') {
            window.safePerformanceMonitor.reset();
        }

        // Reset anime.js status
        this.animeEnabled = false;
        this.currentSettings.animeEnabled = false;
        window.__ANIME_POC_ENABLED = false;
        this.sendAnimeStatus('reset', false, { success: true });

        // Reset FPS counter and restart monitoring
        this.activeFx = 0;
        this.currentFPS = 60; // Reset to default FPS

        // Stop and restart FPS monitoring to prevent Infinity
        if (this.fpsMonitorRAF) {
            cancelAnimationFrame(this.fpsMonitorRAF);
            this.fpsMonitorRAF = null;
        }

        // Restart FPS monitoring after a short delay
        setTimeout(() => {
            this.startPerformanceMonitoring();
        }, 500);

        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }

        console.log('✅ Performance systems reset');
    }

    /**
     * MINIMAL RESET: Apply control panel settings gracefully without breaking animations
     */
    applyControlPanelSettings(settings) {
        console.log('🎛️ Applying control panel settings:', settings);

        try {
            // Update colors
            if (settings.colors) {
                this.updateColors(settings.colors.hue, settings.colors.saturation, settings.colors.brightness, settings.colors.contrast);
            }

            // Update effects
            if (settings.effects) {
                this.setEffectIntensities(settings.effects.glitch, settings.effects.particles, settings.effects.distortion, settings.effects.noise);
            }

            // Update speed
            if (settings.speed !== undefined) {
                this.updateSpeed(settings.speed);
            }

            // Update BPM
            if (settings.bpm !== undefined) {
                this.updateBPM(settings.bpm);
            }

            // Update scene
            if (settings.scene) {
                this.changeScene(settings.scene);
            }

            console.log('✅ Control panel settings applied successfully');

        } catch (error) {
            console.error('❌ Error applying control panel settings:', error);
        }
    }

    /**
     * FULL SYSTEM RESTART - Simulates F5 refresh without actually refreshing
     * This recreates everything exactly as it would be on fresh page load
     */
    restartEssentialAnimations() {
        console.log('🔄 FULL SYSTEM RESTART - Simulating F5 refresh...');
        
        // 1. FORCE RECREATE CHAOS ENGINE (like fresh page load)
        if (window.chaosInit && window.chaosInit.init) {
            console.log('🎆 Force reinitializing Chaos Engine...');
            window.chaosInit.init(true); // Force restart = true
        } else if (window.chaosEngine && window.chaosEngine.init) {
            console.log('🎆 Force reinitializing Chaos Engine (fallback)...');
            window.chaosEngine.init(true); // Force restart = true
        }
        
        // 2. RECREATE ALL ANIMATION SYSTEMS
        if (window.chaosInit) {
            console.log('🎨 Recreating all animation systems...');
            
            // Recreate performance monitoring
            if (typeof window.chaosInit.initPerformanceMonitor === 'function') {
                window.chaosInit.initPerformanceMonitor();
            }
            
            // Recreate background animator
            if (window.backgroundAnimator && window.backgroundAnimator.init) {
                window.backgroundAnimator.init();
                if (window.backgroundAnimator.startGlitchSequence) {
                    window.backgroundAnimator.startGlitchSequence();
                }
            }
            
            // Recreate logo animator
            if (window.enhancedLogoAnimator && window.enhancedLogoAnimator.init) {
                window.enhancedLogoAnimator.init();
            }
            
            // Recreate centerpiece logo system
            if (window.centerpieceLogo && window.centerpieceLogo.init) {
                window.centerpieceLogo.init();
            }
            
            // Recreate text effects
            if (window.textEffects && window.textEffects.init) {
                window.textEffects.init();
                if (window.textEffects.addDataCorruption) {
                    window.textEffects.addDataCorruption();
                }
            }
            
            // Recreate matrix messages
            if (window.matrixMessages && window.matrixMessages.init) {
                window.matrixMessages.init();
            }
            
            // Recreate subtle effects
            if (window.subtleEffects && window.subtleEffects.init) {
                window.subtleEffects.init();
            }
            
            // 3. RECREATE ALL ADDITIONAL EFFECTS (like addScanlines, etc)
            console.log('✨ Recreating additional effects...');
            if (typeof window.chaosInit.addScanlines === 'function') {
                window.chaosInit.addScanlines();
            }
            if (typeof window.chaosInit.addVHSDistortion === 'function') {
                window.chaosInit.addVHSDistortion();
            }
            if (typeof window.chaosInit.addCyberGrid === 'function') {
                window.chaosInit.addCyberGrid();
            }
            if (typeof window.chaosInit.addGlowEffects === 'function') {
                window.chaosInit.addGlowEffects();
            }
            if (typeof window.chaosInit.addStaticNoise === 'function') {
                window.chaosInit.addStaticNoise();
            }
            if (typeof window.chaosInit.addDataStreams === 'function') {
                window.chaosInit.addDataStreams();
            }
            if (typeof window.chaosInit.addHolographicShimmer === 'function') {
                window.chaosInit.addHolographicShimmer();
            }
            if (typeof window.chaosInit.addSubtleColorVariations === 'function') {
                window.chaosInit.addSubtleColorVariations();
            }
        }
        
        // 4. RECREATE RANDOM & EXTENDED ANIMATIONS
        if (window.randomAnimations && window.randomAnimations.init) {
            console.log('🎲 Recreating random animations...');
            window.randomAnimations.init();
        }
        
        if (window.extendedAnimations && window.extendedAnimations.init) {
            console.log('🎆 Recreating extended animations...');
            window.extendedAnimations.init();
        }
        
        // 5. RECREATE SPECIALIZED EFFECTS
        if (window.beehiveLogoBlend && window.beehiveLogoBlend.init) {
            window.beehiveLogoBlend.init();
        }
        
        if (window.sonarEffect && window.sonarEffect.init) {
            window.sonarEffect.init();
        }
        
        if (window.lottieAnimations && window.lottieAnimations.init) {
            try { window.lottieAnimations.destroy?.(); } catch (_) {}
            window.lottieAnimations.init();
        }
        
        if (window.beehiveBackground && window.beehiveBackground.init) {
            window.beehiveBackground.init();
        }
        
        // 6. RESTART PHASE ANIMATIONS (like fresh page load)
        if (window.chaosInit) {
            window.chaosInit.phaseRunning = true;
            
            // Start animation phases with same timing as fresh load
            setTimeout(() => {
                console.log('🚀 Starting animation phases (like fresh page load)...');
                if (typeof window.chaosInit.startAnimationPhases === 'function') {
                    window.chaosInit.startAnimationPhases();
                }
            }, 2000); // Same 2-second delay as original init
            
            // Restart animation watchdog
            if (typeof window.chaosInit.startAnimationWatchdog === 'function') {
                window.chaosInit.startAnimationWatchdog();
            }
        }
        
        // 7. ENSURE BLACKOUT OVERLAY EXISTS (like original init)
        if (window.chaosInit && typeof window.chaosInit.ensureBlackoutOverlay === 'function') {
            window.chaosInit.ensureBlackoutOverlay();
        }
        
        console.log('✅ FULL SYSTEM RESTART COMPLETED - All systems recreated like F5 refresh!');
    }

    async runAnimationDiagnostics() {
        const animTriggers = [
            'logo-pulse', 'logo-spin', 'logo-glow',
            'matrix-flash', 'matrix-rain', 'matrix-glitch',
            'bg-warp', 'bg-shake', 'bg-zoom',
            'text-scramble', 'text-wave'
        ];
        const effectTriggers = ['strobe', 'blackout', 'whiteout', 'rgbsplit', 'pulse', 'matrix-rain'];

        const targetMap = {
            'logo-pulse': '.image-2, .logo-text-wrapper',
            'logo-spin': '.image-2, .logo-text-wrapper',
            'logo-glow': '.image-2, .logo-text-wrapper',
            'matrix-flash': '.matrix-rain, .chaos-matrix',
            'matrix-rain': '.matrix-rain, .chaos-matrix',
            'matrix-glitch': '.matrix-rain, .chaos-matrix',
            'bg-warp': 'body',
            'bg-shake': 'body',
            'bg-zoom': 'body',
            'text-scramble': '.text-26, .text-25, h1, h2, h3',
            'text-wave': '.text-26, .text-25'
        };

        const successes = [];
        const failures = [];

        for (const id of animTriggers) {
            try {
                const selector = targetMap[id] || 'body';
                const exists = !!document.querySelector(selector);
                // Fire trigger regardless — we still want to exercise the pipeline
                this.handleAnimeTrigger(id);
                if (exists) {
                    successes.push(id);
                } else {
                    failures.push(`${id} (missing target: ${selector})`);
                }
                await new Promise(r => setTimeout(r, 200));
            } catch (e) {
                failures.push(`${id} (error: ${e?.message || 'unknown'})`);
            }
        }

        // Test effect triggers
        for (const eff of effectTriggers) {
            try {
                this.triggerEffect(eff);
                successes.push(`fx:${eff}`);
                await new Promise(r => setTimeout(r, 200));
            } catch (e) {
                failures.push(`fx:${eff} (error: ${e?.message || 'unknown'})`);
            }
        }

        this.sendMessage({ type: 'diagnostics_report', category: 'animations', successes, failures, timestamp: Date.now() });
    }

    handleSequenceEvent(data) {
        // Replay recorded events
        switch(data.originalType) {
            case 'trigger':
                this.triggerEffect(data.data);
                break;
            case 'scene':
                this.changeScene(data.data);
                break;
            // Add more as needed
        }
    }

    startPerformanceMonitoring() {
        // Stop existing monitoring if any
        if (this.fpsMonitorRAF) {
            cancelAnimationFrame(this.fpsMonitorRAF);
            this.fpsMonitorRAF = null;
        }

        // Monitor FPS with automatic emergency stop
        let lastTime = performance.now();
        let frames = 0;
        let fps = 60;
        let lowFpsCount = 0;
        const LOW_FPS_THRESHOLD = 10;
        const LOW_FPS_DURATION = 5; // seconds

        const measureFPS = () => {
            frames++;
            const currentTime = performance.now();

            if (currentTime >= lastTime + 1000) {
                const delta = currentTime - lastTime;
                // Prevent division by zero or very small numbers that cause Infinity
                if (delta > 0) {
                    fps = Math.min(999, (frames * 1000) / delta); // Cap at 999 to prevent Infinity display
                } else {
                    fps = 60; // Default fallback
                }
                frames = 0;
                lastTime = currentTime;
                
                // AUTO EMERGENCY STOP: Check for critically low FPS
                if (fps < LOW_FPS_THRESHOLD) {
                    lowFpsCount++;
                    console.warn(`⚠️ Low FPS detected: ${fps.toFixed(1)} (${lowFpsCount}/${LOW_FPS_DURATION}s)`);
                    
                    if (lowFpsCount >= LOW_FPS_DURATION) {
                        console.log('🚨 AUTO EMERGENCY STOP: FPS below 10 for 5+ seconds!');
                        this.emergencyStop();
                        lowFpsCount = 0; // Reset counter after emergency stop
                    }
                } else {
                    // Reset low FPS counter when performance recovers
                    if (lowFpsCount > 0) {
                        console.log('✅ FPS recovered, resetting low FPS counter');
                        lowFpsCount = 0;
                    }
                }
            }

            this.currentFPS = fps;
            this.fpsMonitorRAF = requestAnimationFrame(measureFPS);
        };

        this.fpsMonitorRAF = requestAnimationFrame(measureFPS);
        
        console.log('📈 Performance monitoring started with auto-emergency stop (FPS < 10 for 5s)');
    }

    sendPerformanceData() {
        const preferredFPS = (window.safePerformanceMonitor && window.safePerformanceMonitor.metrics?.fps) ? window.safePerformanceMonitor.metrics.fps : this.currentFPS || 60;
        const data = {
            type: 'performance_update',
            fps: preferredFPS,
            activeFx: this.activeFx,
            cpu: 0 // Would need actual CPU monitoring
        };

        // Get FPS from ChaosControl if available
        if (window.ChaosControl && window.ChaosControl.getFPS) {
            data.fps = window.ChaosControl.getFPS();
        }

        this.sendMessage(data);
    }

    // Expose current scene via method for external checks/testing
    getCurrentScene() {
        return this.currentSettings.scene;
    }

    sendDetailedPerformanceData() {
        // Gather detailed performance data from all systems
        const detailedData = {
            type: 'detailed_performance_update',
            animations: window.gsapAnimationRegistry ? window.gsapAnimationRegistry.animations.size : 0,
            managedElements: window.performanceElementManager ? window.performanceElementManager.elements.size : 0,
            intervals: window.intervalManager ? window.intervalManager.intervals.size : 0,
            activeFx: this.activeFx, // Include activeFx counter
            fps: window.safePerformanceMonitor ? window.safePerformanceMonitor.metrics.fps : 0,
            memory: performance.memory ? performance.memory.usedJSHeapSize : 0,
            timestamp: Date.now()
        };

        console.log('📊 Sending detailed performance data:', detailedData);
        this.sendMessage(detailedData);
    }

    hookIntoChaosEngine() {
        // Wait for chaos engine to be ready
        const checkChaosEngine = setInterval(() => {
            if (window.chaosInit || window.ChaosControl) {
                clearInterval(checkChaosEngine);
                console.log('✅ VJ Receiver hooked into Chaos Engine');

                // Store reference to chaos init
                window.chaosInit = window.chaosInit || {};

                // Add VJ control to window for debugging
                window.vjReceiver = this;

                // Provide simple accessors for scene on ChaosControl if not present
                try {
                    if (window.ChaosControl) {
                        if (typeof window.ChaosControl.getScene !== 'function') {
                            window.ChaosControl.getScene = () => this.currentSettings.scene;
                        }
                    }
                } catch (_) {}
            }
        }, 100);
    }

    // Add missing methods for control panel integration
    resetAllSystems() {
        console.log('🔄 Resetting all systems to default');

        // Reset color matrix
        this.resetColors();

        // Reset speed
        this.updateSpeed(100);

        // Reset phase duration
        this.updatePhaseDuration(30);

        // Reset effects to defaults
        this.currentSettings.effects = {
            glitch: 0.5,
            particles: 0.5,
            distortion: 0.5,
            noise: 0.5
        };

        // Disable anime
        this.setAnimeFlag(false);

        // Set scene to auto
        this.changeScene('auto');

        // Send confirmation
        this.sendMessage({
            type: 'system_reset_complete',
            timestamp: Date.now()
        });
    }

    toggleEffect(effectName, enabled) {
        console.log(`🎛️ Toggling effect ${effectName} to ${enabled ? 'ON' : 'OFF'}`);

        // Map effect names to actions
        const effectActions = {
            holographic: () => {
                if (window.fxController) {
                    window.fxController.setEffectEnabled('holographic', enabled);
                }
            },
            dataStreams: () => {
                if (window.fxController) {
                    window.fxController.setEffectEnabled('dataStreams', enabled);
                }
            },
            strobeCircles: () => {
                if (window.fxController) {
                    window.fxController.setEffectEnabled('strobeCircles', enabled);
                }
            },
            plasma: () => {
                if (window.fxController) {
                    window.fxController.setEffectEnabled('plasma', enabled);
                }
            },
            particles: () => {
                const particlesElement = document.querySelector('.chaos-particles');
                if (particlesElement) {
                    particlesElement.style.display = enabled ? 'block' : 'none';
                }
            },
            noise: () => {
                if (window.fxController) {
                    window.fxController.setEffectEnabled('noise', enabled);
                }
            },
            cyberGrid: () => {
                if (window.fxController) {
                    window.fxController.setEffectEnabled('cyberGrid', enabled);
                }
            },
            rgbSplit: () => {
                if (window.fxController) {
                    window.fxController.setEffectEnabled('rgbSplit', enabled);
                }
            },
            chromatic: () => {
                if (window.fxController) {
                    window.fxController.setEffectEnabled('chromatic', enabled);
                }
            },
            scanlines: () => {
                if (window.fxController) {
                    window.fxController.setEffectEnabled('scanlines', enabled);
                }
            },
            vignette: () => {
                if (window.fxController) {
                    window.fxController.setEffectEnabled('vignette', enabled);
                }
            },
            filmgrain: () => {
                if (window.fxController) {
                    window.fxController.setEffectEnabled('filmgrain', enabled);
                }
            }
        };

        // Execute the effect toggle or fall back to generic handler (supports lottie:* keys)
        if (effectActions[effectName]) {
            effectActions[effectName]();
        } else if (window.fxController) {
            window.fxController.setEffectEnabled(effectName, enabled);
        }

        // Update active FX count
        this.activeFx = enabled ? this.activeFx + 1 : Math.max(0, this.activeFx - 1);
    }

    toggleLayer(layerName, visible) {
        console.log(`🎭 Toggling layer ${layerName} to ${visible ? 'visible' : 'hidden'}`);

        const layerMap = {
            // Background elements - including video, grid effects, and base layers
            'background': '.background-video, .cyber-grid-effect, #cyber-grid-effect, .plasma-field, #plasma-field-canvas, .anime-plasma-field',

            // Matrix rain and digital effects
            'matrix-rain': '.matrix-rain, .chaos-matrix, .data-streams-overlay, #data-streams-overlay, .anime-data-streams',

            // Logo and main visual elements
            'logo': '.image-wrapper, .image-2, .image-3, .logo-container, .anime-logo-container, .glow',

            // Text elements - all headings and text content
            'text': '.text-3886, .logo-text, .scramble-text, .heading-20, .enter-button-wrapper, h1, h2, h3, p',

            // Overlay effects - vignette, noise, scanlines
'overlay': '#vignette-effect, #vignette-overlay, #scanlines-effect, #scanlines-overlay, #digital-noise-effect, #grain-overlay, #film-grain-effect, #chromatic-aberration, .chaos-overlay',

            // Debug and performance info
            'debug': '.debug-overlay, .debug-info, .performance-monitor, #performanceMonitor',

            // Particles and floating elements
            'particles': '#particles-effect, .anime-particles, .chaos-particles',

            // Animation effects
            'animations': '.anime-holographic-container, .anime-strobe-circles, .anime-mandala, .anime-psychedelic-waves'
        };

        const selector = layerMap[layerName];
        if (selector) {
            const elements = document.querySelectorAll(selector);
            console.log(`Found ${elements.length} elements for layer ${layerName}`);

            elements.forEach(el => {
                if (visible) {
                    // Restore display property
                    el.style.display = '';
                    el.style.visibility = 'visible';
                    el.style.opacity = '';
                } else {
                    // Hide element
                    el.style.display = 'none';
                }
            });
        }

        // Special handling for specific layers
        switch(layerName) {
            case 'debug':
                if (visible) {
                    this.showDebugInfo();
                } else {
                    const debugEl = document.querySelector('.debug-overlay');
                    if (debugEl) {
                        debugEl.remove();
                    }
                }
                break;

            case 'logo':
                // Also toggle logo animations if they exist
                if (window.logoAnimations) {
                    if (visible) {
                        window.logoAnimations.glowPulse?.play();
                    } else {
                        window.logoAnimations.glowPulse?.pause();
                    }
                }
                break;

            case 'animations':
                // Control anime.js animations
                if (window.animeManager) {
                    if (visible) {
                        window.animeManager.resumeAll();
                    } else {
                        window.animeManager.pauseAll();
                    }
                }
                break;
        }

        // Send confirmation
        this.sendMessage({
            type: 'layer_toggled',
            layer: layerName,
            visible: visible,
            timestamp: Date.now()
        });
    }

    showDebugInfo() {
        // Create or update debug overlay
        let debugEl = document.querySelector('.debug-overlay');
        if (!debugEl) {
            debugEl = document.createElement('div');
            debugEl.className = 'debug-overlay';
            debugEl.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0,0,0,0.8);
                color: #00ff41;
                padding: 10px;
                font-family: monospace;
                font-size: 12px;
                z-index: 99999;
                border: 1px solid #00ff41;
                min-width: 200px;
            `;
            document.body.appendChild(debugEl);
        } else {
            debugEl.style.display = 'block';
        }

        // Update debug info periodically
        if (!this.debugInterval) {
            this.debugInterval = setInterval(() => {
                if (debugEl && debugEl.style.display !== 'none') {
                    debugEl.innerHTML = `
                        <div style="font-weight: bold; margin-bottom: 5px;">DEBUG INFO</div>
                        FPS: ${this.getCurrentFPS()}<br>
                        Active Effects: ${this.activeFx}<br>
                        Anime: ${this.animeEnabled ? 'ON' : 'OFF'}<br>
                        Scene: ${this.currentSettings.scene}<br>
                        BPM: ${this.currentSettings.bpm}<br>
                        Speed: ${this.currentSettings.speed}x<br>
                        Hue: ${this.currentSettings.colors.hue}°<br>
                        Time: ${new Date().toLocaleTimeString()}
                    `;
                }
            }, 100);
        }
    }

    getCurrentFPS() {
        // Prefer shared performance bus for consistent values
        if (window.performanceBus && typeof window.performanceBus.getFPS === 'function') {
            return window.performanceBus.getFPS();
        }
        // Fallback: simple local estimate
        if (!this.fpsFrames) this.fpsFrames = [];
        const now = performance.now();
        this.fpsFrames.push(now);
        this.fpsFrames = this.fpsFrames.filter(t => t > now - 1000);
        return this.fpsFrames.length;
    }
    
    destroy() {
        console.log('🗑️ VJ Receiver cleanup initiated');
        
        // Clear localStorage polling interval
        if (this.localStoragePollingHandle) {
            this.localStoragePollingHandle.clear();
            this.localStoragePollingHandle = null;
            console.log('✅ localStorage polling interval cleared');
        }
        
        // Clear BPM ripple interval
        if (this.bpmRippleInterval) {
            clearInterval(this.bpmRippleInterval);
            this.bpmRippleInterval = null;
        }
        
        // Clear debug interval
        if (this.debugInterval) {
            clearInterval(this.debugInterval);
            this.debugInterval = null;
        }
        
        // Clear fallback timeout
        if (this._fallbackArmTimeout) {
            clearTimeout(this._fallbackArmTimeout);
            this._fallbackArmTimeout = null;
        }
        
        // Cancel FPS monitor RAF
        if (this.fpsMonitorRAF) {
            cancelAnimationFrame(this.fpsMonitorRAF);
            this.fpsMonitorRAF = null;
        }
        
        // Close broadcast channel
        if (this.channel) {
            try {
                this.channel.close();
            } catch (e) {
                // Ignore close errors
            }
            this.channel = null;
        }
        
        this.isConnected = false;
        console.log('✅ VJ Receiver cleanup complete');
    }
}

// Auto-initialize
const vjReceiver = new VJReceiver();

// Export for module usage
export default vjReceiver;
