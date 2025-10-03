/**
 * ============================================
 * CONTROL PANEL V3 - LIGHTWEIGHT ENHANCEMENTS
 * ============================================
 * 
 * Adds interactive features to the v3 control panel:
 * - Optional features toggle
 * - Keyboard shortcuts
 * - Visual feedback enhancements
 * - Integration with existing control-panel-professional.js
 */

class ControlPanelV3 {
    constructor() {
        this.init();
    }

    init() {
        this.setupKeyboardShortcuts();
        this.setupSpeedSliderSync();
        this.enhanceButtonFeedback();
        this.startUptimeCounter();
        console.log('🎛️ Control Panel V3 enhancements loaded');
    }

    /**
     * Setup keyboard shortcuts for quick access
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger if typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            // ESC - Emergency stop
            if (e.key === 'Escape') {
                document.getElementById('emergencyStop')?.click();
                return;
            }

            // Ctrl/Cmd + key combinations
            if (e.ctrlKey || e.metaKey) {
                switch(e.key.toLowerCase()) {
                    case 'r':
                        e.preventDefault();
                        document.getElementById('systemReset')?.click();
                        break;
                    case 'e':
                        e.preventDefault();
                        document.getElementById('animeEnable')?.click();
                        break;
                    case 'd':
                        e.preventDefault();
                        document.getElementById('animeDisable')?.click();
                        break;
                }
            }

            // Number keys 1-9 for scene selection
            if (e.key >= '1' && e.key <= '9' && !e.ctrlKey && !e.metaKey) {
                const sceneButtons = document.querySelectorAll('.scene-btn');
                const index = parseInt(e.key) - 1;
                if (sceneButtons[index]) {
                    sceneButtons[index].click();
                }
            }

            // Space for AUTO mode
            if (e.key === ' ' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                document.querySelector('.scene-auto')?.click();
            }
        });
    }

    /**
     * Sync speed slider with display value
     */
    setupSpeedSliderSync() {
        const speedSlider = document.getElementById('speedSlider');
        const speedValue = document.getElementById('speedValue');

        if (speedSlider && speedValue) {
            speedSlider.addEventListener('input', (e) => {
                speedValue.textContent = `${e.target.value}%`;
            });
        }

        const phaseSlider = document.getElementById('phaseDurationSlider');
        const phaseValue = document.getElementById('phaseValue');
        if (phaseSlider && phaseValue) {
            phaseSlider.addEventListener('input', (e) => {
                phaseValue.textContent = `${e.target.value}s`;
            });
        }
    }

    /**
     * Enhanced button feedback
     */
    enhanceButtonFeedback() {
        // Add ripple effect to all buttons
        document.querySelectorAll('.scene-btn, .trigger-btn, .macro-btn, .anim-trigger-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.createRipple(e);
            });
        });

        // Scene button active states
        document.querySelectorAll('.scene-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active from all scene buttons
                document.querySelectorAll('.scene-btn').forEach(b => b.classList.remove('active'));
                // Add active to clicked button
                btn.classList.add('active');
            });
        });

        // Performance mode button active states
        document.querySelectorAll('.btn--small[data-mode]').forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active from all mode buttons
                document.querySelectorAll('.btn--small[data-mode]').forEach(b => b.classList.remove('active'));
                // Add active to clicked button
                btn.classList.add('active');
            });
        });

        // Animation system button states
        const enableBtn = document.getElementById('animeEnable');
        const disableBtn = document.getElementById('animeDisable');
        
        if (enableBtn && disableBtn) {
            enableBtn.addEventListener('click', () => {
                enableBtn.classList.add('active');
                disableBtn.classList.remove('active');
            });
            
            disableBtn.addEventListener('click', () => {
                disableBtn.classList.add('active');
                enableBtn.classList.remove('active');
            });
        }

        // Add active state feedback for toggle buttons
        document.querySelectorAll('.effect-toggle-btn, .layer-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const currentState = btn.getAttribute('data-state');
                const newState = currentState === 'on' ? 'off' : 'on';
                btn.setAttribute('data-state', newState);
                btn.textContent = newState.toUpperCase();
            });
        });
    }

    /**
     * Create ripple effect on button click
     */
    createRipple(event) {
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: rgba(0, 255, 133, 0.6);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            animation: rippleEffect 0.6s ease-out;
            left: ${x}px;
            top: ${y}px;
        `;

        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    }

    /**
     * Start system uptime counter
     */
    startUptimeCounter() {
        const uptimeElement = document.getElementById('systemUptime');
        if (!uptimeElement) return;
        
        const startTime = Date.now();
        
        setInterval(() => {
            const elapsed = Date.now() - startTime;
            const hours = Math.floor(elapsed / 3600000);
            const minutes = Math.floor((elapsed % 3600000) / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            
            const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            uptimeElement.textContent = formatted;
        }, 1000);
        
        console.log('⏱️ Uptime counter started');
    }
}

// Add ripple animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes rippleEffect {
        from {
            width: 4px;
            height: 4px;
            opacity: 1;
        }
        to {
            width: 100px;
            height: 100px;
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ControlPanelV3();
    });
} else {
    new ControlPanelV3();
}

// Export for use in other modules
export default ControlPanelV3;
