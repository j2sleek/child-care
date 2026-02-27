import React, { memo } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { differenceInMonths, differenceInYears, parseISO } from 'date-fns';
import { Child } from '../api/endpoints/children';

interface ChildCardProps {
  child: Child;
  onPress: () => void;
}

function getAge(dob: string): string {
  const birth = parseISO(dob);
  const years = differenceInYears(new Date(), birth);
  if (years >= 1) return `${years}y`;
  const months = differenceInMonths(new Date(), birth);
  return `${months}mo`;
}

export const ChildCard = memo(function ChildCard({ child, onPress }: ChildCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 shadow-sm flex-row items-center"
      accessibilityRole="button"
      accessibilityLabel={`Open ${child.name}'s profile, age ${getAge(child.dob)}`}
      activeOpacity={0.7}
    >
      {child.avatarUrl ? (
        <Image
          source={{ uri: child.avatarUrl }}
          className="w-14 h-14 rounded-full mr-4"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View
          className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900 items-center justify-center mr-4"
          accessible={false}
        >
          <Text className="text-2xl font-bold text-primary-500 dark:text-primary-300">
            {child.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900 dark:text-white">{child.name}</Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400">Age: {getAge(child.dob)}</Text>
        <Text className="text-xs text-gray-400 dark:text-gray-500 capitalize">{child.gender}</Text>
      </View>
      <Text className="text-gray-300 dark:text-gray-600 text-lg" accessible={false}>›</Text>
    </TouchableOpacity>
  );
});
