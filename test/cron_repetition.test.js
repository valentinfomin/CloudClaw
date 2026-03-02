import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeTask } from '../src/handlers/cron.js';
import * as TasksDB from '../src/db/tasks.js';
import * as TelegramService from '../src/services/telegram.js';

vi.mock('../src/db/tasks.js');
vi.mock('../src/services/telegram.js');
vi.mock('../src/services/ai.js');
vi.mock('../src/db/messages.js');

describe('Cron Repetition Logic', () => {
    let mockEnv;

    beforeEach(() => {
        vi.clearAllMocks();
        mockEnv = {
            DB: {},
            TG_TOKEN: 'token',
            AI: {}
        };
    });

    it('should reschedule task if remaining_count > 1', async () => {
        const task = { 
            id: 1, 
            task_type: 'reminder', 
            payload: '{"text": "Move"}', 
            user_id: 'user1',
            remaining_count: 3,
            interval_ms: 60000
        };
        
        await executeTask(task, mockEnv);

        expect(TelegramService.sendMessage).toHaveBeenCalled();
        expect(TasksDB.createTaskVerified).toHaveBeenCalledWith(mockEnv.DB, expect.objectContaining({
            remaining_count: 2,
            interval_ms: 60000,
            scheduled_at: expect.any(Number)
        }));
    });

    it('should NOT reschedule if remaining_count is 1', async () => {
        const task = { 
            id: 2, 
            task_type: 'reminder', 
            payload: '{"text": "Last one"}', 
            user_id: 'user1',
            remaining_count: 1,
            interval_ms: 60000
        };
        
        await executeTask(task, mockEnv);

        expect(TasksDB.createTaskVerified).not.toHaveBeenCalled();
    });
});
