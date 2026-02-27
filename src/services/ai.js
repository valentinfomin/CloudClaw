/**
 * AI Service for Cloudflare Workers AI
 */

export const PREFERRED_EMBEDDING_MODELS = [
    '@cf/baai/bge-base-en-v1.5',
    '@cf/baai/bge-large-en-v1.5',
    '@cf/baai/bge-small-en-v1.5'
];

export const PREFERRED_CHAT_MODELS = [
    '@cf/meta/llama-3.1-8b-instruct-fp8',
    '@cf/meta/llama-3.2-3b-instruct',
    '@cf/qwen/qwen1.5-14b-chat-awq'
];

export const PREFERRED_VISION_MODELS = [
    '@cf/llava-hf/llava-1.5-7b-hf',
    '@cf/unum/uform-gen2-qwen-500m'
];

async function runCascade(ai, models, payload) {
    let lastError = null;
    for (const model of models) {
        try {
            console.log(`[AI Cascade] Trying model: ${model}`);
            return await ai.run(model, payload);
        } catch (err) {
            console.warn(`[AI Cascade] Model ${model} failed: ${err.message}`);
            lastError = err;
        }
    }
    throw new Error(`All preferred models failed. Last error: ${lastError?.message}`);
}

export async function generateEmbedding(ai, text) {
    const response = await runCascade(ai, PREFERRED_EMBEDDING_MODELS, { text: [text] });
    
    if (!response.data || !response.data[0]) {
        throw new Error('Failed to generate embedding: Invalid response format');
    }
    
    return response.data[0];
}

export async function runChat(ai, modelsToTry, messages) {
    const models = Array.isArray(modelsToTry) ? modelsToTry : PREFERRED_CHAT_MODELS;
    const response = await runCascade(ai, models, { messages });
    return response.response || response.text || "";
}

export async function transcribeAudio(ai, audioBuffer) {
    const response = await ai.run('@cf/openai/whisper', {
        audio: [...new Uint8Array(audioBuffer)]
    });
    
    if (!response.text) {
        throw new Error('Failed to transcribe audio: No text returned');
    }
    
    return response.text;
}

export async function analyzeImageCloudflare(ai, imageBuffer) {
    const response = await runCascade(ai, PREFERRED_VISION_MODELS, {
        image: [...new Uint8Array(imageBuffer)],
        prompt: "Describe this image concisely. Extract any text or numbers found."
    });
    
    if (!response.description) {
        throw new Error('Failed to analyze image with Cloudflare: No description returned');
    }
    
    return response.description;
}

/**
 * Extract text from a document using Cloudflare Workers AI toMarkdown utility
 * @param {any} ai Cloudflare AI binding
 * @param {ArrayBuffer} buffer Document content
 * @param {string} mimeType Content type
 * @returns {Promise<string>}
 */
export async function extractDocumentCloudflare(ai, buffer, mimeType) {
    if (!ai.toMarkdown) {
        throw new Error('Cloudflare AI toMarkdown utility is not available in this environment');
    }

    const result = await ai.toMarkdown({
        name: `doc_${Date.now()}`,
        blob: new Blob([buffer], { type: mimeType })
    });

    if (!result || !result.data) {
        throw new Error('Cloudflare extraction returned no data');
    }

    return result.data;
}

let cachedGeminiModelId = null;

async function getAvailableGeminiModel(apiKey) {
    if (cachedGeminiModelId) return cachedGeminiModelId;
    try {
        const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data && data.models) {
            const preferredModels = ['models/gemini-2.5-flash', 'models/gemini-2.0-flash', 'models/gemini-1.5-flash', 'models/gemini-flash-latest'];
            for (const preferred of preferredModels) {
                if (data.models.some(m => m.name === preferred)) {
                    cachedGeminiModelId = preferred.replace('models/', '');
                    return cachedGeminiModelId;
                }
            }
        }
    } catch (e) {
        console.warn("Failed to fetch available models", e);
    }
    return 'gemini-2.5-flash';
}

export async function runChatGemini(apiKey, messages) {
    const modelId = await getAvailableGeminiModel(apiKey);
    const url = `https://generativelanguage.googleapis.com/v1/models/${modelId}:generateContent?key=${apiKey}`;
    
    const geminiMessages = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));

    const payload = {
        contents: geminiMessages
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`Gemini API Error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        return data.candidates[0].content.parts[0].text;
    }

    throw new Error('Failed to extract text from Gemini response');
}
