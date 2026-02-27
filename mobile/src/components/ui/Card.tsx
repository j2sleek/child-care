import React, { memo } from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  padding?: 'sm' | 'md' | 'lg';
}

const paddingClasses = { sm: 'p-3', md: 'p-4', lg: 'p-6' };

export const Card = memo(function Card({ children, padding = 'md', className, ...props }: CardProps) {
  return (
    <View
      className={`rounded-2xl bg-white dark:bg-gray-800 shadow-sm dark:shadow-none ${paddingClasses[padding]} ${className ?? ''}`}
      {...props}
    >
      {children}
    </View>
  );
});
