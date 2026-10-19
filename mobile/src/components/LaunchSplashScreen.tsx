import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Animated,
  Platform,
  Easing,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';

interface Props {
  isReady: boolean;
  onFinish: () => void;
}

export default function LaunchSplashScreen({ isReady, onFinish }: Props) {
  const { theme, isDarkMode } = useTheme();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pathTravelAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Looping subtle breathing pulse for the logo container
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 3. Continuous moving path pulse animation
    const pathLoop = Animated.loop(
      Animated.timing(pathTravelAnim, {
        toValue: 1,
        duration: 1600,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      })
    );
    pathLoop.start();

    return () => {
      pulseLoop.stop();
      pathLoop.stop();
    };
  }, []);

  // When app is ready and minimum display time elapsed (2.3s), fade out
  useEffect(() => {
    if (isReady) {
      const exitTimer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          onFinish();
        });
      }, 2300);

      return () => clearTimeout(exitTimer);
    }
  }, [isReady]);

  const markerTranslateX = pathTravelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 210],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          opacity: fadeAnim,
        },
      ]}
    >
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      <Animated.View
        style={[
          styles.contentBox,
          {
            transform: [{ scale: scaleAnim }, { scale: pulseAnim }],
          },
        ]}
      >
        {/* Moving Animated GIF Logo with Paths in Motion */}
        <View style={styles.logoWrapper}>
          <Image
            source={require('../../assets/tradeflow-launch.gif')}
            style={styles.movingLogo}
            resizeMode="contain"
          />
        </View>

        {/* Brand Title */}
        <Text style={[styles.brandTitle, { color: theme.colors.textPrimary }]}>
          TradeFlow
        </Text>

        <Text style={[styles.brandSubtitle, { color: theme.colors.textMuted }]}>
          Smart Freight & Trade Network
        </Text>

        {/* Dynamic Moving Corridor Path */}
        <View style={styles.corridorTrackWrapper}>
          <View style={[styles.corridorLineBase, { backgroundColor: theme.colors.cardBorder }]} />

          {/* Active moving light packet along the corridor path */}
          <Animated.View
            style={[
              styles.corridorPulseMarker,
              {
                backgroundColor: theme.colors.primary,
                transform: [{ translateX: markerTranslateX }],
              },
            ]}
          />

          <View style={styles.corridorNodesRow}>
            <View style={styles.corridorNode}>
              <View style={[styles.nodeDot, { backgroundColor: theme.colors.primary }]} />
              <Text style={[styles.nodeLabel, { color: theme.colors.textMuted }]}>Addis</Text>
            </View>
            <View style={styles.corridorNode}>
              <View style={[styles.nodeDot, { backgroundColor: theme.colors.primary }]} />
              <Text style={[styles.nodeLabel, { color: theme.colors.textMuted }]}>Modjo</Text>
            </View>
            <View style={styles.corridorNode}>
              <View style={[styles.nodeDot, { backgroundColor: theme.colors.blue }]} />
              <Text style={[styles.nodeLabel, { color: theme.colors.textMuted }]}>Hawassa</Text>
            </View>
          </View>
        </View>

      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  contentBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoWrapper: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  movingLogo: {
    width: 190,
    height: 190,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
    marginBottom: 20,
  },
  corridorTrackWrapper: {
    width: 220,
    height: 38,
    justifyContent: 'center',
    marginBottom: 18,
    position: 'relative',
  },
  corridorLineBase: {
    position: 'absolute',
    top: 9,
    left: 12,
    right: 12,
    height: 2,
    borderRadius: 1,
  },
  corridorPulseMarker: {
    position: 'absolute',
    top: 6,
    width: 20,
    height: 8,
    borderRadius: 4,
    opacity: 0.85,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  corridorNodesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  corridorNode: {
    alignItems: 'center',
    gap: 4,
  },
  nodeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  nodeLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});
