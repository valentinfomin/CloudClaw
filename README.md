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

## 🛠 Automated Installation

Follow these steps to deploy your own CloudClaw instance to Cloudflare.

### 1. Prerequisites
- [Node.js](https://nodejs.org/) installed.
- A [Cloudflare Account](https://dash.cloudflare.com/) with Workers, D1, R2, and Vectorize enabled.
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed and logged in (`npx wrangler login`).
- A [Telegram Bot Token](https://core.telegram.org/bots/tutorial#6-pasting-your-api-token) from @BotFather.

### 2. Clone the Repository
```bash
git clone https://github.com/valentinfomin/CloudClaw.git
cd CloudClaw
```

### 3. Run the Setup Script
The automated setup script will create your D1 database, R2 buckets, and Vectorize index, apply migrations, and prompt you for your secrets.

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 4. Set the Telegram Webhook
After the deployment is complete, link your Telegram bot to your new worker:

```bash
# Replace <YOUR_WORKER_URL> with the URL provided by wrangler (e.g., https://cloudclaw-agent.user.workers.dev)
./scripts/set_webhook.sh <YOUR_WORKER_URL>/webhook
```

## 📖 Usage
Once deployed, simply start a conversation with your bot on Telegram.
- Send messages to chat naturally.
- Upload PDFs to index them for search.
- Upload images for analysis and OCR.
- Use natural language like "remind me to check mail in 1 hour" or "remind me every 2 minutes 3 times" to schedule tasks.
- Use `/toggle_gemini` to switch between Cloudflare AI and Google Gemini providers.
