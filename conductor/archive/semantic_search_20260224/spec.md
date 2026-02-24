# Specification: Semantic Search & RAG Integration

## Overview
This track adds semantic memory to CloudClaw using Cloudflare Vectorize. It enables the agent to remember and retrieve relevant information from past conversations and uploaded documents by comparing vector embeddings, rather than just relying on the most recent message history.

## Core Requirements
1.  **Embedding Generation:**
    -   Use `@cf/baai/bge-small-en-v1.5` to generate 768-dimension embeddings for incoming text.
2.  **Vector Indexing:**
    -   Store generated embeddings in the `VECTOR_INDEX` binding.
    -   Metadata should include `chat_id` and a reference to the original D1 record (message id).
3.  **Semantic Retrieval:**
    -   Before calling the LLM, query the Vectorize index with the user's current query embedding.
    -   Filter results by `chat_id`.
4.  **RAG (Retrieval-Augmented Generation):**
    -   Inject the top $N$ most relevant results into the LLM system prompt as "Context".

## Technical Details
-   **Binding:** `VECTOR_INDEX` (Vectorize).
-   **Embedding Model:** `@cf/baai/bge-small-en-v1.5`.
-   **Workflow:** 
    - `User Query` -> `Embed` -> `Search Vectorize` -> `Fetch Details from D1` -> `Build Prompt` -> `LLM` -> `Reply`.

## Success Criteria
-   Bot can answer questions about things mentioned much earlier in the chat history (beyond the 10-message sliding window).
-   Vectors are successfully inserted into `cloudclaw-index`.
-   RAG context is visible in debug logs.
