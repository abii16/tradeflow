import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import CargoFeedScreen from './src/screens/CargoFeedScreen';
import DriverScreen from './src/screens/DriverScreen';
import AuthScreen from './src/screens/AuthScreen';
import { AuthUser } from './src/types/auth';
import { initDatabase, getCurrentUserSession, clearUserSession } from './src/services/database';
import { THEME } from './src/styles/theme';

function MainApp() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeRole, setActiveRole] = useState<'transporter' | 'driver'>('transporter');
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        const session = await getCurrentUserSession();
        if (session) {
          setCurrentUser(session);
          setActiveRole(session.role === 'DRIVER' ? 'driver' : 'transporter');
        }
      } catch (err) {
        console.warn('Failed to load session:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setActiveRole(user.role === 'DRIVER' ? 'driver' : 'transporter');
  };

  const handleSignOut = async () => {
    await clearUserSession();
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <StatusBar style="light" />
      </View>
    );
  }

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

      {!currentUser ? (
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      ) : (
        <>
          <View style={styles.container}>
            {activeRole === 'transporter' ? (
              <CargoFeedScreen
                currentUser={currentUser}
                onSignOut={handleSignOut}
              />
            ) : (
              <DriverScreen
                currentUser={currentUser}
                onSignOut={handleSignOut}
              />
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
        </>
      )}
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
  center: {
    alignItems: 'center',
    justifyContent: 'center',
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
