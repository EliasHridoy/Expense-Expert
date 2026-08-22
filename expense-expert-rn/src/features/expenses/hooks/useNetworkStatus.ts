import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

/**
 * useNetworkStatus
 * 
 * Universal cross-platform hook for monitoring internet connectivity.
 * Uses window online/offline events on Web and NetInfo on Native (iOS/Android).
 */
export function useNetworkStatus(): { isOnline: boolean } {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return navigator.onLine;
    }
    return true;
  });

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
        setIsOnline(navigator.onLine);
      }

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = state.isConnected ?? true;
      const reachable = state.isInternetReachable ?? true;
      setIsOnline(Boolean(connected && reachable));
    });

    NetInfo.fetch().then((state: NetInfoState) => {
      const connected = state.isConnected ?? true;
      const reachable = state.isInternetReachable ?? true;
      setIsOnline(Boolean(connected && reachable));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { isOnline };
}
