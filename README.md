# brall.dev

Portfolio website for Will Brall.

## Structure

All public-facing files are located in the `public/` folder.

### Core Files
- `public/index.html` - Main HTML structure with semantic markup
- `public/css/core.css` - Core CSS with layout and base styles
- `public/js/loader.js` - Auto-loads web components, handles routing, and manages flavors

### Components
- `public/components/` - Custom web components:
  - `base/b-json-loader.js` - Base class for components that load JSON data
  - `b-3d-scene.js` - 3D scene rendering (uses Three.js, loads dynamically)
  - `b-breadcrumbs.js` - Navigation breadcrumbs
  - `b-date.js` - Dynamic date display
  - `b-flavor-selector.js` - Theme selector
  - `b-hamburger.js` - Mobile menu toggle
  - `b-layer.js` - Layered content component
  - `b-projects.js` - Project listings (extends BJsonLoader)
  - `b-skillsets.js` - Skillset display (extends BJsonLoader)
  - `b-skip-link.js` - Accessibility skip link
  - `b-subdomain-projects.js` - Subdomain project navigation (extends BJsonLoader)
  - `b-timeline.js` - Timeline visualization (extends BJsonLoader)
  - `b-xp.js` - Experience level indicator (optimized with caching)
  - `b-yt.js` - YouTube video embedding

Components are automatically discovered and loaded by the component loader system.

### Data
- `public/data/timeline-events.json` - Timeline events with domains, subdomains, projects, dates, skillsets, and skills
- `public/data/projects.json` - Project listings
- `public/data/skills.json` - Skills database
- `public/data/skillsets.json` - Skillset definitions

### Content Partials
- `public/partials/Resume.html` - Resume page
- `public/partials/Projects.html` - Projects listing
- `public/partials/History.html` - Timeline view
- `public/partials/About-Me.html` - About me page
- `public/partials/My-Stance-On-AI.html` - AI stance page
- `public/partials/Contact.html` - Contact page
- `public/partials/Skillsets.html` - Skillsets page

### Flavors (Themes)
The site features multiple visual themes that can be switched dynamically:
- `core.css` - Core styling (default)
- `millennial-great.css` - Grey, lots of furniture textures
- `wickedpedia.css` - Styled like a fancy Wikipedia
- `litrpg.css` - Styled like a D&D Character Sheet
- `offices-overseers.css` - Traditional corporate website
- `terminally-ill.css` - Pure CLI white on black monospace
- `vhscary.css` - VHS inspired lo-fi horror vibe

Each flavor has corresponding background and foreground HTML files in `public/partials/flavors/`.

### Assets
- `public/video/` - Optimized video files for flavor backgrounds/foregrounds
- `public/img/` - Image assets (texture maps, etc.)
  - Texture folders: `door/`, `logs/`, `marble/`, `mossy/`, `obsidian/`, `panel/`, `rockmoss/`, `stucco/`
  - Each texture folder contains: `albedo.jpg`, `normal.jpg`, `roughness.jpg`, and optionally `metallic.jpg`, `ao.jpg`, `height.jpg`
- `public/files/` - Downloadable files

## Features

- **Semantic HTML** with proper ARIA roles
- **Hashbang routing** (#!) for SEO-friendly URLs
- **Web Components** with auto-loading
- **Flavor system** for theme switching with smooth transitions
- **Background/Foreground system** for rich visual experiences
- **Responsive design** with mobile support
- **Accessibility** features including skip links and screen reader support
- **Dynamic content loading** from JSON data files

## Performance Optimizations

The site has been optimized for fast loading and smooth performance:

### Resource Loading
- **Font Awesome CSS** loads asynchronously to avoid render-blocking (preload + async injection)
- **Font display optimization** using `font-display: swap` for immediate text visibility
- **Three.js** loads dynamically only when 3D scenes are needed
- **Preconnect hints** for CDN resources (cdnjs.cloudflare.com)
- **Preload hints** for critical JSON data files needed on initial page load

### JavaScript Execution
- **Deferred component loading** - Critical components load immediately, non-critical load when idle
- **Router initialization** deferred using `requestIdleCallback` to reduce main-thread blocking
- **Component loading** optimized with throttled MutationObserver and batched processing
- **b-xp component** optimized with static lookup arrays and caching to reduce execution time

### Image Optimization
- **Texture images** for 3D scenes optimized (40.9% size reduction, ~17 MB saved)
- **Large images** compressed while maintaining visual quality
- **Texture maps** (albedo, normal, roughness, metallic, AO, height) optimized for web delivery

## Usage

Open `public/index.html` in a web browser. The site uses vanilla JavaScript and works as a static site - no build process required.
