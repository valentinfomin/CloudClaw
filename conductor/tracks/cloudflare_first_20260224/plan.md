# Implementation Plan - Cloudflare First & Fallback

## Phase 1: Settings Persistence
- [x] Task: Update User Schema.
    - [x] Sub-task: Create migration `migrations/0003_user_settings.sql` adding `ai_provider` column.
    - [x] Sub-task: Apply migration.
- [~] Task: Update User DAL.
    - [ ] Sub-task: Update `src/db/users.js` to handle the new column.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Settings Persistence' (Protocol in workflow.md)

## Phase 2: Routing Logic
- [~] Task: Implement Routing.
    - [ ] Sub-task: Refactor `handleUpdate` to select model based on user settings.
    - [ ] Sub-task: Update `src/services/ai.js` to support text reasoning via Gemini if needed.
- [ ] Task: Fallback Detection.
    - [ ] Sub-task: Add error handling to catch Cloudflare limit exceptions.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Routing Logic' (Protocol in workflow.md)

## Phase 3: Control Commands
- [ ] Task: Implement `/toggle_gemini`.
    - [ ] Sub-task: Create command handler to update the user's provider in D1.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Control Commands' (Protocol in workflow.md)

## Phase 4: Finalization
- [ ] Task: End-to-End Test.
- [ ] Task: Deploy.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Finalization' (Protocol in workflow.md)
