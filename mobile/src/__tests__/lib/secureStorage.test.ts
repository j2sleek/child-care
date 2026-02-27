import * as SecureStore from 'expo-secure-store';
import { saveTokens, loadTokens, clearTokens } from '../../lib/secureStorage';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('secureStorage', () => {
  it('saveTokens writes both token and refresh token', async () => {
    await saveTokens('access-tok', 'refresh-tok');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth_token', 'access-tok');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth_refresh_token', 'refresh-tok');
  });

  it('loadTokens returns both values from SecureStore', async () => {
    (SecureStore.getItemAsync as jest.Mock)
      .mockResolvedValueOnce('access-tok')
      .mockResolvedValueOnce('refresh-tok');
    const result = await loadTokens();
    expect(result).toEqual({ token: 'access-tok', refreshToken: 'refresh-tok' });
  });

  it('loadTokens returns nulls when store is empty', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    const result = await loadTokens();
    expect(result).toEqual({ token: null, refreshToken: null });
  });

  it('clearTokens deletes both keys', async () => {
    await clearTokens();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_refresh_token');
  });
});
