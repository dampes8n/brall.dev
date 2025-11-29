/**
 * b-hamburger Web Component
 * Handles hamburger menu toggle functionality
 */

class BHamburger extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const menu = document.getElementById('main-menu');
        const menuList = menu?.querySelector('ul');
        
        if (!menu) {
            console.warn('b-hamburger: main-menu element not found');
            return;
        }

        // Set role and tabindex for accessibility
        if (!this.hasAttribute('role')) {
            this.setAttribute('role', 'button');
        }
        if (!this.hasAttribute('tabindex')) {
            this.setAttribute('tabindex', '0');
        }

        // Set up click handler for toggle
        this.addEventListener('click', () => {
            this.toggleMenu(menu);
        });

        // Support keyboard activation (Enter and Space)
        this.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleMenu(menu);
            }
        });

        // Close menu when clicking a link
        if (menuList) {
            menuList.addEventListener('click', (e) => {
                if (e.target.tagName === 'A' || e.target.closest('a')) {
                    this.closeMenu(menu);
                }
            });
        }
    }

    toggleMenu(menu) {
        const isOpen = menu.classList.toggle('menu-open');
        this.setAttribute('aria-expanded', isOpen);
        this.textContent = isOpen ? '✕' : '☰';
    }

    closeMenu(menu) {
        menu.classList.remove('menu-open');
        this.setAttribute('aria-expanded', 'false');
        this.textContent = '☰';
    }
}

customElements.define('b-hamburger', BHamburger);

