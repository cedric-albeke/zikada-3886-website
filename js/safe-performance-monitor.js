// Safe Performance Monitor - Non-intrusive monitoring only
// Does NOT patch GSAP or interfere with animations

import { createLogger } from './utils/logger.js';
import animationRuntime from './runtime/animation-runtime.js';
import performanceBus from './performance-bus.js';

// Create namespaced logger
const log = createLogger('monitor');

class SafePerformanceMonitor {
    constructor() {
        this.runtimeOwner = 'safe-performance-monitor';
        this.metrics = {
            fps: 60,
            fpsHistory: [],
            memoryUsage: 0,
            domNodes: 0,
            performanceMode: 'normal'
        };
        
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.isMonitoring = false;
        this.lastPerformanceWarningAt = 0;
        this.performanceWarningCooldownMs = 60000;
        
        log.once('monitor:init', () => {
            log.info('Safe Performance Monitor initialized (non-intrusive)');
        });
    }

    /**
     * Start monitoring without interfering with animations
     */
    startMonitoring() {
        if (this.isMonitoring) return;

        animationRuntime.disposeOwner(this.runtimeOwner);
        this.isMonitoring = true;
        
        // One Performance Bus subscription owns FPS, heap and DOM telemetry.
        this.startFPSMonitoring();
        
        log.once('monitor:start', () => {
            log.info('Safe performance monitoring started');
        });
    }

    startFPSMonitoring() {
        const updateMetrics = ({ fps, memoryBytes, domNodes }) => {
            if (!this.isMonitoring || !Number.isFinite(fps)) return;
            this.metrics.fps = Math.round(fps);
            this.metrics.memoryUsage = Number(memoryBytes) || 0;
            this.metrics.domNodes = Number(domNodes) || 0;
            this.metrics.fpsHistory.push(this.metrics.fps);
            if (this.metrics.fpsHistory.length > 60) this.metrics.fpsHistory.shift();
            this.checkPerformanceIssues();
        };

        updateMetrics(performanceBus.metrics);
        const unsubscribe = performanceBus.subscribe(updateMetrics);
        animationRuntime.trackDisposer(this.runtimeOwner, unsubscribe);
        this.fpsLoop = null;
    }

    checkPerformanceIssues() {
        const { fps, memoryUsage, domNodes } = this.metrics;
        const now = Date.now();
        if (now - this.lastPerformanceWarningAt < this.performanceWarningCooldownMs) {
            return;
        }

        // Log warnings but DON'T take action
        if (fps < 30) {
            console.warn(`⚠️ Critical FPS: ${fps} - Consider manual cleanup`);
            this.lastPerformanceWarningAt = now;
        } else if (fps < 45) {
            console.warn(`⚠️ Low FPS: ${fps} - Monitor performance`);
            this.lastPerformanceWarningAt = now;
        }
        
        if (domNodes > 3000) {
            console.warn(`⚠️ High DOM node count: ${domNodes} - Consider cleanup`);
            this.lastPerformanceWarningAt = now;
        }
        
        if (memoryUsage > 500 * 1024 * 1024) { // 500MB
            console.warn(`⚠️ High memory usage: ${this.formatBytes(memoryUsage)}`);
            this.lastPerformanceWarningAt = now;
        }
    }

    /**
     * Manual cleanup function (safe, user-triggered only)
     */
    safeCleanup() {
        log.info('Performing safe manual cleanup...');
        
        // Only remove clearly temporary elements
        const temporarySelectors = [
            'div[style*="position: fixed"][style*="z-index: 999"]',
            '.matrix-overlay',
            '.phase-overlay',
            '.flash-overlay',
            '.glitch-overlay'
        ];
        
        let removed = 0;
        temporarySelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                // Extra safety checks
                if (!el.classList.contains('pre-loader') && 
                    !el.classList.contains('control-panel') &&
                    !el.querySelector('.logo-text') &&
                    !el.querySelector('.image-2')) {
                    try {
                        el.remove();
                        removed++;
                    } catch (e) {
                        // Silent fail
                    }
                }
            });
        });
        
        log.info(`Safe cleanup removed ${removed} temporary elements`);
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        return removed;
    }

    /**
     * Emergency brake - stop problematic effects only
     */
    emergencyBrake() {
        log.warn('Emergency brake - disabling heavy effects only');
        
        // Add CSS to disable only the heaviest effects
        const emergencyStyle = document.createElement('style');
        emergencyStyle.id = 'emergency-brake-style';
        emergencyStyle.textContent = `
            /* Disable only the heaviest performance-impacting effects */
            .quantum-particles { display: none !important; }
            .holographic-shimmer { display: none !important; }
            .energy-field { display: none !important; }
            
            /* Reduce but don't disable essential effects */
            #static-noise { opacity: 0.005 !important; }
            .chromatic-pulse { opacity: 0.001 !important; }
            
            /* Keep all other animations running normally */
        `;
        
        document.head.appendChild(emergencyStyle);
        
        // Perform safe cleanup
        this.safeCleanup();
        
        log.warn('Emergency brake applied - heavy effects disabled, core animations preserved');
    }

    /**
     * Restore full effects
     */
    restoreEffects() {
        const emergencyStyle = document.getElementById('emergency-brake-style');
        if (emergencyStyle) {
            emergencyStyle.remove();
            log.info('Full effects restored');
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    getReport() {
        const avgFPS = this.metrics.fpsHistory.length > 0 ? 
            this.metrics.fpsHistory.reduce((a, b) => a + b, 0) / this.metrics.fpsHistory.length : 0;
            
        return {
            fps: {
                current: this.metrics.fps,
                average: Math.round(avgFPS)
            },
            memory: {
                usage: this.metrics.memoryUsage,
                formatted: this.formatBytes(this.metrics.memoryUsage)
            },
            dom: {
                totalNodes: this.metrics.domNodes
            },
            timestamp: new Date()
        };
    }

    destroy() {
        this.isMonitoring = false;
        animationRuntime.disposeOwner(this.runtimeOwner);
        this.fpsLoop = null;
        this.systemMonitor = null;
        console.log('💀 Safe Performance Monitor destroyed');
    }
}

// Create global instance
const safePerformanceMonitor = new SafePerformanceMonitor();

// Auto-start monitoring
safePerformanceMonitor.startMonitoring();

// Make it globally available
window.safePerformanceMonitor = safePerformanceMonitor;

// Add global emergency functions
window.SAFE_CLEANUP = () => safePerformanceMonitor.safeCleanup();
window.EMERGENCY_BRAKE = () => safePerformanceMonitor.emergencyBrake();
window.RESTORE_EFFECTS = () => safePerformanceMonitor.restoreEffects();

console.log('🛡️ Safe performance monitoring ready - no animation interference');

export default safePerformanceMonitor;
