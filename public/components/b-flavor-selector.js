/**
 * b-flavor-selector Web Component
 * Manages CSS flavors and provides UI for switching
 * Flavors: None, Applebutter, Millennial Great, Wickedpedia, LitRPG, Offices and Overseers, Terminally Ill
 */

class BFlavorSelector extends HTMLElement {
    constructor() {
        super();
        this.flavorNames = {
            'none': 'None',
            'applebutter': 'Applebutter',
            'millennial-great': 'Millennial Great',
            'wickedpedia': 'Wickedpedia',
            'litrpg': 'LitRPG',
            'offices-overseers': 'Offices and Overseers',
            'terminally-ill': 'Terminally Ill'
        };
        this.flavorPaths = {
            'applebutter': 'css/flavors/applebutter.css',
            'millennial-great': 'css/flavors/millennial-great.css',
            'wickedpedia': 'css/flavors/wickedpedia.css',
            'litrpg': 'css/flavors/litrpg.css',
            'offices-overseers': 'css/flavors/offices-overseers.css',
            'terminally-ill': 'css/flavors/terminally-ill.css'
        };
        this.currentFlavor = null;
        this.isInitialLoad = true;
    }

    // Cookie helper functions
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    setCookie(name, value, days = 365) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = `expires=${date.toUTCString()}`;
        document.cookie = `${name}=${value};${expires};path=/`;
    }

    connectedCallback() {
        // Load current flavor from cookie
        this.currentFlavor = this.getCookie('flavor') || 'none';
        
        // Load initial flavor
        this.switchFlavor(this.currentFlavor, true);
        
        // Render the selector
        this.render();
        this.attachEventListeners();
    }

    switchFlavor(newFlavor, isInitial = false) {
        // Handle "None" flavor - just clear the flavor style
        if (newFlavor === 'none') {
            const transitionStyle = document.getElementById('transition-style');
            const flavorStyle = document.getElementById('flavor-style');

            if (!transitionStyle || !flavorStyle) {
                console.error('Flavor style elements not found');
                return;
            }

            // Skip transition on initial load for "none"
            if (!(isInitial && this.isInitialLoad)) {
                // Add transition
                transitionStyle.textContent = '* { transition: all 0.3s ease; }';
            }

            // Clear flavor style (use only core CSS)
            flavorStyle.textContent = '';
            this.currentFlavor = newFlavor;
            this.setCookie('flavor', newFlavor);
            this.isInitialLoad = false;

            // Update select if rendered
            const select = this.querySelector('select');
            if (select) {
                select.value = newFlavor;
            }

            // Remove transition after animation (if it was added)
            if (!(isInitial && this.isInitialLoad)) {
                setTimeout(() => {
                    transitionStyle.textContent = '';
                }, 300);
            }
            return;
        }

        if (!this.flavorPaths[newFlavor]) {
            console.warn(`Unknown flavor: ${newFlavor}`);
            return;
        }

        const transitionStyle = document.getElementById('transition-style');
        const flavorStyle = document.getElementById('flavor-style');

        if (!transitionStyle || !flavorStyle) {
            console.error('Flavor style elements not found');
            return;
        }

        // Check if we're in file:// protocol
        if (window.location.protocol === 'file:') {
            console.warn('File:// protocol detected. Please use a web server to load flavors.');
            console.warn('Use Python (python -m http.server 8000), PHP, or VS Code Live Server');
            transitionStyle.textContent = '';
            return;
        }

        // Add transition
        transitionStyle.textContent = '* { transition: all 0.3s ease; }';

        // Load new flavor
        fetch(this.flavorPaths[newFlavor])
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                return response.text();
            })
            .then(css => {
                flavorStyle.textContent = css;
                this.currentFlavor = newFlavor;
                this.setCookie('flavor', newFlavor);
                this.isInitialLoad = false;

                // Update select if rendered
                const select = this.querySelector('select');
                if (select) {
                    select.value = newFlavor;
                }

                // Remove transition after animation
                setTimeout(() => {
                    transitionStyle.textContent = '';
                }, 300);
            })
            .catch(err => {
                console.error(`Failed to load flavor ${newFlavor}:`, err);
                transitionStyle.textContent = '';
                this.isInitialLoad = false;
            });
    }

    render() {
        const uniqueId = `flavor-select-${Math.random().toString(36).substr(2, 9)}`;
        
        this.innerHTML = `
            <label for="${uniqueId}">Flavor: </label>
            <select id="${uniqueId}" aria-label="Select flavor">
                ${Object.entries(this.flavorNames).map(([key, name]) => 
                    `<option value="${key}" ${key === this.currentFlavor ? 'selected' : ''}>${name}</option>`
                ).join('')}
            </select>
        `;
    }

    attachEventListeners() {
        const select = this.querySelector('select');
        if (select) {
            select.addEventListener('change', (e) => {
                this.switchFlavor(e.target.value);
            });
        }
    }
}

customElements.define('b-flavor-selector', BFlavorSelector);

