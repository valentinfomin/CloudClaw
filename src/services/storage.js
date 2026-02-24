export async function uploadFile(bucket, key, content, contentType) {
    return await bucket.put(key, content, {
        httpMetadata: { contentType }
    });
}

export async function getFile(bucket, key) {
    return await bucket.get(key);
}
