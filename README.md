# CloudClaw

CloudClaw is a highly responsive AI agent deployed on Cloudflare Workers. It functions as a persistent and capable assistant, leveraging Cloudflare's edge infrastructure for memory, storage, and intelligence.

## 💡 Project Philosophy

The core goal of CloudClaw is to provide a powerful, open-source alternative to proprietary AI assistants. Why pay for a Mac Mini or a virtual private server for a personal AI when you can achieve the same, if not better, results for free?

This project is built on the philosophy of being:
- **Absolutely Free:** It runs entirely on Cloudflare's generous free tier.
- **Secure & Private:** By leveraging private AI models and Cloudflare's enterprise-grade security, your data remains your own.
- **Serverless:** No servers to manage, patch, or pay for. Just deploy and forget.

## 🚀 Core Features

- **Smart Reminders:** AI-driven task scheduling and complex repetition logic (e.g., 'every 2 minutes, 3 times') with explicit user confirmation.
- **Document Intelligence:** Integrated Cloudflare AI for deep document analysis and private knowledge retrieval.
- **Semantic Search & RAG:** Retrieval-Augmented Generation for context-aware responses using your own conversation history.
- **Web Search:** Integrated Tavily Search for real-time information retrieval.
- **Voice Transcription:** Transcribes voice messages into text.
- **Image Analysis & OCR:** Uses Cloudflare Vision for powerful image description and text extraction.
- **Time & Location Context:** Automatically respects your local time for true situational awareness.
- **Persistent Memory:** Utilizes a serverless SQL database to store conversation history and user settings.
- **File Handling:** Securely manages user-uploaded files (PDFs, Images, Voice).
- **Dynamic Model Selection:** Automatically falls back to Google Gemini for high-detail image analysis if needed.

## 🛠️ Technology Stack (Cloudflare)

This project is built entirely on the Cloudflare ecosystem:

- **Compute:** [Cloudflare Workers](https://workers.cloudflare.com/) for serverless execution.
- **Database:** [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite) for persistent memory.
- **Object Storage:** [Cloudflare R2](https://developers.cloudflare.com/r2/) for file storage.
- **Vector Database:** [Cloudflare Vectorize](https://developers.cloudflare.com/vectorize/) for semantic search.
- **AI Inference:** [Workers AI](https://developers.cloudflare.com/workers-ai/) for running private AI models.
- **Scheduled Tasks:** [Cron Triggers](https://developers.cloudflare.com/workers/platform/triggers/cron-triggers/) for background jobs and reminders.

## ⚙️ Automated Installation

### 1. Prerequisites
- [Node.js](https://nodejs.org/) installed.
- A [Cloudflare Account](https://dash.cloudflare.com/).
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed and logged in (`npx wrangler login`).
- A [Telegram Bot Token](https://core.telegram.org/bots/tutorial#6-pasting-your-api-token) from @BotFather.
- **(Optional)** [Tavily API Key](https://tavily.com/) for web search.
- **(Optional)** [Google Gemini API Key](https://aistudio.google.com/) for high-detail image analysis fallback. The project works perfectly without it, using only Cloudflare's private models.

### 2. Clone the Repository
```bash
git clone https://github.com/valentinfomin/CloudClaw.git
cd CloudClaw
```

### 3. Run the Automated Setup
This script creates your database, storage buckets, and vector index, applies migrations, and prompts for your secrets.

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 4. Set the Telegram Webhook
After deployment, link your bot to your new worker:

```bash
# Replace <YOUR_WORKER_URL> with the URL from the previous step
./scripts/set_webhook.sh <YOUR_WORKER_URL>/webhook
```

## 🔒 Privacy & Disclaimer

- **Data Privacy:** According to Cloudflare's commitments, data processed by Workers AI is not used for training their models. Your conversations and data remain private.
- **No Warranty:** This is a home project provided "AS IS", without warranty of any kind. Use at your own risk.

## 📖 Usage
Once deployed, simply start a conversation with your bot on Telegram.
- Send messages to chat naturally.
- Upload PDFs to index them for search.
- Upload images for analysis.
- Use natural language like "remind me to check mail in 1 hour" or "remind me every 2 minutes 3 times" to schedule tasks.
- Use `/toggle_gemini` to switch the fallback image analysis provider.
