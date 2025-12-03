/**
 * b-breadcrumbs Web Component
 * Manages breadcrumb navigation with scroll position tracking and cookie storage
 */

class BBreadcrumbs extends HTMLElement {
    constructor() {
        super();
        this.breadcrumbs = []; // Array of {path, title, scrollY}
        this.cookieName = 'breadcrumbs';
        this.maxBreadcrumbs = 20; // Internal storage limit
        this.displayLimit = 10; // Number of breadcrumbs to display
    }

    connectedCallback() {
        // Load breadcrumbs from cookie
        this.loadFromCookie();
        
        // Render initial state
        this.render();
    }

    /**
     * Add a new breadcrumb
     * @param {string} path - The path for this breadcrumb
     * @param {string} title - The display title
     * @param {number} scrollY - The scroll position (saved before navigation)
     */
    add(path, title, scrollY = 0) {
        // Normalize path for comparison
        const normalizedPath = this.normalizePath(path);
        
        // Remove existing breadcrumb with same path
        this.breadcrumbs = this.breadcrumbs.filter(b => 
            this.normalizePath(b.path) !== normalizedPath
        );
        
        // Add new breadcrumb at the beginning
        this.breadcrumbs.unshift({
            path: normalizedPath,
            title,
            scrollY
        });
        
        // Limit number of breadcrumbs
        if (this.breadcrumbs.length > this.maxBreadcrumbs) {
            this.breadcrumbs = this.breadcrumbs.slice(0, this.maxBreadcrumbs);
        }
        
        // Save to cookie and render
        this.saveToCookie();
        this.render();
    }

    /**
     * Get scroll position for a path
     * @param {string} path - The path to look up
     * @returns {number} The scroll position, or 0 if not found
     */
    getScrollPosition(path) {
        const normalizedPath = this.normalizePath(path);
        const breadcrumb = this.breadcrumbs.find(b => 
            this.normalizePath(b.path) === normalizedPath
        );
        return breadcrumb ? breadcrumb.scrollY : 0;
    }

