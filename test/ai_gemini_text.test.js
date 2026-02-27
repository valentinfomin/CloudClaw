import { describe, it, expect, vi } from 'vitest';
import { runChatGemini } from '../src/services/ai.js';

describe('AI Service (Gemini Text)', () => {
    it('runChatGemini should call Gemini API and return text', async () => {
        const mockModelsResponse = {
            models: [{ name: 'models/gemini-2.5-flash' }]
        };
        const mockGenerateResponse = {
            candidates: [
                { content: { parts: [{ text: 'Gemini reply' }] } }
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

        const messages = [
            { role: 'system', content: 'You are an assistant' },
            { role: 'user', content: 'Hello' }
        ];
        
        const result = await runChatGemini('key', messages);
        
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent'),
            expect.any(Object)
        );
        expect(result).toBe('Gemini reply');
        
        const body = JSON.parse(mockFetch.mock.calls[1][1].body);
        expect(body.contents[1].role).toBe('user');
        expect(body.contents[1].parts[0].text).toBe('Hello');
    });
});
