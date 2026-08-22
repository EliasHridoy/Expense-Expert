import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function IndexScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900 justify-center items-center p-6">
      <View className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-md border border-slate-100 dark:border-slate-700 items-center">
        <Text className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
          Expense Expert
        </Text>
        <Text className="text-base text-slate-600 dark:text-slate-300 text-center mb-6">
          Universal React Native App (Web & Mobile)
        </Text>
        <View className="w-full bg-indigo-50 dark:bg-indigo-950/40 rounded-xl p-4 mb-6 border border-indigo-100 dark:border-indigo-900">
          <Text className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-1">
            Environment Status
          </Text>
          <Text className="text-sm text-slate-700 dark:text-slate-200">
            ✓ Expo SDK 52 + Expo Router v4
          </Text>
          <Text className="text-sm text-slate-700 dark:text-slate-200">
            ✓ NativeWind v4 (Tailwind CSS)
          </Text>
          <Text className="text-sm text-slate-700 dark:text-slate-200">
            ✓ Cross-Platform Universal Metro
          </Text>
        </View>
        <Pressable
          className="w-full bg-indigo-600 active:bg-indigo-700 py-3.5 px-6 rounded-xl items-center shadow-sm"
          onPress={() => console.log('Get Started pressed')}
        >
          <Text className="text-white font-semibold text-base">
            Ready for Authentication
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
