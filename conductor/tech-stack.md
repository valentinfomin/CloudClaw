# Technology Stack

## Core Technologies
- **Language:** JavaScript (Node.js/Cloudflare Workers runtime).
- **Platform:** Cloudflare Workers.
- **Database:** Cloudflare D1 (SQLite compatible).
- **Storage:** Cloudflare R2 (S3 compatible object storage).
- **Document Intelligence:** Cloudflare AI Search (Managed AutoRAG) with R2 (binding: `AI_SEARCH_BUCKET`).
- **Vector Database:** Cloudflare Vectorize.
- **Background Processing:** Cloudflare Workers Cron Triggers.
- **Intent Extraction:** AI-driven task parsing with @cf/meta/llama-3.2-3b-instruct.

## AI & Machine Learning
- **Inference Engine:** Cloudflare Workers AI.
- **Model:** `@cf/meta/llama-3-8b-instruct`.
- **Search API:** Tavily AI.

## Development Tools
- **CLI:** Wrangler (Cloudflare Workers CLI).
- **Package Manager:** npm/yarn.
