import React from 'react';
import { View, Text } from 'react-native';

interface AiChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

export function AiChatBubble({ role, content }: AiChatBubbleProps) {
  const isUser = role === 'user';
  return (
    <View
      className={`mb-3 max-w-[80%] ${isUser ? 'self-end' : 'self-start'}`}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${isUser ? 'You' : 'AI Assistant'}: ${content}`}
    >
      <View
        className={`rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-primary-500 rounded-br-sm'
            : 'bg-gray-100 dark:bg-gray-700 rounded-bl-sm'
        }`}
      >
        <Text
          className={`text-sm leading-relaxed ${
            isUser ? 'text-white' : 'text-gray-900 dark:text-gray-100'
          }`}
          selectable
        >
          {content}
        </Text>
      </View>
      <Text className="text-xs text-gray-400 dark:text-gray-500 mt-1 px-1">
        {isUser ? 'You' : 'AI Assistant'}
      </Text>
    </View>
  );
}
