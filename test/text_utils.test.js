import { describe, it, expect } from 'vitest';
import { chunkText } from '../src/utils/text.js';

describe('Text Utilities', () => {
    it('should split text into chunks of specified size', () => {
        const text = 'abcdefghij'; // 10 chars
        const chunks = chunkText(text, 3, 0);
        expect(chunks).toEqual(['abc', 'def', 'ghi', 'j']);
    });

    it('should handle overlap', () => {
        const text = 'abcdefghij';
        const chunks = chunkText(text, 4, 2);
        // abc d, cd ef, ef gh, gh ij
        expect(chunks).toEqual(['abcd', 'cdef', 'efgh', 'ghij']);
    });

    it('should return whole text if smaller than chunk size', () => {
        const text = 'abc';
        const chunks = chunkText(text, 10, 2);
        expect(chunks).toEqual(['abc']);
    });
});
