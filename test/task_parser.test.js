import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseTaskIntent } from '../src/services/task_parser.js';
import * as AiService from '../src/services/ai.js';

vi.mock('../src/services/ai.js', () => ({
    runChat: vi.fn()
}));

describe('Task Parser Service', () => {
    let mockAi;

    beforeEach(() => {
        vi.clearAllMocks();
        mockAi = {};
    });

    it('should detect a simple English reminder', async () => {
        AiService.runChat.mockResolvedValue(JSON.stringify({
            intent_detected: true,
            task_type: 'reminder',
            message: 'Buy milk',
            start_offset_ms: 60000,
            interval_ms: 0,
            total_count: 1
        }));

        const result = await parseTaskIntent(mockAi, "Remind me to buy milk in 1 minute");

        expect(result.intent_detected).toBe(true);
        expect(result.message).toBe('Buy milk');
        expect(result.start_offset_ms).toBe(60000);
    });

    it('should detect a complex Russian reminder', async () => {
        AiService.runChat.mockResolvedValue(JSON.stringify({
            intent_detected: true,
            task_type: 'reminder',
            message: "razmiat'sa",
            start_offset_ms: 60000,
            interval_ms: 120000,
            total_count: 3
        }));

        const result = await parseTaskIntent(mockAi, "napomni mne razmiat'sa kajdie 2 minuti 3 raza . nachni cherez 1 minutu");

        expect(result.intent_detected).toBe(true);
        expect(result.interval_ms).toBe(120000);
        expect(result.total_count).toBe(3);
    });

    it('should return false if no intent is detected', async () => {
        AiService.runChat.mockResolvedValue(JSON.stringify({
            intent_detected: false
        }));

        const result = await parseTaskIntent(mockAi, "What is the weather today?");

        expect(result.intent_detected).toBe(false);
    });
});
