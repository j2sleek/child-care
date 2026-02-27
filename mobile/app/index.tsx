import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/auth.store';
import { View, ActivityIndicator } from 'react-native';

export default function RootIndex() {
  const { token, isHydrated } = useAuthStore();

  if (!isHydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-950">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return <Redirect href={token ? '/(app)' : '/(onboarding)'} />;
}
