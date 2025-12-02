/**
 * Timeline Web Component
 * Loads and displays timeline events from JSON data
 */

class BTimeline extends (window.BJsonLoader || HTMLElement) {
    constructor() {
        super();
        this.events = [];
        this.filters = {
            academic: true,
            employed: true,
            independent: false,
            personal: false,
            major: false
        };
    }

    connectedCallback() {
        // Read filter attributes
        this.filters.academic = this.hasAttribute('academic') ? 
            this.getAttribute('academic') !== 'false' : true;
        this.filters.employed = this.hasAttribute('employed') ? 
            this.getAttribute('employed') !== 'false' : true;
        this.filters.independent = this.hasAttribute('independent') ? 
            this.getAttribute('independent') !== 'false' : false;
        this.filters.personal = this.hasAttribute('personal') ? 
            this.getAttribute('personal') !== 'false' : false;
        
        // Check if major should be default selected
        const defaultMajor = this.hasAttribute('default-major');
        this.filters.major = defaultMajor || (this.hasAttribute('major') ? 
            this.getAttribute('major') !== 'false' : false);
        
        // Check if full-height mode is enabled
        this.fullHeight = this.hasAttribute('full-height');
        if (this.fullHeight) {
            this.classList.add('timeline-full-height');
        }
        
        // Pre-render the structure immediately to reserve space and prevent layout shift
        this.renderStructure();
        
        this.loadEvents();
    }
    
    renderStructure() {
        // Pre-render the timeline structure immediately to reserve space
        // This prevents layout shift when data loads
        if (!this.querySelector('.timeline-wrapper')) {
            this.innerHTML = `
                <div class="timeline-wrapper">
                    <div class="timeline-filters">
                        <h2>Filter by Domain</h2>
                        <div class="filter-controls">
                            <label><input type="checkbox" data-domain="academic" ${this.filters.academic ? 'checked' : ''}> <span class="filter-color academic"></span> Academic</label>
                            <label><input type="checkbox" data-domain="employed" ${this.filters.employed ? 'checked' : ''}> <span class="filter-color employed"></span> Employed</label>
                            <label><input type="checkbox" data-domain="independent" ${this.filters.independent ? 'checked' : ''}> <span class="filter-color independent"></span> Independent</label>
                            <label><input type="checkbox" data-domain="personal" ${this.filters.personal ? 'checked' : ''}> <span class="filter-color personal"></span> Personal</label>
                        </div>
                        <div class="filter-separator"></div>
                        <div class="filter-controls">
                            <label><input type="checkbox" data-domain="major" ${this.filters.major ? 'checked' : ''}> <span class="filter-major">★</span> Major</label>
                        </div>
                    </div>
                    <div class="timeline-content-area">
                        <div class="timeline-container">
                            <p>Loading timeline...</p>
                        </div>
                    </div>
                </div>
            `;
            
            // Attach filter listeners immediately
            this.attachFilterListeners();
        }
    }

    async loadEvents() {
        try {
            this.events = await this.loadJson('data/timeline-events.json', 'events');
            this.render();
        } catch (e) {
            this.showError('Error loading timeline events.');
        }
    }

    render() {
        if (this.events.length === 0) {
            // Ensure structure is rendered even if no events
            this.renderStructure();
            return;
        }

        // Check if we've already rendered the timeline structure
        const existingWrapper = this.querySelector('.timeline-wrapper');
        if (!existingWrapper) {
            // Structure should already be rendered in connectedCallback, but if not, render it now
            this.renderStructure();
        }

        // Render all events
        this.renderTimeline(this.events).then(html => {
            const container = this.querySelector('.timeline-container');
            if (container) {
                container.innerHTML = html;
                this.updateVisibility();
            }
        });
    }

