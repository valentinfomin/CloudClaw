# Implementation Plan: Universal Cron Handler & Task Scheduler

## Phase 1: Database Setup [checkpoint: 96ccd99]
- [x] Task: Create a new D1 migration file (`migrations/XXXX_create_tasks_table.sql`) with the required schema (`id`, `user_id`, `task_type`, `payload`, `scheduled_at`, `status`, `cron_rule`, `retry_count`, `max_retries`). c433a17
- [x] Task: Apply the migration to local and production databases using Wrangler.
- [x] Task: Create `src/db/tasks.js` to handle DB operations (createTask, getPendingTasks, updateTaskStatus). f300b4b
- [x] Task: Write tests for `src/db/tasks.js` in `test/db_tasks.test.js`. f300b4b
- [x] Task: Conductor - User Manual Verification 'Phase 1: Database Setup' (Protocol in workflow.md) 96ccd99

## Phase 2: Cron Handler Core [checkpoint: 6962412]
- [x] Task: Update `wrangler.toml` to include the cron trigger `[triggers] crons = ["* * * * *"]`. 3a05942
- [x] Task: Implement the `scheduled` event listener in `src/index.js` (or import a router). 3a05942
- [x] Task: Create `src/handlers/cron.js` to process pending tasks. It must fetch tasks from the DB and use `ctx.waitUntil` for concurrent execution. 3a05942
- [x] Task: Write tests for the cron fetching and status updating logic in `test/cron_handler.test.js`. 3a05942
- [x] Task: Conductor - User Manual Verification 'Phase 2: Cron Handler Core' (Protocol in workflow.md) 6962412

## Phase 3: Task Executors [checkpoint: 9256fb3]
- [x] Task: Implement the `reminder` executor in `src/handlers/cron.js`. Ensure it uses the Telegram service and does NOT call AI. eb2327a
- [x] Task: Implement the `ai_process` executor. It should parse the payload, invoke the AI service, and send the result to the user. eb2327a
- [x] Task: Implement the `cleanup` executor (e.g., a dummy implementation that logs for now, or truncates very old messages). eb2327a
- [x] Task: Add retry/failure logic to the executor loop (increment retry count, push scheduled_at, or mark failed). eb2327a
- [x] Task: Write tests verifying the executors and the retry logic. eb2327a
- [x] Task: Conductor - User Manual Verification 'Phase 3: Task Executors' (Protocol in workflow.md) 9256fb3

## Phase 4: Finalization
- [ ] Task: Deploy the updated worker to Cloudflare.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Finalization' (Protocol in workflow.md)