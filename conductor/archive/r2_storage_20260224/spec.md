# Specification: R2 File Storage Integration

## Overview
This track extends the CloudClaw agent to handle user-uploaded files via Telegram. It involves receiving file metadata from Telegram, downloading the file content, uploading it to Cloudflare R2, and logging the file reference in the D1 database.

## Core Requirements
1.  **Telegram File Handling:**
    -   Detect incoming `document` or `photo` updates from Telegram.
    -   Retrieve the `file_id` and fetch the file path via `getFile` method.
    -   Download the binary content from Telegram's file server.

2.  **R2 Storage:**
    -   Generate a unique key for the file (e.g., `user_id/timestamp_filename`).
    -   Store the binary content in the R2 bucket (`cloudclaw-storage`) with appropriate content type.

3.  **D1 Integration:**
    -   Create a `files` table to store metadata (id, user_id, r2_key, filename, content_type, size, created_at).
    -   Log every successful upload in the `files` table.

4.  **Retrieval Command:**
    -   Implement a `/files` command to list user's uploaded files.
    -   Implement a mechanism to retrieve a file (e.g., by ID or name) and send it back to the user.

## Technical Details
-   **Bindings:**
    -   `FILES`: R2 Bucket binding.
    -   `DB`: D1 Database binding.
-   **Secrets:** `TG_TOKEN` (used for downloading files).

## Success Criteria
-   Sending a photo or document to the bot results in successful storage in R2.
-   The file metadata is present in the D1 `files` table.
-   The user receives a confirmation message upon upload.
-   The `/files` command lists the uploaded file.
