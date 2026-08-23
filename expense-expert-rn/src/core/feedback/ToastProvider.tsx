import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toast, ToastContext, ToastType } from './ToastContext';
import { ToastNotification } from './ToastNotification';

const MAX_TOASTS = 3;
const DEFAULT_DURATION = 3500;

export interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  
  let insetsTop = 0;
  try {
    const insets = useSafeAreaInsets();
    insetsTop = insets?.top || 0;
  } catch {
    // In environments where SafeAreaProvider is missing
    insetsTop = 0;
  }

  const hideToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = DEFAULT_DURATION): string => {
      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newToast: Toast = { id, message, type, duration };

      setToasts((prev) => {
        const next = [...prev, newToast];
        if (next.length > MAX_TOASTS) {
          const removed = next.shift();
          if (removed) {
            const timer = timersRef.current.get(removed.id);
            if (timer) {
              clearTimeout(timer);
              timersRef.current.delete(removed.id);
            }
          }
        }
        return next;
      });

      if (duration > 0) {
        const timer = setTimeout(() => {
          hideToast(id);
        }, duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [hideToast]
  );

  const showSuccess = useCallback(
    (message: string, duration?: number) => showToast(message, 'success', duration),
    [showToast]
  );

  const showError = useCallback(
    (message: string, duration?: number) => showToast(message, 'error', duration),
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => showToast(message, 'info', duration),
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, duration?: number) => showToast(message, 'warning', duration),
    [showToast]
  );

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        hideToast,
      }}
    >
      {children}
      <View
        testID="toast-container"
        style={[
          styles.container,
          { top: Math.max(insetsTop, 16) + 8, pointerEvents: 'box-none' as any },
        ]}
      >
        {toasts.map((toast) => (
          <ToastNotification key={toast.id} toast={toast} onDismiss={hideToast} />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
});
