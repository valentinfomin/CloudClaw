# Specification: Image Caption Override for AI Provider

## Overview
Users should be able to manually force the use of Google Gemini for image analysis by including a specific keyword in the image caption. This allows high-detail OCR on demand without changing global settings.

## Core Requirements
1.  **Caption Detection:**
    -   In `handleFile`, extract the `message.caption` if present.
2.  **Keyword Logic:**
    -   If the caption contains "gemini" or "ocr" (case-insensitive), set the provider to `gemini` for that specific operation.
3.  **Bypass Routing:**
    -   The caption override takes precedence over the `preferred_ai_provider` stored in D1.
4.  **User Feedback:**
    -   The response should indicate that Gemini was used because of the manual override (e.g., `[Google Gemini (Manual Override)]`).

## Success Criteria
-   Uploading a photo with caption "gemini" triggers Gemini analysis even if the global preference is Cloudflare.
-   Uploading a photo without caption follows the global preference.
