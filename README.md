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
  - `b-3d-scene.js` - 3D scene rendering
  - `b-breadcrumbs.js` - Navigation breadcrumbs
  - `b-date.js` - Dynamic date display
  - `b-flavor-selector.js` - Theme selector
  - `b-hamburger.js` - Mobile menu toggle
  - `b-layer.js` - Layered content component
  - `b-projects.js` - Project listings
  - `b-skillsets.js` - Skillset display
  - `b-skip-link.js` - Accessibility skip link
  - `b-subdomain-projects.js` - Subdomain project navigation
  - `b-timeline.js` - Timeline visualization
  - `b-yt.js` - YouTube video embedding

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

## Usage

Open `public/index.html` in a web browser. The site uses vanilla JavaScript and works as a static site - no build process required.
