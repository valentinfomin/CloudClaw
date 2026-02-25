import { describe, it, expect, vi } from 'vitest';
import { handleUpdate } from '../src/handlers/commands.js';
import * as GeminiService from '../src/services/gemini.js';
import * as AI from '../src/services/ai.js';
import * as TelegramService from '../src/services/telegram.js';
import * as UsersDAL from '../src/db/users.js';

vi.mock('../src/services/gemini.js');
vi.mock('../src/services/ai.js');
vi.mock('../src/services/telegram.js');
vi.mock('../src/db/users.js');
vi.mock('../src/db/files.js');
vi.mock('../src/db/messages.js');
vi.mock('../src/services/vector.js');

describe('Image Caption Override', () => {
    const mockEnv = {
        TG_TOKEN: 'token',
        GEMINI_API_KEY: 'gemini_key',
        DB: {
            prepare: vi.fn().mockReturnThis(),
            bind: vi.fn().mockReturnThis(),
            run: vi.fn().mockResolvedValue({ meta: { last_row_id: 1 } }),
        },
        VECTOR_INDEX: { upsert: vi.fn().mockResolvedValue({}) },
        AI: {},
        FILES: { put: vi.fn() }
    };

    it('should use Gemini when caption contains "gemini" even if user preference is Cloudflare', async () => {
        const update = {
            message: {
                chat: { id: 123 },
                from: { id: 123, username: 'user' },
                photo: [{ file_id: 'img_1', file_size: 500 }],
                caption: 'hey bot, use gemini for this'
            }
        };

        const imageDesc = "Gemini override description.";
        TelegramService.getFileInfo.mockResolvedValue({ file_path: 'p.jpg' });
        TelegramService.downloadFile.mockResolvedValue(new ArrayBuffer(500));
        
        // Mock user preference as cloudflare
        UsersDAL.getUser.mockResolvedValue({ preferred_ai_provider: 'cloudflare' });
        
        GeminiService.analyzeImage.mockResolvedValue(imageDesc);
        AI.generateEmbedding.mockResolvedValue([0.1]);

        const c = { env: mockEnv, json: vi.fn() };

        await handleUpdate(c, update);

        // Verify Gemini was called instead of Cloudflare
        expect(GeminiService.analyzeImage).toHaveBeenCalled();
        expect(AI.analyzeImageCloudflare).not.toHaveBeenCalled();

        // Verify response prefix
        expect(TelegramService.sendMessage).toHaveBeenCalledWith(
            expect.any(String),
            '123',
            expect.stringContaining('[Google Gemini (Manual Override)]')
        );
    });
});
