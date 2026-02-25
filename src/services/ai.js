/**
 * AI Service for Cloudflare Workers AI
 */

export async function generateEmbedding(ai, text) {
    const response = await ai.run('@cf/baai/bge-base-en-v1.5', {
        text: [text]
    });
    
    // bge-small-en-v1.5 returns { data: [[...]] }
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
