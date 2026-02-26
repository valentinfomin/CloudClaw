import { describe, it, expect } from 'vitest';
import { chunkText, truncateResponse } from '../src/utils/text.js';

describe('Text Utilities', () => {
    describe('chunkText', () => {
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

    describe('truncateResponse', () => {
        it('should not truncate if text is within limit', () => {
            const text = 'Hello world';
            expect(truncateResponse(text, 20)).toBe(text);
        });

        it('should truncate and append notice if text exceeds limit', () => {
            const text = 'a'.repeat(100);
            const result = truncateResponse(text, 50, 40);
            expect(result.length).toBe(40 + "... [Truncated due to length]".length);
            expect(result).toBe('a'.repeat(40) + "... [Truncated due to length]");
        });

        it('should use default values', () => {
            const text = 'a'.repeat(2001);
            const result = truncateResponse(text);
            expect(result).toBe('a'.repeat(1950) + "... [Truncated due to length]");
        });

        it('should handle empty or null text', () => {
            expect(truncateResponse('')).toBe('');
            expect(truncateResponse(null)).toBe(null);
        });
    });
});
