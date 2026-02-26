import { type Request, type Response, type NextFunction } from "express";
import { RateLimiterRedis } from "rate-limiter-flexible";
import redisClient from '../config/redis.ts';
import { env } from '../config/env.ts';

// Redis-backed rate limiters — shared state across all process instances/pods
const globalLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl:global',
  points: env.RATE_LIMIT_POINTS,
  duration: env.RATE_LIMIT_DURATION,
});

const authLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl:auth',
  points: env.AUTH_RATE_LIMIT_POINTS,
  duration: env.AUTH_RATE_LIMIT_DURATION,
});

export function rateLimit(req: Request, res: Response, next: NextFunction) {
  const key = req.ip || 'anon';
  globalLimiter.consume(key)
    .then(() => next())
    .catch(() => res.status(429).json({
      code: 'RATE_LIMITED',
      message: 'Too many requests'
    }));
}

export function authRateLimit(req: Request, res: Response, next: NextFunction) {
  const key = req.ip || 'anon';
  authLimiter.consume(key)
    .then(() => next())
    .catch(() => res.status(429).json({
      code: 'RATE_LIMITED',
      message: 'Too many authentication attempts'
    }));
}
