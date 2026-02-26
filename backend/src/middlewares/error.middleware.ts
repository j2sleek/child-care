import { type Request, type Response, type NextFunction } from "express";
import logger from '../config/logger.ts';

export function errorMiddleware(err: unknown, req: Request, res: Response, _next: NextFunction) {
  // Handle Zod validation errors
  const zodErr = err as any;
  if (zodErr?.name === 'ZodError' || zodErr?.issues) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      errors: zodErr.issues?.map((i: any) => ({
        path: i.path.join('.'),
        message: i.message
      })),
      requestId: req.requestId
    });
  }

  const appErr = err as any;
  const status: number = appErr?.statusCode ?? 500;
  const code: string = appErr?.code ?? 'INTERNAL_ERROR';
  // Never leak internal error messages for 500s
  const message: string = status === 500 ? 'Internal Server Error' : (appErr?.message ?? 'Internal Server Error');

  logger.error({
    requestId: req.requestId,
    status,
    code,
    message: appErr?.message,
    stack: appErr?.stack,
  }, 'Request error');

  res.status(status).json({ code, message, requestId: req.requestId });
}
