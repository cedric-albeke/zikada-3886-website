# ZIKADA 3886 Records - Autonomous Animation Display

An autonomous, endless animation display for ZIKADA 3886 Records events. This system runs continuously without user interaction, creating a dynamic visual experience for Psy & Techno events.

## Overview

This project transforms a Webflow-exported website into a self-running animation display featuring:
- Continuous 3D particle animations
- Dynamic logo animations with reactive effects
- Randomized animation phases with smooth transitions
- Matrix-style text effects
- Glitch and cyberpunk aesthetics
- Self-healing animation system ensuring endless runtime

## Features

### Core Animation Systems

1. **Chaos Engine** (`js/chaos-engine.js`)
   - Three.js-based 3D particle system
   - Dynamic geometric shapes with wireframe rendering
   - Animated point lights with color variations
   - Post-processing effects (bloom, glitch, chromatic aberration)
   - Continuous particle wave effects

2. **Logo Animator** (`js/logo-animator.js`)
   - Breathing animation effects
   - Reactive animations to global events
   - Glow effects with dynamic sizing
   - Aggressive opacity protection (never drops below 100%)
   - Special triggered animations (spiral, energy burst, etc.)

3. **Random Animations** (`js/random-animations.js`)
   - 15+ unique animation effects
   - Self-healing capability
   - Effects include: data glitch waves, neon pulses, warp tunnels, digital corruption
   - Automatic restart if animations stop

4. **Extended Animations** (`js/extended-animations.js`)
   - VHS scanline glitches
   - Data corruption effects
   - Neon city lights
   - Matrix rain variations
   - Analog TV distortion
   - Holographic interference

5. **Matrix Messages** (`js/matrix-messages.js`)
   - Random cyberpunk-themed messages
   - Terminal-style text animations
   - Synchronized with main animation phases

### Animation Phases

The system cycles through multiple themed phases:
- **Intense**: High energy animations
- **Calm**: Smooth, flowing effects
- **Glitch**: Digital distortion effects
- **Techno**: Beat-synchronized strobes
- **Vaporwave**: Retro aesthetic with pink/purple themes
- **Cyberpunk**: Neon green terminal effects
- **Neon**: Bright, colorful light effects
- **Aurora**: Smooth gradient transitions

### Self-Healing System

- **Watchdog Timer**: Checks every 10 seconds to ensure all animations are running
- **Auto-Restart**: Each animation module can restart itself if stopped
- **Opacity Protection**: Logo opacity is continuously monitored and corrected
- **Endless Loop**: Guaranteed continuous operation for events

## Technical Stack

- **Vite**: Build tool and dev server (configured on port 3886)
- **GSAP**: Animation library for all tweening and timelines
- **Three.js**: 3D graphics and particle systems
- **Simplex Noise**: For organic animation patterns

## Installation

```bash
# Install dependencies
npm install

# Run development server (port 3886)
npm run dev

# Build for production
npm run build
```

## Configuration

The animation system is configured to:
- Run endlessly without user interaction
- Auto-recover from any animation failures
- Maintain visual consistency (no white flashing, no opacity drops)
- Cycle through phases automatically

## Project Structure

```
3886-website/
├── js/
│   ├── chaos-init.js         # Main orchestrator
│   ├── chaos-engine.js       # 3D particle system
│   ├── logo-animator.js      # Logo animations
│   ├── random-animations.js  # Random effect pool
│   ├── extended-animations.js # Additional effects
│   ├── matrix-messages.js    # Text animations
│   └── 3886.js               # Entry point
├── styles/
│   └── styles.css            # Core styles
├── index.html                # Main HTML
├── package.json              # Dependencies
└── vite.config.js           # Vite configuration
```

## Performance

- Optimized for continuous runtime
- Efficient particle management
- GPU-accelerated animations via WebGL
- Automatic cleanup of completed animations
- Memory-conscious effect cycling

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (may require webkit prefixes)
- Mobile: Reduced particle count for performance

## Event Usage

Perfect for:
- Music festivals and raves
- Club installations
- Live streaming backgrounds
- Art installations
- Promotional displays

Simply open in a browser and let it run - no interaction needed!

## License

Property of ZIKADA 3886 Records

---

*Autonomous animation system for psychedelic and techno events*