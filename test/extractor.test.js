import { describe, it, expect, vi } from 'vitest';
import { extractText } from '../src/services/extractor.js';

describe('Text Extractor Service', () => {
    it('should extract text from plain text buffer', async () => {
        const buffer = new TextEncoder().encode('Hello World').buffer;
        const result = await extractText(buffer, 'text/plain');
        expect(result).toBe('Hello World');
    });

    it('should extract text from PDF buffer using Gemini', async () => {
        const mockGenerateResponse = {
            candidates: [
                { content: { parts: [{ text: 'Extracted PDF content' }] } }
            ]
        };
        const mockModelsResponse = {
            models: [{ name: 'models/gemini-2.5-flash' }]
        };
        
        global.fetch = vi.fn()
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockModelsResponse)
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockGenerateResponse)
            });

        const buffer = new ArrayBuffer(8);
        const result = await extractText(buffer, 'application/pdf', 'test-api-key');
        expect(result).toBe('Extracted PDF content');
    });

    it('should throw for PDF without API key', async () => {
        const buffer = new ArrayBuffer(0);
        await expect(extractText(buffer, 'application/pdf')).rejects.toThrow('PDF extraction requires GEMINI_API_KEY');
    });

    it('should throw for unsupported types', async () => {
        const buffer = new ArrayBuffer(0);
        await expect(extractText(buffer, 'image/jpeg')).rejects.toThrow('Unsupported MIME type');
    });
});
