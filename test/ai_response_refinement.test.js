import { describe, it, expect, vi, afterEach } from 'vitest';
import { handleUpdate } from '../src/handlers/commands.js';
import * as aiService from '../src/services/ai.js';
import * as telegramService from '../src/services/telegram.js';
import * as usersDb from '../src/db/users.js';
import * as messagesDb from '../src/db/messages.js';

vi.mock('../src/services/ai.js');
vi.mock('../src/services/telegram.js');
vi.mock('../src/db/users.js');
vi.mock('../src/db/messages.js');

describe('AI Response Refinement Integration', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should include strict instructions in system prompt and truncate long replies', async () => {
        // Setup mocks
        usersDb.getUser.mockResolvedValue({ preferred_ai_provider: 'cloudflare' });
        messagesDb.getChatHistory.mockResolvedValue([]);
        messagesDb.logMessage.mockResolvedValue(1);
        
        // Inference call (search not needed)
        aiService.runChat.mockResolvedValueOnce("SEARCH_NEEDED: NO");
        
        // Final AI call - return a VERY long string
        const longReply = 'a'.repeat(2100);
        aiService.runChat.mockResolvedValueOnce(longReply);

        const update = {
            message: {
                chat: { id: 123 },
                from: { id: 123, username: 'user' },
                text: 'Tell me a very long story'
            }
        };

        const c = {
            env: {
                TG_TOKEN: 'mock_token',
                DB: {},
                VECTOR_INDEX: {
                    upsert: vi.fn().mockResolvedValue(),
                    query: vi.fn().mockResolvedValue({ matches: [] })
                },
                AI: {
                    autorag: vi.fn().mockReturnValue({ search: vi.fn().mockResolvedValue({ data: [] }) })
                }
            },
            json: vi.fn()
        };

        await handleUpdate(c, update);

        // 1. Verify system prompt instructions
        const lastAiCallArgs = aiService.runChat.mock.calls[1];
        const systemMessage = lastAiCallArgs[2].find(m => m.role === 'system');
        expect(systemMessage.content).toContain('Be as concise as possible');
        expect(systemMessage.content).toContain('not exceed 2000 characters');
        expect(systemMessage.content).toContain('Markdown format: [Title](URL)');

        // 2. Verify truncation was applied before sending to Telegram
        expect(telegramService.sendMessage).toHaveBeenCalledWith(
            'mock_token',
            '123',
            expect.stringContaining('... [Truncated due to length]')
        );
        const sentMessage = telegramService.sendMessage.mock.calls[0][2];
        expect(sentMessage.length).toBeLessThanOrEqual(2000);
    });
});
