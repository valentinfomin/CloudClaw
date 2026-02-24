// src/handlers/commands.js
import { createUser } from '../db/users.js';
import { logMessage, getChatHistory } from '../db/messages.js';

export async function handleUpdate(c, update) {
    const env = c.env;
    const message = update.message;

    if (!message || !message.text) return c.json({ ok: true });

    const chat_id = String(message.chat.id);
    const text = message.text;

    try {
        console.log("--- 1. Saving to DB ---");
        await createUser(env.DB, {
            chat_id,
            username: message.from?.username,
            first_name: message.from?.first_name
        });
        await logMessage(env.DB, { chat_id, role: 'user', content: text });

        if (text.startsWith('/')) {
            return await handleCommand(c, chat_id, text);
        }

        console.log("--- 2. Fetching History ---");
        const history = await getChatHistory(env.DB, chat_id, 10);

        console.log("--- 3. Calling Workers AI ---");
        const aiResponse = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
            messages: [
                { role: 'system', content: 'You are CloudClaw, a smart assistant.' },
                ...history.map(h => ({ role: h.role, content: h.content }))
            ]
        });

        // Some models return 'response', others 'text'. Let's check both.
        const botReply = aiResponse.response || aiResponse.text;

        console.log("--- 4. Sending to Telegram ---");
        await sendMessage(env.TELEGRAM_TOKEN, chat_id, botReply);
        await logMessage(env.DB, { chat_id, role: 'assistant', content: botReply });

        console.log("--- DONE ---");

    } catch (err) {
        console.error("ERROR IN HANDLER:", err.message);
        // This will help us see the error in the chat
        await sendMessage(env.TELEGRAM_TOKEN, chat_id, "Bot Error: " + err.message);
    }

    return c.json({ ok: true });
}

async function handleCommand(c, chat_id, text) {
    let reply = "I am CloudClaw AI.";
    if (text === '/start') reply = "Hi! I am ready to talk.";
    await sendMessage(c.env.TELEGRAM_TOKEN, chat_id, reply);
    return c.json({ ok: true });
}

async function sendMessage(token, chat_id, text) {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id, text })
    });
}