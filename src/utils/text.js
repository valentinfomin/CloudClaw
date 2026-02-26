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
    
    if (timezone === 'UTC') {
        return now.toISOString().replace(/\.\d{3}Z$/, 'Z');
    }

    try {
        // Attempt to format with the provided timezone
        return now.toLocaleString('en-US', { timeZone: timezone, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/(\d\d)\/(\d\d)\/(\d{4}), (\d\d):(\d\d):(\d\d)/, '$3-$1-$2T$4:$5:$6') + getOffset(now, timezone);
    } catch (e) {
        console.error(`Invalid timezone '${timezone}'. Falling back to UTC.`, e);
        // Fallback to UTC if timezone is invalid
        return now.toISOString().replace(/\.\d{3}Z$/, 'Z');
    }
}

// Helper to get timezone offset in ISO 8601 format
function getOffset(date, timezone) {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const localDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    const offsetMinutes = (localDate.getTime() - utcDate.getTime()) / (1000 * 60);
    const offsetHours = Math.abs(Math.floor(offsetMinutes / 60));
    const remainingMinutes = Math.abs(offsetMinutes % 60);
    const sign = offsetMinutes > 0 ? '+' : '-';
    return `${sign}${String(offsetHours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`;
}
