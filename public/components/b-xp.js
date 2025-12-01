/**
 * b-xp
 * Small experience indicator component for skills.
 * Renders a single braille character plus screen-reader-only label.
 *
 * Usage:
 *   <b-xp level="3"></b-xp>
 * Screen readers will read e.g. "Average " before the skill name.
 */

class BXP extends HTMLElement {
    static get observedAttributes() {
        return ['level'];
    }

    // Pre-computed lookup tables for better performance
    static BRAILLE = ['⠁', '⠃', '⠇', '⠏', '⠟']; // levels 1-5
    static LABELS = ['Novice', 'Moderate', 'Average', 'Expert', 'Master'];

    constructor() {
        super();
        this._cachedLevel = null;
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        // Only re-render if level actually changed
        const newLevel = this.getLevel();
        if (this._cachedLevel !== newLevel) {
            this.render();
        }
    }

    getLevel() {
        const raw = this.getAttribute('level');
        const n = parseInt(raw, 10);
        if (!Number.isFinite(n) || n < 1) return 1;
        if (n > 5) return 5;
        return n;
    }

    render() {
        const level = this.getLevel();
        
        // Skip if level hasn't changed and already rendered
        if (this._cachedLevel === level && this.firstElementChild) {
            return;
        }
        
        this._cachedLevel = level;
        const levelIndex = level - 1; // Convert to 0-based index
        const braille = BXP.BRAILLE[levelIndex] || BXP.BRAILLE[0];
        const label = BXP.LABELS[levelIndex] || BXP.LABELS[0];

        // Use more efficient DOM manipulation
        if (!this.firstElementChild) {
            const charSpan = document.createElement('span');
            charSpan.className = 'xp-char';
            charSpan.setAttribute('aria-hidden', 'true');
            charSpan.textContent = braille;
            
            const labelSpan = document.createElement('span');
            labelSpan.className = 'sr-only';
            labelSpan.textContent = label + ' ';
            
            this.appendChild(charSpan);
            this.appendChild(labelSpan);
        } else {
            // Update existing elements
            this.firstElementChild.textContent = braille;
            this.lastElementChild.textContent = label + ' ';
        }

        this.setAttribute('aria-hidden', 'false');
        this.setAttribute('title', label);
    }
}

customElements.define('b-xp', BXP);


