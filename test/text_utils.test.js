import { describe, it, expect, vi } from 'vitest';
import { chunkText, truncateResponse, getFormattedTimestamp } from '../src/utils/text.js';

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

    describe('getFormattedTimestamp', () => {
        it('should return ISO 8601 format for UTC', () => {
            const now = new Date('2026-02-25T14:30:00.000Z');
            vi.setSystemTime(now);
            expect(getFormattedTimestamp('UTC')).toBe('2026-02-25T14:30:00Z');
        });

        it('should return ISO 8601 format for a specific timezone', () => {
            const now = new Date('2026-02-25T14:30:00.000Z'); // UTC time
            vi.setSystemTime(now);
            // Europe/Moscow is UTC+3
            expect(getFormattedTimestamp('Europe/Moscow')).toBe('2026-02-25T17:30:00+03:00');
        });

        it('should fallback to UTC for invalid timezone', () => {
            const now = new Date('2026-02-25T14:30:00.000Z');
            vi.setSystemTime(now);
            expect(getFormattedTimestamp('Invalid/Timezone')).toBe('2026-02-25T14:30:00Z');
        });

        it('should handle different date for ISO 8601 with offset', () => {
            const now = new Date('2026-02-25T23:00:00.000Z'); // 11 PM UTC
            vi.setSystemTime(now);
            // Australia/Sydney is UTC+11 (during standard time, without DST changes)
            // So 11 PM UTC on 25th Feb is 10 AM on 26th Feb in Sydney
            expect(getFormattedTimestamp('Australia/Sydney')).toBe('2026-02-26T10:00:00+11:00');
        });
    });
});
