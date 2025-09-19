// Performance Stats Controller with Rate Limiting
// Provides real FPS, memory, and DOM monitoring data

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

        // FPS calculation
        this.frameTimes = [];
        this.maxFrameSamples = 60;

        this.init();
    }

    init() {
        console.log('📊 Performance Stats Controller initialized');
        this.startFPSMonitoring();
        this.startMemoryMonitoring();
        this.startDOMMonitoring();
    }

    startFPSMonitoring() {
        const measureFPS = (currentTime) => {
            // Calculate frame time
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;

            // Store frame time for averaging
            this.frameTimes.push(deltaTime);
            if (this.frameTimes.length > this.maxFrameSamples) {
                this.frameTimes.shift();
            }

            // Update display at limited rate
            if (currentTime - this.lastUpdateTime > this.updateInterval) {
                this.updateFPSDisplay();
                this.lastUpdateTime = currentTime;
            }

            requestAnimationFrame(measureFPS);
        };

        requestAnimationFrame(measureFPS);
    }

    updateFPSDisplay() {
        // Calculate average FPS from frame times
        if (this.frameTimes.length > 0) {
            const averageFrameTime = this.frameTimes.reduce((a, b) => a + b) / this.frameTimes.length;
            this.fps = Math.round(1000 / averageFrameTime);
        }

        // Update display elements
        const fpsElement = document.getElementById('fpsCounter');
        if (fpsElement) {
            fpsElement.textContent = this.fps;

            // Remove old classes
            fpsElement.classList.remove('warning', 'danger');

            // Color coding based on performance
            if (this.fps < 30) {
                fpsElement.classList.add('danger');
            } else if (this.fps < 50) {
                fpsElement.classList.add('warning');
            }
        }
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

// Initialize and export
const performanceStatsController = new PerformanceStatsController();

// Make globally available
window.performanceStatsController = performanceStatsController;

export default performanceStatsController;