# Specification: Fix Gemini API 'Not Found' Error

## Overview
The bot is receiving a "Not Found" error from the Gemini API when attempting to analyze images. This likely indicates an incorrect API version or model string.

## Proposed Changes
1. Update the API endpoint in `src/services/gemini.js` from `v1beta` to `v1`.
2. Ensure the model name `gemini-1.5-flash` is correctly formatted.
3. Add logging to inspect the full response body on failure.

## Success Criteria
- Image analysis succeeds without "Not Found" errors.
- Gemini returns a text description of the image.
