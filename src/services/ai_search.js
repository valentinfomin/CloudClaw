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
