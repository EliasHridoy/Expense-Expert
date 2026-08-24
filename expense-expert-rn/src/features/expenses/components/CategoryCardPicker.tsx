import React, { useContext } from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  Platform,
} from 'react-native';
import { CategoryContext } from '../../categories/context/CategoryContext';
import {
  EXPENSE_CATEGORIES,
  CategoryItem,
} from '../types/category.types';
import { colors } from '../../../theme';

export interface CategoryCardPickerProps {
  selectedValue?: string;
  onSelect: (category: string) => void;
  customCategories?: CategoryItem[];
  testID?: string;
}

export const CategoryCardPicker: React.FC<CategoryCardPickerProps> = ({
  selectedValue,
  onSelect,
  customCategories = [],
  testID = 'category-card-picker',
}) => {
  const categoryContext = useContext(CategoryContext);
  const baseCategories = categoryContext?.categories || EXPENSE_CATEGORIES;

  // Merge and deduplicate by value
  const categoryMap = new Map<string, { value: string; label: string; icon: string }>();
  baseCategories.forEach((c) => {
    categoryMap.set(c.value, { value: c.value, label: c.label, icon: c.icon });
  });
  customCategories.forEach((c) => {
    categoryMap.set(c.value, { value: c.value, label: c.label, icon: c.icon });
  });
  const categories = Array.from(categoryMap.values());

  return (
    <View
      testID={testID}
      style={styles.grid}
      className="flex-row flex-wrap justify-between gap-y-3"
    >
      {categories.map((item) => {
        const isSelected = selectedValue === item.value;
        return (
          <Pressable
            key={item.value}
            testID={`category-card-${item.value}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(item.value)}
            style={[
              styles.card,
              isSelected ? styles.cardSelected : styles.cardUnselected,
            ]}
            className={`w-[31%] aspect-square rounded-2xl items-center justify-center p-2 border-2 transition-all active:scale-95 ${
              isSelected
                ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 shadow-sm'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
            }`}
          >
            <Text style={styles.icon}>{item.icon}</Text>
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                isSelected ? styles.labelSelected : styles.labelUnselected,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    width: '100%',
  },
  card: {
    width: '31%',
    minWidth: 84,
    height: 80,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    borderWidth: 2,
    ...(Platform.OS === 'web' ? { cursor: 'pointer', userSelect: 'none' } as any : {}),
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#eef2ff',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)' }
      : {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 2,
        }),
  },
  cardUnselected: {
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  icon: {
    fontSize: 24,
    marginBottom: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  labelSelected: {
    color: colors.primary,
    fontWeight: '800',
  },
  labelUnselected: {
    color: '#334155',
  },
});

