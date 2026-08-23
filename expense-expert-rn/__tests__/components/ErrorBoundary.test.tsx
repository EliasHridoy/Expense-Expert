import React, { useState } from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, View, Button } from 'react-native';
import { ErrorBoundary } from '../../src/core/components/ErrorBoundary';

const ProblemChild: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test crash in ProblemChild');
  }
  return <Text testID="healthy-child">All systems normal</Text>;
};

describe('ErrorBoundary', () => {
  // Suppress console.error in tests for expected boundary catches
  const originalConsoleError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalConsoleError;
  });

  it('renders children normally when there is no error', () => {
    const { getByTestId, queryByTestId } = render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(getByTestId('healthy-child')).toBeTruthy();
    expect(queryByTestId('error-boundary-fallback')).toBeNull();
  });

  it('catches render errors and renders default ErrorFallback UI', () => {
    const onErrorMock = jest.fn();

    const { getByTestId, getByText } = render(
      <ErrorBoundary onError={onErrorMock}>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByTestId('error-boundary-fallback')).toBeTruthy();
    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText('Test crash in ProblemChild')).toBeTruthy();
    expect(getByTestId('error-boundary-retry-button')).toBeTruthy();
    expect(onErrorMock).toHaveBeenCalledTimes(1);
    expect(onErrorMock.mock.calls[0][0].message).toBe('Test crash in ProblemChild');
  });

  it('resets error state when "Try Again" button is pressed', () => {
    const TestComponent = () => {
      const [explode, setExplode] = useState(true);

      return (
        <ErrorBoundary onReset={() => setExplode(false)}>
          <ProblemChild shouldThrow={explode} />
        </ErrorBoundary>
      );
    };

    const { getByTestId, queryByTestId } = render(<TestComponent />);

    // Initially caught error
    expect(getByTestId('error-boundary-fallback')).toBeTruthy();
    expect(queryByTestId('healthy-child')).toBeNull();

    // Click retry
    fireEvent.press(getByTestId('error-boundary-retry-button'));

    // Should re-render healthy child
    expect(getByTestId('healthy-child')).toBeTruthy();
    expect(queryByTestId('error-boundary-fallback')).toBeNull();
  });

  it('supports custom fallback ReactNode', () => {
    const customFallback = <Text testID="custom-fallback">Custom Crash View</Text>;

    const { getByTestId, queryByTestId } = render(
      <ErrorBoundary fallback={customFallback}>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByTestId('custom-fallback')).toBeTruthy();
    expect(queryByTestId('error-boundary-fallback')).toBeNull();
  });

  it('supports custom fallback render function with reset capability', () => {
    const FallbackFn = ({ error, resetErrorBoundary }: { error: Error | null; resetErrorBoundary: () => void }) => (
      <View testID="custom-fn-fallback">
        <Text testID="custom-error-msg">{error?.message}</Text>
        <Button testID="custom-retry-btn" title="Retry Custom" onPress={resetErrorBoundary} />
      </View>
    );

    const onResetMock = jest.fn();

    const { getByTestId } = render(
      <ErrorBoundary fallback={FallbackFn} onReset={onResetMock}>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByTestId('custom-fn-fallback')).toBeTruthy();
    expect(getByTestId('custom-error-msg').props.children).toBe('Test crash in ProblemChild');

    fireEvent.press(getByTestId('custom-retry-btn'));
    expect(onResetMock).toHaveBeenCalledTimes(1);
  });
});
