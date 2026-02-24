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

    // Trim token to avoid accidental newlines/spaces
    const token = env.TG_TOKEN ? env.TG_TOKEN.trim() : '';

    if (!token) {
        console.error("TG_TOKEN is missing!");
        return c.json({ ok: false, error: "Missing token" });
    }

    const chat_id = String(message.chat.id);
    const user = {
        chat_id,
        username: message.from?.username,
        first_name: message.from?.first_name
    };

    try {
        console.log(`--- Token Check: ${token.substring(0, 5)}... ---`);

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

            console.log(`--- Fetching File Info for ID: ${fileId} ---`);
            const fileInfo = await getFileInfo(token, fileId);
            console.log(`--- File Info: ${JSON.stringify(fileInfo)} ---`);
            
            console.log(`--- Downloading File: ${fileInfo.file_path} ---`);
            const content = await downloadFile(token, fileInfo.file_path);

            const timestamp = Date.now();
            const r2Key = `${chat_id}/${timestamp}_${fileName}`;

            console.log(`--- Uploading to R2: ${r2Key} ---`);
            await uploadFile(env.FILES, r2Key, content, mimeType);

            console.log("--- Creating DB Record ---");
            await createFile(env.DB, {
                user_id: chat_id,
                r2_key: r2Key,
                filename: fileName,
                content_type: mimeType,
                size: fileSize
            });

            await sendMessage(token, chat_id, `File uploaded successfully: ${fileName}`);
            return c.json({ ok: true });
        }

        // Handle Text
        if (!message.text) return c.json({ ok: true });
        const text = message.text;

        console.log(`--- User Message: ${text} ---`);
        await logMessage(env.DB, { chat_id, role: 'user', content: text });

        if (text.startsWith('/')) {
            return await handleCommand(c, chat_id, text, token);
        }

        console.log("--- 2. Fetching History ---");
        const history = await getChatHistory(env.DB, chat_id, 10);
        console.log(`--- History Length: ${history.length} ---`);

        console.log("--- 3. Calling Workers AI ---");
        const messages = [
            { role: 'system', content: 'You are CloudClaw, a smart assistant.' },
            ...history.map(h => ({ role: h.role, content: h.content }))
        ];
        
        console.log(`--- AI Input Messages: ${JSON.stringify(messages)} ---`);

        const aiResponse = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
            messages
        });

        console.log(`--- AI Response Raw: ${JSON.stringify(aiResponse)} ---`);

        // Some models return 'response', others 'text'. Let's check both.
        const botReply = aiResponse.response || aiResponse.text || "[No response from AI]";

        console.log(`--- 4. Sending to Telegram: ${botReply} ---`);
        await sendMessage(token, chat_id, botReply);
        await logMessage(env.DB, { chat_id, role: 'assistant', content: botReply });

        console.log("--- DONE ---");

    } catch (err) {
        console.error("ERROR IN HANDLER:", err);
        // Try to send error to user
        try {
            await sendMessage(token, chat_id, "Bot Error: " + err.message);
        } catch (sendErr) {
            console.error("Failed to send error message:", sendErr);
        }
    }

    return c.json({ ok: true });
}

async function handleCommand(c, chat_id, text, token) {
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
    
    await sendMessage(token, chat_id, reply);
    return c.json({ ok: true });
}
