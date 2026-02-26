import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';

vi.mock('../../utils/permissions.ts', () => ({
  requirePermission: vi.fn(),
}));

const mockAggregate = vi.fn();
vi.mock('../events/careEvent.model.ts', () => ({
  default: {
    aggregate: (...args: any[]) => mockAggregate(...args),
  },
}));

import { sleepSummaryPerDay, feedingPattern, wakeWindows, normalizeInsights } from './analytics.service.ts';
import { requirePermission } from '../../utils/permissions.ts';

describe('analytics.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sleepSummaryPerDay', () => {
    it('should check canRead permission and run aggregation pipeline', async () => {
      const userId = 'u1';
      const childId = new Types.ObjectId().toString();
      mockAggregate.mockResolvedValue([{ _id: '2024-01-01', totalSleepMinutes: 600, sessions: 3 }]);

      const result = await sleepSummaryPerDay(userId, childId);

      expect(requirePermission).toHaveBeenCalledWith(userId, childId, 'canRead');
      expect(mockAggregate).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ $match: expect.objectContaining({ type: 'sleep' }) }),
      ]));
      expect(result).toHaveLength(1);
    });
  });

  describe('feedingPattern', () => {
    it('should check canRead permission and run aggregation for feeds', async () => {
      const userId = 'u1';
      const childId = new Types.ObjectId().toString();
      mockAggregate.mockResolvedValue([]);

      await feedingPattern(userId, childId);

      expect(requirePermission).toHaveBeenCalledWith(userId, childId, 'canRead');
      expect(mockAggregate).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ $match: expect.objectContaining({ type: 'feed' }) }),
      ]));
    });
  });

  describe('wakeWindows', () => {
    it('should check canRead permission and run wake window aggregation', async () => {
      const userId = 'u1';
      const childId = new Types.ObjectId().toString();
      mockAggregate.mockResolvedValue([]);

      await wakeWindows(userId, childId);

      expect(requirePermission).toHaveBeenCalledWith(userId, childId, 'canRead');
      expect(mockAggregate).toHaveBeenCalled();
    });
  });

  describe('normalizeInsights', () => {
    it('should normalize sleep and feeding data', () => {
      const result = normalizeInsights({
        sleep: [{ _id: '2024-01-01', totalSleepMinutes: 600, sessions: 3 }],
        feeding: [{ _id: { day: '2024-01-01' }, totalAmount: 500, feedCount: 6 }],
        ageWeeks: 12,
      });

      expect(result.sleep).toEqual([{ day: '2024-01-01', totalSleepMinutes: 600, sessions: 3 }]);
      expect(result.feeding).toEqual([{ day: '2024-01-01', totalAmount: 500, feedCount: 6 }]);
      expect(result.ageWeeks).toBe(12);
    });
  });
});
