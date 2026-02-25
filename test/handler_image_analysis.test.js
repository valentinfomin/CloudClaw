import { describe, it, expect, vi } from 'vitest';
import { handleUpdate } from '../src/handlers/commands.js';
import * as GeminiService from '../src/services/gemini.js';
import * as AI from '../src/services/ai.js';
import * as TelegramService from '../src/services/telegram.js';
import * as FileDAL from '../src/db/files.js';

vi.mock('../src/services/gemini.js');
vi.mock('../src/services/ai.js');
vi.mock('../src/services/telegram.js');
vi.mock('../src/db/files.js');
vi.mock('../src/db/users.js');
vi.mock('../src/db/messages.js');
vi.mock('../src/services/vector.js');

describe('Image Analysis Integration', () => {
    const mockEnv = {
        TG_TOKEN: 'token',
        GEMINI_API_KEY: 'gemini_key',
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

    it('should analyze photo with Gemini and index the description', async () => {
        const update = {
            message: {
                chat: { id: 123 },
                from: { id: 123, username: 'testuser' },
                photo: [
                    { file_id: 'photo_small', file_size: 100 },
                    { file_id: 'photo_large', file_size: 500 }
                ]
            }
        };

        const mockBuffer = new ArrayBuffer(500);
        const geminiDescription = "A photo of a white refrigerator.";

        TelegramService.getFileInfo.mockResolvedValue({ file_path: 'photos/img.jpg' });
        TelegramService.downloadFile.mockResolvedValue(mockBuffer);
        GeminiService.analyzeImage.mockResolvedValue(geminiDescription);
        AI.generateEmbedding.mockResolvedValue([0.1]);

        const c = { env: mockEnv, json: vi.fn() };

        await handleUpdate(c, update);

        // Verify Gemini was called
        expect(GeminiService.analyzeImage).toHaveBeenCalledWith('gemini_key', mockBuffer, 'image/jpeg');

        // Verify indexing
        expect(mockEnv.VECTOR_INDEX.upsert).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    metadata: expect.objectContaining({ 
                        source: 'image_analysis', 
                        content: geminiDescription 
                    })
                })
            ])
        );

        // Verify bot response
        expect(TelegramService.sendMessage).toHaveBeenCalledWith(
            expect.any(String),
            '123',
            expect.stringContaining(geminiDescription)
        );
    });
});
