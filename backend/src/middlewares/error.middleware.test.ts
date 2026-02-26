import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorMiddleware } from './error.middleware.ts';

// Suppress pino output during tests
vi.mock('../config/logger.ts', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn(), fatal: vi.fn() }
}));

function createMocks() {
  const req: any = { requestId: 'req-123' };
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  const next = vi.fn();
  return { req, res, next };
}

describe('errorMiddleware', () => {
  it('should respond with error statusCode, code, and message', () => {
    const { req, res, next } = createMocks();
    const err: any = new Error('Not found');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';

    errorMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      code: 'NOT_FOUND',
      message: 'Not found',
      requestId: 'req-123',
    });
  });

  it('should default to 500 and never leak internal message', () => {
    const { req, res, next } = createMocks();
    const err = new Error('Something broke');

    errorMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    // 500 errors must never leak internal messages to the client
    expect(res.json).toHaveBeenCalledWith({
      code: 'INTERNAL_ERROR',
      message: 'Internal Server Error',
      requestId: 'req-123',
    });
  });

  it('should handle Zod validation errors', () => {
    const { req, res, next } = createMocks();
    const err: any = {
      name: 'ZodError',
      issues: [{ path: ['email'], message: 'Invalid email' }],
    };

    errorMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      errors: [{ path: 'email', message: 'Invalid email' }],
      requestId: 'req-123',
    });
  });
});
