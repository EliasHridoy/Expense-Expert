import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DateRangePicker } from '../../../src/features/expenses/components/DateRangePicker';
import { DateRangeModal } from '../../../src/features/expenses/components/DateRangeModal';

describe('DateRangePicker & DateRangeModal', () => {
  const mockOnSelectPreset = jest.fn();
  const mockOnCustomDateChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DateRangePicker Component', () => {
    it('renders all date range preset buttons', () => {
      const { getByTestId, getByText } = render(
        <DateRangePicker
          selectedPreset="all"
          onSelectPreset={mockOnSelectPreset}
        />
      );

      expect(getByTestId('date-preset-all')).toBeTruthy();
      expect(getByText('All Time')).toBeTruthy();
      expect(getByTestId('date-preset-today')).toBeTruthy();
      expect(getByText('Today')).toBeTruthy();
      expect(getByTestId('date-preset-week')).toBeTruthy();
      expect(getByText('This Week')).toBeTruthy();
      expect(getByTestId('date-preset-month')).toBeTruthy();
      expect(getByText('This Month')).toBeTruthy();
      expect(getByTestId('date-preset-custom')).toBeTruthy();
      expect(getByText('Custom')).toBeTruthy();
    });

    it('triggers onSelectPreset when a preset is pressed', () => {
      const { getByTestId } = render(
        <DateRangePicker
          selectedPreset="all"
          onSelectPreset={mockOnSelectPreset}
        />
      );

      fireEvent.press(getByTestId('date-preset-today'));
      expect(mockOnSelectPreset).toHaveBeenCalledWith('today');

      fireEvent.press(getByTestId('date-preset-month'));
      expect(mockOnSelectPreset).toHaveBeenCalledWith('month');
    });

    it('displays custom range text when custom preset is selected with dates', () => {
      const { getByText } = render(
        <DateRangePicker
          selectedPreset="custom"
          onSelectPreset={mockOnSelectPreset}
          startDate="2026-08-01"
          endDate="2026-08-15"
        />
      );

      expect(getByText('2026-08-01 → 2026-08-15')).toBeTruthy();
    });
  });

  describe('DateRangeModal Component', () => {
    const mockOnApply = jest.fn();
    const mockOnClose = jest.fn();

    it('renders modal with inputs when visible is true', () => {
      const { getByTestId, getByText } = render(
        <DateRangeModal
          visible={true}
          startDate="2026-08-01"
          endDate="2026-08-15"
          onApply={mockOnApply}
          onClose={mockOnClose}
        />
      );

      expect(getByTestId('custom-start-date-input')).toBeTruthy();
      expect(getByTestId('custom-end-date-input')).toBeTruthy();
      expect(getByTestId('apply-date-range-button')).toBeTruthy();
      expect(getByText('Custom Date Range')).toBeTruthy();
    });

    it('applies custom dates on submit', () => {
      const { getByTestId } = render(
        <DateRangeModal
          visible={true}
          startDate=""
          endDate=""
          onApply={mockOnApply}
          onClose={mockOnClose}
        />
      );

      fireEvent.changeText(getByTestId('custom-start-date-input'), '2026-08-05');
      fireEvent.changeText(getByTestId('custom-end-date-input'), '2026-08-20');
      fireEvent.press(getByTestId('apply-date-range-button'));

      expect(mockOnApply).toHaveBeenCalledWith('2026-08-05', '2026-08-20');
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('shows error if start date is after end date', () => {
      const { getByTestId, getByText } = render(
        <DateRangeModal
          visible={true}
          startDate="2026-08-25"
          endDate="2026-08-10"
          onApply={mockOnApply}
          onClose={mockOnClose}
        />
      );

      fireEvent.press(getByTestId('apply-date-range-button'));
      expect(getByText('Start date cannot be after end date')).toBeTruthy();
      expect(mockOnApply).not.toHaveBeenCalled();
    });

    it('updates inputs when quick preset button is clicked', () => {
      const { getByTestId } = render(
        <DateRangeModal
          visible={true}
          onApply={mockOnApply}
          onClose={mockOnClose}
        />
      );

      fireEvent.press(getByTestId('quick-preset-thisMonth'));
      const startInput = getByTestId('custom-start-date-input');
      expect(startInput.props.value).toMatch(/^\d{4}-\d{2}-01$/);
    });
  });
});
