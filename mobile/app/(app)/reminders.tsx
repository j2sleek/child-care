import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';
import {
  useReminders,
  useCreateReminder,
  useUpdateReminder,
  useDeleteReminder,
} from '../../src/hooks/useReminders';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Card } from '../../src/components/ui/Card';
import { Modal } from '../../src/components/ui/Modal';
import { DatePicker } from '../../src/components/ui/DatePicker';
import { Badge } from '../../src/components/ui/Badge';
import { useI18n } from '../../src/lib/i18n';

export default function RemindersScreen() {
  const { t } = useI18n();
  const { data, isLoading, isRefetching, refetch } = useReminders();
  const createReminder = useCreateReminder();
  const updateReminder = useUpdateReminder();
  const deleteReminder = useDeleteReminder();

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState(new Date());
  const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly'>('none');

  const handleCreate = () => {
    if (!title.trim()) return;
    createReminder.mutate(
      { title, scheduledAt: scheduledAt.toISOString(), repeat },
      {
        onSuccess: () => {
          setShowModal(false);
          setTitle('');
          setScheduledAt(new Date());
          setRepeat('none');
        },
        onError: (err: any) => {
          Alert.alert('Error', err?.response?.data?.message ?? 'Could not create reminder');
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Reminder', 'Are you sure?', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => deleteReminder.mutate(id),
      },
    ]);
  };

  const toggleActive = (id: string, active: boolean) => {
    updateReminder.mutate({ id, data: { active: !active } });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <View className="px-6 pt-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('reminders.title')}
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-6"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {!data?.reminders?.length ? (
          <View className="mt-20 items-center">
            <Text className="text-5xl mb-4" accessible={false}>🔔</Text>
            <Text className="text-gray-500 dark:text-gray-400">{t('reminders.noReminders')}</Text>
          </View>
        ) : (
          <View className="mt-4">
            {data.reminders.map((r) => (
              <Card key={r._id} className="mb-3">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="font-semibold text-gray-900 dark:text-white">{r.title}</Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {format(parseISO(r.scheduledAt), 'MMM d, yyyy h:mm a')}
                    </Text>
                    {r.repeat !== 'none' ? (
                      <View className="mt-1">
                        <Badge label={r.repeat} variant="info" />
                      </View>
                    ) : null}
                  </View>
                  <View className="flex-row gap-2 items-center">
                    <TouchableOpacity
                      onPress={() => toggleActive(r._id, r.active)}
                      accessibilityRole="button"
                      accessibilityLabel={r.active ? 'Disable reminder' : 'Enable reminder'}
                      accessibilityState={{ checked: r.active }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text className={`text-xl ${r.active ? 'opacity-100' : 'opacity-30'}`} accessible={false}>
                        🔔
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(r._id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete reminder: ${r.title}`}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text className="text-red-400 dark:text-red-500 text-base" accessible={false}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
        <View className="h-6" />
      </ScrollView>

      <View className="px-6 pb-4">
        <Button
          title={`+ ${t('reminders.addReminder')}`}
          onPress={() => setShowModal(true)}
          size="lg"
        />
      </View>

      <Modal
        title={t('reminders.addReminder')}
        visible={showModal}
        onClose={() => setShowModal(false)}
      >
        <Input
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="Doctor appointment"
        />

        <DatePicker
          label={t('reminders.scheduledAt')}
          value={scheduledAt}
          onChange={setScheduledAt}
          mode="datetime"
          minimumDate={new Date()}
        />

        <Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('reminders.repeat')}
        </Text>
        <View className="flex-row gap-2 mb-4">
          {(['none', 'daily', 'weekly'] as const).map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setRepeat(r)}
              className={`flex-1 py-2 rounded-xl border items-center ${
                repeat === r
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              accessibilityRole="button"
              accessibilityLabel={`Repeat ${r}`}
              accessibilityState={{ selected: repeat === r }}
            >
              <Text
                className={`capitalize text-sm font-medium ${
                  repeat === r
                    ? 'text-primary-600 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {t(`reminders.${r}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Button
          title={t('common.save')}
          onPress={handleCreate}
          loading={createReminder.isPending}
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
