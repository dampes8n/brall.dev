/**
 * Projects Web Component
 * Loads and displays projects from JSON data
 */

class BProjects extends HTMLElement {
    constructor() {
        super();
        this.projects = [];
    }

    connectedCallback() {
        this.innerHTML = '<p>Loading projects...</p>';
        this.loadProjects();
    }

    async loadProjects() {
        try {
            const response = await fetch('data/projects.json');
            if (response.ok) {
                this.projects = await response.json();
                this.render();
            } else {
                this.innerHTML = '<p>Error loading projects.</p>';
            }
        } catch (e) {
            console.error('Error loading projects:', e);
            this.innerHTML = '<p>Error loading projects.</p>';
        }
    }

    render() {
        if (this.projects.length === 0) {
            this.innerHTML = '<p>Loading projects...</p>';
            return;
        }

        let html = '';
        
        this.projects.forEach(project => {
            html += `<article>`;
            html += `<h3><a href="#!/projects/${project.slug}">${this.escapeHtml(project.title)}</a></h3>`;
            
            if (project.description) {
                html += `<p>${this.escapeHtml(project.description)}</p>`;
            }
            
            // Format dates using BDate component
            const startDate = project.start ? BDate.formatDate(project.start) : 'Ongoing';
            const endDate = project.end ? BDate.formatDate(project.end) : 'Present';
            html += `<p><time>${startDate} - ${endDate}</time></p>`;
            
            // Metadata section with domain, subdomain, and skillsets
            if (project.domain || project.subdomain || (project.skillsets && project.skillsets.length > 0)) {
                html += `<nav class="metadata">`;
                if (project.domain) {
                    html += `<span class="timeline-domain">${this.escapeHtml(project.domain)}</span>`;
                }
                if (project.subdomain) {
                    const subdomainLink = this.slugify(project.subdomain);
                    html += `<a href="#!/subdomains/${subdomainLink}">${this.escapeHtml(project.subdomain)}</a>`;
                }
                if (project.skillsets && project.skillsets.length > 0) {
                    project.skillsets.forEach(skillset => {
                        const slug = this.slugify(skillset);
                        html += `<a href="#!/skillsets/${slug}">${this.escapeHtml(skillset)}</a>`;
                    });
                }
                html += `</nav>`;
            }
            
            html += `</article>`;
        });
        
        this.innerHTML = html;
        
        // Ensure components in the new HTML are loaded
        if (window.ComponentLoader) {
            window.ComponentLoader.find(this).forEach(comp => {
                window.ComponentLoader.load(comp).catch(() => {});
            });
        }
    }

    slugify(text) {
        return text.toLowerCase().replace(/\s+/g, '-');
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

}

customElements.define('b-projects', BProjects);

