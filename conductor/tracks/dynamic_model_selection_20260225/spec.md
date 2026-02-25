# Specification: Dynamic Model Selection

## Overview
To prevent issues with deprecated models, both Gemini and Cloudflare AI services should dynamically verify and select the best available model from a predefined list of preferences, rather than hardcoding a single string.

## Core Requirements
1.  **Cloudflare AI Dynamic Selection:**
    -   Since Workers AI doesn't have a simple standard REST API `models/list` that works *inside* the worker without extra API tokens, we will use a "try-catch cascade" approach for Cloudflare models.
    -   Define an array of preferred models for each task (e.g., Chat: `['@cf/meta/llama-3.1-8b-instruct', '@cf/meta/llama-3-8b-instruct']`).
    -   Attempt execution sequentially. If a model fails with a "not found" or similar internal catalog error, automatically fallback to the next model in the list.

2.  **Gemini AI Dynamic Selection (Enhancement):**
    -   Ensure the existing `getAvailableGeminiModel` logic is robust and caches the result appropriately.

## Technical Details
-   **Cloudflare Chat Fallbacks:** `@cf/meta/llama-3.1-8b-instruct` -> `@cf/meta/llama-3-8b-instruct` -> `@cf/qwen/qwen1.5-14b-chat-awq`
-   **Cloudflare Vision Fallbacks:** `@cf/llava-hf/llava-1.5-7b-hf` -> `@cf/unum/uform-gen2-qwen-500m`
-   **Cloudflare Embedding Fallbacks:** `@cf/baai/bge-base-en-v1.5` -> `@cf/baai/bge-large-en-v1.5`

## Success Criteria
-   If a primary model is deprecated, the system seamlessly uses the next available model without user-facing errors (unless all fallbacks are exhausted).
