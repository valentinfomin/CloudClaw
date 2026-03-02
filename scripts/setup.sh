#!/bin/bash

# CloudClaw Automated Infrastructure Setup Script
# This script creates all necessary Cloudflare resources and configures the project.

set -e

echo "🚀 Starting CloudClaw Setup..."

# 1. Create D1 Database
echo "--- Creating D1 Database ---"
DB_OUTPUT=$(npx wrangler d1 create cloudclaw-db --format json)
DB_ID=$(echo $DB_OUTPUT | jq -r '.[0].database_id // .database_id')

if [ -z "$DB_ID" ] || [ "$DB_ID" == "null" ]; then
    echo "❌ Failed to extract Database ID. Make sure you are logged in to Wrangler."
    exit 1
fi
echo "✅ D1 Database created. ID: $DB_ID"

# 2. Update wrangler.toml with new Database ID
echo "--- Updating wrangler.toml ---"
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s/database_id = ".*"/database_id = "$DB_ID"/" wrangler.toml
else
  sed -i "s/database_id = ".*"/database_id = "$DB_ID"/" wrangler.toml
fi
echo "✅ wrangler.toml updated."

# 3. Create R2 Buckets
echo "--- Creating R2 Buckets ---"
npx wrangler r2 bucket create cloudclaw-storage || echo "⚠️ Bucket might already exist."
npx wrangler r2 bucket create cloudclaw-ai-search || echo "⚠️ Bucket might already exist."
echo "✅ R2 Buckets ready."

# 4. Create Vectorize Index
echo "--- Creating Vectorize Index ---"
npx wrangler vectorize create cloudclaw-index --dimensions=768 --metric=cosine || echo "⚠️ Index might already exist."
echo "✅ Vectorize Index ready."

# 5. Apply Migrations to Production
echo "--- Applying D1 Migrations (Production) ---"
npx wrangler d1 migrations apply cloudclaw-db --remote
echo "✅ Database schema updated."

# 6. Configure Secrets
echo "--- Configuring Secrets ---"
echo "Please enter your Telegram Bot Token (from @BotFather):"
read -r TG_TOKEN
npx wrangler secret put TG_TOKEN <<< "$TG_TOKEN"

echo "Please enter your Tavily API Key (optional, press enter to skip):"
read -r TAVILY_KEY
if [ ! -z "$TAVILY_KEY" ]; then
    npx wrangler secret put TAVILY_API_KEY <<< "$TAVILY_KEY"
fi

echo "Please enter your Google Gemini API Key (optional, press enter to skip):"
read -r GEMINI_KEY
if [ ! -z "$GEMINI_KEY" ]; then
    npx wrangler secret put GEMINI_API_KEY <<< "$GEMINI_KEY"
fi

echo "--- Deploying CloudClaw ---"
npx wrangler deploy

echo "✅ Setup Complete! Your CloudClaw agent is live."
echo "--- Final Step: Set the Telegram Webhook ---"
echo "Run: ./scripts/set_webhook.sh <YOUR_WORKER_URL>/webhook"
