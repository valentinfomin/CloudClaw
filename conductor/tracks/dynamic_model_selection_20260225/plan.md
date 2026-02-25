# Implementation Plan - Dynamic Model Selection

## Phase 1: AI Service Refactoring [checkpoint: 42c3440]
- [x] Task: Implement Try-Catch Cascade.
    - [x] Sub-task: Refactor `runChat`, `analyzeImageCloudflare`, and `generateEmbedding` in `src/services/ai.js` to iterate over preferred models.
    - [x] Sub-task: Update unit tests to verify the cascade logic.
- [x] Task: Conductor - User Manual Verification 'Phase 1: AI Service Refactoring' (Protocol in workflow.md)

## Phase 2: Deployment [checkpoint: 76d2991]
- [x] Task: Deploy and verify.
    - [x] Sub-task: Run `npx wrangler deploy`.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Deployment' (Protocol in workflow.md)
