/**
 * b-skip-link Web Component
 * Accessible skip link for keyboard navigation
 */

class BSkipLink extends HTMLElement {
    connectedCallback() {
        // Get target from attribute or default to main-content
        const target = this.getAttribute('target') || 'main-content';
        const label = this.getAttribute('label') || 'Skip to main content';
        
        // Create the actual link element
        const link = document.createElement('a');
        link.href = `#${target}`;
        link.className = 'skip-link';
        link.textContent = label;
        
        // Handle click to focus target
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetElement = document.getElementById(target);
            if (targetElement) {
                // Make focusable if not already
                if (!targetElement.hasAttribute('tabindex')) {
                    targetElement.setAttribute('tabindex', '-1');
                }
                targetElement.focus();
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
        
        // Clear and append the link
        this.innerHTML = '';
        this.appendChild(link);
    }
}

customElements.define('b-skip-link', BSkipLink);

