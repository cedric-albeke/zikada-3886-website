/**
 * Control Panel Layout Shim
 * Handles the reorganized control panel structure and removed BPM Ripple button
 */

document.addEventListener('DOMContentLoaded', function() {
    // Guard against removed BPM Ripple button
    const bpmRippleBtn = document.getElementById('toggleBpmRipple');
    if (bpmRippleBtn) {
        console.warn('BPM Ripple button found but should have been removed');
        bpmRippleBtn.style.display = 'none';
    }

    // Ensure performance mode buttons work with new structure
    const modeButtons = document.querySelectorAll('.cp-modes .mode-btn');
    modeButtons.forEach(btn => {
        // Add aria-pressed attribute for accessibility
        btn.setAttribute('aria-pressed', btn.classList.contains('active') ? 'true' : 'false');
        
        btn.addEventListener('click', function() {
            // Remove active from all mode buttons
            modeButtons.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            // Add active to clicked button
            this.classList.add('active');
            this.setAttribute('aria-pressed', 'true');
            
            // Trigger performance mode change event for other scripts
            const mode = this.dataset.mode;
            window.dispatchEvent(new CustomEvent('performanceModeChange', { detail: { mode } }));
        });
    });

    // Ensure Kill, Reset, Reload buttons still work
    const emergencyStop = document.getElementById('emergencyStop');
    const systemReset = document.getElementById('systemReset');
    const systemReload = document.getElementById('systemReload');

    if (emergencyStop && !emergencyStop.hasAttribute('data-shim-bound')) {
        emergencyStop.setAttribute('data-shim-bound', 'true');
        emergencyStop.addEventListener('click', function() {
            console.log('Emergency stop triggered');
            // Preserve existing functionality
            if (window.killAllEffects) {
                window.killAllEffects();
            }
        });
    }

    if (systemReset && !systemReset.hasAttribute('data-shim-bound')) {
        systemReset.setAttribute('data-shim-bound', 'true');
        systemReset.addEventListener('click', function() {
            console.log('System reset triggered');
            // Preserve existing functionality
            if (window.resetSystem) {
                window.resetSystem();
            }
        });
    }

    if (systemReload && !systemReload.hasAttribute('data-shim-bound')) {
        systemReload.setAttribute('data-shim-bound', 'true');
        systemReload.addEventListener('click', function() {
            console.log('System reload triggered');
            location.reload();
        });
    }

    // Scene Select accordion functionality for minimal footprint
    const scenePanel = document.querySelector('.cp-panel--scene');
    if (scenePanel) {
        const sceneHeader = scenePanel.querySelector('h2');
        const sceneGrid = scenePanel.querySelector('.scene-grid');
        
        if (sceneHeader && sceneGrid) {
            // Add toggle button to header
            sceneHeader.style.cursor = 'pointer';
            sceneHeader.setAttribute('role', 'button');
            sceneHeader.setAttribute('aria-expanded', 'true');
            sceneHeader.setAttribute('aria-controls', 'scene-grid-content');
            sceneGrid.setAttribute('id', 'scene-grid-content');
            
            // Add visual indicator
            const toggleIcon = document.createElement('span');
            toggleIcon.textContent = ' ▼';
            toggleIcon.style.fontSize = '10px';
            toggleIcon.style.marginLeft = '8px';
            toggleIcon.classList.add('scene-toggle-icon');
            sceneHeader.appendChild(toggleIcon);
            
            // Toggle functionality
            sceneHeader.addEventListener('click', function() {
                const isExpanded = this.getAttribute('aria-expanded') === 'true';
                
                if (isExpanded) {
                    sceneGrid.style.display = 'none';
                    this.setAttribute('aria-expanded', 'false');
                    toggleIcon.textContent = ' ►';
                    scenePanel.style.minHeight = '60px';
                } else {
                    sceneGrid.style.display = '';
                    this.setAttribute('aria-expanded', 'true');
                    toggleIcon.textContent = ' ▼';
                    scenePanel.style.minHeight = '';
                }
            });
            
            // Handle keyboard navigation
            sceneHeader.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        }
    }

    // Update any scripts looking for the old control-grid class
    const oldGrid = document.querySelector('.control-grid');
    const newGrid = document.querySelector('.cp-main-grid');
    if (!oldGrid && newGrid) {
        // Add backward compatibility class
        newGrid.classList.add('control-grid');
    }

    console.log('Control Panel Layout Shim loaded successfully');
});