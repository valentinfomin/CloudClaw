import { describe, it, expect } from 'vitest';
import { extractText } from '../src/services/extractor.js';

describe('Text Extractor Service', () => {
    it('should extract text from plain text buffer', async () => {
        const buffer = new TextEncoder().encode('Hello World').buffer;
        const result = await extractText(buffer, 'text/plain');
        expect(result).toBe('Hello World');
    });

    it('should throw for unsupported types', async () => {
        const buffer = new ArrayBuffer(0);
        await expect(extractText(buffer, 'image/jpeg')).rejects.toThrow('Unsupported MIME type');
    });
});
