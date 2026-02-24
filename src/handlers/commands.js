import { createUser } from '../db/users.js';
import { logMessage } from '../db/messages.js';

export async function handleUpdate(c) {
    try {
        const update = await c.req.json();
        
        if (update.message) {
            const { message } = update;
            const chat_id = String(message.chat.id);
            const user = {
                chat_id,
                username: message.from?.username,
                first_name: message.from?.first_name
            };

            // Log user
            await createUser(c.env.DB, user);

            // Log user message
            await logMessage(c.env.DB, {
                chat_id,
                role: 'user',
                content: message.text || '[Non-text message]'
            });

            // Handle commands
            if (message.text?.startsWith('/')) {
                const command = message.text.split(' ')[0];
                if (command === '/start') {
                    await sendMessage(c.env.TG_TOKEN, chat_id, 'Welcome to CloudClaw!');
                    await logMessage(c.env.DB, { chat_id, role: 'assistant', content: 'Welcome to CloudClaw!' });
                } else if (command === '/status') {
                    await sendMessage(c.env.TG_TOKEN, chat_id, 'CloudClaw is online.');
                    await logMessage(c.env.DB, { chat_id, role: 'assistant', content: 'CloudClaw is online.' });
                }
            }
        }

        return c.text('OK');
    } catch (e) {
        console.error('Webhook error:', e);
        return c.text('Error', 500);
    }
}

async function sendMessage(token, chat_id, text) {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id, text })
    });
}
