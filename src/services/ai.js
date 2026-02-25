/**
 * AI Service for Cloudflare Workers AI
 */

export async function generateEmbedding(ai, text) {
    const response = await ai.run('@cf/baai/bge-base-en-v1.5', {
        text: [text]
    });
    
    if (!response.data || !response.data[0]) {
        throw new Error('Failed to generate embedding: Invalid response format');
    }
    
    return response.data[0];
}

export async function runChat(ai, model, messages) {
    const response = await ai.run(model, { messages });
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

let cachedGeminiModelId = null;

async function getAvailableGeminiModel(apiKey) {
    if (cachedGeminiModelId) return cachedGeminiModelId;
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
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

/**
 * Run chat via Google Gemini API
 */
export async function runChatGemini(apiKey, messages) {
    const modelId = await getAvailableGeminiModel(apiKey);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
    
    // Convert Cloudflare/OpenAI message format to Gemini format
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

/**
 * Analyze an image using Cloudflare Workers AI (Llava)
 */
export async function analyzeImageCloudflare(ai, imageBuffer) {
    const response = await ai.run('@cf/llava-1.5-7b-hf', {
        image: [...new Uint8Array(imageBuffer)],
        prompt: "Describe this image concisely. Extract any text or numbers found."
    });
    
    if (!response.description) {
        throw new Error('Failed to analyze image with Cloudflare: No description returned');
    }
    
    return response.description;
}
