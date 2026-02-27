import { analyzeDocument } from './gemini.js';

/**
 * Text Extraction Service
 */

export async function extractText(buffer, mimeType, apiKey = null) {
    if (mimeType === 'text/plain') {
        return new TextDecoder().decode(buffer);
    }
    
    if (mimeType === 'application/pdf') {
        if (!apiKey) {
            throw new Error(`PDF extraction requires GEMINI_API_KEY`);
        }
        return await analyzeDocument(apiKey, buffer, mimeType, "Extract all text from this PDF document accurately.");
    }
    
    throw new Error(`Unsupported MIME type: ${mimeType}`);
}
