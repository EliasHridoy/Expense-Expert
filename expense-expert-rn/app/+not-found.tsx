import React from 'react';
import { View, Text } from 'react-native';
import { Link, Stack } from 'expo-router';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center p-5 bg-white dark:bg-slate-900">
        <Text className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
          This screen doesn't exist.
        </Text>
        <Link href="/" className="text-indigo-600 dark:text-indigo-400 text-base font-semibold">
          Go to home screen!
        </Link>
      </View>
    </>
  );
}
