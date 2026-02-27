import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import { apiClient } from '../../src/api/client';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Card } from '../../src/components/ui/Card';
import { useI18n, setLocale } from '../../src/lib/i18n';

const LOCALES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();
  const { t, locale } = useI18n();
  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await apiClient.patch('/users/me', { name }).then((r) => r.data);
      setUser(updated);
      Alert.alert('Success', 'Profile updated');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(t('auth.logout'), 'Are you sure you want to log out?', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('auth.logout'),
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <ScrollView className="flex-1 px-6">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white pt-4 mb-6">
          {t('settings.title')}
        </Text>

        <Card className="mb-4">
          <Text className="text-base font-semibold text-gray-900 dark:text-white mb-3">
            {t('settings.profile')}
          </Text>
          <Input label={t('auth.name')} value={name} onChangeText={setName} />
          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">{user?.email}</Text>
          <Button title={t('common.save')} onPress={handleSave} loading={saving} />
        </Card>

        <Card className="mb-4">
          <Text className="text-base font-semibold text-gray-900 dark:text-white mb-3">
            {t('settings.language')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {LOCALES.map((loc) => (
              <TouchableOpacity
                key={loc.code}
                onPress={() => setLocale(loc.code)}
                className={`px-4 py-2 rounded-xl border flex-row items-center gap-2 ${
                  locale === loc.code
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                accessibilityRole="button"
                accessibilityLabel={`Switch to ${loc.label}`}
                accessibilityState={{ selected: locale === loc.code }}
              >
                <Text accessible={false}>{loc.flag}</Text>
                <Text
                  className={`text-sm font-medium ${
                    locale === loc.code
                      ? 'text-primary-600 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {loc.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Button
          title={t('auth.logout')}
          variant="danger"
          onPress={handleLogout}
          className="mb-8"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
