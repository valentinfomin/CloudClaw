/**
 * Database operations for tasks
 */

/**
 * Creates a new task
 * @param {import('@cloudflare/workers-types').D1Database} db - The D1 database binding
 * @param {Object} task - Task details
 * @param {string} task.user_id - User ID
 * @param {string} task.task_type - Type of task (e.g., 'reminder', 'ai_process')
 * @param {string} task.payload - JSON string payload
 * @param {number} task.scheduled_at - Timestamp in ms
 * @param {string} [task.cron_rule] - Optional cron rule for repeating tasks
 * @returns {Promise<number>} - ID of the created task
 */
export async function createTask(db, task) {
    const { user_id, task_type, payload, scheduled_at, cron_rule = null } = task;
    const stmt = db.prepare(
        `INSERT INTO tasks (user_id, task_type, payload, scheduled_at, cron_rule) 
         VALUES (?, ?, ?, ?, ?)`
    );
    const result = await stmt.bind(user_id, task_type, payload, scheduled_at, cron_rule).run();
    return result.meta.last_row_id;
}

/**
 * Gets pending tasks that are due for execution
 * @param {import('@cloudflare/workers-types').D1Database} db - The D1 database binding
 * @param {number} [limit=50] - Max tasks to retrieve
 * @returns {Promise<Array>} - Array of pending tasks
 */
export async function getPendingTasks(db, limit = 50) {
    const now = Date.now();
    const stmt = db.prepare(
        `SELECT * FROM tasks 
         WHERE status = 'pending' AND scheduled_at <= ? 
         ORDER BY scheduled_at ASC 
         LIMIT ?`
    );
    const { results } = await stmt.bind(now, limit).all();
    return results || [];
}

/**
 * Updates the status of a task
 * @param {import('@cloudflare/workers-types').D1Database} db - The D1 database binding
 * @param {number} id - Task ID
 * @param {string} status - New status ('pending', 'processing', 'completed', 'failed')
 * @returns {Promise<void>}
 */
export async function updateTaskStatus(db, id, status) {
    const stmt = db.prepare(`UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
    await stmt.bind(status, id).run();
}

/**
 * Marks a task as failed and increments its retry count.
 * Reschedules it if under max_retries.
 * @param {import('@cloudflare/workers-types').D1Database} db - The D1 database binding
 * @param {number} id - Task ID
 * @param {number} retry_count - Current retry count
 * @param {number} max_retries - Max allowed retries
 * @param {number} [retryDelayMs=300000] - Delay before next retry in ms (default 5 mins)
 * @returns {Promise<void>}
 */
export async function handleTaskFailure(db, id, retry_count, max_retries, retryDelayMs = 300000) {
    if (retry_count < max_retries) {
        const nextSchedule = Date.now() + retryDelayMs;
        const stmt = db.prepare(
            `UPDATE tasks 
             SET status = 'pending', retry_count = retry_count + 1, scheduled_at = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`
        );
        await stmt.bind(nextSchedule, id).run();
    } else {
        await updateTaskStatus(db, id, 'failed');
    }
}
