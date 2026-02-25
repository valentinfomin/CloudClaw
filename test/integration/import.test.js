import { describe, it, expect, vi } from 'vitest';
import { handleUpdate } from '../../src/handlers/commands.js';
import * as importService from '../../src/services/import_service.js';
import * as notificationService from '../../src/services/notification_service.js';

vi.mock('../../src/services/import_service.js');
vi.mock('../../src/services/notification_service.js');

describe('Import Integration', () => {
    it('should process an import command and call the import service', async () => {
        const update = {
            message: {
                chat: { id: 123 },
                from: { id: 123, username: 'user' },
                text: '/import {"user_name": "John Doe", "user_email": "john.doe@example.com"}'
            }
        };

        const c = {
            env: {
                TG_TOKEN: 'mock_token',
                DB: {
                    prepare: vi.fn().mockReturnThis(),
                    bind: vi.fn().mockReturnThis(),
                    run: vi.fn().mockResolvedValue({ meta: { last_row_id: 1 } }),
                }
            },
            json: vi.fn()
        };

        await handleUpdate(c, update);

        expect(importService.mapData).toHaveBeenCalled();
    });
});
