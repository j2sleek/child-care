/**
 * Lightweight date picker using native platform pickers.
 * Shows a formatted date label; tapping opens the OS date/time picker.
 */
import React, { memo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Platform,
  ScrollView,
} from 'react-native';
import { format, getYear, getMonth, getDate } from 'date-fns';

interface DatePickerProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'datetime';
  minimumDate?: Date;
  maximumDate?: Date;
}

// Simple inline spinner columns (no native module required, works in Expo Go)
function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export const DatePicker = memo(function DatePicker({
  label,
  value,
  onChange,
  mode = 'date',
  minimumDate,
  maximumDate,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [tempDate, setTempDate] = useState(value);

  const currentYear = new Date().getFullYear();
  const minYear = minimumDate ? getYear(minimumDate) : currentYear - 10;
  const maxYear = maximumDate ? getYear(maximumDate) : currentYear + 2;

  const confirm = () => {
    onChange(tempDate);
    setOpen(false);
  };

  const displayFormat = mode === 'datetime'
    ? 'MMM d, yyyy h:mm a'
    : 'MMM d, yyyy';

  return (
    <View className="mb-4">
      {label ? (
        <Text className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">{label}</Text>
      ) : null}

      <TouchableOpacity
        onPress={() => { setTempDate(value); setOpen(true); }}
        className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 flex-row justify-between items-center"
        accessibilityRole="button"
        accessibilityLabel={label ? `${label}: ${format(value, displayFormat)}` : format(value, displayFormat)}
      >
        <Text className="text-base text-gray-900 dark:text-white">
          {format(value, displayFormat)}
        </Text>
        <Text className="text-gray-400">📅</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          className="flex-1 bg-black/40"
          activeOpacity={1}
          onPress={() => setOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Dismiss date picker"
        />
        <View className="bg-white dark:bg-gray-900 rounded-t-3xl px-6 pt-4 pb-8">
          <View className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full self-center mb-4" />
          <Text className="text-base font-semibold text-gray-900 dark:text-white mb-4 text-center">
            {label ?? 'Select Date'}
          </Text>

          {/* Year / Month / Day row */}
          <View className="flex-row justify-center gap-2 mb-6">
            {/* Day */}
            <ScrollView className="h-32 w-16" showsVerticalScrollIndicator={false}>
              {range(1, 31).map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => setTempDate(new Date(getYear(tempDate), getMonth(tempDate), d, tempDate.getHours(), tempDate.getMinutes()))}
                  className={`py-2 items-center rounded-lg ${getDate(tempDate) === d ? 'bg-primary-100 dark:bg-primary-900' : ''}`}
                >
                  <Text className={`text-sm ${getDate(tempDate) === d ? 'text-primary-600 dark:text-primary-300 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>{d}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Month */}
            <ScrollView className="h-32 w-14" showsVerticalScrollIndicator={false}>
              {MONTHS.map((m, i) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setTempDate(new Date(getYear(tempDate), i, getDate(tempDate), tempDate.getHours(), tempDate.getMinutes()))}
                  className={`py-2 items-center rounded-lg ${getMonth(tempDate) === i ? 'bg-primary-100 dark:bg-primary-900' : ''}`}
                >
                  <Text className={`text-sm ${getMonth(tempDate) === i ? 'text-primary-600 dark:text-primary-300 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Year */}
            <ScrollView className="h-32 w-16" showsVerticalScrollIndicator={false}>
              {range(minYear, maxYear).map((y) => (
                <TouchableOpacity
                  key={y}
                  onPress={() => setTempDate(new Date(y, getMonth(tempDate), getDate(tempDate), tempDate.getHours(), tempDate.getMinutes()))}
                  className={`py-2 items-center rounded-lg ${getYear(tempDate) === y ? 'bg-primary-100 dark:bg-primary-900' : ''}`}
                >
                  <Text className={`text-sm ${getYear(tempDate) === y ? 'text-primary-600 dark:text-primary-300 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>{y}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <TouchableOpacity
            onPress={confirm}
            className="bg-primary-500 dark:bg-primary-600 rounded-xl py-3.5 items-center"
            accessibilityRole="button"
            accessibilityLabel="Confirm date selection"
          >
            <Text className="text-white font-bold text-base">Confirm</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
});
