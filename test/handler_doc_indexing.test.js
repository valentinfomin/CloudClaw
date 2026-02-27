import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleUpdate } from '../src/handlers/commands.js';
import * as AI from '../src/services/ai.js';
import * as Extractor from '../src/services/extractor.js';
import * as StorageService from '../src/services/storage.js';
import * as FileDAL from '../src/db/files.js';

vi.mock('../src/services/ai.js');
vi.mock('../src/services/extractor.js');
vi.mock('../src/services/storage.js');
vi.mock('../src/db/files.js');
vi.mock('../src/db/users.js');
vi.mock('../src/db/messages.js');
vi.mock('../src/services/telegram.js');
vi.mock('../src/services/ai_search.js');

describe('Document Indexing Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockEnv = {
        TG_TOKEN: 'token',
        DB: {
            prepare: vi.fn().mockReturnThis(),
            bind: vi.fn().mockReturnThis(),
            run: vi.fn().mockResolvedValue({ meta: { last_row_id: 1 } }),
        },
        VECTOR_INDEX: {
            upsert: vi.fn().mockResolvedValue({})
        },
        AI_SEARCH: {},
        AI_SEARCH_BUCKET: { put: vi.fn() },
        AI: {},
        FILES: { put: vi.fn() }
    };

    it('should extract and index text from uploaded file', async () => {
        const update = {
            message: {
                chat: { id: 123 },
                from: { id: 123, username: 'testuser' },
                document: {
                    file_id: 'doc_123',
                    file_name: 'notes.txt',
                    mime_type: 'text/plain',
                    file_size: 100
                }
            }
        };

        const mockBuffer = new ArrayBuffer(100);
        const extractedText = "This is a long document about AI.";

        // Mocks
        const TelegramService = await import('../src/services/telegram.js');
        TelegramService.getFileInfo.mockResolvedValue({ file_path: 'docs/notes.txt' });
        TelegramService.downloadFile.mockResolvedValue(mockBuffer);
        
        Extractor.extractText.mockResolvedValue(extractedText);
        AI.generateEmbedding.mockResolvedValue([0.1]);

        const c = { env: { ...mockEnv, GEMINI_API_KEY: 'test-key' }, json: vi.fn() };

        await handleUpdate(c, update);

        // Verify extraction called
        expect(Extractor.extractText).toHaveBeenCalledWith(mockBuffer, 'text/plain', 'test-key');

        // Verify indexing called for chunks
        expect(AI.generateEmbedding).toHaveBeenCalled();
    });

    it('should use Cloudflare extraction by default for PDF', async () => {
        const update = {
            message: {
                chat: { id: 123 },
                from: { id: 123, username: 'testuser' },
                document: {
                    file_id: 'doc_pdf_cf',
                    file_name: 'report.pdf',
                    mime_type: 'application/pdf',
                    file_size: 500
                }
            }
        };

        const mockBuffer = new ArrayBuffer(500);
        const extractedText = "Extracted by Cloudflare.";

        const TelegramService = await import('../src/services/telegram.js');
        TelegramService.getFileInfo.mockResolvedValue({ file_path: 'docs/report.pdf' });
        TelegramService.downloadFile.mockResolvedValue(mockBuffer);
        
        AI.extractDocumentCloudflare.mockResolvedValue(extractedText);
        AI.generateEmbedding.mockResolvedValue([0.3]);

        const c = { env: { ...mockEnv, GEMINI_API_KEY: 'key' }, json: vi.fn() };

        await handleUpdate(c, update);

        expect(AI.extractDocumentCloudflare).toHaveBeenCalledWith(mockEnv.AI, mockBuffer, 'application/pdf');
        expect(mockEnv.VECTOR_INDEX.upsert).toHaveBeenCalled();
    });

    it('should use Gemini for PDF when caption contains gemini', async () => {
        const update = {
            message: {
                chat: { id: 123 },
                from: { id: 123, username: 'testuser' },
                caption: 'use gemini',
                document: {
                    file_id: 'doc_pdf_gemini',
                    file_name: 'report.pdf',
                    mime_type: 'application/pdf',
                    file_size: 500
                }
            }
        };

        const mockBuffer = new ArrayBuffer(500);
        const extractedText = "Extracted by Gemini.";

        const TelegramService = await import('../src/services/telegram.js');
        TelegramService.getFileInfo.mockResolvedValue({ file_path: 'docs/report.pdf' });
        TelegramService.downloadFile.mockResolvedValue(mockBuffer);
        
        Extractor.extractText.mockResolvedValue(extractedText);
        AI.generateEmbedding.mockResolvedValue([0.4]);

        const c = { env: { ...mockEnv, GEMINI_API_KEY: 'key' }, json: vi.fn() };

        await handleUpdate(c, update);

        expect(Extractor.extractText).toHaveBeenCalledWith(mockBuffer, 'application/pdf', 'key');
        expect(AI.extractDocumentCloudflare).not.toHaveBeenCalled();
    });

    it('should trigger AI Search for PDF upload', async () => {
        const update = {
            message: {
                chat: { id: 123 },
                from: { id: 123, username: 'testuser' },
                document: {
                    file_id: 'doc_pdf_search',
                    file_name: 'searchable.pdf',
                    mime_type: 'application/pdf',
                    file_size: 500
                }
            }
        };

        const mockBuffer = new ArrayBuffer(500);
        const AISearch = await import('../src/services/ai_search.js');

        const TelegramService = await import('../src/services/telegram.js');
        TelegramService.getFileInfo.mockResolvedValue({ file_path: 'docs/searchable.pdf' });
        TelegramService.downloadFile.mockResolvedValue(mockBuffer);

        const c = { env: { ...mockEnv, GEMINI_API_KEY: 'key' }, json: vi.fn() };

        await handleUpdate(c, update);

        expect(StorageService.uploadPdfForSearch).toHaveBeenCalled();
        expect(AISearch.indexPdf).toHaveBeenCalled();
    });
});
