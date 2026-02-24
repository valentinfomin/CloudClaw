import { describe, it, expect, vi } from 'vitest';
import app from '../src/index.js';

describe('Telegram Webhook', () => {
    const mockEnv = {
        TG_TOKEN: 'test_token',
        DB: {
            prepare: vi.fn().mockReturnThis(),
            bind: vi.fn().mockReturnThis(),
            run: vi.fn().mockResolvedValue({ meta: { last_row_id: 1 } }),
            first: vi.fn()
        },
        AI: { run: vi.fn().mockResolvedValue({ data: [[0.1, 0.2]] }) },
        VECTOR_INDEX: { upsert: vi.fn().mockResolvedValue({}) }
    };

    it('should return 401 for unauthorized requests', async () => {
        const req = new Request('http://localhost/webhook', {
            method: 'POST',
            headers: { 'X-Telegram-Bot-Api-Secret-Token': 'wrong_token' }
        });
        const res = await app.fetch(req, mockEnv);
        expect(res.status).toBe(401);
    });

    it('should return 200 for valid /start command', async () => {
        const update = {
            update_id: 1,
            message: {
                message_id: 1,
                from: { id: 123, first_name: 'Test', username: 'testuser' },
                chat: { id: 123, type: 'private' },
                date: 1620000000,
                text: '/start'
            }
        };
        const req = new Request('http://localhost/webhook', {
            method: 'POST',
            headers: { 
                'X-Telegram-Bot-Api-Secret-Token': 'test_token',
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(update)
        });

        const res = await app.fetch(req, mockEnv);
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ ok: true });
        
        // Verify DB calls
        expect(mockEnv.DB.prepare).toHaveBeenCalled(); // Should call createUser and logMessage
    });
});
