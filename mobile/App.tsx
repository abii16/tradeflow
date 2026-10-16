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
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

function MainApp() {
  const { theme, isDarkMode } = useTheme();
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
      <View style={[styles.screen, styles.center, { backgroundColor: theme.colors.background }]}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {!currentUser ? (
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      ) : (
        <>
          <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {activeRole === 'transporter' ? (
              <CargoFeedScreen
                currentUser={currentUser}
                onSignOut={handleSignOut}
                activeRole={activeRole}
                onSelectRole={setActiveRole}
              />
            ) : (
              <DriverScreen
                currentUser={currentUser}
                onSignOut={handleSignOut}
                activeRole={activeRole}
                onSelectRole={setActiveRole}
              />
            )}
          </View>

          {/* Bottom Actor Navigation Bar (Padded above Android/iOS system navigation) */}
          <View
            style={[
              styles.bottomNav,
              {
                backgroundColor: theme.colors.surface,
                borderTopColor: theme.colors.cardBorder,
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
                color={activeRole === 'transporter' ? theme.colors.primary : theme.colors.textMuted}
              />
              <Text
                style={[
                  styles.navLabel,
                  { color: activeRole === 'transporter' ? theme.colors.primary : theme.colors.textMuted },
                  activeRole === 'transporter' && styles.navLabelBold,
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
                color={activeRole === 'driver' ? theme.colors.blue : theme.colors.textMuted}
              />
              <Text
                style={[
                  styles.navLabel,
                  { color: activeRole === 'driver' ? theme.colors.blue : theme.colors.textMuted },
                  activeRole === 'driver' && styles.navLabelBold,
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
      <ThemeProvider>
        <MainApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
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
    fontSize: 11,
    fontWeight: '500',
  },
  navLabelBold: {
    fontWeight: '700',
  },
});
