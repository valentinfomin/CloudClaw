import { describe, it, expect, vi } from 'vitest';
import { extractDocumentCloudflare } from '../src/services/ai.js';

describe('Cloudflare Document Extraction', () => {
    it('should call toMarkdown with correct parameters', async () => {
        const mockAi = {
            toMarkdown: vi.fn().mockResolvedValue({ data: 'Extracted Markdown' })
        };
        const buffer = new ArrayBuffer(8);
        const mimeType = 'application/pdf';

        const result = await extractDocumentCloudflare(mockAi, buffer, mimeType);

        expect(mockAi.toMarkdown).toHaveBeenCalledWith({
            name: expect.stringContaining('doc_'),
            blob: expect.any(Blob)
        });
        expect(result).toBe('Extracted Markdown');
    });

    it('should throw if toMarkdown is not available', async () => {
        const mockAi = {};
        await expect(extractDocumentCloudflare(mockAi, new ArrayBuffer(0), 'application/pdf'))
            .rejects.toThrow('Cloudflare AI toMarkdown utility is not available');
    });

    it('should throw if extraction returns no data', async () => {
        const mockAi = {
            toMarkdown: vi.fn().mockResolvedValue({})
        };
        await expect(extractDocumentCloudflare(mockAi, new ArrayBuffer(0), 'application/pdf'))
            .rejects.toThrow('Cloudflare extraction returned no data');
    });
});
