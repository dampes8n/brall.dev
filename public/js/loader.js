/**
 * Loader.js - Auto-loads web components from HTML
 * Reads incoming HTML, finds web components, and autoloads their .js files
 */

(function() {
    'use strict';

    const componentCache = new Map();

    function loadComponent(componentName) {
        if (componentCache.has(componentName)) {
            return Promise.resolve(componentCache.get(componentName));
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `components/${componentName}.js`;
            script.onload = () => {
                componentCache.set(componentName, true);
                resolve();
            };
            script.onerror = () => {
                console.warn(`Failed to load component: ${componentName}`);
                reject(new Error(`Failed to load component: ${componentName}`));
            };
            document.head.appendChild(script);
        });
    }

    function findComponents(element = document) {
        const components = new Set();
        const customElements = element.querySelectorAll('*');
        
        customElements.forEach(el => {
            const tagName = el.tagName.toLowerCase();
            if (tagName.includes('-') && !componentCache.has(tagName)) {
                components.add(tagName);
            }
        });

        return Array.from(components);
    }

    function initializeComponents() {
        const components = findComponents();
        const loadPromises = components.map(comp => loadComponent(comp).catch(() => {}));
        
        return Promise.all(loadPromises);
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeComponents);
    } else {
        initializeComponents();
    }

    // Watch for dynamically added components
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // Element node
                    const components = findComponents(node);
                    components.forEach(comp => loadComponent(comp).catch(() => {}));
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Export for manual loading if needed
    window.ComponentLoader = {
        load: loadComponent,
        find: findComponents
    };
})();

