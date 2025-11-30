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

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        this.render();
    }

    getLevel() {
        const raw = this.getAttribute('level');
        const n = parseInt(raw, 10);
        if (!Number.isFinite(n) || n < 1) return 1;
        if (n > 5) return 5;
        return n;
    }

    getBrailleChar(level) {
        // 1–5 dots, increasing density
        switch (level) {
            case 1: return '⠁'; // dot 1
            case 2: return '⠃'; // dots 1-2
            case 3: return '⠇'; // dots 1-2-3
            case 4: return '⠏'; // dots 1-2-3-4
            case 5: return '⠟'; // dots 1-2-3-4-5
            default: return '⠁';
        }
    }

    getLabel(level) {
        switch (level) {
            case 1: return 'Novice';
            case 2: return 'Moderate';
            case 3: return 'Average';
            case 4: return 'Expert';
            case 5: return 'Master';
            default: return 'Novice';
        }
    }

    render() {
        const level = this.getLevel();
        const braille = this.getBrailleChar(level);
        const label = this.getLabel(level);

        this.setAttribute('aria-hidden', 'false');
        this.setAttribute('title', label);

        this.innerHTML = `
            <span class="xp-char" aria-hidden="true">${braille}</span>
            <span class="sr-only">${label} </span>
        `;
    }
}

customElements.define('b-xp', BXP);


