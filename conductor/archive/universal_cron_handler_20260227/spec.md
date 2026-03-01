# Specification: Universal Cron Handler & Task Scheduler

## 1. Overview
This track implements a universal, resource-optimized Cron handler for the Cloudflare Workers environment. The goal is to allow the agent to perform background tasks (like sending reminders, running asynchronous AI processes, or performing system cleanups) based on a schedule.

## 2. Functional Requirements
- **Database Schema:** Create a new D1 table `tasks` with columns: `id`, `user_id`, `task_type`, `payload` (JSON), `scheduled_at`, `status` (pending, completed, failed), `cron_rule` (optional, for repeating), `retry_count`, and `max_retries`.
- **Cron Trigger:** Configure `wrangler.toml` to trigger a `scheduled` event every 1 minute (`* * * * *`).
- **Task Querying:** The handler must efficiently query D1 for tasks where `status = 'pending'` and `scheduled_at <= CURRENT_TIMESTAMP`.
- **Task Types:**
  - `reminder`: Sends a simple text message to the `user_id` via Telegram. Must **not** invoke the AI engine to save resources.
  - `ai_process`: Executes an asynchronous LLM workflow (e.g., summarizing a large document in the background) and sends the result to the user.
  - `cleanup`: System maintenance task (e.g., deleting old files or truncating old message history).
- **Concurrency & Execution:** Use Cloudflare Workers' `ctx.waitUntil()` to execute fetched tasks concurrently without blocking the main event loop.
- **Security:** All user-facing tasks (`reminder`, `ai_process`) must strictly enforce sending responses only to the associated `user_id` stored in the task record.
- **Resilience:** If a task fails, increment `retry_count`. If `retry_count < max_retries`, keep status as `pending` and push `scheduled_at` to the future (e.g., +5 mins). Otherwise, mark as `failed`.

## 3. Non-Functional Requirements
- **AI Economy:** Strict separation of logic to ensure the AI binding (`env.AI`) is never called for simple tasks like reminders.
- **Performance:** The DB query must be indexed on `(status, scheduled_at)` for rapid polling every minute.

## 4. Acceptance Criteria
- [ ] D1 migration created and applied for the `tasks` table.
- [ ] `wrangler.toml` updated with `[triggers] crons = ["* * * * *"]`.
- [ ] `scheduled` event handler implemented in `src/index.js` or a dedicated cron router.
- [ ] Handlers implemented for `reminder`, `ai_process`, and `cleanup` task types.
- [ ] Unit tests verify that `reminder` tasks do not call the AI service.
- [ ] Unit tests verify that tasks are executed concurrently and status is updated correctly (success/retry/fail).

## 5. Out of Scope
- A natural language interface for users to *create* these cron tasks (that will be a separate track; this track focuses on the execution engine).