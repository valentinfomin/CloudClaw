# Specification: Image Analysis & OCR with Google Gemini

## Overview
This track integrates Google Gemini into the CloudClaw pipeline to analyze uploaded images. When a user sends a photo, the agent will not only store it but also use Gemini to understand its contents (OCR, object detection, description). This analysis is then indexed into the semantic memory.

## Core Requirements
1.  **Gemini Integration:**
    -   Use the `GEMINI_API_KEY` stored in Cloudflare secrets.
    -   Implement a service to send images (base64 or stream) to the Gemini API (model: `gemini-1.5-flash`).
2.  **Analysis Pipeline:**
    -   When an image is handled in `handleFile`, trigger a request to Gemini.
    -   Ask Gemini to: "Provide a detailed description of this image and extract any text or numbers found within it."
3.  **Semantic Indexing:**
    -   Take Gemini's response (text).
    -   Generate a vector embedding using `@cf/baai/bge-base-en-v1.5`.
    -   Store in `VECTOR_INDEX` with metadata: `chat_id`, `file_id`, `source: "image_analysis"`, `content`.
4.  **User Interaction:**
    -   The bot should respond immediately with a short summary of what it sees in the image.

## Technical Details
-   **Model:** `gemini-1.5-flash` (via Google AI SDK or Fetch API).
-   **Secret:** `GEMINI_API_KEY`.
-   **Output Integration:** Gemini text -> Embedding -> Vectorize.

## Success Criteria
-   Uploading a photo of a receipt allows the bot to answer "How much was the bill?".
-   Uploading a photo of an object (e.g., a red car) allows the bot to answer "What color was the car in the photo?".
-   Bot provides an immediate description upon upload.
