# Specification: Voice-to-Text Transcription Integration

## Overview
This track enables CloudClaw to understand and respond to voice messages sent via Telegram. It leverages Cloudflare Workers AI (Whisper model) to convert audio data into text, which is then processed by the existing AI reasoning and semantic search pipeline.

## Core Requirements
1.  **Voice Message Detection:**
    -   Identify incoming `voice` or `audio` objects in the Telegram update.
2.  **Audio Downloading:**
    -   Retrieve the `file_id` for the voice message.
    -   Use `getFile` and `downloadFile` (already implemented) to get the binary audio data.
3.  **Transcription with Whisper:**
    -   Send the binary audio data to Cloudflare Workers AI using the `@cf/openai/whisper` model.
    -   Extract the transcribed text from the AI response.
4.  **Pipeline Integration:**
    -   Treat the transcribed text as a regular user text message.
    -   Trigger the same indexing, semantic search, and AI reasoning flow used for text messages.
    -   (Optional) Notify the user that the message was transcribed.

## Technical Details
-   **Model:** `@cf/openai/whisper`.
-   **Input Format:** Audio file (usually OGG/OPUS from Telegram).
-   **Workflow:**
    - `Voice Update` -> `Download Audio` -> `Whisper AI (Transcription)` -> `Text Pipeline` -> `Reply`.

## Success Criteria
-   Sending a voice message to the bot results in an AI-generated text response.
-   The transcribed text is correctly indexed in D1 and Vectorize.
-   The bot acknowledges the transcription (e.g., "You said: [transcribed text]").
