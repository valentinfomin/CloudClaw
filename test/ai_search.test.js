import { describe, it, expect, vi } from 'vitest';
import { querySearch, indexPdf, synthesizeAnswer } from '../src/services/ai_search.js';

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

    it('synthesizeAnswer should format results and call AI.run', async () => {
        const mockAi = {
            run: vi.fn().mockResolvedValue({ response: 'Synthesized Answer' })
        };
        const searchResults = {
            results: [
                { content: 'fact 1', metadata: { filename: 'doc1.pdf' } },
                { content: 'fact 2', metadata: { filename: 'doc2.pdf' } }
            ]
        };
        const query = 'What are the facts?';
        
        const result = await synthesizeAnswer(mockAi, query, searchResults);
        
        expect(mockAi.run).toHaveBeenCalledWith(
            expect.stringContaining('llama'),
            expect.objectContaining({
                messages: expect.arrayContaining([
                    expect.objectContaining({
                        content: expect.stringContaining('fact 1')
                    })
                ])
            })
        );
        expect(result).toBe('Synthesized Answer');
    });
});
