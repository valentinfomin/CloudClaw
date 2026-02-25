# Implementation Plan - Image Analysis & OCR

## Phase 1: Gemini Service Integration
- [~] Task: Implement Gemini Client.
    - [ ] Sub-task: Create `src/services/gemini.js` to handle communication with Google AI.
    - [ ] Sub-task: Implement `analyzeImage` function.
    - [ ] Sub-task: Write unit tests with mocked API responses.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Gemini Service Integration' (Protocol in workflow.md)

## Phase 2: Image Pipeline Extension [checkpoint: 4aee5a7]
- [x] Task: Extend `handleFile`.
    - [x] Sub-task: Update `handleFile` in `src/handlers/commands.js` to trigger Gemini analysis for `message.photo`.
    - [x] Sub-task: Integrate indexing of Gemini's description into the existing Vectorize flow.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Image Pipeline Extension' (Protocol in workflow.md)

## Phase 3: Finalization & Deployment [checkpoint: 752328f]
- [x] Task: End-to-End Test.
    - [x] Sub-task: Upload a photo and verify retrieval via text query.
- [x] Task: Deploy.
    - [x] Sub-task: Run `npx wrangler deploy`.
- [x] Task: Conductor - User Manual Verification 'Phase 3: Finalization & Deployment' (Protocol in workflow.md)
