import { act } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../../stores/auth.store';

const mockToken = 'test.jwt.token';
const mockRefresh = 'test-refresh-token';
const mockUser = { id: '123', name: 'Jane', email: 'jane@example.com', role: 'user' };

beforeEach(() => {
  // Reset store to initial state
  useAuthStore.setState({ token: null, refreshToken: null, user: null, isHydrated: false });
  jest.clearAllMocks();
});

describe('auth.store', () => {
  it('initialises with null state', () => {
    const { token, refreshToken, user, isHydrated } = useAuthStore.getState();
    expect(token).toBeNull();
    expect(refreshToken).toBeNull();
    expect(user).toBeNull();
    expect(isHydrated).toBe(false);
  });

  it('login saves tokens to SecureStore and updates state', async () => {
    await act(async () => {
      await useAuthStore.getState().login(mockToken, mockRefresh, mockUser);
    });
    expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(2);
    const state = useAuthStore.getState();
    expect(state.token).toBe(mockToken);
    expect(state.refreshToken).toBe(mockRefresh);
    expect(state.user).toEqual(mockUser);
  });

  it('logout clears tokens from SecureStore and resets state', async () => {
    useAuthStore.setState({ token: mockToken, refreshToken: mockRefresh, user: mockUser });
    await act(async () => {
      await useAuthStore.getState().logout();
    });
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(2);
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
  });

  it('setUser updates only the user field', () => {
    useAuthStore.setState({ token: mockToken, refreshToken: mockRefresh, user: null });
    useAuthStore.getState().setUser(mockUser);
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().token).toBe(mockToken);
  });

  it('hydrate loads tokens from SecureStore and marks isHydrated', async () => {
    (SecureStore.getItemAsync as jest.Mock)
      .mockResolvedValueOnce(mockToken)
      .mockResolvedValueOnce(mockRefresh);
    await act(async () => {
      await useAuthStore.getState().hydrate();
    });
    const state = useAuthStore.getState();
    expect(state.token).toBe(mockToken);
    expect(state.refreshToken).toBe(mockRefresh);
    expect(state.isHydrated).toBe(true);
  });

  it('hydrate handles empty SecureStore gracefully', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    await act(async () => {
      await useAuthStore.getState().hydrate();
    });
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.isHydrated).toBe(true);
  });

  it('setTokens updates token pair without changing user', async () => {
    useAuthStore.setState({ user: mockUser });
    await act(async () => {
      await useAuthStore.getState().setTokens('new-token', 'new-refresh');
    });
    const state = useAuthStore.getState();
    expect(state.token).toBe('new-token');
    expect(state.refreshToken).toBe('new-refresh');
    expect(state.user).toEqual(mockUser);
  });
});
