import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleUpdate } from '../src/handlers/commands.js';
import * as AI from '../src/services/ai.js';
import * as UsersDAL from '../src/db/users.js';
import * as TelegramService from '../src/services/telegram.js';
import * as MessagesDAL from '../src/db/messages.js';

vi.mock('../src/services/ai.js');
vi.mock('../src/db/users.js');
vi.mock('../src/db/messages.js');
vi.mock('../src/services/telegram.js');
vi.mock('../src/services/vector.js');

describe('AI Routing Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockEnv = {
        TG_TOKEN: 'token',
        DB: { prepare: vi.fn().mockReturnThis(), bind: vi.fn().mockReturnThis(), run: vi.fn().mockResolvedValue({ meta: { last_row_id: 1 } }) },
        VECTOR_INDEX: { upsert: vi.fn().mockResolvedValue({}) },
        AI: {},
        GEMINI_API_KEY: 'gemini_key'
    };

    it('should use cloudflare by default', async () => {
        const update = { message: { chat: { id: 123 }, text: 'Hello', from: { id: 123 } } };
        UsersDAL.getUser.mockResolvedValue({ preferred_ai_provider: 'cloudflare' });
        MessagesDAL.getChatHistory.mockResolvedValue([]);
        AI.runChat.mockResolvedValue('CF reply');
        AI.generateEmbedding.mockResolvedValue([0.1]);

        await handleUpdate({ env: mockEnv, json: vi.fn() }, update);

        expect(AI.runChat).toHaveBeenCalled();
        expect(AI.runChatGemini).not.toHaveBeenCalled();
    });

    it('should switch to gemini on fallback', async () => {
        const update = { message: { chat: { id: 123 }, text: 'Hello', from: { id: 123 } } };
        UsersDAL.getUser.mockResolvedValue({ preferred_ai_provider: 'cloudflare' });
        MessagesDAL.getChatHistory.mockResolvedValue([]);
        AI.generateEmbedding.mockResolvedValue([0.1]);
        
        // Mock CF failure
        AI.runChat.mockRejectedValue(new Error('Cloudflare limit 429 reached'));
        AI.runChatGemini.mockResolvedValue('Gemini fallback reply');

        await handleUpdate({ env: mockEnv, json: vi.fn() }, update);

        expect(AI.runChatGemini).toHaveBeenCalled();
        expect(TelegramService.sendMessage).toHaveBeenCalledWith(
            expect.any(String),
            '123',
            expect.stringContaining('Switching to Gemini')
        );
    });

    it('should use gemini if preferred', async () => {
        const update = { message: { chat: { id: 123 }, text: 'Hello', from: { id: 123 } } };
        UsersDAL.getUser.mockResolvedValue({ preferred_ai_provider: 'gemini' });
        MessagesDAL.getChatHistory.mockResolvedValue([]);
        AI.generateEmbedding.mockResolvedValue([0.1]);
        AI.runChatGemini.mockResolvedValue('Gemini preferred reply');

        await handleUpdate({ env: mockEnv, json: vi.fn() }, update);

        expect(AI.runChatGemini).toHaveBeenCalled();
        expect(AI.runChat).not.toHaveBeenCalled();
    });
});
