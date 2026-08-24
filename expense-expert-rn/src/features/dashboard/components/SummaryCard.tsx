import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { colors } from '../../../theme';

export type SummaryCardType = 'income' | 'expense' | 'savings' | 'neutral';

export interface SummaryCardProps {
  title: string;
  amountFormatted: string;
  icon?: string;
  type?: SummaryCardType;
  isNegative?: boolean;
  subtext?: string;
  badgeText?: string;
  badgeColor?: string;
  onPress?: () => void;
  className?: string;
  testID?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  amountFormatted,
  icon,
  type = 'neutral',
  isNegative = false,
  subtext,
  badgeText,
  badgeColor,
  onPress,
  className = '',
  testID = 'summary-card',
}) => {
  const getIconBg = () => {
    switch (type) {
      case 'income':
        return '#ecfdf5';
      case 'expense':
        return '#fff1f2';
      case 'savings':
        return '#eef2ff';
      case 'neutral':
      default:
        return '#f1f5f9';
    }
  };

  const getAmountColor = () => {
    if (isNegative) {
      return '#e11d48';
    }
    switch (type) {
      case 'income':
        return '#059669';
      case 'expense':
        return '#e11d48';
      case 'savings':
        return '#4f46e5';
      case 'neutral':
      default:
        return '#0f172a';
    }
  };

  const CardContent = (
    <View
      style={styles.card}
      className={`bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-xs ${className}`}
    >
      <View style={styles.headerRow} className="flex-row items-center justify-between mb-2.5">
        <View style={styles.titleRow} className="flex-row items-center flex-1 mr-2">
          {icon ? (
            <View
              testID={`${testID}-icon`}
              style={[styles.iconBox, { backgroundColor: getIconBg() }]}
              className="w-9 h-9 rounded-xl items-center justify-center mr-2.5"
            >
              <Text style={styles.iconText}>{icon}</Text>
            </View>
          ) : null}
          <Text
            testID={`${testID}-title`}
            style={styles.titleText}
            className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 flex-shrink"
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>

        {badgeText ? (
          <View
            testID={`${testID}-badge`}
            style={styles.badge}
            className={`px-2 py-0.5 rounded-full ${badgeColor || 'bg-slate-100 dark:bg-slate-700'}`}
          >
            <Text style={styles.badgeText} className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
              {badgeText}
            </Text>
          </View>
        ) : null}
      </View>

      <Text
        testID={`${testID}-amount`}
        style={[styles.amountText, { color: getAmountColor() }]}
        className={`text-xl sm:text-2xl font-black ${
          isNegative || type === 'expense'
            ? 'text-rose-600 dark:text-rose-400'
            : type === 'income'
            ? 'text-emerald-600 dark:text-emerald-400'
            : type === 'savings'
            ? 'text-indigo-600 dark:text-indigo-400'
            : 'text-slate-900 dark:text-white'
        }`}
      >
        {amountFormatted}
      </Text>

      {subtext ? (
        <Text
          testID={`${testID}-subtext`}
          style={styles.subtext}
          className="text-xs text-slate-400 dark:text-slate-500 mt-1"
        >
          {subtext}
        </Text>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        testID={testID}
        onPress={onPress}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessible={true}
        style={{
          flex: 1,
          ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
        }}
      >
        {CardContent}
      </TouchableOpacity>
    );
  }

  return (
    <View testID={testID} accessible={true} style={{ flex: 1 }}>
      {CardContent}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)' }
      : {
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
        }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  iconText: {
    fontSize: 18,
  },
  titleText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#64748b',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    backgroundColor: '#f1f5f9',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  amountText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtext: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '500',
  },
});
