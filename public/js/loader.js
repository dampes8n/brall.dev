/**
 * Loader.js - Auto-loads web components from HTML
 * Reads incoming HTML, finds web components, and autoloads their .js files
 */

(function() {
    'use strict';

    const componentCache = new Map();

    function loadComponent(componentName) {
        if (componentCache.has(componentName)) {
            return Promise.resolve(componentCache.get(componentName));
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `components/${componentName}.js`;
            script.onload = () => {
                componentCache.set(componentName, true);
                resolve();
            };
            script.onerror = () => {
                console.warn(`Failed to load component: ${componentName}`);
                reject(new Error(`Failed to load component: ${componentName}`));
            };
            document.head.appendChild(script);
        });
    }

    function findComponents(element = document) {
        const components = new Set();
        const customElements = element.querySelectorAll('*');
        
        customElements.forEach(el => {
            const tagName = el.tagName.toLowerCase();
            if (tagName.includes('-') && !componentCache.has(tagName)) {
                components.add(tagName);
            }
        });

        return Array.from(components);
    }

    function initializeComponents() {
        const components = findComponents();
        const loadPromises = components.map(comp => loadComponent(comp).catch(() => {}));
        
        return Promise.all(loadPromises);
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeComponents);
    } else {
        initializeComponents();
    }

    // Watch for dynamically added components
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // Element node
                    const components = findComponents(node);
                    components.forEach(comp => loadComponent(comp).catch(() => {}));
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Export for manual loading if needed
    window.ComponentLoader = {
        load: loadComponent,
        find: findComponents
    };

    // Router functionality - handles hashbang routing (#!)
    (function() {
        'use strict';

        // Router class to handle content loading
        class Router {
            static async loadContentFromPath(path, shouldScroll = true) {
                const router = new Router();
                await router.loadContent(path, shouldScroll);
            }

            async loadContent(path, shouldScroll = true) {
                // Normalize path
                let targetPath = path;
                if (targetPath.startsWith('#!')) {
                    targetPath = targetPath.substring(2);
                } else if (targetPath.startsWith('/')) {
                    targetPath = targetPath.substring(1);
                } else if (targetPath.startsWith('#')) {
                    targetPath = targetPath.substring(1);
                }
                
                // Clean up path: remove leading/trailing slashes and normalize
                targetPath = targetPath.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');
                
                // Ensure we have a valid path (default to Resume if empty)
                if (!targetPath || targetPath === '/') {
                    targetPath = 'Resume';
                }
                
                console.log('[Router] Loading content for path:', targetPath);

                // Update title immediately so it shows right away
                this.updateTitle(targetPath);

                // Check if this is first load (no breadcrumb exists for this path)
                const breadcrumbs = document.querySelector('b-breadcrumbs');
                const isFirstLoad = breadcrumbs && breadcrumbs.breadcrumbs && !breadcrumbs.breadcrumbs.find(b => 
                    breadcrumbs.normalizePath(b.path) === breadcrumbs.normalizePath(targetPath)
                );

                // Generate section ID using timestamp
                const sectionId = `section-${Date.now()}`;

                // Load background if exists
                await this.loadBackground(targetPath, sectionId);

                // Load foreground if exists
                await this.loadForeground(targetPath, sectionId);

                // Load main content
                // Always jump to top on first load, otherwise use shouldScroll
                const scrollToTop = isFirstLoad;
                await this.loadMainContent(targetPath, scrollToTop ? true : shouldScroll, sectionId);

                // Update history with path and scroll position
                const newUrl = `#!${targetPath}`;
                const scrollY = window.scrollY;
                window.history.pushState({ path: targetPath, scrollY }, '', newUrl);

                // Update breadcrumbs (add new breadcrumb with current scroll position)
                // Note: scroll position will be 0 if first load (we scrolled to top)
                const currentScrollY = window.scrollY;
                if (breadcrumbs) {
                    const title = breadcrumbs.generateTitle(targetPath);
                    breadcrumbs.add(targetPath, title, currentScrollY);
                }
            }

            async loadBackground(path, sectionId) {
                // Check if we're in file:// protocol
                if (window.location.protocol === 'file:') {
                    return;
                }
                
                const bgContainer = document.getElementById('backgrounds');
                let bgLayer = bgContainer.querySelector('b-layer[type="background"]');
                
                const bgPath = `partials/${path}.background.html`;
                try {
                    const response = await fetch(bgPath);
                    if (response.ok) {
                        const html = await response.text();
                        
                        // Get or create b-layer for backgrounds
                        if (!bgLayer) {
                            bgLayer = document.createElement('b-layer');
                            bgLayer.setAttribute('type', 'background');
                            bgLayer.setAttribute('aria-hidden', 'true');
                            bgContainer.appendChild(bgLayer);
                            
                            // Ensure component is loaded
                            if (window.ComponentLoader) {
                                await window.ComponentLoader.load('b-layer').catch(() => {});
                            }
                        }
                        
                        // Add new layer with crossfading
                        await bgLayer.addLayer(html);
                    } else {
                        // No background file exists - clear old layer if it exists
                        if (bgLayer) {
                            bgLayer.clear();
                        }
                    }
                } catch (e) {
                    // No background file exists - clear old layer if it exists
                    if (bgLayer) {
                        bgLayer.clear();
                    }
                }
            }

            async loadForeground(path, sectionId) {
                // Check if we're in file:// protocol
                if (window.location.protocol === 'file:') {
                    return;
                }
                
                const fgContainer = document.getElementById('foregrounds');
                let fgLayer = fgContainer.querySelector('b-layer[type="foreground"]');
                
                const fgPath = `partials/${path}.foreground.html`;
                try {
                    const response = await fetch(fgPath);
                    if (response.ok) {
                        const html = await response.text();
                        
                        // Get or create b-layer for foregrounds
                        if (!fgLayer) {
                            fgLayer = document.createElement('b-layer');
                            fgLayer.setAttribute('type', 'foreground');
                            fgLayer.setAttribute('aria-hidden', 'true');
                            fgContainer.appendChild(fgLayer);
                            
                            // Ensure component is loaded
                            if (window.ComponentLoader) {
                                await window.ComponentLoader.load('b-layer').catch(() => {});
                            }
                        }
                        
                        // Add new layer with crossfading
                        await fgLayer.addLayer(html);
                    } else {
                        // No foreground file exists - clear old layer if it exists
                        if (fgLayer) {
                            fgLayer.clear();
                        }
                    }
                } catch (e) {
                    // No foreground file exists - clear old layer if it exists
                    if (fgLayer) {
                        fgLayer.clear();
                    }
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
                
                const contentPane = document.getElementById('content-pane');
                
                // Check if path matches project/skill/timeline-event pattern
                const pathParts = path.split('/');
                if (pathParts.length === 2) {
                    const [type, slug] = pathParts;
                    let basePartial = null;
                    let jsonFile = null;
                    
                    if (type === 'projects') {
                        basePartial = 'Projects';
                        jsonFile = 'projects.json';
                    } else if (type === 'skills') {
                        basePartial = 'Resume'; // Skills are shown on Resume page
                        jsonFile = 'skills.json';
                    } else if (type === 'timeline-events') {
                        basePartial = 'History';
                        jsonFile = 'timeline-events.json';
                    } else if (type === 'skillsets') {
                        // Skillsets are special - they filter across multiple JSON files
                        await this.loadSkillset(slug, sectionId, shouldScroll);
                        return;
                    } else if (type === 'subdomains') {
                        // Subdomains are special - they filter timeline events
                        await this.loadSubdomain(slug, sectionId, shouldScroll);
                        return;
                    }
                    
                    if (basePartial && jsonFile) {
                        // Load the base partial and then find the item by slug
                        await this.loadDataItem(basePartial, jsonFile, slug, sectionId, shouldScroll);
                        return;
                    }
                }
                
                // Default: load partial as before
                const contentPath = `partials/${path}.html`;
                
                try {
                    const response = await fetch(contentPath);
                    if (response.ok) {
                        const html = await response.text();
                        await this.createSectionFromHTML(html, sectionId, shouldScroll);
                    } else {
                        console.warn(`Content not found: ${contentPath}`);
                    }
                } catch (e) {
                    console.error(`Error loading content: ${e}`);
                }
            }

            slugify(text) {
                return text.toLowerCase().replace(/\s+/g, '-');
            }

            async loadSubdomain(slug, sectionId, shouldScroll) {
                try {
                    // Convert slug back to subdomain name
                    // First, restore slashes from -slash- encoding
                    let subdomainName = slug.replace(/-slash-/g, '/');
                    // Then split by remaining hyphens, but preserve slashes
                    // We need to split carefully to handle words between slashes
                    const parts = subdomainName.split('/');
                    if (parts.length > 1) {
                        // Has slashes - capitalize each part separately
                        subdomainName = parts.map(part => {
                            return part.split('-').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ');
                        }).join('/');
                    } else {
                        // No slashes - just capitalize words
                        subdomainName = subdomainName.split('-').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ');
                    }
                    
                    // Load timeline events
                    const timelineRes = await fetch('data/timeline-events.json');
                    const timelineEvents = await timelineRes.json();
                    
                    // Filter events by subdomain
                    const filteredEvents = timelineEvents.filter(e => 
                        e.subdomain && e.subdomain === subdomainName
                    );
                    
                    // Create HTML for subdomain page
                    let html = `<article><div class="card">`;
                    html += `<h1>${this.escapeHtml(subdomainName)}</h1>`;
                    
                    // Load projects for this subdomain
                    const projectsRes = await fetch('data/projects.json');
                    const allProjects = await projectsRes.json();
                    const filteredProjects = allProjects.filter(p => 
                        p.subdomain && p.subdomain === subdomainName
                    );
                    
                    if (filteredProjects.length > 0) {
                        html += `<section class="related">`;
                        html += `<h2>Projects</h2>`;
                        html += `<nav class="tag-list">`;
                        filteredProjects.forEach(project => {
                            html += `<a href="#!/projects/${project.slug}" class="tag">${this.escapeHtml(project.title)}</a>`;
                        });
                        html += `</nav>`;
                        html += `</section>`;
                    }
                    
                    if (filteredEvents.length > 0) {
                        html += `<section class="related">`;
                        html += `<h2>Timeline Events</h2>`;
                        html += `<nav class="tag-list">`;
                        filteredEvents.forEach(event => {
                            const eventDate = BDate.formatDate(event.date || 'Unknown');
                            html += `<a href="#!/timeline-events/${event.slug}" class="tag"><strong>${this.escapeHtml(event.title)}</strong> <em>(${this.escapeHtml(eventDate)})</em></a>`;
                        });
                        html += `</nav>`;
                        html += `</section>`;
                    }
                    
                    html += `</div></article>`;
                    
                    await this.createSectionFromHTML(html, sectionId, shouldScroll);
                } catch (e) {
                    console.error(`Error loading subdomain: ${e}`);
                }
            }

            async loadSkillset(slug, sectionId, shouldScroll) {
                try {
                    // Convert slug back to skillset name - handle special cases
                    const skillsetMap = {
                        'ux': 'UX',
                        'devops': 'DevOps'
                    };
                    
                    let skillsetName = skillsetMap[slug.toLowerCase()];
                    if (!skillsetName) {
                        // Convert slug to title case
                        skillsetName = slug.split('-').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ');
                    }
                    
                    // Load all data files
                    const [skillsRes, projectsRes, timelineRes] = await Promise.all([
                        fetch('data/skills.json'),
                        fetch('data/projects.json'),
                        fetch('data/timeline-events.json')
                    ]);
                    
                    const [skills, projects, timelineEvents] = await Promise.all([
                        skillsRes.json(),
                        projectsRes.json(),
                        timelineRes.json()
                    ]);
                    
                    // Filter items by skillset
                    const filteredSkills = skills.filter(s => 
                        s.skillsets && s.skillsets.includes(skillsetName)
                    );
                    const filteredProjects = projects.filter(p => 
                        p.skillsets && p.skillsets.includes(skillsetName)
                    );
                    const filteredEvents = timelineEvents.filter(e => 
                        e.skillsets && e.skillsets.includes(skillsetName)
                    );
                    
                    // Create HTML for skillset page
                    let html = `<article><div class="card">`;
                    html += `<h1>${this.escapeHtml(skillsetName)}</h1>`;
                    
                    if (filteredSkills.length > 0) {
                        html += `<section class="related">`;
                        html += `<h2>Skills</h2>`;
                        html += `<nav class="tag-list">`;
                        filteredSkills.forEach(skill => {
                            html += `<a href="#!/skills/${skill.slug}" class="tag">${this.escapeHtml(skill.title)}</a>`;
                        });
                        html += `</nav>`;
                        html += `</section>`;
                    }
                    
                    if (filteredProjects.length > 0) {
                        html += `<section class="related">`;
                        html += `<h2>Projects</h2>`;
                        html += `<nav class="tag-list">`;
                        filteredProjects.forEach(project => {
                            html += `<a href="#!/projects/${project.slug}" class="tag">${this.escapeHtml(project.title)}</a>`;
                        });
                        html += `</nav>`;
                        html += `</section>`;
                    }
                    
                    if (filteredEvents.length > 0) {
                        html += `<section class="related">`;
                        html += `<h2>Timeline Events</h2>`;
                        html += `<nav class="tag-list">`;
                        filteredEvents.forEach(event => {
                            const eventDate = BDate.formatDate(event.date || 'Unknown');
                            html += `<a href="#!/timeline-events/${event.slug}" class="tag"><strong>${this.escapeHtml(event.title)}</strong> <em>(${this.escapeHtml(eventDate)})</em></a>`;
                        });
                        html += `</nav>`;
                        html += `</section>`;
                    }
                    
                    html += `</div></article>`;
                    
                    await this.createSectionFromHTML(html, sectionId, shouldScroll);
                } catch (e) {
                    console.error(`Error loading skillset: ${e}`);
                }
            }

            async loadDataItem(basePartial, jsonFile, slug, sectionId, shouldScroll) {
                try {
                    // Load the JSON data
                    const jsonPath = `data/${jsonFile}`;
                    const jsonResponse = await fetch(jsonPath);
                    
                    if (!jsonResponse.ok) {
                        console.warn(`JSON file not found: ${jsonPath}`);
                        return;
                    }
                    
                    const items = await jsonResponse.json();
                    const item = items.find(i => i.slug === slug);
                    
                    if (!item) {
                        console.warn(`Item with slug "${slug}" not found in ${jsonFile}`);
                        return;
                    }
                    
                    // Create HTML for the item (already includes article)
                    const html = await this.renderDataItem(item, jsonFile);
                    
                    await this.createSectionFromHTML(html, sectionId, shouldScroll);
                } catch (e) {
                    console.error(`Error loading data item: ${e}`);
                }
            }

            async renderDataItem(item, jsonFile) {
                // Load all data for cross-linking
                const [skills, projects, timelineEvents] = await Promise.all([
                    fetch('data/skills.json').then(r => r.json()).catch(() => []),
                    fetch('data/projects.json').then(r => r.json()).catch(() => []),
                    fetch('data/timeline-events.json').then(r => r.json()).catch(() => [])
                ]);
                
                // Wrap each item in an article
                let html = '<article>';
                
                if (jsonFile === 'projects.json') {
                    // Format dates using BDate component
                    const startDate = item.start ? BDate.formatDate(item.start) : 'Ongoing';
                    const endDate = item.end ? BDate.formatDate(item.end) : 'Present';
                    const domain = item.domain || '';
                    const domainLower = domain.toLowerCase();
                    
                    html += `<div class="card" data-domain="${domainLower}">`;
                    html += `<p><time>${startDate} - ${endDate}</time></p>`;
                    html += `<h1>${this.escapeHtml(item.title)}</h1>`;
                    if (item.description) {
                        html += `<p>${this.escapeHtml(item.description)}</p>`;
                    }
                    html += `<nav class="metadata">`;
                    if (item.domain) {
                        html += `<span class="timeline-domain">${this.escapeHtml(item.domain)}</span>`;
                    }
                    if (item.subdomain) {
                        const subdomainLink = this.slugify(item.subdomain);
                        html += `<a href="#!/subdomains/${subdomainLink}">${this.escapeHtml(item.subdomain)}</a>`;
                    }
                    if (item.skillsets && item.skillsets.length > 0) {
                        item.skillsets.forEach(skillset => {
                            const slug = skillset.toLowerCase().replace(/\s+/g, '-');
                            html += `<a href="#!/skillsets/${slug}">${this.escapeHtml(skillset)}</a>`;
                        });
                    }
                    html += `</nav>`;
                    
                    // Cross-links: Related timeline events
                    const relatedEvents = timelineEvents.filter(e => 
                        e.project && e.project.toLowerCase() === item.title.toLowerCase()
                    );
                    if (relatedEvents.length > 0) {
                        html += `<section class="related">`;
                        html += `<h2>Related Timeline Events</h2>`;
                        html += `<nav class="tag-list">`;
                        relatedEvents.forEach(event => {
                            const eventDate = BDate.formatDate(event.date || 'Unknown');
                            html += `<a href="#!/timeline-events/${event.slug}" class="tag"><strong>${this.escapeHtml(event.title)}</strong> <em>(${this.escapeHtml(eventDate)})</em></a>`;
                        });
                        html += `</nav>`;
                        html += `</section>`;
                    }
                    html += `</div>`;
                } else if (jsonFile === 'skills.json') {
                    html += `<div class="card">`;
                    html += `<h1>${this.escapeHtml(item.title)}</h1>`;
                    if (item.description) {
                        html += `<p>${this.escapeHtml(item.description)}</p>`;
                    }
                    html += `<nav class="metadata">`;
                    if (item.skillsets && item.skillsets.length > 0) {
                        item.skillsets.forEach(skillset => {
                            const slug = skillset.toLowerCase().replace(/\s+/g, '-');
                            html += `<a href="#!/skillsets/${slug}">${this.escapeHtml(skillset)}</a>`;
                        });
                    }
                    html += `</nav>`;
                    
                    // Cross-links: Related projects and timeline events
                    const relatedProjects = projects.filter(p => 
                        p.skillsets && item.skillsets && 
                        p.skillsets.some(ps => item.skillsets.includes(ps))
                    );
                    const relatedEvents = timelineEvents.filter(e => 
                        e.skills && e.skills.some(es => es === item.title)
                    );
                    
                    if (relatedProjects.length > 0) {
                        html += `<section class="related">`;
                        html += `<h2>Related Projects</h2>`;
                        html += `<nav class="tag-list">`;
                        relatedProjects.forEach(project => {
                            html += `<a href="#!/projects/${project.slug}" class="tag">${this.escapeHtml(project.title)}</a>`;
                        });
                        html += `</nav>`;
                        html += `</section>`;
                    }
                    
                    if (relatedEvents.length > 0) {
                        html += `<section class="related">`;
                        html += `<h2>Related Timeline Events</h2>`;
                        html += `<nav class="tag-list">`;
                        relatedEvents.forEach(event => {
                            const eventDate = BDate.formatDate(event.date || 'Unknown');
                            html += `<a href="#!/timeline-events/${event.slug}" class="tag"><strong>${this.escapeHtml(event.title)}</strong> <em>(${this.escapeHtml(eventDate)})</em></a>`;
                        });
                        html += `</nav>`;
                        html += `</section>`;
                    }
                    html += `</div>`;
                } else if (jsonFile === 'timeline-events.json') {
                    // Render as a bigger version of the timeline plate
                    const domain = item.domain || '';
                    const subdomain = item.subdomain || '';
                    // Handle slashes in subdomain names
                    const subdomainLink = subdomain ? this.slugify(subdomain) : '';
                    const subdomainHtml = subdomain ? 
                        `<a href="#!/subdomains/${subdomainLink}">${this.escapeHtml(subdomain)}</a>` : 
                        '';
                    
                    // Format date using BDate component
                    const formattedDate = BDate.formatDate(item.date || 'Unknown');
                    
                    html += `<div class="timeline-event-detail" data-domain="${domain.toLowerCase()}">`;
                    html += `<div class="card">`;
                    html += `<time>${this.escapeHtml(formattedDate)}</time>`;
                    html += `<h1>${this.escapeHtml(item.title)}</h1>`;
                    if (item.description) {
                        html += `<p>${this.escapeHtml(item.description)}</p>`;
                    }
                    html += `<nav class="metadata">`;
                    if (domain) {
                        html += `<span class="timeline-domain">${this.escapeHtml(domain)}</span>`;
                    }
                    if (subdomainHtml) {
                        html += subdomainHtml;
                    }
                    if (item.project) {
                        // Find project by title match
                        const relatedProject = projects.find(p => 
                            p.title && p.title.toLowerCase() === item.project.toLowerCase()
                        );
                        if (relatedProject) {
                            html += `<a href="#!/projects/${relatedProject.slug}" class="timeline-project">${this.escapeHtml(item.project)}</a>`;
                        } else {
                            html += `<span class="timeline-project">${this.escapeHtml(item.project)}</span>`;
                        }
                    }
                    if (item.skillsets && item.skillsets.length > 0) {
                        item.skillsets.forEach(skillset => {
                            const slug = skillset.toLowerCase().replace(/\s+/g, '-');
                            html += `<a href="#!/skillsets/${slug}" class="timeline-skillset">${this.escapeHtml(skillset)}</a>`;
                        });
                    }
                    if (item.skills && item.skills.length > 0) {
                        item.skills.forEach(skillName => {
                            const skill = skills.find(s => s.title === skillName);
                            if (skill) {
                                html += `<a href="#!/skills/${skill.slug}" class="timeline-skill">${this.escapeHtml(skillName)}</a>`;
                            } else {
                                html += `<span class="timeline-skill">${this.escapeHtml(skillName)}</span>`;
                            }
                        });
                    }
                    html += `</nav>`;
                    html += `</div>`;
                    html += `</div>`;
                }
                
                html += '</article>';
                return html;
            }

            renderSkillsetLinks(skillsets) {
                return skillsets.map(skillset => {
                    const slug = skillset.toLowerCase().replace(/\s+/g, '-');
                    return `<a href="#!/skillsets/${slug}">${this.escapeHtml(skillset)}</a>`;
                }).join(', ');
            }

            renderSkillLinks(skillNames, allSkills) {
                return skillNames.map(skillName => {
                    const skill = allSkills.find(s => s.title === skillName);
                    if (skill) {
                        return `<a href="#!/skills/${skill.slug}">${this.escapeHtml(skillName)}</a>`;
                    }
                    return this.escapeHtml(skillName);
                }).join(', ');
            }

            escapeHtml(text) {
                if (!text) return '';
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }


            async createSectionFromHTML(html, sectionId, shouldScroll) {
                const contentPane = document.getElementById('content-pane');
                
                if (!contentPane) {
                    console.error('[Router] content-pane element not found');
                    return;
                }
                
                // Save current scroll position to prevent unwanted scrolling during content swap
                const scrollY = window.scrollY;
                
                // Clear existing content
                contentPane.innerHTML = '';
                
                // Temporarily set scroll position to top to prevent browser from trying to maintain position
                window.scrollTo(0, 0);
                        
                // Check if HTML already starts with an article tag
                const trimmedHtml = html.trim();
                const alreadyHasArticle = trimmedHtml.startsWith('<article');
                
                if (alreadyHasArticle) {
                    // Content already has article, just set it directly
                    contentPane.innerHTML = html;
                    const article = contentPane.querySelector('article');
                    if (article) {
                        article.id = sectionId;
                        article.setAttribute('tabindex', '-1');
                    }
                } else {
                    // Create a wrapper div (not article, to avoid nesting)
                    const wrapper = document.createElement('div');
                    wrapper.id = sectionId;
                    wrapper.setAttribute('tabindex', '-1');
                    wrapper.innerHTML = html;
                    contentPane.appendChild(wrapper);
                }

                // Reload any components in the new content
                if (window.ComponentLoader) {
                    window.ComponentLoader.find(section).forEach(comp => {
                        window.ComponentLoader.load(comp).catch(() => {});
                    });
                }

                // Wait for layout to complete before scrolling
                // This prevents scroll position from shifting as content loads
                await new Promise(resolve => {
                    // Use requestAnimationFrame to wait for layout
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            resolve();
                        });
                    });
                });

                if (shouldScroll) {
                    // Scroll to center the section in viewport
                    section.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    // Keep scroll at top (we already set it to 0)
                    // This prevents the page from jumping when long content loads
                }
            }

            updateTitle(path) {
                // Handle data item routes (projects/skills/timeline-events)
                const pathParts = path.split('/');
                let newTitle;
                
                if (pathParts.length === 2) {
                    const [type, slug] = pathParts;
                    // Capitalize first letter of type and format slug
                    const typeName = type.charAt(0).toUpperCase() + type.slice(1).replace(/s$/, '');
                    const slugTitle = slug.split('-').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ');
                    newTitle = `${slugTitle} - Will Brall's Portfolio`;
                } else {
                    // Generate title from filename: replace hyphens with spaces and capitalize
                    const pageTitle = path.split('-').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ');
                    newTitle = `${pageTitle} - Will Brall's Portfolio`;
                }
                
                console.log('[Router] Updating title:', newTitle, 'for path:', path);
                document.title = newTitle;
            }

        }

        // Set up click handlers for #! links
        function setupLinkHandlers() {
            document.addEventListener('click', async (e) => {
                const link = e.target.closest('a[href^="#!"]');
                if (!link) return;
                
                e.preventDefault();
                const href = link.getAttribute('href');
                
                // Save current scroll position before navigation
                const currentPath = getCurrentPath();
                const scrollY = window.scrollY;
                saveScrollPosition(currentPath, scrollY);
                
                const router = new Router();
                await router.loadContent(href, true);
            });
        }

        // Save scroll position for current path
        function saveScrollPosition(path, scrollY) {
            const breadcrumbs = document.querySelector('b-breadcrumbs');
            if (breadcrumbs) {
                const normalizedPath = breadcrumbs.normalizePath(path);
                const title = breadcrumbs.generateTitle(normalizedPath);
                breadcrumbs.add(normalizedPath, title, scrollY);
            }
        }

        function getCurrentPath() {
            const hash = window.location.hash;
            if (hash.startsWith('#!')) {
                return hash.substring(2);
            }
            return 'Resume'; // Default to Resume
        }

        async function loadInitialContent() {
            try {
                // Ensure content-pane exists
                const contentPane = document.getElementById('content-pane');
                if (!contentPane) {
                    console.error('[Router] content-pane not found, retrying...');
                    setTimeout(loadInitialContent, 100);
                    return;
                }
                
                let path = getCurrentPath();
                
                // If no hash exists, default to Resume
                if (!window.location.hash || !window.location.hash.startsWith('#!')) {
                    path = 'Resume';
                }
                
                console.log('[Router] Initial load, path:', path);
                
                // On initial load, always scroll to top (first load)
                // Router is available in this scope
                await Router.loadContentFromPath(path, true);
                
                // Set initial history state and hash
                const newUrl = `#!${path}`;
                window.history.replaceState({ path, scrollY: 0 }, '', newUrl);
                // Also ensure hash is set
                if (window.location.hash !== newUrl) {
                    window.location.hash = newUrl;
                }
            } catch (e) {
                console.error('[Router] Error loading initial content:', e);
            }
        }

        // Handle back/forward buttons
        window.addEventListener('popstate', async (e) => {
            let path = e.state?.path || getCurrentPath();
            const savedScrollY = e.state?.scrollY;
            
            // Normalize path (same logic as in loadContent)
            if (path.startsWith('#!')) {
                path = path.substring(2);
            } else if (path.startsWith('/')) {
                path = path.substring(1);
            } else if (path.startsWith('#')) {
                path = path.substring(1);
            }
            path = path.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');
            if (!path || path === '/') {
                path = 'Resume';
            }
            
            // Load content without scrolling (we'll restore scroll position)
            const router = new Router();
            await router.loadContent(path, false);
            
            // Restore scroll position from history state or breadcrumbs
            const scrollY = savedScrollY !== undefined ? savedScrollY : 
                          (() => {
                              const breadcrumbs = document.querySelector('b-breadcrumbs');
                              return breadcrumbs ? breadcrumbs.getScrollPosition(path) : 0;
                          })();
            
            // Wait for layout to complete before restoring scroll
            await new Promise(resolve => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        resolve();
                    });
                });
            });
            
            window.scrollTo(0, scrollY);
        });

        // Set up link handlers and load initial content
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setupLinkHandlers();
                loadInitialContent();
            });
        } else {
            setupLinkHandlers();
            loadInitialContent();
        }

        // Export Router for use elsewhere
        window.Router = Router;
    })();
})();

