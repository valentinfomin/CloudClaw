import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeTask } from '../src/handlers/cron.js';
import * as TasksDB from '../src/db/tasks.js';
import * as TelegramService from '../src/services/telegram.js';
import * as AIService from '../src/services/ai.js';
import * as MessagesDB from '../src/db/messages.js';

vi.mock('../src/db/tasks.js');
vi.mock('../src/services/telegram.js');
vi.mock('../src/services/ai.js');
vi.mock('../src/db/messages.js');

describe('Cron Executors', () => {
    let mockEnv;

    beforeEach(() => {
        vi.clearAllMocks();
        mockEnv = {
            DB: {},
            TG_TOKEN: 'token',
            AI: {}
        };
    });

    it('reminder should send message without AI', async () => {
        const task = { id: 1, task_type: 'reminder', payload: '{"text": "Drink water"}', user_id: 'user1' };
        
        await executeTask(task, mockEnv);

        expect(TelegramService.sendMessage).toHaveBeenCalledWith('token', 'user1', 'Reminder: Drink water');
        expect(AIService.runChat).not.toHaveBeenCalled();
        expect(TasksDB.updateTaskStatus).toHaveBeenCalledWith(mockEnv.DB, 1, 'completed');
    });

    it('ai_process should call AI and send response', async () => {
        const task = { id: 2, task_type: 'ai_process', payload: '{"prompt": "Summarize this"}', user_id: 'user1' };
        AIService.runChat.mockResolvedValue('Summary: It is good.');
        MessagesDB.getChatHistory.mockResolvedValue([]);

        await executeTask(task, mockEnv);

        expect(AIService.runChat).toHaveBeenCalled();
        expect(TelegramService.sendMessage).toHaveBeenCalledWith('token', 'user1', '[Background Task Complete]\n\nSummary: It is good.');
        expect(TasksDB.updateTaskStatus).toHaveBeenCalledWith(mockEnv.DB, 2, 'completed');
    });

    it('cleanup should simulate work and complete', async () => {
        const task = { id: 3, task_type: 'cleanup', payload: '{}', user_id: 'user1' };
        
        await executeTask(task, mockEnv);

        expect(TelegramService.sendMessage).not.toHaveBeenCalled();
        expect(AIService.runChat).not.toHaveBeenCalled();
        expect(TasksDB.updateTaskStatus).toHaveBeenCalledWith(mockEnv.DB, 3, 'completed');
    });

    it('should handle recurrence if cron_rule is present', async () => {
        const task = { id: 4, task_type: 'reminder', payload: '{"text": "Daily pill"}', user_id: 'user1', cron_rule: 'daily' };
        
        await executeTask(task, mockEnv);

        expect(TasksDB.createTask).toHaveBeenCalledWith(mockEnv.DB, expect.objectContaining({
            task_type: 'reminder',
            cron_rule: 'daily',
            scheduled_at: expect.any(Number) // Scheduled for the future
        }));
    });
});