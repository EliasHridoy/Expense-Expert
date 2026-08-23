import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { CategoryContext } from '../../categories/context/CategoryContext';
import { CategoryService } from '../../categories/services/category.service';
import { CategoryItem } from '../../categories/types/category.types';

export interface FilterChipsProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  testID?: string;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  selectedCategory,
  onSelectCategory,
  testID = 'filter-chips',
}) => {
  const context = useContext(CategoryContext);
  const categories: CategoryItem[] = context?.categories ?? CategoryService.getBuiltInCategories();

  const isAllSelected = !selectedCategory || selectedCategory === 'all';

  return (
    <View testID={testID} className="py-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        className="flex-row"
      >
        {/* "All" Category Chip */}
        <TouchableOpacity
          testID="filter-chip-all"
          accessibilityRole="button"
          accessibilityLabel="Filter by all categories"
          accessibilityState={{ selected: isAllSelected }}
          onPress={() => onSelectCategory('all')}
          className={`flex-row items-center px-3.5 py-1.5 rounded-full mr-2 border ${
            isAllSelected
              ? 'bg-indigo-600 border-indigo-600'
              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
          }`}
        >
          <Text className="text-sm mr-1">✨</Text>
          <Text
            className={`text-sm font-medium ${
              isAllSelected
                ? 'text-white font-semibold'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            All
          </Text>
        </TouchableOpacity>

        {/* Individual Category Chips */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.value;
          return (
            <TouchableOpacity
              key={cat.value}
              testID={`filter-chip-${cat.value}`}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${cat.label}`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelectCategory(cat.value)}
              className={`flex-row items-center px-3.5 py-1.5 rounded-full mr-2 border ${
                isSelected
                  ? 'bg-indigo-600 border-indigo-600'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Text className="text-sm mr-1.5">{cat.icon}</Text>
              <Text
                className={`text-sm font-medium ${
                  isSelected
                    ? 'text-white font-semibold'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};
