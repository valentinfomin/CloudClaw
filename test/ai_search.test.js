import { describe, it, expect, vi } from 'vitest';
import { querySearch, indexPdf, synthesizeAnswer } from '../src/services/ai_search.js';
import * as AiService from '../src/services/ai.js';

vi.mock('../src/services/ai.js', () => ({
    runChat: vi.fn().mockResolvedValue('Synthesized Answer'),
    PREFERRED_CHAT_MODELS: ['mock-model']
}));

describe('AI Search Service', () => {
    it('querySearch should call .search() on the binding via autorag', async () => {
        const mockAutorag = {
            search: vi.fn().mockResolvedValue({ data: [{ content: 'test content' }] })
        };
        const mockAi = {
            autorag: vi.fn().mockReturnValue(mockAutorag)
        };
        const query = 'test query';
        
        const result = await querySearch(mockAi, 'mypdfindex', query);
        
        expect(mockAi.autorag).toHaveBeenCalledWith('mypdfindex');
        expect(mockAutorag.search).toHaveBeenCalledWith(expect.objectContaining({
            query,
            max_results: 5,
            query_rewriting: true
        }));
        expect(result.data[0].content).toBe('test content');
    });

    it('indexPdf should return success (auto-indexing mode)', async () => {
        const result = await indexPdf({}, 'mypdfindex');
        expect(result.success).toBe(true);
    });

    it('synthesizeAnswer should format results and call runChat', async () => {
        const mockAi = {};
        const searchResults = {
            data: [
                { text: 'fact 1', filename: 'doc1.pdf' },
                { text: 'fact 2', filename: 'doc2.pdf' }
            ]
        };
        const query = 'What are the facts?';
        
        const result = await synthesizeAnswer(mockAi, query, searchResults);
        
        expect(AiService.runChat).toHaveBeenCalledWith(
            mockAi,
            expect.any(Array),
            expect.arrayContaining([
                expect.objectContaining({
                    role: 'system',
                    content: expect.stringContaining('fact 1')
                }),
                expect.objectContaining({
                    role: 'user',
                    content: expect.stringContaining(query)
                })
            ])
        );
        expect(result).toBe('Synthesized Answer');
    });
});
