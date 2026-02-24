import { describe, it, expect, vi } from 'vitest';
import { transcribeAudio } from '../src/services/ai.js';

describe('AI Transcription Service', () => {
    it('transcribeAudio should return text from audio buffer', async () => {
        const mockAI = {
            run: vi.fn().mockResolvedValue({
                text: 'Hello, this is a test transcription.'
            })
        };

        const audioBuffer = new Uint8Array([1, 2, 3]).buffer;
        const result = await transcribeAudio(mockAI, audioBuffer);
        
        expect(mockAI.run).toHaveBeenCalledWith('@cf/openai/whisper', {
            audio: [...new Uint8Array(audioBuffer)]
        });
        expect(result).toBe('Hello, this is a test transcription.');
    });

    it('transcribeAudio should throw if AI fails', async () => {
        const mockAI = {
            run: vi.fn().mockRejectedValue(new Error('AI Transcription Error'))
        };
        await expect(transcribeAudio(mockAI, new ArrayBuffer(0))).rejects.toThrow('AI Transcription Error');
    });
});
