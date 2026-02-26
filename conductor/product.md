# Product Definition

## Vision
CloudClaw is a highly responsive AI agent deployed on Cloudflare Workers, adhering to the "Zero Gravity" protocol. It functions as a persistent and capable assistant, leveraging Cloudflare's edge infrastructure for memory, storage, and intelligence.

## Goals
- **Personal Assistant:** Serve as a responsive Telegram bot with persistent memory.
- **File Management:** Enable seamless file uploads and retrieval via Telegram.
- **Customer Support:** Answer queries accurately using stored knowledge.
- **Efficiency:** Execute tasks with minimal latency using edge computing.

## Core Features
- **Semantic Search & RAG:** Implement Retrieval-Augmented Generation for context-aware responses.
- **Persistent Context:** Utilize Cloudflare D1 to store and retrieve conversation history.
- **File Handling:** Securely store and manage user-uploaded files in Cloudflare R2.
- **Data Import:** Enable real-time data synchronization with automatic field mapping and error handling.
- **Web Search:** Integrated Tavily Search for real-time information retrieval and summarization.
- **AI Processing:** Use Cloudflare Workers AI (`@cf/meta/llama-3-8b-instruct`) for reasoning and generation.
- **Response Optimization:** Automatic soft-truncation and strict conciseness rules for all AI output.

## Infrastructure & Architecture
- **Compute:** Cloudflare Workers
- **Database:** Cloudflare D1 (binding: `DB`) for structured data and memory.
- **Storage:** Cloudflare R2 (binding: `FILES`) for unstructured data and documents.
- **Vector Search:** Cloudflare Vectorize (binding: `VECTOR_INDEX`) for semantic search.
- **AI Model:** Cloudflare Workers AI (`@cf/meta/llama-3-8b-instruct`).
- **Interface:** Telegram Bot API (via `TG_TOKEN`).

## Command Protocols
- **Memory (Info):** Prepare SQL `INSERT` statements for D1.
- **Storage (Files):** Prepare `PUT` requests for R2.
- **Status:** Analyze `wrangler.toml` configuration.

## Zero Gravity Protocol
- **No Fillers:** Direct action and output.
- **Format:** `[ACTION]`, `[RESULT]`, `[NEXT]`.
