import { NextFunction, Request, Response } from "express";
import { requestId } from "./requsetId.middleware.js";

export function errorMiddleware(err: any, req: Request, res: Response, _next: NextFunction) {
  const status = err.statusCode ?? 500;
  const code = err.code ?? 'INTERNAL_ERROR';
  const message = err.message ?? 'Internal Server Error';

  console.error(JSON.stringify({
    requestId: (req as any).requestId,
    status,
    code,
    message,
    stack: err.stack
  }));

  res.status(status).json({
    code,
    message,
    requestId: (req as any).requestId
  });
}