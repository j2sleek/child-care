import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { z } from 'zod';
import { authApi } from '../../src/api/endpoints/auth';
import { useAuthStore } from '../../src/stores/auth.store';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import i18n from '../../src/lib/i18n';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const result = schema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        if (e.path[0]) fieldErrors[e.path[0] as string] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const data = await authApi.login({ email, password });
      await login(data.token, data.refreshToken, data.user);
      router.replace('/(app)');
    } catch (err: any) {
      Alert.alert('Login failed', err?.response?.data?.message ?? 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center px-6 py-12">
          <Text className="text-3xl font-bold text-gray-900 mb-2">Welcome back</Text>
          <Text className="text-base text-gray-500 mb-8">Sign in to continue</Text>

          <Input
            label={i18n.t('auth.email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            placeholder="you@example.com"
          />
          <Input
            label={i18n.t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
            placeholder="••••••••"
          />

          <Button
            title={i18n.t('auth.login')}
            onPress={handleLogin}
            loading={loading}
            size="lg"
            className="mb-4"
          />

          <TouchableOpacity onPress={() => router.push('/(auth)/register')} className="items-center">
            <Text className="text-sm text-gray-600">
              {i18n.t('auth.noAccount')}{' '}
              <Text className="text-primary-500 font-semibold">{i18n.t('auth.register')}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
