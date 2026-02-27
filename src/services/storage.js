export async function uploadFile(bucket, key, content, contentType) {
    return await bucket.put(key, content, {
        httpMetadata: { contentType }
    });
}

export async function getFile(bucket, key) {
    return await bucket.get(key);
}

/**
 * Upload a PDF to the AI Search bucket with user-specific prefixing
 * @param {any} bucket AI_SEARCH_BUCKET binding
 * @param {string} userId Telegram User ID
 * @param {string} fileHash Hash of the file content
 * @param {ArrayBuffer|Uint8Array} content File content
 * @returns {Promise<any>}
 */
export async function uploadPdfForSearch(bucket, userId, fileHash, content) {
    const key = `users/${userId}/documents/${fileHash}.pdf`;
    return await bucket.put(key, content, {
        httpMetadata: { contentType: 'application/pdf' }
    });
}
