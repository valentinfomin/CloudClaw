import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleUpdate } from '../src/handlers/commands.js';
import * as TasksDB from '../src/db/tasks.js';
import * as TelegramService from '../src/services/telegram.js';
import * as UsersDB from '../src/db/users.js';

vi.mock('../src/db/tasks.js');
vi.mock('../src/services/telegram.js');
vi.mock('../src/db/users.js');

describe('/remind Command Integration', () => {
    let mockEnv;

    beforeEach(() => {
        vi.clearAllMocks();
        mockEnv = {
            DB: {},
            TG_TOKEN: 'token',
            AI: {
                autorag: vi.fn().mockReturnValue({ search: vi.fn() })
            }
        };
        UsersDB.getUser.mockResolvedValue({ chat_id: '123' });
        UsersDB.createUser.mockResolvedValue();
    });

    it('should set a reminder successfully with valid input', async () => {
        const update = {
            message: {
                chat: { id: 123 },
                from: { first_name: 'Test' },
                text: '/remind buy coffee in 10m'
            }
        };

        TasksDB.createTaskVerified.mockResolvedValue({ success: true, meta: { changes: 1 } });

        const c = { env: mockEnv, json: vi.fn() };
        await handleUpdate(c, update);

        expect(TasksDB.createTaskVerified).toHaveBeenCalledWith(mockEnv.DB, expect.objectContaining({
            user_id: '123',
            task_type: 'reminder',
            payload: '{"text":"buy coffee"}'
        }));
        
        expect(TelegramService.sendMessage).toHaveBeenCalledWith(
            'token', 
            '123', 
            expect.stringContaining('✅ Reminder set for 10 minutes')
        );
    });

    it('should report DB error if creation fails', async () => {
        const update = {
            message: {
                chat: { id: 123 },
                text: '/remind error in 5m'
            }
        };

        TasksDB.createTaskVerified.mockResolvedValue({ success: false });

        const c = { env: mockEnv, json: vi.fn() };
        await handleUpdate(c, update);

        expect(TelegramService.sendMessage).toHaveBeenCalledWith(
            'token', 
            '123', 
            'DB error: Task creation failed to confirm.'
        );
    });

    it('should handle malformed command input', async () => {
        const update = {
            message: {
                chat: { id: 123 },
                text: '/remind malformed'
            }
        };

        const c = { env: mockEnv, json: vi.fn() };
        await handleUpdate(c, update);

        expect(TelegramService.sendMessage).toHaveBeenCalledWith(
            'token', 
            '123', 
            expect.stringContaining('Usage: /remind')
        );
    });
});
