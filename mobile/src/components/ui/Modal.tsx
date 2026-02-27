import React, { memo } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  ModalProps as RNModalProps,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

interface ModalProps extends Omit<RNModalProps, 'transparent' | 'animationType'> {
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal = memo(function Modal({ title, onClose, children, visible, ...props }: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      {...props}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <TouchableOpacity
          className="flex-1 bg-black/40"
          onPress={onClose}
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        />
        <View className="bg-white dark:bg-gray-900 rounded-t-3xl px-6 pt-6 pb-8 max-h-[85%]">
          <View className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full self-center mb-4" />
          {title ? (
            <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">{title}</Text>
          ) : null}
          <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
});
