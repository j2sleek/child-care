import { type Request, type Response } from "express";
import { randomUUID } from "node:crypto";

export function requestId(req: Request, res: Response, next: (error?: Error | 'route' | 'router') => void) {
  const id = (req.headers['x-request-id'] as string) || randomUUID();
  (req as any).requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}