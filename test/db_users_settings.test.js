import { describe, it, expect, vi } from 'vitest';
import { createUser, getUser, updateAIProvider } from '../src/db/users.js';

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
});
