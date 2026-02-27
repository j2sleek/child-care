import React from 'react';
import { View, Text } from 'react-native';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'pro';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100',
  success: 'bg-green-100',
  warning: 'bg-yellow-100',
  danger: 'bg-red-100',
  info: 'bg-blue-100',
  pro: 'bg-primary-100',
};

const textVariantClasses: Record<BadgeVariant, string> = {
  default: 'text-gray-700',
  success: 'text-green-700',
  warning: 'text-yellow-700',
  danger: 'text-red-700',
  info: 'text-blue-700',
  pro: 'text-primary-700',
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  return (
    <View className={`rounded-full px-2.5 py-0.5 self-start ${variantClasses[variant]}`}>
      <Text className={`text-xs font-semibold ${textVariantClasses[variant]}`}>{label}</Text>
    </View>
  );
}