    /**
     * Navigate to a path and restore scroll position (used by all navigation: links, breadcrumbs, back button)
     * @param {string} path - The path to navigate to
     */
    async navigateToPath(path) {
        const normalizedPath = this.normalizePath(path);
        
        // Save current scroll position before navigation
        const hash = window.location.hash;
        const currentPath = hash.startsWith('#!') ? hash.substring(2) : 'Resume';
        const currentScrollY = window.Router ? window.Router.getScrollPosition() : 0;
        const currentBreadcrumb = this.breadcrumbs.find(b => 
            this.normalizePath(b.path) === this.normalizePath(currentPath)
        );
        if (currentBreadcrumb) {
            currentBreadcrumb.scrollY = currentScrollY;
            this.saveToCookie();
        }
        
        // Find or create the target breadcrumb
        let breadcrumb = this.breadcrumbs.find(b => 
            this.normalizePath(b.path) === normalizedPath
        );
        
        if (!breadcrumb) {
            // Create breadcrumb for new page (will be at top of list)
            const title = this.generateTitle(normalizedPath);
            this.add(normalizedPath, title, 0); // New pages start at scroll position 0
            breadcrumb = this.breadcrumbs[0]; // It's now at the top
        } else {
            // Move existing breadcrumb to the top
            this.breadcrumbs.splice(this.breadcrumbs.indexOf(breadcrumb), 1);
            this.breadcrumbs.unshift(breadcrumb);
            this.saveToCookie();
            this.render();
        }
        
        // Load the content
        const scrollY = breadcrumb.scrollY;
        const shouldScroll = scrollY === 0; // Only scroll to top if it's a new page (scrollY = 0)
        await window.Router.loadContentFromPath(breadcrumb.path, shouldScroll);
        
        // If we have a saved scroll position, restore it after content loads
        if (scrollY > 0) {
            // Wait for layout to complete
            await new Promise(resolve => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        resolve();
                    });
                });
            });
            window.Router.setScrollPosition(scrollY);
            // Update breadcrumb with restored scroll position (loadContent may have set it to 0)
            // Find breadcrumb again since loadContent may have recreated it
            const updatedBreadcrumb = this.breadcrumbs.find(b => 
                this.normalizePath(b.path) === normalizedPath
            );
            if (updatedBreadcrumb) {
                updatedBreadcrumb.scrollY = scrollY;
                this.saveToCookie();
            }
        }
    }

    /**
     * Normalize a path for comparison
     */
    normalizePath(path) {
        if (path.startsWith('#!')) {
            path = path.substring(2);
        } else if (path.startsWith('/')) {
            path = path.substring(1);
        } else if (path.startsWith('#')) {
            path = path.substring(1);
        }
        return path.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/') || 'Resume'; // Path stays as 'Resume' to match filename
    }

    /**
     * Generate title from path
     */
    generateTitle(path) {
        // First, restore slashes from -slash- encoding
        let title = path.replace(/-slash-/g, '/');
        
        // Special case: History -> Timeline
        if (title.toLowerCase() === 'history') {
            return 'Timeline';
        }
        
        // Handle paths with slashes (e.g., "projects/something" -> "Projects: Something")
        if (title.includes('/')) {
            const parts = title.split('/');
            // Capitalize first letter of each part
            const formattedParts = parts.map((part, index) => {
                if (part.length === 0) return part;
                // Replace hyphens with spaces and capitalize
                const words = part.replace(/-/g, ' ').split(' ');
                const capitalized = words.map(word => 
                    word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word
                ).join(' ');
                return capitalized;
            });
            // Join with ": " for first two parts, " / " for subsequent parts
            if (formattedParts.length === 2) {
                title = `${formattedParts[0]}: ${formattedParts[1]}`;
            } else {
                title = formattedParts.join(' / ');
            }
        } else {
            // Replace hyphens with spaces and capitalize first letter
            title = title.replace(/-/g, ' ');
            if (title.length > 0) {
                title = title.charAt(0).toUpperCase() + title.slice(1);
            }
        }
        
        return title;
    }

    /**
     * Render the breadcrumbs
     */
    render() {
        const ul = this.querySelector('ul');
        if (!ul) return;
        
        ul.innerHTML = '';
        
        // Only display the first displayLimit breadcrumbs
        const breadcrumbsToDisplay = this.breadcrumbs.slice(0, this.displayLimit);
        
        breadcrumbsToDisplay.forEach((breadcrumb, index) => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#!${breadcrumb.path}`;
            
            // Determine icon based on path
            let icon = '';
            const path = breadcrumb.path.toLowerCase();
            if (path.startsWith('projects/')) {
                icon = '<i class="fa-solid fa-rocket" aria-hidden="true"></i> ';
            } else if (path.startsWith('skillsets/')) {
                icon = '<i class="fa-solid fa-layer-group" aria-hidden="true"></i> ';
            } else if (path.startsWith('skills/')) {
                icon = '<i class="fa-solid fa-wrench" aria-hidden="true"></i> ';
            } else if (path.startsWith('timeline-events/')) {
                icon = '<i class="fa-solid fa-clock" aria-hidden="true"></i> ';
            } else if (path.startsWith('subdomains/')) {
                icon = '<i class="fa-solid fa-sitemap" aria-hidden="true"></i> ';
            } else if (path === 'resume') {
                icon = '<i class="fa-solid fa-file-lines" aria-hidden="true"></i> ';
            } else if (path === 'projects') {
                icon = '<i class="fa-solid fa-folder-open" aria-hidden="true"></i> ';
            } else if (path === 'history') {
                icon = '<i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i> ';
            } else if (path === 'skillsets') {
                icon = '<i class="fa-solid fa-tags" aria-hidden="true"></i> ';
            } else if (path === 'about-me') {
                icon = '<i class="fa-solid fa-user" aria-hidden="true"></i> ';
            } else if (path === 'my-stance-on-ai') {
                icon = '<i class="fa-solid fa-robot" aria-hidden="true"></i> ';
            } else if (path === 'contact') {
                icon = '<i class="fa-solid fa-envelope" aria-hidden="true"></i> ';
            }
            
            a.innerHTML = icon + breadcrumb.title;
            a.setAttribute('tabindex', '-1');
            a.setAttribute('aria-hidden', 'true');
            
            // Mark first breadcrumb as active
            if (index === 0) {
                a.classList.add('active');
            }
            
            // Add click handler
            a.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.navigateToPath(breadcrumb.path);
            });
            
            li.appendChild(a);
            ul.appendChild(li);
        });
    }

    /**
     * Save breadcrumbs to cookie
     */
    saveToCookie() {
        try {
            const data = JSON.stringify(this.breadcrumbs);
            const expires = new Date();
            expires.setTime(expires.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year
            document.cookie = `${this.cookieName}=${encodeURIComponent(data)};expires=${expires.toUTCString()};path=/`;
        } catch (e) {
            console.warn('Failed to save breadcrumbs to cookie:', e);
        }
    }

    /**
     * Load breadcrumbs from cookie
     */
    loadFromCookie() {
        try {
            const cookies = document.cookie.split(';');
            const cookie = cookies.find(c => c.trim().startsWith(`${this.cookieName}=`));
            
            if (cookie) {
                const data = decodeURIComponent(cookie.split('=')[1]);
                this.breadcrumbs = JSON.parse(data) || [];
                
                // Validate breadcrumbs structure
                this.breadcrumbs = this.breadcrumbs.filter(b => 
                    b && typeof b.path === 'string' && typeof b.title === 'string'
                );
            }
        } catch (e) {
            console.warn('Failed to load breadcrumbs from cookie:', e);
            this.breadcrumbs = [];
        }
    }
}

customElements.define('b-breadcrumbs', BBreadcrumbs);

