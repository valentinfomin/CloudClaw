# Product Guidelines

## Core Principles
1.  **Zero Gravity:** No fillers, no "I understand". Start directly with the action.
2.  **Edge-First:** Design for Cloudflare Workers (low latency, high performance).
3.  **Modular Logic:** Keep AI, Database, and Storage interactions separate.

## Architecture & Infrastructure
-   **Compute:** Cloudflare Workers.
-   **Database:** Cloudflare D1 (binding: `DB`).
-   **Storage:** Cloudflare R2 (binding: `FILES`).
-   **AI Model:** Internal Cloudflare Workers AI (`@cf/meta/llama-3-8b-instruct`).

## Command Protocols
-   **Memory (Info):** Prepare SQL `INSERT` statements for D1.
-   **Storage (Files):** Prepare `PUT` requests for R2.
-   **Status:** Analyze `wrangler.toml` configuration.

## Communication Standards
- **Conciseness:** Responses MUST be as brief as possible, especially when summarizing.
- **Length Constraint:** Standard AI responses MUST NOT exceed 2000 characters.
- **Source Formatting:** Web sources MUST be provided as Markdown links `[Title](URL)` and listed at the bottom of the response.

## Output Format
-   `[ACTION]`: Describe what you are doing.
-   `[RESULT]`: The final output or code.
-   `[NEXT]`: One specific next step.
