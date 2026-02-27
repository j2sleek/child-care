import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';

export default function AuthLayout() {
  const { token, isHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && token) {
      router.replace('/(app)');
    }
  }, [isHydrated, token]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
