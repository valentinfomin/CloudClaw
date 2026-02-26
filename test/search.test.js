import { describe, it, expect, vi } from 'vitest';
import { performTavilySearch } from '../src/services/search.js';

describe('Tavily Search Service', () => {
    it('should successfully call the Tavily API and return results', async () => {
        const mockResponse = {
            results: [
                { title: 'Test Result 1', url: 'http://test1.com', content: 'Content 1' }
            ]
        };

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockResponse)
        });

        const results = await performTavilySearch('test_api_key', 'test query');

        expect(global.fetch).toHaveBeenCalledWith('https://api.tavily.com/search', expect.objectContaining({
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test_api_key'
            },
            body: expect.stringContaining('test query')
        }));

        expect(results).toEqual(mockResponse.results);
    });

    it('should throw an error if the API call fails', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error'
        });

        await expect(performTavilySearch('test_api_key', 'test query')).rejects.toThrow('Tavily search failed: 500 Internal Server Error');
    });

    it('should throw an error if the API key is missing', async () => {
        await expect(performTavilySearch('', 'test query')).rejects.toThrow('Tavily API key is missing');
    });
});
