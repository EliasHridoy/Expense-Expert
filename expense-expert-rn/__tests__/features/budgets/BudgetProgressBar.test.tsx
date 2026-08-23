import React from 'react';
import { render } from '@testing-library/react-native';
import { BudgetProgressBar } from '../../../src/features/budgets/components/BudgetProgressBar';

describe('BudgetProgressBar', () => {
  it('renders green progress bar for under state (< 80%)', () => {
    const { getByTestId, getByText } = render(
      <BudgetProgressBar percentage={45} thresholdState="under" showLabel />
    );

    expect(getByTestId('budget-progress-bar')).toBeTruthy();
    expect(getByText('Under Budget')).toBeTruthy();
    expect(getByText('45.0%')).toBeTruthy();

    const fill = getByTestId('budget-progress-bar-fill');
    expect(fill.props.style.width).toBe('45%');
    expect(fill.props.className).toContain('bg-emerald-500');
  });

  it('renders amber progress bar for warning state (80% - 99%)', () => {
    const { getByTestId, getByText } = render(
      <BudgetProgressBar percentage={85.5} thresholdState="warning" showLabel />
    );

    expect(getByText('Near Limit')).toBeTruthy();
    expect(getByText('85.5%')).toBeTruthy();

    const fill = getByTestId('budget-progress-bar-fill');
    expect(fill.props.style.width).toBe('85.5%');
    expect(fill.props.className).toContain('bg-amber-500');
  });

  it('renders rose progress bar and clamps width to 100% when exceeded (>= 100%)', () => {
    const { getByTestId, getByText } = render(
      <BudgetProgressBar percentage={135.2} thresholdState="exceeded" showLabel />
    );

    expect(getByText('Over Budget')).toBeTruthy();
    expect(getByText('135.2%')).toBeTruthy();

    const fill = getByTestId('budget-progress-bar-fill');
    expect(fill.props.style.width).toBe('100%'); // Clamped to 100%
    expect(fill.props.className).toContain('bg-rose-500');
  });

  it('clamps negative percentages to 0%', () => {
    const { getByTestId } = render(<BudgetProgressBar percentage={-15} />);
    const fill = getByTestId('budget-progress-bar-fill');
    expect(fill.props.style.width).toBe('0%');
  });

  it('infers threshold state automatically when not explicitly provided', () => {
    const { getByText: getUnderText } = render(
      <BudgetProgressBar percentage={50} showLabel />
    );
    expect(getUnderText('Under Budget')).toBeTruthy();

    const { getByText: getWarnText } = render(
      <BudgetProgressBar percentage={88} showLabel />
    );
    expect(getWarnText('Near Limit')).toBeTruthy();

    const { getByText: getOverText } = render(
      <BudgetProgressBar percentage={105} showLabel />
    );
    expect(getOverText('Over Budget')).toBeTruthy();
  });

  it('includes accessibility attributes on track', () => {
    const { getByTestId } = render(
      <BudgetProgressBar percentage={75.4} thresholdState="under" />
    );
    const track = getByTestId('budget-progress-bar-track');
    expect(track.props.accessibilityRole).toBe('progressbar');
    expect(track.props.accessibilityValue).toEqual({
      min: 0,
      max: 100,
      now: 75,
    });
  });
});
