/**
 * Skillsets Web Component
 * Loads and displays skillsets with their associated skills
 */

class BSkillsets extends (window.BJsonLoader || HTMLElement) {
    constructor() {
        super();
        this.skills = [];
        this.projects = [];
        this.timelineEvents = [];
        this.skillsets = [];
    }

    connectedCallback() {
        // Check if full-height mode is enabled
        this.fullHeight = this.hasAttribute('full-height');
        if (this.fullHeight) {
            this.classList.add('skillsets-full-height');
        }
        
        this.loadData();
    }

    async loadData() {
        try {
            const data = await this.loadMultipleJson({
                skills: 'data/skills.json',
                projects: 'data/projects.json',
                timelineEvents: 'data/timeline-events.json'
            });
            
            this.skills = data.skills;
            this.projects = data.projects;
            this.timelineEvents = data.timelineEvents;
            this.render();
        } catch (e) {
            this.showError('Error loading skillsets data.');
        }
    }

    render() {
        if (this.skills.length === 0) {
            this.innerHTML = '<p>Loading skillsets...</p>';
            return;
        }

        // Extract all unique skillsets
        const skillsetsSet = new Set();
        this.skills.forEach(skill => {
            if (skill.skillsets) {
                skill.skillsets.forEach(ss => skillsetsSet.add(ss));
            }
        });
        this.projects.forEach(project => {
            if (project.skillsets) {
                project.skillsets.forEach(ss => skillsetsSet.add(ss));
            }
        });
        this.timelineEvents.forEach(event => {
            if (event.skillsets) {
                event.skillsets.forEach(ss => skillsetsSet.add(ss));
            }
        });
        
        const skillsets = Array.from(skillsetsSet).sort();
        
        let html = '';
        
        // Group skills by skillset
        skillsets.forEach(skillset => {
            const slug = this.slugify(skillset);
            
            // Count skills in this skillset (only counting skills since that's what we display)
            const skillsInSkillset = this.skills.filter(skill => 
                skill.skillsets && skill.skillsets.includes(skillset)
            );
            const skillsCount = skillsInSkillset.length;
            
            html += `<div class="skillset-group">`;
            html += `<h3><a href="#!/skillsets/${slug}">${this.escapeHtml(skillset)} <span>(${skillsCount})</span></a></h3>`;
            
            if (skillsInSkillset.length > 0) {
                // Sort skills: first by experience level (descending - Master first), then alphabetically
                const sortedSkills = skillsInSkillset.sort((a, b) => {
                    const aExp = (typeof a.experience === 'number' && a.experience >= 1 && a.experience <= 5) ? a.experience : 0;
                    const bExp = (typeof b.experience === 'number' && b.experience >= 1 && b.experience <= 5) ? b.experience : 0;
                    // First sort by experience (descending)
                    if (bExp !== aExp) {
                        return bExp - aExp;
                    }
                    // Then sort alphabetically by title
                    return (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' });
                });
                
                // Font size scaling based on experience (1-5)
                const minSize = 0.9; // rem (Novice)
                const maxSize = 1.8; // rem (Master)
                
                html += `<div class="tags">`;
                sortedSkills.forEach(skill => {
                    const level = (typeof skill.experience === 'number' && skill.experience >= 1 && skill.experience <= 5) ? skill.experience : 1;
                    // Calculate font size based on experience level (1-5 maps to minSize-maxSize)
                    const ratio = (level - 1) / 4; // 0 for level 1, 1 for level 5
                    const fontSize = minSize + (ratio * (maxSize - minSize));
                    html += `<a href="#!/skills/${skill.slug}" class="tag" style="font-size: ${fontSize}rem;"><b-xp level="${level}"></b-xp>${this.escapeHtml(skill.title)}</a>`;
                });
                html += `</div>`;
            }
            
            html += `</div>`;
        });
        
        this.innerHTML = html;
        this.loadComponents();
    }
}

customElements.define('b-skillsets', BSkillsets);

