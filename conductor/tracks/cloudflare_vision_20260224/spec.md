# Specification: Cloudflare Vision & Image Routing

## Overview
This track completes the "Cloudflare First" strategy by adding support for Cloudflare's Vision models. The agent will prioritize Cloudflare for image analysis when the user's preferred provider is `cloudflare`, providing a consistent edge-first experience.

## Core Requirements
1.  **Cloudflare Vision Integration:**
    -   Implement a function in `src/services/ai.js` to use `@cf/llava-1.5-7b-hf` for image-to-text.
2.  **Smart Image Routing:**
    -   Update `handleFile` to respect the `preferred_ai_provider` setting.
    -   If provider is `cloudflare`: Use Cloudflare Vision.
    -   If provider is `gemini`: Use Google Gemini.
3.  **Fallback & Feedback:**
    -   If Cloudflare Vision fails (e.g., limits), offer to switch to Gemini.
    -   Mention which model was used in the response (e.g., "[Cloudflare Vision] I see a...")

## Technical Details
-   **Model:** `@cf/llava-1.5-7b-hf`.
-   **Input:** Image bytes (as Uint8Array).

## Success Criteria
-   Uploading a photo while `preferred_ai_provider` is `cloudflare` triggers the `@cf/llava-1.5-7b-hf` model.
-   The response indicates that Cloudflare Vision was used.
-   Toggling to Gemini and uploading a photo uses Gemini as before.
