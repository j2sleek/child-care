import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { useGrowth, useCreateGrowthEntry, useDeleteGrowthEntry } from '../../../../src/hooks/useGrowth';
import { GrowthChart } from '../../../../src/components/GrowthChart';
import { Modal } from '../../../../src/components/ui/Modal';
import { Button } from '../../../../src/components/ui/Button';
import { Input } from '../../../../src/components/ui/Input';
import { Card } from '../../../../src/components/ui/Card';
import i18n from '../../../../src/lib/i18n';

type Metric = 'weightKg' | 'heightCm' | 'headCircumferenceCm';

export default function GrowthScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { data, isLoading, isRefetching, refetch } = useGrowth(childId);
  const createEntry = useCreateGrowthEntry(childId);
  const deleteEntry = useDeleteGrowthEntry(childId);

  const [showModal, setShowModal] = useState(false);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [head, setHead] = useState('');
  const [activeMetric, setActiveMetric] = useState<Metric>('weightKg');

  const handleCreate = () => {
    createEntry.mutate(
      {
        date,
        weightKg: weight ? parseFloat(weight) : undefined,
        heightCm: height ? parseFloat(height) : undefined,
        headCircumferenceCm: head ? parseFloat(head) : undefined,
      },
      {
        onSuccess: () => {
          setShowModal(false);
          setDate(format(new Date(), 'yyyy-MM-dd'));
          setWeight('');
          setHeight('');
          setHead('');
        },
        onError: (err: any) => {
          Alert.alert('Error', err?.response?.data?.message ?? 'Could not save entry');
        },
      }
    );
  };

  const handleDelete = (entryId: string) => {
    Alert.alert('Delete Entry', 'Remove this growth record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteEntry.mutate(entryId) },
    ]);
  };

  const entries = data?.entries ?? [];
  const METRICS: Metric[] = ['weightKg', 'heightCm', 'headCircumferenceCm'];

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-gray-950"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <View className="px-4 pt-4">
        <View className="flex-row gap-2 mb-4">
          {METRICS.map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setActiveMetric(m)}
              className={`flex-1 py-2 rounded-xl border items-center ${
                activeMetric === m
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              <Text className={`text-xs font-semibold ${activeMetric === m ? 'text-primary-600 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400'}`}>
                {m === 'weightKg' ? 'Weight' : m === 'heightCm' ? 'Height' : 'Head'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Card className="mb-4">
          <GrowthChart data={entries} metric={activeMetric} />
        </Card>

        <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Records</Text>
        {isLoading ? (
          <ActivityIndicator color="#6366f1" />
        ) : entries.length === 0 ? (
          <View className="items-center py-8">
            <Text className="text-4xl mb-2" accessible={false}>📏</Text>
            <Text className="text-gray-500 dark:text-gray-400">No growth records yet.</Text>
          </View>
        ) : (
          entries.slice().reverse().map((entry) => (
            <Card key={entry._id} className="mb-2">
              <View className="flex-row justify-between items-start">
                <View>
                  <Text className="font-semibold text-gray-900 dark:text-white">
                    {format(parseISO(entry.date), 'MMM d, yyyy')}
                  </Text>
                  <View className="flex-row gap-3 mt-1">
                    {entry.weightKg != null ? (
                      <Text className="text-sm text-gray-600 dark:text-gray-300">{entry.weightKg}kg</Text>
                    ) : null}
                    {entry.heightCm != null ? (
                      <Text className="text-sm text-gray-600 dark:text-gray-300">{entry.heightCm}cm</Text>
                    ) : null}
                    {entry.headCircumferenceCm != null ? (
                      <Text className="text-sm text-gray-600 dark:text-gray-300">HC: {entry.headCircumferenceCm}cm</Text>
                    ) : null}
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(entry._id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete growth entry for ${format(parseISO(entry.date), 'MMM d, yyyy')}`}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text className="text-red-400 dark:text-red-500 text-base">✕</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}

        <View className="mt-4 mb-8">
          <Button title={`+ ${i18n.t('growth.addEntry')}`} onPress={() => setShowModal(true)} size="lg" />
        </View>
      </View>

      <Modal title={i18n.t('growth.addEntry')} visible={showModal} onClose={() => setShowModal(false)}>
        <Input label={`${i18n.t('growth.date')} (YYYY-MM-DD)`} value={date} onChangeText={setDate} placeholder="2024-01-15" />
        <Input label={i18n.t('growth.weight')} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="7.5" />
        <Input label={i18n.t('growth.height')} value={height} onChangeText={setHeight} keyboardType="decimal-pad" placeholder="68" />
        <Input label={i18n.t('growth.headCircumference')} value={head} onChangeText={setHead} keyboardType="decimal-pad" placeholder="42" />
        <Button title={i18n.t('common.save')} onPress={handleCreate} loading={createEntry.isPending} className="mb-2" />
        <Button title={i18n.t('common.cancel')} variant="ghost" onPress={() => setShowModal(false)} />
      </Modal>
    </ScrollView>
  );
}
