# Implementation Plan - Document Parsing & RAG

## Phase 1: Text Extraction Service [checkpoint: 11dc121]
- [x] Task: Implement Text Extractor.
    - [x] Sub-task: Create `src/services/extractor.js` to handle different MIME types.
    - [x] Sub-task: Implement plain text extractor.
    - [ ] Sub-task: Implement basic PDF text extractor (or integration).
    - [x] Sub-task: Write unit tests for extraction logic.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Text Extraction Service' (Protocol in workflow.md)

## Phase 2: Chunking & Indexing Pipeline [checkpoint: 601c022]
- [x] Task: Implement Chunking Logic.
    - [x] Sub-task: Add `chunkText` utility to `src/utils/text.js`.
- [x] Task: Integrated Document Indexing.
    - [x] Sub-task: Update `handleFile` in `src/handlers/commands.js` to trigger extraction and indexing after R2 upload.
    - [x] Sub-task: Store chunks in `VECTOR_INDEX`.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Chunking & Indexing Pipeline' (Protocol in workflow.md)

## Phase 3: Enhanced RAG Retrieval [checkpoint: 2004d6f]
- [x] Task: Unified Semantic Search.
    - [x] Sub-task: Update `semanticSearch` in `src/services/vector.js` to handle document-sourced metadata.
    - [x] Sub-task: Verify retrieval from both chat history and documents.
- [x] Task: Conductor - User Manual Verification 'Phase 3: Enhanced RAG Retrieval' (Protocol in workflow.md)

## Phase 4: Finalization & Deployment
- [~] Task: End-to-End Test.
    - [ ] Sub-task: Upload a text file and ask a specific question.
- [ ] Task: Deploy.
    - [ ] Sub-task: Run `npx wrangler deploy`.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Finalization & Deployment' (Protocol in workflow.md)
