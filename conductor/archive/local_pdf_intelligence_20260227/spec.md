# Specification: Local-Only PDF Intelligence via Cloudflare AI Search

## 1. Overview
This track implements a standalone document processing module for local-only PDF intelligence. The system will leverage Cloudflare's `env.AI_SEARCH` as the single source of knowledge for Retrieval-Augmented Generation (RAG). A local, priority-based model will be used for context analysis and response generation, ensuring that all processing and data storage remain within the Cloudflare ecosystem.

## 2. Functional Requirements

### 2.1. Core Features
- **Secure PDF Upload:** Users can upload PDF files to a secure, isolated R2 bucket.
- **AI Search Integration:** Uploaded PDFs will be automatically indexed using Cloudflare's AI Search binding (`env.AI_SEARCH`).
- **Local LLM Synthesis:** A local large language model (e.g., Llama 3.1) will be used to synthesize answers based on the search results from AI Search.
- **Markdown Formatting:** All responses must be formatted in Markdown and include links or references to the source documents.

### 2.2. User Interaction
- **Hybrid Approach:** The system will support a hybrid interaction model, allowing users to both upload a PDF and ask questions immediately (real-time), as well as query previously uploaded documents from a persistent library.

### 2.3. Data Handling & Storage
- **Global R2 Bucket:** All PDFs will be stored in a single, global R2 bucket.
- **User-Based Prefixing:** To ensure data isolation, files will be stored under a user-specific prefix. The path will follow the format: `users/{telegram_user_id}/documents/{file_hash}.pdf`.

## 3. Non-Functional Requirements
- **Data Sovereignty:** All processing, indexing, and answer generation must occur within the Cloudflare environment. No external API calls are permitted for the RAG process.
- **Factual Grounding:** AI-generated responses must be based strictly on the facts and information contained within the source documents.

## 4. Acceptance Criteria
- A user can successfully upload a PDF file via the Telegram bot.
- The uploaded PDF is correctly indexed by AI Search.
- When a user asks a question, the system retrieves relevant information from the indexed PDF.
- The system generates a coherent answer based solely on the retrieved information.
- The final response sent to the user is in Markdown format and includes a reference to the source document.

## 5. Out of Scope
- Initial support for documents other than PDF.
- Analysis or synthesis of information across multiple documents in a single query.
