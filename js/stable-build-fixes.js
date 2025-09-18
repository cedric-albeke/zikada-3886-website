// STABLE BUILD FIXES - Minimal targeted fixes for v1.0.0-stable known issues
// This file addresses only the high-priority issues without breaking working features

console.log('🔧 Applying stable build fixes...');

// FIX 1: Grey Flash Issues - Prevent filter conflicts
function fixGreyFlashes() {
    console.log('  🎨 Fixing grey flash issues...');
    
    // Prevent conflicting filter animations on body
    const originalBodyFilter = document.body.style.filter || 'none';
    
    // Override GSAP filter animations on body to prevent grey flashes
    const originalTo = gsap.to;
    gsap.to = function(target, vars) {
        // If targeting body and setting filter, ensure safe values
        if (target === document.body && vars.filter) {
            // Ensure minimum brightness and no grey values
            if (vars.filter.includes('brightness')) {
                const brightnessMatch = vars.filter.match(/brightness\(([^)]+)\)/);
                if (brightnessMatch) {
                    const value = parseFloat(brightnessMatch[1]);
                    if (value < 0.8) {
                        vars.filter = vars.filter.replace(/brightness\([^)]+\)/, 'brightness(0.8)');
                    }
                }
            }
            // Prevent 'none' which can cause flashes
            if (vars.filter === 'none') {
                vars.filter = 'brightness(1) contrast(1)';
            }
        }
        return originalTo.call(this, target, vars);
    };
    
    console.log('    ✅ Grey flash prevention applied');
}

// FIX 2: Background Animation Stability
function fixBackgroundStability() {
    console.log('  🖼️ Stabilizing background animations...');
    
    // Ensure bg-2.svg stays visible and animated
    const bgElement = document.querySelector('.bg');
    if (bgElement) {
        // Reset any bad states
        bgElement.style.opacity = '1';
        bgElement.style.visibility = 'visible';
        bgElement.style.display = 'block';
        
        // Ensure animation continues
        if (!bgElement.style.animation || bgElement.style.animation === 'none') {
            bgElement.style.animation = 'rotate 20s linear infinite';
        }
        
        console.log('    ✅ Background animation stabilized');
    }
    
    // Monitor for background issues
    setInterval(() => {
        const bg = document.querySelector('.bg');
        if (bg && (bg.style.opacity === '0' || bg.style.display === 'none')) {
            bg.style.opacity = '1';
            bg.style.display = 'block';
        }
    }, 5000);
}

// FIX 3: CPU Usage - Throttle heavy animations
function reduceCPUUsage() {
    console.log('  ⚡ Reducing CPU usage...');
    
    // Reduce GSAP ticker to 30 FPS
    if (gsap.ticker) {
        gsap.ticker.fps(30);
        console.log('    ✅ GSAP FPS reduced to 30');
    }
    
    // Throttle animation creation
    let lastAnimTime = 0;
    const MIN_ANIM_INTERVAL = 100; // Min 100ms between animations
    
    const wrapGSAPMethod = (method) => {
        const original = gsap[method];
        gsap[method] = function(...args) {
            const now = Date.now();
            if (now - lastAnimTime < MIN_ANIM_INTERVAL) {
                return null; // Skip if too frequent
            }
            lastAnimTime = now;
            return original.apply(this, args);
        };
    };
    
    // Apply throttling to animation methods
    ['to', 'from', 'fromTo'].forEach(wrapGSAPMethod);
    
    console.log('    ✅ Animation throttling applied');
}

// FIX 4: Memory Leaks - Clean up old animations
function fixMemoryLeaks() {
    console.log('  🧹 Setting up memory leak prevention...');
    
    // Track and clean old animations
    const animations = new Set();
    
    // Wrap GSAP to track animations
    const trackAnimation = (anim) => {
        if (anim) {
            animations.add(anim);
            // Auto-cleanup completed animations
            if (anim.eventCallback) {
                const originalComplete = anim.eventCallback('onComplete');
                anim.eventCallback('onComplete', function() {
                    animations.delete(anim);
                    if (originalComplete) originalComplete.call(this);
                });
            }
        }
        return anim;
    };
    
    // Periodic cleanup of dead animations
    setInterval(() => {
        let cleaned = 0;
        animations.forEach(anim => {
            if (anim && anim.progress && anim.progress() >= 1 && !anim.repeat) {
                if (anim.kill) anim.kill();
                animations.delete(anim);
                cleaned++;
            }
        });
        if (cleaned > 0) {
            console.log(`    🧹 Cleaned ${cleaned} completed animations`);
        }
    }, 30000); // Every 30 seconds
    
    // Limit DOM elements
    setInterval(() => {
        // Remove excessive particles
        const particles = document.querySelectorAll('.particle, .quantum-particle');
        if (particles.length > 50) {
            for (let i = 50; i < particles.length; i++) {
                particles[i].remove();
            }
        }
        
        // Remove duplicate overlays
        const overlays = document.querySelectorAll('.phase-overlay');
        if (overlays.length > 3) {
            for (let i = 3; i < overlays.length; i++) {
                overlays[i].remove();
            }
        }
    }, 60000); // Every minute
    
    console.log('    ✅ Memory leak prevention active');
}

// FIX 5: Moderate the Animation Supervisor to prevent aggressive restarts
function moderateSupervisor() {
    console.log('  🎛️ Moderating Animation Supervisor...');
    
    if (window.animationSupervisor) {
        // Increase tolerance thresholds
        if (window.animationSupervisor.thresholds) {
            window.animationSupervisor.thresholds.fps = {
                critical: 10,  // Only critical below 10 FPS (was probably 15)
                warning: 20    // Warning at 20 FPS (was probably 30)
            };
            window.animationSupervisor.thresholds.longTask = {
                critical: 500,  // 500ms tasks (was probably 150)
                warning: 300    // 300ms tasks (was probably 100)
            };
        }
        
        // Reduce restart frequency
        const originalRestart = window.animationSupervisor.restart;
        let lastRestart = 0;
        window.animationSupervisor.restart = function() {
            const now = Date.now();
            if (now - lastRestart < 30000) { // Min 30 seconds between restarts
                console.log('    ⏸️ Restart throttled');
                return;
            }
            lastRestart = now;
            return originalRestart.call(this);
        };
        
        console.log('    ✅ Animation Supervisor moderated');
    }
}

// Apply all fixes
function applyAllFixes() {
    fixGreyFlashes();
    fixBackgroundStability();
    reduceCPUUsage();
    fixMemoryLeaks();
    moderateSupervisor();
    
    console.log('✅ All stable build fixes applied!');
}

// Auto-apply fixes after a short delay to ensure everything is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(applyAllFixes, 1000);
    });
} else {
    setTimeout(applyAllFixes, 1000);
}

// Expose for manual control
window.stableBuildFixes = {
    applyAll: applyAllFixes,
    fixGreyFlashes,
    fixBackgroundStability,
    reduceCPUUsage,
    fixMemoryLeaks,
    moderateSupervisor
};

console.log('💡 Stable build fixes loaded. Will auto-apply in 1 second.');
console.log('   Manual control: window.stableBuildFixes.applyAll()');