import { describe, it, expect, vi } from 'vitest';
import { analyzeImage } from '../src/services/gemini.js';

describe('Gemini Service', () => {
    it('analyzeImage should call Gemini API and return description', async () => {
        const mockModelsResponse = {
            models: [{ name: 'models/gemini-2.5-flash' }]
        };
        const mockGenerateResponse = {
            candidates: [
                { content: { parts: [{ text: 'A description of the image.' }] } }
            ]
        };
        
        const mockFetch = vi.fn()
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockModelsResponse)
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockGenerateResponse)
            });
        global.fetch = mockFetch;

        const apiKey = 'test_api_key';
        const imageBuffer = new Uint8Array([1, 2, 3]).buffer;
        const mimeType = 'image/jpeg';
        
        const result = await analyzeImage(apiKey, imageBuffer, mimeType);
        
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent'),
            expect.any(Object)
        );
        expect(result).toBe('A description of the image.');
    });

    it('analyzeImage should throw if API fails', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            statusText: 'Bad Request',
            text: () => Promise.resolve('Error details')
        });
        
        await expect(analyzeImage('key', new ArrayBuffer(0), 'image/jpeg')).rejects.toThrow('Gemini API Error: Bad Request');
    });
});
