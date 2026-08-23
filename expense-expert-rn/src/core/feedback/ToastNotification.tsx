import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Toast, ToastType } from './ToastContext';

export interface ToastNotificationProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const TOAST_ICONS: Record<ToastType, string> = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

const TOAST_STYLES: Record<ToastType, { bg: string; border: string; text: string }> = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/90',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-900 dark:text-emerald-100',
  },
  error: {
    bg: 'bg-rose-50 dark:bg-rose-950/90',
    border: 'border-rose-200 dark:border-rose-800',
    text: 'text-rose-900 dark:text-rose-100',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/90',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-900 dark:text-amber-100',
  },
  info: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/90',
    border: 'border-indigo-200 dark:border-indigo-800',
    text: 'text-indigo-900 dark:text-indigo-100',
  },
};

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onDismiss }) => {
  const styles = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
  const icon = TOAST_ICONS[toast.type] || TOAST_ICONS.info;

  return (
    <TouchableOpacity
      testID={`toast-${toast.type}`}
      accessibilityRole="alert"
      activeOpacity={0.9}
      onPress={() => onDismiss(toast.id)}
      className={`mb-2 w-full flex-row items-center justify-between rounded-xl border p-4 shadow-md ${styles.bg} ${styles.border}`}
    >
      <View className="flex-row items-center flex-1 mr-2">
        <Text className="mr-3 text-lg">{icon}</Text>
        <Text
          testID="toast-message"
          className={`flex-1 text-xs font-semibold ${styles.text}`}
          numberOfLines={3}
        >
          {toast.message}
        </Text>
      </View>
      <TouchableOpacity
        testID="toast-dismiss"
        onPress={() => onDismiss(toast.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        className="p-1"
      >
        <Text className="text-xs font-bold text-slate-400 dark:text-slate-500">✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};
