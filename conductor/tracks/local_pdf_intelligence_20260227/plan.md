# Implementation Plan: Local-Only PDF Intelligence

## Phase 1: Setup & Core Services
- [ ] Task: Configure a new R2 bucket binding named `AI_SEARCH_BUCKET` in `wrangler.toml` for storing PDFs.
- [ ] Task: Configure the `ai` binding in `wrangler.toml` to enable the `AI_SEARCH` feature.
- [ ] Task: Create a new service module `src/services/ai_search.js` to encapsulate all logic related to AI Search.
- [ ] Task: Write failing tests for a new `uploadPdfForSearch` function that saves a file to the correct user-prefixed path in the `AI_SEARCH_BUCKET`.
- [ ] Task: Implement the `uploadPdfForSearch` function in `src/services/storage.js`.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Setup & Core Services' (Protocol in workflow.md)

## Phase 2: Indexing with AI Search
- [ ] Task: Write failing tests in `test/ai_search.test.js` to verify that a new `indexPdf` function calls the AI Search API to index a document.
- [ ] Task: Implement the `indexPdf` function in `src/services/ai_search.js`.
- [ ] Task: Update the `handleFile` function in `src/handlers/commands.js` to call `uploadPdfForSearch` and `indexPdf` when a PDF is uploaded.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Indexing with AI Search' (Protocol in workflow.md)

## Phase 3: RAG Implementation
- [ ] Task: Write failing tests for a new `querySearch` function that retrieves context from the AI Search API based on a user query.
- [ ] Task: Implement the `querySearch` function in `src/services/ai_search.js`.
- [ ] Task: Write failing tests for a `synthesizeAnswer` function that takes search results and a query to generate a Markdown-formatted answer using a local LLM.
- [ ] Task: Implement the `synthesizeAnswer` function in `src/services/ai_search.js`.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: RAG Implementation' (Protocol in workflow.md)

## Phase 4: Finalization & Integration
- [ ] Task: Create a new command handler `handleSearchQuery` that uses the RAG pipeline (`querySearch` -> `synthesizeAnswer`).
- [ ] Task: Update the main `handleUpdate` router to direct text messages that are not commands to `handleSearchQuery`.
- [ ] Task: Write end-to-end tests to simulate a user uploading a PDF, asking a question, and receiving a correctly formatted Markdown response.
- [ ] Task: Deploy the feature to production.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Finalization & Integration' (Protocol in workflow.md)
