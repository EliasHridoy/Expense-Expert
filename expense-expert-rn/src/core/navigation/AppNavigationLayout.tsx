import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';

export interface AppNavigationLayoutProps {
  children: React.ReactNode;
  activeRoute?: string;
  onNavigate?: (route: string) => void;
  onSignOut?: () => void;
  testID?: string;
}

export const AppNavigationLayout: React.FC<AppNavigationLayoutProps> = ({
  children,
  activeRoute,
  onNavigate,
  onSignOut,
  testID = 'app-navigation-layout',
}) => {
  return (
    <View testID={testID} style={styles.container}>
      {/* Top Navigation Bar */}
      <Navbar
        activeRoute={activeRoute}
        onNavigate={onNavigate}
        onSignOut={onSignOut}
      />

      {/* Screen Content */}
      <View style={styles.content}>
        {children}
      </View>

      {/* Bottom Navigation Tab Bar (Mobile / Responsive) */}
      <BottomNav
        activeRoute={activeRoute}
        onNavigate={onNavigate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: '100%',
    backgroundColor: '#f8fafc',
    flexDirection: 'column',
  },
  content: {
    flex: 1,
    minHeight: '100%',
    width: '100%',
  },
});
