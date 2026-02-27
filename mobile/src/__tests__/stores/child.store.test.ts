import { act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useChildStore } from '../../stores/child.store';

beforeEach(() => {
  useChildStore.setState({ selectedChildId: null });
  jest.clearAllMocks();
});

describe('child.store', () => {
  it('initialises with null selectedChildId', () => {
    expect(useChildStore.getState().selectedChildId).toBeNull();
  });

  it('setSelectedChild persists to AsyncStorage and updates state', async () => {
    await act(async () => {
      await useChildStore.getState().setSelectedChild('child-abc');
    });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('selectedChildId', 'child-abc');
    expect(useChildStore.getState().selectedChildId).toBe('child-abc');
  });

  it('clearSelectedChild removes from AsyncStorage and resets state', async () => {
    useChildStore.setState({ selectedChildId: 'child-abc' });
    await act(async () => {
      await useChildStore.getState().clearSelectedChild();
    });
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('selectedChildId');
    expect(useChildStore.getState().selectedChildId).toBeNull();
  });

  it('hydrate loads stored id from AsyncStorage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('child-xyz');
    await act(async () => {
      await useChildStore.getState().hydrate();
    });
    expect(useChildStore.getState().selectedChildId).toBe('child-xyz');
  });

  it('hydrate does not change state when AsyncStorage is empty', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    await act(async () => {
      await useChildStore.getState().hydrate();
    });
    expect(useChildStore.getState().selectedChildId).toBeNull();
  });
});
