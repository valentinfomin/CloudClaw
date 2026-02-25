import { describe, it, expect, vi } from 'vitest';
import { analyzeImageCloudflare } from '../src/services/ai.js';

describe('AI Service (Cloudflare Vision)', () => {
    it('analyzeImageCloudflare should call Workers AI and return description', async () => {
        const mockAI = {
            run: vi.fn().mockResolvedValue({
                description: 'A description from Llava.'
            })
        };

        const imageBuffer = new Uint8Array([1, 2, 3]).buffer;
        const result = await analyzeImageCloudflare(mockAI, imageBuffer);
        
        expect(mockAI.run).toHaveBeenCalledWith('@cf/llava-1.5-7b-hf', {
            image: [...new Uint8Array(imageBuffer)],
            prompt: expect.any(String)
        });
        expect(result).toBe('A description from Llava.');
    });
});
