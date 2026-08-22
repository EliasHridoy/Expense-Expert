import React from 'react';
import {
  Pressable,
  Text,
  View,
} from 'react-native';
import {
  EXPENSE_CATEGORIES,
  CategoryItem,
} from '../types/category.types';

export interface CategoryCardPickerProps {
  selectedValue?: string;
  onSelect: (category: string) => void;
  customCategories?: CategoryItem[];
  testID?: string;
}

/**
 * Grid of emoji category cards with active selection indicators.
 */
export const CategoryCardPicker: React.FC<CategoryCardPickerProps> = ({
  selectedValue,
  onSelect,
  customCategories = [],
  testID = 'category-card-picker',
}) => {
  // Merge builtin categories with custom categories
  const categories = [
    ...EXPENSE_CATEGORIES,
    ...customCategories.map((c) => ({
      value: c.value,
      label: c.label,
      icon: c.icon,
    })),
  ];

  return (
    <View
      testID={testID}
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
            className={`w-[31%] aspect-square rounded-2xl items-center justify-center p-2 border-2 transition-all active:scale-95 ${
              isSelected
                ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 shadow-sm'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
            }`}
          >
            <Text className="text-2xl sm:text-3xl mb-1">{item.icon}</Text>
            <Text
              numberOfLines={1}
              className={`text-xs font-semibold text-center ${
                isSelected
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};
