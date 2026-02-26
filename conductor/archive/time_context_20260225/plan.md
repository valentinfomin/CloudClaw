# Implementation Plan: Local Time Context for AI and Search

## Phase 1: Context Extraction and Utility

- [x] Task: Implement Timezone Extraction. c46ac72
    - [x] Sub-task: Update `src/index.js` to extract `request.cf.timezone` (and potentially `city`, `country`) from the incoming request.
    - [x] Sub-task: Pass this geolocation context into `handleUpdate`.
- [x] Task: Create Time Utility.
    - [x] Sub-task: Implement `getFormattedTimestamp(timezone)` in `src/utils/text.js`.
    - [x] Sub-task: Add unit tests in `test/text_utils.test.js` to verify ISO 8601 formatting for various offsets.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Context Extraction and Utility' (Protocol in workflow.md) [checkpoint: b0313e1]

## Phase 2: AI Prompt Integration

- [x] Task: Update Global System Prompt.
    - [x] Sub-task: Modify `systemPrompt` in `src/handlers/commands.js` to include a section for `CURRENT TIME AND LOCATION`.
    - [x] Sub-task: Update the AI instructions to use this information for situational awareness.
- [x] Task: Update Tavily Search Integration.
    - [x] Sub-task: Update `performTavilySearch` in `src/services/search.js` to accept and utilize the current timestamp if relevant.
    - [x] Sub-task: Update `processText` in `src/handlers/commands.js` to pass the timestamp to the search service.
- [x] Task: Conductor - User Manual Verification 'Phase 2: AI Prompt Integration' (Protocol in workflow.md) [checkpoint: 56f7418]

## Phase 3: Verification & Deployment

- [x] Task: Integration Testing. f118e3e
    - [x] Sub-task: Create or update a test (e.g., `test/time_context.test.js`) to verify that the AI receives the correct time in its system prompt.
    - [x] Sub-task: Run full test suite: `npm test`.
- [x] Task: Deploy to Production. d6760a7
    - [x] Sub-task: Run `npx wrangler deploy`.
- [x] Task: Conductor - User Manual Verification 'Phase 3: Verification & Deployment' (Protocol in workflow.md) [checkpoint: a87337a]
