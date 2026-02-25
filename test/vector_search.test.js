import { describe, it, expect, vi } from 'vitest';
import { semanticSearch } from '../src/services/vector.js';

describe('Vector Search Service', () => {
    const mockVectorIndex = {
        query: vi.fn()
    };

    it('semanticSearch should query index with filter', async () => {
        const queryVector = [0.1, 0.2];
        const chatId = '123';
        
        mockVectorIndex.query.mockResolvedValue({
            matches: [
                { id: 'msg_1', metadata: { content: 'test' }, score: 0.9 }
            ]
        });

        const result = await semanticSearch(mockVectorIndex, queryVector, chatId);
        
        expect(mockVectorIndex.query).toHaveBeenCalledWith(queryVector, {
            topK: 10,
            filter: { chat_id: { $eq: chatId } },
            returnMetadata: true
        });
        expect(result).toHaveLength(1);
        expect(result[0].metadata.content).toBe('test');
    });

    it('semanticSearch should return empty array if no matches', async () => {
        mockVectorIndex.query.mockResolvedValue({ matches: [] });
        const result = await semanticSearch(mockVectorIndex, [0.1], '123');
        expect(result).toEqual([]);
    });
});
