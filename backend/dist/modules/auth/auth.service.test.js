import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
vi.mock('bcryptjs', () => ({
    default: { hash: vi.fn(), compare: vi.fn() },
}));
vi.mock('jsonwebtoken', () => ({
    default: { sign: vi.fn() },
}));
vi.mock('../../config/env.ts', () => ({
    env: { JWT_SECRET: 'test-secret', JWT_EXPIRES_IN: '7d' },
}));
const mockUserCreate = vi.fn();
const mockUserFindOne = vi.fn();
vi.mock('../users/user.model.ts', () => ({
    default: {
        findOne: (...args) => mockUserFindOne(...args),
        create: (...args) => mockUserCreate(...args),
    },
}));
import { register, login } from "./auth.service.js";
describe('auth.service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe('register', () => {
        it('should create a new user with hashed password', async () => {
            mockUserFindOne.mockResolvedValue(null);
            vi.mocked(bcrypt.hash).mockResolvedValue('hashed-pw');
            const fakeUser = { _id: 'u1', email: 'a@b.com', name: 'Test' };
            mockUserCreate.mockResolvedValue(fakeUser);
            const result = await register('a@b.com', 'password123', 'Test');
            expect(mockUserFindOne).toHaveBeenCalledWith({ email: 'a@b.com' });
            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
            expect(mockUserCreate).toHaveBeenCalledWith({
                email: 'a@b.com',
                passwordHash: 'hashed-pw',
                name: 'Test',
            });
            expect(result).toEqual(fakeUser);
        });
        it('should throw EMAIL_EXISTS if email already registered', async () => {
            mockUserFindOne.mockResolvedValue({ _id: 'existing' });
            await expect(register('a@b.com', 'pw')).rejects.toThrow('Email already registered');
            try {
                await register('a@b.com', 'pw');
            }
            catch (e) {
                expect(e.statusCode).toBe(400);
                expect(e.code).toBe('EMAIL_EXISTS');
            }
        });
    });
    describe('login', () => {
        it('should return token and user on valid credentials', async () => {
            const fakeUser = { _id: { toString: () => 'u1' }, email: 'a@b.com', passwordHash: 'hashed' };
            mockUserFindOne.mockResolvedValue(fakeUser);
            vi.mocked(bcrypt.compare).mockResolvedValue(true);
            vi.mocked(jwt.sign).mockReturnValue('jwt-token');
            const result = await login('a@b.com', 'password123');
            expect(result.token).toBe('jwt-token');
            expect(result.user).toBe(fakeUser);
            expect(jwt.sign).toHaveBeenCalledWith({ sub: 'u1', email: 'a@b.com' }, 'test-secret', { expiresIn: '7d' });
        });
        it('should throw INVALID_CREDENTIALS if user not found', async () => {
            mockUserFindOne.mockResolvedValue(null);
            try {
                await login('a@b.com', 'pw');
            }
            catch (e) {
                expect(e.message).toBe('Invalid credentials');
                expect(e.statusCode).toBe(401);
                expect(e.code).toBe('INVALID_CREDENTIALS');
            }
        });
        it('should throw INVALID_CREDENTIALS if password is wrong', async () => {
            mockUserFindOne.mockResolvedValue({ _id: 'u1', email: 'a@b.com', passwordHash: 'hashed' });
            vi.mocked(bcrypt.compare).mockResolvedValue(false);
            try {
                await login('a@b.com', 'wrong');
            }
            catch (e) {
                expect(e.message).toBe('Invalid credentials');
                expect(e.statusCode).toBe(401);
                expect(e.code).toBe('INVALID_CREDENTIALS');
            }
        });
    });
});
