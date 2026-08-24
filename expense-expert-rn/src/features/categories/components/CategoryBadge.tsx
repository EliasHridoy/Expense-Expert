import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useCategories } from '../hooks/useCategories';

export interface CategoryBadgeProps {
  category: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  testID?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  showIcon = true,
  size = 'md',
  className = '',
  testID = 'category-badge',
}) => {
  const { getCategoryByValue } = useCategories();
  const categoryItem = getCategoryByValue?.(category);
  const icon = categoryItem?.icon || '📁';
  const label = categoryItem?.label || category || 'Other';

  return (
    <View
      testID={testID}
      style={[
        styles.badge,
        size === 'sm' && styles.badgeSm,
        size === 'lg' && styles.badgeLg,
      ]}
      className={`flex-row items-center rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ${className}`}
    >
      {showIcon && (
        <Text
          testID="category-badge-icon"
          style={[
            styles.icon,
            size === 'sm' && styles.iconSm,
            size === 'lg' && styles.iconLg,
          ]}
        >
          {icon}
        </Text>
      )}
      <Text
        testID="category-badge-label"
        numberOfLines={1}
        style={[
          styles.text,
          size === 'sm' && styles.textSm,
          size === 'lg' && styles.textLg,
        ]}
        className="font-medium text-slate-800 dark:text-slate-200"
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeLg: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  icon: {
    fontSize: 14,
    marginRight: 6,
  },
  iconSm: {
    fontSize: 12,
    marginRight: 4,
  },
  iconLg: {
    fontSize: 16,
    marginRight: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  textSm: {
    fontSize: 11,
  },
  textLg: {
    fontSize: 15,
  },
});

