import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';

const mockChildCreate = vi.fn();
const mockChildFind = vi.fn();
vi.mock('./child.model.ts', () => ({
  default: {
    create: (...args: any[]) => mockChildCreate(...args),
    find: (...args: any[]) => mockChildFind(...args),
  },
}));

const mockAccessCreate = vi.fn();
const mockAccessFind = vi.fn();
vi.mock('../access/childAccess.model.ts', () => ({
  default: {
    create: (...args: any[]) => mockAccessCreate(...args),
    find: (...args: any[]) => mockAccessFind(...args),
  },
}));

import { createChild, listMyChildren } from './child.service.ts';

describe('child.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createChild', () => {
    it('should create a child and auto-create full-permission access record', async () => {
      const userId = new Types.ObjectId().toString();
      const dob = new Date('2024-01-01');
      const fakeChild = { _id: new Types.ObjectId(), name: 'Baby', dateOfBirth: dob };
      mockChildCreate.mockResolvedValue(fakeChild);
      mockAccessCreate.mockResolvedValue({});

      const result = await createChild('Baby', dob, userId, 'father');

      expect(mockChildCreate).toHaveBeenCalledWith({
        name: 'Baby',
        dateOfBirth: dob,
        createdBy: expect.any(Types.ObjectId),
      });
      expect(mockAccessCreate).toHaveBeenCalledWith({
        childId: fakeChild._id,
        userId: expect.any(Types.ObjectId),
        role: 'father',
        permissions: { canRead: true, canWrite: true, canInvite: true },
      });
      expect(result).toBe(fakeChild);
    });

    it('should throw on invalid user ID', async () => {
      await expect(createChild('Baby', new Date(), 'bad-id', 'father')).rejects.toThrow('Invalid user ID');
    });
  });

  describe('listMyChildren', () => {
    it('should return children the user has access to', async () => {
      const childId1 = new Types.ObjectId();
      const childId2 = new Types.ObjectId();
      const userId = new Types.ObjectId().toString();

      mockAccessFind.mockReturnValue({
        lean: () => Promise.resolve([{ childId: childId1 }, { childId: childId2 }]),
      });
      const fakeChildren = [{ _id: childId1, name: 'A' }, { _id: childId2, name: 'B' }];
      mockChildFind.mockReturnValue({
        lean: () => Promise.resolve(fakeChildren),
      });

      const result = await listMyChildren(userId);

      expect(mockAccessFind).toHaveBeenCalledWith({ userId: expect.any(Types.ObjectId) });
      expect(mockChildFind).toHaveBeenCalledWith({ _id: { $in: [childId1, childId2] } });
      expect(result).toEqual(fakeChildren);
    });
  });
});
