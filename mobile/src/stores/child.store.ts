import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHILD_KEY = 'selectedChildId';

interface ChildState {
  selectedChildId: string | null;
  setSelectedChild: (id: string) => Promise<void>;
  clearSelectedChild: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useChildStore = create<ChildState>((set) => ({
  selectedChildId: null,

  setSelectedChild: async (id) => {
    await AsyncStorage.setItem(CHILD_KEY, id);
    set({ selectedChildId: id });
  },

  clearSelectedChild: async () => {
    await AsyncStorage.removeItem(CHILD_KEY);
    set({ selectedChildId: null });
  },

  hydrate: async () => {
    const id = await AsyncStorage.getItem(CHILD_KEY);
    if (id) set({ selectedChildId: id });
  },
}));
