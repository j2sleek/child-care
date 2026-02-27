import Purchases from 'react-native-purchases';
import { configurePurchases, purchasePackage, restorePurchases, getOfferings } from '../../lib/purchases';

beforeEach(() => {
  jest.clearAllMocks();
  // Reset configured flag by reimporting
  jest.resetModules();
});

describe('purchases', () => {
  it('does not configure when API key is missing', () => {
    const { configurePurchases } = require('../../lib/purchases');
    configurePurchases('user-123');
    expect(Purchases.configure).not.toHaveBeenCalled();
  });

  it('getOfferings returns null on error', async () => {
    (Purchases.getOfferings as jest.Mock).mockRejectedValueOnce(new Error('Network'));
    const { getOfferings } = require('../../lib/purchases');
    const result = await getOfferings();
    expect(result).toBeNull();
  });

  it('restorePurchases returns false when no active entitlements', async () => {
    (Purchases.restorePurchases as jest.Mock).mockResolvedValueOnce({
      entitlements: { active: {} },
    });
    const { restorePurchases } = require('../../lib/purchases');
    const result = await restorePurchases();
    expect(result).toBe(false);
  });

  it('restorePurchases returns true when entitlements are active', async () => {
    (Purchases.restorePurchases as jest.Mock).mockResolvedValueOnce({
      entitlements: { active: { pro: {} } },
    });
    const { restorePurchases } = require('../../lib/purchases');
    const result = await restorePurchases();
    expect(result).toBe(true);
  });

  it('purchasePackage returns false when user cancels', async () => {
    const cancelError = new Error('User cancelled');
    (cancelError as any).userCancelled = true;
    (Purchases.purchasePackage as jest.Mock).mockRejectedValueOnce(cancelError);
    const { purchasePackage } = require('../../lib/purchases');
    const result = await purchasePackage({ identifier: 'monthly' } as any);
    expect(result).toBe(false);
  });

  it('purchasePackage rethrows non-cancel errors', async () => {
    (Purchases.purchasePackage as jest.Mock).mockRejectedValueOnce(new Error('Payment failed'));
    const { purchasePackage } = require('../../lib/purchases');
    await expect(purchasePackage({ identifier: 'monthly' } as any)).rejects.toThrow('Payment failed');
  });
});
