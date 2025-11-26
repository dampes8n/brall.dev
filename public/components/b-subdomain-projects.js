/**
 * Subdomain Projects Web Component
 * Loads and displays projects for a specific subdomain
 */

class BSubdomainProjects extends HTMLElement {
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
            const response = await fetch('data/projects.json');
            if (response.ok) {
                const allProjects = await response.json();
                // Filter projects by subdomain
                this.projects = allProjects.filter(project => 
                    project.subdomain && project.subdomain === this.subdomain
                );
                this.render();
            } else {
                this.innerHTML = '<p>Error loading projects.</p>';
            }
        } catch (e) {
            console.error('Error loading subdomain projects:', e);
            this.innerHTML = '<p>Error loading projects.</p>';
        }
    }

    render() {
        if (this.projects.length === 0) {
            this.innerHTML = '<p>No projects found for this subdomain.</p>';
            return;
        }

        let html = '';
        
        this.projects.forEach(project => {
            html += `<div class="project-item">`;
            html += `<a href="#!/projects/${project.slug}">${this.escapeHtml(project.title)}</a>`;
            
            if (project.description) {
                html += `<p class="project-description">${this.escapeHtml(project.description)}</p>`;
            }
            
            if (project.start || project.end) {
                html += `<p class="project-dates">${this.escapeHtml(project.start || 'Ongoing')} - ${this.escapeHtml(project.end || 'Present')}</p>`;
            }
            
            html += `</div>`;
        });
        
        this.innerHTML = html;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

customElements.define('b-subdomain-projects', BSubdomainProjects);

