// DEBUG CONSOLE COMMANDS
// Helper commands to test animation systems from browser console

import beehiveLogoBlend from './beehive-logo-blend.js';
import centerpieceLogo from './centerpiece-logo.js';
import logoAnimator from './logo-animator.js';

// Make them globally accessible for debugging
window.zikadaDebug = {
    // Beehive controls
    beehive: {
        show: () => {
            console.log('🐝 Manually triggering beehive logo blend...');
            beehiveLogoBlend.show();
        },
        hide: () => {
            console.log('🐝 Hiding beehive logo blend...');
            beehiveLogoBlend.hide();
        },
        trigger: () => {
            console.log('🐝 Toggling beehive logo blend...');
            beehiveLogoBlend.trigger();
        },
        status: () => {
            console.log('🐝 Beehive Logo Blend Status:');
            console.log('  - Initialized:', beehiveLogoBlend.isInitialized);
            console.log('  - Active:', beehiveLogoBlend.isActive);
            console.log('  - Logo element:', beehiveLogoBlend.logo);
            console.log('  - Video element:', beehiveLogoBlend.videoElement);
            console.log('  - Container:', beehiveLogoBlend.container);
            if (beehiveLogoBlend.videoElement) {
                console.log('  - Video src:', beehiveLogoBlend.videoElement.src);
                console.log('  - Video readyState:', beehiveLogoBlend.videoElement.readyState);
                console.log('  - Video paused:', beehiveLogoBlend.videoElement.paused);
            }
            if (beehiveLogoBlend.logoPosition) {
                console.log('  - Logo position:', beehiveLogoBlend.logoPosition);
            }
        }
    },

    // Centerpiece logo controls
    centerpiece: {
        play: (animationName) => {
            console.log(`🎯 Playing centerpiece animation: ${animationName}`);
            centerpieceLogo.play(animationName);
        },
        triggerRandom: () => {
            console.log('🎯 Triggering random centerpiece animation...');
            centerpieceLogo.triggerRandomAnimation();
        },
        setSpeed: (speed) => {
            console.log(`🎯 Setting animation speed to: ${speed}`);
            centerpieceLogo.setSpeed(speed);
        },
        listAnimations: () => {
            console.log('🎯 Available centerpiece animations:');
            Object.keys(centerpieceLogo.animations).forEach(name => {
                console.log(`  - ${name}`);
            });
        },
        status: () => {
            console.log('🎯 Centerpiece Status:');
            console.log('  - Initialized:', centerpieceLogo.isInitialized);
            console.log('  - Is Animating:', centerpieceLogo.isAnimating);
            console.log('  - Logo element:', centerpieceLogo.logo);
            console.log('  - Current animation:', centerpieceLogo.currentAnimation);
        }
    },

    // Logo animator controls
    logoAnimator: {
        triggerSpecial: () => {
            console.log('✨ Triggering special logo animation...');
            logoAnimator.triggerSpecialAnimation();
        },
        glitch: () => {
            console.log('✨ Triggering logo glitch...');
            logoAnimator.glitchReaction();
        },
        matrix: () => {
            console.log('✨ Triggering logo matrix reaction...');
            logoAnimator.matrixReaction();
        },
        techno: () => {
            console.log('✨ Triggering logo techno reaction...');
            logoAnimator.technoReaction();
        },
        status: () => {
            console.log('✨ Logo Animator Status:');
            console.log('  - Initialized:', logoAnimator.isInitialized);
            console.log('  - Logo element:', logoAnimator.logo);
            console.log('  - Logo wrapper:', logoAnimator.logoWrapper);
            console.log('  - Glow element:', logoAnimator.glowElement);
        }
    },

    // Test all systems
    testAll: () => {
        console.log('🚀 Testing all animation systems...');
        console.log('=====================================');

        // Test beehive
        console.log('\n📦 BEEHIVE SYSTEM:');
        window.zikadaDebug.beehive.status();

        // Test centerpiece
        console.log('\n📦 CENTERPIECE SYSTEM:');
        window.zikadaDebug.centerpiece.status();

        // Test logo animator
        console.log('\n📦 LOGO ANIMATOR SYSTEM:');
        window.zikadaDebug.logoAnimator.status();

        console.log('\n=====================================');
        console.log('✅ Test complete! Use individual commands to trigger animations.');
        console.log('Example commands:');
        console.log('  zikadaDebug.beehive.show()');
        console.log('  zikadaDebug.centerpiece.play("bounceIn")');
        console.log('  zikadaDebug.centerpiece.triggerRandom()');
    },

    // Force reinitialize everything
    reinit: () => {
        console.log('🔄 Reinitializing all systems...');

        // Destroy existing instances
        if (beehiveLogoBlend.isInitialized) {
            beehiveLogoBlend.destroy();
        }
        if (centerpieceLogo.isInitialized) {
            centerpieceLogo.destroy();
        }
        if (logoAnimator.isInitialized) {
            logoAnimator.destroy();
        }

        // Reinitialize
        setTimeout(() => {
            beehiveLogoBlend.init();
            centerpieceLogo.init();
            logoAnimator.init();
            console.log('✅ All systems reinitialized!');
        }, 100);
    }
};

// Auto-expose on init
console.log(`
🎮 ZIKADA Debug Console Loaded!
================================
Available commands:

🐝 Beehive:
  zikadaDebug.beehive.show()     - Show beehive effect
  zikadaDebug.beehive.hide()     - Hide beehive effect
  zikadaDebug.beehive.status()   - Check beehive status

🎯 Centerpiece:
  zikadaDebug.centerpiece.play(name)        - Play specific animation
  zikadaDebug.centerpiece.triggerRandom()   - Random animation
  zikadaDebug.centerpiece.listAnimations()  - List all animations
  zikadaDebug.centerpiece.status()          - Check status

✨ Logo Animator:
  zikadaDebug.logoAnimator.triggerSpecial() - Special animation
  zikadaDebug.logoAnimator.status()         - Check status

🚀 Testing:
  zikadaDebug.testAll()   - Test all systems
  zikadaDebug.reinit()    - Reinitialize everything

Type any command to test the animations!
`);

export default window.zikadaDebug;