import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import CargoFeedScreen from './src/screens/CargoFeedScreen';
import DriverScreen from './src/screens/DriverScreen';
import { THEME } from './src/styles/theme';

export default function App() {
  const [activeRole, setActiveRole] = useState<'transporter' | 'driver'>('transporter');

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="light" />
        <View style={styles.container}>
          {activeRole === 'transporter' ? (
            <CargoFeedScreen />
          ) : (
            <DriverScreen />
          )}
        </View>

        {/* Bottom Actor Navigation Bar (Transporter vs Driver) */}
        <View style={styles.bottomNav}>
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
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
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
