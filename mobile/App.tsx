import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import CargoFeedScreen from './src/screens/CargoFeedScreen';
import DriverScreen from './src/screens/DriverScreen';
import { THEME } from './src/styles/theme';

function MainApp() {
  const [activeRole, setActiveRole] = useState<'transporter' | 'driver'>('transporter');
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <StatusBar style="light" />
      <View style={styles.container}>
        {activeRole === 'transporter' ? (
          <CargoFeedScreen />
        ) : (
          <DriverScreen />
        )}
      </View>

      {/* Bottom Actor Navigation Bar (Padded above Android/iOS system navigation) */}
      <View
        style={[
          styles.bottomNav,
          {
            paddingBottom: Math.max(insets.bottom, 14),
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.navTab, activeRole === 'transporter' && styles.navTabActive]}
          onPress={() => setActiveRole('transporter')}
          activeOpacity={0.7}
        >
          <Feather
            name="truck"
            size={18}
            color={activeRole === 'transporter' ? THEME.colors.primary : THEME.colors.textMuted}
          />
          <Text
            style={[
              styles.navLabel,
              activeRole === 'transporter' && styles.navLabelActive,
            ]}
          >
            Transporter
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeRole === 'driver' && styles.navTabActive]}
          onPress={() => setActiveRole('driver')}
          activeOpacity={0.7}
        >
          <Feather
            name="navigation"
            size={18}
            color={activeRole === 'driver' ? THEME.colors.primary : THEME.colors.textMuted}
          />
          <Text
            style={[
              styles.navLabel,
              activeRole === 'driver' && styles.navLabelActive,
            ]}
          >
            Driver Console
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.cardBorder,
    paddingTop: 10,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  navTabActive: {},
  navLabel: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  navLabelActive: {
    color: THEME.colors.primary,
    fontWeight: '700',
  },
});
