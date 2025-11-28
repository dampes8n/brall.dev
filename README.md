# brall.dev

Portfolio website built according to Plan.md specifications.

## Structure

All public-facing files are located in the `public/` folder.

### Core Files
- `public/index.html` - Main HTML structure with semantic markup
- `public/css/core.css` - Core CSS with layout and base styles
- `public/js/loader.js` - Auto-loads web components from HTML
- `public/js/router.js` - Handles hashbang routing (#!)
- `public/js/flavor-switcher.js` - Manages CSS flavor themes

### Components
- `public/components/b-anchor.js` - Enhanced anchor component for internal navigation with hoverable menu

### Data
- `public/data/timeline-events.json` - Timeline events with domains, subdomains, projects, dates, skillsets, and skills
- `public/data/projects.json` - Project listings
- `public/data/skills.json` - Skills database

### Content Partials
- `public/partials/resume.html` - Resume page
- `public/partials/projects.html` - Projects listing
- `public/partials/timeline.html` - Timeline view
- `public/partials/about.html` - About me page
- `public/partials/ai-stance.html` - AI stance page
- `public/partials/contact.html` - Contact page

### Backgrounds & Foregrounds
- `public/partials/backgrounds/` - Background HTML files (images, videos, canvases)
- `public/partials/foregrounds/` - Foreground HTML files (slide-in elements)

### Flavors
- `public/css/flavors/applebutter.css` - Buttery smooth ultraminimalism (default)
- `public/css/flavors/millennial-great.css` - Grey, lots of furniture textures (to be created)
- `public/css/flavors/wickedpedia.css` - Styled like a fancy Wikipedia (to be created)
- `public/css/flavors/litrpg.css` - Styled like a D&D Character Sheet (to be created)
- `public/css/flavors/offices-overseers.css` - Traditional corporate website (to be created)
- `public/css/flavors/terminally-ill.css` - Pure CLI white on black monospace (to be created)
- `public/css/flavors/vhscary.css` - VHS inspired lo-fi horror vibe

## Features

- **Semantic HTML** with proper ARIA roles
- **Hashbang routing** (#!) for SEO-friendly URLs
- **Web Components** with auto-loading via Loader.js
- **Flavor system** for theme switching with smooth transitions
- **Background/Foreground system** for rich visual experiences
- **Responsive design** with mobile support
- **Accessibility** features including skip links and screen reader support

## Usage

**Important:** This site must be run through a web server due to CORS restrictions. Opening `index.html` directly via `file://` will not work.

### Running a Development Server

**Python:**
```bash
cd public
python -m http.server 8000
```

**PHP:**
```bash
cd public
php -S localhost:8000
```

**VS Code Live Server:**
Install the "Live Server" extension and right-click `public/index.html` → "Open with Live Server"

Then open `http://localhost:8000` in your browser.

The `public/` folder contains all public-facing assets and should be served as the web root.
