# Specification: Cloudflare First & Smart Routing

## Overview
This track implements a "Cloudflare First" strategy for all AI operations. The agent will prioritize Cloudflare Workers AI for text and voice processing, using Google Gemini as an optional feature for image analysis or as a manual fallback when Cloudflare limits are reached.

## Core Requirements
1.  **Provider Persistence:**
    -   Store the current `ai_provider` (default: `cloudflare`) in the D1 `users` table.
2.  **Smart Routing:**
    -   **Text/Voice:** Always route through Cloudflare AI by default.
    -   **Photos:** Since Cloudflare's Vision models are more limited than Gemini, keep Gemini as the primary engine for images but acknowledge it as a "High Detail" provider.
3.  **Fallback Mechanism:**
    -   Detect `503 Service Unavailable` or `429 Too Many Requests` (Cloudflare limit errors).
    -   If an error occurs, send a message to the user: "Cloudflare limits reached. Would you like to temporarily switch to Gemini? (Use /toggle_gemini)".
4.  **Control Command:**
    -   `/toggle_gemini`: Switch the default provider for text reasoning between Cloudflare and Gemini.

## Technical Details
-   **Database:** Add `preferred_ai_provider` column to `users` table.
-   **Logic:** Centralize AI selection in `src/handlers/commands.js`.

## Success Criteria
-   The bot uses Llama 3 for chat by default.
-   Running `/toggle_gemini` makes the bot use Gemini for subsequent text messages.
-   The bot handles Cloudflare errors gracefully by offering the switch.
