import { describe, it, expect, vi } from 'vitest';
import { uploadFile, getFile } from '../src/services/storage.js';

describe('R2 Storage Service', () => {
    const mockR2 = {
        put: vi.fn(),
        get: vi.fn()
    };

    it('uploadFile should store file in R2', async () => {
        const key = 'user1/test.jpg';
        const content = new Uint8Array([1, 2, 3]);
        const contentType = 'image/jpeg';
        
        await uploadFile(mockR2, key, content, contentType);
        
        expect(mockR2.put).toHaveBeenCalledWith(key, content, {
            httpMetadata: { contentType }
        });
    });

    it('getFile should retrieve file from R2', async () => {
        const key = 'user1/test.jpg';
        const mockObject = { body: 'content' };
        mockR2.get.mockResolvedValue(mockObject);
        
        const result = await getFile(mockR2, key);
        
        expect(mockR2.get).toHaveBeenCalledWith(key);
        expect(result).toBe(mockObject);
    });

    it('getFile should return null if file not found', async () => {
        mockR2.get.mockResolvedValue(null);
        const result = await getFile(mockR2, 'missing');
        expect(result).toBeNull();
    });
});
