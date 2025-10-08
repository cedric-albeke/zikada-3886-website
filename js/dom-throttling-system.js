// DOM Throttling System
// Prevents element creation when DOM node count approaches critical thresholds

class DOMThrottlingSystem {
    constructor() {
        this.THROTTLE_THRESHOLD = 38000;    // Start throttling at 38k nodes
        this.CRITICAL_THRESHOLD = 45000;    // Hard block at 45k nodes
        this.WARNING_THRESHOLD = 35000;     // Warning at 35k nodes
        
        this.throttleLevel = 0; // 0 = no throttle, 1 = light, 2 = aggressive, 3 = blocked
        this.lastNodeCount = 0;
        this.lastCheckTime = 0;
        this.checkInterval = 2000; // Check every 2 seconds
        
        this.blockedCount = 0;
        this.throttledCount = 0;
        this.totalChecks = 0;
        
        console.log('🚦 DOM Throttling System initialized');
        
        // Start monitoring
        this.startMonitoring();
        
        // Override common element creation methods
        this.interceptElementCreation();
    }
    
    startMonitoring() {
        setInterval(() => {
            this.checkDOMHealth();
        }, this.checkInterval);
    }
    
    checkDOMHealth() {
        const nodeCount = document.querySelectorAll('*').length;
        const now = Date.now();
        
        this.lastNodeCount = nodeCount;
        this.lastCheckTime = now;
        this.totalChecks++;
        
        // Update throttle level based on node count
        if (nodeCount >= this.CRITICAL_THRESHOLD) {
            if (this.throttleLevel !== 3) {
                console.error(`🔴 DOM CRITICAL: ${nodeCount} nodes - BLOCKING all element creation`);
                this.throttleLevel = 3;
            }
        } else if (nodeCount >= this.THROTTLE_THRESHOLD) {
            if (this.throttleLevel !== 2) {
                console.warn(`🟠 DOM HIGH: ${nodeCount} nodes - AGGRESSIVE throttling`);
                this.throttleLevel = 2;
            }
        } else if (nodeCount >= this.WARNING_THRESHOLD) {
            if (this.throttleLevel !== 1) {
                console.log(`🟡 DOM WARNING: ${nodeCount} nodes - Light throttling`);
                this.throttleLevel = 1;
            }
        } else {
            if (this.throttleLevel !== 0) {
                console.log(`🟢 DOM NORMAL: ${nodeCount} nodes - Throttling cleared`);
                this.throttleLevel = 0;
            }
        }
    }
    
    shouldAllowCreation(reason = 'unknown') {
        const nodeCount = this.getCurrentNodeCount();
        
        switch (this.throttleLevel) {
            case 3: // Critical - block all
                this.blockedCount++;
                console.log(`🚫 BLOCKED: ${reason} (${nodeCount} nodes)`);
                return false;
                
            case 2: // Aggressive throttling - only 10% pass
                if (Math.random() > 0.1) {
                    this.throttledCount++;
                    console.log(`⏸️ THROTTLED: ${reason} (${nodeCount} nodes)`);
                    return false;
                }
                break;
                
            case 1: // Light throttling - only 60% pass
                if (Math.random() > 0.6) {
                    this.throttledCount++;
                    return false;
                }
                break;
                
            case 0: // Normal - allow all
            default:
                return true;
        }
        
        return true;
    }
    
    getCurrentNodeCount() {
        return document.querySelectorAll('*').length;
    }
    
    interceptElementCreation() {
        // Store original methods
        const originalCreateElement = document.createElement.bind(document);
        const originalCreateElementNS = document.createElementNS.bind(document);
        
        // Override document.createElement
        document.createElement = (tagName, options) => {
            if (!this.shouldAllowCreation(`createElement(${tagName})`)) {
                // Return a mock element that does nothing but doesn't break code
                return this.createMockElement(tagName);
            }
            return originalCreateElement(tagName, options);
        };
        
        // Override document.createElementNS
        document.createElementNS = (namespace, qualifiedName, options) => {
            if (!this.shouldAllowCreation(`createElementNS(${qualifiedName})`)) {
                return this.createMockElement(qualifiedName, true);
            }
            return originalCreateElementNS(namespace, qualifiedName, options);
        };
        
        // Store references for cleanup
        this.originalCreateElement = originalCreateElement;
        this.originalCreateElementNS = originalCreateElementNS;
    }
    
    createMockElement(tagName, isNS = false) {
        // Create a lightweight mock that satisfies basic element interface
        const mock = {
            tagName: tagName.toUpperCase(),
            nodeName: tagName.toUpperCase(),
            nodeType: 1,
            style: {},
            className: '',
            classList: {
                add: () => {},
                remove: () => {},
                contains: () => false,
                toggle: () => {}
            },
            setAttribute: () => {},
            getAttribute: () => null,
            removeAttribute: () => {},
            appendChild: () => mock,
            removeChild: () => mock,
            remove: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => {},
            querySelector: () => null,
            querySelectorAll: () => [],
            textContent: '',
            innerHTML: '',
            outerHTML: '',
            parentNode: null,
            children: [],
            childNodes: [],
            firstChild: null,
            lastChild: null,
            getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0, right: 0, bottom: 0 }),
            // Mark as mock for debugging
            __MOCK_ELEMENT__: true,
            __BLOCKED_REASON__: `DOM throttling (${this.getCurrentNodeCount()} nodes)`
        };
        
        // Add proxy to catch property access
        return new Proxy(mock, {
            set(target, prop, value) {
                target[prop] = value;
                return true;
            },
            get(target, prop) {
                if (prop in target) {
                    return target[prop];
                }
                // Return safe defaults for unknown properties
                if (typeof prop === 'string' && prop.startsWith('on')) {
                    return null; // Event handlers
                }
                return undefined;
            }
        });
    }
    
    // Provide safe createElement bypass for critical elements
    createElementUnchecked(tagName, options) {
        return this.originalCreateElement(tagName, options);
    }
    
    createElementNSUnchecked(namespace, qualifiedName, options) {
        return this.originalCreateElementNS(namespace, qualifiedName, options);
    }
    
    // Temporarily disable throttling
    disableThrottling(duration = 5000) {
        const originalLevel = this.throttleLevel;
        this.throttleLevel = 0;
        
        console.log(`⏸️ DOM throttling disabled for ${duration}ms`);
        
        setTimeout(() => {
            this.throttleLevel = originalLevel;
            console.log(`▶️ DOM throttling re-enabled at level ${originalLevel}`);
        }, duration);
    }
    
    getStats() {
        return {
            currentNodeCount: this.getCurrentNodeCount(),
            throttleLevel: this.throttleLevel,
            blockedCount: this.blockedCount,
            throttledCount: this.throttledCount,
            totalChecks: this.totalChecks,
            thresholds: {
                warning: this.WARNING_THRESHOLD,
                throttle: this.THROTTLE_THRESHOLD,
                critical: this.CRITICAL_THRESHOLD
            },
            lastCheck: new Date(this.lastCheckTime).toLocaleTimeString()
        };
    }
    
    forceCheck() {
        this.checkDOMHealth();
        return this.getStats();
    }
    
    destroy() {
        // Restore original methods
        document.createElement = this.originalCreateElement;
        document.createElementNS = this.originalCreateElementNS;
        console.log('🗑️ DOM Throttling System destroyed');
    }
}

// Create and expose global instance
const domThrottlingSystem = new DOMThrottlingSystem();

// Export for module usage and expose globally
window.domThrottlingSystem = domThrottlingSystem;
export default domThrottlingSystem;