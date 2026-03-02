# CloudClaw

CloudClaw is a highly responsive AI agent deployed on Cloudflare Workers, adhering to the "Zero Gravity" protocol. It functions as a persistent and capable assistant, leveraging Cloudflare's edge infrastructure for memory, storage, and intelligence.

## 🚀 Core Features

- **Smart Reminders:** AI-driven task scheduling and complex repetition logic (e.g., 'every 2 minutes, 3 times') with explicit user confirmation.
- **Local PDF Intelligence:** Integrated Cloudflare AI Search (Managed AutoRAG) for deep document analysis and private knowledge retrieval.
- **Semantic Search & RAG:** Retrieval-Augmented Generation for context-aware responses using Cloudflare Vectorize.
- **Web Search:** Integrated Tavily Search for real-time information retrieval and summarization.
- **Voice Transcription:** Transcribes voice messages into text for seamless interaction.
- **Image Analysis & OCR:** Uses Cloudflare Vision and Google Gemini for high-detail image description and text extraction.
- **Time & Location Context:** Automatically detects and respects user's local time and timezone for situational awareness.
- **Persistent Memory:** Utilizes Cloudflare D1 to store and retrieve conversation history and user settings.
- **File Handling:** Securely manages user-uploaded files (PDFs, Images, Voice) in Cloudflare R2.
- **Dynamic Model Selection:** Automatically routes queries between Cloudflare Workers AI and Google Gemini for optimal performance and detail.

## 🛠 Installation Guide

Follow these steps to get your own CloudClaw instance running.

### 1. Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine.
- A [Cloudflare Account](https://dash.cloudflare.com/) with Workers, D1, R2, and Vectorize enabled.
- A [Telegram Bot Token](https://core.telegram.org/bots/tutorial#6-pasting-your-api-token) from BotFather.
- (Optional) [Tavily API Key](https://tavily.com/) for web search.
- (Optional) [Google Gemini API Key](https://aistudio.google.com/) for advanced image analysis.

### 2. Clone the Repository
```bash
git clone https://github.com/valentinfomin/CloudClaw.git
cd CloudClaw
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Initialize Cloudflare Resources
You need to create the required D1 Database, R2 Buckets, and Vectorize Index as defined in `wrangler.toml`.

```bash
# Create D1 Database
npx wrangler d1 create cloudclaw-db

# Create R2 Buckets
npx wrangler r2 bucket create cloudclaw-storage
npx wrangler r2 bucket create cloudclaw-ai-search

# Create Vectorize Index (Dimension 768 for BGE-base)
npx wrangler vectorize create cloudclaw-index --dimensions=768 --metric=cosine
```

Update your `wrangler.toml` with the generated `database_id`.

### 5. Apply Database Migrations
```bash
# Apply migrations to local development database
npx wrangler d1 migrations apply cloudclaw-db --local

# Apply migrations to production database
npx wrangler d1 migrations apply cloudclaw-db --remote
```

### 6. Configure Secrets
Set the following secrets for your production environment:

```bash
npx wrangler secret put TG_TOKEN         # Your Telegram Bot Token
npx wrangler secret put TAVILY_API_KEY   # (Optional)
npx wrangler secret put GEMINI_API_KEY   # (Optional)
```

For local development, create a `.dev.vars` file in the root directory:
```
TG_TOKEN=your_telegram_token
TAVILY_API_KEY=your_tavily_key
GEMINI_API_KEY=your_gemini_key
```

### 7. Deploy to Cloudflare
```bash
npm run deploy
```

### 8. Set Telegram Webhook
Run the provided script to link your Telegram bot to your deployed worker:
```bash
# Replace <YOUR_WORKER_URL> with your actual deployment URL
./scripts/set_webhook.sh <YOUR_WORKER_URL>/webhook
```

## 📖 Usage
Once deployed, simply start a conversation with your bot on Telegram.
- Send messages to chat.
- Upload PDFs to index them for search.
- Upload images for analysis.
- Use `/remind [task] in [X]m` or natural language like "remind me to check mail in 1 hour" to schedule tasks.
- Use `/toggle_gemini` to switch between Cloudflare AI and Google Gemini providers.
