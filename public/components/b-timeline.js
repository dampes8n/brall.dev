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
            personal: false
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
        
        // Check if full-height mode is enabled
        this.fullHeight = this.hasAttribute('full-height');
        if (this.fullHeight) {
            this.classList.add('timeline-full-height');
        }
        
        this.loadEvents();
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
            this.innerHTML = '<p>Loading timeline...</p>';
            return;
        }

        // Check if we've already rendered the timeline structure
        const existingWrapper = this.querySelector('.timeline-wrapper');
        if (!existingWrapper) {
            // First render - create the structure
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
                    </div>
                    <div class="timeline-content-area">
                        <div class="timeline-container">
                            <p>Loading timeline...</p>
                        </div>
                    </div>
                </div>
            `;

            // Attach filter listeners
            this.attachFilterListeners();

            // Render all events once
            this.renderTimeline(this.events).then(html => {
                const container = this.querySelector('.timeline-container');
                if (container) {
                    container.innerHTML = html;
                    this.updateVisibility();
                }
            });
        } else {
            // Just update visibility based on current filters
            this.updateVisibility();
            this.updateTimelineLineHeight();
        }
    }

    parseDate(dateStr) {
        // Handle various date formats
        if (!dateStr || dateStr === 'null') {
            // Return a very old date so null dates appear at the end when sorted newest first
            return new Date(0);
        }
        
        // Handle "YYYY-MM-DD", "YYYY-MM", "YYYY", "YYYY-early", "YYYY-mid", "YYYY-late"
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return new Date(parts[0], parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else if (parts.length === 2) {
            if (parts[1] === 'early') {
                return new Date(parts[0], 0, 1);
            } else if (parts[1] === 'mid') {
                return new Date(parts[0], 5, 15);
            } else if (parts[1] === 'late') {
                return new Date(parts[0], 11, 15);
            } else {
                return new Date(parts[0], parseInt(parts[1]) - 1, 1);
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
        
        // Create subdomain link
        const subdomainLink = subdomain ? this.slugify(subdomain) : '';
        const subdomainHtml = subdomain ? 
            `<a href="#!/subdomains/${subdomainLink}" class="timeline-subdomain">${this.escapeHtml(subdomain)}</a>` : 
            '';
        
        // Find project link if it exists
        let projectHtml = '';
        if (project) {
            const relatedProject = projects.find(p => 
                p.title && p.title.toLowerCase() === project.toLowerCase()
            );
            if (relatedProject) {
                projectHtml = `<a href="#!/projects/${relatedProject.slug}" class="timeline-project">${this.escapeHtml(project)}</a>`;
            } else {
                projectHtml = `<span class="timeline-project">${this.escapeHtml(project)}</span>`;
            }
        }
        
        return `
            <div class="timeline-event domain-${domainLower}" data-domain="${domainLower}">
                <div class="timeline-marker">
                    <div class="timeline-marker-outer"></div>
                    <div class="timeline-marker-inner"></div>
                </div>
                <div class="timeline-content">
                    <time>${date}</time>
                    ${title ? `<h3>${slug ? `<a href="#!/timeline-events/${slug}">${this.escapeHtml(title)}</a>` : this.escapeHtml(title)}</h3>` : ''}
                    <nav class="metadata">
                        ${domain ? `<span class="timeline-domain">${this.escapeHtml(domain)}</span>` : ''}
                        ${subdomainHtml}
                        ${projectHtml}
                    </nav>
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
            const isVisible = this.filters[domain] || false;
            
            if (isVisible) {
                // Remove hidden class and restore height
                event.classList.remove('timeline-event-hidden');
                // Set explicit height for smooth transition
                if (!event.style.height || event.style.height === '0px') {
                    event.style.height = '';
                    // Force reflow to get natural height
                    void event.offsetHeight;
                    const naturalHeight = event.scrollHeight;
                    event.style.height = `${naturalHeight}px`;
                }
            } else {
                // Store current height before hiding
                if (!event.classList.contains('timeline-event-hidden')) {
                    const currentHeight = event.scrollHeight;
                    event.style.height = `${currentHeight}px`;
                    // Force reflow
                    void event.offsetHeight;
                }
                event.classList.add('timeline-event-hidden');
                // Set to 0 after a brief moment to allow transition
                requestAnimationFrame(() => {
                    event.style.height = '0px';
                });
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

