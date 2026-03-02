import { getPendingTasks, updateTaskStatus, handleTaskFailure, createTaskVerified } from '../db/tasks.js';
import { sendMessage } from '../services/telegram.js';
import { runChat, PREFERRED_CHAT_MODELS } from '../services/ai.js';
import { getChatHistory } from '../db/messages.js';

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

export async function executeTask(task, env) {
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
                if (!payload.text) throw new Error("Reminder payload missing 'text'");
                await sendMessage(env.TG_TOKEN, task.user_id, `Reminder: ${payload.text}`);
                break;
            case 'ai_process':
                if (!payload.prompt) throw new Error("AI Process payload missing 'prompt'");
                
                // Construct messages
                const messages = [{ role: 'user', content: payload.prompt }];
                
                // Optionally include context
                if (payload.include_history) {
                     const history = await getChatHistory(env.DB, task.user_id, 5);
                     messages.unshift(...history.map(h => ({ role: h.role, content: h.content })));
                }

                // System instructions
                messages.unshift({ role: 'system', content: 'You are a background AI agent completing a task for the user.' });

                const aiResponse = await runChat(env.AI, PREFERRED_CHAT_MODELS, messages);
                
                // Send result back to user
                await sendMessage(env.TG_TOKEN, task.user_id, `[Background Task Complete]\n\n${aiResponse}`);
                break;
            case 'cleanup':
                // A maintenance task. We don't interact with the user or AI.
                console.log(`[Cron] Executing cleanup task for ${task.user_id}`);
                // Example: Delete old messages, clean R2, etc.
                // For now, it's a placeholder that simulates work.
                await new Promise(resolve => setTimeout(resolve, 500));
                console.log(`[Cron] Cleanup complete for ${task.user_id}`);
                break;
            default:
                throw new Error(`Unknown task type: ${task.task_type}`);
        }

        // If we get here, it succeeded
        await updateTaskStatus(env.DB, task.id, 'completed');
        console.log(`[Cron] Task ${task.id} completed successfully`);

        // Handle repetitions (Smart Reminders)
        if (task.remaining_count > 1 && task.interval_ms > 0) {
            const nextSchedule = Date.now() + task.interval_ms;
            await createTaskVerified(env.DB, {
                user_id: task.user_id,
                task_type: task.task_type,
                payload: task.payload,
                scheduled_at: nextSchedule,
                remaining_count: task.remaining_count - 1,
                interval_ms: task.interval_ms,
                cron_rule: task.cron_rule
            });
            console.log(`[Cron] Task ${task.id} repeated, next in ${task.interval_ms}ms. Remaining: ${task.remaining_count - 1}`);
        } else if (task.cron_rule) {
            // Very simple recurrence for legacy cron rules
            let nextSchedule = 0;
            if (task.cron_rule === 'daily') {
                nextSchedule = Date.now() + (24 * 60 * 60 * 1000);
            } else if (task.cron_rule === 'hourly') {
                nextSchedule = Date.now() + (60 * 60 * 1000);
            }

            if (nextSchedule > 0) {
                 await createTaskVerified(env.DB, {
                     user_id: task.user_id,
                     task_type: task.task_type,
                     payload: task.payload,
                     scheduled_at: nextSchedule,
                     cron_rule: task.cron_rule
                 });
                 console.log(`[Cron] Task ${task.id} rescheduled for ${new Date(nextSchedule).toISOString()}`);
            }
        }

    } catch (err) {
        console.error(`[Cron] Task ${task.id} failed:`, err.message);
        await handleTaskFailure(env.DB, task.id, task.retry_count, task.max_retries);
    }
}
