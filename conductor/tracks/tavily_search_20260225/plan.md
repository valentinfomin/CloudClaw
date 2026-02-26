# Implementation Plan: Integrate Tavily Search

## Phase 1: Tavily Service Integration

- [x] Task: Create Tavily search service module. 0d3fa7e
    - [x] Sub-task: Create a new file `src/services/search.js`.
    - [x] Sub-task: Implement `performTavilySearch` function using `fetch` to interact with the Tavily API.
    - [x] Sub-task: Write unit tests in `test/search.test.js` to verify API interaction and error handling.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Tavily Service Integration' (Protocol in workflow.md) [checkpoint: 86bd85c]

## Phase 2: AI Agent Integration

- [x] Task: Update the AI system prompt to handle search context. 1d2ca67
    - [x] Sub-task: Modify the `systemPrompt` in `src/handlers/commands.js` to instruct the AI on how to utilize search context.
- [x] Task: Implement automatic search inference. 57b99be
    - [x] Sub-task: Update `processText` in `src/handlers/commands.js` to determine if a search is needed before calling the main AI engine. (This might involve a preliminary, fast AI call to classify the intent).
    - [x] Sub-task: Write integration tests to verify the search inference logic.
- [x] Task: Integrate search results into the final AI response. 57b99be
    - [x] Sub-task: If a search is triggered, call `performTavilySearch`.
    - [x] Sub-task: Append the search results to the context provided to the main AI call.
    - [x] Sub-task: Update tests to mock the search service and verify the final response generation.
- [x] Task: Conductor - User Manual Verification 'Phase 2: AI Agent Integration' (Protocol in workflow.md) [checkpoint: 1876b9d]

## Phase 3: Configuration and Deployment

- [x] Task: Configure environment variables. 4629e9b
    - [x] Sub-task: Add `TAVILY_API_KEY` to the local `.dev.vars` file (for local testing).
    - [x] Sub-task: Add instructions to README for setting the secret in Cloudflare.
- [x] Task: Deploy to production. f8a9c43
    - [x] Sub-task: Run `npx wrangler deploy`.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Configuration and Deployment' (Protocol in workflow.md)