/**
 * Timeline Web Component
 * Loads and displays timeline events from JSON data
 */

class BTimeline extends HTMLElement {
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
        
        this.loadEvents();
    }

    async loadEvents() {
        try {
            const response = await fetch('data/timeline-events.json');
            if (response.ok) {
                this.events = await response.json();
                this.render();
            } else {
                this.innerHTML = '<p>Error loading timeline events.</p>';
            }
        } catch (e) {
            console.error('Error loading timeline:', e);
            this.innerHTML = '<p>Error loading timeline events.</p>';
        }
    }

    render() {
        if (this.events.length === 0) {
            this.innerHTML = '<p>Loading timeline...</p>';
            return;
        }

        const filteredEvents = this.getFilteredEvents();
        
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

        // Attach filter listeners immediately (they're on the wrapper, not the container)
        this.attachFilterListeners();

        // Render timeline asynchronously
        this.renderTimeline(filteredEvents).then(html => {
            const container = this.querySelector('.timeline-container');
            if (container) {
                container.innerHTML = html;
                this.updateTimelineLineHeight();
            }
        });
    }

    getFilteredEvents() {
        return this.events
            .filter(e => {
                const domain = e.domain?.toLowerCase() || '';
                return this.filters[domain];
            })
            .sort((a, b) => {
                const dateA = this.parseDate(a.date);
                const dateB = this.parseDate(b.date);
                return dateB - dateA; // Reverse sort - newest first
            });
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
        if (events.length === 0) {
            return '<p>No events match the selected filters.</p>';
        }

        // Load projects once for all events
        let projects = [];
        try {
            const projectsRes = await fetch('data/projects.json');
            projects = await projectsRes.json();
        } catch (e) {
            console.warn('Failed to load projects for timeline:', e);
        }

        // Render events
        const eventHtmls = events.map((event, index) => this.renderEvent(event, index, projects));

        return `
            <div class="timeline-line"></div>
            ${eventHtmls.join('')}
        `;
    }

    renderEvent(event, index, projects = []) {
        const date = this.formatDate(event.date || 'Unknown');
        const domain = event.domain || '';
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
            <div class="timeline-event" data-domain="${domain.toLowerCase()}">
                <div class="timeline-marker"></div>
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

    formatDate(dateStr) {
        if (!dateStr || dateStr === 'Unknown' || dateStr === 'null') {
            return 'Unknown';
        }
        
        // Handle various date formats: "YYYY-MM-DD", "YYYY-MM", "YYYY", "YYYY-early", "YYYY-mid", "YYYY-late"
        const parts = dateStr.split('-');
        const year = parts[0];
        
        if (parts.length === 3) {
            // YYYY-MM-DD -> July 5th, 2008
            const month = parseInt(parts[1]) - 1;
            const day = parseInt(parts[2]);
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                              'July', 'August', 'September', 'October', 'November', 'December'];
            const daySuffix = this.getDaySuffix(day);
            return `${monthNames[month]} ${day}${daySuffix}, ${year}`;
        } else if (parts.length === 2) {
            if (parts[1] === 'early') {
                return `Early ${year}`;
            } else if (parts[1] === 'mid') {
                return `Mid ${year}`;
            } else if (parts[1] === 'late') {
                return `Late ${year}`;
            } else {
                // YYYY-MM -> July, 2008
                const month = parseInt(parts[1]) - 1;
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                                  'July', 'August', 'September', 'October', 'November', 'December'];
                return `${monthNames[month]}, ${year}`;
            }
        } else {
            // YYYY -> 2008
            return year;
        }
    }

    getDaySuffix(day) {
        if (day >= 11 && day <= 13) {
            return 'th';
        }
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    }

    slugify(text) {
        // Handle slashes by converting them to -slash- for URL safety
        return text.toLowerCase().replace(/\//g, '-slash-').replace(/\s+/g, '-');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    attachFilterListeners() {
        const checkboxes = this.querySelectorAll('input[type="checkbox"][data-domain]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const domain = e.target.getAttribute('data-domain');
                this.filters[domain] = e.target.checked;
                this.render();
                this.updateTimelineLineHeight();
            });
        });
    }

    updateTimelineLineHeight() {
        // Wait for layout to complete
        requestAnimationFrame(() => {
            const container = this.querySelector('.timeline-container');
            const line = this.querySelector('.timeline-line');
            if (container && line) {
                const events = container.querySelectorAll('.timeline-event');
                if (events.length > 0) {
                    const firstEvent = events[0];
                    const lastEvent = events[events.length - 1];
                    const firstMarker = firstEvent.querySelector('.timeline-marker');
                    const lastMarker = lastEvent.querySelector('.timeline-marker');
                    
                    if (firstMarker && lastMarker) {
                        // Get positions relative to the container (offsetTop is relative to offsetParent)
                        // Since markers are positioned absolutely within events, we need to calculate differently
                        const firstEventRect = firstEvent.getBoundingClientRect();
                        const lastEventRect = lastEvent.getBoundingClientRect();
                        const containerRect = container.getBoundingClientRect();
                        const firstMarkerRect = firstMarker.getBoundingClientRect();
                        const lastMarkerRect = lastMarker.getBoundingClientRect();
                        
                        // Calculate positions relative to container
                        const firstMarkerCenter = firstMarkerRect.top - containerRect.top + (firstMarkerRect.height / 2);
                        const lastMarkerCenter = lastMarkerRect.top - containerRect.top + (lastMarkerRect.height / 2);
                        
                        // Set line to start at first marker center and end at last marker center
                        line.style.top = `${firstMarkerCenter}px`;
                        line.style.height = `${lastMarkerCenter - firstMarkerCenter}px`;
                    }
                } else {
                    line.style.top = '0';
                    line.style.height = '0';
                }
            }
        });
    }
}

customElements.define('b-timeline', BTimeline);

