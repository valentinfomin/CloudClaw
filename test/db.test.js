import { describe, it, expect, vi } from 'vitest';
import { createUser, getUser } from '../src/db/users.js';
import { logMessage } from '../src/db/messages.js';

describe('D1 Data Access Layer', () => {
    const mockDB = {
        prepare: vi.fn().mockReturnThis(),
        bind: vi.fn().mockReturnThis(),
        first: vi.fn(),
        run: vi.fn(),
    };

    describe('Users', () => {
        it('createUser should insert a new user', async () => {
            const user = { chat_id: '123', username: 'testuser', first_name: 'Test' };
            await createUser(mockDB, user);
            expect(mockDB.prepare).toHaveBeenCalledWith(
                'INSERT INTO users (chat_id, username, first_name, timezone, city, country) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(chat_id) DO UPDATE SET username=excluded.username, first_name=excluded.first_name'
            );
            expect(mockDB.bind).toHaveBeenCalledWith('123', 'testuser', 'Test', 'UTC', 'Unknown', 'Unknown');
            expect(mockDB.run).toHaveBeenCalled();
        });

        it('getUser should retrieve a user', async () => {
            mockDB.first.mockResolvedValue({ chat_id: '123', username: 'testuser' });
            const result = await getUser(mockDB, '123');
            expect(mockDB.prepare).toHaveBeenCalledWith('SELECT * FROM users WHERE chat_id = ?');
            expect(mockDB.bind).toHaveBeenCalledWith('123');
            expect(result).toEqual({ chat_id: '123', username: 'testuser' });
        });
    });

    describe('Messages', () => {
        it('logMessage should insert a message and return last_row_id', async () => {
            const msg = { chat_id: '123', role: 'user', content: 'Hello' };
            mockDB.run.mockResolvedValue({ meta: { last_row_id: 42 } });
            const result = await logMessage(mockDB, msg);
            expect(mockDB.prepare).toHaveBeenCalledWith(
                'INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)'
            );
            expect(mockDB.bind).toHaveBeenCalledWith('123', 'user', 'Hello');
            expect(result).toBe(42);
        });
    });
});
