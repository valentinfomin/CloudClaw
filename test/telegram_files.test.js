import { describe, it, expect, vi } from 'vitest';
import { getFileInfo, downloadFile } from '../src/services/telegram.js';

describe('Telegram File Service', () => {
    it('getFileInfo should call Telegram API', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            json: () => Promise.resolve({ ok: true, result: { file_path: 'path/to/file.jpg' } })
        });
        global.fetch = mockFetch;

        const result = await getFileInfo('token', 'file_id_123');
        
        expect(mockFetch).toHaveBeenCalledWith(
            'https://api.telegram.org/bottoken/getFile?file_id=file_id_123'
        );
        expect(result).toEqual({ file_path: 'path/to/file.jpg' });
    });

    it('downloadFile should fetch file content', async () => {
        const mockBuffer = new ArrayBuffer(8);
        const mockFetch = vi.fn().mockResolvedValue({
            arrayBuffer: () => Promise.resolve(mockBuffer)
        });
        global.fetch = mockFetch;

        const result = await downloadFile('token', 'path/to/file.jpg');
        
        expect(mockFetch).toHaveBeenCalledWith(
            'https://api.telegram.org/file/bottoken/path/to/file.jpg'
        );
        expect(result).toBeInstanceOf(ArrayBuffer);
    });
});
