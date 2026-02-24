export async function logMessage(db, message) {
    const { chat_id, role, content } = message;
    const query = 'INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)';
    return await db.prepare(query).bind(chat_id, role, content).run();
}
