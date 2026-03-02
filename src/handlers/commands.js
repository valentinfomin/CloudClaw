// src/handlers/commands.js
import { createUser, getUser, updateAIProvider, updateUserLocation } from '../db/users.js';
import { logMessage, getChatHistory } from '../db/messages.js';
import { getFileInfo, downloadFile, sendMessage, sendChatAction } from '../services/telegram.js';
import { uploadFile, getFile, uploadPdfForSearch } from '../services/storage.js';
import { createFile, listFiles } from '../db/files.js';
import { createTaskVerified, getLatestPendingTask, deletePendingTask, savePendingTask } from '../db/tasks.js';
import { 
    generateEmbedding, 
    runChat, 
    runChatGemini, 
    transcribeAudio, 
    analyzeImageCloudflare, 
    extractDocumentCloudflare,
    PREFERRED_CHAT_MODELS 
} from '../services/ai.js';
import { querySearch, indexPdf, synthesizeAnswer } from '../services/ai_search.js';
import { semanticSearch } from '../services/vector.js';
import { parseTaskIntent } from '../services/task_parser.js';
import { extractText } from '../services/extractor.js';
import { chunkText, truncateResponse, getFormattedTimestamp } from '../utils/text.js';
import { analyzeImage } from '../services/gemini.js';
import { mapData } from '../services/import_service.js';
import { performTavilySearch } from '../services/search.js';

export async function handleUpdate(c, update, geolocation = { timezone: 'UTC', city: 'Unknown', country: 'Unknown' }) {
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
        const user = await getUser(env.DB, chat_id);

        // Prioritize user's stored location, fallback to Cloudflare's geolocation
        const effectiveGeolocation = {
            timezone: user?.timezone && user.timezone !== 'UTC' ? user.timezone : geolocation.timezone,
            city: user?.city && user.city !== 'Unknown' ? user.city : geolocation.city,
            country: user?.country && user.country !== 'Unknown' ? user.country : geolocation.country
        };

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
            // Dispatch typing action early for voice
            await sendChatAction(token, chat_id, 'typing');
            
            const fileInfo = await getFileInfo(token, message.voice.file_id);
            const audioBuffer = await downloadFile(token, fileInfo.file_path);
            text = await transcribeAudio(env.AI, audioBuffer);
            console.log(`--- Transcribed: ${text} ---`);
            await sendMessage(token, chat_id, `Transcribed: ${text}`);
        }

        // Handle Text Pipeline
        if (!text) return c.json({ ok: true });
        
        // Check for confirmation to a pending task
        const wasConfirmation = await handleConfirmation(c, chat_id, text, token);
        if (wasConfirmation) return c.json({ ok: true });

        if (text.startsWith('/')) {
            await handleCommand(c, chat_id, text, token);
        } else {
            await handleSearchQuery(c, chat_id, text, token, geolocation);
        }

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

/**
 * Checks if the message is a confirmation (Yes/No) to a pending task.
 */
async function handleConfirmation(c, chat_id, text, token) {
    const env = c.env;
    const lowerText = text.toLowerCase().trim();
    const confirmations = ['yes', 'no', 'да', 'нет'];
    
    if (!confirmations.includes(lowerText)) {
        return false;
    }

    const pending = await getLatestPendingTask(env.DB, chat_id);
    if (!pending) return false;

    // Check if pending task is recent (within 5 minutes)
    const pendingTime = new Date(pending.created_at).getTime();
    const now = Date.now();
    if (now - pendingTime > 5 * 60 * 1000) {
        await deletePendingTask(env.DB, pending.id);
        return false;
    }

    if (lowerText === 'yes' || lowerText === 'да') {
        try {
            await createTaskVerified(env.DB, {
                user_id: pending.user_id,
                task_type: pending.task_type,
                payload: pending.payload,
                scheduled_at: now + pending.start_offset_ms,
                remaining_count: pending.total_count || 1,
                interval_ms: pending.interval_ms || 0
            });
            await sendMessage(token, chat_id, "✅ Task scheduled!");
        } catch (err) {
            await sendMessage(token, chat_id, "DB error while scheduling: " + err.message);
        }
    } else {
        await sendMessage(token, chat_id, "Оkay, I won't schedule that.");
    }

    await deletePendingTask(env.DB, pending.id);
    return true;
}


