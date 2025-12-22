import { type Request, type Response } from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";

const limiter = new RateLimiterMemory({
  points: 10,
  duration: 60
});

export function rateLimit(req: Request, res: Response, next: (error?: Error | 'route' | 'router') => void) {
  const key = req.ip || 'anon';
  limiter.consume(key)
    .then(() => next())
    .catch(() => res.status(429).json({
      code: 'RATE_LIMITED',
      message: 'Too many requests'
    }))
}