    parseDate(dateStr) {
        // Handle various date formats
        if (!dateStr || dateStr === 'null') {
            // Return a very old date so null dates appear at the end when sorted newest first
            return new Date(0);
        }
        
        // Handle "YYYY-MM-DD", "YYYY-MM", "YYYY", "YYYY-early", "YYYY-mid", "YYYY-late", "YYYY-spring", "YYYY-summer", "YYYY-fall", "YYYY-winter"
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return new Date(parts[0], parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else if (parts.length === 2) {
            const part2 = parts[1].toLowerCase();
            if (part2 === 'early') {
                return new Date(parts[0], 0, 1);
            } else if (part2 === 'mid') {
                return new Date(parts[0], 5, 15);
            } else if (part2 === 'late') {
                return new Date(parts[0], 11, 15);
            } else if (part2 === 'spring') {
                return new Date(parts[0], 2, 21); // March 21 (vernal equinox)
            } else if (part2 === 'summer') {
                return new Date(parts[0], 5, 21); // June 21 (summer solstice)
            } else if (part2 === 'fall') {
                return new Date(parts[0], 8, 22); // September 22 (autumnal equinox)
            } else if (part2 === 'winter') {
                return new Date(parts[0], 11, 21); // December 21 (winter solstice)
            } else {
                // Try to parse as month number
                const month = parseInt(parts[1]);
                if (!isNaN(month)) {
                    return new Date(parts[0], month - 1, 1);
                }
                // Fallback to start of year
                return new Date(parts[0], 0, 1);
            }
        } else {
            return new Date(parts[0], 0, 1);
        }
    }

    async renderTimeline(events) {
        // Load projects once for all events
        let projects = [];
        try {
            projects = await this.loadJson('data/projects.json', 'projects');
        } catch (e) {
            console.warn('Failed to load projects for timeline:', e);
        }

        // Sort all events by date (newest first)
        const sortedEvents = [...events].sort((a, b) => {
            const dateA = this.parseDate(a.date);
            const dateB = this.parseDate(b.date);
            return dateB - dateA; // Reverse sort - newest first
        });

        // Render all events
        const eventHtmls = sortedEvents.map((event, index) => this.renderEvent(event, index, projects));

        return eventHtmls.join('');
    }

    renderEvent(event, index, projects = []) {
        const date = BDate.formatDate(event.date || 'Unknown');
        const domain = event.domain || '';
        const domainLower = domain.toLowerCase();
        const subdomain = event.subdomain || '';
        const project = event.project || '';
        const title = event.title || '';
        const slug = event.slug || '';
        const isMajor = event.major === true;
        
        // Create subdomain link
        const subdomainLink = subdomain ? this.slugify(subdomain) : '';
        const subdomainHtml = subdomain ? 
            `<a href="#!/subdomains/${subdomainLink}" class="tag">${this.escapeHtml(subdomain)}</a>` : 
            '';
        
        // Find project link if it exists
        let projectHtml = '';
        if (project) {
            const relatedProject = projects.find(p => 
                p.title && p.title.toLowerCase() === project.toLowerCase()
            );
            if (relatedProject) {
                projectHtml = `<a href="#!/projects/${relatedProject.slug}" class="tag">${this.escapeHtml(project)}</a>`;
            } else {
                projectHtml = `<span class="tag">${this.escapeHtml(project)}</span>`;
            }
        }
        
        // Create skillsets links (smaller than other tags)
        let skillsetsHtml = '';
        if (event.skillsets && event.skillsets.length > 0) {
            skillsetsHtml = event.skillsets.map(skillset => {
                const skillsetSlug = this.slugify(skillset);
                return `<a href="#!/skillsets/${skillsetSlug}" class="tag" style="font-size: 0.75rem;">${this.escapeHtml(skillset)}</a>`;
            }).join('');
        }
        
        const majorClass = isMajor ? ' timeline-event-major' : '';
        const markerContent = '<div class="timeline-marker-outer"></div><div class="timeline-marker-inner"></div>';
        const starPrefix = isMajor ? '<span class="timeline-title-star">★</span> ' : '';
        
        return `
            <div class="timeline-event domain-${domainLower}${majorClass}" data-domain="${domainLower}" data-major="${isMajor}">
                <div class="timeline-marker">
                    ${markerContent}
                </div>
                <div class="timeline-content">
                    <time>${date}</time>
                    ${title ? `<h3>${starPrefix}${slug ? `<a href="#!/timeline-events/${slug}">${this.escapeHtml(title)}</a>` : this.escapeHtml(title)}</h3>` : ''}
                    <nav class="tags">
                        ${domain ? `<span class="tag timeline-domain">${this.escapeHtml(domain)}</span>` : ''}
                        ${subdomainHtml}
                        ${projectHtml}
                    </nav>
                    ${skillsetsHtml ? `<nav class="tags">${skillsetsHtml}</nav>` : ''}
                </div>
            </div>
        `;
    }



    attachFilterListeners() {
        const checkboxes = this.querySelectorAll('input[type="checkbox"][data-domain]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const domain = e.target.getAttribute('data-domain');
                this.filters[domain] = e.target.checked;
                this.updateVisibility();
                this.updateTimelineLineHeight();
            });
        });
    }

    updateVisibility() {
        // Update visibility of all timeline events based on current filters
        const events = this.querySelectorAll('.timeline-event');
        events.forEach(event => {
            const domain = event.getAttribute('data-domain');
            const isMajor = event.getAttribute('data-major') === 'true';
            const domainVisible = this.filters[domain] || false;
            const majorFilterActive = this.filters.major;
            
            // Event is visible if:
            // 1. Domain filter matches AND
            // 2. Either major filter is off, OR major filter is on and event is major
            const isVisible = domainVisible && (!majorFilterActive || isMajor);
            
            if (isVisible) {
                // Remove hidden class
                event.classList.remove('timeline-event-hidden');
            } else {
                // Add hidden class
                event.classList.add('timeline-event-hidden');
            }
        });

        // Mark the last visible event so CSS can hide its line
        const visibleEvents = this.querySelectorAll('.timeline-event:not(.timeline-event-hidden)');
        events.forEach(event => event.classList.remove('timeline-last-visible'));
        if (visibleEvents.length > 0) {
            visibleEvents[visibleEvents.length - 1].classList.add('timeline-last-visible');
        }

        // Show/hide "no events" message
        const container = this.querySelector('.timeline-container');
        let noEventsMsg = container.querySelector('.no-events-message');
        
        if (visibleEvents.length === 0) {
            if (!noEventsMsg) {
                noEventsMsg = document.createElement('p');
                noEventsMsg.className = 'no-events-message';
                noEventsMsg.textContent = 'No events match the selected filters.';
                container.appendChild(noEventsMsg);
            }
        } else {
            if (noEventsMsg) {
                noEventsMsg.remove();
            }
        }
    }


    updateTimelineLineHeight() {
        // No longer needed - lines are managed by CSS
    }
}

customElements.define('b-timeline', BTimeline);

