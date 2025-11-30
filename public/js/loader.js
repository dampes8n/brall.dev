/**
 * Loader.js - Auto-loads web components from HTML
 * Reads incoming HTML, finds web components, and autoloads their .js files
 */

(function() {
    'use strict';

    const componentCache = new Map();
    const pendingLoads = new Map();

    function loadComponent(componentName) {
        // If already loaded, return immediately
        if (componentCache.has(componentName)) {
            return Promise.resolve(componentCache.get(componentName));
        }

        // If already loading, return the existing promise
        if (pendingLoads.has(componentName)) {
            return pendingLoads.get(componentName);
        }

        // Check if script tag already exists in DOM
        const existingScript = document.querySelector(`script[src="components/${componentName}.js"]`);
        if (existingScript) {
            // Script exists but not in cache yet - wait for it to load
            const loadPromise = new Promise((resolve, reject) => {
                const checkLoaded = () => {
                    if (componentCache.has(componentName)) {
                        resolve(componentCache.get(componentName));
                    } else {
                        // Wait a bit and check again
                        setTimeout(checkLoaded, 50);
                    }
                };
                checkLoaded();
            });
            pendingLoads.set(componentName, loadPromise);
            return loadPromise;
        }

        // Create new load promise
        const loadPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `components/${componentName}.js`;
            script.onload = () => {
                componentCache.set(componentName, true);
                pendingLoads.delete(componentName);
                resolve();
            };
            script.onerror = () => {
                console.warn(`Failed to load component: ${componentName}`);
                pendingLoads.delete(componentName);
                reject(new Error(`Failed to load component: ${componentName}`));
            };
            document.head.appendChild(script);
        });

        pendingLoads.set(componentName, loadPromise);
        return loadPromise;
    }

    function findComponents(element = document) {
        const components = new Set();
        const customElements = element.querySelectorAll('*');
        
        customElements.forEach(el => {
            const tagName = el.tagName.toLowerCase();
            // Only add if not in cache and not already pending
            if (tagName.includes('-') && !componentCache.has(tagName) && !pendingLoads.has(tagName)) {
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
            // Helper to get main content element
            static getMainContent() {
                return document.getElementById('main-content');
            }

            // Helper to get scroll position (from main-content instead of window)
            static getScrollPosition() {
                const mainContent = Router.getMainContent();
                return mainContent ? mainContent.scrollTop : 0;
            }

            // Helper to set scroll position (on main-content instead of window)
            static setScrollPosition(scrollY) {
                const mainContent = Router.getMainContent();
                if (mainContent) {
                    mainContent.scrollTop = scrollY;
                }
            }

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
                
                // Ensure we have a valid path (default to Résumé if empty)
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

                // Trigger transition video fade in and wait for it to complete
                await this.showTransitionVideo();

                // Load main content (video is at full opacity during this)
                // Scroll to top on first load, otherwise don't scroll (breadcrumbs will handle it)
                const shouldScrollToTop = isFirstLoad;
                await this.loadMainContent(targetPath, shouldScrollToTop, sectionId);

                // Trigger transition video fade out after content loads and wait for it to complete
                await this.hideTransitionVideo();

                // Update history with path and scroll position
                const newUrl = `#!${targetPath}`;
                const scrollY = Router.getScrollPosition();
                window.history.pushState({ path: targetPath, scrollY }, '', newUrl);

                // Update breadcrumbs (add new breadcrumb with current scroll position)
                // Note: scroll position will be 0 if first load (we scrolled to top)
                const currentScrollY = Router.getScrollPosition();
                if (breadcrumbs) {
                    const title = breadcrumbs.generateTitle(targetPath);
                    breadcrumbs.add(targetPath, title, currentScrollY);
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
                        basePartial = 'Resume'; // Skills are shown on Résumé page
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
                if (!text) return '';
                // Handle slashes by converting them to -slash- for URL safety
                return text.toLowerCase().replace(/\//g, '-slash-').replace(/\s+/g, '-');
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
                    let html = `<article>`;
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
                        html += `<nav class="tags">`;
                        filteredProjects.forEach(project => {
                            html += `<a href="#!/projects/${project.slug}" class="tag">${this.escapeHtml(project.title)}</a>`;
                        });
                        html += `</nav>`;
                        html += `</section>`;
                    }
                    
                    if (filteredEvents.length > 0) {
                        html += `<section class="related">`;
                        html += `<h2>Timeline Events</h2>`;
                        html += `<nav class="tags">`;
                        filteredEvents.forEach(event => {
                            const eventDate = BDate.formatDate(event.date || 'Unknown');
                            html += `<a href="#!/timeline-events/${event.slug}" class="tag"><strong>${this.escapeHtml(event.title)}</strong> <em>(${this.escapeHtml(eventDate)})</em></a>`;
                        });
                        html += `</nav>`;
                        html += `</section>`;
                    }
                    
                    html += `</article>`;
                    
                    await this.createSectionFromHTML(html, sectionId, shouldScroll);
                } catch (e) {
                    console.error(`Error loading subdomain: ${e}`);
                }
            }

            async loadSkillset(slug, sectionId, shouldScroll) {
                try {
                    // Load all data files including skillsets.json
                    const [skillsetsRes, skillsRes, projectsRes, timelineRes] = await Promise.all([
                        fetch('data/skillsets.json'),
                        fetch('data/skills.json'),
                        fetch('data/projects.json'),
                        fetch('data/timeline-events.json')
                    ]);
                    
                    const [skillsets, skills, projects, timelineEvents] = await Promise.all([
                        skillsetsRes.json(),
                        skillsRes.json(),
                        projectsRes.json(),
                        timelineRes.json()
                    ]);
                    
                    // Find the skillset by slug
                    const skillset = skillsets.find(s => s.slug === slug);
                    if (!skillset) {
                        console.warn(`Skillset with slug "${slug}" not found`);
                        return;
                    }
                    
                    const skillsetName = skillset.title;
                    
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
                    
                    const totalCount = filteredSkills.length + filteredProjects.length + filteredEvents.length;
                    
                    // Create HTML for skillset page
                    let html = `<article>`;
                    html += `<h1>${this.escapeHtml(skillsetName)} <span>(${totalCount})</span></h1>`;
                    
                    if (skillset.description) {
                        html += `<p>${skillset.description}</p>`;
                    }
                    
                    if (filteredSkills.length > 0) {
                        html += `<section class="related">`;
                        html += `<h2>Skills</h2>`;
                        html += `<nav class="tags">`;
                        filteredSkills.forEach(skill => {
                            const level = (typeof skill.experience === 'number' && skill.experience >= 1 && skill.experience <= 5) ? skill.experience : '';
                            html += `<a href="#!/skills/${skill.slug}" class="tag"><b-xp level="${level}"></b-xp>${this.escapeHtml(skill.title)}</a>`;
                        });
                        html += `</nav>`;
                        html += `</section>`;
                    }
                    
                    if (filteredProjects.length > 0) {
                        html += `<section class="related">`;
                        html += `<h2>Projects</h2>`;
                        html += `<nav class="tags">`;
                        filteredProjects.forEach(project => {
                            html += `<a href="#!/projects/${project.slug}" class="tag">${this.escapeHtml(project.title)}</a>`;
                        });
                        html += `</nav>`;
                        html += `</section>`;
                    }
                    
                    if (filteredEvents.length > 0) {
                        html += `<section class="related">`;
                        html += `<h2>Timeline Events</h2>`;
                        html += `<nav class="tags">`;
                        filteredEvents.forEach(event => {
                            const eventDate = BDate.formatDate(event.date || 'Unknown');
                            html += `<a href="#!/timeline-events/${event.slug}" class="tag"><strong>${this.escapeHtml(event.title)}</strong> <em>(${this.escapeHtml(eventDate)})</em></a>`;
                        });
                        html += `</nav>`;
                        html += `</section>`;
                    }
                    
                    html += `</article>`;
                    
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
                    const domainLower = domain ? domain.toLowerCase() : '';
                    const dataDomainAttr = domainLower ? ` data-domain="${domainLower}"` : '';
                    
                    // Rebuild article tag with data-domain attribute
                    html = `<article${dataDomainAttr}>`;
                    
                    html += `<p><time>${startDate} - ${endDate}</time></p>`;
                    html += `<h1>${this.escapeHtml(item.title)}</h1>`;
                    if (item.description) {
                        html += `<p>${item.description}</p>`;
                    }
                    html += `<nav class="tags">`;
                    if (item.domain) {
                        html += `<span class="tag timeline-domain">${this.escapeHtml(item.domain)}</span>`;
                    }
                    if (item.subdomain) {
                        const subdomainLink = this.slugify(item.subdomain);
                        html += `<a href="#!/subdomains/${subdomainLink}" class="tag">${this.escapeHtml(item.subdomain)}</a>`;
                    }
                    if (item.skillsets && item.skillsets.length > 0) {
                        item.skillsets.forEach(skillset => {
                            const slug = skillset.toLowerCase().replace(/\s+/g, '-');
                            html += `<a href="#!/skillsets/${slug}" class="tag">${this.escapeHtml(skillset)}</a>`;
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
                        html += `<nav class="tags">`;
                        relatedEvents.forEach(event => {
                            const eventDate = BDate.formatDate(event.date || 'Unknown');
                            html += `<a href="#!/timeline-events/${event.slug}" class="tag"><strong>${this.escapeHtml(event.title)}</strong> <em>(${this.escapeHtml(eventDate)})</em></a>`;
                        });
                        html += `</nav>`;
                        html += `</section>`;
                    }
                } else if (jsonFile === 'skills.json') {
                    html += `<h1>${this.escapeHtml(item.title)}</h1>`;

                    // Skill experience and type indicator (detail view)
                    const levelValue = typeof item.experience === 'number' ? item.experience : null;
                    const typeValue = item.type === 'professional' || item.type === 'personal' ? item.type : null;
                    if (levelValue) {
                        const levelInt = Math.max(1, Math.min(5, levelValue));
                        let levelWord = 'Novice';
                        switch (levelInt) {
                            case 1: levelWord = 'Novice'; break;
                            case 2: levelWord = 'Moderate'; break;
                            case 3: levelWord = 'Average'; break;
                            case 4: levelWord = 'Expert'; break;
                            case 5: levelWord = 'Master'; break;
                        }
                        const typeLabel = typeValue ? (typeValue.charAt(0).toUpperCase() + typeValue.slice(1)) : '';
                        const stars = '★★★★★'.slice(0, levelInt) + '☆☆☆☆☆'.slice(0, 5 - levelInt);
                        html += `<h2 class="skill-xp"><span class="skill-xp-stars" aria-hidden="true">${stars}</span> · <span class="sr-only">${levelWord} skill level (${levelInt} of 5)${typeLabel ? ', ' + typeLabel : ''}. </span><span class="skill-xp-label">${levelWord}</span>${typeLabel ? `<span class="skill-xp-type"> · ${typeLabel}</span>` : ''}</h2>`;
                    }

                    if (item.description) {
                        html += `<p>${item.description}</p>`;
                    }
                    html += `<nav class="tags">`;
                    if (item.skillsets && item.skillsets.length > 0) {
                        item.skillsets.forEach(skillset => {
                            const slug = skillset.toLowerCase().replace(/\s+/g, '-');
                            html += `<a href="#!/skillsets/${slug}" class="tag">${this.escapeHtml(skillset)}</a>`;
                        });
                    }
                    html += `</nav>`;
                    
                    // Cross-links: Projects using the same skillsets and timeline events with this skill
                    const relatedProjects = projects.filter(p => 
                        p.skillsets && item.skillsets && 
                        p.skillsets.some(ps => item.skillsets.includes(ps))
                    );
                    const relatedEvents = timelineEvents.filter(e => 
                        e.skills && e.skills.some(es => es === item.title)
                    );
                    
                    if (relatedProjects.length > 0) {
                        html += `<section class="related">`;
                        html += `<h2>Projects using the same Skillsets</h2>`;
                        html += `<nav class="tags">`;
                        relatedProjects.forEach(project => {
                            html += `<a href="#!/projects/${project.slug}" class="tag">${this.escapeHtml(project.title)}</a>`;
                        });
                        html += `</nav>`;
                        html += `</section>`;
                    }
                    
                    if (relatedEvents.length > 0) {
                        html += `<section class="related">`;
                        html += `<h2>Timeline Events</h2>`;
                        html += `<nav class="tags">`;
                        relatedEvents.forEach(event => {
                            const eventDate = BDate.formatDate(event.date || 'Unknown');
                            html += `<a href="#!/timeline-events/${event.slug}" class="tag"><strong>${this.escapeHtml(event.title)}</strong> <em>(${this.escapeHtml(eventDate)})</em></a>`;
                        });
                        html += `</nav>`;
                        html += `</section>`;
                    }
                } else if (jsonFile === 'timeline-events.json') {
                    // Render as a bigger version of the timeline plate
                    const domain = item.domain || '';
                    const domainLower = domain ? domain.toLowerCase() : '';
                    const dataDomainAttr = domainLower ? ` data-domain="${domainLower}"` : '';
                    const subdomain = item.subdomain || '';
                    // Handle slashes in subdomain names
                    const subdomainLink = subdomain ? this.slugify(subdomain) : '';
                    const subdomainHtml = subdomain ? 
                        `<a href="#!/subdomains/${subdomainLink}" class="tag">${this.escapeHtml(subdomain)}</a>` : 
                        '';
                    
                    // Rebuild article tag with data-domain attribute
                    html = `<article${dataDomainAttr}>`;
                    
                    // Format date using BDate component
                    const formattedDate = BDate.formatDate(item.date || 'Unknown');
                    
                    html += `<time>${this.escapeHtml(formattedDate)}</time>`;
                    html += `<h1>${this.escapeHtml(item.title)}</h1>`;
                    if (item.description) {
                        html += `<p>${item.description}</p>`;
                    }
                    html += `<nav class="tags">`;
                    if (domain) {
                        html += `<span class="tag timeline-domain">${this.escapeHtml(domain)}</span>`;
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
                            html += `<a href="#!/projects/${relatedProject.slug}" class="tag">${this.escapeHtml(item.project)}</a>`;
                        } else {
                            html += `<span class="tag">${this.escapeHtml(item.project)}</span>`;
                        }
                    }
                    if (item.skillsets && item.skillsets.length > 0) {
                        item.skillsets.forEach(skillset => {
                            const slug = skillset.toLowerCase().replace(/\s+/g, '-');
                            html += `<a href="#!/skillsets/${slug}" class="tag">${this.escapeHtml(skillset)}</a>`;
                        });
                    }
                    if (item.skills && item.skills.length > 0) {
                        item.skills.forEach(skillName => {
                            const skill = skills.find(s => s.title === skillName);
                            if (skill) {
                                const level = (typeof skill.experience === 'number' && skill.experience >= 1 && skill.experience <= 5) ? skill.experience : '';
                                html += `<a href="#!/skills/${skill.slug}" class="tag"><b-xp level="${level}"></b-xp>${this.escapeHtml(skillName)}</a>`;
                            } else {
                                html += `<span class="tag">${this.escapeHtml(skillName)}</span>`;
                            }
                        });
                    }
                    html += `</nav>`;
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
                const scrollY = Router.getScrollPosition();
                
                // Clear existing content
                contentPane.innerHTML = '';
                
                // Temporarily set scroll position to top to prevent browser from trying to maintain position
                Router.setScrollPosition(0);
                        
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

                // Get the section element (either article or wrapper)
                const section = contentPane.querySelector(`#${sectionId}`) || 
                                contentPane.querySelector('article') || 
                                contentPane.firstElementChild;

                // Reload any components in the new content
                if (window.ComponentLoader && section) {
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
                    // For first load, scroll to top of main content
                    // For subsequent loads, breadcrumbs will handle scroll position
                    Router.setScrollPosition(0);
                }
            }

            async showTransitionVideo() {
                const transitionVideo = document.querySelector('#foregrounds .transition-video');
                if (transitionVideo) {
                    transitionVideo.classList.add('active');
                    // Wait for fade in to complete (200ms)
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }

            async hideTransitionVideo() {
                const transitionVideo = document.querySelector('#foregrounds .transition-video');
                if (transitionVideo) {
                    transitionVideo.classList.remove('active');
                    // Wait for fade out to complete (200ms)
                    await new Promise(resolve => setTimeout(resolve, 200));
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

        // Normalize a path for comparison
        function normalizePathForComparison(path) {
            let normalized = path;
            if (normalized.startsWith('#!')) {
                normalized = normalized.substring(2);
            } else if (normalized.startsWith('/')) {
                normalized = normalized.substring(1);
            } else if (normalized.startsWith('#')) {
                normalized = normalized.substring(1);
            }
            
            // Clean up path: remove leading/trailing slashes and normalize
            normalized = normalized.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');
            
            // Ensure we have a valid path (default to Résumé if empty)
            if (!normalized || normalized === '/') {
                normalized = 'Resume';
            }
            
            return normalized;
        }

        // Set up click handlers for #! links
        function setupLinkHandlers() {
            document.addEventListener('click', async (e) => {
                const link = e.target.closest('a[href^="#!"]');
                if (!link) return;
                
                const href = link.getAttribute('href');
                
                // Normalize both paths for comparison
                const targetPath = normalizePathForComparison(href);
                const currentPath = normalizePathForComparison(getCurrentPath());
                
                // Don't navigate if we're already on this page
                if (targetPath === currentPath) {
                    e.preventDefault();
                    return;
                }
                
                e.preventDefault();
                
                // Save current scroll position before navigation
                const scrollY = Router.getScrollPosition();
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
            return 'Resume'; // Default to Résumé
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
                
                // If no hash exists, default to Résumé
                if (!window.location.hash || !window.location.hash.startsWith('#!')) {
                    path = 'Resume'; // Path stays as 'Resume' to match filename
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
                path = 'Resume'; // Path stays as 'Resume' to match filename
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
            
            Router.setScrollPosition(scrollY);
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

    // Scroll main content when scrolling outside of it
    (function() {
        'use strict';

        function initScrollDelegation() {
            const mainContent = document.getElementById('main-content');
            if (!mainContent) {
                // Retry if main-content isn't ready yet
                setTimeout(initScrollDelegation, 100);
                return;
            }

            // List of scrollable elements that should handle their own scrolling
            const scrollableSelectors = [
                '#main-menu',
                '#situational-menu',
                '.card-list',
                '.link-list',
                '.timeline-container',
                'b-projects',
                'b-skillsets'
            ];

            function isInsideScrollableElement(element) {
                if (!element) return false;
                // Check if element or any ancestor is a scrollable element (excluding main-content)
                for (const selector of scrollableSelectors) {
                    const closest = element.closest ? element.closest(selector) : null;
                    if (closest) {
                        // Check if this element can actually scroll
                        const canScroll = closest.scrollHeight > closest.clientHeight;
                        if (canScroll) {
                            return true;
                        }
                    }
                }
                return false;
            }

            function isInsideMainContent(element) {
                if (!element) return false;
                return element === mainContent || (element.closest && element.closest('#main-content'));
            }

            document.addEventListener('wheel', function(e) {
                const target = e.target;
                
                // If we're inside a scrollable element (other than main-content), let it handle scrolling
                if (isInsideScrollableElement(target)) {
                    return; // Let the scrollable element handle it
                }
                
                // If we're inside main-content, let it handle its own scrolling naturally
                if (isInsideMainContent(target)) {
                    return; // Main-content will handle its own scroll
                }
                
                // Otherwise, we're outside any scrollable area - scroll main-content
                if (mainContent.scrollHeight > mainContent.clientHeight) {
                    e.preventDefault();
                    const deltaY = e.deltaY;
                    const currentScroll = mainContent.scrollTop;
                    const maxScroll = mainContent.scrollHeight - mainContent.clientHeight;
                    
                    // Calculate new scroll position
                    let newScroll = currentScroll + deltaY;
                    newScroll = Math.max(0, Math.min(newScroll, maxScroll));
                    
                    mainContent.scrollTop = newScroll;
                }
            }, { passive: false });
        }

        // Initialize scroll delegation when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initScrollDelegation);
        } else {
            initScrollDelegation();
        }
    })();
})();

