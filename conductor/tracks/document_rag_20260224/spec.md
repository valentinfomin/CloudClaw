# Specification: Document Parsing & RAG Integration

## Overview
This track enables CloudClaw to read and understand the contents of uploaded documents (PDFs, text files). When a user uploads a supported file, the agent extracts the text, breaks it into searchable chunks, and stores them in the vector index. This allows the bot to answer queries based on information contained within the user's private document library.

## Core Requirements
1.  **Supported Formats:**
    -   Plain Text (`.txt`).
    -   Portable Document Format (`.pdf`).
2.  **Text Extraction Logic:**
    -   For `.txt` files: Read the stream directly.
    -   For `.pdf` files: Implement a lightweight parsing mechanism compatible with Cloudflare Workers.
3.  **Chunking & Indexing:**
    -   Split extracted text into overlapping chunks (e.g., 500-1000 characters).
    -   Generate embeddings for each chunk using `@cf/baai/bge-small-en-v1.5`.
    -   Store in `VECTOR_INDEX` with metadata: `chat_id`, `file_id`, `chunk_index`, and the `text` content.
4.  **Integrated Retrieval:**
    -   Update the existing semantic search pipeline to query BOTH message vectors and document vectors.
    -   Prioritize or combine results for the LLM context.
5.  **User Feedback:**
    -   Notify the user when a document has been successfully processed and indexed.

## Technical Details
-   **Chunking Strategy:** Fixed-size chunks with 10-20% overlap.
-   **Vector Metadata:** `chat_id` (mandatory for filtering), `source: "document"`, `file_id`, `content`.
-   **Model:** Reuse `@cf/baai/bge-small-en-v1.5` for consistency.

## Success Criteria
-   Uploading a `.txt` file with specific info allows the bot to answer questions about that info.
-   The `/files` command (or new command) shows processing status.
-   RAG context in logs shows document chunks being retrieved.
