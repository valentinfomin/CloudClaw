# Specification: Core Telegram Bot & D1 Integration

## Overview
This track establishes the foundation of the CloudClaw agent. It involves setting up the Telegram Bot webhook handler within the Cloudflare Worker and configuring the D1 database to store user messages and session data. This is the critical "Hello World" equivalent for a chatbot with memory.

## Core Requirements
1.  **Telegram Webhook Handler:**
    -   Securely validate incoming requests from Telegram (using `TG_TOKEN` secret).
    -   Parse standard text messages.
    -   Respond to a basic `/start` command with a welcome message.
    -   Respond to a `/status` command with the agent's version/health.

2.  **D1 Database Integration:**
    -   Define the database schema for `users` and `messages`.
    -   Implement a Data Access Layer (DAL) to interact with D1.
    -   Save every incoming user message to the `messages` table.
    -   Create or update user records in the `users` table upon interaction.

3.  **Project Structure:**
    -   Establish a clean, modular folder structure (e.g., `src/handlers`, `src/db`, `src/utils`).

## Technical Details
-   **Runtime:** Cloudflare Workers (JavaScript/ES Modules).
-   **Database:** Cloudflare D1.
-   **Secrets:** `TG_TOKEN` (Telegram Bot Token), `GEMINI_API_KEY` (reserved for future use).
-   **Bindings:**
    -   `DB`: D1 Database binding.

## Success Criteria
-   The Worker successfully deploys to Cloudflare.
-   Sending `/start` to the bot on Telegram returns a welcome message.
-   Sending text to the bot results in a new row in the `messages` table in D1.
-   The user's details (ID, username) are stored in the `users` table.
