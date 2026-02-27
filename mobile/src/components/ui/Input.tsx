import React, { memo } from 'react';
import { TextInput, View, Text, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input = memo(function Input({ label, error, className, ...props }: InputProps) {
  return (
    <View className="mb-4">
      {label ? (
        <Text className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">{label}</Text>
      ) : null}
      <TextInput
        className={`rounded-xl border px-4 py-3 text-base text-gray-900 dark:text-white dark:bg-gray-800 ${
          error
            ? 'border-red-400 dark:border-red-500'
            : 'border-gray-300 dark:border-gray-600'
        } bg-white ${className ?? ''}`}
        placeholderTextColor="#9ca3af"
        accessibilityLabel={label}
        {...props}
      />
      {error ? (
        <Text className="mt-1 text-xs text-red-500 dark:text-red-400" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
});
