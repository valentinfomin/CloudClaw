import { describe, it, expect, vi } from 'vitest';
import { handleUpdate } from '../src/handlers/commands.js';
import * as TelegramService from '../src/services/telegram.js';
import * as FileDAL from '../src/db/files.js';
import * as MessagesDAL from '../src/db/messages.js';
import * as UsersDAL from '../src/db/users.js';

vi.mock('../src/services/telegram.js');
vi.mock('../src/db/files.js');
vi.mock('../src/db/messages.js');
vi.mock('../src/db/users.js');

describe('File Retrieval Commands', () => {
    const mockEnv = {
        TG_TOKEN: 'token',
        DB: {
            prepare: vi.fn().mockReturnThis(),
            bind: vi.fn().mockReturnThis(),
            run: vi.fn(),
            all: vi.fn()
        },
        FILES: { put: vi.fn() },
        AI: { run: vi.fn() }
    };

    it('should list files on /files command', async () => {
        const update = {
            message: {
                chat: { id: 123 },
                text: '/files',
                from: { id: 123, username: 'testuser' }
            }
        };

        FileDAL.listFiles.mockResolvedValue([
            { id: 1, filename: 'test.jpg', created_at: '2023-01-01' }
        ]);

        const c = { env: mockEnv, json: vi.fn() };

        await handleUpdate(c, update);

        expect(FileDAL.listFiles).toHaveBeenCalledWith(mockEnv.DB, '123');
        expect(TelegramService.sendMessage).toHaveBeenCalledWith(
            'token',
            '123',
            expect.stringContaining('test.jpg')
        );
    });
});
