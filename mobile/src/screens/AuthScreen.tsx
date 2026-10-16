// TradeFlow Mobile — Authentication Screen (Transporter & Driver)
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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AuthUser, UserRole } from '../types/auth';
import { saveUserSession } from '../services/database';
import { THEME } from '../styles/theme';
import { useTheme } from '../context/ThemeContext';

interface Props {
  onLoginSuccess: (user: AuthUser) => void;
}

export default function AuthScreen({ onLoginSuccess }: Props) {
  const { theme } = useTheme();
  const [role, setRole] = useState<UserRole>('TRANSPORTER');
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Input states
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Registration fields
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [fleetSize, setFleetSize] = useState('');
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
        email: 'solomon.h@riftvalley.et',
        fullName: 'Solomon Haile',
        phone: '+251 91 144 5566',
        role: 'TRANSPORTER',
        companyName: 'Rift Valley Transport PLC',
        tinNumber: '0098234112',
        fleetSize: '16 Trucks',
        token: 'jwt-demo-transporter-token',
      };
    } else {
      demoUser = {
        id: 'USR-DRV-05',
        email: 'abebe.k@tradeflow.et',
        fullName: 'Abebe Kebede',
        phone: '+251 92 333 7788',
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
      if (!phoneOrEmail.trim()) {
        newErrors.phoneOrEmail = 'Required';
      }
      if (!password.trim()) {
        newErrors.password = 'Required';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      const formattedPhone = phoneOrEmail.includes('@')
        ? phoneOrEmail.trim()
        : phoneOrEmail.startsWith('+251')
        ? phoneOrEmail.trim()
        : `+251 ${phoneOrEmail.replace(/^0+/, '').trim()}`;

      const user: AuthUser = {
        id: `USR-${Date.now().toString().slice(-4)}`,
        email: phoneOrEmail.includes('@') ? phoneOrEmail.trim() : `${phoneOrEmail.replace(/\D/g, '')}@tradeflow.et`,
        fullName: role === 'TRANSPORTER' ? 'Solomon Haile' : 'Abebe Kebede',
        phone: formattedPhone,
        role,
        companyName: role === 'TRANSPORTER' ? 'Rift Valley Transport PLC' : undefined,
        licensePlate: role === 'DRIVER' ? '3-AA-98214' : undefined,
        driverLicense: role === 'DRIVER' ? 'ETH-CDL-4410' : undefined,
        token: `jwt-token-${Date.now()}`,
      };

      await saveUserSession(user);
      onLoginSuccess(user);
    } else {
      if (!fullName.trim()) {
        newErrors.fullName = 'Required';
      }

      if (role === 'TRANSPORTER') {
        if (!companyName.trim()) {
          newErrors.companyName = 'Required';
        }
        if (!tinNumber.trim()) {
          newErrors.tinNumber = 'Required';
        }
        if (!fleetSize.trim()) {
          newErrors.fleetSize = 'Required';
        }
      }

      if (role === 'DRIVER') {
        if (!licensePlate.trim()) {
          newErrors.licensePlate = 'Required';
        }
        if (!driverLicense.trim()) {
          newErrors.driverLicense = 'Required';
        }
      }

      if (!phoneOrEmail.trim()) {
        newErrors.phoneOrEmail = 'Required';
      }

      if (!password.trim()) {
        newErrors.password = 'Required';
      } else if (password.length < 6) {
        newErrors.password = 'Min 6 characters';
      }

      if (!confirmPassword.trim()) {
        newErrors.confirmPassword = 'Required';
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      const formattedPhone = phoneOrEmail.includes('@')
        ? phoneOrEmail.trim()
        : phoneOrEmail.startsWith('+251')
        ? phoneOrEmail.trim()
        : `+251 ${phoneOrEmail.replace(/^0+/, '').trim()}`;

      const newUser: AuthUser = {
        id: `USR-${Date.now().toString().slice(-4)}`,
        email: phoneOrEmail.includes('@') ? phoneOrEmail.trim() : `${phoneOrEmail.replace(/\D/g, '')}@tradeflow.et`,
        fullName: fullName.trim(),
        phone: formattedPhone,
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
          ? `Welcome, ${fullName.trim()}!`
          : `Welcome, Driver ${fullName.trim()}!`
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
        {/* Clean Header */}
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
              <Feather
                name="layers"
                size={20}
                color={role === 'DRIVER' ? theme.colors.blue : theme.colors.primary}
              />
            </View>
            <Text style={[styles.brandTitle, { color: theme.colors.textPrimary }]}>
              TradeFlow
            </Text>
          </View>
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
              Transporter
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
              Driver
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
              Sign In
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
              Register
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
                  FULL NAME <Text style={[styles.asterisk, { color: theme.colors.red }]}>*</Text>
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
                  placeholder="Full name"
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
                    COMPANY NAME <Text style={[styles.asterisk, { color: theme.colors.red }]}>*</Text>
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
                    placeholder="Company name"
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
                    TIN NUMBER <Text style={[styles.asterisk, { color: theme.colors.red }]}>*</Text>
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
                    placeholder="10-digit TIN"
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
                    FLEET SIZE <Text style={[styles.asterisk, { color: theme.colors.red }]}>*</Text>
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
                    placeholder="Number of trucks"
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
                    TRUCK PLATE <Text style={[styles.asterisk, { color: theme.colors.red }]}>*</Text>
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
                    DRIVER LICENSE <Text style={[styles.asterisk, { color: theme.colors.red }]}>*</Text>
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
                    placeholder="License number"
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

          {/* Phone / Email Input */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                {role === 'DRIVER' ? 'PHONE NUMBER' : 'PHONE OR EMAIL'}{' '}
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
                Boolean(errors.phoneOrEmail) && styles.inputBoxError,
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
                value={phoneOrEmail}
                onChangeText={(val) => {
                  setPhoneOrEmail(val);
                  clearError('phoneOrEmail');
                }}
                placeholder="91 123 4567"
                placeholderTextColor={theme.colors.textDim}
                keyboardType={phoneOrEmail.includes('@') ? 'email-address' : 'phone-pad'}
                autoCapitalize="none"
              />
            </View>
            {Boolean(errors.phoneOrEmail) && (
              <Text style={styles.errorText}>{errors.phoneOrEmail}</Text>
            )}
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                PASSWORD <Text style={[styles.asterisk, { color: theme.colors.red }]}>*</Text>
              </Text>
              {mode === 'LOGIN' && (
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      'Account Recovery',
                      'Contact TradeFlow support at support@tradeflow.et for password reset.'
                    )
                  }
                >
                  <Text
                    style={[
                      styles.forgotText,
                      { color: role === 'DRIVER' ? theme.colors.blue : theme.colors.primary },
                    ]}
                  >
                    Forgot password?
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
                  CONFIRM PASSWORD <Text style={[styles.asterisk, { color: theme.colors.red }]}>*</Text>
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
              {mode === 'LOGIN' ? 'Sign In' : 'Create Account'}
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
            DEMO ACCOUNTS
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
                  Demo Transporter
                </Text>
                <Text style={[styles.demoCardSub, { color: theme.colors.textMuted }]}>
                  Solomon Haile • Rift Valley Transport
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
                  Demo Driver
                </Text>
                <Text style={[styles.demoCardSub, { color: theme.colors.textMuted }]}>
                  Abebe Kebede • Truck 3-AA-98214
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
    alignItems: 'center',
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
  roleCardActiveTransporter: {
    borderColor: THEME.colors.primary,
    backgroundColor: THEME.colors.primarySubtle,
  },
  roleCardActiveDriver: {
    borderColor: THEME.colors.blue,
    backgroundColor: THEME.colors.blueSubtle,
  },
  roleTitle: {
    color: THEME.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  roleTitleActiveTransporter: {
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  roleTitleActiveDriver: {
    color: THEME.colors.blue,
    fontWeight: '700',
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
  modePillActive: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorderHover,
  },
  modePillText: {
    color: THEME.colors.textMuted,
    fontSize: 12.5,
    fontWeight: '600',
  },
  modePillTextActive: {
    color: THEME.colors.textPrimary,
    fontWeight: '700',
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
  primaryBtnDriver: {
    backgroundColor: THEME.colors.blue,
  },
  primaryBtnText: {
    color: THEME.colors.primaryText,
    fontSize: 13.5,
    fontWeight: '700',
  },
  primaryBtnTextDriver: {
    color: '#FFFFFF',
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
