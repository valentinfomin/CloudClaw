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

/**
 * Run chat via Google Gemini API
 */
export async function runChatGemini(apiKey, messages) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    // Convert Cloudflare/OpenAI message format to Gemini format
    // Cloudflare: {role, content}
    // Gemini: {role: "user"|"model", parts: [{text}]}
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
