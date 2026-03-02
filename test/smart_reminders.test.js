import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleUpdate } from '../src/handlers/commands.js';
import * as TasksDB from '../src/db/tasks.js';
import * as TaskParser from '../src/services/task_parser.js';
import * as TelegramService from '../src/services/telegram.js';
import * as MessagesDB from '../src/db/messages.js';
import * as UsersDB from '../src/db/users.js';

vi.mock('../src/db/tasks.js');
vi.mock('../src/services/task_parser.js');
vi.mock('../src/services/telegram.js');
vi.mock('../src/db/messages.js');
vi.mock('../src/db/users.js');

describe('Smart Reminders Flow', () => {
    let mockEnv;
    let mockC;

    beforeEach(() => {
        vi.clearAllMocks();
        mockEnv = {
            DB: {},
            AI: {
                autorag: vi.fn().mockReturnValue({ search: vi.fn() })
            },
            TG_TOKEN: 'token',
            VECTOR_INDEX: {
                upsert: vi.fn().mockResolvedValue(),
                query: vi.fn().mockResolvedValue({ matches: [] })
            }
        };
        mockC = { env: mockEnv, json: vi.fn() };
        UsersDB.getUser.mockResolvedValue({ chat_id: '123' });
        UsersDB.createUser.mockResolvedValue();
        MessagesDB.logMessage.mockResolvedValue(1);
        MessagesDB.getChatHistory.mockResolvedValue([]);
    });

    it('should detect intent and save pending task', async () => {
        const update = { message: { chat: { id: 123 }, text: "Remind me later" } };
        TaskParser.parseTaskIntent.mockResolvedValue({
            intent_detected: true,
            task_type: 'reminder',
            message: 'later task',
            start_offset_ms: 1000,
            explanation: 'Understood'
        });

        await handleUpdate(mockC, update);

        expect(TasksDB.savePendingTask).toHaveBeenCalledWith(mockEnv.DB, expect.objectContaining({
            user_id: '123',
            task_type: 'reminder',
            start_offset_ms: 1000
        }));
        expect(TelegramService.sendMessage).toHaveBeenCalledWith('token', '123', expect.stringContaining('Should I schedule this?'));
    });

    it('should confirm and create verified task on "Yes"', async () => {
        const update = { message: { chat: { id: 123 }, text: "Yes" } };
        TasksDB.getLatestPendingTask.mockResolvedValue({
            id: 'p1',
            user_id: '123',
            task_type: 'reminder',
            payload: '{"text":"task"}',
            start_offset_ms: 1000,
            created_at: new Date().toISOString()
        });
        TasksDB.createTaskVerified.mockResolvedValue({ success: true, meta: {} });

        await handleUpdate(mockC, update);

        expect(TasksDB.createTaskVerified).toHaveBeenCalledWith(mockEnv.DB, expect.objectContaining({
            user_id: '123',
            task_type: 'reminder'
        }));
        expect(TelegramService.sendMessage).toHaveBeenCalledWith('token', '123', '✅ Task scheduled!');
        expect(TasksDB.deletePendingTask).toHaveBeenCalledWith(mockEnv.DB, 'p1');
    });

    it('should decline and delete pending task on "No"', async () => {
        const update = { message: { chat: { id: 123 }, text: "No" } };
        TasksDB.getLatestPendingTask.mockResolvedValue({
            id: 'p1',
            user_id: '123',
            created_at: new Date().toISOString()
        });

        await handleUpdate(mockC, update);

        expect(TasksDB.createTaskVerified).not.toHaveBeenCalled();
        expect(TelegramService.sendMessage).toHaveBeenCalledWith('token', '123', "Оkay, I won't schedule that.");
        expect(TasksDB.deletePendingTask).toHaveBeenCalledWith(mockEnv.DB, 'p1');
    });
});
