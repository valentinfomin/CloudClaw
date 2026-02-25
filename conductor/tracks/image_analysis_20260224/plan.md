# Implementation Plan - Image Analysis & OCR

## Phase 1: Gemini Service Integration
- [ ] Task: Implement Gemini Client.
    - [ ] Sub-task: Create `src/services/gemini.js` to handle communication with Google AI.
    - [ ] Sub-task: Implement `analyzeImage` function.
    - [ ] Sub-task: Write unit tests with mocked API responses.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Gemini Service Integration' (Protocol in workflow.md)

## Phase 2: Image Pipeline Extension
- [ ] Task: Extend `handleFile`.
    - [ ] Sub-task: Update `handleFile` in `src/handlers/commands.js` to trigger Gemini analysis for `message.photo`.
    - [ ] Sub-task: Integrate indexing of Gemini's description into the existing Vectorize flow.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Image Pipeline Extension' (Protocol in workflow.md)

## Phase 3: Finalization & Deployment
- [ ] Task: End-to-End Test.
    - [ ] Sub-task: Upload a photo and verify retrieval via text query.
- [ ] Task: Deploy.
    - [ ] Sub-task: Run `npx wrangler deploy`.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Finalization & Deployment' (Protocol in workflow.md)
