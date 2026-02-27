import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '../../components/ui/Input';

describe('Input', () => {
  it('renders without label', () => {
    const { getByDisplayValue } = render(
      <Input value="hello" onChangeText={() => {}} />
    );
    expect(getByDisplayValue('hello')).toBeTruthy();
  });

  it('renders with label', () => {
    const { getByText } = render(
      <Input label="Email" value="" onChangeText={() => {}} />
    );
    expect(getByText('Email')).toBeTruthy();
  });

  it('renders error message', () => {
    const { getByText } = render(
      <Input label="Email" value="" onChangeText={() => {}} error="Invalid email" />
    );
    expect(getByText('Invalid email')).toBeTruthy();
  });

  it('does not render error when error is undefined', () => {
    const { queryByText } = render(
      <Input label="Email" value="" onChangeText={() => {}} />
    );
    expect(queryByText(/invalid/i)).toBeNull();
  });

  it('calls onChangeText when typing', () => {
    const onChange = jest.fn();
    const { getByDisplayValue } = render(
      <Input value="abc" onChangeText={onChange} />
    );
    fireEvent.changeText(getByDisplayValue('abc'), 'abcd');
    expect(onChange).toHaveBeenCalledWith('abcd');
  });

  it('has accessibilityLabel from label prop', () => {
    const { getByLabelText } = render(
      <Input label="Password" value="" onChangeText={() => {}} />
    );
    expect(getByLabelText('Password')).toBeTruthy();
  });
});
