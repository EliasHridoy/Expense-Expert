import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCategories } from '../../../src/features/categories/hooks/useCategories';
import { CategoryListModal } from '../../../src/features/categories/components/CategoryListModal';

export default function CategoriesScreen() {
  const router = useRouter();
  const {
    builtInCategories,
    customCategories,
    isLoading,
    deleteCategory,
  } = useCategories();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteCategory(id);
    } catch (err) {
      console.error('Failed to delete category:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900" testID="categories-screen">
      {/* Screen Header */}
      <View className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/60 px-5 py-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity
            testID="back-to-dashboard-btn"
            onPress={() => router.replace('/')}
            accessibilityRole="button"
            accessibilityLabel="Back to Dashboard"
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 items-center justify-center mr-3 active:opacity-75"
          >
            <Text className="text-slate-700 dark:text-slate-200 font-bold text-lg">←</Text>
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-extrabold text-slate-900 dark:text-white">
              Manage Categories
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400">
              Customize tags and categories
            </Text>
          </View>
        </View>

        <TouchableOpacity
          testID="open-new-category-btn"
          onPress={() => setIsModalOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Create new category"
          className="bg-indigo-600 active:bg-indigo-700 px-3.5 py-2 rounded-xl shadow-sm flex-row items-center"
        >
          <Text className="text-white font-bold text-xs">+ New Category</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, alignItems: 'center' }}
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-lg space-y-6">
          {/* Custom Categories Section */}
          <View className="w-full bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-base font-bold text-slate-900 dark:text-white">
                  Custom Categories
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400">
                  Categories created by you
                </Text>
              </View>
              <Text className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {customCategories.length} {customCategories.length === 1 ? 'category' : 'categories'}
              </Text>
            </View>

            {isLoading && customCategories.length === 0 ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="small" color="#6366f1" />
              </View>
            ) : customCategories.length === 0 ? (
              <View
                testID="empty-custom-categories-view"
                className="py-8 items-center justify-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700"
              >
                <Text className="text-3xl mb-2">🏷️</Text>
                <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 text-center mb-1">
                  No custom categories yet
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 text-center mb-4 max-w-xs">
                  Create categories for your unique spending habits, hobbies, or subscriptions.
                </Text>
                <TouchableOpacity
                  testID="empty-add-custom-cat-btn"
                  onPress={() => setIsModalOpen(true)}
                  className="bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-4 py-2 rounded-xl"
                >
                  <Text className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    + Add Custom Category
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View testID="custom-categories-list" className="space-y-2.5">
                {customCategories.map((item) => {
                  const catId = item.id || item.value;
                  const isDeleting = deletingId === catId;
                  return (
                    <View
                      key={catId}
                      testID={`custom-category-row-${catId}`}
                      className="flex-row items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700"
                    >
                      <View className="flex-row items-center flex-1 mr-3">
                        <View className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 items-center justify-center mr-3 shadow-xs border border-slate-200/60 dark:border-slate-700">
                          <Text className="text-xl">{item.icon}</Text>
                        </View>
                        <View className="flex-1">
                          <Text
                            numberOfLines={1}
                            className="text-sm font-bold text-slate-900 dark:text-white"
                          >
                            {item.label}
                          </Text>
                          <Text className="text-[11px] text-slate-500 dark:text-slate-400">
                            Custom Category
                          </Text>
                        </View>
                      </View>

                      <Pressable
                        testID={`delete-category-${catId}`}
                        accessibilityRole="button"
                        accessibilityLabel={`Delete ${item.label} category`}
                        onPress={() => handleDelete(catId)}
                        disabled={isDeleting}
                        className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 items-center justify-center active:opacity-70 border border-rose-200 dark:border-rose-800/60"
                      >
                        {isDeleting ? (
                          <ActivityIndicator size="small" color="#e11d48" />
                        ) : (
                          <Text className="text-sm">🗑️</Text>
                        )}
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Built-in Categories Section */}
          <View className="w-full bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-base font-bold text-slate-900 dark:text-white">
                  Standard Categories
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400">
                  Built-in default system categories
                </Text>
              </View>
              <View className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700">
                <Text className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Locked
                </Text>
              </View>
            </View>

            <View testID="builtin-categories-list" className="space-y-2.5">
              {builtInCategories.map((item) => (
                <View
                  key={item.value}
                  testID={`builtin-category-row-${item.value}`}
                  className="flex-row items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700/40"
                >
                  <View className="flex-row items-center flex-1 mr-3">
                    <View className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 items-center justify-center mr-3 shadow-xs border border-slate-200/60 dark:border-slate-700">
                      <Text className="text-xl">{item.icon}</Text>
                    </View>
                    <View className="flex-1">
                      <Text
                        numberOfLines={1}
                        className="text-sm font-semibold text-slate-800 dark:text-slate-200"
                      >
                        {item.label}
                      </Text>
                      <Text className="text-[11px] text-slate-400">Default Category</Text>
                    </View>
                  </View>

                  <View className="px-2 py-1 rounded-lg bg-slate-200/60 dark:bg-slate-700/60">
                    <Text className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                      Standard
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal for Creating Custom Categories */}
      <CategoryListModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </SafeAreaView>
  );
}
