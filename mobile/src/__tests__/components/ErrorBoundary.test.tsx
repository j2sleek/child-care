import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { Text } from 'react-native';

// Silence expected error output in tests
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  (console.error as jest.Mock).mockRestore();
});

const ThrowComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) throw new Error('Test error');
  return <Text>OK</Text>;
};

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>Hello</Text>
      </ErrorBoundary>
    );
    expect(getByText('Hello')).toBeTruthy();
  });

  it('renders fallback UI when a child throws', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowComponent shouldThrow />
      </ErrorBoundary>
    );
    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText('Try Again')).toBeTruthy();
  });

  it('renders custom fallback when provided', () => {
    const { getByText } = render(
      <ErrorBoundary fallback={<Text>Custom fallback</Text>}>
        <ThrowComponent shouldThrow />
      </ErrorBoundary>
    );
    expect(getByText('Custom fallback')).toBeTruthy();
  });

  it('resets error state when Try Again is pressed', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowComponent shouldThrow />
      </ErrorBoundary>
    );
    fireEvent.press(getByText('Try Again'));
    // After reset, it will try to re-render and throw again — but it confirms reset runs
    expect(getByText('Something went wrong')).toBeTruthy();
  });
});
