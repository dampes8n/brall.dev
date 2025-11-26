/**
 * b-section Web Component
 * Tracks when section is in view and manages associated backgrounds/foregrounds
 */

class BSection extends HTMLElement {
    constructor() {
        super();
        this.observer = null;
        this.isActive = false;
    }
    
    static checkAllSections() {
        // Check all sections and activate the one that's centered
        const allSections = document.querySelectorAll('b-section');
        const viewportHeight = window.innerHeight;
        const viewportCenter = viewportHeight / 2;
        
        let centeredSection = null;
        
        allSections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const isCentered = viewportCenter >= rect.top && viewportCenter <= rect.bottom;
            
            if (isCentered) {
                centeredSection = section;
            }
        });
        
        // Activate the centered section, deactivate all others
        allSections.forEach(section => {
            if (section === centeredSection) {
                if (!section.isActive) {
                    console.log(`%c[ACTIVATE] ${section.id}`, 'color: green; font-weight: bold');
                    section.isActive = true;
                    section.fadeOutAllOthers();
                    section.activateBackgroundsForegrounds();
                }
            } else {
                if (section.isActive) {
                    console.log(`%c[DEACTIVATE] ${section.id}`, 'color: orange; font-weight: bold');
                    section.isActive = false;
                    section.deactivateBackgroundsForegrounds();
                }
            }
        });
    }

    connectedCallback() {
        console.log(`%c[CONNECTED] ${this.id || 'no-id'}`, 'color: magenta; font-weight: bold', 'b-section connected to DOM');
        // Wait a bit for the section to be fully in the DOM
        setTimeout(() => {
            console.log(`%c[SETUP TIMEOUT] ${this.id || 'no-id'}`, 'color: magenta; font-weight: bold', 'Setting up observer after timeout');
            this.setupIntersectionObserver();
            // Check if section is already in view on load
            this.checkInitialState();
            
            // Also set up a scroll listener as backup to ensure we catch all changes
            if (!BSection.scrollHandler) {
                let scrollTimeout;
                BSection.scrollHandler = () => {
                    clearTimeout(scrollTimeout);
                    scrollTimeout = setTimeout(() => {
                        BSection.checkAllSections();
                    }, 50);
                };
                window.addEventListener('scroll', BSection.scrollHandler, { passive: true });
            }
        }, 200);
    }

    checkInitialState() {
        // Use centralized check
        BSection.checkAllSections();
    }

    disconnectedCallback() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }

    setupIntersectionObserver() {
        const options = {
            root: null, // viewport
            rootMargin: '0px',
            threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
        };

        this.observer = new IntersectionObserver((entries) => {
            // Use centralized check to ensure consistency
            BSection.checkAllSections();
        }, options);

        console.log(`%c[OBSERVER SETUP] ${this.id}`, 'color: cyan; font-weight: bold', 'Setting up intersection observer');
        this.observer.observe(this);
        console.log(`%c[OBSERVER OBSERVING] ${this.id}`, 'color: cyan; font-weight: bold', 'Now observing section');
        
    }

    fadeOutAllOthers() {
        // Fade out all backgrounds/foregrounds first
        const allBackgrounds = document.querySelectorAll('b-background');
        const allForegrounds = document.querySelectorAll('b-foreground');
        
        allBackgrounds.forEach(bg => {
            bg.style.opacity = '0';
        });
        
        allForegrounds.forEach(fg => {
            fg.style.opacity = '0';
        });
    }

    activateBackgroundsForegrounds() {
        const sectionId = this.id;
        if (!sectionId) {
            console.warn('b-section: No ID found, cannot activate backgrounds/foregrounds');
            return;
        }

        // Find all background and foreground components
        const allBackgrounds = document.querySelectorAll('b-background');
        const allForegrounds = document.querySelectorAll('b-foreground');

        console.log(`%c[ACTIVATE] ${sectionId}`, 'color: green; font-weight: bold', {
            backgrounds: allBackgrounds.length,
            foregrounds: allForegrounds.length
        });

        // First, fade out all backgrounds/foregrounds that don't belong to this section
        allBackgrounds.forEach(bg => {
            const bgFor = bg.getAttribute('for');
            if (bgFor !== sectionId) {
                bg.style.opacity = '0';
            }
        });

        allForegrounds.forEach(fg => {
            const fgFor = fg.getAttribute('for');
            if (fgFor !== sectionId) {
                fg.style.opacity = '0';
            }
        });

        // Then fade in matching backgrounds/foregrounds
        let activatedBg = false;
        let activatedFg = false;
        
        allBackgrounds.forEach(bg => {
            const bgFor = bg.getAttribute('for');
            if (bgFor === sectionId) {
                bg.style.opacity = '1';
                activatedBg = true;
                console.log(`  ✓ Background ${bgFor} → opacity: 1`);
            }
        });

        allForegrounds.forEach(fg => {
            const fgFor = fg.getAttribute('for');
            if (fgFor === sectionId) {
                fg.style.opacity = '1';
                activatedFg = true;
                console.log(`  ✓ Foreground ${fgFor} → opacity: 1`);
                // Also check if inner elements are visible
                const innerDivs = fg.querySelectorAll('.resume-foreground-left, .resume-foreground-right');
                console.log(`  ✓ Foreground has ${innerDivs.length} inner divs`);
                innerDivs.forEach(div => {
                    const computed = window.getComputedStyle(div);
                    console.log(`    - ${div.className}: display=${computed.display}, visibility=${computed.visibility}`);
                });
            }
        });
        
        if (!activatedBg && !activatedFg) {
            console.log(`  ⚠ No backgrounds/foregrounds found for ${sectionId}`);
        }
    }

    deactivateBackgroundsForegrounds() {
        const sectionId = this.id;
        console.log(`b-section: Deactivating backgrounds/foregrounds for ${sectionId}`);
        
        // Check if another section is active
        const allSections = document.querySelectorAll('b-section');
        let activeSectionId = null;
        
        allSections.forEach(section => {
            if (section !== this && section.isActive) {
                activeSectionId = section.id;
                console.log(`b-section: Found another active section: ${activeSectionId}`);
            }
        });

        const allBackgrounds = document.querySelectorAll('b-background');
        const allForegrounds = document.querySelectorAll('b-foreground');
        
        // Fade out backgrounds/foregrounds for this section, but keep others active if another section is active
        allBackgrounds.forEach(bg => {
            const bgFor = bg.getAttribute('for');
            if (bgFor === sectionId) {
                console.log(`b-section: Fading out background ${bgFor}`);
                bg.style.opacity = '0';
            } else if (activeSectionId && bgFor === activeSectionId) {
                // Keep the active section's background visible
                console.log(`b-section: Keeping background ${bgFor} visible for active section`);
            } else if (!activeSectionId) {
                // If no other section is active, fade out all
                bg.style.opacity = '0';
            }
        });
        
        allForegrounds.forEach(fg => {
            const fgFor = fg.getAttribute('for');
            if (fgFor === sectionId) {
                console.log(`b-section: Fading out foreground ${fgFor}`);
                fg.style.opacity = '0';
            } else if (activeSectionId && fgFor === activeSectionId) {
                // Keep the active section's foreground visible
                console.log(`b-section: Keeping foreground ${fgFor} visible for active section`);
            } else if (!activeSectionId) {
                // If no other section is active, fade out all
                fg.style.opacity = '0';
            }
        });
    }
}

customElements.define('b-section', BSection);

