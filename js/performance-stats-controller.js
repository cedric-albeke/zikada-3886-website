// Performance Stats Controller with Rate Limiting
// Provides real FPS, memory, and DOM monitoring data

// Actual FPS Monitor - tracks real animation performance
class ActualFPSMonitor {
    constructor({ sampleMs = 750, targetSelector = null } = {}) {
        this.sampleMs = sampleMs;
        this.targetSelector = targetSelector;
        this.frames = 0;
        this.acc = 0;
        this.last = 0;
        this.fps = 0;
        this.active = true;
        this.rafId = null;
        this.onUpdate = null;
        this._animIo = null;
        this._boundLoop = this._loop.bind(this);
    }

    _loop(now) {
        // If page is hidden, skip sampling but keep the loop alive
        if (document.hidden) {
            this.last = now;
            this.rafId = requestAnimationFrame(this._boundLoop);
            return;
        }

        if (!this.active) {
            this.last = now;
            this.rafId = requestAnimationFrame(this._boundLoop);
            return;
        }

        if (!this.last) this.last = now;
        const dt = now - this.last;
        this.last = now;

        // Protect against huge dt on resume
        if (dt > 0 && dt < 250) {
            this.frames += 1;
            this.acc += dt;
        }

        if (this.acc >= this.sampleMs) {
            const fps = Math.round((this.frames / this.acc) * 1000);
            this.fps = fps;
            this.frames = 0;
            this.acc = 0;
            if (typeof this.onUpdate === 'function') {
                this.onUpdate(this.fps);
            }
        }
        this.rafId = requestAnimationFrame(this._boundLoop);
    }

    _setupVisibility() {
        document.addEventListener('visibilitychange', () => {
            // When hidden, sampling effectively pauses via checks above
            if (!document.hidden) {
                // Reset accumulators on resume
                this.last = performance.now();
                this.frames = 0;
                this.acc = 0;
            }
        });
    }

    _setupAnimTarget() {
        if (!this.targetSelector) return;
        const target = document.querySelector(this.targetSelector);
        if (!target) return;
        this._animIo = new IntersectionObserver((entries) => {
            const entry = entries[0];
            this.active = !!entry && entry.isIntersecting && entry.intersectionRatio > 0.05;
        }, { root: null, threshold: [0, 0.05, 0.25] });
        this._animIo.observe(target);
    }

    start() {
        this._setupVisibility();
        this._setupAnimTarget();
        this.last = performance.now();
        this.rafId = requestAnimationFrame(this._boundLoop);
    }

    stop() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        if (this._animIo) this._animIo.disconnect();
        this.rafId = null;
    }
}

class PerformanceStatsController {
    constructor() {
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.lastUpdateTime = 0;
        this.updateInterval = 500; // Update display every 500ms

        this.memory = {
            used: 0,
            total: 0,
            percent: 0
        };

        this.domNodes = 0;
        this.activeEffects = 0;

        // Actual FPS monitoring
        this.actualFpsMonitor = null;

        this.init();
    }

    init() {
        console.log('📊 Performance Stats Controller initialized');
        // Use ActualFPSMonitor for real animation FPS tracking
        this.setupActualFPSMonitoring();
        this.startMemoryMonitoring();
        this.startDOMMonitoring();
    }

    setupActualFPSMonitoring() {
        // Identify animation roots for focused monitoring
        this.actualFpsMonitor = new ActualFPSMonitor({
            sampleMs: 750,
            targetSelector: '.animation-page, .matrix-canvas, [data-animation-root], .control-panel'
        });

        // Update all FPS displays consistently
        this.actualFpsMonitor.onUpdate = (fps) => {
            this.fps = fps;
            this.updateFPSDisplay();
        };

        this.actualFpsMonitor.start();
    }

    // Legacy FPS monitoring - replaced by ActualFPSMonitor
    // Kept for compatibility but not used

    updateFPSDisplay() {
        // Update all FPS elements using data attributes for consistency
        const fpsElements = document.querySelectorAll('#fpsCounter, [data-metric="fps"], [data-perf="fps"]');
        
        fpsElements.forEach(element => {
            element.textContent = this.fps;
            element.setAttribute('aria-label', `Current animation frames per second: ${this.fps}`);

            // Remove old classes
            element.classList.remove('warning', 'danger');

            // Color coding based on performance
            if (this.fps < 30) {
                element.classList.add('danger');
            } else if (this.fps < 50) {
                element.classList.add('warning');
            }
        });
    }

