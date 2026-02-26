# Implementation Plan: AI Response Conciseness and Formatting Refinement

## Phase 1: Logic & Prompt Implementation

- [ ] Task: Update the Global System Prompt.
    - [ ] Sub-task: Modify `systemPrompt` in `src/handlers/commands.js` to include the strict conciseness, character limit, and Markdown link instructions.
- [ ] Task: Implement Soft Truncation Utility.
    - [ ] Sub-task: Create or update a utility function `truncateResponse(text, limit)` in `src/utils/text.js`.
    - [ ] Sub-task: The function should truncate at the limit and append a truncation notice.
- [ ] Task: Integrate Truncation in Command Handler.
    - [ ] Sub-task: Update `processText` in `src/handlers/commands.js` to apply `truncateResponse` before sending the message to Telegram.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Logic & Prompt Implementation' (Protocol in workflow.md)

## Phase 2: Verification & Testing

- [ ] Task: Write Unit Tests for Truncation.
    - [ ] Sub-task: Add test cases to `test/text_utils.test.js` verifying proper truncation and notice attachment.
- [ ] Task: Integration Verification.
    - [ ] Sub-task: Update `test/search_inference.test.js` or create a new test to verify the AI includes source links at the bottom (mocking AI response).
    - [ ] Sub-task: Run full test suite: `npm test`.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Verification & Testing' (Protocol in workflow.md)

## Phase 3: Deployment

- [ ] Task: Deploy to Production.
    - [ ] Sub-task: Run `npx wrangler deploy`.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Deployment' (Protocol in workflow.md)
