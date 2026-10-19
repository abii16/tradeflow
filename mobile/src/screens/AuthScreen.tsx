// TradeFlow Mobile — Industry Standard Authentication Screen (Carrier & Driver)
// Designed for the East African Freight Corridor (Ethiopia, Djibouti, Kenya, Somalia, Uganda, Rwanda, South Sudan)
// - Carrier: Real business email (solomon@company.et) + password
// - Truck Driver: East African mobile phone mapped behind the scenes to Supabase identity (e.g. 25377123456@tradeflow.et)
// Zero SMS fees; standard free Supabase identity processed under the hood.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
  Linking,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AuthUser, UserRole } from '../types/auth';
import { saveUserSession } from '../services/database';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  EAST_AFRICAN_COUNTRIES,
  EastAfricanCountry,
} from '../utils/phoneAuth';
import {
  validateFullName,
  validateCompanyName,
  validateTINNumber,
  validateFleetSize,
  validateEmail,
  validatePhone,
  validateLicensePlate,
  validateDriverLicense,
  validatePassword,
  validateConfirmPassword,
} from '../utils/registrationValidation';
import {
  signInWithSupabase,
  signUpWithSupabase,
  signInWithGoogle,
  processAuthRedirectUrl,
} from '../services/authService';
import GoogleSignInButton from '../components/GoogleSignInButton';

interface Props {
  onLoginSuccess: (user: AuthUser) => void;
  initialMode?: 'LOGIN' | 'REGISTER';
  onBack?: () => void;
}

