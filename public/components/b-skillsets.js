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
            html += `<div class="skillset-group">`;
            html += `<h3><a href="#!/skillsets/${slug}">${this.escapeHtml(skillset)}</a></h3>`;
            
            // Find all skills in this skillset
            const skillsInSkillset = this.skills.filter(skill => 
                skill.skillsets && skill.skillsets.includes(skillset)
            );
            
            if (skillsInSkillset.length > 0) {
                // Count how many times each skill appears in projects and timeline events
                const skillCounts = new Map();
                skillsInSkillset.forEach(skill => {
                    let count = 0;
                    // Count projects that share the same skillset
                    this.projects.forEach(project => {
                        if (project.skillsets && project.skillsets.includes(skillset)) {
                            count++;
                        }
                    });
                    // Count timeline events that reference this skill
                    this.timelineEvents.forEach(event => {
                        if (event.skills && event.skills.includes(skill.title)) {
                            count++;
                        }
                    });
                    skillCounts.set(skill, count);
                });
                
                // Sort skills by count (descending)
                const sortedSkills = skillsInSkillset.sort((a, b) => {
                    return skillCounts.get(b) - skillCounts.get(a);
                });
                
                // Calculate min and max counts for font size scaling
                const counts = Array.from(skillCounts.values());
                const minCount = Math.min(...counts);
                const maxCount = Math.max(...counts);
                const minSize = 0.9; // rem
                const maxSize = 1.8; // rem
                
                html += `<div class="skillset-tag-cloud">`;
                sortedSkills.forEach(skill => {
                    const count = skillCounts.get(skill);
                    // Calculate font size based on count
                    let fontSize = minSize;
                    if (maxCount > minCount) {
                        const ratio = (count - minCount) / (maxCount - minCount);
                        fontSize = minSize + (ratio * (maxSize - minSize));
                    }
                    html += `<a href="#!/skills/${skill.slug}" class="tag" style="font-size: ${fontSize}rem;">${this.escapeHtml(skill.title)}</a>`;
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

