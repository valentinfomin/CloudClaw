import { describe, it, expect, vi } from 'vitest';
import { handleUpdate } from '../src/handlers/commands.js';
import * as AI from '../src/services/ai.js';
import * as GeminiService from '../src/services/gemini.js';
import * as VectorService from '../src/services/vector.js';
import * as TelegramService from '../src/services/telegram.js';
import * as MessagesDAL from '../src/db/messages.js';

vi.mock('../src/services/ai.js');
vi.mock('../src/services/gemini.js');
vi.mock('../src/services/vector.js');
vi.mock('../src/services/telegram.js');
vi.mock('../src/db/messages.js');
vi.mock('../src/db/users.js');
vi.mock('../src/db/files.js');

describe('End-to-End Image Analysis Flow', () => {
    const mockEnv = {
        TG_TOKEN: 'token',
        GEMINI_API_KEY: 'gemini_key',
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

    it('should index an image description and then use it for RAG', async () => {
        const chatId = '123';
        const c = { env: mockEnv, json: vi.fn() };

        // 1. Simulate Image Upload
        const uploadUpdate = {
            message: {
                chat: { id: chatId },
                from: { id: chatId, username: 'user' },
                photo: [{ file_id: 'img_1', file_size: 500 }]
            }
        };

        const imageDesc = "A photo of a red car.";
        TelegramService.getFileInfo.mockResolvedValue({ file_path: 'photos/img.jpg' });
        TelegramService.downloadFile.mockResolvedValue(new ArrayBuffer(500));
        GeminiService.analyzeImage.mockResolvedValue(imageDesc);
        AI.generateEmbedding.mockResolvedValue([0.1]);

        await handleUpdate(c, uploadUpdate);

        expect(GeminiService.analyzeImage).toHaveBeenCalled();
        expect(mockEnv.VECTOR_INDEX.upsert).toHaveBeenCalled();

        // 2. Simulate Question about the image
        const questionUpdate = {
            message: {
                chat: { id: chatId },
                from: { id: chatId, username: 'user' },
                text: 'What color was the car?'
            }
        };

        VectorService.semanticSearch.mockResolvedValue([
            { metadata: { source: 'image_analysis', content: imageDesc } }
        ]);
        MessagesDAL.getChatHistory.mockResolvedValue([]);
        AI.runChat.mockResolvedValue("The car in the photo was red.");

        await handleUpdate(c, questionUpdate);

        // Verify the AI prompt contains the image description
        const runChatArgs = AI.runChat.mock.calls[0];
        expect(runChatArgs[2][0].content).toContain(imageDesc);
        
        expect(TelegramService.sendMessage).toHaveBeenCalledWith(expect.any(String), chatId, expect.stringContaining("red"));
    });
});
