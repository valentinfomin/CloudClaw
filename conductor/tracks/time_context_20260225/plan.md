# Implementation Plan: Local Time Context for AI and Search

## Phase 1: Context Extraction and Utility

- [x] Task: Implement Timezone Extraction. c46ac72
    - [x] Sub-task: Update `src/index.js` to extract `request.cf.timezone` (and potentially `city`, `country`) from the incoming request.
    - [x] Sub-task: Pass this geolocation context into `handleUpdate`.
- [ ] Task: Create Time Utility.
    - [ ] Sub-task: Implement `getFormattedTimestamp(timezone)` in `src/utils/text.js`.
    - [ ] Sub-task: Add unit tests in `test/text_utils.test.js` to verify ISO 8601 formatting for various offsets.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Context Extraction and Utility' (Protocol in workflow.md)

## Phase 2: AI Prompt Integration

- [ ] Task: Update Global System Prompt.
    - [ ] Sub-task: Modify `systemPrompt` in `src/handlers/commands.js` to include a section for `CURRENT TIME AND LOCATION`.
    - [ ] Sub-task: Update the AI instructions to use this information for situational awareness.
- [ ] Task: Update Tavily Search Integration.
    - [ ] Sub-task: Update `performTavilySearch` in `src/services/search.js` to accept and utilize the current timestamp if relevant.
    - [ ] Sub-task: Update `processText` in `src/handlers/commands.js` to pass the timestamp to the search service.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: AI Prompt Integration' (Protocol in workflow.md)

## Phase 3: Verification & Deployment

- [ ] Task: Integration Testing.
    - [ ] Sub-task: Create or update a test (e.g., `test/time_context.test.js`) to verify that the AI receives the correct time in its system prompt.
    - [ ] Sub-task: Run full test suite: `npm test`.
- [ ] Task: Deploy to Production.
    - [ ] Sub-task: Run `npx wrangler deploy`.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Verification & Deployment' (Protocol in workflow.md)
