# Specification: Telegram Chat Actions (Typing Indicator)

## 1. Overview
This track focuses on improving the user experience (UX) of the CloudClaw Telegram bot by implementing the `sendChatAction` Telegram API. Specifically, the bot will send a `typing` action indicator to the user before embarking on potentially long-running operations like search, RAG processing, and AI generation. This provides immediate visual feedback that the bot is actively working on the request.

## 2. Functional Requirements
- **Action Type:** Implement the `typing` action indicator using the Telegram `sendChatAction` API endpoint.
- **Trigger Contexts:** The `typing` indicator must be triggered at the start of the following workflows:
  - Processing standard text queries (including RAG and general chat).
  - Analyzing uploaded images.
  - Transcribing voice messages.
  - Processing file/document uploads.
- **Error Handling:** If the `sendChatAction` API call fails for any reason (e.g., network timeout, Telegram API issue), the system must fail silently. It should not throw an error that interrupts or aborts the primary execution flow (i.e., the user should still get their response even if the typing indicator fails).

## 3. Non-Functional Requirements
- **Performance:** The call to `sendChatAction` should be fire-and-forget or non-blocking where possible, to avoid adding unnecessary latency to the overall response time.
- **UX:** The indicator improves perceived responsiveness, aligning with the "Zero Gravity" protocol's goal of a responsive agent.

## 4. Acceptance Criteria
- [ ] A reusable function (e.g., `sendChatAction`) is created in the Telegram service module.
- [ ] The `typing` action is dispatched before AI processing begins for text messages.
- [ ] The `typing` action is dispatched before AI processing begins for image uploads.
- [ ] The `typing` action is dispatched before AI processing begins for voice messages.
- [ ] The `typing` action is dispatched before AI processing begins for document uploads.
- [ ] Unit/Integration tests verify that the main handler workflows do not fail if `sendChatAction` encounters an error (silent failure).

## 5. Out of Scope
- Implementing chat actions other than `typing` (e.g., `upload_document`, `record_voice`) for this specific track.
- Long-polling to keep the typing indicator active for operations exceeding 5 seconds (Telegram's default duration for the action). A single initial trigger is sufficient.