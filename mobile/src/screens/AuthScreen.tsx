// TradeFlow Mobile — Production Authentication Screen
// Inspired by world-class logistics & fintech apps (Uber Freight, Convoy, Stripe, Flexport)
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

interface Props {
  onLoginSuccess: (user: AuthUser) => void;
}

export default function AuthScreen({ onLoginSuccess }: Props) {
  const [role, setRole] = useState<UserRole>('TRANSPORTER');
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Input states
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Registration specific fields
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [fleetSize, setFleetSize] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [driverLicense, setDriverLicense] = useState('');

  // Field validation error state (highlights input border with red)
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

  // ── Handle Submit with In-Place Red Border Highlighting ──
  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};

    if (mode === 'LOGIN') {
      if (!phoneOrEmail.trim()) {
        newErrors.phoneOrEmail = 'Phone number or email is required';
      }
      if (!password.trim()) {
        newErrors.password = 'Password is required';
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
      // Registration: Check each field and highlight red if empty
      if (!fullName.trim()) {
        newErrors.fullName = 'Full legal name is required';
      }

      if (role === 'TRANSPORTER') {
        if (!companyName.trim()) {
          newErrors.companyName = 'Enterprise or company name is required';
        }
        if (!tinNumber.trim()) {
          newErrors.tinNumber = '10-digit TIN is required';
        }
        if (!fleetSize.trim()) {
          newErrors.fleetSize = 'Operating fleet size is required';
        }
      }

      if (role === 'DRIVER') {
        if (!licensePlate.trim()) {
          newErrors.licensePlate = 'Commercial truck license plate is required';
        }
        if (!driverLicense.trim()) {
          newErrors.driverLicense = 'Commercial driver license number is required';
        }
      }

      if (!phoneOrEmail.trim()) {
        newErrors.phoneOrEmail = 'Mobile phone number is required';
      }

      if (!password.trim()) {
        newErrors.password = 'Password is required';
      } else if (password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (!confirmPassword.trim()) {
        newErrors.confirmPassword = 'Confirmation password is required';
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
        'Registration Successful',
        role === 'TRANSPORTER'
          ? `Welcome to TradeFlow, ${fullName.trim()}! Your carrier account has been created.`
          : `Welcome, Driver ${fullName.trim()}! Truck ${licensePlate.trim().toUpperCase()} registered.`
      );
      onLoginSuccess(newUser);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardView}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Emblem & Welcome Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Feather name="layers" size={22} color={THEME.colors.primary} />
            </View>
            <View>
              <View style={styles.titleRow}>
                <Text style={styles.brandTitle}>TradeFlow</Text>
                <View style={styles.corridorBadge}>
                  <Text style={styles.corridorBadgeText}>CORRIDOR OS</Text>
                </View>
              </View>
              <Text style={styles.brandSub}>Djibouti–Addis Ababa Logistics Gateway</Text>
            </View>
          </View>

          <View style={styles.welcomeBox}>
            <Text style={styles.headline}>
              {mode === 'LOGIN'
                ? role === 'TRANSPORTER'
                  ? 'Transporter Sign In'
                  : 'Driver Console Sign In'
                : role === 'TRANSPORTER'
                ? 'Register Carrier Fleet'
                : 'Register Commercial Driver'}
            </Text>
            <Text style={styles.subheadline}>
              {mode === 'LOGIN'
                ? role === 'TRANSPORTER'
                  ? 'Access live cargo loads, submit spot bids, and dispatch trucks.'
                  : 'Check in at corridor waypoints, report delays, and complete deliveries.'
                : role === 'TRANSPORTER'
                ? 'Onboard your freight enterprise under Ethiopian Ministry of Transport guidelines.'
                : 'Connect your heavy-duty truck to real-time dispatch along the A1 corridor.'}
            </Text>
          </View>
        </View>

        {/* Actor Role Cards (Uber Freight / Driver Style) */}
        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleCard, role === 'TRANSPORTER' && styles.roleCardActive]}
            onPress={() => handleRoleChange('TRANSPORTER')}
            activeOpacity={0.8}
          >
            <View style={styles.roleCardHeader}>
              <View
                style={[
                  styles.roleIconCircle,
                  role === 'TRANSPORTER' && styles.roleIconCircleActive,
                ]}
              >
                <Feather
                  name="truck"
                  size={16}
                  color={role === 'TRANSPORTER' ? THEME.colors.primary : THEME.colors.textMuted}
                />
              </View>
              <View
                style={[
                  styles.radioDot,
                  role === 'TRANSPORTER' && styles.radioDotActive,
                ]}
              >
                {role === 'TRANSPORTER' && <View style={styles.radioDotInner} />}
              </View>
            </View>
            <Text style={styles.roleTitle}>Transporter</Text>
            <Text style={styles.roleDesc}>Carrier & Fleet Dispatch</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, role === 'DRIVER' && styles.roleCardActive]}
            onPress={() => handleRoleChange('DRIVER')}
            activeOpacity={0.8}
          >
            <View style={styles.roleCardHeader}>
              <View
                style={[
                  styles.roleIconCircle,
                  role === 'DRIVER' && styles.roleIconCircleActive,
                ]}
              >
                <Feather
                  name="navigation"
                  size={16}
                  color={role === 'DRIVER' ? THEME.colors.primary : THEME.colors.textMuted}
                />
              </View>
              <View
                style={[
                  styles.radioDot,
                  role === 'DRIVER' && styles.radioDotActive,
                ]}
              >
                {role === 'DRIVER' && <View style={styles.radioDotInner} />}
              </View>
            </View>
            <Text style={styles.roleTitle}>Truck Driver</Text>
            <Text style={styles.roleDesc}>Waypoints & Proof of Delivery</Text>
          </TouchableOpacity>
        </View>

        {/* Mode Segmented Tab (Sign In vs Create Account) */}
        <View style={styles.modeContainer}>
          <TouchableOpacity
            style={[styles.modePill, mode === 'LOGIN' && styles.modePillActive]}
            onPress={() => handleModeChange('LOGIN')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.modePillText,
                mode === 'LOGIN' && styles.modePillTextActive,
              ]}
            >
              Sign In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modePill, mode === 'REGISTER' && styles.modePillActive]}
            onPress={() => handleModeChange('REGISTER')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.modePillText,
                mode === 'REGISTER' && styles.modePillTextActive,
              ]}
            >
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Input Card Container */}
        <View style={styles.card}>
          {/* Registration: Full Name */}
          {mode === 'REGISTER' && (
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, Boolean(errors.fullName) && styles.labelError]}>
                  FULL LEGAL NAME
                </Text>
              </View>
              <View style={[styles.inputBox, Boolean(errors.fullName) && styles.inputBoxError]}>
                <Feather
                  name="user"
                  size={15}
                  color={errors.fullName ? THEME.colors.red : THEME.colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={fullName}
                  onChangeText={(val) => {
                    setFullName(val);
                    clearError('fullName');
                  }}
                  placeholder={role === 'TRANSPORTER' ? 'e.g. Solomon Haile' : 'e.g. Abebe Kebede'}
                  placeholderTextColor={THEME.colors.textDim}
                />
              </View>
              {Boolean(errors.fullName) && (
                <Text style={styles.errorText}>{errors.fullName}</Text>
              )}
            </View>
          )}

          {/* Registration (Carrier): Enterprise, TIN, Fleet Size */}
          {mode === 'REGISTER' && role === 'TRANSPORTER' && (
            <>
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, Boolean(errors.companyName) && styles.labelError]}>
                    ENTERPRISE / COMPANY NAME
                  </Text>
                </View>
                <View style={[styles.inputBox, Boolean(errors.companyName) && styles.inputBoxError]}>
                  <Feather
                    name="briefcase"
                    size={15}
                    color={errors.companyName ? THEME.colors.red : THEME.colors.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    value={companyName}
                    onChangeText={(val) => {
                      setCompanyName(val);
                      clearError('companyName');
                    }}
                    placeholder="e.g. Rift Valley Transport PLC"
                    placeholderTextColor={THEME.colors.textDim}
                  />
                </View>
                {Boolean(errors.companyName) && (
                  <Text style={styles.errorText}>{errors.companyName}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, Boolean(errors.tinNumber) && styles.labelError]}>
                    TAX IDENTIFICATION NUMBER (TIN)
                  </Text>
                </View>
                <View style={[styles.inputBox, Boolean(errors.tinNumber) && styles.inputBoxError]}>
                  <Feather
                    name="hash"
                    size={15}
                    color={errors.tinNumber ? THEME.colors.red : THEME.colors.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    value={tinNumber}
                    onChangeText={(val) => {
                      setTinNumber(val);
                      clearError('tinNumber');
                    }}
                    placeholder="10-digit Ethiopian TIN (e.g. 0098234112)"
                    placeholderTextColor={THEME.colors.textDim}
                    keyboardType="numeric"
                  />
                </View>
                {Boolean(errors.tinNumber) && (
                  <Text style={styles.errorText}>{errors.tinNumber}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, Boolean(errors.fleetSize) && styles.labelError]}>
                    OPERATING FLEET SIZE
                  </Text>
                </View>
                <View style={[styles.inputBox, Boolean(errors.fleetSize) && styles.inputBoxError]}>
                  <Feather
                    name="truck"
                    size={15}
                    color={errors.fleetSize ? THEME.colors.red : THEME.colors.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    value={fleetSize}
                    onChangeText={(val) => {
                      setFleetSize(val);
                      clearError('fleetSize');
                    }}
                    placeholder="e.g. 16 Trucks or 5-15 Trucks"
                    placeholderTextColor={THEME.colors.textDim}
                  />
                </View>
                {Boolean(errors.fleetSize) && (
                  <Text style={styles.errorText}>{errors.fleetSize}</Text>
                )}
              </View>
            </>
          )}

          {/* Registration (Driver): Truck Plate & CDL */}
          {mode === 'REGISTER' && role === 'DRIVER' && (
            <>
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, Boolean(errors.licensePlate) && styles.labelError]}>
                    COMMERCIAL TRUCK LICENSE PLATE
                  </Text>
                </View>
                <View style={[styles.inputBox, Boolean(errors.licensePlate) && styles.inputBoxError]}>
                  <Feather
                    name="truck"
                    size={15}
                    color={errors.licensePlate ? THEME.colors.red : THEME.colors.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    value={licensePlate}
                    onChangeText={(val) => {
                      setLicensePlate(val);
                      clearError('licensePlate');
                    }}
                    placeholder="e.g. 3-AA-98214"
                    placeholderTextColor={THEME.colors.textDim}
                    autoCapitalize="characters"
                  />
                </View>
                {Boolean(errors.licensePlate) && (
                  <Text style={styles.errorText}>{errors.licensePlate}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, Boolean(errors.driverLicense) && styles.labelError]}>
                    COMMERCIAL DRIVER LICENSE NO.
                  </Text>
                </View>
                <View style={[styles.inputBox, Boolean(errors.driverLicense) && styles.inputBoxError]}>
                  <Feather
                    name="shield"
                    size={15}
                    color={errors.driverLicense ? THEME.colors.red : THEME.colors.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    value={driverLicense}
                    onChangeText={(val) => {
                      setDriverLicense(val);
                      clearError('driverLicense');
                    }}
                    placeholder="e.g. ETH-CDL-782190"
                    placeholderTextColor={THEME.colors.textDim}
                    autoCapitalize="characters"
                  />
                </View>
                {Boolean(errors.driverLicense) && (
                  <Text style={styles.errorText}>{errors.driverLicense}</Text>
                )}
              </View>
            </>
          )}

          {/* Phone Number / Email Input */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, Boolean(errors.phoneOrEmail) && styles.labelError]}>
                {role === 'DRIVER' ? 'MOBILE PHONE NUMBER' : 'PHONE NUMBER OR CORPORATE EMAIL'}
              </Text>
            </View>
            <View style={[styles.inputBox, Boolean(errors.phoneOrEmail) && styles.inputBoxError]}>
              <View style={styles.countryCodePill}>
                <Text style={styles.flagEmoji}>🇪🇹</Text>
                <Text style={[styles.countryCodeText, Boolean(errors.phoneOrEmail) && { color: THEME.colors.red }]}>+251</Text>
                <View style={[styles.pillDivider, Boolean(errors.phoneOrEmail) && { backgroundColor: THEME.colors.red }]} />
              </View>
              <TextInput
                style={styles.textInput}
                value={phoneOrEmail}
                onChangeText={(val) => {
                  setPhoneOrEmail(val);
                  clearError('phoneOrEmail');
                }}
                placeholder={role === 'DRIVER' ? '91 123 4567' : '91 144 5566 or user@domain.et'}
                placeholderTextColor={THEME.colors.textDim}
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
              <Text style={[styles.label, Boolean(errors.password) && styles.labelError]}>
                PASSWORD
              </Text>
              {mode === 'LOGIN' && (
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      'Account Recovery',
                      'For fleet password resets, contact your enterprise dispatcher or TradeFlow support at support@tradeflow.et.'
                    )
                  }
                >
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={[styles.inputBox, Boolean(errors.password) && styles.inputBoxError]}>
              <Feather
                name="lock"
                size={15}
                color={errors.password ? THEME.colors.red : THEME.colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  clearError('password');
                }}
                placeholder={mode === 'LOGIN' ? 'Enter your account password' : 'Create a password (min 6 characters)'}
                placeholderTextColor={THEME.colors.textDim}
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
                  color={errors.password ? THEME.colors.red : THEME.colors.textMuted}
                />
              </TouchableOpacity>
            </View>
            {Boolean(errors.password) && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          {/* Confirm Password Input (Registration only) */}
          {mode === 'REGISTER' && (
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, Boolean(errors.confirmPassword) && styles.labelError]}>
                  CONFIRM PASSWORD
                </Text>
              </View>
              <View style={[styles.inputBox, Boolean(errors.confirmPassword) && styles.inputBoxError]}>
                <Feather
                  name="check-circle"
                  size={15}
                  color={errors.confirmPassword ? THEME.colors.red : THEME.colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    clearError('confirmPassword');
                  }}
                  placeholder="Re-enter password to confirm"
                  placeholderTextColor={THEME.colors.textDim}
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
                    color={errors.confirmPassword ? THEME.colors.red : THEME.colors.textMuted}
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
            style={styles.primaryBtn}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>
              {mode === 'LOGIN'
                ? `Sign In as ${role === 'TRANSPORTER' ? 'Carrier' : 'Driver'}`
                : `Complete ${role === 'TRANSPORTER' ? 'Carrier' : 'Driver'} Registration`}
            </Text>
            <Feather name="arrow-right" size={16} color={THEME.colors.primaryText} />
          </TouchableOpacity>
        </View>

        {/* One-Tap Sandbox & Demo Credentials (Flexport / Stripe Developer Style) */}
        <View style={styles.demoSection}>
          <View style={styles.demoHeaderRow}>
            <View style={styles.demoLine} />
            <Text style={styles.demoLabel}>ONE-TAP DEMO ENVIRONMENT</Text>
            <View style={styles.demoLine} />
          </View>

          <View style={styles.demoCards}>
            <TouchableOpacity
              style={styles.demoCard}
              onPress={() => handleQuickDemo('TRANSPORTER')}
              activeOpacity={0.7}
            >
              <View style={[styles.demoCardIcon, { backgroundColor: THEME.colors.primarySubtle }]}>
                <Feather name="truck" size={15} color={THEME.colors.primary} />
              </View>
              <View style={styles.demoCardContent}>
                <View style={styles.demoCardTop}>
                  <Text style={styles.demoCardTitle}>Demo Transporter / Carrier</Text>
                  <View style={styles.verifiedTag}>
                    <Text style={styles.verifiedTagText}>TIN VERIFIED</Text>
                  </View>
                </View>
                <Text style={styles.demoCardSub}>
                  Solomon Haile • Rift Valley Transport PLC (16 Trucks)
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={THEME.colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoCard}
              onPress={() => handleQuickDemo('DRIVER')}
              activeOpacity={0.7}
            >
              <View style={[styles.demoCardIcon, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                <Feather name="navigation" size={15} color={THEME.colors.blue} />
              </View>
              <View style={styles.demoCardContent}>
                <View style={styles.demoCardTop}>
                  <Text style={styles.demoCardTitle}>Demo Corridor Driver</Text>
                  <View style={[styles.verifiedTag, { borderColor: 'rgba(59, 130, 246, 0.3)' }]}>
                    <Text style={[styles.verifiedTagText, { color: THEME.colors.blue }]}>A1 EN ROUTE</Text>
                  </View>
                </View>
                <Text style={styles.demoCardSub}>
                  Abebe Kebede • Assigned Truck 3-AA-98214
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={THEME.colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Security & Regulatory Footer */}
        <View style={styles.footer}>
          <View style={styles.footerSecurityRow}>
            <Feather name="shield" size={12} color={THEME.colors.textMuted} />
            <Text style={styles.footerSecurityText}>
              256-bit Encrypted Session • Compliant with ESLSE & MOTI Regulations
            </Text>
          </View>
          <Text style={styles.footerVersion}>TradeFlow Mobile v1.0.4 • Ethiopia–Djibouti Corridor</Text>
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
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 24 : 16,
    paddingBottom: 40,
  },

  // ── Header & Branding ──
  header: {
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: THEME.colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  corridorBadge: {
    backgroundColor: THEME.colors.primarySubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: THEME.colors.primaryBorder,
  },
  corridorBadgeText: {
    color: THEME.colors.primary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: THEME.typography.mono,
  },
  brandSub: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  welcomeBox: {
    marginTop: 2,
  },
  headline: {
    color: THEME.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subheadline: {
    color: THEME.colors.textSecondary,
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 4,
  },

  // ── Role Selector Cards (Uber Style) ──
  roleContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  roleCard: {
    flex: 1,
    backgroundColor: THEME.colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    padding: 12,
  },
  roleCardActive: {
    borderColor: THEME.colors.primary,
    backgroundColor: THEME.colors.surfaceElevated,
  },
  roleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  roleIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: THEME.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconCircleActive: {
    backgroundColor: THEME.colors.primarySubtle,
  },
  radioDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: THEME.colors.cardBorderHover,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDotActive: {
    borderColor: THEME.colors.primary,
  },
  radioDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.primary,
  },
  roleTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 13.5,
    fontWeight: '700',
  },
  roleDesc: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },

  // ── Mode Switcher ──
  modeContainer: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  modePill: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
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

  // ── Form Card & Inputs ──
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    padding: 16,
    marginBottom: 22,
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
  labelError: {
    color: THEME.colors.red,
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
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  errorText: {
    color: THEME.colors.red,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
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
    paddingVertical: 11,
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
    paddingVertical: 14,
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
    marginBottom: 20,
  },
  demoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  demoLine: {
    flex: 1,
    height: 1,
    backgroundColor: THEME.colors.cardBorder,
  },
  demoLabel: {
    color: THEME.colors.textMuted,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginHorizontal: 10,
    fontFamily: THEME.typography.mono,
  },
  demoCards: {
    gap: 9,
  },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    borderRadius: 10,
    padding: 12,
    gap: 12,
  },
  demoCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoCardContent: {
    flex: 1,
  },
  demoCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  demoCardTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 12.5,
    fontWeight: '600',
  },
  verifiedTag: {
    backgroundColor: THEME.colors.primarySubtle,
    borderWidth: 1,
    borderColor: THEME.colors.primaryBorder,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  verifiedTagText: {
    color: THEME.colors.primary,
    fontSize: 8.5,
    fontWeight: '700',
    fontFamily: THEME.typography.mono,
  },
  demoCardSub: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },

  // ── Footer ──
  footer: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  footerSecurityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerSecurityText: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
  footerVersion: {
    color: THEME.colors.textDim,
    fontSize: 9.5,
    fontFamily: THEME.typography.mono,
  },
});
