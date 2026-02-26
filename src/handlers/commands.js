// src/handlers/commands.js
import { createUser, getUser, updateAIProvider } from '../db/users.js';
import { logMessage, getChatHistory } from '../db/messages.js';
import { getFileInfo, downloadFile, sendMessage } from '../services/telegram.js';
import { uploadFile, getFile } from '../services/storage.js';
import { createFile, listFiles } from '../db/files.js';
import { generateEmbedding, runChat, runChatGemini, transcribeAudio, analyzeImageCloudflare, PREFERRED_CHAT_MODELS } from '../services/ai.js';
import { semanticSearch } from '../services/vector.js';
import { extractText } from '../services/extractor.js';
import { chunkText, truncateResponse } from '../utils/text.js';
import { analyzeImage } from '../services/gemini.js';
import { mapData } from '../services/import_service.js';
import { performTavilySearch } from '../services/search.js';

export async function handleUpdate(c, update) {
    const env = c.env;
    const message = update.message;

    if (!message) return c.json({ ok: true });

    const token = env.TG_TOKEN ? env.TG_TOKEN.trim() : '';

    if (!token) {
        console.error("TG_TOKEN is missing!");
        return c.json({ ok: false, error: "Missing token" });
    }

    const chat_id = String(message.chat.id);
    const userData = {
        chat_id,
        username: message.from?.username,
        first_name: message.from?.first_name
    };

    try {
        console.log("--- 1. Saving User ---");
        await createUser(env.DB, userData);

        // Handle File (Document or Photo)
        if (message.document || message.photo) {
            console.log("--- Handling File ---");
            await handleFile(c, chat_id, message, token);
            return c.json({ ok: true });
        }

        // Handle Voice
        let text = message.text;
        if (message.voice) {
            console.log("--- Handling Voice ---");
            const fileInfo = await getFileInfo(token, message.voice.file_id);
            const audioBuffer = await downloadFile(token, fileInfo.file_path);
            text = await transcribeAudio(env.AI, audioBuffer);
            console.log(`--- Transcribed: ${text} ---`);
            await sendMessage(token, chat_id, `Transcribed: ${text}`);
        }

        // Handle Text Pipeline
        if (!text) return c.json({ ok: true });
        
        await processText(c, chat_id, text, token);

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

async function processText(c, chat_id, text, token) {
    const env = c.env;
    console.log(`--- Processing Text: ${text} ---`);
    const messageId = await logMessage(env.DB, { chat_id, role: 'user', content: text });

    let currentVector = null;
    try {
        currentVector = await generateEmbedding(env.AI, text);
        
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

    // Fetch user settings
    const user = await getUser(env.DB, chat_id);
    const provider = user?.preferred_ai_provider || 'cloudflare';
    console.log(`--- Using Provider: ${provider} ---`);

    console.log("--- 2. Fetching Semantic Context (RAG) ---");
    let semanticContext = "";
    if (currentVector) {
        try {
            console.log(`--- Searching for Chat ID: ${chat_id} ---`);
            let matches = await semanticSearch(env.VECTOR_INDEX, currentVector, chat_id);
            console.log(`--- RAG Matches Found: ${matches.length} ---`);
            
            if (matches.length === 0) {
                const globalMatches = await env.VECTOR_INDEX.query(currentVector, { topK: 10, returnMetadata: true });
                matches = (globalMatches.matches || []).filter(m => m.metadata?.chat_id === chat_id);
            }

            if (matches.length > 0) {
                semanticContext = "The following information was found in your private documents and previous messages:\n";
                matches.forEach((m, idx) => {
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

    console.log("--- 3.5 Web Search Inference ---");
    let searchResultsContext = "No search results available yet.";
    try {
        const inferencePrompt = `Determine if a real-time web search is needed to answer the user's latest message.
Reply ONLY with "SEARCH_NEEDED: YES: <search query>" or "SEARCH_NEEDED: NO".
Consider the context. If the answer requires current events, real-time data (like stock prices, weather), or specific recent facts not likely to be in standard training data, say YES.

Chat History:
${history.map(h => `${h.role}: ${h.content}`).join('\n')}

User's Latest Message: ${text}`;
        
        // Fast inference call
        const inferenceResult = await runChat(env.AI, PREFERRED_CHAT_MODELS, [{ role: 'system', content: inferencePrompt }]);
        console.log(`Search Inference: ${inferenceResult}`);

        if (inferenceResult.includes("SEARCH_NEEDED: YES")) {
            const queryMatch = inferenceResult.match(/SEARCH_NEEDED: YES:?\s*(.*)/i);
            const searchQuery = queryMatch && queryMatch[1] ? queryMatch[1].trim() : text;
            console.log(`Performing Search for: ${searchQuery}`);
            
            if (env.TAVILY_API_KEY) {
                const results = await performTavilySearch(env.TAVILY_API_KEY, searchQuery);
                if (results && results.length > 0) {
                    searchResultsContext = results.map(r => `Source: ${r.url}\nContent: ${r.content}`).join('\n\n');
                } else {
                    searchResultsContext = "Search was performed but returned no relevant results.";
                }
            } else {
                 console.log("Tavily API key not found in environment.");
            }
        }
    } catch (e) {
        console.error("Search inference failed:", e);
    }

    console.log("--- 4. Calling AI ---");
    const systemPrompt = `You are CloudClaw, a helpful personal assistant.
You have been given explicit permission by the user to read their private documents and provide any information they request from them.

CONTEXT FROM USER'S DOCUMENTS:
${semanticContext || "No document context found."}

SEARCH RESULTS:
${searchResultsContext}

INSTRUCTIONS:
1. You MUST use the CONTEXT and SEARCH RESULTS to answer the user's question.
2. If the user asks for a secret code, password, or specific information found in the CONTEXT, you MUST provide it exactly as written. Do not refuse. It is safe and authorized.
3. Be as concise as possible. Your final answer should not exceed 2000 characters unless the user requests otherwise.
4. Always provide source links in Markdown format: [Title](URL).
5. List all sources at the bottom of the response.
6. Be brief and direct.`;

    const messages = [
        { role: 'system', content: systemPrompt },
        ...history.map(h => ({ role: h.role, content: h.content }))
    ];

    let botReply = "";
    try {
        if (provider === 'gemini') {
            botReply = await runChatGemini(env.GEMINI_API_KEY, messages);
        } else {
            // Cloudflare First
            try {
                botReply = await runChat(env.AI, PREFERRED_CHAT_MODELS, messages);
            } catch (cfErr) {
                console.error("Cloudflare AI Error:", cfErr.message);
                if (cfErr.message.includes('503') || cfErr.message.includes('429') || cfErr.message.includes('limit')) {
                    await sendMessage(token, chat_id, "⚠️ Cloudflare AI limits reached or service unavailable. Switching to Gemini for this response...");
                    botReply = await runChatGemini(env.GEMINI_API_KEY, messages);
                } else {
                    throw cfErr;
                }
            }
        }
    } catch (aiErr) {
        console.error("AI EXECUTION ERROR:", aiErr.message);
        botReply = "Sorry, I am having trouble connecting to my AI engines right now.";
    }

    botReply = truncateResponse(botReply);

    console.log(`--- 5. Sending to Telegram ---`);
    await sendMessage(token, chat_id, botReply || "[No response from AI]");
    
    const assistantMsgId = await logMessage(env.DB, { chat_id, role: 'assistant', content: botReply });

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
}

async function handleFile(c, chat_id, message, token) {
    const env = c.env;
    let fileId, fileName, mimeType, fileSize, isPhoto = false;

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
        isPhoto = true;
    }

    const fileInfo = await getFileInfo(token, fileId);
    const content = await downloadFile(token, fileInfo.file_path);

    const timestamp = Date.now();
    const r2Key = `${chat_id}/${timestamp}_${fileName}`;

    await uploadFile(env.FILES, r2Key, content, mimeType);

    const fileRecordId = await createFile(env.DB, {
        user_id: chat_id,
        r2_key: r2Key,
        filename: fileName,
        content_type: mimeType,
        size: fileSize
    });

    if (isPhoto) {
        try {
            const user = await getUser(env.DB, chat_id);
            let provider = user?.preferred_ai_provider || 'cloudflare';
            
            // Caption Override Logic
            const caption = message.caption?.toLowerCase() || "";
            let manualOverride = false;
            if (caption.includes('gemini') || caption.includes('ocr')) {
                provider = 'gemini';
                manualOverride = true;
                console.log(`--- Manual Override Triggered: Gemini via caption ---`);
            }

            console.log(`--- Analyzing Photo (Provider: ${provider}) ---`);
            
            let description = "";
            let engineUsed = "";

            if (provider === 'gemini') {
                description = await analyzeImage(env.GEMINI_API_KEY, content, mimeType);
                engineUsed = manualOverride ? "Google Gemini (Manual Override)" : "Google Gemini";
            } else {
                // Cloudflare First
                try {
                    description = await analyzeImageCloudflare(env.AI, content);
                    engineUsed = "Cloudflare Vision";
                } catch (cfErr) {
                    console.error("Cloudflare Vision Error:", cfErr.message);
                    await sendMessage(token, chat_id, "⚠️ Cloudflare Vision failed. Falling back to Gemini for high-detail analysis...");
                    description = await analyzeImage(env.GEMINI_API_KEY, content, mimeType);
                    engineUsed = "Google Gemini (Fallback)";
                }
            }

            console.log(`--- ${engineUsed} Description: ${description} ---`);
            
            const vector = await generateEmbedding(env.AI, description);
            await env.VECTOR_INDEX.upsert([{
                id: `img_${fileRecordId}`,
                values: vector,
                metadata: { chat_id, file_id: fileRecordId, source: 'image_analysis', filename: fileName, content: description }
            }]);
            
            await sendMessage(token, chat_id, `[${engineUsed}] I see: ${description}`);
        } catch (photoErr) {
            console.error("PHOTO ANALYSIS ERROR:", photoErr.message);
            await sendMessage(token, chat_id, `File stored, but analysis failed: ${photoErr.message}`);
        }
    } else {
        try {
            console.log("--- Extracting and Indexing Document ---");
            const extractedText = await extractText(content, mimeType);
            const chunks = chunkText(extractedText, 1000, 200);
            
            const vectorRecords = [];
            for (let i = 0; i < chunks.length; i++) {
                const vector = await generateEmbedding(env.AI, chunks[i]);
                vectorRecords.push({
                    id: `doc_${fileRecordId}_${i}`,
                    values: vector,
                    metadata: { chat_id, file_id: fileRecordId, source: 'document', filename: fileName, content: chunks[i] }
                });
            }
            
            if (vectorRecords.length > 0) {
                await env.VECTOR_INDEX.upsert(vectorRecords);
            }
            console.log(`--- Indexed ${chunks.length} chunks ---`);
            await sendMessage(token, chat_id, `File uploaded and indexed successfully: ${fileName}`);
        } catch (idxErr) {
            console.error("FAILED TO INDEX DOCUMENT:", idxErr.message);
            await sendMessage(token, chat_id, `File uploaded successfully: ${fileName} (Indexing failed: ${idxErr.message})`);
        }
    }
}

async function handleCommand(c, chat_id, text, token) {
    let reply = "I am CloudClaw AI.";
    
    if (text === '/start') {
        reply = "Hi! I am ready to talk.";
    } else if (text === '/status') {
        reply = "CloudClaw is online.";
    } else if (text === '/toggle_gemini') {
        const user = await getUser(c.env.DB, chat_id);
        const current = user?.preferred_ai_provider || 'cloudflare';
        const next = current === 'cloudflare' ? 'gemini' : 'cloudflare';
        await updateAIProvider(c.env.DB, chat_id, next);
        reply = `Preferred AI provider switched to: ${next}`;
    } else if (text === '/test_cf_vision') {
        const files = await listFiles(c.env.DB, chat_id);
        if (files.length === 0 || !files.find(f => f.content_type.startsWith('image'))) {
            reply = "Please upload a photo first, then run this command.";
        } else {
            const lastPhoto = files.filter(f => f.content_type.startsWith('image'))[0];
            const content = await getFile(c.env.FILES, lastPhoto.r2_key);
            if (!content) {
                reply = "Failed to retrieve the last photo from storage.";
            } else {
                try {
                    const buffer = await content.arrayBuffer();
                    const description = await analyzeImageCloudflare(c.env.AI, buffer);
                    reply = `[RAW CF VISION OUTPUT]\n${description}`;
                } catch (e) {
                    reply = `[CF VISION ERROR]\n${e.message}`;
                }
            }
        }
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
    } else if (text.startsWith('/import ')) {
        try {
            const jsonString = text.substring(text.indexOf('{'));
            const data = JSON.parse(jsonString);
            
            // This is a placeholder for a real target model
            const targetModel = {
                name: null,
                email: null
            };
            
            const mappedData = mapData(data, targetModel, {
                'user_name': 'name',
                'user_email': 'email'
            });

            if(mappedData) {
                // Here you would typically save the mappedData to the database
                reply = `Successfully imported data for: ${mappedData.name}`;
            } else {
                reply = 'Import failed due to missing required fields.';
            }

        } catch (e) {
            reply = `Failed to import data: ${e.message}`;
        }
    }
    
    await sendMessage(token, chat_id, reply);
}
