/**
 * Text Extraction Service
 */

export async function extractText(buffer, mimeType) {
    if (mimeType === 'text/plain') {
        return new TextDecoder().decode(buffer);
    }
    
    // TODO: Add PDF support
    throw new Error(`Unsupported MIME type: ${mimeType}`);
}
