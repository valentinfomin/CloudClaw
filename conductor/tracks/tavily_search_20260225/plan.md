# Implementation Plan: Integrate Tavily Search

## Phase 1: Tavily Service Integration

- [ ] Task: Create Tavily search service module.
    - [ ] Sub-task: Create a new file `src/services/search.js`.
    - [ ] Sub-task: Implement `performTavilySearch` function using `fetch` to interact with the Tavily API.
    - [ ] Sub-task: Write unit tests in `test/search.test.js` to verify API interaction and error handling.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Tavily Service Integration' (Protocol in workflow.md)

## Phase 2: AI Agent Integration

- [ ] Task: Update the AI system prompt to handle search context.
    - [ ] Sub-task: Modify the `systemPrompt` in `src/handlers/commands.js` to instruct the AI on how to utilize search context.
- [ ] Task: Implement automatic search inference.
    - [ ] Sub-task: Update `processText` in `src/handlers/commands.js` to determine if a search is needed before calling the main AI engine. (This might involve a preliminary, fast AI call to classify the intent).
    - [ ] Sub-task: Write integration tests to verify the search inference logic.
- [ ] Task: Integrate search results into the final AI response.
    - [ ] Sub-task: If a search is triggered, call `performTavilySearch`.
    - [ ] Sub-task: Append the search results to the context provided to the main AI call.
    - [ ] Sub-task: Update tests to mock the search service and verify the final response generation.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: AI Agent Integration' (Protocol in workflow.md)

## Phase 3: Configuration and Deployment

- [ ] Task: Configure environment variables.
    - [ ] Sub-task: Add `TAVILY_API_KEY` to the local `.dev.vars` file (for local testing).
    - [ ] Sub-task: Add instructions to README for setting the secret in Cloudflare.
- [ ] Task: Deploy to production.
    - [ ] Sub-task: Run `npx wrangler deploy`.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Configuration and Deployment' (Protocol in workflow.md)