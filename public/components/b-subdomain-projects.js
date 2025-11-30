/**
 * Subdomain Projects Web Component
 * Loads and displays projects for a specific subdomain
 */

class BSubdomainProjects extends (window.BJsonLoader || HTMLElement) {
    constructor() {
        super();
        this.projects = [];
        this.subdomain = null;
    }

    connectedCallback() {
        this.subdomain = this.getAttribute('subdomain');
        if (this.subdomain) {
            this.loadProjects();
        }
    }

    async loadProjects() {
        try {
            const allProjects = await this.loadJson('data/projects.json', 'projects');
            // Filter projects by subdomain
            this.projects = allProjects.filter(project => 
                project.subdomain && project.subdomain === this.subdomain
            );
            this.render();
        } catch (e) {
            this.showError('Error loading projects.');
        }
    }

    render() {
        if (this.projects.length === 0) {
            this.innerHTML = '<p>No projects found for this subdomain.</p>';
            return;
        }

        // Sort projects by start date (newest first)
        const sortedProjects = [...this.projects].sort((a, b) => {
            const startA = a.start || '';
            const startB = b.start || '';
            
            // Projects without dates go to the end
            if (!startA && !startB) return 0;
            if (!startA) return 1;
            if (!startB) return -1;
            
            return startB.localeCompare(startA);
        });

        let html = '';
        
        sortedProjects.forEach(project => {
            html += `<div class="project-item">`;
            html += `<a href="#!/projects/${project.slug}">${this.escapeHtml(project.title)}</a>`;
            
            if (project.description) {
                html += `<p class="project-description">${project.description}</p>`;
            }
            
            if (project.start || project.end) {
                // Format dates using BDate component
                const startDate = project.start ? BDate.formatDate(project.start) : 'Ongoing';
                const endDate = project.end ? BDate.formatDate(project.end) : 'Present';
                html += `<p class="project-dates">${this.escapeHtml(startDate)} - ${this.escapeHtml(endDate)}</p>`;
            }
            
            html += `</div>`;
        });
        
        this.innerHTML = html;
    }
}

customElements.define('b-subdomain-projects', BSubdomainProjects);

