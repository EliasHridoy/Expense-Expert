import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { colors } from '../../theme';
import { MAIN_NAV_ITEMS, NavItem } from './types';

export interface NavbarProps {
  activeRoute?: string;
  onNavigate?: (route: string) => void;
  onSignOut?: () => void;
  userEmail?: string;
  userName?: string;
  showLinks?: boolean;
  testID?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeRoute: customActiveRoute,
  onNavigate,
  onSignOut,
  userEmail: customEmail,
  userName: customName,
  showLinks,
  testID = 'app-desktop-navbar',
}) => {
  const router = useRouter();
  let pathname = '';
  try {
    pathname = usePathname();
  } catch {
    pathname = '/';
  }

  const { user, profile, logout } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = showLinks !== undefined ? showLinks : (width >= 768 || width === 0);

  const currentRoute = customActiveRoute ?? pathname ?? '/';
  const email = customEmail ?? user?.email ?? '';
  const displayName =
    customName ??
    profile?.displayName ??
    user?.displayName ??
    (email ? email.split('@')[0] : 'User');

  const handleItemPress = (item: NavItem) => {
    if (onNavigate) {
      onNavigate(item.route);
    } else {
      router.push(item.route as any);
    }
  };

  const handleLogout = async () => {
    if (onSignOut) {
      onSignOut();
    } else {
      try {
        await logout();
      } catch (err) {
        console.error('Navbar logout error:', err);
      }
    }
  };

  const isItemActive = (item: NavItem) => {
    if (item.exact) {
      return (
        currentRoute === item.route ||
        currentRoute === '' ||
        currentRoute === '/(app)' ||
        currentRoute === '/(app)/'
      );
    }
    return (
      currentRoute.startsWith(item.route) ||
      currentRoute.startsWith(`/(app)${item.route}`)
    );
  };

  return (
    <View testID={testID} style={styles.navbar}>
      <View style={styles.container}>
        {/* Brand Left */}
        <TouchableOpacity
          testID="navbar-brand"
          onPress={() => (onNavigate ? onNavigate('/') : router.push('/'))}
          activeOpacity={0.8}
          style={styles.brandContainer}
          accessibilityRole="button"
          accessibilityLabel="Go to Dashboard"
        >
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>EE</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>Expense Expert</Text>
            <Text style={styles.brandSubtitle}>Personal Finance</Text>
          </View>
        </TouchableOpacity>

        {/* Desktop Navigation Links (Only shown on Desktop >= 768px) */}
        {isDesktop && (
          <View style={styles.navLinks} testID="navbar-links-container">
            {MAIN_NAV_ITEMS.map((item) => {
              const active = isItemActive(item);
              return (
                <TouchableOpacity
                  key={item.id}
                  testID={item.id}
                  onPress={() => handleItemPress(item)}
                  activeOpacity={0.7}
                  style={[
                    styles.navItem,
                    active && styles.navItemActive,
                  ]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={styles.navItemIcon}>{item.icon}</Text>
                  <Text
                    style={[
                      styles.navItemLabel,
                      active && styles.navItemLabelActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* User Profile & Sign Out Right */}
        <View style={styles.userSection}>
          {email ? (
            <TouchableOpacity
              style={styles.userBadge}
              testID="navbar-user-badge"
              onPress={() => (onNavigate ? onNavigate('/profile') : router.push('/profile'))}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="View User Profile"
            >
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              {isDesktop && (
                <View style={styles.userInfo}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {displayName}
                  </Text>
                  <Text style={styles.userEmail} numberOfLines={1}>
                    {email}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            testID="navbar-logout-btn"
            onPress={handleLogout}
            activeOpacity={0.75}
            style={styles.logoutBtn}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Text style={styles.logoutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    width: '100%',
    zIndex: 50,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
          position: 'sticky' as any,
          top: 0,
        }
      : {}),
  },
  container: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  brandBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)' }
      : {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 2,
        }),
  },
  brandBadgeText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  brandSubtitle: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  navItemActive: {
    backgroundColor: '#eef2ff',
    borderColor: '#c7d2fe',
  },
  navItemIcon: {
    fontSize: 15,
  },
  navItemLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  navItemLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avatarCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  userInfo: {
    maxWidth: 130,
  },
  userName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e293b',
  },
  userEmail: {
    fontSize: 9,
    color: '#64748b',
  },
  logoutBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  logoutText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#e11d48',
  },
});
