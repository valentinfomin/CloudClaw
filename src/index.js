import { Hono } from 'hono';
import { authMiddleware } from './middleware/auth.js';
import { handleUpdate } from './handlers/commands.js';

const app = new Hono();

// Re-enable authentication middleware using the new TG_TOKEN secret
app.use('/webhook', authMiddleware);

app.post('/webhook', async (c) => {
    console.log("=== Incoming Telegram Update ===");
    try {
        // Parse the update body once
        const update = await c.req.json();
        console.log("Update ID:", update.update_id);

        // Forward processing to the command handler
        // Ensure handleUpdate is updated to accept both context and update object
        return await handleUpdate(c, update);
    } catch (err) {
        console.error("Critical Webhook Error:", err.message);
        return c.json({ ok: false, error: 'Internal Server Error' }, 500);
    }
});

// Simple health check endpoint
app.get('/', (c) => c.text('CloudClaw Agent is Online!'));

export default app;