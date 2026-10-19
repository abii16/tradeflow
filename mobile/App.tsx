import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import LaunchSplashScreen from './src/components/LaunchSplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import AuthScreen from './src/screens/AuthScreen';
import CargoFeedScreen from './src/screens/CargoFeedScreen';
import DriverScreen from './src/screens/DriverScreen';
import { AuthUser } from './src/types/auth';
import { initDatabase, getCurrentUserSession, clearUserSession } from './src/services/database';

function MainApp() {
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeRole, setActiveRole] = useState<'transporter' | 'driver'>('transporter');
  const [splashActive, setSplashActive] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        const session = await getCurrentUserSession();
        if (session) {
          setCurrentUser(session);
          setActiveRole(session.role === 'DRIVER' ? 'driver' : 'transporter');
          setIsOnboardingCompleted(true);
        }
      } catch (err) {
        console.warn('Failed to load session:', err);
      } finally {
        setIsAppReady(true);
      }
    })();
  }, []);

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setActiveRole(user.role === 'DRIVER' ? 'driver' : 'transporter');
    setIsOnboardingCompleted(true);
  };

  const handleSignOut = async () => {
    await clearUserSession();
    setCurrentUser(null);
    setIsOnboardingCompleted(false);
  };

  // 1. Initial Animated Launch Screen
  if (splashActive) {
    return (
      <LaunchSplashScreen
        isReady={isAppReady}
        onFinish={() => setSplashActive(false)}
      />
    );
  }

  // 2. Cinematic Onboarding Screen (assets/image.png)
  if (!currentUser && !isOnboardingCompleted) {
    return (
      <OnboardingScreen
        onGetStarted={() => setIsOnboardingCompleted(true)}
      />
    );
  }

  // 3. Main Role-Based Experience (AuthScreen, DriverScreen, or CargoFeedScreen)
  return (
    <View
      style={[
        styles.rootContainer,
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
        <AuthScreen
          onLoginSuccess={handleLoginSuccess}
          onBack={() => setIsOnboardingCompleted(false)}
        />
      ) : activeRole === 'driver' ? (
        <DriverScreen
          currentUser={currentUser}
          onSignOut={handleSignOut}
          activeRole={activeRole}
          onSelectRole={setActiveRole}
        />
      ) : (
        <CargoFeedScreen
          currentUser={currentUser}
          onSignOut={handleSignOut}
          activeRole={activeRole}
          onSelectRole={setActiveRole}
        />
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <MainApp />
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
});