async function handleSearchQuery(c, chat_id, text, token, geolocation = { timezone: 'UTC', city: 'Unknown', country: 'Unknown' }) {
    const env = c.env;
    console.log(`--- Processing Text: ${text} ---`);

    // 0. Smart Task Detection
    try {
        const history = await getChatHistory(env.DB, chat_id, 5);
        const taskIntent = await parseTaskIntent(env.AI, text, history);
        if (taskIntent && taskIntent.intent_detected) {
            const pendingId = crypto.randomUUID();
            await savePendingTask(env.DB, {
                id: pendingId,
                user_id: chat_id,
                task_type: taskIntent.task_type || 'reminder',
                payload: JSON.stringify({ text: taskIntent.message, ...taskIntent }),
                start_offset_ms: taskIntent.start_offset_ms || 0,
                interval_ms: taskIntent.interval_ms || 0,
                total_count: taskIntent.total_count || 1
            });
            
            const proposal = `I found a task: "${taskIntent.message}"\n` +
                             `${taskIntent.explanation || ''}\n\n` +
                             `Should I schedule this? (Yes/No)`;
            await sendMessage(token, chat_id, proposal);
            return;
        }
    } catch (parseErr) {
        console.error('Smart Task Detection Error:', parseErr.message);
    }
    
    // Dispatch typing action early
    await sendChatAction(token, chat_id, 'typing');
    
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

    // Fetch user settings
    const user = await getUser(env.DB, chat_id);

    const provider = user?.preferred_ai_provider || 'cloudflare';
    console.log(`--- Using Provider: ${provider} ---`);

    // Use User Overrides if available
    const effectiveTimezone = user?.timezone || geolocation?.timezone || 'UTC';
    const effectiveCity = user?.city || geolocation?.city || 'Unknown';
    const effectiveCountry = user?.country || geolocation?.country || 'Unknown';

            console.log('--- 2. Fetching Semantic Context (RAG) ---');
        let semanticContext = '';
        let searchResults = { data: [] };    
    // 2.1 Cloudflare AI Search (PDF Intelligence)
    try {
        console.log(`--- Performing AI Search (PDFs) for: ${text} ---`);
        searchResults = await querySearch(env.AI, 'mypdfindex', text);
        if (searchResults?.data?.length > 0) {
            semanticContext += "The following information was found in your uploaded PDF documents:\n";
            searchResults.data.forEach(r => {
                semanticContext += `- Source: ${r.filename || 'Unknown'}\n  Content: ${r.text || ''}\n`;
            });
            semanticContext += "\n";
        }
    } catch (searchErr) {
        console.error("AI Search Error:", searchErr.message);
    }

    // 2.2 Vectorize Search (Messages and Images)
    if (currentVector) {
        try {
            console.log(`--- Searching Vector Index for Chat ID: ${chat_id} ---`);
            let matches = await semanticSearch(env.VECTOR_INDEX, currentVector, chat_id);
            
            if (matches.length === 0) {
                const globalMatches = await env.VECTOR_INDEX.query(currentVector, { topK: 10, returnMetadata: true });
                matches = (globalMatches.matches || []).filter(m => m.metadata?.chat_id === chat_id);
            }

            if (matches.length > 0) {
                semanticContext += "Additional context found in your private messages and images:\n";
                matches.forEach((m, idx) => {
                    if (m.metadata?.content) {
                        semanticContext += `- ${m.metadata.content}\n`;
                    }
                });
            }
        } catch (ragErr) {
            console.error("FAILED TO FETCH VECTOR CONTEXT:", ragErr.message);
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
                const results = await performTavilySearch(env.TAVILY_API_KEY, searchQuery, getFormattedTimestamp(effectiveTimezone));
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

    const timeAndLocationContext = `CURRENT TIME AND LOCATION:\n${getFormattedTimestamp(effectiveTimezone)} (${effectiveCity}, ${effectiveCountry}, Timezone: ${effectiveTimezone})\n\n`;

    console.log('--- 4. Calling AI (Synthesizing Answer) ---');
    let botReply = '';
    const systemPrompt = `You are CloudClaw, a helpful personal assistant.\n\n` +
                         timeAndLocationContext +
                         `CONTEXT FROM USER'S DOCUMENTS AND HISTORY:\n${semanticContext || "No document context found."}\n\n` +
                         `SEARCH RESULTS:\n${searchResultsContext}\n\n` +
                         `INSTRUCTIONS:\n` +
                         `1. You MUST use the CONTEXT, SEARCH RESULTS, and CURRENT TIME AND LOCATION to answer the user's question.\n` +
                         `2. Be as concise as possible. Your final answer should not exceed 2000 characters.\n` +
                         `3. Provide source links in Markdown format [Title](URL) ONLY if you used SEARCH RESULTS. Do not invent links.\n` +
                         `4. Be brief and direct. Answer in a natural, conversational tone.\n` +
                         `5. If the user asks for the current time or date, answer naturally based on the CURRENT TIME AND LOCATION (e.g., "Сейчас 10:32 в White Rock").`;
    
    try {
        if (provider === 'gemini') {
            const messages = [
                { role: 'system', content: systemPrompt },
                ...history.map(h => ({ role: h.role, content: h.content })),
                { role: 'user', content: text }
            ];
            botReply = await runChatGemini(env.GEMINI_API_KEY, messages);
        } else {
            // Cloudflare AI Search Synthesis
            const additionalContext = (semanticContext || "") + "\n" + (searchResultsContext || "") + "\n" + (timeAndLocationContext || "");
            try {
                // Pass the unified systemPrompt to ensure time context is respected
                botReply = await synthesizeAnswer(env.AI, text, searchResults, history, additionalContext, systemPrompt);
            } catch (cfErr) {
                console.error("Cloudflare AI Synthesis Error:", cfErr.message);
                if (cfErr.message.includes('503') || cfErr.message.includes('429') || cfErr.message.includes('limit')) {
                    await sendMessage(token, chat_id, "⚠️ Cloudflare AI limits reached or service unavailable. Switching to Gemini for this response...");
                    const messages = [
                        { role: 'system', content: systemPrompt },
                        ...history.map(h => ({ role: h.role, content: h.content })),
                        { role: 'user', content: text }
                    ];
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

    // Dispatch typing action early for file uploads
    await sendChatAction(token, chat_id, 'typing');

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

    // Special handling for PDF intelligence via AI Search
    if (mimeType === 'application/pdf') {
        try {
            console.log('--- 1.5 Uploading to AI Search Bucket ---');
            const fileHash = timestamp.toString(16); // Simple hash for path
            await uploadPdfForSearch(env.AI_SEARCH_BUCKET, chat_id, fileHash, content);
            
            console.log('--- 1.6 Triggering AI Search Indexing ---');
            await indexPdf(env.AI, 'mypdfindex');
        } catch (searchErr) {
            console.error('AI SEARCH SETUP ERROR:', searchErr.message);
        }
    }

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
            const user = await getUser(env.DB, chat_id);
            let provider = user?.preferred_ai_provider || 'cloudflare';
            
            // Caption Override Logic
            const caption = message.caption?.toLowerCase() || "";
            let manualOverride = false;
            if (caption.includes('gemini')) {
                provider = 'gemini';
                manualOverride = true;
                console.log(`--- Manual Override Triggered: Gemini via caption ---`);
            }

            console.log(`--- Extracting and Indexing Document (Provider: ${provider}) ---`);
            
            let extractedText = "";
            let engineUsed = "";

            if (provider === 'gemini' || mimeType !== 'application/pdf') {
                extractedText = await extractText(content, mimeType, env.GEMINI_API_KEY);
                engineUsed = provider === 'gemini' ? (manualOverride ? "Google Gemini (Manual Override)" : "Google Gemini") : "Local Extractor";
            } else {
                // Cloudflare First (PDF only)
                try {
                    extractedText = await extractDocumentCloudflare(env.AI, content, mimeType);
                    engineUsed = "Cloudflare Extract";
                } catch (cfErr) {
                    console.error("Cloudflare Extraction Error:", cfErr.message);
                    await sendMessage(token, chat_id, "⚠️ Cloudflare extraction failed. Falling back to Gemini...");
                    extractedText = await extractText(content, mimeType, env.GEMINI_API_KEY);
                    engineUsed = "Google Gemini (Fallback)";
                }
            }

            console.log(`--- ${engineUsed} Content Extracted ---`);
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
    } else if (text.startsWith('/set_timezone ')) {
        const tz = text.split(' ')[1];
        try {
            // Validate timezone
            new Intl.DateTimeFormat('en-US', { timeZone: tz }).format(new Date());
            const user = await getUser(c.env.DB, chat_id);
            await updateUserLocation(c.env.DB, chat_id, { 
                timezone: tz, 
                city: user?.city || 'Unknown', 
                country: user?.country || 'Unknown' 
            });
            reply = `Timezone set to: ${tz}`;
        } catch (e) {
            reply = `Invalid timezone: ${tz}. Please use IANA format (e.g., America/Toronto).`;
        }
    } else if (text.startsWith('/set_location ')) {
        const parts = text.substring(14).split(',');
        const city = parts[0]?.trim() || 'Unknown';
        const country = parts[1]?.trim() || 'Unknown';
        const user = await getUser(c.env.DB, chat_id);
        await updateUserLocation(c.env.DB, chat_id, { 
            timezone: user?.timezone || 'UTC', 
            city, 
            country 
        });
        reply = `Location set to: ${city}, ${country}`;
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
    } else if (text.startsWith('/remind ')) {
        try {
            // Format: /remind buy milk in 5m
            const match = text.match(/\/remind\s+(.+)\s+in\s+(\d+)m/i);
            if (!match) {
                reply = "Usage: /remind <message> in <minutes>m (e.g., /remind buy milk in 5m)";
            } else {
                const reminderText = match[1].trim();
                const minutes = parseInt(match[2]);
                const scheduledAt = Date.now() + (minutes * 60 * 1000);

                const result = await createTaskVerified(c.env.DB, {
                    user_id: chat_id,
                    task_type: 'reminder',
                    payload: JSON.stringify({ text: reminderText }),
                    scheduled_at: scheduledAt
                });

                if (result.success) {
                    console.info("SQL Executed", result.meta);
                    reply = `✅ Reminder set for ${minutes} minutes from now: "${reminderText}"`;
                } else {
                    reply = "DB error: Task creation failed to confirm.";
                }
            }
        } catch (e) {
            console.error("REMIND COMMAND ERROR:", e.message);
            reply = `DB error: ${e.message}`;
        }
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


