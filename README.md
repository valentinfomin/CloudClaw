# CloudClaw

CloudClaw is a highly responsive AI agent deployed on Cloudflare Workers.

## Setup

### Secrets

To enable web search functionality, you need to set the `TAVILY_API_KEY` secret.

**Locally:**
Add it to your `.dev.vars` file:
```
TAVILY_API_KEY=your_tavily_api_key_here
```

**Production:**
Use wrangler to set the secret in your Cloudflare environment:
```bash
npx wrangler secret put TAVILY_API_KEY
```
