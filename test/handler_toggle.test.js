import { describe, it, expect, vi } from 'vitest';
import { handleUpdate } from '../src/handlers/commands.js';
import * as UsersDAL from '../src/db/users.js';
import * as TelegramService from '../src/services/telegram.js';

vi.mock('../src/db/users.js');
vi.mock('../src/services/telegram.js');
vi.mock('../src/db/messages.js');
vi.mock('../src/services/ai.js');
vi.mock('../src/services/vector.js');

describe('/toggle_gemini command', () => {
    const mockEnv = {
        TG_TOKEN: 'token',
        DB: { prepare: vi.fn().mockReturnThis(), bind: vi.fn().mockReturnThis(), run: vi.fn().mockResolvedValue({ meta: { last_row_id: 1 } }) },
    };

    it('should switch provider from cloudflare to gemini', async () => {
        const update = { message: { chat: { id: 123 }, text: '/toggle_gemini', from: { id: 123 } } };
        UsersDAL.getUser.mockResolvedValue({ preferred_ai_provider: 'cloudflare' });
        
        await handleUpdate({ env: mockEnv, json: vi.fn() }, update);

        expect(UsersDAL.updateAIProvider).toHaveBeenCalledWith(mockEnv.DB, '123', 'gemini');
        expect(TelegramService.sendMessage).toHaveBeenCalledWith(
            'token',
            '123',
            expect.stringContaining('switched to: gemini')
        );
    });

    it('should switch provider from gemini to cloudflare', async () => {
        const update = { message: { chat: { id: 123 }, text: '/toggle_gemini', from: { id: 123 } } };
        UsersDAL.getUser.mockResolvedValue({ preferred_ai_provider: 'gemini' });
        
        await handleUpdate({ env: mockEnv, json: vi.fn() }, update);

        expect(UsersDAL.updateAIProvider).toHaveBeenCalledWith(mockEnv.DB, '123', 'cloudflare');
        expect(TelegramService.sendMessage).toHaveBeenCalledWith(
            'token',
            '123',
            expect.stringContaining('switched to: cloudflare')
        );
    });
});
