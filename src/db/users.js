export async function createUser(db, user) {
    const { chat_id, username, first_name } = user;
    const query = 'INSERT INTO users (chat_id, username, first_name, timezone, city, country) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(chat_id) DO UPDATE SET username=excluded.username, first_name=excluded.first_name';
    return await db.prepare(query).bind(chat_id, username, first_name, 'UTC', 'Unknown', 'Unknown').run();
}

export async function getUser(db, chat_id) {
    const query = 'SELECT * FROM users WHERE chat_id = ?';
    return await db.prepare(query).bind(chat_id).first();
}

export async function updateAIProvider(db, chat_id, provider) {
    const query = 'UPDATE users SET preferred_ai_provider = ? WHERE chat_id = ?';
    return await db.prepare(query).bind(provider, chat_id).run();
}

export async function updateUserLocation(db, chat_id, { timezone, city, country }) {
    const query = 'UPDATE users SET timezone = ?, city = ?, country = ? WHERE chat_id = ?';
    return await db.prepare(query).bind(timezone, city, country, chat_id).run();
}
