import '../global.css';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { useAuthStore } from '../src/stores/auth.store';
import { useChildStore } from '../src/stores/child.store';
import { apiClient } from '../src/api/client';
import { registerForPushNotifications } from '../src/lib/notifications';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

export default function RootLayout() {
  const { hydrate, setUser } = useAuthStore();
  const hydrateChild = useChildStore((s) => s.hydrate);
  const colorScheme = useColorScheme();

  useEffect(() => {
    Promise.all([hydrate(), hydrateChild()]).then(async () => {
      const { token } = useAuthStore.getState();
      if (token) {
        try {
          const user = await apiClient.get('/users/me').then((r) => r.data);
          setUser(user);
          // Push registration only on physical devices (guard is inside the lib)
          registerForPushNotifications();
        } catch {
          // Refresh interceptor handles 401; non-fatal here
        }
      }
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false }} />
        </ErrorBoundary>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
