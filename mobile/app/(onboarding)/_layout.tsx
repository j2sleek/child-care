import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';

export default function OnboardingLayout() {
  const { token, isHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && token) {
      router.replace('/(app)');
    }
  }, [isHydrated, token]);

  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
