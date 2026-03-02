/**
 * Text Utilities
 */

/**
 * Split text into overlapping chunks
 * @param {string} text 
 * @param {number} size 
 * @param {number} overlap 
 * @returns {string[]}
 */
export function chunkText(text, size, overlap) {
    if (size <= 0) throw new Error('Size must be positive');
    if (overlap >= size) throw new Error('Overlap must be less than size');

    const chunks = [];
    let start = 0;

    while (start < text.length) {
        const end = Math.min(start + size, text.length);
        chunks.push(text.substring(start, end));
        
        if (end === text.length) break;
        
        start += (size - overlap);
    }

    return chunks;
}

/**
 * Truncate text if it exceeds a limit and append a notice.
 * @param {string} text 
 * @param {number} limit 
 * @param {number} truncateAt 
 * @returns {string}
 */
export function truncateResponse(text, limit = 2000, truncateAt = 1950) {
    if (!text || text.length <= limit) {
        return text;
    }

    const notice = "... [Truncated due to length]";
    return text.substring(0, truncateAt) + notice;
}

/**
 * Get current timestamp formatted in ISO 8601 with timezone offset.
 * Defaults to UTC if no timezone is provided.
 * @param {string} timezone - IANA timezone name (e.g., 'Europe/Moscow', 'America/New_York')
 * @returns {string}
 */
export function getFormattedTimestamp(timezone = 'UTC') {
    const now = new Date();
    
    try {
        const formatter = new Intl.DateTimeFormat('en-US', { 
            timeZone: timezone,
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZoneName: 'short'
        });
        
        return formatter.format(now);
    } catch (e) {
        console.error(`Invalid timezone '${timezone}'. Falling back to UTC.`, e);
        // Fallback to UTC if timezone is invalid
        return now.toISOString().replace(/\.\d{3}Z$/, 'Z');
    }
}
