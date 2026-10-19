// TradeFlow Mobile — Cinematic Freight Onboarding Screen
// - Clean full-screen background imagery (no top text or badges)
// - Glassmorphic "Get Started" capsule container
// - Interactive Slide-to-Start: User drags the circular arrow thumb from left to right to enter the Sign In screen
// - No trailing arrow on the right

import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ImageBackground,
  Animated,
  PanResponder,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  onGetStarted: () => void;
}

const THUMB_SIZE = 52;
const PADDING = 6;
const DEFAULT_CONTAINER_WIDTH = 320;

export default function OnboardingScreen({ onGetStarted }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const [containerWidth, setContainerWidth] = useState(DEFAULT_CONTAINER_WIDTH);
  const maxDrag = Math.max(1, containerWidth - THUMB_SIZE - PADDING * 2);
  const maxDragRef = useRef(maxDrag);
  maxDragRef.current = maxDrag;

  const pan = useRef(new Animated.Value(0)).current;
  const isComplete = useRef(false);

  // Subtle pulse animation on the draggable thumb
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, []);

  // PanResponder to handle the slide gesture from left to right
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 3,
      onPanResponderGrant: () => {
        // Active touch
      },
      onPanResponderMove: (_, gesture) => {
        if (isComplete.current) return;
        const targetMax = maxDragRef.current;
        if (gesture.dx <= 0) {
          pan.setValue(0);
        } else if (gesture.dx >= targetMax) {
          pan.setValue(targetMax);
        } else {
          pan.setValue(gesture.dx);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (isComplete.current) return;
        const targetMax = maxDragRef.current;

        // If swiped past 60% of the track, complete the action!
        if (gesture.dx >= targetMax * 0.6) {
          isComplete.current = true;
          Animated.timing(pan, {
            toValue: targetMax,
            duration: 160,
            useNativeDriver: true,
          }).start(() => {
            onGetStarted();
            // Reset position if user navigates back later
            setTimeout(() => {
              pan.setValue(0);
              isComplete.current = false;
            }, 800);
          });
        } else {
          // Spring back smoothly to the left start position
          Animated.spring(pan, {
            toValue: 0,
            friction: 7,
            tension: 45,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Fade out "Get Started" text as the thumb slides over it
  const textOpacity = pan.interpolate({
    inputRange: [0, maxDrag * 0.55],
    outputRange: [1, 0.12],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ── CINEMATIC FULLSCREEN BACKGROUND (NO TOP TEXT) ── */}
      <ImageBackground
        source={require('../../assets/image.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Subtle Bottom Darkening Vignette for text & button legibility */}
        <View style={styles.bottomVignetteOuter} />
        <View style={styles.bottomVignetteInner} />

        {/* ── BOTTOM ACTION: HEADLINE, SUBTITLE & GLASSMORHPIC SLIDE-TO-START PILL ── */}
        <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom + 20, 36) }]}>
          {/* Headline & Paragraph */}
          <View style={styles.contentContainer}>
            <Text style={styles.headline}>
              {t('onboarding_headline')}
            </Text>
            <Text style={styles.subtitle}>
              {t('onboarding_subtitle')}
            </Text>
          </View>

          <View
            style={styles.sliderContainer}
            onLayout={(e) => {
              const width = e.nativeEvent.layout.width;
              if (width > 0 && Math.abs(width - containerWidth) > 2) {
                setContainerWidth(width);
              }
            }}
          >
            {/* Glassmorphic Outer Capsule */}
            <View style={styles.glassCapsule}>
              {/* Luminous Inner Highlight Line */}
              <View style={styles.glassHighlight} />

              {/* Centered "Get Started" Label (Fades when dragging) */}
              <Animated.View style={[styles.labelContainer, { opacity: textOpacity }]}>
                <Text style={styles.getStartedLabel}>
                  {t('get_started')}
                </Text>
              </Animated.View>

              {/* Draggable Circular Orange Arrow Thumb */}
              <Animated.View
                style={[
                  styles.thumbWrapper,
                  {
                    transform: [{ translateX: pan }],
                  },
                ]}
                {...panResponder.panHandlers}
              >
                <Animated.View
                  style={[
                    styles.thumbCircle,
                    {
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}
                >
                  <Feather name="arrow-right" size={22} color="#FFFFFF" />
                </Animated.View>
              </Animated.View>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },

  // ── Bottom Vignette Layers ──
  bottomVignetteOuter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 420,
    backgroundColor: 'rgba(3, 7, 18, 0.35)',
  },
  bottomVignetteInner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 230,
    backgroundColor: 'rgba(3, 7, 18, 0.45)',
  },

  // ── Bottom Action Container ──
  bottomSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
  },

  // ── Bottom Headline & Subtitle Content ──
  contentContainer: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    marginBottom: 26,
    paddingHorizontal: 8,
  },
  headline: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
    lineHeight: 34,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 10,
    paddingHorizontal: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  sliderContainer: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },

  // ── Glassmorphic Capsule ──
  glassCapsule: {
    width: '100%',
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: PADDING,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },

  // ── Centered Label ──
  labelContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedLabel: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 6,
  },

  // ── Draggable Thumb ──
  thumbWrapper: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbCircle: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
});
