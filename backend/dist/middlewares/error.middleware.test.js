import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorMiddleware } from "./error.middleware.js";
function createMocks() {
    const req = { requestId: 'req-123' };
    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    };
    const next = vi.fn();
    return { req, res, next };
}
describe('errorMiddleware', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });
    it('should respond with error statusCode, code, and message', () => {
        const { req, res, next } = createMocks();
        const err = new Error('Not found');
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
    it('should default to 500 and INTERNAL_ERROR', () => {
        const { req, res, next } = createMocks();
        const err = new Error('Something broke');
        errorMiddleware(err, req, res, next);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            code: 'INTERNAL_ERROR',
            message: 'Something broke',
            requestId: 'req-123',
        });
    });
    it('should log error details as JSON', () => {
        const { req, res, next } = createMocks();
        const err = new Error('fail');
        err.statusCode = 400;
        err.code = 'BAD_REQUEST';
        errorMiddleware(err, req, res, next);
        expect(console.error).toHaveBeenCalled();
        const logged = JSON.parse(vi.mocked(console.error).mock.calls[0][0]);
        expect(logged.requestId).toBe('req-123');
        expect(logged.status).toBe(400);
        expect(logged.code).toBe('BAD_REQUEST');
    });
});
