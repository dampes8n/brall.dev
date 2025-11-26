/**
 * b-breadcrumbs Web Component
 * Manages breadcrumb navigation with scroll position tracking and cookie storage
 */

class BBreadcrumbs extends HTMLElement {
    constructor() {
        super();
        this.breadcrumbs = []; // Array of {path, title, scrollY}
        this.cookieName = 'breadcrumbs';
        this.maxBreadcrumbs = 20;
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
        return path.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/') || 'Resume';
    }

    /**
     * Generate title from path
     */
    generateTitle(path) {
        // Replace hyphens with spaces
        let title = path.replace(/-/g, ' ');
        
        // Handle paths with slashes (e.g., "projects/something" -> "Projects: Something")
        if (title.includes('/')) {
            const parts = title.split('/');
            // Capitalize first letter of each part
            const formattedParts = parts.map((part, index) => {
                if (part.length === 0) return part;
                return part.charAt(0).toUpperCase() + part.slice(1);
            });
            // Join with ": " for first two parts, " / " for subsequent parts
            if (formattedParts.length === 2) {
                title = `${formattedParts[0]}: ${formattedParts[1]}`;
            } else {
                title = formattedParts.join(' / ');
            }
        } else {
            // Capitalize first letter if no slashes
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
        
        this.breadcrumbs.forEach((breadcrumb, index) => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#!${breadcrumb.path}`;
            a.textContent = breadcrumb.title;
            a.setAttribute('tabindex', '-1');
            a.setAttribute('aria-hidden', 'true');
            
            // Mark first breadcrumb as active
            if (index === 0) {
                a.classList.add('active');
            }
            
            // Add click handler
            a.addEventListener('click', async (e) => {
                e.preventDefault();
                
                // Save current scroll position before navigation
                const hash = window.location.hash;
                const currentPath = hash.startsWith('#!') ? hash.substring(2) : 'Resume';
                const currentScrollY = window.scrollY;
                const currentBreadcrumb = this.breadcrumbs.find(b => 
                    this.normalizePath(b.path) === this.normalizePath(currentPath)
                );
                if (currentBreadcrumb) {
                    currentBreadcrumb.scrollY = currentScrollY;
                    this.saveToCookie();
                }
                
                // Move this breadcrumb to the top
                this.breadcrumbs.splice(this.breadcrumbs.indexOf(breadcrumb), 1);
                this.breadcrumbs.unshift(breadcrumb);
                this.saveToCookie();
                this.render();
                
                // Load the content and restore scroll position
                const scrollY = breadcrumb.scrollY;
                await window.Router.loadContentFromPath(breadcrumb.path, false);
                
                // Restore scroll position after content loads
                // Wait for layout to complete
                await new Promise(resolve => {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            resolve();
                        });
                    });
                });
                window.scrollTo(0, scrollY);
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

