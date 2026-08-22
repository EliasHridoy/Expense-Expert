import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AmountInput } from '../../../src/features/expenses/components/AmountInput';

describe('AmountInput', () => {
  it('renders correctly with label and initial value', () => {
    const onChangeText = jest.fn();
    const { getByText, getByTestId } = render(
      <AmountInput value="25.50" onChangeText={onChangeText} />
    );

    expect(getByText(/amount/i)).toBeTruthy();
    expect(getByText('$')).toBeTruthy();
    const input = getByTestId('amount-input');
    expect(input.props.value).toBe('25.50');
  });

  it('sanitizes input characters and restricts to 2 decimal places', () => {
    const onChangeText = jest.fn();
    const { getByTestId } = render(
      <AmountInput value="" onChangeText={onChangeText} />
    );

    const input = getByTestId('amount-input');

    // Letters and symbols stripped
    fireEvent.changeText(input, 'abc12.34xyz');
    expect(onChangeText).toHaveBeenCalledWith('12.34');

    // Multiple decimal points stripped
    fireEvent.changeText(input, '12.34.56');
    expect(onChangeText).toHaveBeenCalledWith('12.3456');

    // Decimal places restricted to 2
    fireEvent.changeText(input, '12.3499');
    expect(onChangeText).toHaveBeenCalledWith('12.34');
  });

  it('renders error message when error prop is supplied', () => {
    const onChangeText = jest.fn();
    const { getByTestId, getByText } = render(
      <AmountInput
        value=""
        onChangeText={onChangeText}
        error="Amount is required"
      />
    );

    expect(getByTestId('amount-input-error')).toBeTruthy();
    expect(getByText('Amount is required')).toBeTruthy();
  });
});
