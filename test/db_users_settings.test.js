import { describe, it, expect, vi } from 'vitest';
import { createUser, getUser, updateAIProvider, updateUserLocation } from '../src/db/users.js';

describe('Users DAL (Settings)', () => {
    const mockDB = {
        prepare: vi.fn().mockReturnThis(),
        bind: vi.fn().mockReturnThis(),
        first: vi.fn(),
        run: vi.fn(),
    };

    it('updateAIProvider should update user setting', async () => {
        await updateAIProvider(mockDB, '123', 'gemini');
        expect(mockDB.prepare).toHaveBeenCalledWith(
            'UPDATE users SET preferred_ai_provider = ? WHERE chat_id = ?'
        );
        expect(mockDB.bind).toHaveBeenCalledWith('gemini', '123');
        expect(mockDB.run).toHaveBeenCalled();
    });

    it('getUser should now include preferred_ai_provider', async () => {
        mockDB.first.mockResolvedValue({ 
            chat_id: '123', 
            username: 'testuser',
            preferred_ai_provider: 'cloudflare'
        });
        const result = await getUser(mockDB, '123');
        expect(result.preferred_ai_provider).toBe('cloudflare');
    });

    it('updateUserLocation should update timezone, city, and country', async () => {
        const location = { timezone: 'America/Toronto', city: 'Toronto', country: 'CA' };
        await updateUserLocation(mockDB, '123', location);
        expect(mockDB.prepare).toHaveBeenCalledWith(
            'UPDATE users SET timezone = ?, city = ?, country = ? WHERE chat_id = ?'
        );
        expect(mockDB.bind).toHaveBeenCalledWith('America/Toronto', 'Toronto', 'CA', '123');
        expect(mockDB.run).toHaveBeenCalled();
    });

    it('createUser should include default location data', async () => {
        const user = { chat_id: '123', username: 'newuser', first_name: 'New' };
        await createUser(mockDB, user);
        expect(mockDB.prepare).toHaveBeenCalledWith(
            'INSERT INTO users (chat_id, username, first_name, timezone, city, country) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(chat_id) DO UPDATE SET username=excluded.username, first_name=excluded.first_name'
        );
        expect(mockDB.bind).toHaveBeenCalledWith('123', 'newuser', 'New', 'UTC', 'Unknown', 'Unknown');
        expect(mockDB.run).toHaveBeenCalled();
    });
});
