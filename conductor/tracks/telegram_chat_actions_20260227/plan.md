# Implementation Plan: Telegram Chat Actions (Typing Indicator)

## Phase 1: Core Service Implementation [checkpoint: 2be4066]
- [x] Task: Create a new function `sendChatAction(token, chat_id, action)` in `src/services/telegram.js`. 59c16a8
- [x] Task: Implement the `sendChatAction` function using the Telegram `sendChatAction` HTTP API endpoint. 59c16a8
- [x] Task: Add error handling within `sendChatAction` to catch exceptions and fail silently (e.g., wrap the `fetch` call in a try/catch block and ignore errors). 59c16a8
- [x] Task: Write a unit test in `test/telegram_service.test.js` (or similar) to verify `sendChatAction` sends the correct payload and handles network errors gracefully without throwing. 59c16a8
- [x] Task: Conductor - User Manual Verification 'Phase 1: Core Service Implementation' (Protocol in workflow.md) 2be4066

## Phase 2: Integration into Message Handlers [checkpoint: 7375423]
- [x] Task: Import `sendChatAction` into `src/handlers/commands.js`. 9f05ff6
- [x] Task: In the `handleSearchQuery` function (text queries), dispatch `sendChatAction(token, chat_id, 'typing')` immediately after receiving the message, before the RAG and AI synthesis steps. 9f05ff6
- [x] Task: In the `handleFile` function (document and image uploads), dispatch the `typing` action early in the file processing/AI analysis flow. 9f05ff6
- [x] Task: In the `handleVoice` function (voice messages), dispatch the `typing` action before beginning transcription and AI generation. 9f05ff6
- [x] Task: Update relevant end-to-end or integration tests (e.g., `test/e2e_local_pdf.test.js`, `test/handler_voice_integration.test.js`) to mock `sendChatAction` and verify it is called early in the respective flows. 9f05ff6
- [x] Task: Conductor - User Manual Verification 'Phase 2: Integration into Message Handlers' (Protocol in workflow.md) 7375423

## Phase 3: Finalization [checkpoint: d442394]
- [x] Task: Deploy the updated worker to the Cloudflare edge. 1ccfac7
- [x] Task: Conductor - User Manual Verification 'Phase 3: Finalization' (Protocol in workflow.md) d442394