import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useNetworkStatus } from '@/features/expenses/hooks/useNetworkStatus';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn(),
}));

describe('useNetworkStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('on native platforms', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
    });

    it('subscribes to NetInfo and updates online status', async () => {
      let listener: any;
      (NetInfo.addEventListener as jest.Mock).mockImplementation((cb) => {
        listener = cb;
        return jest.fn();
      });
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
      });

      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
      });

      expect(NetInfo.addEventListener).toHaveBeenCalled();
      expect(NetInfo.fetch).toHaveBeenCalled();

      // Trigger offline event
      act(() => {
        listener({ isConnected: false, isInternetReachable: false });
      });

      expect(result.current.isOnline).toBe(false);

      // Trigger online event
      act(() => {
        listener({ isConnected: true, isInternetReachable: true });
      });

      expect(result.current.isOnline).toBe(true);
    });
  });
});
