import { Request, Response, NextFunction } from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";

const limiter = new RateLimiterMemory({
  points: 10,
  duration: 60
});

export function rateLimit(req: Request, res: Response, next: NextFunction) {
  const key = req.ip || 'anon';
  limiter.consume(key)
    .then(() => next())
    .catch(() => res.status(429).json({
      code: 'RATE_LIMITED',
      message: 'Too many requests'
    }))
}