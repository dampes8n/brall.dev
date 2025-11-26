/**
 * b-year Web Component
 * Displays the current year
 */

class BYear extends HTMLElement {
    connectedCallback() {
        this.textContent = new Date().getFullYear();
    }
}

customElements.define('b-year', BYear);

