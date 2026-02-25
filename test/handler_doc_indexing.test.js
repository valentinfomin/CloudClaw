import { describe, it, expect, vi } from 'vitest';
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

describe('Document Indexing Integration', () => {
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

        const c = { env: mockEnv, json: vi.fn() };

        await handleUpdate(c, update);

        // Verify extraction called
        expect(Extractor.extractText).toHaveBeenCalledWith(mockBuffer, 'text/plain');

        // Verify indexing called for chunks
        expect(AI.generateEmbedding).toHaveBeenCalled();
        expect(mockEnv.VECTOR_INDEX.upsert).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    metadata: expect.objectContaining({ source: 'document', filename: 'notes.txt' })
                })
            ])
        );
    });
});
