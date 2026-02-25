# Specification: Debug Document RAG

## Overview
The bot failed to answer a question based on an uploaded text file despite successful indexing. We need to verify that context is being retrieved and correctly presented to the AI.

## Potential Failure Points
1.  **Retrieval:** `semanticSearch` might return 0 results or irrelevant results.
2.  **Prompting:** The `systemPrompt` might be poorly formatted or ignored by `llama-3-8b-instruct`.
3.  **Metadata:** Metadata in Vectorize might be missing or malformed.

## Plan
1.  Add logging to `src/handlers/commands.js` to print every retrieved chunk and its score.
2.  Log the final `systemPrompt` being sent to `runChat`.
3.  Verify that `chat_id` filter is working correctly.
