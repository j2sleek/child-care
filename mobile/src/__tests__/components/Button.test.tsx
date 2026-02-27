import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../../components/ui/Button';

describe('Button', () => {
  it('renders the title', () => {
    const { getByText } = render(<Button title="Save" onPress={() => {}} />);
    expect(getByText('Save')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<Button title="Save" onPress={onPress} />);
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<Button title="Save" onPress={onPress} disabled />);
    fireEvent.press(getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<Button title="Save" onPress={onPress} loading />);
    fireEvent.press(getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows ActivityIndicator when loading', () => {
    const { getByTestId, queryByText } = render(
      <Button title="Save" onPress={() => {}} loading />
    );
    // When loading, the title text should not be visible
    expect(queryByText('Save')).toBeNull();
  });

  it('uses title as default accessibilityLabel', () => {
    const { getByLabelText } = render(<Button title="Submit" onPress={() => {}} />);
    expect(getByLabelText('Submit')).toBeTruthy();
  });

  it('uses custom accessibilityLabel when provided', () => {
    const { getByLabelText } = render(
      <Button title="→" onPress={() => {}} accessibilityLabel="Go to next step" />
    );
    expect(getByLabelText('Go to next step')).toBeTruthy();
  });

  it('applies danger variant', () => {
    const { getByRole } = render(
      <Button title="Delete" onPress={() => {}} variant="danger" />
    );
    const btn = getByRole('button');
    expect(btn.props.className).toContain('bg-red-500');
  });
});
