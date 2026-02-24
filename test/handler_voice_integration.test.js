import { describe, it, expect, vi } from 'vitest';
import { handleUpdate } from '../src/handlers/commands.js';
import * as AI from '../src/services/ai.js';
import * as TelegramService from '../src/services/telegram.js';
import * as VectorService from '../src/services/vector.js';
import * as MessagesDAL from '../src/db/messages.js';

vi.mock('../src/services/ai.js');
vi.mock('../src/services/telegram.js');
vi.mock('../src/db/messages.js');
vi.mock('../src/db/users.js');
vi.mock('../src/db/files.js');
vi.mock('../src/services/vector.js');

describe('Voice Integration Handler', () => {
    const mockEnv = {
        TG_TOKEN: 'token',
        DB: {
            prepare: vi.fn().mockReturnThis(),
            bind: vi.fn().mockReturnThis(),
            run: vi.fn().mockResolvedValue({ meta: { last_row_id: 1 } }),
            all: vi.fn()
        },
        VECTOR_INDEX: {
            upsert: vi.fn().mockResolvedValue({})
        },
        AI: {}
    };

    it('should transcribe voice and reply with AI', async () => {
        const update = {
            message: {
                chat: { id: 123 },
                from: { id: 123, username: 'testuser' },
                voice: {
                    file_id: 'voice_123',
                    mime_type: 'audio/ogg'
                }
            }
        };

        const mockAudio = new ArrayBuffer(8);
        const transcribedText = "What is the capital of France?";
        const aiReply = "The capital of France is Paris.";

        TelegramService.getFileInfo.mockResolvedValue({ file_path: 'voice/msg.ogg' });
        TelegramService.downloadFile.mockResolvedValue(mockAudio);
        AI.transcribeAudio.mockResolvedValue(transcribedText);
        VectorService.semanticSearch.mockResolvedValue([]);
        AI.generateEmbedding.mockResolvedValue([0.1]);
        MessagesDAL.getChatHistory.mockResolvedValue([]);
        AI.runChat.mockResolvedValue(aiReply);

        const c = { env: mockEnv, json: vi.fn() };

        await handleUpdate(c, update);

        // Verify transcription was called
        expect(AI.transcribeAudio).toHaveBeenCalledWith(mockEnv.AI, mockAudio);

        // Verify text pipeline proceeded with transcribed text
        expect(TelegramService.sendMessage).toHaveBeenCalledWith(
            expect.any(String),
            '123',
            expect.stringContaining(aiReply)
        );
        
        // Verify transcription notification
        expect(TelegramService.sendMessage).toHaveBeenCalledWith(
            expect.any(String),
            '123',
            expect.stringContaining(`Transcribed: ${transcribedText}`)
        );
    });
});
