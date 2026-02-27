import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleUpdate } from '../src/handlers/commands.js';
import * as AI from '../src/services/ai.js';
import * as StorageService from '../src/services/storage.js';
import * as AISearchService from '../src/services/ai_search.js';
import * as TelegramService from '../src/services/telegram.js';
import * as MessagesDAL from '../src/db/messages.js';

vi.mock('../src/services/ai.js');
vi.mock('../src/services/storage.js', async () => {
    const actual = await vi.importActual('../src/services/storage.js');
    return {
        ...actual,
        uploadPdfForSearch: vi.fn().mockResolvedValue({}),
        uploadFile: vi.fn().mockResolvedValue({})
    };
});
vi.mock('../src/services/ai_search.js');
vi.mock('../src/services/telegram.js');
vi.mock('../src/db/users.js');
vi.mock('../src/db/messages.js');
vi.mock('../src/db/files.js');

describe('E2E Local PDF Intelligence', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        MessagesDAL.logMessage.mockResolvedValue(1);
        MessagesDAL.getChatHistory.mockResolvedValue([]);
        AI.runChat.mockResolvedValue("SEARCH_NEEDED: NO");
        AI.generateEmbedding.mockResolvedValue([0.1]);
    });

    const mockEnv = {
        TG_TOKEN: 'token',
        DB: {
            prepare: vi.fn().mockReturnThis(),
            bind: vi.fn().mockReturnThis(),
            run: vi.fn().mockResolvedValue({ meta: { last_row_id: 1 } }),
        },
        AI_SEARCH_BUCKET: { put: vi.fn() },
        AI: {
            run: vi.fn(),
            autorag: vi.fn().mockReturnValue({
                search: vi.fn()
            }),
            toMarkdown: vi.fn().mockResolvedValue({ data: 'Mocked PDF Text' })
        },
        FILES: { put: vi.fn() },
        VECTOR_INDEX: { upsert: vi.fn().mockResolvedValue({}) }
    };

    it('should complete full cycle: upload PDF -> search -> answer', async () => {
        // 1. Upload Simulation
        const uploadUpdate = {
            message: {
                chat: { id: 123 },
                from: { id: 123, username: 'testuser' },
                document: {
                    file_id: 'pdf_123',
                    file_name: 'test.pdf',
                    mime_type: 'application/pdf',
                    file_size: 1000
                }
            }
        };

        TelegramService.getFileInfo.mockResolvedValue({ file_path: 'docs/test.pdf' });
        TelegramService.downloadFile.mockResolvedValue(new ArrayBuffer(10));
        AI.extractDocumentCloudflare.mockResolvedValue("Mocked PDF Content");

        await handleUpdate({ env: mockEnv, json: vi.fn() }, uploadUpdate);

        expect(StorageService.uploadPdfForSearch).toHaveBeenCalled();
        expect(AISearchService.indexPdf).toHaveBeenCalled();

        // 2. Query Simulation
        const queryUpdate = {
            message: {
                chat: { id: 123 },
                from: { id: 123, username: 'testuser' },
                text: 'What is in the PDF?'
            }
        };

        AISearchService.querySearch.mockResolvedValue({
            results: [{ content: 'This PDF contains top secret facts.', metadata: { filename: 'test.pdf' } }]
        });
        AISearchService.synthesizeAnswer.mockResolvedValue('Based on **test.pdf**, it contains top secret facts.');

        await handleUpdate({ env: mockEnv, json: vi.fn() }, queryUpdate);

        expect(AISearchService.querySearch).toHaveBeenCalledWith(mockEnv.AI, 'mypdfindex', 'What is in the PDF?');
        expect(AISearchService.synthesizeAnswer).toHaveBeenCalled();
        expect(TelegramService.sendMessage).toHaveBeenCalledWith(
            expect.any(String),
            '123',
            expect.stringContaining('Based on **test.pdf**')
        );
    });
});
