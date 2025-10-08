/**
 * ============================================================================
 * MATRIX DICE SYSTEM - Enhanced Interactive Dice with Animations
 * ============================================================================
 * 
 * Features:
 * - Animated dice rolling with matrix-style effects
 * - Statistics tracking (wins, threshold hits)
 * - Auto-roll functionality with customizable intervals
 * - Connection status management with reload state handling
 * - Visual feedback and sound effects (optional)
 * 
 * Version: 2.0.0
 * Date: 2025-10-08
 */

class MatrixDiceSystem {
    constructor() {
        this.currentValue = null;
        this.rollHistory = [];
        this.stats = {
            totalRolls: 0,
            wins: 0,
            thresholdHits: 0,
            lastValue: null
        };
        
        this.isRolling = false;
        this.autoRollEnabled = false;
        this.autoRollInterval = null;
        this.autoRollDelay = 3000; // 3 seconds
        
        this.threshold = 90;
        this.maxHistoryLength = 100;
        
        this.init();
    }
    
    init() {
        console.log('🎲 Matrix Dice System initialized');
        this.bindEvents();
        this.loadStats();
        this.updateDisplay();
        
        // Initial display state
        this.setDiceNumber('?');
    }
    
    bindEvents() {
        // Roll button
        const rollBtn = document.getElementById('diceRollBtn');
        if (rollBtn) {
            rollBtn.addEventListener('click', () => this.rollDice());
        }
        
        // Auto-roll toggle
        const autoRollToggle = document.getElementById('diceAutoRoll');
        if (autoRollToggle) {
            autoRollToggle.addEventListener('change', (e) => {
                this.setAutoRoll(e.target.checked);
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                this.rollDice();
            }
        });
    }
    
    async rollDice() {
        if (this.isRolling) return;
        
        this.isRolling = true;
        const diceDisplay = document.getElementById('diceDisplay');
        const diceNumber = document.getElementById('diceNumber');
        
        // Add rolling animation
        if (diceDisplay) {
            diceDisplay.classList.add('rolling');
        }
        
        // Animate number changes during roll
        const rollDuration = 800;
        const numberChangeInterval = 100;
        const changeCount = rollDuration / numberChangeInterval;
        
        for (let i = 0; i < changeCount; i++) {
            const randomNum = Math.floor(Math.random() * 100) + 1;
            this.setDiceNumber(randomNum);
            await this.wait(numberChangeInterval);
        }
        
        // Final roll result
        const finalValue = Math.floor(Math.random() * 100) + 1;
        this.currentValue = finalValue;
        this.setDiceNumber(finalValue);
        
        // Remove animation
        if (diceDisplay) {
            diceDisplay.classList.remove('rolling');
        }
        
        // Update stats
        this.updateStats(finalValue);
        this.updateDisplay();
        
        // Visual feedback for good rolls
        if (finalValue >= this.threshold) {
            this.celebrateWin();
        }
        
        this.isRolling = false;
        
        console.log(`🎲 Dice rolled: ${finalValue}`);
    }
    
    setDiceNumber(number) {
        const diceNumber = document.getElementById('diceNumber');
        if (diceNumber) {
            diceNumber.textContent = number;
        }
    }
    
    updateStats(value) {
        this.stats.totalRolls++;
        this.stats.lastValue = value;
        
        if (value >= this.threshold) {
            this.stats.wins++;
            this.stats.thresholdHits++;
        }
        
        this.rollHistory.unshift(value);
        if (this.rollHistory.length > this.maxHistoryLength) {
            this.rollHistory.pop();
        }
        
        this.saveStats();
    }
    
    updateDisplay() {
        // Update stat values
        const lastValue = document.getElementById('lastDiceValue');
        const winCount = document.getElementById('diceWinCount');
        const thresholdHits = document.getElementById('diceThresholdHits');
        
        if (lastValue) {
            lastValue.textContent = this.stats.lastValue || '--';
            if (this.stats.lastValue >= this.threshold) {
                lastValue.classList.add('highlight');
                setTimeout(() => lastValue.classList.remove('highlight'), 500);
            }
        }
        
        if (winCount) {
            winCount.textContent = this.stats.wins;
        }
        
        if (thresholdHits) {
            thresholdHits.textContent = this.stats.thresholdHits;
        }
    }
    
    celebrateWin() {
        const diceDisplay = document.getElementById('diceDisplay');
        const diceNumber = document.getElementById('diceNumber');
        
        if (diceDisplay) {
            // Add win animation
            diceDisplay.style.borderColor = '#00ffff';
            diceDisplay.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.8)';
            
            setTimeout(() => {
                diceDisplay.style.borderColor = 'rgba(0, 255, 133, 0.4)';
                diceDisplay.style.boxShadow = 'none';
            }, 1500);
        }
        
        if (diceNumber) {
            diceNumber.style.color = '#00ffff';
            diceNumber.style.textShadow = '0 0 10px #00ffff';
            
            setTimeout(() => {
                diceNumber.style.color = '#00ff85';
                diceNumber.style.textShadow = 'none';
            }, 1500);
        }
        