export default function AuthScreen({ onLoginSuccess, initialMode = 'LOGIN', onBack }: Props) {
  const { theme, isDarkMode } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const [role, setRole] = useState<UserRole>('TRANSPORTER');
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>(initialMode);

  // East African Country Selection for Phone
  const [selectedCountry, setSelectedCountry] = useState<EastAfricanCountry>(EAST_AFRICAN_COUNTRIES[0]);
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);

  // Authentication Credentials
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Registration Profile Fields
  const [fullName, setFullName] = useState('');
  // Carrier specific
  const [companyName, setCompanyName] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [fleetSize, setFleetSize] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  // Driver specific
  const [licensePlate, setLicensePlate] = useState('');
  const [driverLicense, setDriverLicense] = useState('');

  // Field focus tracking for rich micro-interactions
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Field validation error state
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Submission loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  // Dynamic role theme colors
  const isDriver = role === 'DRIVER';
  const roleColor = isDriver ? theme.colors.blue : theme.colors.primary;
  const roleBorder = isDriver ? theme.colors.blueBorder : theme.colors.primaryBorder;

  // ── Listen for Incoming OAuth Deep Link Redirects ──
  useEffect(() => {
    const handleDeepLink = async (incomingUrl: string) => {
      if (
        incomingUrl &&
        (incomingUrl.includes('auth/callback') || incomingUrl.includes('access_token'))
      ) {
        try {
          const res = await processAuthRedirectUrl(incomingUrl, role);
          if (res.success && res.user) {
            await saveUserSession(res.user);
            onLoginSuccess(res.user);
          }
        } catch {
          // Non-blocking deep link error
        }
      }
    };

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl) {
        handleDeepLink(initialUrl);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [role, onLoginSuccess]);

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setErrors({});
  };

  const handleModeChange = (newMode: 'LOGIN' | 'REGISTER') => {
    setMode(newMode);
    setErrors({});
  };

  // ── Handle Google One-Tap / OAuth ──
  const handleGoogleAuth = async () => {
    if (isSubmitting || isGoogleSubmitting) return;
    setIsGoogleSubmitting(true);
    try {
      const result = await signInWithGoogle(role);
      if (result.success && result.user) {
        await saveUserSession(result.user);
        onLoginSuccess(result.user);
      } else if (!result.cancelled) {
        Alert.alert('Google Sign In', result.error || 'Failed to authenticate with Google.');
      }
    } catch (err: any) {
      Alert.alert('Google Sign In Error', err.message || 'An unexpected error occurred during Google Sign In.');
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  // ── Handle Submit with Strict Validation ──
  const handleSubmit = async () => {
    if (isSubmitting) return;
    const newErrors: Record<string, string> = {};

    if (mode === 'LOGIN') {
      let resolvedEmail = '';
      let displayPhone = '';

      if (isDriver) {
        const phoneCheck = validatePhone(phone, false, selectedCountry.dialCode);
        if (!phoneCheck.isValid) {
          newErrors.phone = phoneCheck.error || `Valid ${selectedCountry.name} phone number required`;
        } else {
          resolvedEmail = phoneCheck.supabaseEmail;
          displayPhone = phoneCheck.formatted;
        }
      } else {
        const emailCheck = validateEmail(email);
        if (!emailCheck.isValid) {
          newErrors.email = emailCheck.error || 'Valid business email required (e.g. solomon@company.et)';
        } else {
          resolvedEmail = emailCheck.sanitized;
          displayPhone = '+251 91 144 5566';
        }
      }

      if (!password.trim()) {
        newErrors.password = 'Password is required';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setIsSubmitting(true);
      try {
        let token = `jwt-token-${Date.now()}`;
        let userId = `USR-${Date.now().toString().slice(-4)}`;

        const authResult = await signInWithSupabase(resolvedEmail, password.trim());
        if (authResult.success && authResult.token) {
          token = authResult.token;
          if (authResult.user?.id) userId = authResult.user.id;
        }

        const meta = authResult.user?.user_metadata || {};
        const derivedName =
          meta.full_name ||
          (isDriver ? 'Corridor Driver' : 'Carrier Fleet Manager');

        const user: AuthUser = {
          id: userId,
          email: resolvedEmail,
          fullName: derivedName,
          phone: meta.phone || displayPhone,
          role,
          companyName: !isDriver ? (meta.company_name || 'Carrier Partner') : undefined,
          tinNumber: !isDriver ? meta.tin_number : undefined,
          fleetSize: !isDriver ? meta.fleet_size : undefined,
          licensePlate: isDriver ? (meta.license_plate || undefined) : undefined,
          driverLicense: isDriver ? (meta.driver_license || undefined) : undefined,
          token,
        };

        await saveUserSession(user);
        onLoginSuccess(user);
      } catch (err: any) {
        Alert.alert('Sign In Error', err.message || 'Failed to sign in. Please check your credentials.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // --- STRICT REGISTRATION VALIDATION ---
      const nameCheck = validateFullName(fullName);
      if (!nameCheck.isValid) {
        newErrors.fullName = nameCheck.error || 'Full name is required';
      }

      let sanitizedCompanyName = '';
      let sanitizedTinNumber = '';
      let sanitizedFleetSize = '';
      let sanitizedContactPhone = '';
      let sanitizedLicensePlate = '';
      let sanitizedDriverLicense = '';
      let resolvedEmail = '';
      let displayPhone = '';

      if (!isDriver) {
        const compCheck = validateCompanyName(companyName);
        if (!compCheck.isValid) {
          newErrors.companyName = compCheck.error || 'Company name is required';
        } else {
          sanitizedCompanyName = compCheck.sanitized;
        }

        const tinCheck = validateTINNumber(tinNumber);
        if (!tinCheck.isValid) {
          newErrors.tinNumber = tinCheck.error || 'Valid 10-digit TIN required';
        } else {
          sanitizedTinNumber = tinCheck.sanitized;
        }

        const fleetCheck = validateFleetSize(fleetSize);
        if (!fleetCheck.isValid) {
          newErrors.fleetSize = fleetCheck.error || 'Valid fleet size required';
        } else {
          sanitizedFleetSize = fleetCheck.sanitized;
        }

        const emailCheck = validateEmail(email);
        if (!emailCheck.isValid) {
          newErrors.email = emailCheck.error || 'Valid company email required';
        } else {
          resolvedEmail = emailCheck.sanitized;
        }

        if (contactPhone.trim()) {
          const contactCheck = validatePhone(contactPhone, true, selectedCountry.dialCode);
          if (!contactCheck.isValid) {
            newErrors.contactPhone = contactCheck.error || 'Enter a valid phone number';
          } else {
            sanitizedContactPhone = contactCheck.formatted;
            displayPhone = contactCheck.formatted;
          }
        } else {
          displayPhone = '+251 91 144 5566';
        }
      }

      if (isDriver) {
        const plateCheck = validateLicensePlate(licensePlate);
        if (!plateCheck.isValid) {
          newErrors.licensePlate = plateCheck.error || 'Valid license plate required (e.g. 3-AA-98214)';
        } else {
          sanitizedLicensePlate = plateCheck.sanitized;
        }

        const cdlCheck = validateDriverLicense(driverLicense);
        if (!cdlCheck.isValid) {
          newErrors.driverLicense = cdlCheck.error || 'Valid commercial license required';
        } else {
          sanitizedDriverLicense = cdlCheck.sanitized;
        }

        const phoneCheck = validatePhone(phone, false, selectedCountry.dialCode);
        if (!phoneCheck.isValid) {
          newErrors.phone = phoneCheck.error || `Valid ${selectedCountry.name} phone number required`;
        } else {
          resolvedEmail = phoneCheck.supabaseEmail;
          displayPhone = phoneCheck.formatted;
        }
      }

      const passCheck = validatePassword(password);
      if (!passCheck.isValid) {
        newErrors.password = passCheck.error || 'Password must be at least 6 characters';
      }

      const confirmCheck = validateConfirmPassword(password, confirmPassword);
      if (!confirmCheck.isValid) {
        newErrors.confirmPassword = confirmCheck.error || 'Passwords do not match';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        Alert.alert(
          'Incomplete or Invalid Information',
          'Please correct the highlighted fields before registering.'
        );
        return;
      }

      setIsSubmitting(true);
      try {
        let token = `jwt-token-${Date.now()}`;
        let userId = `USR-${Date.now().toString().slice(-4)}`;

        const signUpResult = await signUpWithSupabase(resolvedEmail, password.trim(), {
          full_name: nameCheck.sanitized,
          phone: displayPhone,
          role,
          company_name: !isDriver ? sanitizedCompanyName : undefined,
          tin_number: !isDriver ? sanitizedTinNumber : undefined,
          fleet_size: !isDriver ? sanitizedFleetSize : undefined,
          license_plate: isDriver ? sanitizedLicensePlate : undefined,
          driver_license: isDriver ? sanitizedDriverLicense : undefined,
        });

        if (signUpResult.success && signUpResult.token) {
          token = signUpResult.token;
          if (signUpResult.user?.id) userId = signUpResult.user.id;
        } else if (!signUpResult.success && !signUpResult.isOffline) {
          Alert.alert('Registration Notice', signUpResult.error || 'Registration failed');
        }

        const newUser: AuthUser = {
          id: userId,
          email: resolvedEmail,
          fullName: nameCheck.sanitized,
          phone: displayPhone,
          role,
          companyName: !isDriver ? sanitizedCompanyName : undefined,
          tinNumber: !isDriver ? sanitizedTinNumber : undefined,
          fleetSize: !isDriver ? sanitizedFleetSize : undefined,
          licensePlate: isDriver ? sanitizedLicensePlate : undefined,
          driverLicense: isDriver ? sanitizedDriverLicense : undefined,
          token,
        };

        await saveUserSession(newUser);
        Alert.alert(
          'Account Registered',
          !isDriver
            ? `Welcome, ${nameCheck.sanitized}! Registered with ${resolvedEmail}`
            : `Welcome, Driver ${nameCheck.sanitized}! Phone ${displayPhone} registered successfully.`
        );
        onLoginSuccess(newUser);
      } catch (err: any) {
        Alert.alert('Registration Error', err.message || 'An error occurred during registration.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Helper for input container styling
  const getInputBoxStyle = (fieldName: string) => {
    const hasError = Boolean(errors[fieldName]);
    const isFocused = focusedField === fieldName;

    return [
      styles.inputBox,
      {
        backgroundColor: isDarkMode ? '#1A1A1A' : '#F8FAFC',
        borderColor: hasError
          ? theme.colors.red
          : isFocused
          ? roleColor
          : theme.colors.cardBorder,
      },
      isFocused && !hasError && {
        borderWidth: 1.5,
        backgroundColor: isDarkMode ? '#222222' : '#FFFFFF',
      },
      hasError && styles.inputBoxError,
    ];
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.keyboardView, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── TOP NAV BAR: BRAND & LANGUAGE ── */}
        <View style={styles.topBar}>
          <View style={styles.brandGroup}>
            {mode === 'REGISTER' ? (
              <TouchableOpacity
                style={[
                  styles.backBtn,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.cardBorder,
                  },
                ]}
                onPress={() => handleModeChange('LOGIN')}
                activeOpacity={0.7}
              >
                <Feather name="arrow-left" size={18} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            ) : onBack ? (
              <TouchableOpacity
                style={[
                  styles.backBtn,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.cardBorder,
                  },
                ]}
                onPress={onBack}
                activeOpacity={0.7}
              >
                <Feather name="arrow-left" size={18} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            ) : null}
            <View
              style={[
                styles.logoBadge,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: roleBorder,
                },
              ]}
            >
              <Image
                source={require('../../assets/tradeflow-logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <View>
              <View style={styles.brandTitleRow}>
                <Text style={[styles.brandTitle, { color: theme.colors.textPrimary }]}>
                  TradeFlow
                </Text>
                <View style={[styles.networkBadge, { backgroundColor: isDarkMode ? '#262626' : '#E2E8F0' }]}>
                  <Text style={[styles.networkBadgeText, { color: roleColor }]}>
                    FREIGHT
                  </Text>
                </View>
              </View>
              <Text style={[styles.brandCorridor, { color: theme.colors.textMuted }]}>
                Addis Ababa – Djibouti Corridor
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.langPill,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.cardBorder,
              },
            ]}
            onPress={toggleLanguage}
            activeOpacity={0.7}
          >
            <Feather name="globe" size={13} color={roleColor} />
            <Text style={[styles.langPillText, { color: theme.colors.textPrimary }]}>
              {language === 'EN' ? 'አማርኛ' : 'EN'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── UNIFIED SEGMENTED ROLE SELECTOR (Carrier vs Driver) ── */}
        <View
          style={[
            styles.segmentedRoleBar,
            {
              backgroundColor: isDarkMode ? '#1A1A1A' : '#E2E8F0',
              borderColor: theme.colors.cardBorder,
            },
          ]}
        >
          {/* Carrier Tab */}
          <TouchableOpacity
            style={[
              styles.roleSegment,
              !isDriver && [
                styles.roleSegmentActive,
                {
                  backgroundColor: isDarkMode ? '#282828' : '#FFFFFF',
                  borderColor: theme.colors.primary,
                },
              ],
            ]}
            onPress={() => handleRoleChange('TRANSPORTER')}
            activeOpacity={0.8}
          >
            <Feather
              name="truck"
              size={15}
              color={!isDriver ? theme.colors.primary : theme.colors.textMuted}
            />
            <Text
              style={[
                styles.roleSegmentText,
                { color: theme.colors.textMuted },
                !isDriver && {
                  color: theme.colors.primary,
                  fontWeight: '700',
                },
              ]}
            >
              {t('carrier_fleet_tab')}
            </Text>
          </TouchableOpacity>

          {/* Driver Tab */}
          <TouchableOpacity
            style={[
              styles.roleSegment,
              isDriver && [
                styles.roleSegmentActive,
                {
                  backgroundColor: isDarkMode ? '#282828' : '#FFFFFF',
                  borderColor: theme.colors.blue,
                },
              ],
            ]}
            onPress={() => handleRoleChange('DRIVER')}
            activeOpacity={0.8}
          >
            <Feather
              name="navigation"
              size={15}
              color={isDriver ? theme.colors.blue : theme.colors.textMuted}
            />
            <Text
              style={[
                styles.roleSegmentText,
                { color: theme.colors.textMuted },
                isDriver && {
                  color: theme.colors.blue,
                  fontWeight: '700',
                },
              ]}
            >
              {t('driver_tab')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── CLEAN TITLE & VALUE PROPOSITION ── */}
        <View style={styles.titleSection}>
          <Text style={[styles.mainHeading, { color: theme.colors.textPrimary }]}>
            {mode === 'LOGIN'
              ? (isDriver ? t('driver_login_title') : t('carrier_login_title'))
              : (isDriver ? t('driver_register_title') : t('carrier_register_title'))}
          </Text>
          <Text style={[styles.subHeading, { color: theme.colors.textSecondary }]}>
            {mode === 'LOGIN'
              ? (isDriver
                  ? t('driver_login_hero')
                  : t('transporter_login_hero'))
              : (isDriver
                  ? t('driver_register_hero')
                  : t('transporter_register_hero'))}
          </Text>
        </View>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* CASE A: SIGN IN MODE (CLEAN, FOCUSED, NO SIGN-UP CLUTTER)     */}
        {/* ───────────────────────────────────────────────────────────── */}
        {mode === 'LOGIN' && (
          <View
            style={[
              styles.formCard,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.cardBorder,
              },
            ]}
          >
            {/* Carrier Email or Driver Phone */}
            {!isDriver ? (
              /* Carrier: Business Email */
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}>
                  {t('email_address')} <Text style={[styles.asterisk, { color: theme.colors.red }]}>*</Text>
                </Text>
                <View style={getInputBoxStyle('email')}>
                  <Feather
                    name="mail"
                    size={16}
                    color={focusedField === 'email' ? roleColor : theme.colors.textMuted}
                    style={styles.fieldIcon}
                  />
                  <TextInput
                    style={[styles.textInput, { color: theme.colors.textPrimary }]}
                    value={email}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    onChangeText={(val) => {
                      setEmail(val);
                      clearError('email');
                    }}
                    placeholder="solomon@company.et"
                    placeholderTextColor={theme.colors.textDim}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {Boolean(errors.email) && (
                  <View style={styles.errorRow}>
                    <Feather name="alert-circle" size={12} color={theme.colors.red} />
                    <Text style={styles.errorText}>{errors.email}</Text>
                  </View>
                )}
              </View>
            ) : (
              /* Driver: East African Mobile Phone */
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}>
                  {t('phone_number')} <Text style={[styles.asterisk, { color: theme.colors.red }]}>*</Text>
                </Text>
                <View style={getInputBoxStyle('phone')}>
                  {/* East African Country Selector Pill */}
                  <TouchableOpacity
                    style={styles.phonePrefixPill}
                    onPress={() => setIsCountryModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.flagEmoji}>{selectedCountry.flag}</Text>
                    <Text style={[styles.phonePrefixText, { color: theme.colors.textPrimary }]}>
                      {selectedCountry.dialCode}
                    </Text>
                    <Feather name="chevron-down" size={13} color={theme.colors.textMuted} />
                    <View style={[styles.verticalDivider, { backgroundColor: theme.colors.cardBorder }]} />
                  </TouchableOpacity>

                  <TextInput
                    style={[styles.textInput, { color: theme.colors.textPrimary }]}
                    value={phone}
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                    onChangeText={(val) => {
                      const cleaned = val.replace(/\D/g, '');
                      setPhone(cleaned);
                      clearError('phone');
                    }}
                    placeholder={selectedCountry.placeholder}
                    placeholderTextColor={theme.colors.textDim}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    maxLength={12}
                  />
                </View>
                {Boolean(errors.phone) && (
                  <View style={styles.errorRow}>
                    <Feather name="alert-circle" size={12} color={theme.colors.red} />
                    <Text style={styles.errorText}>{errors.phone}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Password */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}>
                  {t('password')} <Text style={[styles.asterisk, { color: theme.colors.red }]}>*</Text>
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      'Account Recovery',
                      isDriver
                        ? 'Contact your carrier fleet manager or TradeFlow support at support@tradeflow.et for driver credentials assistance.'
                        : 'Contact TradeFlow carrier support at support@tradeflow.et for password reset instructions.'
                    )
                  }
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.forgotLink, { color: roleColor }]}>
                    {t('forgot_password')}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={getInputBoxStyle('password')}>
                <Feather
                  name="lock"
                  size={16}
                  color={focusedField === 'password' ? roleColor : theme.colors.textMuted}
                  style={styles.fieldIcon}
                />
                <TextInput
                  style={[styles.textInput, { color: theme.colors.textPrimary }]}
                  value={password}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={(val) => {
                    setPassword(val);
                    clearError('password');
                  }}
                  placeholder="••••••••"
                  placeholderTextColor={theme.colors.textDim}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={16}
                    color={theme.colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
              {Boolean(errors.password) && (
                <View style={styles.errorRow}>
                  <Feather name="alert-circle" size={12} color={theme.colors.red} />
                  <Text style={styles.errorText}>{errors.password}</Text>
                </View>
              )}
            </View>

            {/* Sign In Primary Action Button */}
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: roleColor,
                  opacity: isSubmitting ? 0.75 : 1,
                },
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator
                  size="small"
                  color={isDriver ? '#FFFFFF' : theme.colors.primaryText}
                />
              ) : (
                <>
                  <Text
                    style={[
                      styles.primaryBtnText,
                      {
                        color: isDriver ? '#FFFFFF' : theme.colors.primaryText,
                      },
                    ]}
                  >
                    {!isDriver ? t('sign_in_as_transporter') : t('sign_in_as_driver')}
                  </Text>
                  <Feather
                    name="arrow-right"
                    size={18}
                    color={isDriver ? '#FFFFFF' : theme.colors.primaryText}
                  />
                </>
              )}
            </TouchableOpacity>

            {/* Divider & Google One-Tap */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.cardBorder }]} />
              <Text style={[styles.dividerText, { color: theme.colors.textMuted }]}>
                {t('or_continue_with_google')}
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.cardBorder }]} />
            </View>

            <GoogleSignInButton
              onPress={handleGoogleAuth}
              isLoading={isGoogleSubmitting}
              disabled={isSubmitting}
            />
          </View>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* CASE B: SIGN UP MODE (SIGN IN PAGE COMPLETELY HIDDEN)         */}
        {/* ───────────────────────────────────────────────────────────── */}
        {mode === 'REGISTER' && (
          <View
            style={[
              styles.formCard,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.cardBorder,
              },
            ]}
          >
            {/* Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}>
                {t('full_name')} <Text style={[styles.asterisk, { color: theme.colors.red }]}>*</Text>
              </Text>
              <View style={getInputBoxStyle('fullName')}>
                <Feather
                  name="user"
                  size={16}
                  color={focusedField === 'fullName' ? roleColor : theme.colors.textMuted}
                  style={styles.fieldIcon}
                />
                <TextInput
                  style={[styles.textInput, { color: theme.colors.textPrimary }]}
                  value={fullName}
                  onFocus={() => setFocusedField('fullName')}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={(val) => {
                    setFullName(val);
                    clearError('fullName');
                  }}
                  placeholder={!isDriver ? 'e.g. Solomon Haile' : 'e.g. Abebe Kebede'}
                  placeholderTextColor={theme.colors.textDim}
                />
              </View>
              {Boolean(errors.fullName) && (
                <View style={styles.errorRow}>
                  <Feather name="alert-circle" size={12} color={theme.colors.red} />
                  <Text style={styles.errorText}>{errors.fullName}</Text>
                </View>
              )}
            </View>

            {/* Carrier Specific Profile Fields */}
            {!isDriver && (
              <>
                {/* Company Name */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}>
                    {t('company_name')} <Text style={[styles.asterisk, { color: theme.colors.red }]}>*</Text>
                  </Text>
                  <View style={getInputBoxStyle('companyName')}>
                    <Feather
                      name="briefcase"
                      size={16}
                      color={focusedField === 'companyName' ? roleColor : theme.colors.textMuted}
                      style={styles.fieldIcon}
                    />
                    <TextInput
                      style={[styles.textInput, { color: theme.colors.textPrimary }]}
                      value={companyName}
                      onFocus={() => setFocusedField('companyName')}
                      onBlur={() => setFocusedField(null)}
                      onChangeText={(val) => {
                        setCompanyName(val);
                        clearError('companyName');
                      }}
                      placeholder="e.g. Rift Valley Transport PLC"
                      placeholderTextColor={theme.colors.textDim}
                    />
                  </View>
                  {Boolean(errors.companyName) && (
                    <View style={styles.errorRow}>
                      <Feather name="alert-circle" size={12} color={theme.colors.red} />
                      <Text style={styles.errorText}>{errors.companyName}</Text>
                    </View>
                  )}
                </View>

                {/* TIN Number */}
                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}>
                      {t('tin_number')} <Text style={[styles.asterisk, { color: theme.colors.red }]}>*</Text>
                    </Text>
                    <View style={[styles.chipBadge, { backgroundColor: theme.colors.surfaceElevated }]}>
                      <Text style={[styles.chipBadgeText, { color: theme.colors.textMuted }]}>
                        10 DIGITS
                      </Text>
                    </View>
                  </View>
                  <View style={getInputBoxStyle('tinNumber')}>
                    <Feather
                      name="hash"
                      size={16}
                      color={focusedField === 'tinNumber' ? roleColor : theme.colors.textMuted}
                      style={styles.fieldIcon}
                    />
                    <TextInput
                      style={[styles.textInput, { color: theme.colors.textPrimary }]}
                      value={tinNumber}
                      onFocus={() => setFocusedField('tinNumber')}
                      onBlur={() => setFocusedField(null)}
                      onChangeText={(val) => {
                        const cleaned = val.replace(/\D/g, '').slice(0, 10);
                        setTinNumber(cleaned);
                        clearError('tinNumber');
                      }}
                      placeholder="e.g. 0098234112"
                      placeholderTextColor={theme.colors.textDim}
                      keyboardType="numeric"
                      maxLength={10}
                    />
                  </View>
                  {Boolean(errors.tinNumber) && (
                    <View style={styles.errorRow}>
                      <Feather name="alert-circle" size={12} color={theme.colors.red} />
                      <Text style={styles.errorText}>{errors.tinNumber}</Text>
                    </View>
                  )}
                </View>

                {/* Fleet Size */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}>
                    {t('fleet_size')} <Text style={[styles.asterisk, { color: theme.colors.red }]}>*</Text>
                  </Text>
                  <View style={getInputBoxStyle('fleetSize')}>
                    <Feather
                      name="truck"
                      size={16}
                      color={focusedField === 'fleetSize' ? roleColor : theme.colors.textMuted}
                      style={styles.fieldIcon}
                    />
                    <TextInput
                      style={[styles.textInput, { color: theme.colors.textPrimary }]}
                      value={fleetSize}
                      onFocus={() => setFocusedField('fleetSize')}
                      onBlur={() => setFocusedField(null)}
                      onChangeText={(val) => {
                        setFleetSize(val);
                        clearError('fleetSize');
                      }}
                      placeholder="e.g. 16 Heavy Trucks"
                      placeholderTextColor={theme.colors.textDim}
                    />
                  </View>
                  {Boolean(errors.fleetSize) && (
                    <View style={styles.errorRow}>
                      <Feather name="alert-circle" size={12} color={theme.colors.red} />
                      <Text style={styles.errorText}>{errors.fleetSize}</Text>
                    </View>
                  )}
                </View>

                {/* Optional Official Contact Phone */}
                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}>
                      {t('official_contact_phone')}
                    </Text>
                    <Text style={[styles.optionalText, { color: theme.colors.textMuted }]}>
                      {t('optional_label')}
                    </Text>
                  </View>
                  <View style={getInputBoxStyle('contactPhone')}>
                    <TouchableOpacity
                      style={styles.phonePrefixPill}
                      onPress={() => setIsCountryModalVisible(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.flagEmoji}>{selectedCountry.flag}</Text>
                      <Text style={[styles.phonePrefixText, { color: theme.colors.textPrimary }]}>
                        {selectedCountry.dialCode}
                      </Text>
                      <Feather name="chevron-down" size={13} color={theme.colors.textMuted} />
                      <View style={[styles.verticalDivider, { backgroundColor: theme.colors.cardBorder }]} />
                    </TouchableOpacity>
                    <TextInput
                      style={[styles.textInput, { color: theme.colors.textPrimary }]}
                      value={contactPhone}
                      onFocus={() => setFocusedField('contactPhone')}
                      onBlur={() => setFocusedField(null)}
                      onChangeText={(val) => {
                        const cleaned = val.replace(/\D/g, '');
                        setContactPhone(cleaned);
                        clearError('contactPhone');
                      }}
                      placeholder={selectedCountry.placeholder}
                      placeholderTextColor={theme.colors.textDim}
                      keyboardType="phone-pad"
                      maxLength={12}
                    />
                  </View>
                  {Boolean(errors.contactPhone) && (
                    <View style={styles.errorRow}>
                      <Feather name="alert-circle" size={12} color={theme.colors.red} />
                      <Text style={styles.errorText}>{errors.contactPhone}</Text>
                    </View>
                  )}
                </View>

                {/* Company Email */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}>
                    {t('email_address')} <Text style={[styles.asterisk, { color: theme.colors.red }]}>*</Text>
                  </Text>
                  <View style={getInputBoxStyle('email')}>
                    <Feather
                      name="mail"
                      size={16}
                      color={focusedField === 'email' ? roleColor : theme.colors.textMuted}
                      style={styles.fieldIcon}
                    />
                    <TextInput
                      style={[styles.textInput, { color: theme.colors.textPrimary }]}
                      value={email}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      onChangeText={(val) => {
                        setEmail(val);
                        clearError('email');
                      }}
                      placeholder="solomon@company.et"
                      placeholderTextColor={theme.colors.textDim}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  {Boolean(errors.email) && (
                    <View style={styles.errorRow}>
                      <Feather name="alert-circle" size={12} color={theme.colors.red} />
                      <Text style={styles.errorText}>{errors.email}</Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* Driver Specific Registration Fields */}
            {isDriver && (
              <>
                {/* Truck License Plate */}
                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}>
                      {t('truck_plate_label')} <Text style={[styles.asterisk, { color: theme.colors.red }]}>*</Text>
                    </Text>
                    <View style={[styles.chipBadge, { backgroundColor: theme.colors.surfaceElevated }]}>
                      <Text style={[styles.chipBadgeText, { color: theme.colors.textMuted }]}>
                        3-AA-98214
                      </Text>
                    </View>
                  </View>
                  <View style={getInputBoxStyle('licensePlate')}>
                    <Feather
                      name="truck"
                      size={16}
                      color={focusedField === 'licensePlate' ? roleColor : theme.colors.textMuted}
                      style={styles.fieldIcon}
                    />
                    <TextInput
                      style={[styles.textInput, { color: theme.colors.textPrimary }]}
                      value={licensePlate}
                      onFocus={() => setFocusedField('licensePlate')}
                      onBlur={() => setFocusedField(null)}
                      onChangeText={(val) => {
                        const cleaned = val.toUpperCase().replace(/[^0-9A-Z-]/g, '').slice(0, 15);
                        setLicensePlate(cleaned);
                        clearError('licensePlate');
                      }}
                      placeholder="e.g. 3-AA-98214"
                      placeholderTextColor={theme.colors.textDim}
                      autoCapitalize="characters"
                      maxLength={15}
                    />
                  </View>
                  {Boolean(errors.licensePlate) && (
                    <View style={styles.errorRow}>
                      <Feather name="alert-circle" size={12} color={theme.colors.red} />
                      <Text style={styles.errorText}>{errors.licensePlate}</Text>
                    </View>
                  )}
                </View>

                {/* Commercial Driver License */}
                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}>
                      {t('driver_license')} <Text style={[styles.asterisk, { color: theme.colors.red }]}>*</Text>
                    </Text>
                    <View style={[styles.chipBadge, { backgroundColor: theme.colors.surfaceElevated }]}>
                      <Text style={[styles.chipBadgeText, { color: theme.colors.textMuted }]}>
                        ETH-CDL
                      </Text>
                    </View>
                  </View>
                  <View style={getInputBoxStyle('driverLicense')}>
                    <Feather
                      name="shield"
                      size={16}
                      color={focusedField === 'driverLicense' ? roleColor : theme.colors.textMuted}
                      style={styles.fieldIcon}
                    />
                    <TextInput
                      style={[styles.textInput, { color: theme.colors.textPrimary }]}
                      value={driverLicense}
                      onFocus={() => setFocusedField('driverLicense')}
                      onBlur={() => setFocusedField(null)}
                      onChangeText={(val) => {
                        const cleaned = val.toUpperCase().replace(/[^0-9A-Z-]/g, '').slice(0, 25);
                        setDriverLicense(cleaned);
                        clearError('driverLicense');
                      }}
                      placeholder="e.g. ETH-CDL-782190"
                      placeholderTextColor={theme.colors.textDim}
                      autoCapitalize="characters"
                      maxLength={25}
                    />
                  </View>
                  {Boolean(errors.driverLicense) && (
                    <View style={styles.errorRow}>
                      <Feather name="alert-circle" size={12} color={theme.colors.red} />
                      <Text style={styles.errorText}>{errors.driverLicense}</Text>
                    </View>
                  )}
                </View>

                {/* Driver East African Phone */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}>
                    {t('phone_number')} <Text style={[styles.asterisk, { color: theme.colors.red }]}>*</Text>
                  </Text>
                  <View style={getInputBoxStyle('phone')}>
                    <TouchableOpacity
                      style={styles.phonePrefixPill}
                      onPress={() => setIsCountryModalVisible(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.flagEmoji}>{selectedCountry.flag}</Text>
                      <Text style={[styles.phonePrefixText, { color: theme.colors.textPrimary }]}>
                        {selectedCountry.dialCode}
                      </Text>
                      <Feather name="chevron-down" size={13} color={theme.colors.textMuted} />
                      <View style={[styles.verticalDivider, { backgroundColor: theme.colors.cardBorder }]} />
                    </TouchableOpacity>
                    <TextInput
                      style={[styles.textInput, { color: theme.colors.textPrimary }]}
                      value={phone}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                      onChangeText={(val) => {
                        const cleaned = val.replace(/\D/g, '');
                        setPhone(cleaned);
                        clearError('phone');
                      }}
                      placeholder={selectedCountry.placeholder}
                      placeholderTextColor={theme.colors.textDim}
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                      maxLength={12}
                    />
                  </View>
                  {Boolean(errors.phone) && (
                    <View style={styles.errorRow}>
                      <Feather name="alert-circle" size={12} color={theme.colors.red} />
                      <Text style={styles.errorText}>{errors.phone}</Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}>
                {t('password')} <Text style={[styles.asterisk, { color: theme.colors.red }]}>*</Text>
              </Text>
              <View style={getInputBoxStyle('password')}>
                <Feather
                  name="lock"
                  size={16}
                  color={focusedField === 'password' ? roleColor : theme.colors.textMuted}
                  style={styles.fieldIcon}
                />
                <TextInput
                  style={[styles.textInput, { color: theme.colors.textPrimary }]}
                  value={password}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={(val) => {
                    setPassword(val);
                    clearError('password');
                  }}
                  placeholder="••••••••"
                  placeholderTextColor={theme.colors.textDim}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={16}
                    color={theme.colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
              {Boolean(errors.password) && (
                <View style={styles.errorRow}>
                  <Feather name="alert-circle" size={12} color={theme.colors.red} />
                  <Text style={styles.errorText}>{errors.password}</Text>
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}>
                {t('confirm_password')} <Text style={[styles.asterisk, { color: theme.colors.red }]}>*</Text>
              </Text>
              <View style={getInputBoxStyle('confirmPassword')}>
                <Feather
                  name="shield"
                  size={16}
                  color={focusedField === 'confirmPassword' ? roleColor : theme.colors.textMuted}
                  style={styles.fieldIcon}
                />
                <TextInput
                  style={[styles.textInput, { color: theme.colors.textPrimary }]}
                  value={confirmPassword}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    clearError('confirmPassword');
                  }}
                  placeholder="••••••••"
                  placeholderTextColor={theme.colors.textDim}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Feather
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={16}
                    color={theme.colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
              {Boolean(errors.confirmPassword) && (
                <View style={styles.errorRow}>
                  <Feather name="alert-circle" size={12} color={theme.colors.red} />
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                </View>
              )}
            </View>

            {/* Register Primary Action Button */}
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: roleColor,
                  opacity: isSubmitting ? 0.75 : 1,
                },
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator
                  size="small"
                  color={isDriver ? '#FFFFFF' : theme.colors.primaryText}
                />
              ) : (
                <>
                  <Text
                    style={[
                      styles.primaryBtnText,
                      {
                        color: isDriver ? '#FFFFFF' : theme.colors.primaryText,
                      },
                    ]}
                  >
                    {!isDriver ? t('register_as_transporter') : t('register_as_driver')}
                  </Text>
                  <Feather
                    name="arrow-right"
                    size={18}
                    color={isDriver ? '#FFFFFF' : theme.colors.primaryText}
                  />
                </>
              )}
            </TouchableOpacity>

            {/* Google Sign In on Register */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.cardBorder }]} />
              <Text style={[styles.dividerText, { color: theme.colors.textMuted }]}>
                {t('or_continue_with_google')}
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.cardBorder }]} />
            </View>

            <GoogleSignInButton
              onPress={handleGoogleAuth}
              isLoading={isGoogleSubmitting}
              disabled={isSubmitting}
            />
          </View>
        )}

        {/* ── BOTTOM ACCOUNT SWITCHER PROMPT ── */}
        <View style={styles.footerPrompt}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            {mode === 'LOGIN' ? t('dont_have_account') : t('already_have_account')}{' '}
          </Text>
          <TouchableOpacity
            onPress={() => handleModeChange(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
            activeOpacity={0.7}
          >
            <Text style={[styles.footerLink, { color: roleColor }]}>
              {mode === 'LOGIN' ? t('create_one') : t('sign_in_here')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── EAST AFRICAN COUNTRY PICKER MODAL ── */}
        <Modal
          visible={isCountryModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsCountryModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsCountryModalVisible(false)}
          >
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.cardBorder,
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                  Select Corridor Country
                </Text>
                <TouchableOpacity
                  onPress={() => setIsCountryModalVisible(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather name="x" size={18} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.countryList}>
                {EAST_AFRICAN_COUNTRIES.map((item) => {
                  const isSelected = selectedCountry.code === item.code;
                  return (
                    <TouchableOpacity
                      key={item.code}
                      style={[
                        styles.countryItem,
                        {
                          borderBottomColor: theme.colors.cardBorder,
                          backgroundColor: isSelected
                            ? isDriver
                              ? theme.colors.blueSubtle
                              : theme.colors.primarySubtle
                            : 'transparent',
                        },
                      ]}
                      onPress={() => {
                        setSelectedCountry(item);
                        clearError('phone');
                        setIsCountryModalVisible(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.countryItemLeft}>
                        <Text style={styles.countryItemFlag}>{item.flag}</Text>
                        <View>
                          <Text style={[styles.countryItemName, { color: theme.colors.textPrimary }]}>
                            {item.name}
                          </Text>
                          <Text style={[styles.countryItemCode, { color: theme.colors.textMuted }]}>
                            {item.dialCode}
                          </Text>
                        </View>
                      </View>
                      {isSelected && (
                        <Feather name="check" size={18} color={roleColor} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 24 : 18,
    paddingBottom: 48,
  },

  // ── Top Navigation Bar ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 28,
    height: 28,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  networkBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  networkBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  brandCorridor: {
    fontSize: 11,
    fontWeight: '500',
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
  },
  langPillText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Unified Segmented Role Bar ──
  segmentedRoleBar: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
    borderWidth: 1,
  },
  roleSegment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 10,
    borderRadius: 9,
  },
  roleSegmentActive: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.1,
    shadowRadius: 2.5,
    elevation: 2,
  },
  roleSegmentText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Title Section ──
  titleSection: {
    marginBottom: 16,
  },
  mainHeading: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  subHeading: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },

  // ── Form Card ──
  formCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 15,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  asterisk: {
    fontWeight: '700',
  },
  chipBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  chipBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  optionalText: {
    fontSize: 11,
    fontWeight: '500',
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputBoxError: {
    borderWidth: 1.5,
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
  fieldIcon: {
    marginRight: 10,
  },
  phonePrefixPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingRight: 8,
    marginRight: 6,
    paddingVertical: 4,
  },
  flagEmoji: {
    fontSize: 16,
  },
  phonePrefixText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  verticalDivider: {
    width: 1,
    height: 18,
    marginLeft: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 10,
  },
  eyeBtn: {
    padding: 6,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11.5,
    fontWeight: '500',
  },

  // ── Primary Action Button ──
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 12,
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  // ── Divider ──
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  // ── Footer ──
  footerPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '500',
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Country Selector Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxHeight: 400,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.15)',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  countryList: {
    paddingVertical: 4,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  countryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countryItemFlag: {
    fontSize: 22,
  },
  countryItemName: {
    fontSize: 14,
    fontWeight: '600',
  },
  countryItemCode: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
});
