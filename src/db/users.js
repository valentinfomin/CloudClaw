export async function createUser(db, user) {
    const { chat_id, username, first_name } = user;
    const query = 'INSERT INTO users (chat_id, username, first_name) VALUES (?, ?, ?) ON CONFLICT(chat_id) DO UPDATE SET username=excluded.username, first_name=excluded.first_name';
    return await db.prepare(query).bind(chat_id, username, first_name).run();
}

export async function getUser(db, chat_id) {
    const query = 'SELECT * FROM users WHERE chat_id = ?';
    return await db.prepare(query).bind(chat_id).first();
}
