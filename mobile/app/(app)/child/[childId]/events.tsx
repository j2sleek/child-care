import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { useEvents, useCreateEvent, useDeleteEvent } from '../../../../src/hooks/useEvents';
import { EventListItem } from '../../../../src/components/EventListItem';
import { Modal } from '../../../../src/components/ui/Modal';
import { Button } from '../../../../src/components/ui/Button';
import { Input } from '../../../../src/components/ui/Input';
import { DatePicker } from '../../../../src/components/ui/DatePicker';
import { EventType, CareEvent } from '../../../../src/api/endpoints/events';
import { useI18n } from '../../../../src/lib/i18n';

const EVENT_TYPES: { type: EventType; emoji: string }[] = [
  { type: 'sleep', emoji: '😴' },
  { type: 'feed', emoji: '🍼' },
  { type: 'diaper', emoji: '🧷' },
  { type: 'mood', emoji: '😊' },
];

export default function EventsScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { t } = useI18n();
  const { data, isLoading, isRefetching, refetch } = useEvents(childId, { limit: 50 });
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent(childId);

  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState<EventType>('sleep');
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');

  const handleCreate = useCallback(() => {
    createEvent.mutate(
      {
        childId,
        type: selectedType,
        startTime: startTime.toISOString(),
        endTime: endTime?.toISOString(),
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          setShowModal(false);
          setNotes('');
          setEndTime(null);
          setStartTime(new Date());
        },
        onError: (err: any) => {
          Alert.alert('Error', err?.response?.data?.message ?? 'Could not log event');
        },
      }
    );
  }, [childId, selectedType, startTime, endTime, notes, createEvent]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Delete Event', 'Remove this event?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteEvent.mutate(id) },
    ]);
  }, [deleteEvent]);

  // Group events by date — memoized so it only recalculates when data changes
  const sections = useMemo(() => {
    const grouped: Record<string, CareEvent[]> = {};
    for (const event of data?.events ?? []) {
      const dateKey = format(parseISO(event.startTime), 'EEEE, MMM d');
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(event);
    }
    return Object.entries(grouped);
  }, [data?.events]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <FlatList
        data={sections}
        keyExtractor={([date]) => date}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        ListEmptyComponent={
          <View className="mt-20 items-center">
            <Text className="text-5xl mb-4" accessible={false}>📋</Text>
            <Text className="text-gray-500 dark:text-gray-400">{t('events.noEvents')}</Text>
          </View>
        }
        renderItem={({ item: [date, events] }) => (
          <View className="mb-4">
            <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-2">
              {date}
            </Text>
            {events.map((event) => (
              <EventListItem key={event._id} event={event} onDelete={handleDelete} />
            ))}
          </View>
        )}
      />

      <View className="absolute bottom-0 left-0 right-0 px-4 pb-4 bg-gray-50 dark:bg-gray-950 pt-2 border-t border-gray-100 dark:border-gray-800">
        <Button
          title={`+ ${t('events.logEvent')}`}
          onPress={() => setShowModal(true)}
          size="lg"
        />
      </View>

      <Modal title={t('events.logEvent')} visible={showModal} onClose={() => setShowModal(false)}>
        <Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Event type
        </Text>
        <View className="flex-row gap-2 mb-4">
          {EVENT_TYPES.map(({ type, emoji }) => (
            <TouchableOpacity
              key={type}
              onPress={() => setSelectedType(type)}
              className={`flex-1 py-3 rounded-xl border items-center ${
                selectedType === type
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              accessibilityRole="button"
              accessibilityLabel={`Select ${type} event type`}
              accessibilityState={{ selected: selectedType === type }}
            >
              <Text className="text-xl" accessible={false}>{emoji}</Text>
              <Text
                className={`text-xs mt-1 font-medium capitalize ${
                  selectedType === type
                    ? 'text-primary-600 dark:text-primary-300'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {t(`events.${type}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <DatePicker
          label={t('events.startTime')}
          value={startTime}
          onChange={setStartTime}
          mode="datetime"
          maximumDate={new Date()}
        />

        <DatePicker
          label={`${t('events.endTime')} (optional)`}
          value={endTime ?? startTime}
          onChange={(d) => setEndTime(d)}
          mode="datetime"
          minimumDate={startTime}
          maximumDate={new Date()}
        />

        <Input
          label={t('events.notes')}
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional notes…"
          multiline
          numberOfLines={3}
        />
        <Button
          title={t('common.save')}
          onPress={handleCreate}
          loading={createEvent.isPending}
          className="mb-2"
        />
        <Button
          title={t('common.cancel')}
          variant="ghost"
          onPress={() => setShowModal(false)}
        />
      </Modal>
    </View>
  );
}
