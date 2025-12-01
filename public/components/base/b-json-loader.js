/**
 * Base class for Web Components that load JSON data
 * Provides common functionality for fetching and handling JSON files
 */

class BJsonLoader extends HTMLElement {
    constructor() {
        super();
        this._data = {};
        this._loading = false;
        this._error = null;
    }

    /**
     * Load a single JSON file
     * @param {string} url - URL to the JSON file
     * @param {string} key - Key to store the data under (defaults to 'data')
     * @returns {Promise<*>} The parsed JSON data
     */
    async loadJson(url, key = 'data') {
        try {
            this._loading = true;
            this._error = null;
            
            // Use JsonCache if available, otherwise fall back to direct fetch
            let data;
            if (window.JsonCache) {
                data = await window.JsonCache.fetch(url);
            } else {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
                }
                data = await response.json();
            }
            
            this._data[key] = data;
            this._loading = false;
            
            return data;
        } catch (error) {
            this._loading = false;
            this._error = error;
            console.error(`Error loading ${url}:`, error);
            throw error;
        }
    }

    /**
     * Load multiple JSON files in parallel
     * @param {Object<string, string>} files - Object mapping keys to URLs, e.g. { skills: 'data/skills.json', projects: 'data/projects.json' }
     * @returns {Promise<Object>} Object with the same keys containing the loaded data
     */
    async loadMultipleJson(files) {
        try {
            this._loading = true;
            this._error = null;
            
            const entries = Object.entries(files);
            const fetchPromises = entries.map(async ([key, url]) => {
                // Use JsonCache if available, otherwise fall back to direct fetch
                let data;
                if (window.JsonCache) {
                    data = await window.JsonCache.fetch(url);
                } else {
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
                    }
                    data = await response.json();
                }
                return { key, data };
            });
            
            const results = await Promise.all(fetchPromises);
            
            // Store all data
            results.forEach(({ key, data }) => {
                this._data[key] = data;
            });
            
            this._loading = false;
            
            // Return object with same keys as input
            const result = {};
            results.forEach(({ key, data }) => {
                result[key] = data;
            });
            
            return result;
        } catch (error) {
            this._loading = false;
            this._error = error;
            console.error('Error loading JSON files:', error);
            throw error;
        }
    }

    /**
     * Get loaded data by key
     * @param {string} key - Key to retrieve data for
     * @returns {*} The data, or undefined if not loaded
     */
    getData(key) {
        return this._data[key];
    }

    /**
     * Check if currently loading
     * @returns {boolean}
     */
    isLoading() {
        return this._loading;
    }

    /**
     * Get the current error, if any
     * @returns {Error|null}
     */
    getError() {
        return this._error;
    }

    /**
     * Display a loading message
     * @param {string} message - Custom loading message
     */
    showLoading(message = 'Loading...') {
        this.innerHTML = `<p>${this.escapeHtml(message)}</p>`;
    }

    /**
     * Display an error message
     * @param {string} message - Custom error message
     */
    showError(message = 'Error loading data.') {
        this.innerHTML = `<p>${this.escapeHtml(message)}</p>`;
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped HTML
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Convert text to URL-friendly slug
     * @param {string} text - Text to slugify
     * @returns {string} Slugified text
     */
    slugify(text) {
        if (!text) return '';
        // Handle slashes by converting them to -slash- for URL safety
        return text.toLowerCase().replace(/\//g, '-slash-').replace(/\s+/g, '-');
    }

    /**
     * Ensure components in the current element are loaded
     * Useful after setting innerHTML with new component tags
     */
    loadComponents() {
        if (window.ComponentLoader) {
            window.ComponentLoader.find(this).forEach(comp => {
                window.ComponentLoader.load(comp).catch(() => {});
            });
        }
    }
}

// Make available globally
window.BJsonLoader = BJsonLoader;

