# Specification: Debug AI Integration

## Overview
The user reports that the bot does not respond to text messages (AI chat), although file uploads might be working. We need to investigate why the AI logic is failing or why the response is not being sent.

## Potential Issues
1.  **AI Binding:** Verification of `env.AI`.
2.  **Model Availability:** `@cf/meta/llama-3-8b-instruct` might be down or rate-limited.
3.  **Timeout:** AI inference taking longer than Telegram webhook timeout? (Workers limit is CPU time, but wall clock time matters for webhooks).
4.  **Error Handling:** Exceptions in AI block might be swallowed or logging is insufficient.

## Plan
1.  Add detailed logging around AI execution.
2.  Test with a simpler model if Llama 3 fails (`@cf/meta/llama-2-7b-chat-int8` or `@cf/qwen/qwen1.5-0.5b-chat`).
3.  Verify `getChatHistory` is not returning malformed data.
