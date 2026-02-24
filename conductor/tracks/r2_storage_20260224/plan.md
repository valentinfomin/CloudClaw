# Implementation Plan - R2 File Storage Integration

## Phase 1: Database Schema & DAL [checkpoint: 75d8cca]
- [x] Task: Define File Schema.
    - [x] Sub-task: Create migration `migrations/0002_files_table.sql` creating the `files` table.
    - [x] Sub-task: Apply migration locally and remote.
- [x] Task: Implement Files DAL.
    - [x] Sub-task: Create `src/db/files.js` with `createFile` and `listFiles` functions.
    - [x] Sub-task: Write unit tests for Files DAL.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Database Schema & DAL' (Protocol in workflow.md)

## Phase 2: R2 Storage Logic [checkpoint: 9a50482]
- [x] Task: Implement R2 Service.
    - [x] Sub-task: Create `src/services/storage.js` to handle `put` and `get` operations on R2 binding.
    - [x] Sub-task: Write integration tests (mocking R2 binding) for storage service.
- [x] Task: Conductor - User Manual Verification 'Phase 2: R2 Storage Logic' (Protocol in workflow.md)

## Phase 3: Telegram File Handling [checkpoint: d245f68]
- [x] Task: Implement File Download Logic.
    - [x] Sub-task: Add `getFile` and `downloadFile` methods to `src/services/telegram.js`.
    - [x] Sub-task: Update `src/handlers/commands.js` to detect `document`/`photo` in updates.
- [x] Task: Integrate Upload Flow.
    - [x] Sub-task: In the handler: 1. Get file info, 2. Download, 3. Upload to R2, 4. Log to D1, 5. Reply to user.
- [x] Task: Conductor - User Manual Verification 'Phase 3: Telegram File Handling' (Protocol in workflow.md)

## Phase 4: Retrieval & Deployment
- [~] Task: Implement Retrieval Commands.
    - [ ] Sub-task: Implement `/files` command to list files from D1.
    - [ ] Sub-task: Implement `/get <file_id>` (or similar) to retrieve file from R2 and send to user.
- [ ] Task: Deploy.
    - [ ] Sub-task: Deploy updated worker.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Retrieval & Deployment' (Protocol in workflow.md)
