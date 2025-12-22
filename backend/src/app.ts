import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { pinoHttp } from 'pino-http';

import { requestId } from './middlewares/requsetId.middleware.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { rateLimit } from './middlewares/rate.middleware.js';

import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import childRoutes from './modules/children/child.routes.js';
import accessRoutes from './modules/access/access.routes.js';
import eventRoutes from './modules/events/event.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
// import aiRoutes from './modules/ai/ai.routes.js';
// import aiChatRoutes from './modules/ai/chat.routes.js';
// import speechRoutes from './modules/ai/speech.routes.js';
import normsAdminRoutes from './modules/norms/norm.admin.routes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(pinoHttp());
app.use(morgan('tiny'));
app.use(requestId);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/children', childRoutes);
app.use('/access', accessRoutes);
app.use('/events', eventRoutes);
app.use('/analytics', analyticsRoutes);
// app.use('/ai', rateLimit, aiRoutes);
// app.use('/ai', rateLimit, aiChatRoutes);
// app.use('/ai', rateLimit, speechRoutes);
app.use('/admin', normsAdminRoutes);

app.use(errorMiddleware);

export default app;
