# Specification: Fix Vector Dimension Mismatch

## Overview
The Vectorize index `cloudclaw-index` was created with 768 dimensions, but the `@cf/baai/bge-small-en-v1.5` model used in the code produces 384 dimensions. This causes an error during upsert.

## Root Cause
- Index dimensions: 768 (set in `wrangler/init.sh`).
- Model output: 384 (produced by `bge-small-en-v1.5`).

## Solution
Update the code to use `@cf/baai/bge-base-en-v1.5`, which produces 768 dimensions, to match the existing index. This is more efficient than recreating the index.

## Success Criteria
- Uploading a document or sending a message no longer results in `VECTOR_UPSERT_ERROR`.
- Embeddings are successfully stored in `cloudclaw-index`.
