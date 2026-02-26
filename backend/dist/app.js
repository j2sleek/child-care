import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { pinoHttp } from 'pino-http';
import { requestId } from "./middlewares/requestId.middleware.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { rateLimit } from "./middlewares/rate.middleware.js";
import { isDbReady } from "./config/db.js";
import { isRedisReady } from "./config/redis.js";
import { env } from "./config/env.js";
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import childRoutes from "./modules/children/child.routes.js";
import accessRoutes from "./modules/access/access.routes.js";
import eventRoutes from "./modules/events/event.routes.js";
import analyticsRoutes from "./modules/analytics/analytics.routes.js";
import normsAdminRoutes from "./modules/norms/norm.admin.routes.js";
import aiRoutes from "./modules/ai/ai.routes.js";
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
// Logging — use only pino (structured JSON), removed redundant morgan
app.use(pinoHttp({ level: env.NODE_ENV === 'production' ? 'info' : 'debug' }));
app.use(requestId);
// Global rate limiting
app.use(rateLimit);
// Deep health check
app.get('/health', (_req, res) => {
    const mongo = isDbReady();
    const redis = isRedisReady();
    const status = mongo && redis ? 200 : 503;
    res.status(status).json({
        ok: mongo && redis,
        mongo,
        redis,
        uptime: process.uptime()
    });
});
// API v1 routes
app.use('/v1/auth', authRoutes);
app.use('/v1/users', userRoutes);
app.use('/v1/children', childRoutes);
app.use('/v1/access', accessRoutes);
app.use('/v1/events', eventRoutes);
app.use('/v1/analytics', analyticsRoutes);
app.use('/v1/admin', normsAdminRoutes);
app.use('/v1/ai', aiRoutes);
// Backwards-compatible unversioned routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/children', childRoutes);
app.use('/access', accessRoutes);
app.use('/events', eventRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/admin', normsAdminRoutes);
app.use('/ai', aiRoutes);
app.use(errorMiddleware);
export default app;
