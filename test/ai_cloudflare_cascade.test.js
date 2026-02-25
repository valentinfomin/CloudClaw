import { describe, it, expect, vi } from 'vitest';
import { runChat, analyzeImageCloudflare, generateEmbedding } from '../src/services/ai.js';

describe('AI Service (Cloudflare Cascade)', () => {
    it('runChat should fallback on model error', async () => {
        const mockAI = {
            run: vi.fn()
                .mockRejectedValueOnce(new Error('No such model'))
                .mockResolvedValueOnce({ response: 'Success on second try' })
        };

        const result = await runChat(mockAI, ['@cf/meta/llama-3.1-8b-instruct', '@cf/meta/llama-3-8b-instruct'], [{ role: 'user', content: 'test' }]);
        
        expect(mockAI.run).toHaveBeenCalledTimes(2);
        expect(result).toBe('Success on second try');
    });

    it('runChat should throw if all models fail', async () => {
        const mockAI = {
            run: vi.fn().mockRejectedValue(new Error('No such model'))
        };

        await expect(runChat(mockAI, ['m1', 'm2'], [])).rejects.toThrow('All preferred models failed. Last error: No such model');
        expect(mockAI.run).toHaveBeenCalledTimes(2);
    });

    it('analyzeImageCloudflare should fallback', async () => {
        const mockAI = {
            run: vi.fn()
                .mockRejectedValueOnce(new Error('No such model'))
                .mockResolvedValueOnce({ description: 'Success' })
        };

        const result = await analyzeImageCloudflare(mockAI, new ArrayBuffer(0));
        expect(mockAI.run).toHaveBeenCalledTimes(2);
        expect(result).toBe('Success');
    });

    it('generateEmbedding should fallback', async () => {
        const mockAI = {
            run: vi.fn()
                .mockRejectedValueOnce(new Error('No such model'))
                .mockResolvedValueOnce({ data: [[0.1, 0.2]] })
        };

        const result = await generateEmbedding(mockAI, 'test');
        expect(mockAI.run).toHaveBeenCalledTimes(2);
        expect(result).toEqual([0.1, 0.2]);
    });
});
