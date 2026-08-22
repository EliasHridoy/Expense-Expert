import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DateSelector } from '../../../src/features/expenses/components/DateSelector';
import { toDateInputValue } from '../../../src/features/expenses/utils/date.util';

describe('DateSelector', () => {
  it('renders date label, input value, and formatted date display', () => {
    const onChange = jest.fn();
    const { getByTestId, getByText } = render(
      <DateSelector value="2026-08-23" onChange={onChange} />
    );

    expect(getByText('Date')).toBeTruthy();
    expect(getByTestId('date-selector-input').props.value).toBe('2026-08-23');
  });

  it('updates date when typing in the input', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <DateSelector value="2026-08-23" onChange={onChange} />
    );

    fireEvent.changeText(getByTestId('date-selector-input'), '2026-08-20');
    expect(onChange).toHaveBeenCalledWith('2026-08-20');
  });

  it('updates date to today when Today button is pressed', () => {
    const onChange = jest.fn();
    const todayStr = toDateInputValue(new Date());

    const { getByTestId } = render(
      <DateSelector value="2026-01-01" onChange={onChange} />
    );

    fireEvent.press(getByTestId('date-selector-today-btn'));
    expect(onChange).toHaveBeenCalledWith(todayStr);
  });

  it('updates date to yesterday when Yesterday button is pressed', () => {
    const onChange = jest.fn();
    const yesterdayStr = toDateInputValue(new Date(Date.now() - 86400000));

    const { getByTestId } = render(
      <DateSelector value="2026-01-01" onChange={onChange} />
    );

    fireEvent.press(getByTestId('date-selector-yesterday-btn'));
    expect(onChange).toHaveBeenCalledWith(yesterdayStr);
  });
});
