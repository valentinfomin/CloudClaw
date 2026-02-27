import { describe, it, expect, vi, afterEach } from 'vitest';
import { handleUpdate } from '../src/handlers/commands.js';
import * as aiService from '../src/services/ai.js';
import * as usersDb from '../src/db/users.js';
import * as messagesDb from '../src/db/messages.js';
import * as textUtils from '../src/utils/text.js';
import * as searchService from '../src/services/search.js';

vi.mock('../src/services/ai.js');
vi.mock('../src/db/users.js');
vi.mock('../src/db/messages.js');
vi.mock('../src/services/search.js');
vi.mock('../src/utils/text.js', async (importOriginal) => {
    const mod = await importOriginal();
    return {
        ...mod,
        getFormattedTimestamp: vi.fn((timezone) => {
            if (timezone === 'Europe/Moscow') return '2026-02-25T15:00:00+03:00';
            if (timezone === 'America/New_York') return '2026-02-25T10:00:00-05:00';
            return '2026-02-25T12:00:00Z'; // Default fallback
        })
    };
});

describe('Time Context Smart Injection', () => {
    afterEach(() => {
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    const mockGeolocation = {
        timezone: 'Europe/Moscow',
        city: 'Moscow',
        country: 'RU',
    };

    const baseC = {
        env: {
            TG_TOKEN: 'mock_token',
            DB: {},
            VECTOR_INDEX: { upsert: vi.fn(), query: vi.fn(() => ({ matches: [] })) },
            AI: {
                autorag: vi.fn().mockReturnValue({ search: vi.fn() })
            },
            TAVILY_API_KEY: 'mock_tavily_key'
        },
        json: vi.fn()
    };

    const baseUpdate = {
        message: {
            chat: { id: 123 },
            from: { id: 123, username: 'user' },
            text: 'What is the current news?',
        }
    };

    it('should inject time context when search is needed', async () => {
        usersDb.getUser.mockResolvedValue({ preferred_ai_provider: 'cloudflare' });
        messagesDb.getChatHistory.mockResolvedValue([]);
        messagesDb.logMessage.mockResolvedValue(1);
        aiService.runChat.mockResolvedValueOnce("SEARCH_NEEDED: YES: latest news");
        searchService.performTavilySearch.mockResolvedValueOnce([
            { url: "http://news.example.com", content: "Latest news content." }
        ]);
        aiService.runChat.mockResolvedValueOnce("AI response with news");

        await handleUpdate(baseC, baseUpdate, mockGeolocation);

        expect(searchService.performTavilySearch).toHaveBeenCalledWith(
            'mock_tavily_key', 
            'latest news', 
            '2026-02-25T15:00:00+03:00'
        );

        const finalAiCallArgs = aiService.runChat.mock.calls[1];
        const systemMessage = finalAiCallArgs[2].find(m => m.role === 'system');
        expect(systemMessage.content).toContain('CURRENT TIME AND LOCATION:');
        expect(systemMessage.content).toContain('2026-02-25T15:00:00+03:00 (Moscow, RU, Timezone: Europe/Moscow)');
    });

    it('should NOT inject time context when search is NOT needed', async () => {
        usersDb.getUser.mockResolvedValue({ preferred_ai_provider: 'cloudflare' });
        messagesDb.getChatHistory.mockResolvedValue([]);
        messagesDb.logMessage.mockResolvedValue(1);
        aiService.runChat.mockResolvedValueOnce("SEARCH_NEEDED: NO");
        aiService.runChat.mockResolvedValueOnce("AI response without time");

        await handleUpdate(baseC, { ...baseUpdate, message: { ...baseUpdate.message, text: 'Tell me a story' } }, mockGeolocation);

        expect(searchService.performTavilySearch).not.toHaveBeenCalled();

        const finalAiCallArgs = aiService.runChat.mock.calls[1];
        const systemMessage = finalAiCallArgs[2].find(m => m.role === 'system');
        expect(systemMessage.content).not.toContain('CURRENT TIME AND LOCATION:');
    });

    it('should use user\'s stored timezone if available', async () => {
        usersDb.getUser.mockResolvedValue({ preferred_ai_provider: 'cloudflare', timezone: 'America/New_York', city: 'New York', country: 'US' });
        messagesDb.getChatHistory.mockResolvedValue([]);
        messagesDb.logMessage.mockResolvedValue(1);
        aiService.runChat.mockResolvedValueOnce("SEARCH_NEEDED: YES: weather");
        searchService.performTavilySearch.mockResolvedValueOnce([
            { url: "http://weather.example.com", content: "Weather in New York." }
        ]);
        aiService.runChat.mockResolvedValueOnce("AI response with weather");

        await handleUpdate(baseC, baseUpdate, mockGeolocation);

        expect(searchService.performTavilySearch).toHaveBeenCalledWith(
            'mock_tavily_key', 
            'weather', 
            '2026-02-25T10:00:00-05:00'
        );

        const finalAiCallArgs = aiService.runChat.mock.calls[1];
        const systemMessage = finalAiCallArgs[2].find(m => m.role === 'system');
        expect(systemMessage.content).toContain('CURRENT TIME AND LOCATION:');
        expect(systemMessage.content).toContain('2026-02-25T10:00:00-05:00 (New York, US, Timezone: America/New_York)');
    });
});