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
        this.render();
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
                        ${this.renderTimeline(filteredEvents)}
                    </div>
                </div>
            </div>
        `;

        this.attachFilterListeners();
        
        // Update timeline line height after render
        this.updateTimelineLineHeight();
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

    renderTimeline(events) {
        if (events.length === 0) {
            return '<p>No events match the selected filters.</p>';
        }

        return `
            <div class="timeline-line"></div>
            ${events.map((event, index) => this.renderEvent(event, index)).join('')}
        `;
    }

    renderEvent(event, index) {
        const date = event.date || 'Unknown';
        const domain = event.domain || '';
        const subdomain = event.subdomain || '';
        const project = event.project || '';
        const title = event.title || '';
        const description = event.description || '';
        
        return `
            <div class="timeline-event" data-domain="${domain.toLowerCase()}">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <div class="timeline-date">${date}</div>
                    ${title ? `<h3 class="timeline-title">${this.escapeHtml(title)}</h3>` : ''}
                    ${description ? `<div class="timeline-description">${this.escapeHtml(description)}</div>` : ''}
                    <div class="timeline-meta">
                        ${domain ? `<span class="timeline-domain">${this.escapeHtml(domain)}</span>` : ''}
                        ${subdomain ? `<span class="timeline-subdomain">${this.escapeHtml(subdomain)}</span>` : ''}
                        ${project ? `<span class="timeline-project">${this.escapeHtml(project)}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
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

