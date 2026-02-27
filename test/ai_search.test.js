import { describe, it, expect, vi } from 'vitest';
import { querySearch, indexPdf } from '../src/services/ai_search.js';

describe('AI Search Service', () => {
    it('querySearch should call .search() on the binding', async () => {
        const mockBinding = {
            search: vi.fn().mockResolvedValue({ data: [{ content: 'test content' }] })
        };
        const query = 'test query';
        
        const result = await querySearch(mockBinding, query);
        
        expect(mockBinding.search).toHaveBeenCalledWith(query, expect.objectContaining({
            max_results: 5,
            query_rewriting: true
        }));
        expect(result.data[0].content).toBe('test content');
    });

    it('indexPdf should return success (auto-indexing mode)', async () => {
        const result = await indexPdf({});
        expect(result.success).toBe(true);
    });
});
