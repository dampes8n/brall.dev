/**
 * b-anchor component
 * Enhanced anchor tag for internal navigation with hoverable state
 * Loads backgrounds/foregrounds, main content, and updates history
 */

class BAnchor extends HTMLElement {
    constructor() {
        super();
        this.originalHref = null;
        this.isInternal = false;
    }

    connectedCallback() {
        this.originalHref = this.getAttribute('href');
        if (!this.originalHref) return;

        // Check if link is internal (same origin)
        try {
            const url = new URL(this.originalHref, window.location.href);
            this.isInternal = url.origin === window.location.origin || 
                            this.originalHref.startsWith('#!') ||
                            this.originalHref.startsWith('/');
        } catch (e) {
            // Relative URL, treat as internal
            this.isInternal = true;
        }

        if (this.isInternal) {
            this.setupInternalLink();
        } else {
            this.setupExternalLink();
        }
    }

    setupInternalLink() {
        // Make it accessible like a normal link
        this.setAttribute('role', 'link');
        this.setAttribute('tabindex', '0');
        this.setAttribute('aria-label', `Navigate to ${this.textContent.trim() || this.originalHref}`);
        
        // Check if hover menu should be disabled
        const noHoverMenu = this.hasAttribute('no-hover-menu');
        
        // Create hover menu only if not disabled
        let hoverMenu = null;
        if (!noHoverMenu) {
            hoverMenu = document.createElement('div');
            hoverMenu.className = 'b-anchor-menu';
            hoverMenu.setAttribute('aria-hidden', 'true');
            hoverMenu.innerHTML = `
                <button class="b-anchor-load-scroll" aria-label="Load and scroll to content">Load & Scroll</button>
                <button class="b-anchor-load-only" aria-label="Load without scrolling">Load Only</button>
                <button class="b-anchor-new-tab" aria-label="Open in new tab">New Tab</button>
            `;
        }
        
        // Handle keyboard navigation
        this.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.loadContent(true);
            }
        });

        // Style the hover menu (only add styles once, even if some anchors don't use it)
        if (!document.getElementById('b-anchor-styles')) {
            const style = document.createElement('style');
            style.id = 'b-anchor-styles';
            style.textContent = `
                .b-anchor-menu {
                    position: absolute;
                    background: rgba(0, 0, 0, 0.9);
                    color: white;
                    padding: 0.5rem;
                    border-radius: 4px;
                    display: none;
                    flex-direction: column;
                    gap: 0.25rem;
                    z-index: 1000;
                    margin-top: 0.25rem;
                    left: 0;
                }
                .b-anchor-menu button {
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: white;
                    padding: 0.5rem 1rem;
                    cursor: pointer;
                    border-radius: 2px;
                }
                .b-anchor-menu button:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                b-anchor {
                    position: relative;
                    display: inline-block;
                    color: var(--accent, #007aff);
                    text-decoration: none;
                    cursor: pointer;
                }
                b-anchor:hover {
                    color: var(--accent-hover, #0056b3);
                    text-decoration: underline;
                }
                b-anchor:focus {
                    outline: 2px solid var(--accent, #007aff);
                    outline-offset: 2px;
                }
                b-anchor:visited {
                    color: var(--accent-visited, #551a8b);
                }
            `;
            document.head.appendChild(style);
        }

        if (hoverMenu) {
            this.appendChild(hoverMenu);
            
            let hideTimeout = null;

            // Show menu on hover (desktop only, hidden from screen readers)
            const showMenu = () => {
                if (window.innerWidth > 768) {
                    if (hideTimeout) {
                        clearTimeout(hideTimeout);
                        hideTimeout = null;
                    }
                    hoverMenu.style.display = 'flex';
                }
            };

            const hideMenu = () => {
                // Add small delay to allow moving mouse to menu
                hideTimeout = setTimeout(() => {
                    hoverMenu.style.display = 'none';
                }, 100);
            };

            this.addEventListener('mouseenter', showMenu);
            this.addEventListener('mouseleave', hideMenu);
            
            // Keep menu open when hovering over it
            hoverMenu.addEventListener('mouseenter', () => {
                if (hideTimeout) {
                    clearTimeout(hideTimeout);
                    hideTimeout = null;
                }
            });
            
            hoverMenu.addEventListener('mouseleave', hideMenu);

            // Button handlers
            hoverMenu.querySelector('.b-anchor-load-scroll').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.loadContent(true);
                hoverMenu.style.display = 'none';
            });

            hoverMenu.querySelector('.b-anchor-load-only').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.loadContent(false);
                hoverMenu.style.display = 'none';
            });

            hoverMenu.querySelector('.b-anchor-new-tab').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(this.originalHref, '_blank');
                hoverMenu.style.display = 'none';
            });
        }

        // Default click behavior
        this.addEventListener('click', (e) => {
            if (!hoverMenu || !e.target.closest('.b-anchor-menu')) {
                e.preventDefault();
                this.loadContent(true);
            }
        });
    }

    setupExternalLink() {
        // External links work normally
        this.style.cursor = 'pointer';
    }

    // Static method to load content directly (for router use)
    static async loadContentFromPath(path, shouldScroll = true) {
        const anchor = new BAnchor();
        anchor.originalHref = `#!/${path}`;
        await anchor.loadContent(shouldScroll);
    }

    async loadContent(shouldScroll = true) {
        const href = this.originalHref;
        if (!href) return;

        // Normalize href
        let targetPath = href;
        if (href.startsWith('#!')) {
            targetPath = href.substring(2);
        } else if (href.startsWith('/')) {
            targetPath = href.substring(1);
        } else if (href.startsWith('#')) {
            targetPath = href.substring(1);
        }
        
        // Clean up path: remove leading/trailing slashes and normalize
        targetPath = targetPath.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');
        
        // Ensure we have a valid path (default to Resume if empty)
        if (!targetPath || targetPath === '/') {
            targetPath = 'Resume';
        }

        // Generate section ID using timestamp
        const sectionId = `section-${Date.now()}`;
        console.log(`b-anchor: Loading content for ${targetPath} with sectionId ${sectionId}`);

        // Load background if exists
        await this.loadBackground(targetPath, sectionId);

        // Load foreground if exists
        await this.loadForeground(targetPath, sectionId);

        // Load main content
        await this.loadMainContent(targetPath, shouldScroll, sectionId);
        
        // After all content is loaded, trigger activation check on the section
        setTimeout(() => {
            const section = document.getElementById(sectionId);
            if (section) {
                console.log(`b-anchor: Triggering activation check for section ${sectionId}`, section);
                // Check if viewport center is within section bounds
                const rect = section.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const viewportCenter = viewportHeight / 2;
                
                // Is the viewport center within the section's vertical bounds?
                const isCentered = viewportCenter >= rect.top && viewportCenter <= rect.bottom;
                console.log(`b-anchor: Section ${sectionId} isCentered: ${isCentered}`, { 
                    viewportCenter: viewportCenter.toFixed(0),
                    sectionTop: rect.top.toFixed(0),
                    sectionBottom: rect.bottom.toFixed(0)
                });
                
                if (isCentered) {
                    // Directly activate backgrounds/foregrounds for this section, fade out all others
                    const allBackgrounds = document.querySelectorAll('b-background');
                    const allForegrounds = document.querySelectorAll('b-foreground');
                    console.log(`b-anchor: Found ${allBackgrounds.length} backgrounds, ${allForegrounds.length} foregrounds`);
                    
                    // First, fade out ALL backgrounds/foregrounds
                    allBackgrounds.forEach(bg => {
                        bg.style.opacity = '0';
                    });
                    allForegrounds.forEach(fg => {
                        fg.style.opacity = '0';
                    });
                    
                    // Then fade in ONLY matching ones for this section
                    allBackgrounds.forEach(bg => {
                        const bgFor = bg.getAttribute('for');
                        if (bgFor === sectionId) {
                            bg.style.opacity = '1';
                            console.log(`b-anchor: Set background ${bgFor} opacity to 1`);
                        }
                    });
                    
                    allForegrounds.forEach(fg => {
                        const fgFor = fg.getAttribute('for');
                        if (fgFor === sectionId) {
                            fg.style.opacity = '1';
                            console.log(`b-anchor: Set foreground ${fgFor} opacity to 1`);
                        }
                    });
                }
            } else {
                console.warn(`b-anchor: Section ${sectionId} not found in DOM`);
            }
        }, 300);

        // Update history
        const newUrl = `#!${targetPath}`;
        window.history.pushState({ path: targetPath }, '', newUrl);

        // Update title
        this.updateTitle(targetPath);

        // Update situational menu
        this.updateSituationalMenu(href, sectionId);
    }

    async loadBackground(path, sectionId) {
        // Check if we're in file:// protocol
        if (window.location.protocol === 'file:') {
            return;
        }
        
        const bgPath = `partials/${path}.background.html`;
        try {
            const response = await fetch(bgPath);
            if (response.ok) {
                const html = await response.text();
                const bgContainer = document.getElementById('backgrounds');
                
                // Check if background for this section already exists
                const existing = bgContainer.querySelector(`b-background[for="${sectionId}"]`);
                if (existing) {
                    return; // Already loaded
                }
                
                // Create b-background component and insert content
                const bgComponent = document.createElement('b-background');
                bgComponent.setAttribute('aria-hidden', 'true');
                bgComponent.setAttribute('for', sectionId);
                bgComponent.style.opacity = '0'; // Start hidden
                bgComponent.innerHTML = html;
                bgContainer.appendChild(bgComponent);
                console.log(`b-anchor: Created background for ${sectionId}`, bgComponent);
                
                // Reload any components in the new content
                if (window.ComponentLoader) {
                    window.ComponentLoader.find(bgComponent).forEach(comp => {
                        window.ComponentLoader.load(comp).catch(() => {});
                    });
                }
            }
        } catch (e) {
            // No background is fine
        }
    }

    async loadForeground(path, sectionId) {
        // Check if we're in file:// protocol
        if (window.location.protocol === 'file:') {
            return;
        }
        
        const fgPath = `partials/${path}.foreground.html`;
        try {
            const response = await fetch(fgPath);
            if (response.ok) {
                const html = await response.text();
                const fgContainer = document.getElementById('foregrounds');
                
                // Check if foreground for this section already exists
                const existing = fgContainer.querySelector(`b-foreground[for="${sectionId}"]`);
                if (existing) {
                    return; // Already loaded
                }
                
                // Create b-foreground component and insert content
                const fgComponent = document.createElement('b-foreground');
                fgComponent.setAttribute('aria-hidden', 'true');
                fgComponent.setAttribute('for', sectionId);
                fgComponent.style.opacity = '0'; // Start hidden
                fgComponent.innerHTML = html;
                fgContainer.appendChild(fgComponent);
                console.log(`b-anchor: Created foreground for ${sectionId}`, fgComponent);
                
                // Reload any components in the new content
                if (window.ComponentLoader) {
                    window.ComponentLoader.find(fgComponent).forEach(comp => {
                        window.ComponentLoader.load(comp).catch(() => {});
                    });
                }
            }
        } catch (e) {
            // No foreground is fine
        }
    }

    async loadMainContent(path, shouldScroll, sectionId) {
        // Check if we're in file:// protocol
        if (window.location.protocol === 'file:') {
            console.error('File:// protocol detected. Please use a web server.');
            console.error('Use Python (python -m http.server 8000), PHP, or VS Code Live Server');
            console.error('See README.md for more options.');
            return;
        }
        
        const contentPath = `partials/${path}.html`;
        const contentPane = document.getElementById('content-pane');
        
        // Check if section already exists
        const existingSection = document.getElementById(sectionId);
        if (existingSection) {
            if (shouldScroll) {
                existingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            return;
        }
        
        try {
            const response = await fetch(contentPath);
            if (response.ok) {
                const html = await response.text();
                
                // Ensure b-section component is loaded before creating element
                if (window.ComponentLoader) {
                    await window.ComponentLoader.load('b-section').catch(() => {});
                }
                
                // Wait a bit to ensure custom element is defined
                await new Promise(resolve => setTimeout(resolve, 50));
                
                // Check if custom element is defined
                if (!customElements.get('b-section')) {
                    console.warn('b-anchor: b-section custom element not defined, waiting...');
                    await new Promise(resolve => {
                        const checkInterval = setInterval(() => {
                            if (customElements.get('b-section')) {
                                clearInterval(checkInterval);
                                resolve();
                            }
                        }, 50);
                        setTimeout(() => {
                            clearInterval(checkInterval);
                            resolve();
                        }, 1000);
                    });
                }
                
                // Create a new section element using b-section component
                const section = document.createElement('b-section');
                section.id = sectionId;
                section.className = 'content-section';
                section.setAttribute('tabindex', '-1'); // Make focusable for scroll-to
                section.innerHTML = html;
                
                console.log(`b-anchor: Created section with ID ${sectionId}`, section);
                console.log(`b-anchor: Custom element defined: ${!!customElements.get('b-section')}`);
                console.log(`b-anchor: Section constructor: ${section.constructor.name}`);
                
                // Append to content pane instead of replacing
                contentPane.appendChild(section);

                // Reload any components in the new content
                if (window.ComponentLoader) {
                    window.ComponentLoader.find(section).forEach(comp => {
                        window.ComponentLoader.load(comp).catch(() => {});
                    });
                }

                if (shouldScroll) {
                    // Scroll to center the section in viewport
                    section.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } else {
                console.warn(`Content not found: ${contentPath}`);
            }
        } catch (e) {
            console.error(`Error loading content: ${e}`);
        }
    }

    updateTitle(path) {
        // Generate title from filename: replace hyphens with spaces
        const pageTitle = path.replace(/-/g, ' ');
        document.title = `${pageTitle} - brall.dev`;
    }

    updateSituationalMenu(href, sectionId) {
        const situMenu = document.getElementById('situational-links');
        if (!situMenu) return;

        // Normalize href to get title
        let targetPath = href;
        if (href.startsWith('#!')) {
            targetPath = href.substring(2);
        } else if (href.startsWith('/')) {
            targetPath = href.substring(1);
        } else if (href.startsWith('#')) {
            targetPath = href.substring(1);
        }
        targetPath = targetPath.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');
        if (!targetPath || targetPath === '/') {
            targetPath = 'Resume';
        }

        // Add link to situational menu if not already present
        const existing = Array.from(situMenu.children).find(li => 
            li.querySelector('a')?.getAttribute('data-section-id') === sectionId
        );

        if (!existing) {
            // Generate title from filename: replace hyphens with spaces, preserving capitalization
            const generateTitle = (path) => {
                return path.replace(/-/g, ' ');
            };
            
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = href;
            a.textContent = generateTitle(targetPath);
            a.setAttribute('data-section-id', sectionId);
            // Make links in situational menu not focusable (hidden from screen readers)
            a.setAttribute('tabindex', '-1');
            a.setAttribute('aria-hidden', 'true');
            
            // Add click handler to scroll to section
            a.addEventListener('click', (e) => {
                e.preventDefault();
                const section = document.getElementById(sectionId);
                if (section) {
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Reset focus after scroll
                    setTimeout(() => {
                        section.focus();
                        if (section.tabIndex === -1) {
                            section.setAttribute('tabindex', '-1');
                        }
                    }, 500);
                }
            });
            
            li.appendChild(a);
            situMenu.appendChild(li);
        }
    }
}

customElements.define('b-anchor', BAnchor);

// Router functionality - handles hashbang routing (#!)
(function() {
    'use strict';

    function getCurrentPath() {
        const hash = window.location.hash;
        if (hash.startsWith('#!')) {
            return hash.substring(2);
        }
        return 'Resume'; // Default to Resume
    }

    async function loadInitialContent() {
        const path = getCurrentPath();
        
        // Wait for b-anchor component to be defined
        if (!customElements.get('b-anchor')) {
            await new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (customElements.get('b-anchor')) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 50);
            });
        }
        
        // Use static method to load content
        await BAnchor.loadContentFromPath(path, true);
    }

    // Handle back/forward buttons
    window.addEventListener('popstate', async (e) => {
        const path = e.state?.path || getCurrentPath();
        await BAnchor.loadContentFromPath(path, true);
    });

    // Load initial content on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadInitialContent);
    } else {
        loadInitialContent();
    }
})();

