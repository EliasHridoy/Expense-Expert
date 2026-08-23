import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useCategories } from '../hooks/useCategories';
import { CATEGORY_ICONS } from '../types/category.types';
import { CategoryIconPicker } from './CategoryIconPicker';

export interface CategoryListModalProps {
  visible: boolean;
  onClose: () => void;
  testID?: string;
}

/**
 * Modal dialog for managing and creating custom categories.
 */
export const CategoryListModal: React.FC<CategoryListModalProps> = ({
  visible,
  onClose,
  testID = 'category-list-modal',
}) => {
  const { customCategories, addCategory, deleteCategory, isLoading } = useCategories();
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>(CATEGORY_ICONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddCategory = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Category name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await addCategory(trimmed, selectedIcon);
      setName('');
      setSelectedIcon(CATEGORY_ICONS[0]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create category';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteCategory(id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete category';
      setError(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClose = () => {
    setName('');
    setError(null);
    setSelectedIcon(CATEGORY_ICONS[0]);
    onClose();
  };

  return (
    <Modal
      testID={testID}
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/60 justify-end sm:justify-center items-center p-0 sm:p-4">
        <View className="w-full sm:max-w-lg max-h-[85%] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex-col">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <Text className="text-xl font-bold text-slate-900 dark:text-white">
              Manage Categories
            </Text>
            <Pressable
              testID="close-category-modal-btn"
              accessibilityRole="button"
              accessibilityLabel="Close modal"
              onPress={handleClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
            >
              <Text className="text-slate-600 dark:text-slate-300 font-bold text-base">✕</Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            className="flex-1 my-4"
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            {/* Add New Category Section */}
            <View className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-6 border border-slate-200 dark:border-slate-800">
              <Text className="text-base font-semibold text-slate-900 dark:text-white mb-3">
                Create New Category
              </Text>

              {/* Name Input */}
              <View className="mb-4">
                <Text className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Category Name
                </Text>
                <TextInput
                  testID="category-name-input"
                  placeholder="e.g. Subscriptions, Hobbies"
                  placeholderTextColor="#94a3b8"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (error) setError(null);
                  }}
                  className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-base"
                />
              </View>

              {/* Icon Picker */}
              <View className="mb-4">
                <Text className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Select Icon
                </Text>
                <CategoryIconPicker
                  testID="category-icon-picker"
                  selectedIcon={selectedIcon}
                  onSelectIcon={setSelectedIcon}
                />
              </View>

              {/* Error Message */}
              {error && (
                <Text
                  testID="category-form-error"
                  className="text-sm font-medium text-rose-600 dark:text-rose-400 mb-3"
                >
                  {error}
                </Text>
              )}

              {/* Submit Button */}
              <Pressable
                testID="save-category-btn"
                accessibilityRole="button"
                onPress={handleAddCategory}
                disabled={isSubmitting}
                className="bg-indigo-600 active:bg-indigo-700 rounded-xl py-3 items-center justify-center flex-row shadow-sm"
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="text-white font-bold text-base">
                    + Create Category
                  </Text>
                )}
              </Pressable>
            </View>

            {/* Custom Categories List Section */}
            <View>
              <Text className="text-base font-semibold text-slate-900 dark:text-white mb-3">
                Your Custom Categories
              </Text>

              {isLoading && customCategories.length === 0 ? (
                <View className="py-6 items-center">
                  <ActivityIndicator size="small" color="#4f46e5" />
                </View>
              ) : customCategories.length === 0 ? (
                <View testID="empty-custom-categories" className="py-6 items-center justify-center bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Text className="text-2xl mb-1">🏷️</Text>
                  <Text className="text-sm text-slate-500 dark:text-slate-400">
                    No custom categories created yet.
                  </Text>
                </View>
              ) : (
                <View className="gap-y-2">
                  {customCategories.map((item) => {
                    const catId = item.id || item.value;
                    const isDeleting = deletingId === catId;
                    return (
                      <View
                        key={catId}
                        testID={`custom-category-item-${catId}`}
                        className="flex-row items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs"
                      >
                        <View className="flex-row items-center flex-1 mr-3">
                          <Text className="text-2xl mr-3">{item.icon}</Text>
                          <Text
                            numberOfLines={1}
                            className="text-base font-medium text-slate-900 dark:text-white flex-1"
                          >
                            {item.label}
                          </Text>
                        </View>
                        <Pressable
                          testID={`delete-category-${catId}`}
                          accessibilityRole="button"
                          accessibilityLabel={`Delete category ${item.label}`}
                          onPress={() => handleDeleteCategory(catId)}
                          disabled={isDeleting}
                          className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/40 items-center justify-center active:bg-rose-100"
                        >
                          {isDeleting ? (
                            <ActivityIndicator size="small" color="#e11d48" />
                          ) : (
                            <Text className="text-rose-600 dark:text-rose-400 font-bold text-sm">🗑️</Text>
                          )}
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
