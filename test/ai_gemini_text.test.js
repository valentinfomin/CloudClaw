import { describe, it, expect, vi } from 'vitest';
import { runChatGemini } from '../src/services/ai.js';

describe('AI Service (Gemini Text)', () => {
    it('runChatGemini should call Gemini API and return text', async () => {
        const mockResponse = {
            candidates: [
                { content: { parts: [{ text: 'Gemini reply' }] } }
            ]
        };
        
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockResponse)
        });
        global.fetch = mockFetch;

        const messages = [
            { role: 'system', content: 'You are an assistant' },
            { role: 'user', content: 'Hello' }
        ];
        
        const result = await runChatGemini('key', messages);
        
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'),
            expect.any(Object)
        );
        expect(result).toBe('Gemini reply');
        
        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body.contents[1].role).toBe('user');
        expect(body.contents[1].parts[0].text).toBe('Hello');
    });
});
