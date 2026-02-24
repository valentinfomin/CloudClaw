// src/db/messages.js

export async function logMessage(db, message) {
    const { chat_id, role, content } = message;
    const query = 'INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)';
    const result = await db.prepare(query).bind(String(chat_id), role, content).run();
    return result.meta.last_row_id;
}

/**
 * Fetch chat history using ID for sorting since created_at column is missing
 */
export async function getChatHistory(db, chat_id, limit = 10) {
    // English comment: Sorting by ID DESC to get the latest messages
    const { results } = await db.prepare(
        "SELECT role, content FROM messages WHERE chat_id = ? ORDER BY id DESC LIMIT ?"
    )
        .bind(String(chat_id), limit)
        .all();

    // Reverse to chronological order for AI context
    return results.reverse();
}