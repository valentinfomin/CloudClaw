import { describe, it, expect, vi } from 'vitest';
import { handleUpdate } from '../src/handlers/commands.js';
import * as TelegramService from '../src/services/telegram.js';
import * as StorageService from '../src/services/storage.js';
import * as FileDAL from '../src/db/files.js';
import * as UserDAL from '../src/db/users.js';

// Mock services
vi.mock('../src/services/telegram.js');
vi.mock('../src/services/storage.js');
vi.mock('../src/db/files.js');
vi.mock('../src/db/users.js');

describe('File Upload Handler', () => {
    const mockEnv = {
        TG_TOKEN: 'test_token',
        DB: {
            prepare: vi.fn().mockReturnThis(),
            bind: vi.fn().mockReturnThis(),
            run: vi.fn(),
            all: vi.fn()
        },
        FILES: { put: vi.fn() },
        AI: { run: vi.fn() } // Mock AI if it's called
    };

    it('should handle document upload', async () => {
        const update = {
            message: {
                chat: { id: 123 },
                from: { id: 123, username: 'testuser' },
                document: {
                    file_id: 'file_123',
                    file_name: 'doc.pdf',
                    mime_type: 'application/pdf',
                    file_size: 1024
                }
            }
        };

        // Mocks
        TelegramService.getFileInfo.mockResolvedValue({ file_path: 'documents/doc.pdf' });
        TelegramService.downloadFile.mockResolvedValue(new ArrayBuffer(1024));
        TelegramService.sendMessage.mockResolvedValue({});
        StorageService.uploadFile.mockResolvedValue({});
        FileDAL.createFile.mockResolvedValue({});
        UserDAL.getUser.mockResolvedValue({ chat_id: '123' }); // Add this mock

        const c = {
            env: mockEnv,
            json: vi.fn()
        };

        await handleUpdate(c, update);

        // Verify Telegram Service calls
        expect(TelegramService.getFileInfo).toHaveBeenCalledWith('test_token', 'file_123');
        expect(TelegramService.downloadFile).toHaveBeenCalledWith('test_token', 'documents/doc.pdf');

        // Verify Storage Service calls
        // Since key contains timestamp, we use stringContaining
        expect(StorageService.uploadFile).toHaveBeenCalledWith(
            mockEnv.FILES,
            expect.stringContaining('123/'),
            expect.any(ArrayBuffer),
            'application/pdf'
        );

        // Verify DAL calls
        expect(FileDAL.createFile).toHaveBeenCalledWith(
            mockEnv.DB,
            expect.objectContaining({
                user_id: '123',
                filename: 'doc.pdf',
                content_type: 'application/pdf',
                size: 1024
            })
        );
        
        // Verify user notification
        expect(TelegramService.sendMessage).toHaveBeenCalledWith(
            'test_token',
            '123',
            expect.stringContaining('File uploaded successfully')
        );
    });
});
