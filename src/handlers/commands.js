// src/handlers/commands.js
import { createUser } from '../db/users.js';
import { logMessage, getChatHistory } from '../db/messages.js';
import { getFileInfo, downloadFile, sendMessage } from '../services/telegram.js';
import { uploadFile } from '../services/storage.js';
import { createFile, listFiles } from '../db/files.js';
import { generateEmbedding, runChat } from '../services/ai.js';
import { semanticSearch } from '../services/vector.js';

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
                const photo = message.photo[message.photo.length - 1];
                fileId = photo.file_id;
                fileName = `photo_${fileId}.jpg`;
                mimeType = 'image/jpeg';
                fileSize = photo.file_size;
            }

            const fileInfo = await getFileInfo(token, fileId);
            const content = await downloadFile(token, fileInfo.file_path);

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

            await sendMessage(token, chat_id, `File uploaded successfully: ${fileName}`);
            return c.json({ ok: true });
        }

        // Handle Text
        if (!message.text) return c.json({ ok: true });
        const text = message.text;

        console.log(`--- User Message: ${text} ---`);
        const messageId = await logMessage(env.DB, { chat_id, role: 'user', content: text });

        // Generate embedding once to reuse for indexing and search
        let currentVector = null;
        try {
            currentVector = await generateEmbedding(env.AI, text);
            
            // Index Message
            console.log("--- Indexing Message ---");
            await env.VECTOR_INDEX.upsert([
                {
                    id: `msg_${messageId}`,
                    values: currentVector,
                    metadata: { chat_id, message_id: messageId, role: 'user', content: text }
                }
            ]);
        } catch (idxErr) {
            console.error("FAILED TO INDEX MESSAGE:", idxErr.message);
        }

        if (text.startsWith('/')) {
            return await handleCommand(c, chat_id, text, token);
        }

        console.log("--- 2. Fetching Semantic Context (RAG) ---");
        let semanticContext = "";
        if (currentVector) {
            try {
                const matches = await semanticSearch(env.VECTOR_INDEX, currentVector, chat_id);
                if (matches.length > 0) {
                    semanticContext = "Here is some relevant context from past conversations:\n";
                    matches.forEach(m => {
                        if (m.metadata?.content) {
                            semanticContext += `- ${m.metadata.content}\n`;
                        }
                    });
                }
            } catch (ragErr) {
                console.error("FAILED TO FETCH SEMANTIC CONTEXT:", ragErr.message);
            }
        }

        console.log("--- 3. Fetching Recent History ---");
        const history = await getChatHistory(env.DB, chat_id, 10);

        console.log("--- 4. Calling Workers AI ---");
        const systemPrompt = `You are CloudClaw, a smart assistant. 
${semanticContext ? `\n${semanticContext}` : ''}
Use the provided context to answer more accurately if relevant.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            ...history.map(h => ({ role: h.role, content: h.content }))
        ];

        const botReply = await runChat(env.AI, '@cf/meta/llama-3-8b-instruct', messages);

        console.log(`--- 5. Sending to Telegram ---`);
        await sendMessage(token, chat_id, botReply || "[No response from AI]");
        
        const assistantMsgId = await logMessage(env.DB, { chat_id, role: 'assistant', content: botReply });

        // Index Assistant Reply
        if (botReply) {
            try {
                const assistantVector = await generateEmbedding(env.AI, botReply);
                await env.VECTOR_INDEX.upsert([
                    {
                        id: `msg_${assistantMsgId}`,
                        values: assistantVector,
                        metadata: { chat_id, message_id: assistantMsgId, role: 'assistant', content: botReply }
                    }
                ]);
            } catch (idxErr) {
                console.error("FAILED TO INDEX ASSISTANT REPLY:", idxErr.message);
            }
        }

        console.log("--- DONE ---");

    } catch (err) {
        console.error("ERROR IN HANDLER:", err);
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
