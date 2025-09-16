# ZIKADA 3886 Records Website

## Project Overview
This is a Webflow export of the ZIKADA 3886 Records website - a Psy & Techno music label website with an interactive, dark-themed design.

## Technology Stack
- **Frontend**: Static HTML/CSS/JavaScript (Webflow export)
- **CSS Framework**: Webflow Components + Custom CSS
- **Fonts**: Space Mono, Anta, Inconsolata (Google Fonts)
- **Audio Player**: True Audio Player plugin
- **Animation**: WebFont loader, custom JavaScript animations

## Project Structure
```
3886-website/
├── index.html          # Main HTML file
├── css/
│   ├── normalize.css   # CSS reset/normalization
│   ├── components.css  # Webflow component styles
│   └── 3886.css        # Custom project styles
├── js/
│   └── 3886.js         # Minified JavaScript (includes animations, interactions)
├── images/             # SVG graphics, logos, backgrounds
│   ├── bg-2.svg
│   ├── c01n.svg
│   ├── favicon.png
│   └── ...
└── fonts/              # Custom font files
    ├── SpaceMono-Bold.ttf
    ├── SpaceMono-Regular.ttf
    └── anta-regular.ttf
```

## Features
- Interactive pre-loader with animation
- Dark cyberpunk aesthetic
- Audio player integration
- Text scramble effects
- Responsive design
- Custom font loading

## Development Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Local Development Server
The site uses a simple HTTP server for local development. All assets are static files exported from Webflow.

### Running Locally
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# The site will be available at http://localhost:3000
```

## Key Components

### Pre-loader
- Located in index.html (lines 28-46)
- Features animated logo, coin/eye imagery
- "ENTER 3886" button to access main content

### Styling
- Dark theme with neon accents
- Custom animations and transitions
- Responsive breakpoints handled by Webflow CSS

### JavaScript Features
- Text scrambling effects
- Pre-loader animations
- Audio player functionality
- Webfont loading

## External Dependencies
- Google Fonts API
- WebFont loader (v1.6.26)
- True Audio Player plugin

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive
- Touch-enabled interactions

## Notes
- This is a Webflow export, so editing should be done carefully to maintain functionality
- The js/3886.js file is minified/bundled - contains all Webflow interactions
- Zone.Identifier files can be safely removed (Windows file origin markers)

## Deployment
The site can be deployed as static files to any web hosting service:
- Netlify
- Vercel
- GitHub Pages
- Any static file server

## Maintenance
- Keep external CDN links updated
- Test cross-browser compatibility after changes
- Preserve Webflow data attributes for animations to work correctly