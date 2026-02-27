import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production, send to crash reporting (e.g., Sentry)
    if (__DEV__) {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950 px-6">
          <Text className="text-5xl mb-4">⚠️</Text>
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-center">
            Something went wrong
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
            An unexpected error occurred. Please try again.
          </Text>
          {__DEV__ && this.state.error ? (
            <ScrollView className="bg-red-50 rounded-xl p-3 mb-4 max-h-40 w-full">
              <Text className="text-xs text-red-700 font-mono">{this.state.error.message}</Text>
            </ScrollView>
          ) : null}
          <TouchableOpacity
            onPress={this.reset}
            className="bg-primary-500 px-6 py-3 rounded-xl"
            accessibilityRole="button"
            accessibilityLabel="Retry"
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
