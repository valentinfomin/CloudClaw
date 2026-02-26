import { describe, it, expect, vi } from 'vitest';
import { handleUpdate } from '../src/handlers/commands.js';
import * as AI from '../src/services/ai.js';
import * as Extractor from '../src/services/extractor.js';
import * as StorageService from '../src/services/storage.js';
import * as FileDAL from '../src/db/files.js';
import * as VectorService from '../src/services/vector.js';
import * as MessagesDAL from '../src/db/messages.js';
import * as TelegramService from '../src/services/telegram.js';

vi.mock('../src/services/ai.js');
vi.mock('../src/services/extractor.js');
vi.mock('../src/services/storage.js');
vi.mock('../src/db/files.js');
vi.mock('../src/db/messages.js');
vi.mock('../src/db/users.js');
vi.mock('../src/services/telegram.js');
vi.mock('../src/services/vector.js');

describe('End-to-End Document RAG Flow', () => {
    const mockEnv = {
        TG_TOKEN: 'token',
        DB: {
            prepare: vi.fn().mockReturnThis(),
            bind: vi.fn().mockReturnThis(),
            run: vi.fn().mockResolvedValue({ meta: { last_row_id: 1 } }),
        },
        VECTOR_INDEX: {
            upsert: vi.fn().mockResolvedValue({}),
            query: vi.fn()
        },
        AI: {},
        FILES: { put: vi.fn() }
    };

    it('should index a document and then use it for RAG', async () => {
        const chatId = '123';
        const c = { env: mockEnv, json: vi.fn() };

        // 1. Simulate File Upload
        const uploadUpdate = {
            message: {
                chat: { id: chatId },
                from: { id: chatId, username: 'user' },
                document: {
                    file_id: 'doc_1',
                    file_name: 'rules.txt',
                    mime_type: 'text/plain',
                    file_size: 100
                }
            }
        };

        const docContent = "Rule 1: Always be helpful. Rule 2: Stay secure.";
        TelegramService.getFileInfo.mockResolvedValue({ file_path: 'docs/rules.txt' });
        TelegramService.downloadFile.mockResolvedValue(new TextEncoder().encode(docContent).buffer);
        Extractor.extractText.mockResolvedValue(docContent);
        AI.generateEmbedding.mockResolvedValue([0.1]);

        await handleUpdate(c, uploadUpdate);

        expect(mockEnv.VECTOR_INDEX.upsert).toHaveBeenCalled();
        expect(TelegramService.sendMessage).toHaveBeenCalledWith(expect.any(String), chatId, expect.stringContaining('indexed successfully'));

        // 2. Simulate Question about the document
        const questionUpdate = {
            message: {
                chat: { id: chatId },
                from: { id: chatId, username: 'user' },
                text: 'What are the rules?'
            }
        };

        VectorService.semanticSearch.mockResolvedValue([
            { metadata: { source: 'document', content: 'Rule 1: Always be helpful. Rule 2: Stay secure.' } }
        ]);
        MessagesDAL.getChatHistory.mockResolvedValue([]);
        AI.runChat.mockResolvedValue("The rules are: 1. Be helpful, 2. Stay secure.");

        await handleUpdate(c, questionUpdate);

        // Verify that semantic search was called with the chat_id
        expect(VectorService.semanticSearch).toHaveBeenCalledWith(mockEnv.VECTOR_INDEX, expect.any(Array), chatId);

        // Verify the AI prompt contains the document content
        const runChatArgs = AI.runChat.mock.calls[AI.runChat.mock.calls.length - 1];
        expect(runChatArgs[2][0].content).toContain("Rule 1: Always be helpful");
        
        expect(TelegramService.sendMessage).toHaveBeenCalledWith(expect.any(String), chatId, expect.stringContaining("The rules are"));
    });
});
