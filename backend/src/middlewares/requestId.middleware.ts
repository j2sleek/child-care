import { type Request, type Response, type NextFunction } from "express";
import { randomUUID } from "node:crypto";

const UUID_RE = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

export function requestId(req: Request, res: Response, next: NextFunction) {
  const incoming = req.headers['x-request-id'] as string | undefined;
  // Accept only valid UUID format to prevent log injection / header reflection attacks
  const id = (incoming && UUID_RE.test(incoming)) ? incoming : randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}
