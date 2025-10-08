// ZIKADA 3886 - Emergency DOM & Centering Fixes
// Ensures essential UI elements are visible and prevents duplicate element issues

(function() {
    'use strict';
    
    console.log('🚨 Emergency DOM fixes loading...');
    
    // Wait for DOM to be ready
    function domReady(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }
    
    function applyEmergencyFixes() {
        console.log('🔧 Applying emergency DOM fixes');
        
        // 0. CHAOS ENGINE PRIORITY OVERRIDE
        disableChaosEngineTemporarily();
        
        // 1. RESTORE MISSING ELEMENTS
        restoreMissingElements();
        
        // 2. PREVENT ELEMENT DUPLICATION
        preventDuplicateElements();
        
        // 3. ENSURE PROPER CENTERING
        ensureProperCentering();
        
        // 4. MONITOR FOR DYNAMIC CHANGES
        monitorDynamicChanges();
        
        console.log('✅ Emergency DOM fixes applied');
    }
    
    function disableChaosEngineTemporarily() {
        // Hide any three.js canvases that may be covering the preloader
        const chaosCanvas = document.getElementById('chaos-canvas');
        if (chaosCanvas) {
            chaosCanvas.style.setProperty('display', 'none', 'important');
            console.log('🚫 Hiding chaos canvas for preloader priority');
        }
        
        // Hide other canvas elements that might interfere
        const interfering = ['#cyber-grid', '#matrix-rain-safe', '#static-noise'];
        interfering.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                el.style.setProperty('opacity', '0.02', 'important');
                el.style.setProperty('z-index', '-100', 'important');
            });
        });
        
        // Set up chaos deferral flag if chaos engine hasn't started yet
        if (!window.__chaosDeferred) {
            window.__chaosDeferred = true;
            window.__preloaderActive = true;
        }
        
        // Create ENTER 3886 button functionality
        setTimeout(() => {
            const enterButton = document.querySelector('.enter-button-wrapper');
            if (enterButton) {
                enterButton.style.cursor = 'pointer';
                enterButton.addEventListener('click', function() {
                    console.log('✨ ENTER 3886 clicked - enabling chaos engine');
                    // Hide preloader
                    const preloader = document.querySelector('.pre-loader');
                    if (preloader) {
                        preloader.style.setProperty('opacity', '0', 'important');
                        setTimeout(() => {
                            preloader.style.setProperty('display', 'none', 'important');
                            // Re-enable chaos canvas
                            if (chaosCanvas) {
                                chaosCanvas.style.removeProperty('display');
                            }
                            // Enable chaos engine if it was deferred
                            if (window.__enableChaos && typeof window.__enableChaos === 'function') {
                                window.__enableChaos();
                            }
                        }, 500);
                    }
                });
                console.log('🎯 ENTER button interaction enabled');
            }
        }, 1000);
    }
    
    function restoreMissingElements() {
        // Ensure the 3886 text is visible and properly structured
        const text3886 = document.querySelector('.text-3886');
        if (text3886) {
            text3886.style.display = 'block';
            text3886.style.visibility = 'visible';
            text3886.style.opacity = '1';
            
            // Ensure the text span exists
            let textSpan = text3886.querySelector('.text-span');
            if (!textSpan) {
                textSpan = document.createElement('span');
                textSpan.className = 'text-span';
                textSpan.textContent = '3886';
                text3886.appendChild(textSpan);
            }
        }
        
        // Ensure enter button wrapper is visible
        const enterWrapper = document.querySelector('.enter-button-wrapper');
        if (enterWrapper) {
            enterWrapper.style.display = 'flex';
            enterWrapper.style.visibility = 'visible';
            enterWrapper.style.opacity = '1';
        }
        
        // Ensure logo text is visible
        const logoText = document.querySelector('.logo-text');
        if (logoText) {
            logoText.style.display = 'block';
            logoText.style.visibility = 'visible';
            logoText.style.opacity = '1';
        }
        
        // Ensure matrix messages container exists and is visible
        const matrixMessages = document.querySelector('.matrix-messages');
        if (matrixMessages) {
            matrixMessages.style.display = 'block';
            matrixMessages.style.visibility = 'visible';
        }
    }
    
    function preventDuplicateElements() {
        // Remove duplicate canvas elements that cause visual artifacts
        const duplicateSelectors = [
            '#matrix-rain-safe',
            '#cyber-grid',
            '#static-noise'
        ];
        
        duplicateSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 1) {
                console.log(`🧹 Removing ${elements.length - 1} duplicate ${selector} elements`);
                // Keep the first one, remove the rest
                for (let i = 1; i < elements.length; i++) {
                    elements[i].remove();
                }
            }
        });
        
        // Clean up excessive floating symbols
        const floatingSymbols = document.querySelectorAll('.floating-symbol');
        if (floatingSymbols.length > 10) {
            console.log(`🧹 Reducing ${floatingSymbols.length} floating symbols to 10`);
            for (let i = 10; i < floatingSymbols.length; i++) {
                floatingSymbols[i].remove();
            }
        }
    }
    
    function ensureProperCentering() {
        // Force transforms off html and body elements
        document.documentElement.style.setProperty('transform', 'none', 'important');
        document.body.style.setProperty('transform', 'none', 'important');
        
        // Ensure the preloader is properly centered
        const preloader = document.querySelector('.pre-loader');
        if (preloader) {
            preloader.style.setProperty('position', 'fixed', 'important');
            preloader.style.setProperty('inset', '0', 'important');
            preloader.style.setProperty('display', 'flex', 'important');
            preloader.style.setProperty('justify-content', 'center', 'important');
            preloader.style.setProperty('align-items', 'center', 'important');
            preloader.style.setProperty('z-index', '9999', 'important');
        }
        
        // Ensure mid-loader-image is centered
        const midLoader = document.querySelector('.mid-loader-image');
        if (midLoader) {
            midLoader.style.setProperty('display', 'flex', 'important');
            midLoader.style.setProperty('flex-direction', 'column', 'important');
            midLoader.style.setProperty('justify-content', 'center', 'important');
            midLoader.style.setProperty('align-items', 'center', 'important');
        }
    }
    
    function monitorDynamicChanges() {
        // Monitor for dynamic element creation and apply fixes
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check for duplicate elements
                            if (node.id && ['matrix-rain-safe', 'cyber-grid', 'static-noise'].includes(node.id)) {
                                const existing = document.querySelector(`#${node.id}:not([data-processed])`);
                                if (existing) {
                                    console.log(`🚫 Preventing duplicate ${node.id}`);
                                    node.remove();
                                    return;
                                }
                                node.dataset.processed = 'true';
                            }
                            
                            // Ensure any new centering-critical elements are properly styled
                            if (node.classList?.contains('matrix-messages') || 
                                node.classList?.contains('text-3886') ||
                                node.classList?.contains('enter-button-wrapper')) {
                                restoreMissingElements();
                            }
                        }
                    });
                }
                
                // Monitor for style changes on critical ancestors
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const target = mutation.target;
                    if (target === document.documentElement || target === document.body) {
                        const computed = getComputedStyle(target);
                        if (computed.transform && computed.transform !== 'none') {
                            console.log('🛡️ Preventing transform on', target.tagName);
                            target.style.setProperty('transform', 'none', 'important');
                        }
                    }
                }
            });
        });
        
        // Start observing
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style']
        });
        
        // Also monitor html element
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['style']
        });
    }
    
    // Apply fixes when DOM is ready
    domReady(applyEmergencyFixes);
    
    // Also apply fixes after a short delay to catch any late-loading elements
    setTimeout(applyEmergencyFixes, 1000);
    setTimeout(applyEmergencyFixes, 3000);
    
    // Expose for manual triggering
    window.applyEmergencyFixes = applyEmergencyFixes;
    
})();