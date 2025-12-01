/**
 * JSON Cache - Global cache for JSON data to prevent duplicate fetches
 * Components share parsed data instead of re-fetching the same files
 */
(function() {
    'use strict';

    const cache = new Map();
    const loadingPromises = new Map();
    const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

    window.JsonCache = {
        /**
         * Fetch JSON data with caching
         * @param {string} url - URL to fetch
         * @returns {Promise<*>} Parsed JSON data
         */
        async fetch(url) {
            // Check cache first
            const cached = cache.get(url);
            if (cached) {
                if (Date.now() - cached.timestamp < CACHE_DURATION) {
                    return cached.data;
                } else {
                    cache.delete(url); // Expired
                }
            }

            // If already loading, return the existing promise
            if (loadingPromises.has(url)) {
                return loadingPromises.get(url);
            }

            // Otherwise, fetch and cache
            const promise = (async () => {
                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
                    }
                    const data = await response.json();
                    cache.set(url, { data, timestamp: Date.now() });
                    return data;
                } finally {
                    loadingPromises.delete(url); // Remove promise once settled
                }
            })();

            loadingPromises.set(url, promise);
            return promise;
        },

        /**
         * Clear expired cache entries
         */
        clearExpired() {
            const now = Date.now();
            for (const [url, entry] of cache.entries()) {
                if (now - entry.timestamp > CACHE_DURATION) {
                    cache.delete(url);
                }
            }
        },

        /**
         * Clear all cache entries
         */
        clear() {
            cache.clear();
            loadingPromises.clear();
        }
    };

    // Periodically clear expired cache entries
    setInterval(window.JsonCache.clearExpired, CACHE_DURATION / 2); // Check every 7.5 minutes
})();

/**
 * Text Cache - Global cache for text content (CSS, HTML) to prevent duplicate fetches
 * Used for flavor files and other text-based resources
 */
(function() {
    'use strict';

    const cache = new Map();
    const loadingPromises = new Map();
    const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

    window.TextCache = {
        /**
         * Fetch text content with caching
         * @param {string} url - URL to fetch
         * @returns {Promise<string>} Text content
         */
        async fetch(url) {
            // Check cache first
            const cached = cache.get(url);
            if (cached) {
                if (Date.now() - cached.timestamp < CACHE_DURATION) {
                    return cached.data;
                } else {
                    cache.delete(url); // Expired
                }
            }

            // If already loading, return the existing promise
            if (loadingPromises.has(url)) {
                return loadingPromises.get(url);
            }

            // Otherwise, fetch and cache
            const promise = (async () => {
                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
                    }
                    const data = await response.text();
                    cache.set(url, { data, timestamp: Date.now() });
                    return data;
                } finally {
                    loadingPromises.delete(url); // Remove promise once settled
                }
            })();

            loadingPromises.set(url, promise);
            return promise;
        },

        /**
         * Clear expired cache entries
         */
        clearExpired() {
            const now = Date.now();
            for (const [url, entry] of cache.entries()) {
                if (now - entry.timestamp > CACHE_DURATION) {
                    cache.delete(url);
                }
            }
        },

        /**
         * Clear all cache entries
         */
        clear() {
            cache.clear();
            loadingPromises.clear();
        }
    };

    // Periodically clear expired cache entries
    setInterval(window.TextCache.clearExpired, CACHE_DURATION / 2); // Check every 7.5 minutes
})();

