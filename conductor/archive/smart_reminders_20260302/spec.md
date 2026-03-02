# Specification: Smart Reminders & Complex Task Scheduling

## 1. Overview
This track implements an AI-driven task scheduling system. Instead of strictly relying on rigid slash commands, CloudClaw will use AI to infer when a user wants to set a reminder or schedule a task from standard chat messages. It will support complex repetition logic (e.g., "every 2 minutes, 3 times").

## 2. Functional Requirements
- **AI Task Inference:** 
    - The bot will analyze any text message to determine if the user is requesting a scheduled task or reminder.
    - Model: `@cf/meta/llama-3.2-3b-instruct` (Fast) for initial parsing and classification.
- **Complex Logic Parsing:** 
    - AI must extract: `task_type` (reminder, etc.), `message`, `start_time` (relative or absolute), and `repetition_rule`.
    - Support for:
        - **Intervals:** "every X minutes/hours/days".
        - **Counts:** "X times".
        - **Conditional Stop:** "until [condition]".
- **Explicit Approval UX:**
    - When an intent is detected, the bot MUST ask: "I found a task: [Description]. Should I schedule this? [Yes/No]".
    - Task is only written to D1 after the user confirms.
- **D1 Schema Extension:**
    - Update `tasks` table (or logic) to handle `remaining_count` and `interval_ms`.
    - Ensure `user_id` and `scheduled_at` are strictly enforced.
- **Cron Integration:**
    - The existing `handleCron` will be updated to handle the new repetition fields (decrement `remaining_count`, reschedule for `scheduled_at + interval_ms`).

## 3. Non-Functional Requirements
- **AI Economy:** Use the smallest/fastest model for parsing to minimize inference cost and latency.
- **Resilience:** If AI parsing fails or is ambiguous, fallback to standard chat response without erroring.

## 4. Acceptance Criteria
- [ ] User can say "napomni mne razmiat'sa kajdie 2 minuti 3 raza" and the bot understands.
- [ ] Bot asks for confirmation before scheduling.
- [ ] After confirmation, the task is executed correctly at the intervals and counts specified.
- [ ] Unit tests for the AI parsing logic and D1 repetition updates.

## 5. Out of Scope
- A full natural language date parser (will rely on LLM reasoning for now).
- Supporting complex cron strings directly from user input (rely on structured JSON from LLM).