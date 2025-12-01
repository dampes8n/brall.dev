/**
 * Projects Web Component
 * Loads and displays projects from JSON data
 */

class BProjects extends (window.BJsonLoader || HTMLElement) {
    constructor() {
        super();
        this.projects = [];
    }

    connectedCallback() {
        // Check if full-height mode is enabled
        this.fullHeight = this.hasAttribute('full-height');
        if (this.fullHeight) {
            this.classList.add('projects-full-height');
        }
        
        // Check if priority-based sorting should be used
        this.usePriority = this.hasAttribute('use-priority');
        
        this.showLoading('Loading projects...');
        this.loadProjects();
    }

    async loadProjects() {
        try {
            this.projects = await this.loadJson('data/projects.json', 'projects');
            this.render();
        } catch (e) {
            this.showError('Error loading projects.');
        }
    }

    render() {
        if (this.projects.length === 0) {
            this.showLoading('Loading projects...');
            return;
        }

        // Sort projects based on whether priority sorting is enabled
        let sortedProjects;
        if (this.usePriority) {
            // Priority-based sorting: projects with priority come first, sorted by priority (lower number = higher priority)
            // Then projects without priority follow, sorted by domain and start date
            sortedProjects = [...this.projects].sort((a, b) => {
                const priorityA = a.priority !== undefined ? a.priority : 999999;
                const priorityB = b.priority !== undefined ? b.priority : 999999;
                
                if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                }
                
                // If both have same priority (or both don't have priority), fall back to domain/date sorting
                const domainOrder = { 'Independent': 1, 'Employed': 2, 'Personal': 3 };
                const domainA = domainOrder[a.domain] || 999;
                const domainB = domainOrder[b.domain] || 999;
                
                if (domainA !== domainB) {
                    return domainA - domainB;
                }
                
                // Within same domain, sort by start date (newest first)
                const startA = a.start || '';
                const startB = b.start || '';
                
                // Projects without dates go to the end
                if (!startA && !startB) return 0;
                if (!startA) return 1;
                if (!startB) return -1;
                
                return startB.localeCompare(startA);
            });
        } else {
            // Default sorting: first by domain (Independent, Employed, Personal), then by start date (newest first)
            const domainOrder = { 'Independent': 1, 'Employed': 2, 'Personal': 3 };
            sortedProjects = [...this.projects].sort((a, b) => {
                const domainA = domainOrder[a.domain] || 999;
                const domainB = domainOrder[b.domain] || 999;
                
                if (domainA !== domainB) {
                    return domainA - domainB;
                }
                
                // Within same domain, sort by start date (newest first)
                const startA = a.start || '';
                const startB = b.start || '';
                
                // Projects without dates go to the end
                if (!startA && !startB) return 0;
                if (!startA) return 1;
                if (!startB) return -1;
                
                return startB.localeCompare(startA);
            });
        }

        let html = '';
        
        sortedProjects.forEach(project => {
            const domainLower = project.domain ? project.domain.toLowerCase() : '';
            const dataDomainAttr = domainLower ? ` data-domain="${domainLower}"` : '';
            html += `<article${dataDomainAttr}>`;
            html += `<h3><a href="#!/projects/${project.slug}">${this.escapeHtml(project.title)}</a></h3>`;
            
            // Format dates using BDate component
            const startDate = project.start ? BDate.formatDate(project.start) : 'Ongoing';
            const endDate = project.end ? BDate.formatDate(project.end) : 'Present';
            html += `<p><time>${startDate} - ${endDate}</time></p>`;
            
            // Tags section with domain, subdomain, and skillsets
            if (project.domain || project.subdomain || (project.skillsets && project.skillsets.length > 0)) {
                html += `<nav class="tags">`;
                if (project.domain) {
                    html += `<span class="tag timeline-domain">${this.escapeHtml(project.domain)}</span>`;
                }
                if (project.subdomain) {
                    const subdomainLink = this.slugify(project.subdomain);
                    html += `<a href="#!/subdomains/${subdomainLink}" class="tag">${this.escapeHtml(project.subdomain)}</a>`;
                }
                if (project.skillsets && project.skillsets.length > 0) {
                    project.skillsets.forEach(skillset => {
                        const slug = this.slugify(skillset);
                        html += `<a href="#!/skillsets/${slug}" class="tag">${this.escapeHtml(skillset)}</a>`;
                    });
                }
                html += `</nav>`;
            }
            
            html += `</article>`;
        });
        
        this.innerHTML = html;
        this.loadComponents();
    }

}

customElements.define('b-projects', BProjects);

