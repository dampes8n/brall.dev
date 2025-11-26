/**
 * b-layer Web Component
 * Generic layer component for backgrounds and foregrounds with crossfading
 */

class BLayer extends HTMLElement {
    constructor() {
        super();
        this.currentLayer = null;
        this.fadeDuration = 300; // milliseconds
    }

    connectedCallback() {
        // Set up base styles
        this.style.position = 'absolute';
        this.style.top = '0';
        this.style.left = '0';
        this.style.width = '100%';
        this.style.height = '100%';
        this.style.pointerEvents = 'none';
        this.style.zIndex = this.getAttribute('type') === 'foreground' ? '10' : '1';
    }

    /**
     * Add a new layer with crossfading
     * @param {string} html - HTML content for the new layer
     */
    async addLayer(html) {
        // Fade out current layer if it exists
        if (this.currentLayer) {
            this.fadeOut(this.currentLayer);
        }

        // Create new layer
        const newLayer = document.createElement('div');
        newLayer.className = 'layer-content';
        newLayer.style.opacity = '0';
        newLayer.style.transition = `opacity ${this.fadeDuration}ms ease-in-out`;
        newLayer.innerHTML = html;

        // Add to DOM
        this.appendChild(newLayer);

        // Load any components in the new content
        if (window.ComponentLoader) {
            window.ComponentLoader.find(newLayer).forEach(comp => {
                window.ComponentLoader.load(comp).catch(() => {});
            });
        }

        // Start fade in immediately for crossfade effect
        // Use requestAnimationFrame to ensure layout has happened
        requestAnimationFrame(() => {
            newLayer.style.opacity = '1';
        });

        // Update current layer
        this.currentLayer = newLayer;
    }

    /**
     * Fade out a layer and remove it after fade completes
     * @param {HTMLElement} layer - The layer element to fade out
     */
    fadeOut(layer) {
        layer.style.opacity = '0';
        
        // Remove from DOM after fade completes
        setTimeout(() => {
            if (layer.parentNode === this) {
                this.removeChild(layer);
            }
            // Clear current layer if it was the one we just removed
            if (this.currentLayer === layer) {
                this.currentLayer = null;
            }
        }, this.fadeDuration);
    }

    /**
     * Clear all layers
     */
    clear() {
        while (this.firstChild) {
            this.removeChild(this.firstChild);
        }
        this.currentLayer = null;
    }
}

customElements.define('b-layer', BLayer);

