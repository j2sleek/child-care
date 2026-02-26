import { RateLimiterMemory } from "rate-limiter-flexible";
import { env } from "../config/env.js";
const globalLimiter = new RateLimiterMemory({
    points: env.RATE_LIMIT_POINTS,
    duration: env.RATE_LIMIT_DURATION
});
const authLimiter = new RateLimiterMemory({
    points: env.AUTH_RATE_LIMIT_POINTS,
    duration: env.AUTH_RATE_LIMIT_DURATION
});
export function rateLimit(req, res, next) {
    const key = req.ip || 'anon';
    globalLimiter.consume(key)
        .then(() => next())
        .catch(() => res.status(429).json({
        code: 'RATE_LIMITED',
        message: 'Too many requests'
    }));
}
export function authRateLimit(req, res, next) {
    const key = req.ip || 'anon';
    authLimiter.consume(key)
        .then(() => next())
        .catch(() => res.status(429).json({
        code: 'RATE_LIMITED',
        message: 'Too many authentication attempts'
    }));
}
