import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { format } from 'date-fns';
import { MonthNavigator } from '../../../src/features/dashboard/components/MonthNavigator';
import { ActionShortcuts } from '../../../src/features/dashboard/components/ActionShortcuts';

describe('MonthNavigator', () => {
  const currentMonth = format(new Date(), 'yyyy-MM');

  it('renders localized month name and year display', () => {
    const onChangeMonth = jest.fn();
    const { getByTestId } = render(
      <MonthNavigator activeMonth="2026-08" onChangeMonth={onChangeMonth} />
    );

    expect(getByTestId('month-title-text')).toHaveTextContent('August 2026');
  });

  it('steps to preceding month when Previous button is clicked', () => {
    const onChangeMonth = jest.fn();
    const { getByTestId } = render(
      <MonthNavigator activeMonth="2026-08" onChangeMonth={onChangeMonth} />
    );

    fireEvent.press(getByTestId('month-prev-btn'));
    expect(onChangeMonth).toHaveBeenCalledWith('2026-07');
  });

  it('steps to subsequent month when Next button is clicked', () => {
    const onChangeMonth = jest.fn();
    const { getByTestId } = render(
      <MonthNavigator activeMonth="2026-08" onChangeMonth={onChangeMonth} />
    );

    fireEvent.press(getByTestId('month-next-btn'));
    expect(onChangeMonth).toHaveBeenCalledWith('2026-09');
  });

  it('handles year boundary rollover correctly', () => {
    const onChangeMonth = jest.fn();
    const { getByTestId, rerender } = render(
      <MonthNavigator activeMonth="2026-01" onChangeMonth={onChangeMonth} />
    );

    fireEvent.press(getByTestId('month-prev-btn'));
    expect(onChangeMonth).toHaveBeenCalledWith('2025-12');

    rerender(
      <MonthNavigator activeMonth="2026-12" onChangeMonth={onChangeMonth} />
    );
    fireEvent.press(getByTestId('month-next-btn'));
    expect(onChangeMonth).toHaveBeenCalledWith('2027-01');
  });

  it('renders Current Month reset button when activeMonth is different from current date', () => {
    const onChangeMonth = jest.fn();
    const pastMonth = '2020-01';
    const { getByTestId } = render(
      <MonthNavigator activeMonth={pastMonth} onChangeMonth={onChangeMonth} />
    );

    const resetBtn = getByTestId('month-current-reset-btn');
    expect(resetBtn).toBeTruthy();

    fireEvent.press(resetBtn);
    expect(onChangeMonth).toHaveBeenCalledWith(currentMonth);
  });

  it('hides Current Month reset button when activeMonth is the current month', () => {
    const onChangeMonth = jest.fn();
    const { queryByTestId } = render(
      <MonthNavigator activeMonth={currentMonth} onChangeMonth={onChangeMonth} />
    );

    expect(queryByTestId('month-current-reset-btn')).toBeNull();
  });

  it('respects minMonth and maxMonth boundary constraints', () => {
    const onChangeMonth = jest.fn();
    const { getByTestId, rerender } = render(
      <MonthNavigator
        activeMonth="2026-03"
        minMonth="2026-03"
        maxMonth="2026-05"
        onChangeMonth={onChangeMonth}
      />
    );

    // Prev should be disabled
    fireEvent.press(getByTestId('month-prev-btn'));
    expect(onChangeMonth).not.toHaveBeenCalled();

    // Next should be enabled
    fireEvent.press(getByTestId('month-next-btn'));
    expect(onChangeMonth).toHaveBeenCalledWith('2026-04');

    // Rerender at max month
    onChangeMonth.mockClear();
    rerender(
      <MonthNavigator
        activeMonth="2026-05"
        minMonth="2026-03"
        maxMonth="2026-05"
        onChangeMonth={onChangeMonth}
      />
    );

    fireEvent.press(getByTestId('month-next-btn'));
    expect(onChangeMonth).not.toHaveBeenCalled();
  });
});

describe('ActionShortcuts', () => {
  it('renders shortcut buttons and triggers corresponding navigation callbacks', () => {
    const onAddExpense = jest.fn();
    const onNavigateBudgets = jest.fn();
    const onNavigateCategories = jest.fn();

    const { getByTestId } = render(
      <ActionShortcuts
        onAddExpense={onAddExpense}
        onNavigateBudgets={onNavigateBudgets}
        onNavigateCategories={onNavigateCategories}
      />
    );

    fireEvent.press(getByTestId('quick-add-expense-btn'));
    expect(onAddExpense).toHaveBeenCalledTimes(1);

    fireEvent.press(getByTestId('nav-budgets-btn'));
    expect(onNavigateBudgets).toHaveBeenCalledTimes(1);

    fireEvent.press(getByTestId('nav-categories-btn'));
    expect(onNavigateCategories).toHaveBeenCalledTimes(1);
  });
});
