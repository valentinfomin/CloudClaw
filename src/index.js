import { Hono } from 'hono';
import { authMiddleware } from './middleware/auth.js';
import { handleUpdate } from './handlers/commands.js';

const app = new Hono();

app.use('/webhook', authMiddleware);
app.post('/webhook', handleUpdate);

export default app;
