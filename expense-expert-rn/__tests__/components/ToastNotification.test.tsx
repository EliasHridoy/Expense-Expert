import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { ToastProvider } from '../../src/core/feedback/ToastProvider';
import { useToast } from '../../src/core/feedback/useToast';
import { ConnectionStatusBanner } from '../../src/core/components/ConnectionStatusBanner';
import * as networkHook from '../../src/features/expenses/hooks/useNetworkStatus';

const ToastTestConsumer: React.FC = () => {
  const { showSuccess, showError, showWarning, showInfo, hideToast, toasts } = useToast();

  return (
    <View>
      <TouchableOpacity
        testID="btn-trigger-success"
        onPress={() => showSuccess('Expense added successfully')}
      >
        <Text>Add Success</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="btn-trigger-error"
        onPress={() => showError('Failed to save expense')}
      >
        <Text>Add Error</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="btn-trigger-warning"
        onPress={() => showWarning('Budget is near limit')}
      >
        <Text>Add Warning</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="btn-trigger-info"
        onPress={() => showInfo('New category synced')}
      >
        <Text>Add Info</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="btn-trigger-hide-first"
        onPress={() => toasts[0] && hideToast(toasts[0].id)}
      >
        <Text>Hide First</Text>
      </TouchableOpacity>
    </View>
  );
};

describe('Toast Notification System', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.clearAllTimers();
    });
    jest.useRealTimers();
  });

  it('renders success, error, warning, and info toasts correctly', () => {
    const { getByTestId, getByText, queryByTestId } = render(
      <ToastProvider>
        <ToastTestConsumer />
      </ToastProvider>
    );

    // Initial state: no toasts
    expect(queryByTestId('toast-success')).toBeNull();

    // Trigger success toast
    act(() => {
      fireEvent.press(getByTestId('btn-trigger-success'));
    });
    expect(getByTestId('toast-success')).toBeTruthy();
    expect(getByText('Expense added successfully')).toBeTruthy();

    // Trigger error toast
    act(() => {
      fireEvent.press(getByTestId('btn-trigger-error'));
    });
    expect(getByTestId('toast-error')).toBeTruthy();
    expect(getByText('Failed to save expense')).toBeTruthy();

    // Trigger warning toast
    act(() => {
      fireEvent.press(getByTestId('btn-trigger-warning'));
    });
    expect(getByTestId('toast-warning')).toBeTruthy();
    expect(getByText('Budget is near limit')).toBeTruthy();
  });

  it('automatically dismisses toasts after the 3.5s timeout', () => {
    const { getByTestId, queryByTestId } = render(
      <ToastProvider>
        <ToastTestConsumer />
      </ToastProvider>
    );

    act(() => {
      fireEvent.press(getByTestId('btn-trigger-info'));
    });
    expect(getByTestId('toast-info')).toBeTruthy();

    // Advance 3.4 seconds - toast still exists
    act(() => {
      jest.advanceTimersByTime(3400);
    });
    expect(getByTestId('toast-info')).toBeTruthy();

    // Advance remaining 200ms - toast is dismissed
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(queryByTestId('toast-info')).toBeNull();
  });

  it('allows manual dismissal by clicking close button or toast card', () => {
    const { getByTestId, queryByTestId } = render(
      <ToastProvider>
        <ToastTestConsumer />
      </ToastProvider>
    );

    act(() => {
      fireEvent.press(getByTestId('btn-trigger-success'));
    });
    expect(getByTestId('toast-success')).toBeTruthy();

    // Press close
    act(() => {
      fireEvent.press(getByTestId('toast-dismiss'));
    });
    expect(queryByTestId('toast-success')).toBeNull();
  });

  it('limits active toasts to a maximum of 3', () => {
    const { getByTestId, queryByTestId, queryByText } = render(
      <ToastProvider>
        <ToastTestConsumer />
      </ToastProvider>
    );

    act(() => {
      fireEvent.press(getByTestId('btn-trigger-success')); // 1
      fireEvent.press(getByTestId('btn-trigger-error'));   // 2
      fireEvent.press(getByTestId('btn-trigger-warning')); // 3
    });

    expect(queryByText('Expense added successfully')).toBeTruthy();
    expect(queryByText('Failed to save expense')).toBeTruthy();
    expect(queryByText('Budget is near limit')).toBeTruthy();

    // Add 4th
    act(() => {
      fireEvent.press(getByTestId('btn-trigger-info')); // 4 (removes 1)
    });

    expect(queryByText('Expense added successfully')).toBeNull();
    expect(queryByText('Failed to save expense')).toBeTruthy();
    expect(queryByText('Budget is near limit')).toBeTruthy();
    expect(queryByText('New category synced')).toBeTruthy();
  });
});

describe('ConnectionStatusBanner', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders offline alert banner when disconnected', () => {
    jest.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({ isOnline: false });

    const { getByTestId, getByText } = render(
      <ConnectionStatusBanner pendingCount={0} />
    );

    expect(getByTestId('connection-status-banner')).toBeTruthy();
    expect(getByText('You are offline. Changes are saved locally.')).toBeTruthy();
  });

  it('renders offline alert with queued item count when offline with pending transactions', () => {
    jest.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({ isOnline: false });

    const { getByTestId, getByText } = render(
      <ConnectionStatusBanner pendingCount={3} />
    );

    expect(getByTestId('connection-status-banner')).toBeTruthy();
    expect(getByTestId('offline-pending-badge')).toBeTruthy();
    expect(getByText('3 queued')).toBeTruthy();
  });

  it('renders pending sync banner with "Sync Now" button when online with pending mutations', () => {
    jest.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({ isOnline: true });
    const onSyncMock = jest.fn();

    const { getByTestId, getByText } = render(
      <ConnectionStatusBanner
        pendingCount={2}
        isSyncing={false}
        onSyncNow={onSyncMock}
      />
    );

    expect(getByTestId('connection-status-banner')).toBeTruthy();
    expect(getByText('2 changes waiting to sync')).toBeTruthy();
    expect(getByTestId('sync-now-button')).toBeTruthy();

    fireEvent.press(getByTestId('sync-now-button'));
    expect(onSyncMock).toHaveBeenCalledTimes(1);
  });

  it('renders syncing progress spinner when sync is active', () => {
    jest.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({ isOnline: true });

    const { getByTestId, getByText, queryByTestId } = render(
      <ConnectionStatusBanner
        pendingCount={2}
        isSyncing={true}
      />
    );

    expect(getByTestId('connection-status-banner')).toBeTruthy();
    expect(getByText('Syncing changes...')).toBeTruthy();
    expect(getByTestId('sync-spinner')).toBeTruthy();
    expect(queryByTestId('sync-now-button')).toBeNull();
  });

  it('renders nothing (null) when online with 0 pending changes and not syncing', () => {
    jest.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({ isOnline: true });

    const { queryByTestId } = render(
      <ConnectionStatusBanner pendingCount={0} isSyncing={false} />
    );

    expect(queryByTestId('connection-status-banner')).toBeNull();
  });
});
