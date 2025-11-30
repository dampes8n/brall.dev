/**
 * b-flavor-selector Web Component
 * Manages CSS flavors and provides UI for switching
 * Flavors: Core, Millennial Great, Wickedpedia, LitRPG, Offices and Overseers, Terminally Ill, VHScary
 */

class BFlavorSelector extends HTMLElement {
    constructor() {
        super();
        this.flavorNames = {
            'core': 'Core',
            'millennial-great': 'Millennial Great',
            'wickedpedia': 'Wickedpedia',
            'litrpg': 'LitRPG',
            'offices-overseers': 'Offices and Overseers',
            'terminally-ill': 'Terminally Ill',
            'vhscary': 'VHScary'
        };
        this.flavorPaths = {
            'millennial-great': 'css/flavors/millennial-great.css',
            'wickedpedia': 'css/flavors/wickedpedia.css',
            'litrpg': 'css/flavors/litrpg.css',
            'offices-overseers': 'css/flavors/offices-overseers.css',
            'terminally-ill': 'css/flavors/terminally-ill.css',
            'vhscary': 'css/flavors/vhscary.css'
        };
        this.flavorScriptPaths = {
            'terminally-ill': 'js/flavors/terminally-ill.js'
            // Add more flavor JS files here as they are created
        };
        this.currentFlavor = null;
        this.isInitialLoad = true;
        this.currentFlavorScript = null;
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

    getDefaultFlavor() {
        // Check if user has reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // If reduced motion is on, use Millennial Great regardless of color scheme
        if (prefersReducedMotion) {
            return 'millennial-great';
        }
        
        // Check if user prefers dark mode
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // If dark mode and no reduced motion, use Terminally Ill
        if (prefersDark) {
            return 'terminally-ill';
        }
        
        // Otherwise (light mode or no preference), use core
        return 'core';
    }

    connectedCallback() {
        // Load current flavor from cookie, or use default based on preferences
        const cookieFlavor = this.getCookie('flavor');
        this.currentFlavor = cookieFlavor || this.getDefaultFlavor();
        
        // Load initial flavor
        this.switchFlavor(this.currentFlavor, true);
        
        // Render the selector
        this.render();
        this.attachEventListeners();
    }

    switchFlavor(newFlavor, isInitial = false) {
        // Handle "Core" flavor - just clear the flavor style
        if (newFlavor === 'core') {
            const transitionStyle = document.getElementById('transition-style');
            const flavorStyle = document.getElementById('flavor-style');

            if (!transitionStyle || !flavorStyle) {
                console.error('Flavor style elements not found');
                return;
            }

            // Skip transition on initial load for "core"
            if (!(isInitial && this.isInitialLoad)) {
                // Add transition
                transitionStyle.textContent = '* { transition: all 0.3s ease; }';
            }

            // Clear flavor style (use only core CSS)
            flavorStyle.textContent = '';
            this.currentFlavor = newFlavor;
            this.setCookie('flavor', newFlavor);
            this.isInitialLoad = false;

            // Clear flavor script for 'core'
            this.unloadFlavorScript();

            // Update select if rendered
            const select = this.querySelector('select');
            if (select) {
                select.value = newFlavor;
            }

                // Reload backgrounds and foregrounds (clear them for 'core' flavor)
            this.reloadLayers().catch(() => {});

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

                // Reload backgrounds and foregrounds for new flavor
                this.reloadLayers().catch(() => {});

                // Load flavor JS if it exists
                this.loadFlavorScript(newFlavor);

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
        
        const flavorIcons = {
            'core': 'fa-palette',
            'millennial-great': 'fa-couch',
            'wickedpedia': 'fa-book',
            'litrpg': 'fa-dice-d20',
            'offices-overseers': 'fa-briefcase',
            'terminally-ill': 'fa-terminal',
            'vhscary': 'fa-video'
        };
        
        this.innerHTML = `
            <label for="${uniqueId}"><i class="fa-solid fa-palette" aria-hidden="true"></i> Flavor: </label>
            <select id="${uniqueId}" aria-label="Select flavor">
                ${Object.entries(this.flavorNames).map(([key, name]) => 
                    `<option value="${key}" ${key === this.currentFlavor ? 'selected' : ''} data-icon="${flavorIcons[key] || 'fa-palette'}">${name}</option>`
                ).join('')}
            </select>
        `;
    }

    async loadBackground() {
        // Check if we're in file:// protocol
        if (window.location.protocol === 'file:') {
            return;
        }
        
        const bgContainer = document.getElementById('backgrounds');
        let bgLayer = bgContainer.querySelector('b-layer[type="background"]');
        
        const bgPath = `partials/flavors/${this.currentFlavor}.background.html`;
        try {
            const response = await fetch(bgPath);
            if (response.ok) {
                const html = await response.text();
                
                // Get or create b-layer for backgrounds
                if (!bgLayer) {
                    bgLayer = document.createElement('b-layer');
                    bgLayer.setAttribute('type', 'background');
                    bgLayer.setAttribute('aria-hidden', 'true');
                    bgContainer.appendChild(bgLayer);
                    
                    // Ensure component is loaded
                    if (window.ComponentLoader) {
                        await window.ComponentLoader.load('b-layer').catch(() => {});
                    }
                }
                
                // Add new layer with crossfading
                await bgLayer.addLayer(html);
            } else {
                // No background file exists - clear old layer if it exists
                if (bgLayer) {
                    bgLayer.clear();
                }
            }
        } catch (e) {
            // No background file exists - clear old layer if it exists
            if (bgLayer) {
                bgLayer.clear();
            }
        }
    }

    async loadForeground() {
        // Check if we're in file:// protocol
        if (window.location.protocol === 'file:') {
            return;
        }
        
        const fgContainer = document.getElementById('foregrounds');
        let fgLayer = fgContainer.querySelector('b-layer[type="foreground"]');
        
        const fgPath = `partials/flavors/${this.currentFlavor}.foreground.html`;
        try {
            const response = await fetch(fgPath);
            if (response.ok) {
                const html = await response.text();
                
                // Get or create b-layer for foregrounds
                if (!fgLayer) {
                    fgLayer = document.createElement('b-layer');
                    fgLayer.setAttribute('type', 'foreground');
                    fgLayer.setAttribute('aria-hidden', 'true');
                    fgContainer.appendChild(fgLayer);
                    
                    // Ensure component is loaded
                    if (window.ComponentLoader) {
                        await window.ComponentLoader.load('b-layer').catch(() => {});
                    }
                }
                
                // Add new layer with crossfading
                await fgLayer.addLayer(html);
            } else {
                // No foreground file exists - clear old layer if it exists
                if (fgLayer) {
                    fgLayer.clear();
                }
            }
        } catch (e) {
            // No foreground file exists - clear old layer if it exists
            if (fgLayer) {
                fgLayer.clear();
            }
        }
    }

    async reloadLayers() {
        // Load background and foreground for current flavor
        await this.loadBackground();
        await this.loadForeground();
    }

    loadFlavorScript(flavor) {
        // Unload previous script first
        this.unloadFlavorScript();

        // Check if this flavor has a JS file
        if (!this.flavorScriptPaths[flavor]) {
            return;
        }

        // Check if we're in file:// protocol
        if (window.location.protocol === 'file:') {
            console.warn('File:// protocol detected. Please use a web server to load flavor scripts.');
            return;
        }

        const scriptPath = this.flavorScriptPaths[flavor];
        const placeholder = document.getElementById('flavor-script');
        
        if (!placeholder) {
            console.warn('flavor-script placeholder element not found');
            return;
        }

        // Create new script element
        const script = document.createElement('script');
        script.id = 'flavor-script';
        script.src = scriptPath;
        
        script.onerror = () => {
            console.warn(`Failed to load flavor script: ${scriptPath}`);
        };

        // Replace placeholder with new script
        placeholder.parentNode.replaceChild(script, placeholder);
        this.currentFlavorScript = scriptPath;
    }

    unloadFlavorScript() {
        const scriptElement = document.getElementById('flavor-script');
        if (scriptElement && scriptElement.src) {
            // Create new empty placeholder script
            const placeholder = document.createElement('script');
            placeholder.id = 'flavor-script';
            placeholder.src = '';
            scriptElement.parentNode.replaceChild(placeholder, scriptElement);
        }
        this.currentFlavorScript = null;
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

