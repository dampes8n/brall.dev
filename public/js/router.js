/**
 * Router.js - Handles hashbang routing (#!) for the portfolio site
 * Handles content loading, caching, and navigation
 */

(function() {
    'use strict';

    // Router class to handle content loading
    class Router {
        // Content cache: stores {html: string, timestamp: number}
        static contentCache = new Map();
        static CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

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

        // Cache helper methods
        static getCachedContent(path) {
            const cacheEntry = Router.contentCache.get(path);
            if (!cacheEntry) {
                return null;
            }

            // Check if cache has expired (older than 15 minutes)
            const age = Date.now() - cacheEntry.timestamp;
            if (age > Router.CACHE_DURATION) {
                Router.contentCache.delete(path);
                return null;
            }

            return cacheEntry.html;
        }

        static setCachedContent(path, html) {
            Router.contentCache.set(path, {
                html: html,
                timestamp: Date.now()
            });
        }

        static clearExpiredCache() {
            const now = Date.now();
            for (const [path, entry] of Router.contentCache.entries()) {
                if (now - entry.timestamp > Router.CACHE_DURATION) {
                    Router.contentCache.delete(path);
                }
            }
        }

        // Normalize path: remove hashbang/leading slashes, clean up, default to Resume
        static normalizePath(path) {
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

        // Fetch JSON data with JsonCache fallback
        static async fetchJson(url) {
            if (window.JsonCache) {
                return await window.JsonCache.fetch(url);
            } else {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${url}: ${response.status}`);
                }
                return await response.json();
            }
        }

        // Fetch multiple JSON files in parallel
        static async fetchMultipleJson(urls) {
            if (window.JsonCache) {
                return await Promise.all(urls.map(url => window.JsonCache.fetch(url)));
            } else {
                const responses = await Promise.all(urls.map(url => fetch(url)));
                return await Promise.all(responses.map(r => {
                    if (!r.ok) {
                        throw new Error(`Failed to fetch: ${r.status}`);
                    }
                    return r.json();
                }));
            }
        }

        // Check cache and render if available, return true if cached
        async renderFromCache(cacheKey, sectionId, shouldScroll) {
            const html = Router.getCachedContent(cacheKey);
            if (html) {
                console.log('[Router] Using cached content for:', cacheKey);
                await this.createSectionFromHTML(html, sectionId, shouldScroll);
                return true;
            }
            return false;
        }

        // Generate skillset slug from name
        static skillsetToSlug(skillset) {
            return skillset.toLowerCase().replace(/\s+/g, '-');
        }

        // Generate skillset link HTML
        skillsetLink(skillset) {
            const slug = Router.skillsetToSlug(skillset);
            return `<a href="#!/skillsets/${slug}" class="tag">${this.escapeHtml(skillset)}</a>`;
        }

        // Generate event link HTML with date
        eventLink(event) {
            const eventDate = BDate.formatDate(event.date || 'Unknown');
            return `<a href="#!/timeline-events/${event.slug}" class="tag"><strong>${this.escapeHtml(event.title)}</strong> <em>(${this.escapeHtml(eventDate)})</em></a>`;
        }

        // Generate project link HTML
        projectLink(project) {
            return `<a href="#!/projects/${project.slug}" class="tag">${this.escapeHtml(project.title)}</a>`;
        }

        // Generate skill link HTML with XP level
        skillLink(skill) {
            const level = (typeof skill.experience === 'number' && skill.experience >= 1 && skill.experience <= 5) ? skill.experience : '';
            return `<a href="#!/skills/${skill.slug}" class="tag"><b-xp level="${level}"></b-xp>${this.escapeHtml(skill.title)}</a>`;
        }

        // Generate a related section with tags
        renderRelatedSection(title, items, itemRenderer) {
            if (items.length === 0) return '';
            let html = `<section class="related">`;
            html += `<h2>${this.escapeHtml(title)}</h2>`;
            html += `<nav class="tags">`;
            items.forEach(item => {
                html += itemRenderer(item);
            });
            html += `</nav>`;
            html += `</section>`;
            return html;
        }

        async loadContent(path, shouldScroll = true) {
            // Normalize path
            const targetPath = Router.normalizePath(path);
            
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
            if (breadcrumbs && typeof breadcrumbs.generateTitle === 'function') {
                const title = breadcrumbs.generateTitle(targetPath);
                breadcrumbs.add(targetPath, title, currentScrollY);
            }

            // Update active state in main navigation
            this.updateActiveNavLink(targetPath);
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
                    await this.loadSkillset(slug, sectionId, shouldScroll, path);
                    return;
                } else if (type === 'subdomains') {
                    // Subdomains are special - they filter timeline events
                    await this.loadSubdomain(slug, sectionId, shouldScroll, path);
                    return;
                }
                
                if (basePartial && jsonFile) {
                    // Load the base partial and then find the item by slug
                    await this.loadDataItem(basePartial, jsonFile, slug, sectionId, shouldScroll, path);
                    return;
                }
            }
            
            // Default: load partial as before
            const contentPath = `partials/${path}.html`;
            
            // Check cache first
            if (await this.renderFromCache(path, sectionId, shouldScroll)) {
                return;
            }
            
            try {
                const response = await fetch(contentPath);
                if (response.ok) {
                    const html = await response.text();
                    // Cache the HTML
                    Router.setCachedContent(path, html);
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

        // Convert slug back to subdomain name (capitalize words, handle slashes)
        deslugifySubdomain(slug) {
            // First, restore slashes from -slash- encoding
            let subdomainName = slug.replace(/-slash-/g, '/');
            // Then split by remaining hyphens, but preserve slashes
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
            return subdomainName;
        }

        async loadSubdomain(slug, sectionId, shouldScroll, cacheKey) {
            // Use provided path as cache key, or construct from slug
            if (!cacheKey) {
                cacheKey = `subdomains/${slug}`;
            }
            
            // Check cache first
            if (await this.renderFromCache(cacheKey, sectionId, shouldScroll)) {
                return;
            }
            
            try {
                // Convert slug back to subdomain name
                const subdomainName = this.deslugifySubdomain(slug);
                
                // Load data files
                const [timelineEvents, allProjects] = await Router.fetchMultipleJson([
                    'data/timeline-events.json',
                    'data/projects.json'
                ]);
                
                // Filter by subdomain
                const filteredEvents = timelineEvents.filter(e => 
                    e.subdomain && e.subdomain === subdomainName
                );
                const filteredProjects = allProjects.filter(p => 
                    p.subdomain && p.subdomain === subdomainName
                );
                
                // Create HTML for subdomain page
                let html = `<article>`;
                html += `<h1>${this.escapeHtml(subdomainName)}</h1>`;
                html += this.renderRelatedSection('Projects', filteredProjects, p => this.projectLink(p));
                html += this.renderRelatedSection('Timeline Events', filteredEvents, e => this.eventLink(e));
                html += `</article>`;
                
                // Cache the generated HTML
                Router.setCachedContent(cacheKey, html);
                
                await this.createSectionFromHTML(html, sectionId, shouldScroll);
            } catch (e) {
                console.error(`Error loading subdomain: ${e}`);
            }
        }

        async loadSkillset(slug, sectionId, shouldScroll, cacheKey) {
            // Use provided path as cache key, or construct from slug
            if (!cacheKey) {
                cacheKey = `skillsets/${slug}`;
            }
            
            // Check cache first
            if (await this.renderFromCache(cacheKey, sectionId, shouldScroll)) {
                return;
            }
            
            try {
                // Load all data files
                const [skillsets, skills, projects, timelineEvents] = await Router.fetchMultipleJson([
                    'data/skillsets.json',
                    'data/skills.json',
                    'data/projects.json',
                    'data/timeline-events.json'
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
                
                // Create HTML for skillset page
                let html = `<article>`;
                html += `<h1>${this.escapeHtml(skillsetName)}</h1>`;
                
                if (skillset.description) {
                    html += `<p>${skillset.description}</p>`;
                }
                
                html += this.renderRelatedSection('Skills', filteredSkills, s => this.skillLink(s));
                html += this.renderRelatedSection('Projects', filteredProjects, p => this.projectLink(p));
                html += this.renderRelatedSection('Timeline Events', filteredEvents, e => this.eventLink(e));
                
                html += `</article>`;
                
                // Cache the generated HTML
                Router.setCachedContent(cacheKey, html);
                
                await this.createSectionFromHTML(html, sectionId, shouldScroll);
            } catch (e) {
                console.error(`Error loading skillset: ${e}`);
            }
        }

        async loadDataItem(basePartial, jsonFile, slug, sectionId, shouldScroll, cacheKey) {
            // Use the provided path as cache key, or construct it from jsonFile and slug
            if (!cacheKey) {
                cacheKey = `${jsonFile.replace('.json', '')}/${slug}`;
            }
            
            // Check cache first
            if (await this.renderFromCache(cacheKey, sectionId, shouldScroll)) {
                return;
            }
            
            try {
                // Load the JSON data
                const jsonPath = `data/${jsonFile}`;
                let items;
                try {
                    items = await Router.fetchJson(jsonPath);
                } catch (error) {
                    console.warn(`JSON file not found: ${jsonPath}`);
                    return;
                }
                
                const item = items.find(i => i.slug === slug);
                
                if (!item) {
                    console.warn(`Item with slug "${slug}" not found in ${jsonFile}`);
                    return;
                }
                
                // Create HTML for the item (already includes article)
                const html = await this.renderDataItem(item, jsonFile);
                
                // Cache the generated HTML
                Router.setCachedContent(cacheKey, html);
                
                await this.createSectionFromHTML(html, sectionId, shouldScroll);
            } catch (e) {
                console.error(`Error loading data item: ${e}`);
            }
        }

        async renderDataItem(item, jsonFile) {
            // Load all data for cross-linking
            let skills, projects, timelineEvents;
            try {
                [skills, projects, timelineEvents] = await Router.fetchMultipleJson([
                    'data/skills.json',
                    'data/projects.json',
                    'data/timeline-events.json'
                ]);
            } catch (e) {
                // If any fail, use empty arrays
                skills = [];
                projects = [];
                timelineEvents = [];
            }
            
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
                        html += this.skillsetLink(skillset);
                    });
                }
                html += `</nav>`;
                
                // Cross-links: Related timeline events
                const relatedEvents = timelineEvents.filter(e => 
                    e.project && e.project.toLowerCase() === item.title.toLowerCase()
                );
                html += this.renderRelatedSection('Related Timeline Events', relatedEvents, e => this.eventLink(e));
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
                        html += this.skillsetLink(skillset);
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
                
                html += this.renderRelatedSection('Projects using the same Skillsets', relatedProjects, p => this.projectLink(p));
                html += this.renderRelatedSection('Timeline Events', relatedEvents, e => this.eventLink(e));
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
                        html += this.skillsetLink(skillset);
                    });
                }
                if (item.skills && item.skills.length > 0) {
                    item.skills.forEach(skillName => {
                        const skill = skills.find(s => s.title === skillName);
                        if (skill) {
                            html += this.skillLink(skill);
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
                let pageTitle = path.split('-').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ');
                // Special case: History -> Timeline
                if (pageTitle.toLowerCase() === 'history') {
                    pageTitle = 'Timeline';
                }
                newTitle = `${pageTitle} - Will Brall's Portfolio`;
            }
            
            console.log('[Router] Updating title:', newTitle, 'for path:', path);
            document.title = newTitle;
        }

        updateActiveNavLink(path) {
            const mainMenu = document.getElementById('main-menu');
            if (!mainMenu) return;

            const normalizedPath = Router.normalizePath(path);
            const links = mainMenu.querySelectorAll('a[href^="#!"]');
            
            // Remove active class from all links
            links.forEach(link => {
                link.classList.remove('active');
            });
            
            // Find and mark the matching link as active
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href) {
                    const linkPath = Router.normalizePath(href);
                    const pathLower = normalizedPath.toLowerCase();
                    const linkPathLower = linkPath.toLowerCase();
                    
                    // Match exact path or parent path (e.g., "projects/something" matches "Projects")
                    if (linkPathLower === pathLower || 
                        (normalizedPath.includes('/') && pathLower.startsWith(linkPathLower + '/'))) {
                        link.classList.add('active');
                    }
                }
            });
        }

    }

    // Normalize a path for comparison (uses Router.normalizePath)
    function normalizePathForComparison(path) {
        return Router.normalizePath(path);
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
            
            // Update current page's history state with scroll position before navigating away
            // This ensures the back button can restore the correct scroll position
            const currentState = window.history.state || { path: currentPath };
            window.history.replaceState(
                { ...currentState, path: currentPath, scrollY },
                '',
                window.location.hash || window.location.href
            );
            
            const router = new Router();
            await router.loadContent(href, true);
        });
    }

        // Save scroll position for current path
        function saveScrollPosition(path, scrollY) {
            const breadcrumbs = document.querySelector('b-breadcrumbs');
            if (breadcrumbs && typeof breadcrumbs.generateTitle === 'function' && typeof breadcrumbs.normalizePath === 'function') {
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
        
        // Normalize path
        path = Router.normalizePath(path);
        
        // Get scroll position from breadcrumbs (same as recently viewed links)
        const breadcrumbs = document.querySelector('b-breadcrumbs');
        const scrollY = breadcrumbs ? breadcrumbs.getScrollPosition(path) : 0;
        
        // Load content without scrolling (we'll restore scroll position)
        const router = new Router();
        await router.loadContent(path, false);
        
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

    // Set up link handlers and load initial content (defer non-critical router work)
    function initRouter() {
        setupLinkHandlers();
        loadInitialContent();
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Setup link handlers immediately (needed for navigation)
            setupLinkHandlers();
            // Defer initial content loading until idle
            if (window.requestIdleCallback) {
                requestIdleCallback(() => {
                    loadInitialContent();
                }, { timeout: 1000 });
            } else {
                // Fallback: small delay
                setTimeout(loadInitialContent, 50);
            }
        });
    } else {
        setupLinkHandlers();
        if (window.requestIdleCallback) {
            requestIdleCallback(() => {
                loadInitialContent();
            }, { timeout: 1000 });
        } else {
            setTimeout(loadInitialContent, 50);
        }
    }

    // Export Router for use elsewhere
    window.Router = Router;
})();

