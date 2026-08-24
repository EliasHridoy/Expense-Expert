import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../src/features/auth/hooks/useAuth';
import { colors, themeStyles } from '../../../src/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName =
    profile?.displayName ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'User';

  const email = user?.email || 'N/A';
  const initial = displayName.charAt(0).toUpperCase();

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
      showsVerticalScrollIndicator={false}
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
          <Text style={styles.sectionHeading}>Account Information</Text>
          <Text style={styles.sectionSubheading}>Your personal credentials and status</Text>

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
        </View>

        {/* Financial Preferences Card */}
        <View style={styles.detailsCard} testID="profile-financial-details">
          <Text style={styles.sectionHeading}>Financial Preferences</Text>
          <Text style={styles.sectionSubheading}>Monthly baseline and currency settings</Text>

          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Monthly Baseline Salary</Text>
              <Text style={styles.infoValue} testID="profile-salary-text">
                {monthlySalary > 0 ? `$${monthlySalary.toLocaleString()}` : 'Not Set'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Default Currency</Text>
              <Text style={styles.infoValue}>USD ($)</Text>
            </View>
          </View>
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
    paddingVertical: 24,
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
    marginBottom: 8,
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
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionSubheading: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 16,
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
