import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleCron } from '../src/handlers/cron.js';
import * as TasksDB from '../src/db/tasks.js';
import * as TelegramService from '../src/services/telegram.js';

vi.mock('../src/db/tasks.js');
vi.mock('../src/services/telegram.js');

describe('Cron Handler', () => {
    let mockEnv;
    let mockCtx;

    beforeEach(() => {
        vi.clearAllMocks();
        mockEnv = {
            DB: {},
            TG_TOKEN: 'token'
        };
        mockCtx = {
            waitUntil: vi.fn((promise) => {
                // To actually test the side effects of executeTask which runs asynchronously
                // we need to await the promise passed to waitUntil in our tests.
                return promise;
            })
        };
    });

    it('should fetch pending tasks and execute them', async () => {
        const mockTasks = [
            { id: 1, task_type: 'reminder', payload: '{"text": "Hello"}', user_id: 'user1' }
        ];
        TasksDB.getPendingTasks.mockResolvedValue(mockTasks);

        await handleCron({ cron: '* * * * *', scheduledTime: 123 }, mockEnv, mockCtx);

        expect(TasksDB.getPendingTasks).toHaveBeenCalledWith(mockEnv.DB);
        expect(TasksDB.updateTaskStatus).toHaveBeenCalledWith(mockEnv.DB, 1, 'processing');
        
        // waitUntil should be called with the executeTask promise
        expect(mockCtx.waitUntil).toHaveBeenCalled();
        
        // Wait for the promise passed to waitUntil to resolve to check side effects
        await mockCtx.waitUntil.mock.calls[0][0];

        expect(TelegramService.sendMessage).toHaveBeenCalledWith('token', 'user1', 'Hello');
        expect(TasksDB.updateTaskStatus).toHaveBeenCalledWith(mockEnv.DB, 1, 'completed');
    });

    it('should handle missing payload gracefully and fail task', async () => {
        const mockTasks = [
            { id: 2, task_type: 'reminder', payload: null, user_id: 'user1' }
        ];
        TasksDB.getPendingTasks.mockResolvedValue(mockTasks);

        await handleCron({}, mockEnv, mockCtx);
        await mockCtx.waitUntil.mock.calls[0][0];

        expect(TasksDB.handleTaskFailure).toHaveBeenCalledWith(mockEnv.DB, 2, undefined, undefined);
    });

    it('should handle unknown task types', async () => {
        const mockTasks = [
            { id: 3, task_type: 'unknown_type', payload: '{}', user_id: 'user1' }
        ];
        TasksDB.getPendingTasks.mockResolvedValue(mockTasks);

        await handleCron({}, mockEnv, mockCtx);
        await mockCtx.waitUntil.mock.calls[0][0];

        expect(TasksDB.handleTaskFailure).toHaveBeenCalledWith(mockEnv.DB, 3, undefined, undefined);
    });
});