    startMemoryMonitoring() {
        // Update memory stats every 2 seconds
        setInterval(() => {
            if (performance.memory) {
                const usedMB = Math.round(performance.memory.usedJSHeapSize / 1048576);
                const totalMB = Math.round(performance.memory.jsHeapSizeLimit / 1048576);

                this.memory.used = usedMB;
                this.memory.total = totalMB;
                this.memory.percent = Math.round((usedMB / totalMB) * 100);

                const memElement = document.getElementById('memoryUsage');
                if (memElement) {
                    memElement.textContent = `${usedMB}MB`;

                    // Color coding based on usage
                    memElement.classList.remove('warning', 'danger');
                    if (this.memory.percent > 80) {
                        memElement.classList.add('danger');
                    } else if (this.memory.percent > 60) {
                        memElement.classList.add('warning');
                    }
                }
            } else {
                // Fallback for browsers without memory API
                const memElement = document.getElementById('memoryUsage');
                if (memElement) {
                    memElement.textContent = 'N/A';
                }
            }
        }, 2000);
    }

    startDOMMonitoring() {
        // Update DOM node count every 3 seconds
        setInterval(() => {
            this.domNodes = document.getElementsByTagName('*').length;

            const domElement = document.getElementById('domNodes');
            if (domElement) {
                // Format with K for thousands
                if (this.domNodes > 1000) {
                    domElement.textContent = `${(this.domNodes / 1000).toFixed(1)}K`;
                } else {
                    domElement.textContent = this.domNodes;
                }

                // Color coding based on count
                domElement.classList.remove('warning', 'danger');
                if (this.domNodes > 5000) {
                    domElement.classList.add('danger');
                } else if (this.domNodes > 3000) {
                    domElement.classList.add('warning');
                }
            }
        }, 3000);
    }

    updateActiveEffects(count) {
        this.activeEffects = count;
        const fxElement = document.getElementById('activeEffects');
        if (fxElement) {
            fxElement.textContent = count;
        }
    }

    // Get current stats
    getStats() {
        return {
            fps: this.fps,
            memory: this.memory,
            domNodes: this.domNodes,
            activeEffects: this.activeEffects
        };
    }
}

// Kill+Reset Button Handler
class KillResetHandler {
    constructor() {
        this.setupKillResetButton();
    }

    async gracefulKill() {
        console.log('🚨 Executing graceful kill...');
        // Stop all animations and effects
        if (window.vjMessaging) {
            window.vjMessaging.send('KILL_ALL_EFFECTS');
        }
        // Stop performance monitoring temporarily
        if (window.performanceStatsController?.actualFpsMonitor) {
            window.performanceStatsController.actualFpsMonitor.stop();
        }
        // Clear any active timers
        for (let i = 1; i < 99999; i++) window.clearTimeout(i);
    }

    async resetSystem() {
        console.log('🔄 Executing system reset...');
        // Reset all visual states
        if (window.vjMessaging) {
            window.vjMessaging.send('RESET_VISUAL_STATE');
        }
        // Restart performance monitoring
        if (window.performanceStatsController?.actualFpsMonitor) {
            window.performanceStatsController.actualFpsMonitor.start();
        }
        // Reset any cached states
        localStorage.removeItem('3886_cached_state');
    }

    wait(ms) { 
        return new Promise(resolve => setTimeout(resolve, ms)); 
    }

    setupKillResetButton() {
        const killResetBtn = document.getElementById('systemKillReset');
        if (killResetBtn) {
            killResetBtn.addEventListener('click', async () => {
                killResetBtn.disabled = true;
                killResetBtn.classList.add('is-busy');
                
                try {
                    await this.gracefulKill();
                    await this.wait(250); // Grace period
                    await this.resetSystem();
                    console.log('✅ Kill+Reset completed successfully');
                } catch (error) {
                    console.error('❌ Kill+Reset error:', error);
                } finally {
                    killResetBtn.disabled = false;
                    killResetBtn.classList.remove('is-busy');
                }
            });
        }
    }
}

// Initialize and export
const performanceStatsController = new PerformanceStatsController();
const killResetHandler = new KillResetHandler();

// Make globally available
window.performanceStatsController = performanceStatsController;
window.killResetHandler = killResetHandler;

// Header deduplication guard
function dedupeSectionHeader() {
    const label = 'SYSTEM.CONTROLS + PERFORMANCE';
    const headers = Array.from(document.querySelectorAll('.controls-perf-title, .section-title'))
        .filter(h => h.textContent.trim().toUpperCase() === label);
    if (headers.length > 1) {
        headers.slice(1).forEach(h => h.remove());
        console.log(`🧹 Removed ${headers.length - 1} duplicate section headers`);
    }
}

// Run deduplication on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', dedupeSectionHeader);
} else {
    dedupeSectionHeader();
}

export default performanceStatsController;