        console.log('🎯 Dice win celebration!');
    }
    
    setAutoRoll(enabled) {
        this.autoRollEnabled = enabled;
        
        if (enabled) {
            this.autoRollInterval = setInterval(() => {
                if (!this.isRolling) {
                    this.rollDice();
                }
            }, this.autoRollDelay);
            console.log('🔄 Auto-roll enabled');
        } else {
            if (this.autoRollInterval) {
                clearInterval(this.autoRollInterval);
                this.autoRollInterval = null;
            }
            console.log('⏸️ Auto-roll disabled');
        }
    }
    
    saveStats() {
        try {
            localStorage.setItem('3886_dice_stats', JSON.stringify(this.stats));
            localStorage.setItem('3886_dice_history', JSON.stringify(this.rollHistory));
        } catch (error) {
            console.warn('Failed to save dice stats:', error);
        }
    }
    
    loadStats() {
        try {
            const savedStats = localStorage.getItem('3886_dice_stats');
            const savedHistory = localStorage.getItem('3886_dice_history');
            
            if (savedStats) {
                this.stats = { ...this.stats, ...JSON.parse(savedStats) };
            }
            
            if (savedHistory) {
                this.rollHistory = JSON.parse(savedHistory);
            }
        } catch (error) {
            console.warn('Failed to load dice stats:', error);
        }
    }
    
    resetStats() {
        this.stats = {
            totalRolls: 0,
            wins: 0,
            thresholdHits: 0,
            lastValue: null
        };
        this.rollHistory = [];
        this.saveStats();
        this.updateDisplay();
        console.log('🔄 Dice stats reset');
    }
    
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Public API
    getStats() {
        return { ...this.stats };
    }
    
    getHistory() {
        return [...this.rollHistory];
    }
    
    setThreshold(value) {
        this.threshold = Math.max(1, Math.min(100, value));
        console.log(`🎯 Dice threshold set to: ${this.threshold}`);
    }
}

/**
 * Connection Status Manager - Fixes reload freeze issue
 */
class ConnectionStatusManager {
    constructor() {
        this.status = 'offline';
        this.uptime = 0;
        this.uptimeInterval = null;
        this.reloadTimeout = null;
        this.isReloading = false;
        
        this.init();
    }
    
    init() {
        console.log('🔗 Connection Status Manager initialized');
        this.startUptimeCounter();
        this.bindReloadEvents();
        this.updateDisplay();
    }
    
    bindReloadEvents() {
        // System reload button
        const reloadBtn = document.getElementById('systemReload');
        if (reloadBtn) {
            reloadBtn.addEventListener('click', () => this.handleReload());
        }
        
        // Page visibility change
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isReloading) {
                // Page became visible again after reload
                this.handleReloadComplete();
            }
        });
        
        // Window focus events
        window.addEventListener('focus', () => {
            if (this.isReloading) {
                this.handleReloadComplete();
            }
        });
    }
    
    handleReload() {
        this.setStatus('reloading');
        this.isReloading = true;
        
        console.log('🔄 Page reload initiated');
        
        // Set timeout to handle stuck reload state
        this.reloadTimeout = setTimeout(() => {
            if (this.isReloading) {
                console.warn('⚠️ Reload timeout - forcing status reset');
                this.handleReloadComplete();
            }
        }, 5000);
        
        // Perform the actual reload
        setTimeout(() => {
            window.location.reload();
        }, 500);
    }
    
    handleReloadComplete() {
        if (this.reloadTimeout) {
            clearTimeout(this.reloadTimeout);
            this.reloadTimeout = null;
        }
        
        this.isReloading = false;
        this.setStatus('online');
        
        console.log('✅ Reload completed');
    }
    
    setStatus(status) {
        this.status = status;
        this.updateDisplay();
    }
    
    updateDisplay() {
        const statusContainer = document.getElementById('connectionStatus');
        const statusText = statusContainer?.querySelector('.status-text');
        
        if (!statusContainer || !statusText) return;
        
        // Remove all status classes
        statusContainer.classList.remove('online', 'offline', 'reloading');
        
        // Add current status class
        statusContainer.classList.add(this.status);
        
        // Update text
        const statusLabels = {
            'online': 'ONLINE',
            'offline': 'OFFLINE',
            'reloading': 'RELOADING...'
        };
        
        statusText.textContent = statusLabels[this.status] || 'UNKNOWN';
    }
    
    startUptimeCounter() {
        const startTime = Date.now();
        
        this.uptimeInterval = setInterval(() => {
            if (this.isReloading) return; // Pause during reload
            
            this.uptime = Math.floor((Date.now() - startTime) / 1000);
            this.updateUptimeDisplay();
        }, 1000);
    }
    
    updateUptimeDisplay() {
        const uptimeElement = document.getElementById('systemUptime');
        if (uptimeElement) {
            const hours = Math.floor(this.uptime / 3600);
            const minutes = Math.floor((this.uptime % 3600) / 60);
            const seconds = this.uptime % 60;
            
            const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            uptimeElement.textContent = timeString;
        }
    }
    
    destroy() {
        if (this.uptimeInterval) {
            clearInterval(this.uptimeInterval);
        }
        if (this.reloadTimeout) {
            clearTimeout(this.reloadTimeout);
        }
    }
}

// Initialize systems when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMatrixSystems);
} else {
    initializeMatrixSystems();
}

function initializeMatrixSystems() {
    // Initialize Matrix Dice System
    if (!window.matrixDiceSystem) {
        window.matrixDiceSystem = new MatrixDiceSystem();
    }
    
    // Initialize Connection Status Manager
    if (!window.connectionStatusManager) {
        window.connectionStatusManager = new ConnectionStatusManager();
    }
    
    // Set initial online status after a brief delay
    setTimeout(() => {
        if (window.connectionStatusManager) {
            window.connectionStatusManager.setStatus('online');
        }
    }, 1000);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MatrixDiceSystem, ConnectionStatusManager };
}