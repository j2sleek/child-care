import React, { memo } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variantClasses = {
  primary: 'bg-primary-500 active:bg-primary-600 dark:bg-primary-600 dark:active:bg-primary-700',
  secondary: 'bg-secondary-500 active:bg-secondary-600',
  outline: 'border border-primary-500 bg-transparent dark:border-primary-400',
  ghost: 'bg-transparent',
  danger: 'bg-red-500 active:bg-red-600 dark:bg-red-600',
};

const textClasses = {
  primary: 'text-white font-semibold',
  secondary: 'text-white font-semibold',
  outline: 'text-primary-500 font-semibold dark:text-primary-400',
  ghost: 'text-primary-500 font-semibold dark:text-primary-400',
  danger: 'text-white font-semibold',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 rounded-lg',
  md: 'px-4 py-2.5 rounded-xl',
  lg: 'px-6 py-3.5 rounded-xl',
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export const Button = memo(function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  accessibilityLabel,
  ...props
}: ButtonProps) {
  return (
    <TouchableOpacity
      className={`items-center justify-center ${variantClasses[variant]} ${sizeClasses[size]} ${disabled || loading ? 'opacity-50' : ''} ${className ?? ''}`}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: disabled || loading }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? '#6366f1' : 'white'} />
      ) : (
        <Text className={`${textClasses[variant]} ${textSizeClasses[size]}`}>{title}</Text>
      )}
    </TouchableOpacity>
  );
});
