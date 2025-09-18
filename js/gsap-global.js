// GSAP Global Exposer - Makes GSAP available globally
// This ensures GSAP is available for all modules and debugging

import gsap from 'gsap';

// Expose GSAP globally
if (typeof window !== 'undefined') {
    window.gsap = gsap;
    window.GSAP = gsap; // Alternative reference
    
    console.log('🎯 GSAP exposed globally:', {
        version: gsap.version,
        available: true
    });
}

export default gsap;