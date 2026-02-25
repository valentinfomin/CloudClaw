import { describe, it, expect, vi } from 'vitest';
import { sendNotification } from '../src/services/notification_service.js';

describe('Notification Service', () => {
    it('should send a notification', () => {
        const consoleSpy = vi.spyOn(console, 'log');
        sendNotification('Test Message');
        expect(consoleSpy).toHaveBeenCalledWith('Notification: Test Message');
    });
});
