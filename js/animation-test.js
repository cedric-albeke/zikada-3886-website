// Animation Test - Simple test to verify GSAP works
import gsap from 'gsap';

console.log('🧪 Testing basic GSAP functionality...');

// Test 1: Simple rotation
const testElement = document.createElement('div');
testElement.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    width: 10px;
    height: 10px;
    background: red;
    z-index: 9999;
`;
document.body.appendChild(testElement);

// Test basic GSAP animation
gsap.to(testElement, {
    rotation: 360,
    duration: 2,
    repeat: -1,
    ease: 'none'
});

console.log('🧪 Red dot test animation started - should rotate continuously');

// Test 2: Check if chaos-init elements exist
setTimeout(() => {
    const logoText = document.querySelector('.logo-text');
    const imageWrapper = document.querySelector('.image-wrapper');
    const bg = document.querySelector('.bg');
    
    console.log('🧪 Element check:', {
        logoText: !!logoText,
        imageWrapper: !!imageWrapper,
        bg: !!bg,
        logoTextStyle: logoText ? logoText.style.cssText : 'not found',
        imageWrapperStyle: imageWrapper ? imageWrapper.style.cssText : 'not found',
        bgStyle: bg ? bg.style.cssText : 'not found'
    });
    
    // Test manual animation on existing elements
    if (logoText) {
        console.log('🧪 Testing manual logo animation...');
        gsap.to(logoText, {
            scale: 1.05,
            duration: 1,
            yoyo: true,
            repeat: 3,
            ease: 'sine.inOut'
        });
    }
    
    if (bg) {
        console.log('🧪 Testing manual background rotation...');
        gsap.to(bg, {
            rotation: 45,
            duration: 3,
            ease: 'power2.inOut'
        });
    }
}, 3000);

export default {};