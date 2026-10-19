// TradeFlow Mobile — Official Google Sign-In Button (Google Identity Guidelines)
import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export function GoogleGLogo({ size = 19 }: { size?: number }) {
  return (
    <Image
      source={require('../../assets/google-logo.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}

interface Props {
  onPress: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export default function GoogleSignInButton({ onPress, disabled = false, isLoading = false }: Props) {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();

  const bgColor = isDarkMode ? '#131314' : '#FFFFFF';
  const borderColor = isDarkMode ? '#3C4043' : '#DADCE0';
  const textColor = isDarkMode ? '#E3E3E3' : '#1F1F1F';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: bgColor,
          borderColor: borderColor,
        },
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.85}
    >
      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator size="small" color={isDarkMode ? '#FFFFFF' : '#4285F4'} />
        ) : (
          <View style={styles.logoWrapper}>
            <GoogleGLogo size={19} />
          </View>
        )}
        <Text
          style={[
            styles.text,
            {
              color: textColor,
            },
          ]}
        >
          {t('continue_with_google')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 2,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logoWrapper: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.25,
    fontFamily: Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  disabled: {
    opacity: 0.6,
  },
});
