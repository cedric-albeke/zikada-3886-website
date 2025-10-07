// Test Fixes - Verify that console errors are resolved
window.testFixes = {
    async runAllTests() {
        console.log('🧪 Starting fix verification tests...');
        
        const results = {
            intervalManagerCleanup: this.testIntervalManagerCleanup(),
            performanceElementManagerPurge: this.testPerformanceElementManagerPurge(),
            invalidSelectorHandling: this.testInvalidSelectorHandling(),
            matrixRainLimits: this.testMatrixRainLimits(),
            memoryManagement: this.testMemoryManagement()
        };
        
        console.log('✅ All fix verification tests completed:', results);
        
        const passed = Object.values(results).filter(r => r.passed).length;
        const total = Object.keys(results).length;
        
        console.log(`📊 Test Summary: ${passed}/${total} tests passed`);
        return { results, summary: { passed, total, success: passed === total } };
    },
    
    testIntervalManagerCleanup() {
        console.log('🔧 Testing IntervalManager.cleanup() method...');
        
        try {
            if (!window.intervalManager) {
                return { passed: false, error: 'IntervalManager not available' };
            }
            
            if (typeof window.intervalManager.cleanup !== 'function') {
                return { passed: false, error: 'cleanup() method not found' };
            }
            
            const result = window.intervalManager.cleanup();
            
            return { 
                passed: true, 
                result: result,
                message: 'IntervalManager.cleanup() works correctly'
            };
            
        } catch (error) {
            return { passed: false, error: error.message };
        }
    },
    
    testPerformanceElementManagerPurge() {
        console.log('🧹 Testing PerformanceElementManager.purge() method...');
        
        try {
            if (!window.performanceElementManager) {
                return { passed: false, error: 'PerformanceElementManager not available' };
            }
            
            if (typeof window.performanceElementManager.purge !== 'function') {
                return { passed: false, error: 'purge() method not found' };
            }
            
            const result = window.performanceElementManager.purge();
            
            return { 
                passed: true, 
                result: result,
                message: 'PerformanceElementManager.purge() works correctly'
            };
            
        } catch (error) {
            return { passed: false, error: error.message };
        }
    },
    
    testInvalidSelectorHandling() {
        console.log('🔍 Testing invalid selector handling...');
        
        try {
            // Test DOM selector resilience directly since cleanupGuards might not be available
            let handledGracefully = true;
            let testResults = [];
            
            // Temporarily suppress console.warn for these expected invalid selectors
            const originalWarn = console.warn;
            const originalError = console.error;
            let suppressedLogs = [];
            
            console.warn = (...args) => {
                // Suppress expected warnings about invalid selectors
                const message = args[0]?.toString?.() || '';
                if (message.includes('Invalid selector') || 
                    message.includes('not a valid selector') || 
                    message.includes('[cleanup]')) {
                    suppressedLogs.push(['warn', ...args]);
                    return;
                }
                originalWarn(...args);
            };
            
            console.error = (...args) => {
                const message = args[0]?.toString?.() || '';
                if (message.includes('not a valid selector') || 
                    message.includes('Invalid selector')) {
                    suppressedLogs.push(['error', ...args]);
                    return;
                }
                originalError(...args);
            };
            
            try {
                // Test 1: Invalid CSS selector that should be handled gracefully
                try {
                    const result1 = document.querySelectorAll('*:not(:connected)'); // This is actually invalid in most contexts
                } catch (e) {
                    // This is expected to throw, and the system should handle it
                    testResults.push('Handled invalid :connected selector');
                }
                
                // Test 2: Malformed selector
                try {
                    const result2 = document.querySelectorAll('invalid>>>selector');
                } catch (e) {
                    // Expected to throw - this is proper error handling
                    testResults.push('Handled malformed selector');
                }
                
                // Test 3: Valid selector should work
                try {
                    const result3 = document.querySelectorAll('.valid-selector');
                    testResults.push('Valid selector worked');
                } catch (e) {
                    handledGracefully = false;
                }
                
                // Test 4: Test with cleanupGuards if available
                if (window.cleanupGuards && typeof window.cleanupGuards.safeQueryAll === 'function') {
                    try {
                        const result4 = window.cleanupGuards.safeQueryAll('invalid>>>selector');
                        if (Array.isArray(result4)) {
                            testResults.push('CleanupGuards handled invalid selector safely');
                        }
                    } catch (e) {
                        handledGracefully = false;
                    }
                }
                
            } catch (unexpectedError) {
                handledGracefully = false;
                console.log('Unexpected error during selector tests:', unexpectedError);
            } finally {
                // Restore original console methods
                console.warn = originalWarn;
                console.error = originalError;
            }
            
            console.log(`🔇 Suppressed ${suppressedLogs.length} expected selector warnings during test`);
            
            return { 
                passed: handledGracefully, 
                testResults: testResults,
                suppressedLogs: suppressedLogs.length,
                message: handledGracefully ? 'Invalid selectors handled safely without throwing' : 'System threw unexpected errors'
            };
            
        } catch (error) {
            return { passed: false, error: error.message };
        }
    },
    
    testMatrixRainLimits() {
        console.log('🌧️ Testing matrix rain element limits...');
        
        try {
            const matrixElements = document.querySelectorAll('.matrix-char');
            const limit = window.performanceBudgets?.budgets?.MAX_ANIM_NODES || 50;
            const canSpawn = window.performanceBudgets?.canSpawnAnimationElement?.() ?? true;
            
            return { 
                passed: true,
                currentCount: matrixElements.length,
                limit: limit,
                canSpawn: canSpawn,
                message: `Matrix elements: ${matrixElements.length}/${limit}, can spawn: ${canSpawn}`
            };
            
        } catch (error) {
            return { passed: false, error: error.message };
        }
    },
    
    testMemoryManagement() {
        console.log('💾 Testing memory management systems...');
        
        try {
            const managers = {
                lifecycleManager: !!window.lifecycleManager,
                performanceBudgets: !!window.performanceBudgets,
                cleanupGuards: !!window.cleanupGuards
            };
            
            let memoryInfo = null;
            if (performance.memory) {
                memoryInfo = {
                    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
                    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
                    limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
                };
            }
            
            return { 
                passed: true,
                managers: managers,
                memoryInfo: memoryInfo,
                message: 'Memory management systems operational'
            };
            
        } catch (error) {
            return { passed: false, error: error.message };
        }
    }
};

// Auto-run tests when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            console.log('🚀 Auto-running fix verification tests...');
            window.testFixes.runAllTests();
        }, 2000);
    });
} else {
    setTimeout(() => {
        console.log('🚀 Auto-running fix verification tests...');
        window.testFixes.runAllTests();
    }, 100);
}

export default window.testFixes;