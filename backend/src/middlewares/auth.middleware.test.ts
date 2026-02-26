import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

vi.mock('jsonwebtoken', () => ({
  default: { verify: vi.fn() },
}));
vi.mock('../config/env.ts', () => ({
  env: { JWT_SECRET: 'test-secret' },
}));

import { requireAuth } from './auth.middleware.ts';

function mockReqResNext(authHeader?: string) {
  const req: any = {
    headers: { authorization: authHeader },
  };
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  const next = vi.fn();
  return { req, res, next };
}

describe('requireAuth middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if no authorization header', () => {
    const { req, res, next } = mockReqResNext();
    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      code: 'UNAUTHORIZED',
      message: 'Missing bearer token',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if header does not start with Bearer', () => {
    const { req, res, next } = mockReqResNext('Basic abc');
    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should set req.user and call next on valid token', () => {
    vi.mocked(jwt.verify).mockReturnValue({ sub: 'user123', email: 'a@b.com' } as any);
    const { req, res, next } = mockReqResNext('Bearer valid-token');

    requireAuth(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
    expect(req.user).toEqual({ id: 'user123', email: 'a@b.com' });
    expect(next).toHaveBeenCalled();
  });

  it('should return 401 if jwt.verify throws', () => {
    vi.mocked(jwt.verify).mockImplementation(() => { throw new Error('bad token'); });
    const { req, res, next } = mockReqResNext('Bearer bad-token');

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      code: 'UNAUTHORIZED',
      message: 'Invalid token',
    });
    expect(next).not.toHaveBeenCalled();
  });
});
