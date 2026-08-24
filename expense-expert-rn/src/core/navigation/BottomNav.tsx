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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme';
import { MAIN_NAV_ITEMS, NavItem } from './types';

export interface BottomNavProps {
  activeRoute?: string;
  onNavigate?: (route: string) => void;
  showMobileNav?: boolean;
  testID?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeRoute: customActiveRoute,
  onNavigate,
  showMobileNav,
  testID = 'app-mobile-bottom-nav',
}) => {
  const router = useRouter();
  let pathname = '';
  try {
    pathname = usePathname();
  } catch {
    pathname = '/';
  }

  let insets = { top: 0, bottom: 0, left: 0, right: 0 };
  try {
    insets = useSafeAreaInsets();
  } catch {
    insets = { top: 0, bottom: 0, left: 0, right: 0 };
  }

  const { width } = useWindowDimensions();
  const isMobile = showMobileNav !== undefined ? showMobileNav : (width < 768 || Platform.OS !== 'web');

  // If on desktop screen, hide mobile bottom nav
  if (!isMobile) {
    return null;
  }

  const currentRoute = customActiveRoute ?? pathname ?? '/';

  const handleItemPress = (item: NavItem) => {
    if (onNavigate) {
      onNavigate(item.route);
    } else {
      router.push(item.route as any);
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

  const bottomPadding = Math.max(insets?.bottom || 0, 6);

  return (
    <View
      testID={testID}
      style={[
        styles.bottomNavContainer,
        { paddingBottom: bottomPadding },
      ]}
    >
      <View style={styles.tabRow}>
        {MAIN_NAV_ITEMS.map((item) => {
          const active = isItemActive(item);
          return (
            <TouchableOpacity
              key={item.id}
              testID={`mobile-${item.id}`}
              onPress={() => handleItemPress(item)}
              activeOpacity={0.7}
              style={styles.tabItem}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              {/* Active Indicator Top Pill */}
              <View
                style={[
                  styles.activePill,
                  active && styles.activePillVisible,
                ]}
              />

              <View
                style={[
                  styles.iconBox,
                  active && styles.iconBoxActive,
                ]}
              >
                <Text style={styles.tabIcon}>{item.icon}</Text>
              </View>

              <Text
                style={[
                  styles.tabLabel,
                  active && styles.tabLabelActive,
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNavContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    width: '100%',
    zIndex: 100,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 -4px 16px rgba(15, 23, 42, 0.08)',
          position: 'sticky' as any,
          bottom: 0,
        }
      : {
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 8,
        }),
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  activePill: {
    position: 'absolute',
    top: -6,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  activePillVisible: {
    backgroundColor: colors.primary,
  },
  iconBox: {
    width: 36,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconBoxActive: {
    backgroundColor: '#eef2ff',
  },
  tabIcon: {
    fontSize: 16,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '800',
  },
});
