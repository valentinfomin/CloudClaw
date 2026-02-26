import { describe, it, expect, vi } from 'vitest';
import { handleUpdate } from '../src/handlers/commands.js';
import * as AI from '../src/services/ai.js';
import * as VectorService from '../src/services/vector.js';
import * as MessagesDAL from '../src/db/messages.js';

vi.mock('../src/services/ai.js');
vi.mock('../src/services/vector.js');
vi.mock('../src/db/messages.js');
vi.mock('../src/db/users.js');
vi.mock('../src/services/telegram.js');

describe('RAG Integration', () => {
    const mockEnv = {
        TG_TOKEN: 'token',
        DB: {},
        VECTOR_INDEX: {
            upsert: vi.fn().mockResolvedValue({})
        },
        AI: {}
    };

    it('should include semantic context in AI prompt', async () => {
        const update = {
            message: {
                chat: { id: 123 },
                from: { id: 123, username: 'testuser' },
                text: 'What did I say about the weather?'
            }
        };

        const mockContext = [
            { metadata: { role: 'user', content: 'It is sunny today' } }
        ];

        AI.generateEmbedding.mockResolvedValue([0.1]);
        VectorService.semanticSearch.mockResolvedValue(mockContext);
        MessagesDAL.getChatHistory.mockResolvedValue([]);
        AI.runChat.mockResolvedValue("You said it's sunny.");

        const c = { env: mockEnv, json: vi.fn() };

        await handleUpdate(c, update);

        // Verify semantic search was called
        expect(VectorService.semanticSearch).toHaveBeenCalled();

        // Verify AI prompt includes context
        const runChatArgs = AI.runChat.mock.calls[AI.runChat.mock.calls.length - 1];
        const messages = runChatArgs[2];
        const systemMessage = messages.find(m => m.role === 'system');
        
        expect(systemMessage.content).toContain('It is sunny today');
    });
});
