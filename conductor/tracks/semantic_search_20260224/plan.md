# Implementation Plan - Semantic Search & RAG

## Phase 1: Embedding Service & Indexing
- [ ] Task: Implement Embedding Logic.
    - [ ] Sub-task: Create `src/services/ai.js` with `generateEmbedding` function.
    - [ ] Sub-task: Write unit tests for embedding generation.
- [ ] Task: Integrate Indexing into Message Flow.
    - [ ] Sub-task: Update `src/handlers/commands.js` to generate and store a vector for every incoming message.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Embedding Service & Indexing' (Protocol in workflow.md)

## Phase 2: Vector Search & Retrieval
- [ ] Task: Implement Search Service.
    - [ ] Sub-task: Create `src/services/vector.js` to query `VECTOR_INDEX` and filter by `chat_id`.
    - [ ] Sub-task: Write integration tests for vector search (mocking binding).
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Vector Search & Retrieval' (Protocol in workflow.md)

## Phase 3: RAG Integration
- [ ] Task: Augment AI Prompt.
    - [ ] Sub-task: Update `handleUpdate` in `src/handlers/commands.js` to fetch semantic context before calling LLM.
    - [ ] Sub-task: Format context and inject into the system message.
- [ ] Task: Verify RAG Accuracy.
    - [ ] Sub-task: Test bot's "Long-term Memory" with specific facts.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: RAG Integration' (Protocol in workflow.md)

## Phase 4: Deployment & Finalization
- [ ] Task: Deploy.
    - [ ] Sub-task: Run `npx wrangler deploy`.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Deployment & Finalization' (Protocol in workflow.md)
