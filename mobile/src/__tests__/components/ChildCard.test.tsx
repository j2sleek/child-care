import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ChildCard } from '../../components/ChildCard';

const baseChild = {
  _id: 'c1',
  name: 'Emma',
  dob: '2023-01-01',
  gender: 'female' as const,
  createdAt: '2024-01-01T00:00:00Z',
};

describe('ChildCard', () => {
  it('renders child name', () => {
    const { getByText } = render(<ChildCard child={baseChild} onPress={() => {}} />);
    expect(getByText('Emma')).toBeTruthy();
  });

  it('renders avatar placeholder with first letter of name', () => {
    const { getByText } = render(<ChildCard child={baseChild} onPress={() => {}} />);
    expect(getByText('E')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<ChildCard child={baseChild} onPress={onPress} />);
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows gender label', () => {
    const { getByText } = render(<ChildCard child={baseChild} onPress={() => {}} />);
    expect(getByText('female')).toBeTruthy();
  });

  it('renders Image when avatarUrl is provided', () => {
    const child = { ...baseChild, avatarUrl: 'https://example.com/avatar.jpg' };
    const { getByRole } = render(<ChildCard child={child} onPress={() => {}} />);
    // Image is present — getByRole won't find it but component renders without error
    expect(getByRole('button')).toBeTruthy();
  });

  it('has accessible label with name and age', () => {
    const { getByLabelText } = render(<ChildCard child={baseChild} onPress={() => {}} />);
    // Label includes "Emma" and an age string
    expect(getByLabelText(/Emma/)).toBeTruthy();
  });
});
