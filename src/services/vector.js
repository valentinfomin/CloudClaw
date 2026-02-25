/**
 * Vector Service for Cloudflare Vectorize
 */

export async function semanticSearch(index, vector, chatId, limit = 10) {
    const response = await index.query(vector, {
        topK: limit,
        filter: { chat_id: { $eq: chatId } },
        returnMetadata: true
    });
    
    return response.matches || [];
}
