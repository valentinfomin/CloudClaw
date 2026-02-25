import { describe, it, expect, vi } from 'vitest';
import { semanticSearch } from '../src/services/vector.js';

describe('Unified Semantic Search', () => {
    const mockVectorIndex = {
        query: vi.fn()
    };

    it('should retrieve matches from both chat and documents', async () => {
        const queryVector = [0.1];
        const chatId = '123';
        
        mockVectorIndex.query.mockResolvedValue({
            matches: [
                { id: 'msg_1', metadata: { chat_id: '123', source: 'chat', content: 'hello' }, score: 0.9 },
                { id: 'doc_1_0', metadata: { chat_id: '123', source: 'document', content: 'AI rules' }, score: 0.85 }
            ]
        });

        const result = await semanticSearch(mockVectorIndex, queryVector, chatId);
        
        expect(result).toHaveLength(2);
        expect(result[0].metadata.source).toBe('chat');
        expect(result[1].metadata.source).toBe('document');
    });
});
