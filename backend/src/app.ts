import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { pinoHttp } from 'pino-http';
import logger from './config/logger.ts';

import { requestId } from './middlewares/requestId.middleware.ts';
import { errorMiddleware } from './middlewares/error.middleware.ts';
import { rateLimit } from './middlewares/rate.middleware.ts';
import { isDbReady } from './config/db.ts';
import { isRedisReady } from './config/redis.ts';
import { env } from './config/env.ts';

import authRoutes from './modules/auth/auth.routes.ts';
import userRoutes from './modules/users/user.routes.ts';
import childRoutes from './modules/children/child.routes.ts';
import accessRoutes from './modules/access/access.routes.ts';
import eventRoutes from './modules/events/event.routes.ts';
import analyticsRoutes from './modules/analytics/analytics.routes.ts';
import normsAdminRoutes from './modules/norms/norm.admin.routes.ts';
import adminMetricsRoutes from './modules/admin/admin.metrics.routes.ts';
import adminEntitiesRoutes from './modules/admin/admin.entities.routes.ts';
import aiRoutes from './modules/ai/ai.routes.ts';
import billingRoutes from './modules/billing/billing.routes.ts';
import adminBillingRoutes from './modules/admin/admin.billing.routes.ts';
import reminderRoutes from './modules/reminders/reminder.routes.ts';

const app = express();

// Security
app.use(helmet());

// CORS — restrict origins in production
const corsOrigins = env.CORS_ORIGINS === '*'
  ? true
  : env.CORS_ORIGINS.split(',').map(o => o.trim());
app.use(cors({ origin: corsOrigins, credentials: true }));

app.use(compression());
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: true }));

// Logging — structured JSON via pino, reuses shared logger instance
app.use(pinoHttp({ logger }));

app.use(requestId);

// Global rate limiting
app.use(rateLimit);

// Deep health check
app.get('/health', (_req, res) => {
  const ok = isDbReady() && isRedisReady();
  // Do not expose which specific dependency is down — only overall health status
  res.status(ok ? 200 : 503).json({ ok });
});

// API v1 routes
app.use('/v1/auth', authRoutes);
app.use('/v1/users', userRoutes);
app.use('/v1/children', childRoutes);
app.use('/v1/access', accessRoutes);
app.use('/v1/events', eventRoutes);
app.use('/v1/analytics', analyticsRoutes);
app.use('/v1/admin', normsAdminRoutes);
app.use('/v1/admin', adminMetricsRoutes);
app.use('/v1/admin', adminEntitiesRoutes);
app.use('/v1/ai', aiRoutes);
app.use('/v1/billing', billingRoutes);
app.use('/v1/admin', adminBillingRoutes);
app.use('/v1/reminders', reminderRoutes);

// Backwards-compatible unversioned routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/children', childRoutes);
app.use('/access', accessRoutes);
app.use('/events', eventRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/admin', normsAdminRoutes);
app.use('/admin', adminMetricsRoutes);
app.use('/admin', adminEntitiesRoutes);
app.use('/ai', aiRoutes);
app.use('/billing', billingRoutes);
app.use('/admin', adminBillingRoutes);
app.use('/reminders', reminderRoutes);

app.use(errorMiddleware);

export default app;
