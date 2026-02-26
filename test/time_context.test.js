import { describe, it, expect, vi, afterEach } from 'vitest';
import { handleUpdate } from '../src/handlers/commands.js';
import * as aiService from '../src/services/ai.js';
import * as usersDb from '../src/db/users.js';
import * as messagesDb from '../src/db/messages.js';
import * as textUtils from '../src/utils/text.js';

vi.mock('../src/services/ai.js');
vi.mock('../src/db/users.js');
vi.mock('../src/db/messages.js');
vi.mock('../src/utils/text.js', async (importOriginal) => {
    const mod = await importOriginal();
    return {
        ...mod,
        getFormattedTimestamp: vi.fn(() => '2026-02-25T15:00:00+03:00')
    };
});

describe('Time Context Integration', () => {
    afterEach(() => {
        vi.clearAllMocks();
        vi.restoreAllMocks(); // Restore mocks for getFormattedTimestamp
    });

    it('should inject current time and location into the system prompt', async () => {
        // Setup mocks
        usersDb.getUser.mockResolvedValue({ preferred_ai_provider: 'cloudflare' });
        messagesDb.getChatHistory.mockResolvedValue([]);
        messagesDb.logMessage.mockResolvedValue(1);
        aiService.runChat.mockResolvedValueOnce("SEARCH_NEEDED: NO"); // Mock inference
        aiService.runChat.mockResolvedValueOnce("AI response with time"); // Mock final AI response

        const update = {
            message: {
                chat: { id: 123 },
                from: { id: 123, username: 'user' },
                text: 'What time is it?',
            }
        };

        const mockGeolocation = {
            timezone: 'Europe/Moscow',
            city: 'Moscow',
            country: 'RU',
        };

        const c = {
            env: {
                TG_TOKEN: 'mock_token',
                DB: {},
                VECTOR_INDEX: { upsert: vi.fn(), query: vi.fn(() => ({ matches: [] })) },
                AI: {}
            },
            json: vi.fn()
        };

        await handleUpdate(c, update, mockGeolocation);

        // Verify that getFormattedTimestamp was called with the correct timezone
        expect(textUtils.getFormattedTimestamp).toHaveBeenCalledWith('Europe/Moscow');

        // Verify that the system prompt includes the formatted timestamp and location
        const lastAiCallArgs = aiService.runChat.mock.calls[1];
        const systemMessage = lastAiCallArgs[2].find(m => m.role === 'system');
        expect(systemMessage.content).toContain('CURRENT TIME AND LOCATION:');
        expect(systemMessage.content).toContain('2026-02-25T15:00:00+03:00 (Moscow, RU, Timezone: Europe/Moscow)');
        expect(systemMessage.content).toContain("1. You MUST use the CONTEXT, SEARCH RESULTS, and CURRENT TIME AND LOCATION to answer the user's question.");
    });
});
