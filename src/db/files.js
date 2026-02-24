export async function createFile(db, file) {
    const { user_id, r2_key, filename, content_type, size } = file;
    const query = 'INSERT INTO files (user_id, r2_key, filename, content_type, size) VALUES (?, ?, ?, ?, ?)';
    return await db.prepare(query).bind(user_id, r2_key, filename, content_type, size).run();
}

export async function listFiles(db, userId) {
    const query = 'SELECT * FROM files WHERE user_id = ? ORDER BY created_at DESC';
    const result = await db.prepare(query).bind(userId).all();
    return result.results;
}
