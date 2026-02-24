/**
 * Vector Service for Cloudflare Vectorize
 */

export async function semanticSearch(index, vector, chatId, limit = 5) {
    const response = await index.query(vector, {
        topK: limit,
        filter: { chat_id: chatId },
        returnMetadata: true
    });
    
    return response.matches || [];
}
