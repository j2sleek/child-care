import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { z } from 'zod';
import { useChildren, useCreateChild } from '../../src/hooks/useChildren';
import { useChildStore } from '../../src/stores/child.store';
import { ChildCard } from '../../src/components/ChildCard';
import { Modal } from '../../src/components/ui/Modal';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { DatePicker } from '../../src/components/ui/DatePicker';
import { PlanBadge } from '../../src/components/PlanBadge';
import { useAuthStore } from '../../src/stores/auth.store';
import { useI18n } from '../../src/lib/i18n';

const createSchema = z.object({
  name: z.string().min(1, 'Name required'),
  gender: z.enum(['male', 'female', 'other']),
});

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { data: children, isLoading, isRefetching, refetch } = useChildren();
  const createChild = useCreateChild();
  const setSelectedChild = useChildStore((s) => s.setSelectedChild);
  const user = useAuthStore((s) => s.user);

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [dob, setDob] = useState(new Date(new Date().getFullYear() - 1, 0, 1));
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [nameError, setNameError] = useState('');

  const handleCreate = useCallback(() => {
    const result = createSchema.safeParse({ name, gender });
    if (!result.success) {
      setNameError(result.error.errors[0]?.message ?? 'Invalid input');
      return;
    }
    setNameError('');
    createChild.mutate(
      { name, dob: format(dob, 'yyyy-MM-dd'), gender },
      {
        onSuccess: () => {
          setShowModal(false);
          setName('');
          setDob(new Date(new Date().getFullYear() - 1, 0, 1));
          setGender('male');
        },
        onError: (err: any) => {
          Alert.alert('Error', err?.response?.data?.message ?? 'Could not add child');
        },
      }
    );
  }, [name, dob, gender, createChild]);

  const handleChildPress = useCallback(async (childId: string) => {
    await setSelectedChild(childId);
    router.push(`/(app)/child/${childId}`);
  }, [setSelectedChild, router]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <View className="px-6 pt-4 pb-2 flex-row justify-between items-center">
        <View>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('home.title')}
          </Text>
          {user?.name ? (
            <Text className="text-sm text-gray-500 dark:text-gray-400">Hello, {user.name} 👋</Text>
          ) : null}
        </View>
        <PlanBadge />
      </View>

      <ScrollView
        className="flex-1 px-6"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {isLoading ? null : children?.length === 0 ? (
          <View className="mt-20 items-center">
            <Text className="text-6xl mb-4" accessible={false}>👶</Text>
            <Text className="text-gray-500 dark:text-gray-400 text-center">
              {t('home.noChildren')}
            </Text>
          </View>
        ) : (
          <View className="mt-4">
            {children?.map((child) => (
              <ChildCard
                key={child._id}
                child={child}
                onPress={() => handleChildPress(child._id)}
              />
            ))}
          </View>
        )}
        <View className="h-6" />
      </ScrollView>

      <View className="px-6 pb-4">
        <Button
          title={`+ ${t('home.addChild')}`}
          onPress={() => setShowModal(true)}
          size="lg"
        />
      </View>

      <Modal
        title={t('home.addChild')}
        visible={showModal}
        onClose={() => setShowModal(false)}
      >
        <Input
          label={t('child.name')}
          value={name}
          onChangeText={setName}
          error={nameError}
          placeholder="Emma"
        />

        <DatePicker
          label={t('child.dob')}
          value={dob}
          onChange={setDob}
          mode="date"
          maximumDate={new Date()}
          minimumDate={new Date(new Date().getFullYear() - 18, 0, 1)}
        />

        <Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('child.gender')}
        </Text>
        <View className="flex-row gap-3 mb-4">
          {(['male', 'female', 'other'] as const).map((g) => (
            <TouchableOpacity
              key={g}
              onPress={() => setGender(g)}
              className={`flex-1 py-2 rounded-xl border items-center ${
                gender === g
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              accessibilityRole="button"
              accessibilityLabel={`Select gender: ${g}`}
              accessibilityState={{ selected: gender === g }}
            >
              <Text
                className={`capitalize text-sm font-medium ${
                  gender === g
                    ? 'text-primary-600 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {t(`child.${g}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Button
          title={t('common.save')}
          onPress={handleCreate}
          loading={createChild.isPending}
          className="mb-2"
        />
        <Button
          title={t('common.cancel')}
          variant="ghost"
          onPress={() => setShowModal(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}
