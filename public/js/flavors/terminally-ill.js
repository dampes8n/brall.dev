/**
 * Terminally Ill Flavor JS
 * Randomly assigns glitch animations to h2-h6 headings each time content changes
 */

(function() {
    'use strict';

    // Duration options for variety
    const durations = [13, 15, 17, 19, 21, 23];
    
    // Simple delay options
    const delays = [200, 300, 500];

    /**
     * Randomly assign duration and delay to h2 headings
     */
    function assignRandomAnimations() {
        const headings = document.querySelectorAll('#content-pane h2');
        
        headings.forEach(heading => {
            // Pick random duration and delay
            const randomDuration = durations[Math.floor(Math.random() * durations.length)];
            const randomDelay = delays[Math.floor(Math.random() * delays.length)];
            
            // Apply animation with random duration and delay
            heading.style.animation = `glitch-simple ${randomDuration}s infinite`;
            heading.style.animationDelay = `${randomDelay}ms`;
        });
    }

    /**
     * Initialize and watch for content changes
     */
    function init() {
        // Assign animations to existing headings
        assignRandomAnimations();

        // Watch for changes in content-pane
        const contentPane = document.getElementById('content-pane');
        if (!contentPane) {
            console.warn('[Terminally Ill] content-pane not found');
            return;
        }

        // Use MutationObserver to detect when content changes
        const observer = new MutationObserver((mutations) => {
            // Check if any headings were added or modified
            let shouldReassign = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // Check if any added nodes are headings
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            if (node.tagName && /^H[12]$/.test(node.tagName)) {
                                shouldReassign = true;
                            }
                            // Also check if node contains headings
                            if (node.querySelectorAll && node.querySelectorAll('h1, h2').length > 0) {
                                shouldReassign = true;
                            }
                        }
                    });
                }
            });

            if (shouldReassign) {
                // Small delay to ensure DOM is fully updated
                setTimeout(() => {
                    assignRandomAnimations();
                }, 50);
            }
        });

        // Start observing
        observer.observe(contentPane, {
            childList: true,
            subtree: true
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM already loaded
        init();
    }
})();

