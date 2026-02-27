import { runChat, PREFERRED_CHAT_MODELS } from './ai.js';

/**
 * AI Search Service for Cloudflare AI Search
 */

/**
 * Perform a search using Cloudflare AI Search
 * @param {any} ai Workers AI binding
 * @param {string} instanceName AI Search instance name
 * @param {string} query Search query
 * @param {object} options Search options
 * @returns {Promise<any>}
 */
export async function querySearch(ai, instanceName, query, options = {}) {
    const defaultOptions = {
        max_results: 5,
        query_rewriting: true
    };
    
    try {
        const instance = ai.autorag(instanceName);
        if (!instance) {
            throw new Error(`AutoRAG instance '${instanceName}' could not be initialized from AI binding.`);
        }
        const results = await instance.search({ query, ...defaultOptions, ...options });
        
        // Sanitize results: Extract text from content objects/arrays
        if (results.data && Array.isArray(results.data)) {
            results.data = results.data.map(r => {
                let text = r.text || '';
                if (!text && r.content) {
                    if (Array.isArray(r.content)) {
                        text = r.content.join('\n');
                    } else if (typeof r.content === 'object') {
                        text = r.content.text || r.content.body || r.content.content || JSON.stringify(r.content);
                    } else {
                        text = String(r.content);
                    }
                }
                console.log(`--- Sanitized Chunk [Len: ${text.length}] ---`);
                return { ...r, text };
            });
        }
        
        return results;
    } catch (err) {
        console.error(`AI Search Service Error [Instance: ${instanceName}]:`, err.message);
        throw err;
    }
}

/**
 * Trigger re-indexing of documents (if supported via API)
 * Note: Managed AI Search automatically indexes from R2. 
 * This function returns success to maintain the pipeline interface.
 * @param {any} ai Workers AI binding
 * @param {string} instanceName AI Search instance name
 * @returns {Promise<any>}
 */
export async function indexPdf(ai, instanceName) {
    // Managed AI Search automatically indexes from R2. 
    // This function returns success to maintain the pipeline interface.
    return { success: true, message: 'Auto-indexing active' };
}

/**
 * Synthesize an answer from search results using a local LLM
 * @param {any} ai Cloudflare AI binding
 * @param {string} query User query
 * @param {any} searchResults Results from AI_SEARCH.search()
 * @param {any[]} history Optional chat history
 * @param {string} additionalContext Extra context from other sources
 * @returns {Promise<string>}
 */
export async function synthesizeAnswer(ai, query, searchResults, history = [], additionalContext = '') {
    const data = searchResults.data || [];
    console.log(`--- Context Mapping [Count: ${data.length}] ---`);
    if (data.length > 0) {
        console.log(`--- First Match RAW: ${JSON.stringify(data[0])} ---`);
    }

    const docContext = data.map(r => 
        `Source: ${r.filename || 'Unknown'}\nContent: ${r.text || ''}`
    ).join('\n\n');

    const fullContext = (docContext ? `DOCUMENTS:\n${docContext}\n\n` : '') + 
                       (additionalContext ? `OTHER CONTEXT:\n${additionalContext}\n\n` : '');

    const systemPrompt = `You are a document intelligence assistant. 
Answer the user's question based ONLY on the provided context.
If the information is not in the context, say "I don't know based on the uploaded documents."
Provide source references in Markdown format if available.
Be as concise as possible. Your final answer should not exceed 2000 characters.
Always provide source links in Markdown format: [Title](URL) if available.

INSTRUCTIONS:
1. You MUST use the CONTEXT, SEARCH RESULTS, and CURRENT TIME AND LOCATION to answer the user's question.
2. If the user asks for a secret code, password, or specific information found in the CONTEXT, you MUST provide it exactly as written.
3. Be brief and direct.

CONTEXT:
${fullContext}`;

    const messages = [
        { role: 'system', content: systemPrompt },
        ...history.map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: query }
    ];

    return await runChat(ai, PREFERRED_CHAT_MODELS, messages);
}
