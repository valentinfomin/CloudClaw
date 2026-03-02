import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTask, getPendingTasks, updateTaskStatus, handleTaskFailure, createTaskVerified, savePendingTask, getPendingTask, deletePendingTask } from '../src/db/tasks.js';

describe('Tasks Database Module', () => {
    let mockDb;
    let mockStmt;

    beforeEach(() => {
        mockStmt = {
            bind: vi.fn().mockReturnThis(),
            run: vi.fn().mockResolvedValue({ success: true, meta: { last_row_id: 1, changes: 1 } }),
            all: vi.fn().mockResolvedValue({ results: [{ id: 1, status: 'pending' }] })
        };
        mockDb = {
            prepare: vi.fn().mockReturnValue(mockStmt)
        };
    });

    it('createTask should insert a task and return its id', async () => {
        const task = {
            user_id: 'user123',
            task_type: 'reminder',
            payload: '{"text": "hello"}',
            scheduled_at: 1000
        };

        const id = await createTask(mockDb, task);
        
        expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO tasks'));
        expect(mockStmt.bind).toHaveBeenCalledWith('user123', 'reminder', '{"text": "hello"}', 1000, null, 1, 0);
        expect(id).toBe(1);
    });

    it('createTaskVerified should insert a task and return the full result', async () => {
        const task = {
            user_id: 'user123',
            task_type: 'reminder',
            payload: '{"text": "hello"}',
            scheduled_at: 1000
        };

        const result = await createTaskVerified(mockDb, task);
        
        expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO tasks'));
        expect(mockStmt.bind).toHaveBeenCalledWith('user123', 'reminder', '{"text": "hello"}', 1000, null, 1, 0);
        expect(result.success).toBe(true);
        expect(result.meta.last_row_id).toBe(1);
    });

    it('createTask should support custom remaining_count and interval_ms', async () => {
        const task = {
            user_id: 'user123',
            task_type: 'reminder',
            payload: '{}',
            scheduled_at: 1000,
            remaining_count: 5,
            interval_ms: 60000
        };

        await createTask(mockDb, task);
        
        expect(mockStmt.bind).toHaveBeenCalledWith('user123', 'reminder', '{}', 1000, null, 5, 60000);
    });

    it('createTaskVerified should propagate database errors', async () => {
        const task = { user_id: 'u', task_type: 't', scheduled_at: 0 };
        mockStmt.run.mockRejectedValue(new Error('D1 ERROR'));

        await expect(createTaskVerified(mockDb, task)).rejects.toThrow('D1 ERROR');
    });

    it('getPendingTasks should retrieve tasks due for execution', async () => {
        const tasks = await getPendingTasks(mockDb);
        
        expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("status = 'pending'"));
        expect(mockStmt.bind).toHaveBeenCalledWith(expect.any(Number), 50);
        expect(tasks).toEqual([{ id: 1, status: 'pending' }]);
    });

    it('updateTaskStatus should update the status', async () => {
        await updateTaskStatus(mockDb, 1, 'completed');
        
        expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE tasks SET status = ?'));
        expect(mockStmt.bind).toHaveBeenCalledWith('completed', 1);
    });

    it('handleTaskFailure should increment retry_count and push schedule if under max', async () => {
        await handleTaskFailure(mockDb, 1, 0, 3, 5000);
        
        expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('retry_count = retry_count + 1'));
        // Arg 1 is nextSchedule (close to Date.now() + 5000), Arg 2 is id (1)
        expect(mockStmt.bind).toHaveBeenCalledWith(expect.any(Number), 1);
    });

    it('handleTaskFailure should mark as failed if max retries reached', async () => {
        await handleTaskFailure(mockDb, 1, 3, 3);
        
        expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE tasks SET status = ?'));
        expect(mockStmt.bind).toHaveBeenCalledWith('failed', 1);
    });

    it('savePendingTask should insert into pending_tasks', async () => {
        const task = {
            id: 'uuid',
            user_id: 'u1',
            task_type: 'reminder',
            payload: '{}',
            start_offset_ms: 0,
            interval_ms: 0,
            total_count: 1
        };

        await savePendingTask(mockDb, task);
        expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO pending_tasks'));
        expect(mockStmt.bind).toHaveBeenCalledWith('uuid', 'u1', 'reminder', '{}', 0, 0, 1);
    });

    it('getPendingTask should retrieve by id', async () => {
        mockStmt.first = vi.fn().mockResolvedValue({ id: 'uuid' });
        const result = await getPendingTask(mockDb, 'uuid');
        expect(result.id).toBe('uuid');
    });

    it('deletePendingTask should delete by id', async () => {
        await deletePendingTask(mockDb, 'uuid');
        expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM pending_tasks'));
    });
});
