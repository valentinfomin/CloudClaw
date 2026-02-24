export async function authMiddleware(c, next) {
    const token = c.req.header('X-Telegram-Bot-Api-Secret-Token');
    // Use WEBHOOK_SECRET for header validation, fallback to TG_TOKEN only for testing
    const expectedToken = c.env.WEBHOOK_SECRET || c.env.TG_TOKEN;

    if (!token || token !== expectedToken) {
        console.warn(`[AUTH] Unauthorized. Header: ${token}, Expected: ${expectedToken ? '***' : 'MISSING'}`);
        return c.text('Unauthorized', 401);
    }
    await next();
}
