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
 * @param {number} [task.remaining_count] - Number of times to repeat
 * @param {number} [task.interval_ms] - Interval between repetitions in ms
 * @returns {Promise<number>} - ID of the created task
 */
export async function createTask(db, task) {
    const { user_id, task_type, payload, scheduled_at, cron_rule = null, remaining_count = 1, interval_ms = 0 } = task;
    const stmt = db.prepare(
        `INSERT INTO tasks (user_id, task_type, payload, scheduled_at, cron_rule, remaining_count, interval_ms) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    const result = await stmt.bind(user_id, task_type, payload, scheduled_at, cron_rule, remaining_count, interval_ms).run();
    return result.meta.last_row_id;
}

/**
 * Creates a new task and returns the full D1 result for verification.
 * @param {import('@cloudflare/workers-types').D1Database} db - The D1 database binding
 * @param {Object} task - Task details
 * @returns {Promise<import('@cloudflare/workers-types').D1Response>} - D1 response object
 */
export async function createTaskVerified(db, task) {
    const { user_id, task_type, payload, scheduled_at, cron_rule = null, remaining_count = 1, interval_ms = 0 } = task;
    const stmt = db.prepare(
        `INSERT INTO tasks (user_id, task_type, payload, scheduled_at, cron_rule, remaining_count, interval_ms) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    return await stmt.bind(user_id, task_type, payload, scheduled_at, cron_rule, remaining_count, interval_ms).run();
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

/**
 * Saves a task awaiting user confirmation
 */
export async function savePendingTask(db, task) {
    const { id, user_id, task_type, payload, start_offset_ms, interval_ms, total_count } = task;
    const stmt = db.prepare(
        `INSERT INTO pending_tasks (id, user_id, task_type, payload, start_offset_ms, interval_ms, total_count) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    await stmt.bind(id, user_id, task_type, payload, start_offset_ms, interval_ms, total_count).run();
}

/**
 * Retrieves a pending task by ID
 */
export async function getPendingTask(db, id) {
    const stmt = db.prepare(`SELECT * FROM pending_tasks WHERE id = ?`);
    return await stmt.bind(id).first();
}

/**
 * Retrieves the most recent pending task for a user
 */
export async function getLatestPendingTask(db, userId) {
    const stmt = db.prepare(
        `SELECT * FROM pending_tasks 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT 1`
    );
    return await stmt.bind(userId).first();
}

/**
 * Deletes a pending task by ID
 */
export async function deletePendingTask(db, id) {
    await db.prepare(`DELETE FROM pending_tasks WHERE id = ?`).bind(id).run();
}

