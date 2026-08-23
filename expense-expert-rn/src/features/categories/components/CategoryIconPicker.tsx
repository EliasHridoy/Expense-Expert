import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { CATEGORY_ICONS } from '../types/category.types';

export interface CategoryIconPickerProps {
  selectedIcon: string;
  onSelectIcon: (icon: string) => void;
  testID?: string;
}

/**
 * Responsive grid selector for emoji icons from CATEGORY_ICONS.
 */
export const CategoryIconPicker: React.FC<CategoryIconPickerProps> = ({
  selectedIcon,
  onSelectIcon,
  testID = 'category-icon-picker',
}) => {
  return (
    <View testID={testID} className="flex-row flex-wrap gap-2 justify-start">
      {CATEGORY_ICONS.map((icon) => {
        const isSelected = selectedIcon === icon;
        return (
          <Pressable
            key={icon}
            testID={`emoji-option-${icon}`}
            accessibilityRole="button"
            accessibilityLabel={`Select emoji ${icon}`}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelectIcon(icon)}
            className={`w-11 h-11 rounded-xl items-center justify-center border-2 transition-all active:scale-95 ${
              isSelected
                ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 shadow-sm'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
            }`}
          >
            <Text className="text-xl">{icon}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};
