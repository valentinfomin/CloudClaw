import { describe, it, expect, vi } from 'vitest';
import { uploadPdfForSearch } from '../src/services/storage.js';

describe('Local PDF Storage Service', () => {
    const mockBucket = {
        put: vi.fn()
    };

    it('uploadPdfForSearch should store PDF in AI_SEARCH_BUCKET with correct prefix', async () => {
        const userId = '12345';
        const fileHash = 'abcde12345';
        const content = new Uint8Array([0, 1, 2]);
        
        await uploadPdfForSearch(mockBucket, userId, fileHash, content);
        
        const expectedKey = `users/${userId}/documents/${fileHash}.pdf`;
        expect(mockBucket.put).toHaveBeenCalledWith(expectedKey, content, {
            httpMetadata: { contentType: 'application/pdf' }
        });
    });
});
