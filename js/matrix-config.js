// MATRIX GLITCH TEXT CONFIGURATION
// Easy customization of all matrix/glitch text messages throughout the site

export const matrixConfig = {
    // Main matrix messages that appear with blackout effect
    // These cycle through periodically with scramble animation
    matrixMessages: [
        'WELC0ME, NPC',
        'Y0U ARE 1N A S1MULAT10N',
        'REAL1TY 1S C0RRUPTED',
        'C0NNECT1NG T0 THE GR1D',
        'D1G1TAL C0NSC10USNESS',
        'BREAK1NG THE 4TH WALL',
        'QUANTUM ENTANGLEMENT',
        'N0 ESCAPE FR0M THE MATR1X',
        '3886 1S WATCH1NG',
        'Z1KADA L1VES',
        'ENCRYPT10N FA1LED',
        'ACCESS DEN1ED',
        'WAKE UP NE0',
        'THE S1GNAL 1S STR0NG',
        'Y0U ARE BE1NG WATCHED',
        'THE C1CADA SPEAKS'
    ],

    // Terminal-style system messages (appears bottom-left)
    terminalMessages: [
        'INITIALIZING...',
        'LOADING SYSTEM...',
        'MEMORY CHECK: OK',
        'CPU: 100%',
        'ESTABLISHING CONNECTION...',
        'ACCESS GRANTED'
    ],

    // Startup sequence messages (chaos initialization)
    startupMessages: [
        'INITIALIZING NEURAL MATRIX...',
        'LOADING CHAOS PROTOCOLS...',
        'SYNCHRONIZING QUANTUM FLUX...',
        'CALIBRATING REALITY DISTORTION...',
        'ENGAGING TECHNO OVERDRIVE...',
        'SYSTEM READY'
    ],

    // Characters used for scramble effect
    scrambleCharacters: '!<>-_\\/[]{}—=+*^?#1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ',

    // Timing settings (milliseconds)
    timing: {
        messageIntervalMin: 37500,    // Minimum time between messages (37.5 seconds)
        messageIntervalMax: 62500,    // Maximum time between messages (62.5 seconds)
        messageDuration: 4000,        // How long each message stays visible
        scrambleDuration: 1000,       // How long the scramble animation takes
        blackoutDuration: 200,        // How quickly the blackout fades in/out
        terminalDelay: 500           // Delay between terminal messages
    },

    // Visual settings
    visual: {
        matrixColor: '#00ffa3',      // Main matrix text color
        matrixGlow: '#00ff85',       // Glow effect color
        terminalColor: '#00ff00',    // Terminal text color
        fontSize: {
            matrix: '1.4rem',        // Matrix message font size
            terminal: '14px',        // Terminal font size
            startup: '12px'          // Startup sequence font size
        }
    },

    // Add your custom messages here:
    customMessages: {
        // Example custom message sets - uncomment and modify as needed

        // darkMode: [
        //     'DARKNESS RISES',
        //     'VOID PROTOCOL ACTIVE',
        //     'SHADOW MODE ENGAGED'
        // ],

        // partyMode: [
        //     'PARTY TIME',
        //     'MAXIMUM OVERDRIVE',
        //     'BASS DROPS IN 3...2...1'
        // ],

        // Add your own categories here...
    }
};

// Helper function to get random message from a category
export function getRandomMessage(category = 'matrixMessages') {
    const messages = matrixConfig[category] || matrixConfig.matrixMessages;
    return messages[Math.floor(Math.random() * messages.length)];
}

// Helper function to add custom messages
export function addCustomMessages(category, messages) {
    if (!matrixConfig.customMessages[category]) {
        matrixConfig.customMessages[category] = [];
    }
    matrixConfig.customMessages[category].push(...messages);
}

// Export for use in other modules
export default matrixConfig;