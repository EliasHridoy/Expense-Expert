import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCategories } from '../../../src/features/categories/hooks/useCategories';
import { CategoryListModal } from '../../../src/features/categories/components/CategoryListModal';
import { colors } from '../../../src/theme';

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
    <SafeAreaView
      style={styles.screen}
      className="flex-1 bg-slate-50 dark:bg-slate-900"
      testID="categories-screen"
    >
      {/* Screen Header */}
      <View style={styles.header} className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/60 px-5 py-4 flex-row items-center justify-between">
        <View style={styles.headerLeft} className="flex-row items-center">
          <TouchableOpacity
            testID="back-to-dashboard-btn"
            onPress={() => router.replace('/')}
            accessibilityRole="button"
            accessibilityLabel="Back to Dashboard"
            style={styles.backBtn}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 items-center justify-center mr-3 active:opacity-75"
          >
            <Text style={styles.backBtnText} className="text-slate-700 dark:text-slate-200 font-bold text-lg">←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle} className="text-xl font-extrabold text-slate-900 dark:text-white">
              Manage Categories
            </Text>
            <Text style={styles.headerSubtitle} className="text-xs text-slate-500 dark:text-slate-400">
              Customize tags and categories
            </Text>
          </View>
        </View>

        <TouchableOpacity
          testID="open-new-category-btn"
          onPress={() => setIsModalOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Create new category"
          style={styles.newCatBtn}
          className="bg-indigo-600 active:bg-indigo-700 px-3.5 py-2 rounded-xl shadow-sm flex-row items-center"
        >
          <Text style={styles.newCatBtnText} className="text-white font-bold text-xs">+ New Category</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container} className="w-full max-w-lg gap-y-6">
          {/* Custom Categories Section */}
          <View style={styles.card} className="w-full bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50">
            <View style={styles.sectionHeader} className="flex-row items-center justify-between mb-4">
              <View>
                <Text style={styles.sectionTitle} className="text-base font-bold text-slate-900 dark:text-white">
                  Custom Categories
                </Text>
                <Text style={styles.sectionSubtitle} className="text-xs text-slate-500 dark:text-slate-400">
                  Categories created by you
                </Text>
              </View>
              <Text style={styles.categoryCount} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {customCategories.length} {customCategories.length === 1 ? 'category' : 'categories'}
              </Text>
            </View>

            {isLoading && customCategories.length === 0 ? (
              <View style={styles.loadingBox} className="py-8 items-center">
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : customCategories.length === 0 ? (
              <View
                testID="empty-custom-categories-view"
                style={styles.emptyBox}
                className="py-8 items-center justify-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700"
              >
                <Text style={styles.emptyIcon} className="text-3xl mb-2">🏷️</Text>
                <Text style={styles.emptyTitle} className="text-sm font-semibold text-slate-700 dark:text-slate-300 text-center mb-1">
                  No custom categories yet
                </Text>
                <Text style={styles.emptySubtitle} className="text-xs text-slate-500 dark:text-slate-400 text-center mb-4 max-w-xs">
                  Create categories for your unique spending habits, hobbies, or subscriptions.
                </Text>
                <TouchableOpacity
                  testID="empty-add-custom-cat-btn"
                  onPress={() => setIsModalOpen(true)}
                  style={styles.emptyAddBtn}
                  className="bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-4 py-2 rounded-xl"
                >
                  <Text style={styles.emptyAddBtnText} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    + Add Custom Category
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View testID="custom-categories-list" style={styles.listContainer} className="gap-y-2.5">
                {customCategories.map((item) => {
                  const catId = item.id || item.value;
                  const isDeleting = deletingId === catId;
                  return (
                    <View
                      key={catId}
                      testID={`custom-category-row-${catId}`}
                      style={styles.categoryRow}
                      className="flex-row items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700"
                    >
                      <View style={styles.categoryRowLeft} className="flex-row items-center flex-1 mr-3">
                        <View style={styles.iconBox} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 items-center justify-center mr-3 shadow-xs border border-slate-200/60 dark:border-slate-700">
                          <Text style={styles.iconText} className="text-xl">{item.icon}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            numberOfLines={1}
                            style={styles.categoryLabel}
                            className="text-sm font-bold text-slate-900 dark:text-white"
                          >
                            {item.label}
                          </Text>
                          <Text style={styles.categoryType} className="text-[11px] text-slate-500 dark:text-slate-400">
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
                        style={styles.deleteBtn}
                        className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 items-center justify-center active:opacity-70 border border-rose-200 dark:border-rose-800/60"
                      >
                        {isDeleting ? (
                          <ActivityIndicator size="small" color="#e11d48" />
                        ) : (
                          <Text style={styles.trashIcon} className="text-sm">🗑️</Text>
                        )}
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Built-in Categories Section */}
          <View style={styles.card} className="w-full bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/50">
            <View style={styles.sectionHeader} className="flex-row items-center justify-between mb-4">
              <View>
                <Text style={styles.sectionTitle} className="text-base font-bold text-slate-900 dark:text-white">
                  Standard Categories
                </Text>
                <Text style={styles.sectionSubtitle} className="text-xs text-slate-500 dark:text-slate-400">
                  Built-in default system categories
                </Text>
              </View>
              <View style={styles.lockedBadge} className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700">
                <Text style={styles.lockedText} className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Locked
                </Text>
              </View>
            </View>

            <View testID="builtin-categories-list" style={styles.listContainer} className="gap-y-2.5">
              {builtInCategories.map((item) => (
                <View
                  key={item.value}
                  testID={`builtin-category-row-${item.value}`}
                  style={styles.categoryRow}
                  className="flex-row items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700/40"
                >
                  <View style={styles.categoryRowLeft} className="flex-row items-center flex-1 mr-3">
                    <View style={styles.iconBox} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 items-center justify-center mr-3 shadow-xs border border-slate-200/60 dark:border-slate-700">
                      <Text style={styles.iconText} className="text-xl">{item.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        numberOfLines={1}
                        style={styles.categoryLabel}
                        className="text-sm font-semibold text-slate-800 dark:text-slate-200"
                      >
                        {item.label}
                      </Text>
                      <Text style={styles.categoryType} className="text-[11px] text-slate-400">Default Category</Text>
                    </View>
                  </View>

                  <View style={styles.standardBadge} className="px-2 py-1 rounded-lg bg-slate-200/60 dark:bg-slate-700/60">
                    <Text style={styles.standardBadgeText} className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    minHeight: '100%',
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  backBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#334155',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  newCatBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)', cursor: 'pointer' }
      : {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 2,
        }),
  },
  newCatBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
    minHeight: '100%',
    flexGrow: 1,
  },
  container: {
    width: '100%',
    maxWidth: 600,
    gap: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)' }
      : {
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.04,
          shadowRadius: 10,
          elevation: 2,
        }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  categoryCount: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  loadingBox: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyBox: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: 280,
  },
  emptyAddBtn: {
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  emptyAddBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  listContainer: {
    gap: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  categoryRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iconText: {
    fontSize: 20,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  categoryType: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#fff1f2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fecdd3',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  trashIcon: {
    fontSize: 14,
  },
  lockedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
    backgroundColor: '#f1f5f9',
  },
  lockedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  standardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  standardBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
});
