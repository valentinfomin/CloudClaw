-- Migration 0003: User Settings for AI Provider

ALTER TABLE users ADD COLUMN preferred_ai_provider TEXT DEFAULT 'cloudflare';
