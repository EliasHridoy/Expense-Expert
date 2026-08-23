import React from 'react';
import { Text, View } from 'react-native';
import { useCategories } from '../hooks/useCategories';

export interface CategoryBadgeProps {
  category: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  testID?: string;
}

/**
 * Compact visual badge displaying category emoji icon and label with graceful fallback.
 */
export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  showIcon = true,
  size = 'md',
  className = '',
  testID = 'category-badge',
}) => {
  const { getCategoryByValue } = useCategories();
  const categoryItem = getCategoryByValue(category);

  const sizeStyles = {
    sm: {
      badge: 'px-2 py-0.5',
      icon: 'text-xs mr-1',
      text: 'text-xs',
    },
    md: {
      badge: 'px-2.5 py-1',
      icon: 'text-sm mr-1.5',
      text: 'text-sm',
    },
    lg: {
      badge: 'px-3 py-1.5',
      icon: 'text-base mr-2',
      text: 'text-base',
    },
  }[size];

  return (
    <View
      testID={testID}
      className={`flex-row items-center rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ${sizeStyles.badge} ${className}`}
    >
      {showIcon && (
        <Text testID="category-badge-icon" className={sizeStyles.icon}>
          {categoryItem.icon || '📁'}
        </Text>
      )}
      <Text
        testID="category-badge-label"
        numberOfLines={1}
        className={`font-medium text-slate-800 dark:text-slate-200 ${sizeStyles.text}`}
      >
        {categoryItem.label || category || 'Other'}
      </Text>
    </View>
  );
};
