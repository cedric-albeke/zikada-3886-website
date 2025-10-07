/**
 * Emergency Diagnostic Script
 * 
 * Quick diagnostic to identify what's causing animation and control issues
 */

console.log('🚨 Emergency Diagnostic Starting...');

// Test interval manager API
console.log('Testing interval manager API...');
try {
    if (typeof intervalManager !== 'undefined') {
        console.log('✅ intervalManager is available');
        
        // Test set method
        if (typeof intervalManager.set === 'function') {
            console.log('✅ intervalManager.set() method exists');
            
            // Test creating and clearing an interval
            const testId = intervalManager.set('diagnostic-test', () => {
                console.log('Test interval fired');
            }, 1000);
            
            console.log(`✅ Created test interval with ID: ${testId}`);
            
            // Clear it immediately
            const cleared = intervalManager.clear(testId);
            console.log(`✅ Cleared test interval: ${cleared}`);
            
        } else {
            console.error('❌ intervalManager.set() method missing');
        }
        
        // Test stats
        const stats = intervalManager.getStats();
        console.log('📊 Interval Manager Stats:', stats);
        
    } else {
        console.error('❌ intervalManager not available globally');
    }
} catch (error) {
    console.error('❌ Interval Manager test failed:', error);
}

// Test GSAP availability and timing
console.log('Testing GSAP...');
try {
    if (typeof gsap !== 'undefined') {
        console.log('✅ GSAP is available');
        
        // Check timeline count
        const timelineCount = gsap.globalTimeline.getChildren().length;
        console.log(`📊 Active GSAP timelines: ${timelineCount}`);
        
        // Check timeline speed
        const globalTimeScale = gsap.globalTimeline.timeScale();
        console.log(`⏱️ Global timeline speed: ${globalTimeScale}x`);
        
        if (globalTimeScale !== 1) {
            console.warn(`⚠️ Global timeline speed is not normal! Should be 1, but is ${globalTimeScale}`);
        }
        
        // Check for any overridden timing functions
        if (gsap.ticker.lagSmoothing() !== 500) {
            console.warn(`⚠️ GSAP lag smoothing modified: ${gsap.ticker.lagSmoothing()}`);
        }
        
    } else {
        console.error('❌ GSAP not available globally');
    }
} catch (error) {
    console.error('❌ GSAP test failed:', error);
}

// Test performance systems
console.log('Testing performance systems...');
try {
    if (typeof window.ZIKADA_PERFORMANCE_SYSTEM !== 'undefined') {
        const perfSystem = window.ZIKADA_PERFORMANCE_SYSTEM;
        console.log('⚠️ Performance system is loaded');
        console.log('Enabled:', perfSystem.enabled);
        console.log('Panic mode:', perfSystem.panicMode);
        console.log('Features:', perfSystem.features);
        
        // If it's interfering, disable it
        if (perfSystem.enabled) {
            console.log('🚨 Disabling performance system to prevent interference');
            perfSystem.setEnabled(false);
        }
        
    } else {
        console.log('✅ Performance system not loaded (good)');
    }
} catch (error) {
    console.error('Performance system check failed:', error);
}

// Test requestAnimationFrame timing
console.log('Testing animation frame timing...');
const frameTests = [];
let frameTestCount = 0;

const testFrameTiming = () => {
    const start = performance.now();
    frameTestCount++;
    
    if (frameTestCount > 1) {
        const frameDelta = start - frameTests[frameTests.length - 1];
        frameTests.push(start);
        
        if (frameTestCount <= 10) {
            console.log(`Frame ${frameTestCount}: ${frameDelta.toFixed(2)}ms delta`);
            
            if (frameDelta < 8) { // Less than 8ms = way too fast
                console.warn('⚠️ Frames are running too fast! This could cause blazingly fast animations');
            }
        }
        
        if (frameTestCount >= 10) {
            const avgDelta = frameTests.slice(1).reduce((sum, time, i) => {
                return sum + (time - frameTests[i]);
            }, 0) / (frameTests.length - 1);
            
            console.log(`📊 Average frame delta: ${avgDelta.toFixed(2)}ms`);
            console.log(`📊 Estimated FPS: ${(1000 / avgDelta).toFixed(1)}`);
            
            return; // Stop testing
        }
    } else {
        frameTests.push(start);
    }
    
    requestAnimationFrame(testFrameTiming);
};

requestAnimationFrame(testFrameTiming);

// Test control panel connectivity
console.log('Testing control panel connectivity...');
setTimeout(() => {
    try {
        // Check localStorage communication
        const testMessage = {
            type: 'diagnostic_test',
            timestamp: Date.now(),
            _id: 'diagnostic-' + Math.random().toString(36).substr(2, 9)
        };
        
        localStorage.setItem('3886_vj_message', JSON.stringify(testMessage));
        console.log('✅ localStorage message sent');
        
        // Check if we can receive
        const listener = (e) => {
            if (e.key === '3886_vj_response') {
                console.log('✅ Received localStorage response');
                window.removeEventListener('storage', listener);
            }
        };
        
        window.addEventListener('storage', listener);
        
        // Cleanup listener after 2 seconds
        setTimeout(() => {
            window.removeEventListener('storage', listener);
        }, 2000);
        
    } catch (error) {
        console.error('❌ Control panel connectivity test failed:', error);
    }
}, 100);

// Test DOM update performance
console.log('Testing DOM update performance...');
const testDOMPerf = () => {
    const testElement = document.createElement('div');
    testElement.style.position = 'absolute';
    testElement.style.left = '-9999px';
    document.body.appendChild(testElement);
    
    const start = performance.now();
    
    // Test 100 DOM updates
    for (let i = 0; i < 100; i++) {
        testElement.style.transform = `translateX(${i}px)`;
    }
    
    const end = performance.now();
    const domTime = end - start;
    
    console.log(`📊 100 DOM updates took: ${domTime.toFixed(2)}ms`);
    
    if (domTime > 50) {
        console.warn('⚠️ DOM updates are slow - might affect control panel responsiveness');
    }
    
    // Cleanup
    document.body.removeChild(testElement);
};

testDOMPerf();

// Final summary
setTimeout(() => {
    console.log('🏁 Emergency Diagnostic Complete');
    console.log('📋 Summary:');
    console.log('- Check console above for any ❌ or ⚠️ warnings');
    console.log('- Performance system is disabled by default to prevent interference');
    console.log('- To enable performance features: ?perfFlags=stabilizer,scaler,webgl');
    console.log('- To see performance overlay: ?debug=perf');
}, 2000);

// Export for manual access
if (typeof window !== 'undefined') {
    window.EMERGENCY_DIAGNOSTIC = {
        testIntervalManager: () => intervalManager,
        testGSAP: () => ({ 
            available: typeof gsap !== 'undefined',
            timeScale: gsap?.globalTimeline?.timeScale(),
            timelines: gsap?.globalTimeline?.getChildren?.()?.length
        }),
        disablePerformanceSystem: () => {
            if (window.ZIKADA_PERFORMANCE_SYSTEM) {
                window.ZIKADA_PERFORMANCE_SYSTEM.setEnabled(false);
                return 'Performance system disabled';
            }
            return 'Performance system not found';
        }
    };
}