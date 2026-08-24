import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../src/features/auth/hooks/useAuth';
import {
  SupportedCurrency,
  SUPPORTED_CURRENCIES,
  getCurrencySymbol,
  formatCurrencyAmount,
} from '../../../src/features/expenses/utils/currency.util';
import { colors } from '../../../src/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, logout, updateProfile } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Account Information Edit State (Display Name)
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingDisplayName, setEditingDisplayName] = useState<string>(
    profile?.displayName || user?.displayName || ''
  );
  const [isSavingName, setIsSavingName] = useState(false);

  // Financial Preferences Edit State
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [editingSalary, setEditingSalary] = useState<string>(
    profile?.monthlySalary != null ? String(profile.monthlySalary) : ''
  );
  const [editingCurrency, setEditingCurrency] = useState<SupportedCurrency>(
    (profile?.currency as SupportedCurrency) || 'BDT'
  );
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const displayName =
    profile?.displayName ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'User';

  const email = user?.email || 'N/A';
  const initial = displayName.charAt(0).toUpperCase();

  // Active currency
  const currentCurrency: SupportedCurrency = (profile?.currency as SupportedCurrency) || 'BDT';
  const currentCurrencyConfig = SUPPORTED_CURRENCIES[currentCurrency] || SUPPORTED_CURRENCIES.BDT;
  const editingCurrencyConfig = SUPPORTED_CURRENCIES[editingCurrency] || SUPPORTED_CURRENCIES.BDT;

  // Format member since date
  const getMemberSince = () => {
    if (profile?.createdAt) {
      if (typeof profile.createdAt === 'string') {
        return profile.createdAt.split('T')[0];
      }
      if (profile.createdAt.toDate) {
        return profile.createdAt.toDate().toLocaleDateString();
      }
    }
    return 'Active Member';
  };

  const handleStartEditName = () => {
    setEditingDisplayName(displayName);
    setStatusMessage(null);
    setIsEditingName(true);
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setStatusMessage(null);
  };

  const handleSaveName = async () => {
    setIsSavingName(true);
    setStatusMessage(null);
    try {
      const cleanDisplayName = editingDisplayName.trim() || displayName;
      if (updateProfile) {
        await updateProfile({
          displayName: cleanDisplayName,
        });
      }
      setStatusMessage({
        type: 'success',
        text: 'Display name updated successfully!',
      });
      setIsEditingName(false);
    } catch (error: any) {
      console.error('Failed to update name:', error);
      setStatusMessage({
        type: 'error',
        text: error?.message || 'Failed to update name. Please try again.',
      });
    } finally {
      setIsSavingName(false);
    }
  };

  const handleStartEditPreferences = () => {
    setEditingSalary(
      profile?.monthlySalary != null ? String(profile.monthlySalary) : ''
    );
    setEditingCurrency(currentCurrency);
    setStatusMessage(null);
    setIsEditingPreferences(true);
  };

  const handleCancelEditPreferences = () => {
    setIsEditingPreferences(false);
    setStatusMessage(null);
  };

  const handleSavePreferences = async () => {
    setIsSavingPreferences(true);
    setStatusMessage(null);

    try {
      const cleanSalary = editingSalary.replace(/[^0-9.]/g, '');
      const parsedSalary = parseFloat(cleanSalary) || 0;

      if (updateProfile) {
        await updateProfile({
          monthlySalary: parsedSalary,
          currency: editingCurrency,
          currencySymbol: getCurrencySymbol(editingCurrency),
        });
      }

      setStatusMessage({
        type: 'success',
        text: 'Financial preferences updated successfully!',
      });
      setIsEditingPreferences(false);
    } catch (error: any) {
      console.error('Failed to update preferences:', error);
      setStatusMessage({
        type: 'error',
        text: error?.message || 'Failed to update preferences. Please try again.',
      });
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const monthlySalary = profile?.monthlySalary ?? 0;

  return (
    <ScrollView
      testID="profile-screen"
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      <View style={styles.container}>
        {/* Top Header Navigation */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            testID="back-to-dashboard-btn"
            onPress={() => router.replace('/')}
            activeOpacity={0.7}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Back to Dashboard"
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>User Profile</Text>
            <Text style={styles.headerSubtitle}>Account information & preferences</Text>
          </View>
        </View>

        {/* Status Message (Toast Alert) */}
        {statusMessage && (
          <View
            testID="profile-status-message"
            style={[
              styles.statusBanner,
              statusMessage.type === 'success'
                ? styles.statusBannerSuccess
                : styles.statusBannerError,
            ]}
          >
            <Text
              style={[
                styles.statusBannerText,
                statusMessage.type === 'success'
                  ? styles.statusTextSuccess
                  : styles.statusTextError,
              ]}
            >
              {statusMessage.text}
            </Text>
          </View>
        )}

        {/* Welcome & Profile Summary Card */}
        <View style={styles.profileCard} testID="profile-user-card">
          <View style={styles.avatarRow}>
            <View style={styles.avatarCircle} testID="profile-avatar">
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.nameBlock}>
              <Text style={styles.welcomeTitle} testID="profile-welcome-text">
                Welcome, {displayName}!
              </Text>
              <Text style={styles.emailSubtext} testID="profile-user-email">
                {email}
              </Text>
              <View style={styles.badgeRow}>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓ Verified User</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Account Details Card (UID is hidden) */}
        <View style={styles.detailsCard} testID="profile-account-details">
          <View style={styles.sectionHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionHeading}>Account Information</Text>
              <Text style={styles.sectionSubheading}>Your personal credentials and identity</Text>
            </View>
            {!isEditingName ? (
              <TouchableOpacity
                testID="edit-name-btn"
                onPress={handleStartEditName}
                activeOpacity={0.7}
                style={styles.editBtn}
                accessibilityRole="button"
                accessibilityLabel="Edit display name"
              >
                <Text style={styles.editBtnText}>✏️ Edit Name</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {!isEditingName ? (
            <View style={styles.infoList}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue} testID="profile-user-name">
                  {displayName}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValue} testID="profile-detail-email">
                  {email}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue} testID="profile-member-since">
                  {getMemberSince()}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Sign-in Provider</Text>
                <Text style={styles.infoValue}>
                  {user?.providerData?.[0]?.providerId === 'google.com'
                    ? 'Google Account'
                    : 'Email & Password'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.editFormContainer} testID="name-edit-form">
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Display Name</Text>
                <TextInput
                  testID="profile-display-name-input"
                  value={editingDisplayName}
                  onChangeText={setEditingDisplayName}
                  placeholder="e.g. John Doe"
                  placeholderTextColor="#94a3b8"
                  style={styles.textInput}
                />
              </View>

              <View style={styles.formActionRow}>
                <TouchableOpacity
                  testID="cancel-name-btn"
                  onPress={handleCancelEditName}
                  disabled={isSavingName}
                  activeOpacity={0.7}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID="save-name-btn"
                  onPress={handleSaveName}
                  disabled={isSavingName}
                  activeOpacity={0.85}
                  style={styles.saveBtn}
                >
                  {isSavingName ? (
                    <ActivityIndicator size="small" color="#ffffff" testID="save-name-loading" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Name</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Financial Preferences Card (Editable) */}
        <View style={styles.detailsCard} testID="profile-financial-details">
          <View style={styles.sectionHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionHeading}>Financial Preferences</Text>
              <Text style={styles.sectionSubheading}>
                Monthly baseline salary and default currency settings
              </Text>
            </View>
            {!isEditingPreferences ? (
              <TouchableOpacity
                testID="edit-preferences-btn"
                onPress={handleStartEditPreferences}
                activeOpacity={0.7}
                style={styles.editBtn}
                accessibilityRole="button"
                accessibilityLabel="Edit financial preferences"
              >
                <Text style={styles.editBtnText}>✏️ Edit</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {!isEditingPreferences ? (
            <View style={styles.infoList}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Monthly Baseline Salary</Text>
                <Text style={styles.infoValue} testID="profile-salary-text">
                  {monthlySalary > 0
                    ? formatCurrencyAmount(monthlySalary, currentCurrency)
                    : 'Not Set'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Default Currency</Text>
                <Text style={styles.infoValue} testID="profile-currency-text">
                  {currentCurrencyConfig.label}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.editFormContainer} testID="preferences-edit-form">
              {/* Default Currency Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Default Currency</Text>
                <View style={styles.currencySelectRow}>
                  {/* BDT (Default) */}
                  <TouchableOpacity
                    testID="currency-option-bdt"
                    onPress={() => setEditingCurrency('BDT')}
                    style={[
                      styles.currencyChip,
                      editingCurrency === 'BDT' && styles.currencyChipActive,
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.currencyChipFlag}>🇧🇩</Text>
                    <View style={styles.currencyChipCol}>
                      <Text
                        style={[
                          styles.currencyChipCode,
                          editingCurrency === 'BDT' && styles.currencyChipCodeActive,
                        ]}
                      >
                        BDT (৳) • Default
                      </Text>
                      <Text style={styles.currencyChipName}>Bangladeshi Taka</Text>
                    </View>
                    {editingCurrency === 'BDT' ? (
                      <Text style={styles.currencyCheckmark}>✓</Text>
                    ) : null}
                  </TouchableOpacity>

                  {/* USD (Secondary) */}
                  <TouchableOpacity
                    testID="currency-option-usd"
                    onPress={() => setEditingCurrency('USD')}
                    style={[
                      styles.currencyChip,
                      editingCurrency === 'USD' && styles.currencyChipActive,
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.currencyChipFlag}>🇺🇸</Text>
                    <View style={styles.currencyChipCol}>
                      <Text
                        style={[
                          styles.currencyChipCode,
                          editingCurrency === 'USD' && styles.currencyChipCodeActive,
                        ]}
                      >
                        USD ($) • Secondary
                      </Text>
                      <Text style={styles.currencyChipName}>US Dollar</Text>
                    </View>
                    {editingCurrency === 'USD' ? (
                      <Text style={styles.currencyCheckmark}>✓</Text>
                    ) : null}
                  </TouchableOpacity>
                </View>
                <Text style={styles.inputHint}>
                  Selected currency ({editingCurrencyConfig.symbol}) will be used for your salary calculations and balances.
                </Text>
              </View>

              {/* Monthly Salary Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Monthly Baseline Salary ({editingCurrencyConfig.symbol})
                </Text>
                <View style={styles.salaryInputRow}>
                  <Text style={styles.salaryPrefix}>{editingCurrencyConfig.symbol}</Text>
                  <TextInput
                    testID="profile-salary-input"
                    value={editingSalary}
                    onChangeText={setEditingSalary}
                    keyboardType="decimal-pad"
                    placeholder="50000.00"
                    placeholderTextColor="#94a3b8"
                    style={[styles.textInput, { flex: 1, borderWidth: 0 }]}
                  />
                </View>
                <Text style={styles.inputHint}>
                  This baseline is used to automatically compute your monthly income roll-forward in {editingCurrencyConfig.code}.
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.formActionRow}>
                <TouchableOpacity
                  testID="cancel-preferences-btn"
                  onPress={handleCancelEditPreferences}
                  disabled={isSavingPreferences}
                  activeOpacity={0.7}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID="save-preferences-btn"
                  onPress={handleSavePreferences}
                  disabled={isSavingPreferences}
                  activeOpacity={0.85}
                  style={styles.saveBtn}
                >
                  {isSavingPreferences ? (
                    <ActivityIndicator size="small" color="#ffffff" testID="save-loading" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Preferences</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Security & Sign Out Section */}
        <View style={styles.actionCard}>
          <TouchableOpacity
            testID="profile-logout-button"
            onPress={handleLogout}
            disabled={isLoggingOut}
            activeOpacity={0.85}
            style={styles.logoutButton}
            accessibilityRole="button"
            accessibilityLabel="Sign out of account"
          >
            {isLoggingOut ? (
              <ActivityIndicator size="small" color="#ffffff" testID="logout-loading" />
            ) : (
              <Text style={styles.logoutButtonText}>Sign Out of Account</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 180, // Comfortable spacing above mobile bottom tab bar
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 720,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
          cursor: 'pointer',
        }
      : { elevation: 1 }),
  },
  backArrow: {
    fontSize: 18,
    color: '#334155',
    fontWeight: '700',
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  statusBanner: {
    width: '100%',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  statusBannerSuccess: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  statusBannerError: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  statusBannerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusTextSuccess: {
    color: '#059669',
  },
  statusTextError: {
    color: '#e11d48',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)' }
      : { elevation: 2 }),
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)' }
      : { elevation: 3 }),
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
  },
  nameBlock: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  emailSubtext: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  verifiedBadge: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  detailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)' }
      : { elevation: 2 }),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionSubheading: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 12,
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  infoList: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '700',
  },
  editFormContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 16,
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  inputHint: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  currencySelectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  currencyChip: {
    flex: 1,
    minWidth: 160,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  currencyChipActive: {
    backgroundColor: '#eff6ff',
    borderColor: colors.primary,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(79, 70, 229, 0.15)' }
      : { elevation: 1 }),
  },
  currencyChipFlag: {
    fontSize: 24,
  },
  currencyChipCol: {
    flex: 1,
  },
  currencyChipCode: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  currencyChipCodeActive: {
    color: colors.primary,
  },
  currencyChipName: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  currencyCheckmark: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  textInput: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  salaryInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
  },
  salaryPrefix: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
    marginRight: 6,
  },
  formActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#4f46e5',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
          cursor: 'pointer',
        }
      : { elevation: 2 }),
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  actionCard: {
    marginTop: 8,
    width: '100%',
  },
  logoutButton: {
    backgroundColor: '#e11d48',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 4px 12px rgba(225, 29, 72, 0.25)',
          cursor: 'pointer',
        }
      : { elevation: 2 }),
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
