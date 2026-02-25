import { describe, it, expect, vi } from 'vitest';
import { createFile, listFiles } from '../src/db/files.js';

describe('Files DAL', () => {
    const mockDB = {
        prepare: vi.fn().mockReturnThis(),
        bind: vi.fn().mockReturnThis(),
        run: vi.fn(),
        all: vi.fn()
    };

    it('createFile should insert a file record', async () => {
        const file = {
            user_id: '123',
            r2_key: '123/test.jpg',
            filename: 'test.jpg',
            content_type: 'image/jpeg',
            size: 1024
        };
        mockDB.run.mockResolvedValue({ meta: { last_row_id: 101 } });
        const result = await createFile(mockDB, file);
        expect(mockDB.prepare).toHaveBeenCalledWith(
            'INSERT INTO files (user_id, r2_key, filename, content_type, size) VALUES (?, ?, ?, ?, ?)'
        );
        expect(mockDB.bind).toHaveBeenCalledWith('123', '123/test.jpg', 'test.jpg', 'image/jpeg', 1024);
        expect(result).toBe(101);
    });

    it('listFiles should retrieve files for a user', async () => {
        const mockFiles = [{ id: 1, filename: 'test.jpg' }];
        mockDB.all.mockResolvedValue({ results: mockFiles });
        
        const result = await listFiles(mockDB, '123');
        
        expect(mockDB.prepare).toHaveBeenCalledWith('SELECT * FROM files WHERE user_id = ? ORDER BY created_at DESC');
        expect(mockDB.bind).toHaveBeenCalledWith('123');
        expect(result).toEqual(mockFiles);
    });
});
