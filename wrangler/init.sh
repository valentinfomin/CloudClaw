#!/bin/bash

# CloudClaw Infrastructure Initializer
# Target: Cloudflare (D1, R2, Vectorize)

echo "🦅 CLOUDCLAW: Starting infrastructure deployment..."

# 1. Create D1 Database (Persistent Memory)
echo "📦 Creating D1 Database..."
D1_OUTPUT=$(npx wrangler d1 create cloudclaw-db)
# Extracting Database ID using grep and sed
DB_ID=$(echo "$D1_OUTPUT" | grep "database_id =" | sed 's/database_id = //;s/[" ]//g')

if [ -z "$DB_ID" ]; then
    echo "❌ Error: Failed to retrieve D1 Database ID."
    exit 1
fi
echo "✅ D1 Database created with ID: $DB_ID"

# 2. Create R2 Bucket (Storage for USER.md and assets)
echo "🪣 Creating R2 Storage Bucket..."
npx wrangler r2 bucket create cloudclaw-storage
echo "✅ R2 Bucket 'cloudclaw-storage' is ready."

# 3. Create Vectorize Index (Semantic Memory)
echo "🧠 Creating Vectorize Index..."
npx wrangler vectorize create cloudclaw-index --dimensions=768 --metric=cosine
echo "✅ Vectorize Index 'cloudclaw-index' created."

# 4. Generate wrangler.toml configuration file
echo "📝 Generating wrangler.toml..."
cat <<EOT > wrangler.toml
name = "cloudclaw-agent"
main = "src/index.js"
compatibility_date = "2026-01-01"

[ai]
binding = "AI"

[[d1_databases]]
binding = "DB"
database_name = "cloudclaw-db"
database_id = "$DB_ID"

[[r2_buckets]]
binding = "FILES"
bucket_name = "cloudclaw-storage"

[[vectorize]]
binding = "VECTOR_INDEX"
index_name = "cloudclaw-index"
EOT
echo "✅ wrangler.toml generated successfully."

# 5. Initialize Database Schema (Remote)
echo "🛠 Initializing D1 Schema (Remote)..."
npx wrangler d1 execute cloudclaw-db --remote --command "CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY AUTOINCREMENT, chat_id TEXT, content TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP);"

echo "------------------------------------------------"
echo "✅ DEPLOYMENT SUCCESSFUL!"
echo "------------------------------------------------"
echo "Next steps:"
echo "1. npx wrangler secret put GEMINI_API_KEY"
echo "2. npx wrangler secret put TG_TOKEN"
echo "3. npx wrangler deploy"
echo "------------------------------------------------"
EOF

# Set execution permissions
chmod +x init.sh