import { getPendingTasks, updateTaskStatus, handleTaskFailure } from '../db/tasks.js';
import { sendMessage } from '../services/telegram.js';

export async function handleCron(event, env, ctx) {
    console.log(`[Cron] Triggered at ${event.cron} (${event.scheduledTime})`);
    
    try {
        const tasks = await getPendingTasks(env.DB);
        console.log(`[Cron] Found ${tasks.length} pending tasks`);
        
        for (const task of tasks) {
            // Optimistically mark as processing
            await updateTaskStatus(env.DB, task.id, 'processing');
            
            // Execute task concurrently without awaiting it in the loop
            ctx.waitUntil(executeTask(task, env).catch(err => {
                console.error(`[Cron] Task ${task.id} execution threw an error outside its try/catch:`, err);
            }));
        }
    } catch (err) {
        console.error('[Cron] Error fetching tasks:', err);
    }
}

async function executeTask(task, env) {
    console.log(`[Cron] Executing task ${task.id} of type ${task.task_type}`);
    try {
        let payload = {};
        if (task.payload) {
            try {
                payload = JSON.parse(task.payload);
            } catch (e) {
                console.warn(`[Cron] Failed to parse payload for task ${task.id}:`, e);
            }
        }

        switch (task.task_type) {
            case 'reminder':
                // Task 1: Reminder logic. No AI involved.
                if (!payload.text) throw new Error("Reminder payload missing 'text'");
                await sendMessage(env.TG_TOKEN, task.user_id, payload.text);
                break;
            case 'ai_process':
                // Will implement in Phase 3
                console.log("ai_process not fully implemented yet");
                break;
            case 'cleanup':
                // Will implement in Phase 3
                console.log("cleanup not fully implemented yet");
                break;
            default:
                throw new Error(`Unknown task type: ${task.task_type}`);
        }

        // If we get here, it succeeded
        await updateTaskStatus(env.DB, task.id, 'completed');
        console.log(`[Cron] Task ${task.id} completed successfully`);

    } catch (err) {
        console.error(`[Cron] Task ${task.id} failed:`, err.message);
        await handleTaskFailure(env.DB, task.id, task.retry_count, task.max_retries);
    }
}
