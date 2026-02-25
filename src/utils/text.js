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
