export async function authMiddleware(c, next) {
    const token = c.req.header('X-Telegram-Bot-Api-Secret-Token');
    const expectedToken = c.env.TG_TOKEN;

    if (!token || token !== expectedToken) {
        return c.text('Unauthorized', 401);
    }
    await next();
}