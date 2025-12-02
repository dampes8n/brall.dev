/**
 * Loader.js - Auto-loads web components from HTML
 * Reads incoming HTML, finds web components, and autoloads their .js files
 */

(function() {
    'use strict';

    const componentCache = new Map();
    const pendingLoads = new Map();

    function loadComponent(componentName) {
        // If already loaded, return immediately
        if (componentCache.has(componentName)) {
            return Promise.resolve(componentCache.get(componentName));
        }

        // If already loading, return the existing promise
        if (pendingLoads.has(componentName)) {
            return pendingLoads.get(componentName);
        }

        // Prefer minified version if available
        const scriptSrc = `components/${componentName}.min.js`;
        const fallbackSrc = `components/${componentName}.js`;
        
        // Check if script tag already exists in DOM (check both minified and non-minified)
        const existingScript = document.querySelector(`script[src="${scriptSrc}"], script[src="${fallbackSrc}"]`);
        if (existingScript) {
            // Script exists but not in cache yet - wait for it to load
            const loadPromise = new Promise((resolve, reject) => {
                const checkLoaded = () => {
                    if (componentCache.has(componentName)) {
                        resolve(componentCache.get(componentName));
                    } else {
                        // Wait a bit and check again
                        setTimeout(checkLoaded, 50);
                    }
                };
                checkLoaded();
            });
            pendingLoads.set(componentName, loadPromise);
            return loadPromise;
        }

        // Create new load promise - try minified first, fallback to regular
        const loadPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = scriptSrc;
            script.onload = () => {
                componentCache.set(componentName, true);
                pendingLoads.delete(componentName);
                resolve();
            };
            script.onerror = () => {
                // Try fallback if minified version fails
                const fallbackScript = document.createElement('script');
                fallbackScript.src = fallbackSrc;
                fallbackScript.onload = () => {
                    componentCache.set(componentName, true);
                    pendingLoads.delete(componentName);
                    resolve();
                };
                fallbackScript.onerror = () => {
                    console.warn(`Failed to load component: ${componentName}`);
                    pendingLoads.delete(componentName);
                    reject(new Error(`Failed to load component: ${componentName}`));
                };
                document.head.appendChild(fallbackScript);
            };
            document.head.appendChild(script);
        });

        pendingLoads.set(componentName, loadPromise);
        return loadPromise;
    }

    function findComponents(element = document) {
        const components = new Set();
        const customElements = element.querySelectorAll('*');
        
        customElements.forEach(el => {
            const tagName = el.tagName.toLowerCase();
            // Only add if not in cache and not already pending
            if (tagName.includes('-') && !componentCache.has(tagName) && !pendingLoads.has(tagName)) {
                components.add(tagName);
            }
        });

        return Array.from(components);
    }

    function initializeComponents() {
        const components = findComponents();
        // Separate critical components (needed for initial render) from non-critical
        const criticalComponents = ['b-skip-link', 'b-hamburger', 'b-date', 'b-breadcrumbs', 'b-flavor-selector'];
        const critical = components.filter(comp => criticalComponents.includes(comp));
        const nonCritical = components.filter(comp => !criticalComponents.includes(comp));
        
        // Load critical components immediately
        const criticalPromises = critical.map(comp => loadComponent(comp).catch(() => {}));
        
        // Load non-critical components when idle
        const loadNonCritical = () => {
            const nonCriticalPromises = nonCritical.map(comp => loadComponent(comp).catch(() => {}));
            return Promise.all(nonCriticalPromises);
        };
        
        if (window.requestIdleCallback) {
            requestIdleCallback(() => {
                loadNonCritical().catch(() => {});
            }, { timeout: 2000 });
        } else {
            // Fallback for browsers without requestIdleCallback
            setTimeout(loadNonCritical, 100);
        }
        
        return Promise.all(criticalPromises);
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeComponents);
    } else {
        initializeComponents();
    }

    // Watch for dynamically added components (throttled for performance)
    let observerTimeout = null;
    const pendingComponents = new Set();
    
    function processPendingComponents() {
        if (pendingComponents.size === 0) return;
        const components = Array.from(pendingComponents);
        pendingComponents.clear();
        components.forEach(comp => loadComponent(comp).catch(() => {}));
    }
    
    const observer = new MutationObserver(mutations => {
        // Batch component discovery
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // Element node
                    const components = findComponents(node);
                    components.forEach(comp => pendingComponents.add(comp));
                }
            });
        });
        
        // Throttle component loading
        if (observerTimeout) {
            clearTimeout(observerTimeout);
        }
        observerTimeout = setTimeout(() => {
            if (window.requestIdleCallback) {
                requestIdleCallback(processPendingComponents, { timeout: 500 });
            } else {
                processPendingComponents();
            }
        }, 100);
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

    // Router functionality - handles hashbang routing (#!)
    // Moved to external file: js/router.js (loaded with defer)

    // Scroll main content when scrolling outside of it
    (function() {
        'use strict';

        function initScrollDelegation() {
            const mainContent = document.getElementById('main-content');
            if (!mainContent) {
                // Retry if main-content isn't ready yet
                setTimeout(initScrollDelegation, 100);
                return;
            }

            // List of scrollable elements that should handle their own scrolling
            const scrollableSelectors = [
                '#main-menu',
                '#situational-menu',
                '.card-list',
                '.link-list',
                '.timeline-container',
                'b-projects',
                'b-skillsets'
            ];

            function isInsideScrollableElement(element) {
                if (!element) return false;
                // Check if element or any ancestor is a scrollable element (excluding main-content)
                for (const selector of scrollableSelectors) {
                    const closest = element.closest ? element.closest(selector) : null;
                    if (closest) {
                        // Check if this element can actually scroll
                        const canScroll = closest.scrollHeight > closest.clientHeight;
                        if (canScroll) {
                            return true;
                        }
                    }
                }
                return false;
            }

            function isInsideMainContent(element) {
                if (!element) return false;
                return element === mainContent || (element.closest && element.closest('#main-content'));
            }

            document.addEventListener('wheel', function(e) {
                const target = e.target;
                
                // If we're inside a scrollable element (other than main-content), let it handle scrolling
                if (isInsideScrollableElement(target)) {
                    return; // Let the scrollable element handle it
                }
                
                // If we're inside main-content, let it handle its own scrolling naturally
                if (isInsideMainContent(target)) {
                    return; // Main-content will handle its own scroll
                }
                
                // Otherwise, we're outside any scrollable area - scroll main-content
                if (mainContent.scrollHeight > mainContent.clientHeight) {
                    e.preventDefault();
                    const deltaY = e.deltaY;
                    const currentScroll = mainContent.scrollTop;
                    const maxScroll = mainContent.scrollHeight - mainContent.clientHeight;
                    
                    // Calculate new scroll position
                    let newScroll = currentScroll + deltaY;
                    newScroll = Math.max(0, Math.min(newScroll, maxScroll));
                    
                    mainContent.scrollTop = newScroll;
                }
            }, { passive: false });
        }

        // Initialize scroll delegation when idle (defer non-critical event listeners)
        function setupScrollDelegation() {
            if (window.requestIdleCallback) {
                requestIdleCallback(initScrollDelegation, { timeout: 2000 });
            } else {
                setTimeout(initScrollDelegation, 500);
            }
        }
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupScrollDelegation);
        } else {
            setupScrollDelegation();
        }
    })();

    // Handle video pausing for reduced motion preference
    (function() {
        function pauseVideosIfReducedMotion() {
            const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            if (prefersReducedMotion) {
                const videos = document.querySelectorAll('#backgrounds video, #foregrounds video');
                videos.forEach(video => {
                    video.pause();
                });
            }
        }

        // Pause videos on initial load if reduced motion is enabled (defer non-critical)
        function setupReducedMotion() {
            pauseVideosIfReducedMotion();
            // Listen for changes to reduced motion preference
            const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
            reducedMotionQuery.addEventListener('change', pauseVideosIfReducedMotion);
        }
        
        if (window.requestIdleCallback) {
            requestIdleCallback(setupReducedMotion, { timeout: 2000 });
        } else {
            setTimeout(setupReducedMotion, 500);
        }
    })();
})();

