# Implementation Plan: Smart Reminders & Complex Task Scheduling

## Phase 1: AI Task Extraction Engine
- [ ] Task: Create `src/services/task_parser.js` with a function `parseTaskIntent(text, history)`.
- [ ] Task: Implement LLM prompt in `task_parser.js` that outputs structured JSON for: `intent_detected`, `message`, `start_offset_ms`, `interval_ms`, `total_count`.
- [ ] Task: Write unit tests in `test/task_parser.test.js` covering various languages and complex repetition scenarios.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: AI Task Extraction Engine' (Protocol in workflow.md)

## Phase 2: Confirmation Flow & State Management
- [ ] Task: Extend user settings or a temporary "pending_tasks" table/KV to store tasks awaiting confirmation.
- [ ] Task: Implement a confirmation handler in `src/handlers/commands.js` to process "Yes/No" replies to task proposals.
- [ ] Task: Update the main `handleSearchQuery` to call `parseTaskIntent` early and trigger the confirmation flow if an intent is found.
- [ ] Task: Write integration tests for the "Detection -> Confirmation -> D1 Write" flow.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Confirmation Flow & State Management' (Protocol in workflow.md)

## Phase 3: Recursive Task Execution
- [ ] Task: Update the `tasks` table schema in D1 to include `remaining_count` and `interval_ms` (via migration).
- [ ] Task: Update `src/handlers/cron.js` to handle repetition logic: if `remaining_count > 1`, decrement and reschedule.
- [ ] Task: Write tests for the recursive scheduling logic in `test/cron_repetition.test.js`.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Recursive Task Execution' (Protocol in workflow.md)

## Phase 4: Finalization
- [ ] Task: Deploy the updated worker to production.
- [ ] Task: Verify the full "Smart Reminder" cycle in production.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Finalization' (Protocol in workflow.md)