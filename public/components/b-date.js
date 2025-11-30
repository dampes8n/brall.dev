/**
 * b-date Web Component
 * Unified date formatting component for the entire site
 * 
 * Usage:
 *   <b-date value="2013-01"></b-date> - Formats the date
 *   <b-date></b-date> - Displays current year (for copyright)
 */

class BDate extends HTMLElement {
    connectedCallback() {
        const value = this.getAttribute('value');
        
        if (value) {
            // Format the provided date
            this.textContent = BDate.formatDate(value);
        } else {
            // No value attribute - display current year (for copyright)
            this.textContent = new Date().getFullYear();
        }
    }

    /**
     * Format a date string into a human-readable format
     * Handles: "YYYY-MM-DD", "YYYY-MM", "YYYY", "YYYY-early", "YYYY-mid", "YYYY-late", "YYYY-YYYY"
     * 
     * @param {string} dateStr - Date string to format
     * @returns {string} Formatted date string
     */
    static formatDate(dateStr) {
        if (!dateStr || dateStr === 'Unknown' || dateStr === 'null' || dateStr === null) {
            return 'Unknown';
        }
        
        // Handle various date formats: "YYYY-MM-DD", "YYYY-MM", "YYYY", "YYYY-early", "YYYY-mid", "YYYY-late", "YYYY-YYYY"
        const parts = dateStr.split('-');
        const year = parts[0];
        
        if (parts.length === 3) {
            // YYYY-MM-DD -> July 5th, 2008
            const month = parseInt(parts[1]) - 1;
            const day = parseInt(parts[2]);
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                              'July', 'August', 'September', 'October', 'November', 'December'];
            const daySuffix = BDate.getDaySuffix(day);
            return `${monthNames[month]} ${day}${daySuffix}, ${year}`;
        } else if (parts.length === 2) {
            const part2 = parts[1].toLowerCase();
            if (part2 === 'early') {
                return `Early ${year}`;
            } else if (part2 === 'mid') {
                return `Mid ${year}`;
            } else if (part2 === 'late') {
                return `Late ${year}`;
            } else if (part2 === 'spring') {
                return `Spring ${year}`;
            } else if (part2 === 'summer') {
                return `Summer ${year}`;
            } else if (part2 === 'fall') {
                return `Fall ${year}`;
            } else if (part2 === 'winter') {
                return `Winter ${year}`;
            } else {
                // Check if parts[1] is a year (4 digits) - date range format YYYY-YYYY
                const secondPart = parts[1];
                if (secondPart.length === 4 && /^\d{4}$/.test(secondPart)) {
                    // YYYY-YYYY -> 2005-2006
                    return `${year}-${secondPart}`;
                } else {
                    // YYYY-MM -> July, 2008
                    const month = parseInt(parts[1]) - 1;
                    if (isNaN(month) || month < 0 || month > 11) {
                        // Invalid month, treat as date range
                        return `${year}-${secondPart}`;
                    }
                    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                                      'July', 'August', 'September', 'October', 'November', 'December'];
                    return `${monthNames[month]}, ${year}`;
                }
            }
        } else {
            // YYYY -> 2008
            return year;
        }
    }

    /**
     * Get the ordinal suffix for a day (st, nd, rd, th)
     * 
     * @param {number} day - Day of the month
     * @returns {string} Ordinal suffix
     */
    static getDaySuffix(day) {
        if (day >= 11 && day <= 13) {
            return 'th';
        }
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    }
}

customElements.define('b-date', BDate);

