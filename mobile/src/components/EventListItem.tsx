import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { CareEvent, EventType } from '../api/endpoints/events';

const eventIcons: Record<EventType, string> = {
  sleep: '😴',
  feed: '🍼',
  diaper: '🧷',
  mood: '😊',
};

const eventBg: Record<EventType, string> = {
  sleep: 'bg-indigo-100 dark:bg-indigo-900',
  feed: 'bg-green-100 dark:bg-green-900',
  diaper: 'bg-yellow-100 dark:bg-yellow-900',
  mood: 'bg-pink-100 dark:bg-pink-900',
};

interface EventListItemProps {
  event: CareEvent;
  onDelete: (id: string) => void;
}

export const EventListItem = memo(function EventListItem({ event, onDelete }: EventListItemProps) {
  const duration =
    event.endTime
      ? `${differenceInMinutes(parseISO(event.endTime), parseISO(event.startTime))}min`
      : null;

  return (
    <View className="flex-row items-center bg-white dark:bg-gray-800 rounded-xl px-4 py-3 mb-2 shadow-sm">
      <View
        className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${eventBg[event.type]}`}
        accessible={false}
      >
        <Text className="text-xl">{eventIcons[event.type]}</Text>
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-gray-900 dark:text-white capitalize">{event.type}</Text>
        <Text className="text-xs text-gray-500 dark:text-gray-400">
          {format(parseISO(event.startTime), 'h:mm a')}
          {duration ? ` · ${duration}` : ''}
        </Text>
        {event.notes ? (
          <Text className="text-xs text-gray-400 dark:text-gray-500 mt-0.5" numberOfLines={1}>
            {event.notes}
          </Text>
        ) : null}
      </View>
      <TouchableOpacity
        onPress={() => onDelete(event._id)}
        className="p-2"
        accessibilityRole="button"
        accessibilityLabel={`Delete ${event.type} event`}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text className="text-red-400 dark:text-red-500 text-lg" accessible={false}>✕</Text>
      </TouchableOpacity>
    </View>
  );
});
