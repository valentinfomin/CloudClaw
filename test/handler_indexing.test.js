import { describe, it, expect, vi } from 'vitest';
import { handleUpdate } from '../src/handlers/commands.js';
import * as AI from '../src/services/ai.js';
import * as MessagesDAL from '../src/db/messages.js';

vi.mock('../src/services/ai.js');
vi.mock('../src/db/messages.js');
vi.mock('../src/db/users.js');
vi.mock('../src/services/telegram.js');

describe('Message Indexing Integration', () => {
    const mockEnv = {
        TG_TOKEN: 'token',
        DB: {},
        VECTOR_INDEX: {
            upsert: vi.fn().mockResolvedValue({})
        },
        AI: {}
    };

    it('should index user message after logging to D1', async () => {
        const update = {
            message: {
                chat: { id: 123 },
                from: { id: 123, username: 'testuser' },
                text: 'Tell me about the weather'
            }
        };

        const mockVector = [0.1, 0.2];
        MessagesDAL.logMessage.mockResolvedValue(42);
        MessagesDAL.getChatHistory.mockResolvedValue([]);
        AI.generateEmbedding.mockResolvedValue(mockVector);
        AI.runChat.mockResolvedValue("It's sunny.");

        const c = { env: mockEnv, json: vi.fn() };

        await handleUpdate(c, update);

        // Verify embedding generated
        expect(AI.generateEmbedding).toHaveBeenCalledWith(mockEnv.AI, 'Tell me about the weather');

        // Verify vector upserted
        expect(mockEnv.VECTOR_INDEX.upsert).toHaveBeenCalledWith([
            {
                id: 'msg_42',
                values: mockVector,
                metadata: { chat_id: '123', message_id: 42, role: 'user', content: 'Tell me about the weather' }
            }
        ]);
    });
});
