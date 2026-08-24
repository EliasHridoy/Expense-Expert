import { StyleSheet, Platform } from 'react-native';

export const colors = {
  // Brand
  primary: '#4f46e5',
  primaryDark: '#4338ca',
  primaryLight: '#6366f1',
  primarySubtle: '#eef2ff',
  primaryBorder: '#c7d2fe',

  // Status & Financial
  income: '#059669',
  incomeBg: '#ecfdf5',
  incomeBorder: '#a7f3d0',
  expense: '#e11d48',
  expenseBg: '#fff1f2',
  expenseBorder: '#fecdd3',
  savings: '#4f46e5',
  savingsBg: '#eef2ff',
  savingsBorder: '#c7d2fe',
  remaining: '#0284c7',
  remainingBg: '#f0f9ff',
  remainingBorder: '#bae6fd',

  // Thresholds
  underBudget: '#059669',
  underBudgetBg: '#ecfdf5',
  nearLimit: '#d97706',
  nearLimitBg: '#fffbeb',
  exceeded: '#e11d48',
  exceededBg: '#fff1f2',

  // Neutrals
  bgApp: '#f8fafc',
  cardBg: '#ffffff',
  surfaceBg: '#f1f5f9',
  inputBg: '#ffffff',
  border: '#e2e8f0',
  borderSubtle: '#f1f5f9',
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  white: '#ffffff',
};

export const themeStyles = StyleSheet.create({
  appContainer: {
    flex: 1,
    minHeight: '100%',
    backgroundColor: colors.bgApp,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)',
        }
      : {
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
        }),
  },
  cardHover: {
    backgroundColor: '#f8fafc',
  },
  btnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
          cursor: 'pointer',
        }
      : {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 3,
        }),
  },
  btnPrimaryText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  btnSecondary: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnSecondaryText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
