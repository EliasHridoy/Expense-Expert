import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { OfflineSyncBanner } from '../../../src/features/expenses/components/OfflineSyncBanner';

describe('OfflineSyncBanner', () => {
  it('renders null when online and pending count is 0', () => {
    const { queryByTestId } = render(
      <OfflineSyncBanner isOnline={true} pendingCount={0} />
    );
    expect(queryByTestId('offline-sync-banner')).toBeNull();
  });

  it('renders offline warning banner when offline', () => {
    const { getByTestId, getByText } = render(
      <OfflineSyncBanner isOnline={false} pendingCount={3} />
    );

    expect(getByTestId('offline-sync-banner')).toBeTruthy();
    expect(getByText('Offline Mode')).toBeTruthy();
    expect(getByText('3 transactions queued locally')).toBeTruthy();
  });

  it('renders unsynced banner and sync button when online with pending count > 0', () => {
    const onSyncNow = jest.fn();
    const { getByTestId, getByText } = render(
      <OfflineSyncBanner
        isOnline={true}
        pendingCount={2}
        onSyncNow={onSyncNow}
      />
    );

    expect(getByTestId('offline-sync-banner')).toBeTruthy();
    expect(getByText('Unsynced Transactions')).toBeTruthy();
    expect(getByText('2 transactions pending sync')).toBeTruthy();

    const syncBtn = getByTestId('offline-sync-banner-sync-btn');
    fireEvent.press(syncBtn);
    expect(onSyncNow).toHaveBeenCalledTimes(1);
  });
});
