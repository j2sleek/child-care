import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
const mockAccessFindOne = vi.fn();
const mockAccessFindOneAndUpdate = vi.fn();
const mockAccessFind = vi.fn();
vi.mock('./childAccess.model.ts', () => ({
    default: {
        findOne: (...args) => mockAccessFindOne(...args),
        findOneAndUpdate: (...args) => mockAccessFindOneAndUpdate(...args),
        find: (...args) => mockAccessFind(...args),
    },
}));
const mockUserFindOne = vi.fn();
vi.mock('../users/user.model.ts', () => ({
    default: {
        findOne: (...args) => mockUserFindOne(...args),
    },
}));
import { inviteUserToChild, inviteByEmail, listAccessForChild } from "./access.service.js";
describe('access.service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe('inviteUserToChild', () => {
        it('should create access record when inviter has canInvite', async () => {
            const inviterId = new Types.ObjectId().toString();
            const targetId = new Types.ObjectId().toString();
            const childId = new Types.ObjectId().toString();
            mockAccessFindOne.mockResolvedValue({ permissions: { canInvite: true } });
            const fakeDoc = { _id: 'new-access' };
            mockAccessFindOneAndUpdate.mockResolvedValue(fakeDoc);
            const result = await inviteUserToChild(inviterId, childId, targetId, 'nanny', {
                canRead: true, canWrite: false, canInvite: false,
            });
            expect(result).toBe(fakeDoc);
            expect(mockAccessFindOneAndUpdate).toHaveBeenCalled();
        });
        it('should throw FORBIDDEN when inviter lacks canInvite', async () => {
            const inviterId = new Types.ObjectId().toString();
            const targetId = new Types.ObjectId().toString();
            const childId = new Types.ObjectId().toString();
            mockAccessFindOne.mockResolvedValue({ permissions: { canInvite: false } });
            try {
                await inviteUserToChild(inviterId, childId, targetId, 'nanny', {
                    canRead: true, canWrite: false, canInvite: false,
                });
                expect.unreachable('should have thrown');
            }
            catch (e) {
                expect(e.statusCode).toBe(403);
                expect(e.code).toBe('FORBIDDEN');
            }
        });
        it('should throw FORBIDDEN when inviter has no access', async () => {
            const inviterId = new Types.ObjectId().toString();
            const targetId = new Types.ObjectId().toString();
            const childId = new Types.ObjectId().toString();
            mockAccessFindOne.mockResolvedValue(null);
            await expect(inviteUserToChild(inviterId, childId, targetId, 'nanny', {
                canRead: true, canWrite: false, canInvite: false,
            })).rejects.toThrow('Forbidden');
        });
    });
    describe('inviteByEmail', () => {
        it('should look up user by email and delegate to inviteUserToChild', async () => {
            const targetOid = new Types.ObjectId();
            mockUserFindOne.mockResolvedValue({ _id: targetOid });
            mockAccessFindOne.mockResolvedValue({ permissions: { canInvite: true } });
            mockAccessFindOneAndUpdate.mockResolvedValue({ _id: 'result' });
            const result = await inviteByEmail(new Types.ObjectId().toString(), new Types.ObjectId().toString(), 'target@test.com', 'doctor', { canRead: true, canWrite: false, canInvite: false });
            expect(mockUserFindOne).toHaveBeenCalledWith({ email: 'target@test.com' });
            expect(result).toEqual({ _id: 'result' });
        });
        it('should throw USER_NOT_FOUND if email does not exist', async () => {
            mockUserFindOne.mockResolvedValue(null);
            try {
                await inviteByEmail(new Types.ObjectId().toString(), new Types.ObjectId().toString(), 'unknown@test.com', 'nanny', { canRead: true, canWrite: false, canInvite: false });
                expect.unreachable('should have thrown');
            }
            catch (e) {
                expect(e.statusCode).toBe(404);
                expect(e.code).toBe('USER_NOT_FOUND');
            }
        });
    });
    describe('listAccessForChild', () => {
        it('should return all access records when requester has canInvite', async () => {
            const requesterId = new Types.ObjectId().toString();
            const childId = new Types.ObjectId().toString();
            mockAccessFindOne.mockResolvedValue({ permissions: { canInvite: true } });
            const fakeList = [{ _id: '1' }, { _id: '2' }];
            mockAccessFind.mockReturnValue({ lean: () => Promise.resolve(fakeList) });
            const result = await listAccessForChild(requesterId, childId);
            expect(result).toEqual(fakeList);
        });
        it('should throw FORBIDDEN if requester lacks canInvite', async () => {
            const requesterId = new Types.ObjectId().toString();
            const childId = new Types.ObjectId().toString();
            mockAccessFindOne.mockResolvedValue({ permissions: { canInvite: false } });
            try {
                await listAccessForChild(requesterId, childId);
                expect.unreachable('should have thrown');
            }
            catch (e) {
                expect(e.statusCode).toBe(403);
                expect(e.code).toBe('FORBIDDEN');
            }
        });
    });
});
