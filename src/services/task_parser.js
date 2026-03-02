import { runChat } from './ai.js';

const PARSE_MODEL = ['@cf/meta/llama-3.2-3b-instruct'];

/**
 * Parses user text to detect task scheduling intent.
 * @param {any} ai Cloudflare AI binding
 * @param {string} text User message
 * @param {any[]} history Chat history
 * @returns {Promise<Object>} Structured task data
 */
export async function parseTaskIntent(ai, text, history = []) {
    const now = new Date();
    const systemPrompt = `You are a task extraction engine. Analyze the user's message and history to determine if they want to schedule a reminder or task.
Current time: ${now.toISOString()}

OUTPUT FORMAT (JSON ONLY):
{
  "intent_detected": boolean,
  "task_type": "reminder" | "cleanup" | "ai_process",
  "message": "The text to remind or task description",
  "start_offset_ms": number,
  "interval_ms": number,
  "total_count": number,
  "explanation": "Brief explanation"
}

RULES:
1. If no scheduling intent is found, set intent_detected to false.
2. Calculate start_offset_ms (ms from now to first execution).
3. Calculate interval_ms (ms between repetitions, 0 if none).
4. Set total_count (total executions, 1 for single).
5. Understand multiple languages (Russian, English, etc.).
6. Reply ONLY with the JSON object.`;

    const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-5).map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: text }
    ];

    try {
        const response = await runChat(ai, PARSE_MODEL, messages);
        const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(cleanJson);
        
        // Validation/Sanity checks
        if (typeof result.intent_detected !== 'boolean') result.intent_detected = false;
        
        return result;
    } catch (err) {
        console.error("Task Parser Error:", err.message);
        return { intent_detected: false };
    }
}
