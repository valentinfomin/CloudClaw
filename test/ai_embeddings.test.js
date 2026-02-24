import { describe, it, expect, vi } from 'vitest';
import { generateEmbedding } from '../src/services/ai.js';

describe('AI Embedding Service', () => {
    it('generateEmbedding should return a vector', async () => {
        const mockAI = {
            run: vi.fn().mockResolvedValue({
                data: [[0.1, 0.2, 0.3]]
            })
        };

        const result = await generateEmbedding(mockAI, 'Hello world');
        
        expect(mockAI.run).toHaveBeenCalledWith('@cf/baai/bge-small-en-v1.5', {
            text: ['Hello world']
        });
        expect(result).toEqual([0.1, 0.2, 0.3]);
    });

    it('generateEmbedding should throw if AI fails', async () => {
        const mockAI = {
            run: vi.fn().mockRejectedValue(new Error('AI Error'))
        };
        await expect(generateEmbedding(mockAI, 'test')).rejects.toThrow('AI Error');
    });
});
