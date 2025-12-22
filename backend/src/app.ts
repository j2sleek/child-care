import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { pinoHttp } from 'pino-http';

import { requestId } from './middlewares/requsetId.middleware.ts';
import { errorMiddleware } from './middlewares/error.middleware.ts';
import { rateLimit } from './middlewares/rate.middleware.ts';

import authRoutes from './modules/auth/auth.routes.ts';
import userRoutes from './modules/users/user.routes.ts';
import childRoutes from './modules/children/child.routes.ts';
import accessRoutes from './modules/access/access.routes.ts';
import eventRoutes from './modules/events/event.routes.ts';
import analyticsRoutes from './modules/analytics/analytics.routes.ts';
// import aiRoutes from './modules/ai/ai.routes.ts';
// import aiChatRoutes from './modules/ai/chat.routes.ts';
// import speechRoutes from './modules/ai/speech.routes.ts';
import normsAdminRoutes from './modules/norms/norm.admin.routes.ts';

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
