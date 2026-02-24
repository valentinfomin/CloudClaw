# Implementation Plan - Voice-to-Text Transcription

## Phase 1: Transcription Service [checkpoint: 613f752]
- [x] Task: Implement Transcription Logic.
    - [x] Sub-task: Update `src/services/ai.js` to include a `transcribeAudio` function using `@cf/openai/whisper`.
    - [x] Sub-task: Write unit tests for transcription (mocking AI binding).
- [x] Task: Conductor - User Manual Verification 'Phase 1: Transcription Service' (Protocol in workflow.md)

## Phase 2: Bot Integration [checkpoint: 70b9f50]
- [x] Task: Handle Voice Updates.
    - [x] Sub-task: Update `src/handlers/commands.js` to detect `message.voice`.
    - [x] Sub-task: Implement the voice-to-text-to-reasoning flow.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Bot Integration' (Protocol in workflow.md)

## Phase 3: Testing & Deployment
- [~] Task: Integration Testing.
    - [x] Sub-task: Create a test `test/handler_voice.test.js` to simulate a voice message update.
- [~] Task: Deploy.
    - [ ] Sub-task: Run `npx wrangler deploy`.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Testing & Deployment' (Protocol in workflow.md)
