// TradeFlow Mobile — Authentication Screen (Transporter & Driver)
// Spec:
// - Transporter: Uses real email (solomon@company.et) + password
// - Truck Driver: Uses phone number (0911234567), mapped behind the scenes to Supabase identity (0911234567@tradeflow.et)
// Zero SMS fees; standard free Supabase email account identity processed under the hood.

import React, { useState } from 'react';
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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AuthUser, UserRole } from '../types/auth';
import { saveUserSession } from '../services/database';
import { THEME } from '../styles/theme';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  normalizeEthiopianPhone,
  formatEthiopianPhoneDisplay,
  driverPhoneToSupabaseEmail,
  isValidEthiopianPhone,
  isValidEmail,
} from '../utils/phoneAuth';

interface Props {
  onLoginSuccess: (user: AuthUser) => void;
  initialMode?: 'LOGIN' | 'REGISTER';
}

export default function AuthScreen({ onLoginSuccess, initialMode = 'REGISTER' }: Props) {
  const { theme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const [role, setRole] = useState<UserRole>('TRANSPORTER');
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>(initialMode);

  // Authentication Credentials
  // Transporter enters real email (e.g. solomon@company.et)
  const [email, setEmail] = useState('');
  // Driver enters phone number (e.g. 0911234567)
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Registration Profile Fields
  const [fullName, setFullName] = useState('');
  // Transporter specific
  const [companyName, setCompanyName] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [fleetSize, setFleetSize] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  // Driver specific
  const [licensePlate, setLicensePlate] = useState('');
  const [driverLicense, setDriverLicense] = useState('');

  // Field validation error state
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  // ── Handle Demo One-Tap Access ──
  const handleQuickDemo = async (demoRole: UserRole) => {
    let demoUser: AuthUser;
    if (demoRole === 'TRANSPORTER') {
      demoUser = {
        id: 'USR-TRANS-01',
        email: 'solomon@company.et',
        fullName: 'Solomon Haile',
        phone: '+251 91 144 5566',
        role: 'TRANSPORTER',
        companyName: 'Rift Valley Transport PLC',
        tinNumber: '0098234112',
        fleetSize: '16 Trucks',
        token: 'jwt-demo-transporter-token',
      };
    } else {
      // Driver Phone-as-Email demo:
      // Phone: 0911234567 -> Supabase identity: 0911234567@tradeflow.et
      demoUser = {
        id: 'USR-DRV-05',
        email: '0911234567@tradeflow.et',
        fullName: 'Abebe Kebede',
        phone: '+251 91 123 4567',
        role: 'DRIVER',
        licensePlate: '3-AA-98214',
        driverLicense: 'ETH-CDL-782190',
        token: 'jwt-demo-driver-token',
      };
    }

    await saveUserSession(demoUser);
    onLoginSuccess(demoUser);
  };

  // ── Handle Submit ──
  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};

    if (mode === 'LOGIN') {
      // --- LOGIN VALIDATION ---
      if (role === 'DRIVER') {
        if (!phone.trim()) {
          newErrors.phone = 'Phone number is required';
        } else if (!isValidEthiopianPhone(phone)) {
          newErrors.phone = 'Enter valid 10-digit phone (e.g. 0911234567)';
        }
      } else {
        // Transporter: Real email required
        if (!email.trim()) {
          newErrors.email = 'Email address is required';
        } else if (!isValidEmail(email)) {
          newErrors.email = 'Enter valid email (e.g. solomon@company.et)';
        }
      }

      if (!password.trim()) {
        newErrors.password = 'Password is required';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      // --- LOGIN IDENTITY RESOLUTION ---
      let resolvedEmail: string;
      let displayPhone: string;

      if (role === 'DRIVER') {
        // Phone-as-Email: Map 0911234567 -> 0911234567@tradeflow.et
        const normalized = normalizeEthiopianPhone(phone);
        resolvedEmail = driverPhoneToSupabaseEmail(normalized);
        displayPhone = formatEthiopianPhoneDisplay(normalized);
      } else {
        // Transporter: Real email
        resolvedEmail = email.trim().toLowerCase();
        displayPhone = '+251 91 144 5566';
      }

      const user: AuthUser = {
        id: `USR-${Date.now().toString().slice(-4)}`,
        email: resolvedEmail,
        fullName: role === 'TRANSPORTER' ? 'Solomon Haile' : 'Abebe Kebede',
        phone: displayPhone,
        role,
        companyName: role === 'TRANSPORTER' ? 'Rift Valley Transport PLC' : undefined,
        licensePlate: role === 'DRIVER' ? '3-AA-98214' : undefined,
        driverLicense: role === 'DRIVER' ? 'ETH-CDL-4410' : undefined,
        token: `jwt-token-${Date.now()}`,
      };

      await saveUserSession(user);
      onLoginSuccess(user);
    } else {
      // --- REGISTRATION VALIDATION ---
      if (!fullName.trim()) {
        newErrors.fullName = 'Full name is required';
      }

      if (role === 'TRANSPORTER') {
        if (!companyName.trim()) {
          newErrors.companyName = 'Company name is required';
        }
        if (!tinNumber.trim()) {
          newErrors.tinNumber = 'TIN number is required';
        }
        if (!fleetSize.trim()) {
          newErrors.fleetSize = 'Fleet size is required';
        }
        if (!email.trim()) {
          newErrors.email = 'Company email is required';
        } else if (!isValidEmail(email)) {
          newErrors.email = 'Enter valid email (e.g. solomon@company.et)';
        }
      }

      if (role === 'DRIVER') {
        if (!licensePlate.trim()) {
          newErrors.licensePlate = 'License plate is required';
        }
        if (!driverLicense.trim()) {
          newErrors.driverLicense = 'Driver license number is required';
        }
        if (!phone.trim()) {
          newErrors.phone = 'Phone number is required';
        } else if (!isValidEthiopianPhone(phone)) {
          newErrors.phone = 'Enter valid 10-digit phone (e.g. 0911234567)';
        }
      }

      if (!password.trim()) {
        newErrors.password = 'Password is required';
      } else if (password.length < 6) {
        newErrors.password = 'Min 6 characters';
      }

      if (!confirmPassword.trim()) {
        newErrors.confirmPassword = 'Confirm password is required';
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      // --- REGISTRATION IDENTITY RESOLUTION ---
      let resolvedEmail: string;
      let displayPhone: string;

      if (role === 'DRIVER') {
        // Driver only sees phone; Supabase gets 09XXXXXXXX@tradeflow.et
        const normalized = normalizeEthiopianPhone(phone);
        resolvedEmail = driverPhoneToSupabaseEmail(normalized);
        displayPhone = formatEthiopianPhoneDisplay(normalized);
      } else {
        // Transporter enters real company email
        resolvedEmail = email.trim().toLowerCase();
        displayPhone = contactPhone.trim()
          ? formatEthiopianPhoneDisplay(contactPhone)
          : '+251 91 144 5566';
      }

      const newUser: AuthUser = {
        id: `USR-${Date.now().toString().slice(-4)}`,
        email: resolvedEmail,
        fullName: fullName.trim(),
        phone: displayPhone,
        role,
        companyName: role === 'TRANSPORTER' ? companyName.trim() : undefined,
        tinNumber: role === 'TRANSPORTER' ? tinNumber.trim() : undefined,
        fleetSize: role === 'TRANSPORTER' ? fleetSize.trim() : undefined,
        licensePlate: role === 'DRIVER' ? licensePlate.trim().toUpperCase() : undefined,
        driverLicense: role === 'DRIVER' ? driverLicense.trim().toUpperCase() : undefined,
        token: `jwt-token-${Date.now()}`,
      };

      await saveUserSession(newUser);
      Alert.alert(
        'Account Registered',
        role === 'TRANSPORTER'
          ? `Welcome, ${fullName.trim()}! Logged in with ${resolvedEmail}`
          : `Welcome, Driver ${fullName.trim()}! Phone ${displayPhone} registered successfully.`
      );
      onLoginSuccess(newUser);
    }
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
        {/* Clean Header with Language Switch */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View
              style={[
                styles.logoBadge,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor:
                    role === 'DRIVER'
                      ? theme.colors.blueBorder
                      : theme.colors.primaryBorder,
                },
              ]}
            >
              <Image
                source={require('../../assets/tradeflow-logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.brandTitle, { color: theme.colors.textPrimary }]}>
              TradeFlow
            </Text>
          </View>

          {/* Quick Language Toggle Pill */}
          <TouchableOpacity
            style={[
              styles.langPillAuth,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.cardBorder,
              },
            ]}
            onPress={toggleLanguage}
            activeOpacity={0.7}
          >
            <Feather name="globe" size={13} color={theme.colors.textSecondary} />
            <Text style={[styles.langPillAuthText, { color: theme.colors.textPrimary }]}>
              {language === 'EN' ? 'አማርኛ' : 'EN'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Role Selector Tabs */}
        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[
              styles.roleCard,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.cardBorder,
              },
              role === 'TRANSPORTER' && {
                borderColor: theme.colors.primary,
                backgroundColor: theme.colors.primarySubtle,
              },
            ]}
            onPress={() => handleRoleChange('TRANSPORTER')}
            activeOpacity={0.8}
          >
            <Feather
              name="truck"
              size={16}
              color={role === 'TRANSPORTER' ? theme.colors.primary : theme.colors.textMuted}
            />
            <Text
              style={[
                styles.roleTitle,
                { color: theme.colors.textMuted },
                role === 'TRANSPORTER' && {
                  color: theme.colors.primary,
                  fontWeight: '700',
                },
              ]}
            >
              {t('transporter')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleCard,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.cardBorder,
              },
              role === 'DRIVER' && {
                borderColor: theme.colors.blue,
                backgroundColor: theme.colors.blueSubtle,
              },
            ]}
            onPress={() => handleRoleChange('DRIVER')}
            activeOpacity={0.8}
          >
            <Feather
              name="navigation"
              size={16}
              color={role === 'DRIVER' ? theme.colors.blue : theme.colors.textMuted}
            />
            <Text
              style={[
                styles.roleTitle,
                { color: theme.colors.textMuted },
                role === 'DRIVER' && {
                  color: theme.colors.blue,
                  fontWeight: '700',
                },
              ]}
            >
              {t('driver')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mode Toggle (Sign In / Register) */}
        <View
          style={[
            styles.modeContainer,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.cardBorder,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.modePill,
              mode === 'LOGIN' && {
                backgroundColor: theme.colors.card,
                borderWidth: 1,
                borderColor: theme.colors.cardBorderHover,
              },
            ]}
            onPress={() => handleModeChange('LOGIN')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.modePillText,
                { color: theme.colors.textMuted },
                mode === 'LOGIN' && {
                  color: theme.colors.textPrimary,
                  fontWeight: '700',
                },
              ]}
            >
              {t('sign_in')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modePill,
              mode === 'REGISTER' && {
                backgroundColor: theme.colors.card,
                borderWidth: 1,
                borderColor: theme.colors.cardBorderHover,
              },
            ]}
            onPress={() => handleModeChange('REGISTER')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.modePillText,
                { color: theme.colors.textMuted },
                mode === 'REGISTER' && {
                  color: theme.colors.textPrimary,
                  fontWeight: '700',
                },
              ]}
            >
              {t('register')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.cardBorder,
            },
          ]}
        >
          {/* Registration: Full Name */}
          {mode === 'REGISTER' && (
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                  {t('full_name')} <Text style={[styles.asterisk, { color: theme.colors.red }]}>*</Text>
                </Text>
              </View>
              <View
                style={[
                  styles.inputBox,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.cardBorder,
                  },
                  Boolean(errors.fullName) && styles.inputBoxError,
                ]}
              >
                <Feather
                  name="user"
                  size={15}
                  color={theme.colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.textInput, { color: theme.colors.textPrimary }]}
                  value={fullName}
                  onChangeText={(val) => {
                    setFullName(val);
                    clearError('fullName');
                  }}
                  placeholder={role === 'TRANSPORTER' ? 'Solomon Haile' : 'Abebe Kebede'}
                  placeholderTextColor={theme.colors.textDim}
                />
              </View>
              {Boolean(errors.fullName) && (
                <Text style={styles.errorText}>{errors.fullName}</Text>
              )}
            </View>
          )}

          {/* Registration (Carrier): Company, TIN, Fleet */}
          {mode === 'REGISTER' && role === 'TRANSPORTER' && (
            <>
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                    {t('company_name')} <Text style={[styles.asterisk, { color: theme.colors.red }]}>*</Text>
                  </Text>
                </View>
                <View
                  style={[
                    styles.inputBox,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.cardBorder,
                    },
                    Boolean(errors.companyName) && styles.inputBoxError,
                  ]}
                >
                  <Feather
                    name="briefcase"
                    size={15}
                    color={theme.colors.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.textInput, { color: theme.colors.textPrimary }]}
                    value={companyName}
                    onChangeText={(val) => {
                      setCompanyName(val);
                      clearError('companyName');
                    }}
                    placeholder="e.g. Rift Valley Transport PLC"
                    placeholderTextColor={theme.colors.textDim}
                  />
                </View>
                {Boolean(errors.companyName) && (
                  <Text style={styles.errorText}>{errors.companyName}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                    {t('tin_number')} <Text style={[styles.asterisk, { color: theme.colors.red }]}>*</Text>
                  </Text>
                </View>
                <View
                  style={[
                    styles.inputBox,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.cardBorder,
                    },
                    Boolean(errors.tinNumber) && styles.inputBoxError,
                  ]}
                >
                  <Feather
                    name="hash"
                    size={15}
                    color={theme.colors.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.textInput, { color: theme.colors.textPrimary }]}
                    value={tinNumber}
                    onChangeText={(val) => {
                      setTinNumber(val);
                      clearError('tinNumber');
                    }}
                    placeholder="10-digit TIN (e.g. 0098234112)"
                    placeholderTextColor={theme.colors.textDim}
                    keyboardType="numeric"
                  />
                </View>
                {Boolean(errors.tinNumber) && (
                  <Text style={styles.errorText}>{errors.tinNumber}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                    {t('fleet_size')} <Text style={[styles.asterisk, { color: theme.colors.red }]}>*</Text>
                  </Text>
                </View>
                <View
                  style={[
                    styles.inputBox,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.cardBorder,
                    },
                    Boolean(errors.fleetSize) && styles.inputBoxError,
                  ]}
                >
                  <Feather
                    name="truck"
                    size={15}
                    color={theme.colors.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.textInput, { color: theme.colors.textPrimary }]}
                    value={fleetSize}
                    onChangeText={(val) => {
                      setFleetSize(val);
                      clearError('fleetSize');
                    }}
                    placeholder="Number of trucks (e.g. 16 Trucks)"
                    placeholderTextColor={theme.colors.textDim}
                  />
                </View>
                {Boolean(errors.fleetSize) && (
                  <Text style={styles.errorText}>{errors.fleetSize}</Text>
                )}
              </View>
            </>
          )}

          {/* Registration (Driver): Plate & License */}
          {mode === 'REGISTER' && role === 'DRIVER' && (
            <>
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                    {t('truck_plate')} <Text style={[styles.asterisk, { color: theme.colors.red }]}>*</Text>
                  </Text>
                </View>
                <View
                  style={[
                    styles.inputBox,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.cardBorder,
                    },
                    Boolean(errors.licensePlate) && styles.inputBoxError,
                  ]}
                >
                  <Feather
                    name="truck"
                    size={15}
                    color={theme.colors.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.textInput, { color: theme.colors.textPrimary }]}
                    value={licensePlate}
                    onChangeText={(val) => {
                      setLicensePlate(val);
                      clearError('licensePlate');
                    }}
                    placeholder="e.g. 3-AA-98214"
                    placeholderTextColor={theme.colors.textDim}
                    autoCapitalize="characters"
                  />
                </View>
                {Boolean(errors.licensePlate) && (
                  <Text style={styles.errorText}>{errors.licensePlate}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                    {t('driver_license')} <Text style={[styles.asterisk, { color: theme.colors.red }]}>*</Text>
                  </Text>
                </View>
                <View
                  style={[
                    styles.inputBox,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.cardBorder,
                    },
                    Boolean(errors.driverLicense) && styles.inputBoxError,
                  ]}
                >
                  <Feather
                    name="shield"
                    size={15}
                    color={theme.colors.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.textInput, { color: theme.colors.textPrimary }]}
                    value={driverLicense}
                    onChangeText={(val) => {
                      setDriverLicense(val);
                      clearError('driverLicense');
                    }}
                    placeholder="License number (e.g. ETH-CDL-782190)"
                    placeholderTextColor={theme.colors.textDim}
                    autoCapitalize="characters"
                  />
                </View>
                {Boolean(errors.driverLicense) && (
                  <Text style={styles.errorText}>{errors.driverLicense}</Text>
                )}
              </View>
            </>
          )}

          {/* ── ROLE-SPECIFIC CREDENTIAL INPUT ── */}
          {role === 'TRANSPORTER' ? (
            /* Transporter: Real Email Address */
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                  {t('email_address')}{' '}
                  <Text style={[styles.asterisk, { color: theme.colors.red }]}>*</Text>
                </Text>
              </View>
              <View
                style={[
                  styles.inputBox,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.cardBorder,
                  },
                  Boolean(errors.email) && styles.inputBoxError,
                ]}
              >
                <Feather
                  name="mail"
                  size={15}
                  color={theme.colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.textInput, { color: theme.colors.textPrimary }]}
                  value={email}
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
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>
          ) : (
            /* Truck Driver: Phone Number (Phone-as-Email behind the scenes) */
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                  {t('phone_number')}{' '}
                  <Text style={[styles.asterisk, { color: theme.colors.red }]}>*</Text>
                </Text>
              </View>
              <View
                style={[
                  styles.inputBox,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.cardBorder,
                  },
                  Boolean(errors.phone) && styles.inputBoxError,
                ]}
              >
                <View style={styles.countryCodePill}>
                  <Text style={styles.flagEmoji}>🇪🇹</Text>
                  <Text style={[styles.countryCodeText, { color: theme.colors.textPrimary }]}>
                    +251
                  </Text>
                  <View
                    style={[
                      styles.pillDivider,
                      { backgroundColor: theme.colors.cardBorder },
                    ]}
                  />
                </View>
                <TextInput
                  style={[styles.textInput, { color: theme.colors.textPrimary }]}
                  value={phone}
                  onChangeText={(val) => {
                    setPhone(val);
                    clearError('phone');
                  }}
                  placeholder="0911 234 567"
                  placeholderTextColor={theme.colors.textDim}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                />
              </View>
              {Boolean(errors.phone) && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}
            </View>
          )}

          {/* Transporter Registration: Optional Contact Phone */}
          {mode === 'REGISTER' && role === 'TRANSPORTER' && (
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                  {t('phone_number')} (OFFICIAL CONTACT)
                </Text>
              </View>
              <View
                style={[
                  styles.inputBox,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.cardBorder,
                  },
                ]}
              >
                <View style={styles.countryCodePill}>
                  <Text style={styles.flagEmoji}>🇪🇹</Text>
                  <Text style={[styles.countryCodeText, { color: theme.colors.textPrimary }]}>
                    +251
                  </Text>
                  <View
                    style={[
                      styles.pillDivider,
                      { backgroundColor: theme.colors.cardBorder },
                    ]}
                  />
                </View>
                <TextInput
                  style={[styles.textInput, { color: theme.colors.textPrimary }]}
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  placeholder="91 144 5566"
                  placeholderTextColor={theme.colors.textDim}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          )}

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                {t('password')} <Text style={[styles.asterisk, { color: theme.colors.red }]}>*</Text>
              </Text>
              {mode === 'LOGIN' && (
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      'Account Recovery',
                      role === 'DRIVER'
                        ? 'Contact your carrier fleet manager or TradeFlow support at support@tradeflow.et for driver PIN reset.'
                        : 'Contact TradeFlow carrier support at support@tradeflow.et for password reset.'
                    )
                  }
                >
                  <Text
                    style={[
                      styles.forgotText,
                      { color: role === 'DRIVER' ? theme.colors.blue : theme.colors.primary },
                    ]}
                  >
                    {t('forgot_password')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View
              style={[
                styles.inputBox,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.cardBorder,
                },
                Boolean(errors.password) && styles.inputBoxError,
              ]}
            >
              <Feather
                name="lock"
                size={15}
                color={theme.colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.textInput, { color: theme.colors.textPrimary }]}
                value={password}
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
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={15}
                  color={theme.colors.textMuted}
                />
              </TouchableOpacity>
            </View>
            {Boolean(errors.password) && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          {/* Confirm Password (Registration only) */}
          {mode === 'REGISTER' && (
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                  {t('confirm_password')} <Text style={[styles.asterisk, { color: theme.colors.red }]}>*</Text>
                </Text>
              </View>
              <View
                style={[
                  styles.inputBox,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.cardBorder,
                  },
                  Boolean(errors.confirmPassword) && styles.inputBoxError,
                ]}
              >
                <Feather
                  name="check-circle"
                  size={15}
                  color={theme.colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.textInput, { color: theme.colors.textPrimary }]}
                  value={confirmPassword}
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
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={15}
                    color={theme.colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
              {Boolean(errors.confirmPassword) && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>
          )}

          {/* Primary Action Button */}
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              {
                backgroundColor:
                  role === 'DRIVER' ? theme.colors.blue : theme.colors.primary,
              },
            ]}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.primaryBtnText,
                {
                  color:
                    role === 'DRIVER' ? '#FFFFFF' : theme.colors.primaryText,
                },
              ]}
            >
              {mode === 'LOGIN' ? t('sign_in') : t('create_account')}
            </Text>
            <Feather
              name="arrow-right"
              size={16}
              color={role === 'DRIVER' ? '#FFFFFF' : theme.colors.primaryText}
            />
          </TouchableOpacity>
        </View>

        {/* Demo Accounts */}
        <View style={styles.demoSection}>
          <Text style={[styles.demoLabel, { color: theme.colors.textMuted }]}>
            {t('demo_accounts')}
          </Text>

          <View style={styles.demoCards}>
            <TouchableOpacity
              style={[
                styles.demoCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.cardBorder,
                },
              ]}
              onPress={() => handleQuickDemo('TRANSPORTER')}
              activeOpacity={0.7}
            >
              <Feather name="truck" size={15} color={theme.colors.primary} />
              <View style={styles.demoCardContent}>
                <Text style={[styles.demoCardTitle, { color: theme.colors.textPrimary }]}>
                  {t('demo_transporter')}
                </Text>
                <Text style={[styles.demoCardSub, { color: theme.colors.textMuted }]}>
                  Solomon Haile • solomon@company.et
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.demoCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.cardBorder,
                },
              ]}
              onPress={() => handleQuickDemo('DRIVER')}
              activeOpacity={0.7}
            >
              <Feather name="navigation" size={15} color={theme.colors.blue} />
              <View style={styles.demoCardContent}>
                <Text style={[styles.demoCardTitle, { color: theme.colors.textPrimary }]}>
                  {t('demo_driver')}
                </Text>
                <Text style={[styles.demoCardSub, { color: theme.colors.textMuted }]}>
                  Abebe Kebede • 0911 234 567 (Truck 3-AA-98214)
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 24 : 20,
    paddingBottom: 40,
  },

  // ── Header ──
  header: {
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  langPillAuth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  langPillAuthText: {
    fontSize: 12,
    fontWeight: '700',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: THEME.colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 30,
    height: 30,
    borderRadius: 6,
  },
  brandTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },

  // ── Role Selector ──
  roleContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  roleCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: THEME.colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    paddingVertical: 12,
  },
  roleTitle: {
    color: THEME.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Mode Switcher ──
  modeContainer: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    borderRadius: 8,
    padding: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  modePill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  modePillText: {
    color: THEME.colors.textMuted,
    fontSize: 12.5,
    fontWeight: '600',
  },

  // ── Form Card ──
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    padding: 16,
    marginBottom: 20,
  },
  asterisk: {
    color: THEME.colors.red,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    color: THEME.colors.textSecondary,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: THEME.typography.mono,
  },
  forgotText: {
    color: THEME.colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputBoxError: {
    borderColor: THEME.colors.red,
    borderWidth: 1.5,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  errorText: {
    color: THEME.colors.red,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  inputIcon: {
    marginRight: 10,
  },
  countryCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingRight: 8,
    marginRight: 6,
  },
  flagEmoji: {
    fontSize: 13,
  },
  countryCodeText: {
    color: THEME.colors.textPrimary,
    fontSize: 12.5,
    fontWeight: '600',
    fontFamily: THEME.typography.mono,
  },
  pillDivider: {
    width: 1,
    height: 16,
    backgroundColor: THEME.colors.cardBorder,
    marginLeft: 6,
  },
  textInput: {
    flex: 1,
    color: THEME.colors.textPrimary,
    fontSize: 13,
    paddingVertical: 10,
  },
  eyeBtn: {
    padding: 6,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: THEME.colors.primary,
    paddingVertical: 13,
    borderRadius: 8,
    marginTop: 6,
  },
  primaryBtnText: {
    color: THEME.colors.primaryText,
    fontSize: 13.5,
    fontWeight: '700',
  },

  // ── Demo Section ──
  demoSection: {
    marginTop: 4,
  },
  demoLabel: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: THEME.typography.mono,
  },
  demoCards: {
    gap: 8,
  },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
  },
  demoCardContent: {
    flex: 1,
  },
  demoCardTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 12.5,
    fontWeight: '600',
  },
  demoCardSub: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
});
