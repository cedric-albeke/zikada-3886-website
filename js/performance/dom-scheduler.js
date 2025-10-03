/**
 * DOM Scheduler - Frame-aligned DOM Updates
 * 
 * Simplified DOM update scheduling to prevent layout thrashing
 * - Read/write phase separation
 * - Frame-aligned execution
 * - Layout thrashing prevention
 */

export class DOMScheduler {
    constructor() {
        this.readOperations = [];
        this.writeOperations = [];
        this.scheduledFrame = null;
        
        this.enabled = true;
        this.metrics = {
            readOperations: 0,
            writeOperations: 0,
            frames: 0
        };
        
        console.log('✅ DOM Scheduler initialized');
    }
    
    /**
     * Schedule DOM read operation
     * @param {function} readFn - Function that reads DOM properties
     * @returns {Promise} Promise that resolves with read result
     */
    scheduleRead(readFn) {
        if (!this.enabled) {
            return Promise.resolve(readFn());
        }
        
        return new Promise((resolve) => {
            this.readOperations.push(() => {
                try {
                    const result = readFn();
                    resolve(result);
                } catch (error) {
                    console.error('DOM read error:', error);
                    resolve(null);
                }
            });
            
            this.scheduleFrame();
        });
    }
    
    /**
     * Schedule DOM write operation
     * @param {function} writeFn - Function that writes DOM properties
     * @returns {Promise} Promise that resolves when write completes
     */
    scheduleWrite(writeFn) {
        if (!this.enabled) {
            writeFn();
            return Promise.resolve();
        }
        
        return new Promise((resolve) => {
            this.writeOperations.push(() => {
                try {
                    writeFn();
                    resolve();
                } catch (error) {
                    console.error('DOM write error:', error);
                    resolve();
                }
            });
            
            this.scheduleFrame();
        });
    }
    
    /**
     * Schedule frame processing
     */
    scheduleFrame() {
        if (this.scheduledFrame) return;
        
        this.scheduledFrame = requestAnimationFrame(() => {
            this.processFrame();
        });
    }
    
    /**
     * Process batched DOM operations
     */
    processFrame() {
        this.scheduledFrame = null;
        
        // Process all reads first (measure phase)
        while (this.readOperations.length > 0) {
            const readOp = this.readOperations.shift();
            readOp();
            this.metrics.readOperations++;
        }
        
        // Then process all writes (mutate phase)
        while (this.writeOperations.length > 0) {
            const writeOp = this.writeOperations.shift();
            writeOp();
            this.metrics.writeOperations++;
        }
        
        this.metrics.frames++;
    }
    
    /**
     * Get metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    
    /**
     * Enable/disable scheduler
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    
    /**
     * Destroy and cleanup
     */
    destroy() {
        this.enabled = false;
        
        if (this.scheduledFrame) {
            cancelAnimationFrame(this.scheduledFrame);
        }
        
        this.readOperations = [];
        this.writeOperations = [];
        
        console.log('🧹 DOM Scheduler destroyed');
    }
}

export const domScheduler = new DOMScheduler();