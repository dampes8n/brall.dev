/**
 * b-yt Web Component
 * Embeds a YouTube video using the video ID/slug
 * Usage: <b-yt slug="dQw4w9WgXcQ"></b-yt>
 */

class BYt extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const slug = this.getAttribute('slug');
        
        if (!slug) {
            console.warn('b-yt: slug attribute is required');
            return;
        }

        // Create wrapper for responsive embed
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.width = '100%';
        wrapper.style.paddingBottom = '56.25%'; // 16:9 aspect ratio
        wrapper.style.height = '0';
        wrapper.style.overflow = 'hidden';
        
        // Create iframe for YouTube embed
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${slug}`;
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('loading', 'lazy');
        
        // Set styles for responsive embed
        iframe.style.position = 'absolute';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        
        // Append iframe to wrapper
        wrapper.appendChild(iframe);
        
        // Clear any existing content and append wrapper
        this.innerHTML = '';
        this.appendChild(wrapper);
    }
}

customElements.define('b-yt', BYt);

