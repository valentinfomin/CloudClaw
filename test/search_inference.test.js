import { describe, it, expect, vi, afterEach } from 'vitest';
import { handleUpdate } from '../src/handlers/commands.js';
import * as aiService from '../src/services/ai.js';
import * as telegramService from '../src/services/telegram.js';
import * as searchService from '../src/services/search.js';
import * as usersDb from '../src/db/users.js';
import * as messagesDb from '../src/db/messages.js';

vi.mock('../src/services/ai.js');
vi.mock('../src/services/telegram.js');
vi.mock('../src/services/search.js');
vi.mock('../src/db/users.js');
vi.mock('../src/db/messages.js');

describe('Search Inference Integration', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should infer that a search is needed and perform the search', async () => {
        // Setup mocks
        usersDb.getUser.mockResolvedValue({ preferred_ai_provider: 'cloudflare' });
        messagesDb.getChatHistory.mockResolvedValue([]);
        messagesDb.logMessage.mockResolvedValue(1);
        
        // Mock the inference call to return "SEARCH_NEEDED: YES"
        aiService.runChat.mockResolvedValueOnce("SEARCH_NEEDED: YES: Search query");
        
        // Mock the final response call
        aiService.runChat.mockResolvedValueOnce("Final response based on search");

        searchService.performTavilySearch.mockResolvedValue([{ content: 'Search result content' }]);

        const update = {
            message: {
                chat: { id: 123 },
                from: { id: 123, username: 'user' },
                text: 'What is the current price of Bitcoin?'
            }
        };

        const c = {
            env: {
                TG_TOKEN: 'mock_token',
                TAVILY_API_KEY: 'mock_tavily',
                DB: {},
                VECTOR_INDEX: {
                    upsert: vi.fn().mockResolvedValue(),
                    query: vi.fn().mockResolvedValue({ matches: [] })
                },
                AI: {}
            },
            json: vi.fn()
        };

        await handleUpdate(c, update);

        expect(searchService.performTavilySearch).toHaveBeenCalledWith('mock_tavily', expect.any(String));
        
        // Verify that the final AI call included the search results in the system prompt
        const lastAiCallArgs = aiService.runChat.mock.calls[1];
        const systemMessage = lastAiCallArgs[2].find(m => m.role === 'system');
        expect(systemMessage.content).toContain('Search result content');
    });

    it('should infer that a search is NOT needed', async () => {
        // Setup mocks
        usersDb.getUser.mockResolvedValue({ preferred_ai_provider: 'cloudflare' });
        messagesDb.getChatHistory.mockResolvedValue([]);
        messagesDb.logMessage.mockResolvedValue(1);
        
        // Mock the inference call to return "SEARCH_NEEDED: NO"
        aiService.runChat.mockResolvedValueOnce("SEARCH_NEEDED: NO");
        
        // Mock the final response call
        aiService.runChat.mockResolvedValueOnce("Final response without search");

        const update = {
            message: {
                chat: { id: 123 },
                from: { id: 123, username: 'user' },
                text: 'Hello there'
            }
        };

        const c = {
            env: {
                TG_TOKEN: 'mock_token',
                TAVILY_API_KEY: 'mock_tavily',
                DB: {},
                VECTOR_INDEX: {
                    upsert: vi.fn().mockResolvedValue(),
                    query: vi.fn().mockResolvedValue({ matches: [] })
                },
                AI: {}
            },
            json: vi.fn()
        };

        await handleUpdate(c, update);

        expect(searchService.performTavilySearch).not.toHaveBeenCalled();
    });
});
