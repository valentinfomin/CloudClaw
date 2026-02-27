import { describe, it, expect, vi } from 'vitest';
import { sendChatAction } from '../src/services/telegram.js';

describe('Telegram Chat Actions', () => {
    it('sendChatAction should call Telegram API with the correct action', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ ok: true, result: true })
        });
        global.fetch = mockFetch;

        await sendChatAction('token', '12345', 'typing');
        
        expect(mockFetch).toHaveBeenCalledWith(
            'https://api.telegram.org/bottoken/sendChatAction',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: '12345', action: 'typing' })
            }
        );
    });

    it('sendChatAction should fail silently if fetch throws an error', async () => {
        const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
        global.fetch = mockFetch;

        // This should not throw
        await expect(sendChatAction('token', '12345', 'typing')).resolves.not.toThrow();
    });

    it('sendChatAction should fail silently if response is not ok', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error'
        });
        global.fetch = mockFetch;

        // This should not throw
        await expect(sendChatAction('token', '12345', 'typing')).resolves.not.toThrow();
    });
});