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

        let html = '';
        
        this.projects.forEach(project => {
            const domainLower = project.domain ? project.domain.toLowerCase() : '';
            const dataDomainAttr = domainLower ? ` data-domain="${domainLower}"` : '';
            html += `<article${dataDomainAttr}>`;
            html += `<h3><a href="#!/projects/${project.slug}">${this.escapeHtml(project.title)}</a></h3>`;
            
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
        this.loadComponents();
    }

}

customElements.define('b-projects', BProjects);

