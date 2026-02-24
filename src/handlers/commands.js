// src/handlers/commands.js
import { createUser } from '../db/users.js';
import { logMessage, getChatHistory } from '../db/messages.js';
import { getFileInfo, downloadFile, sendMessage } from '../services/telegram.js';
import { uploadFile } from '../services/storage.js';
import { createFile, listFiles } from '../db/files.js';

export async function handleUpdate(c, update) {
    const env = c.env;
    const message = update.message;

    if (!message) return c.json({ ok: true });

    const chat_id = String(message.chat.id);
    const user = {
        chat_id,
        username: message.from?.username,
        first_name: message.from?.first_name
    };

    try {
        console.log("--- 1. Saving User ---");
        await createUser(env.DB, user);

        // Handle File (Document or Photo)
        if (message.document || message.photo) {
            console.log("--- Handling File ---");
            let fileId, fileName, mimeType, fileSize;

            if (message.document) {
                fileId = message.document.file_id;
                fileName = message.document.file_name;
                mimeType = message.document.mime_type;
                fileSize = message.document.file_size;
            } else if (message.photo) {
                // Photos come in array, last one is highest res
                const photo = message.photo[message.photo.length - 1];
                fileId = photo.file_id;
                fileName = `photo_${fileId}.jpg`;
                mimeType = 'image/jpeg';
                fileSize = photo.file_size;
            }

            const fileInfo = await getFileInfo(env.TG_TOKEN, fileId);
            const content = await downloadFile(env.TG_TOKEN, fileInfo.file_path);

            const timestamp = Date.now();
            const r2Key = `${chat_id}/${timestamp}_${fileName}`;

            await uploadFile(env.FILES, r2Key, content, mimeType);

            await createFile(env.DB, {
                user_id: chat_id,
                r2_key: r2Key,
                filename: fileName,
                content_type: mimeType,
                size: fileSize
            });

            await sendMessage(env.TG_TOKEN, chat_id, `File uploaded successfully: ${fileName}`);
            return c.json({ ok: true });
        }

        // Handle Text
        if (!message.text) return c.json({ ok: true });
        const text = message.text;

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
        await sendMessage(env.TG_TOKEN, chat_id, botReply);
        await logMessage(env.DB, { chat_id, role: 'assistant', content: botReply });

        console.log("--- DONE ---");

    } catch (err) {
        console.error("ERROR IN HANDLER:", err.message);
        await sendMessage(env.TG_TOKEN, chat_id, "Bot Error: " + err.message);
    }

    return c.json({ ok: true });
}

async function handleCommand(c, chat_id, text) {
    let reply = "I am CloudClaw AI.";
    
    if (text === '/start') {
        reply = "Hi! I am ready to talk.";
    } else if (text === '/status') {
        reply = "CloudClaw is online.";
    } else if (text === '/files') {
        const files = await listFiles(c.env.DB, chat_id);
        if (files.length === 0) {
            reply = "You have no uploaded files.";
        } else {
            reply = "Your files:\n" + files.map(f => `- ${f.filename} (ID: ${f.id})`).join('\n');
            reply += "\n\nUse /get <id> to retrieve a file.";
        }
    } else if (text.startsWith('/get ')) {
        const fileId = text.split(' ')[1];
        reply = `Request to get file ID: ${fileId} received. (Feature pending)`;
    }
    
    await sendMessage(c.env.TG_TOKEN, chat_id, reply);
    return c.json({ ok: true });
}
