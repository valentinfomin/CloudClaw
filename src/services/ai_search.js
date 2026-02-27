/**
 * AI Search Service for Cloudflare AI Search
 */

/**
 * Perform a search using Cloudflare AI Search
 * @param {any} aiSearch AI_SEARCH binding
 * @param {string} query Search query
 * @param {object} options Search options
 * @returns {Promise<any>}
 */
export async function querySearch(aiSearch, query, options = {}) {
    const defaultOptions = {
        max_results: 5,
        query_rewriting: true
    };
    
    return await aiSearch.search(query, { ...defaultOptions, ...options });
}

/**
 * Trigger re-indexing of documents (if supported via API)
 * Note: Managed AI Search often indexes automatically from R2.
 * This is a placeholder for explicit indexing logic if needed.
 * @param {any} aiSearch AI_SEARCH binding
 * @returns {Promise<any>}
 */
export async function indexPdf(aiSearch) {
    // Managed AI Search automatically indexes from R2. 
    // This function returns success to maintain the pipeline interface.
    return { success: true, message: "Auto-indexing active" };
}

/**
 * Synthesize an answer from search results using a local LLM
 * @param {any} ai Cloudflare AI binding
 * @param {string} query User query
 * @param {any} searchResults Results from AI_SEARCH.search()
 * @returns {Promise<string>}
 */
export async function synthesizeAnswer(ai, query, searchResults) {
    const context = (searchResults.results || []).map(r => 
        `Source: ${r.metadata?.filename || 'Unknown'}\nContent: ${r.content}`
    ).join('\n\n');

    const systemPrompt = `You are a document intelligence assistant. 
Answer the user's question based ONLY on the provided context.
If the information is not in the context, say "I don't know based on the uploaded documents."
Provide source references in Markdown format if available.
Be concise and direct.

CONTEXT:
${context}`;

    const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
        ]
    });

    return response.response || response.text || "";
}
