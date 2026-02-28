import { Hono } from 'hono';
import { authMiddleware } from './middleware/auth.js';
import { handleUpdate } from './handlers/commands.js';
import { handleCron } from './handlers/cron.js';

console.log("Worker Script Loaded");

const app = new Hono();

// Re-enable authentication middleware using the new TG_TOKEN secret
app.use('/webhook', authMiddleware);

app.post('/webhook', async (c) => {
    console.log("=== Incoming Telegram Update ===");
    try {
        // Parse the update body once
        const update = await c.req.json();
        console.log("Update ID:", update.update_id);

        const cf = c.req.raw.cf || c.req.cf || {};
        const geolocation = {
            timezone: cf.timezone || 'UTC',
            city: cf.city || 'Unknown',
            country: cf.country || 'Unknown',
        };

        // Forward processing to the command handler in the background
        c.executionCtx.waitUntil(handleUpdate(c, update, geolocation));
        
        // Respond immediately to prevent Telegram retries
        return c.json({ ok: true });
    } catch (err) {
        console.error("Critical Webhook Error:", err.message);
        return c.json({ ok: false, error: 'Internal Server Error' }, 500);
    }
});

// Simple health check endpoint
app.get('/', (c) => c.text('CloudClaw Agent is Online!'));

export default {
    fetch: app.fetch,
    async scheduled(event, env, ctx) {
        ctx.waitUntil(handleCron(event, env, ctx));
    }
};