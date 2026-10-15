// TradeFlow Mobile — Authentication Screen (Transporter & Driver Login/Register)
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

  // Form Fields
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register Fields
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [driverLicense, setDriverLicense] = useState('');

  // ── Handle Quick Demo Login ──
  const handleQuickDemo = async (demoRole: UserRole) => {
    let demoUser: AuthUser;
    if (demoRole === 'TRANSPORTER') {
      demoUser = {
        id: 'USR-TRANS-01',
        email: 'transporter@tradeflow.et',
        fullName: 'Solomon Haile',
        phone: '+251 91 144 5566',
        role: 'TRANSPORTER',
        companyName: 'Rift Valley Transport PLC',
        tinNumber: '0098234112',
        fleetSize: '16 Trucks',
        token: 'demo-jwt-token-transporter',
      };
    } else {
      demoUser = {
        id: 'USR-DRV-05',
        email: 'driver@tradeflow.et',
        fullName: 'Abebe Kebede',
        phone: '+251 92 333 7788',
        role: 'DRIVER',
        licensePlate: '3-AA-98214',
        driverLicense: 'ETH-DL-782190',
        token: 'demo-jwt-token-driver',
      };
    }

    await saveUserSession(demoUser);
    onLoginSuccess(demoUser);
  };

  // ── Handle Form Submit ──
  const handleSubmit = async () => {
    if (mode === 'LOGIN') {
      if (!emailOrPhone.trim() || !password.trim()) {
        Alert.alert('Required Fields', 'Please enter your phone/email and password.');
        return;
      }

      const user: AuthUser = {
        id: `USR-${Date.now().toString().slice(-4)}`,
        email: emailOrPhone.includes('@') ? emailOrPhone.trim() : `${emailOrPhone.replace(/\s+/g, '')}@tradeflow.et`,
        fullName: emailOrPhone.split('@')[0] || (role === 'TRANSPORTER' ? 'Carrier User' : 'Driver User'),
        phone: emailOrPhone.includes('@') ? '+251 91 000 0000' : emailOrPhone.trim(),
        role,
        companyName: role === 'TRANSPORTER' ? 'Ethiopian Transporters Union' : undefined,
        licensePlate: role === 'DRIVER' ? '3-AA-98214' : undefined,
        token: `jwt-${Date.now()}`,
      };

      await saveUserSession(user);
      onLoginSuccess(user);
    } else {
      // Registration
      if (!fullName.trim() || !emailOrPhone.trim() || !password.trim()) {
        Alert.alert('Required Fields', 'Please fill in all mandatory registration fields.');
        return;
      }

      const newUser: AuthUser = {
        id: `USR-${Date.now().toString().slice(-4)}`,
        email: emailOrPhone.includes('@') ? emailOrPhone.trim() : `${emailOrPhone.replace(/\s+/g, '')}@tradeflow.et`,
        fullName: fullName.trim(),
        phone: emailOrPhone.trim(),
        role,
        companyName: role === 'TRANSPORTER' ? companyName.trim() || 'Independent Fleet' : undefined,
        tinNumber: role === 'TRANSPORTER' ? tinNumber.trim() : undefined,
        licensePlate: role === 'DRIVER' ? licensePlate.trim().toUpperCase() : undefined,
        driverLicense: role === 'DRIVER' ? driverLicense.trim() : undefined,
        token: `jwt-${Date.now()}`,
      };

      await saveUserSession(newUser);
      Alert.alert(
        'Account Registered',
        role === 'TRANSPORTER'
          ? `Welcome to TradeFlow, ${fullName}! Your carrier profile is set up.`
          : `Welcome, Driver ${fullName}! Truck ${licensePlate || '3-AA-98214'} assigned.`
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
      >
        {/* Brand Header */}
        <View style={styles.brandBox}>
          <Text style={styles.brandTitle}>TradeFlow</Text>
          <Text style={styles.brandTagline}>
            Ethiopia–Djibouti Principal Trade Corridor
          </Text>
        </View>

        {/* Actor Role Segmented Selector */}
        <View style={styles.roleSelector}>
          <TouchableOpacity
            style={[styles.roleTab, role === 'TRANSPORTER' && styles.roleTabActive]}
            onPress={() => setRole('TRANSPORTER')}
            activeOpacity={0.8}
          >
            <Feather
              name="truck"
              size={15}
              color={role === 'TRANSPORTER' ? THEME.colors.primary : THEME.colors.textMuted}
            />
            <Text
              style={[
                styles.roleTabText,
                role === 'TRANSPORTER' && styles.roleTabTextActive,
              ]}
            >
              Transporter / Carrier
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleTab, role === 'DRIVER' && styles.roleTabActive]}
            onPress={() => setRole('DRIVER')}
            activeOpacity={0.8}
          >
            <Feather
              name="navigation"
              size={15}
              color={role === 'DRIVER' ? THEME.colors.primary : THEME.colors.textMuted}
            />
            <Text
              style={[
                styles.roleTabText,
                role === 'DRIVER' && styles.roleTabTextActive,
              ]}
            >
              Truck Driver
            </Text>
          </TouchableOpacity>
        </View>

        {/* Auth Mode Toggle (Login vs Register) */}
        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'LOGIN' && styles.modeTabActive]}
            onPress={() => setMode('LOGIN')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.modeTabText,
                mode === 'LOGIN' && styles.modeTabTextActive,
              ]}
            >
              Sign In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, mode === 'REGISTER' && styles.modeTabActive]}
            onPress={() => setMode('REGISTER')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.modeTabText,
                mode === 'REGISTER' && styles.modeTabTextActive,
              ]}
            >
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Inputs */}
        <View style={styles.formCard}>
          {mode === 'REGISTER' && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Full Legal Name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="e.g. Abebe Bekele"
                placeholderTextColor={THEME.colors.textDim}
              />
            </View>
          )}

          {mode === 'REGISTER' && role === 'TRANSPORTER' && (
            <>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Transport Enterprise / Company</Text>
                <TextInput
                  style={styles.input}
                  value={companyName}
                  onChangeText={setCompanyName}
                  placeholder="e.g. Rift Valley Logistics PLC"
                  placeholderTextColor={THEME.colors.textDim}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Tax ID / TIN Number (FR-01)</Text>
                <TextInput
                  style={styles.input}
                  value={tinNumber}
                  onChangeText={setTinNumber}
                  placeholder="e.g. 0012345678"
                  placeholderTextColor={THEME.colors.textDim}
                  keyboardType="numeric"
                />
              </View>
            </>
          )}

          {mode === 'REGISTER' && role === 'DRIVER' && (
            <>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Assigned Truck License Plate</Text>
                <TextInput
                  style={styles.input}
                  value={licensePlate}
                  onChangeText={setLicensePlate}
                  placeholder="e.g. 3-AA-98214"
                  placeholderTextColor={THEME.colors.textDim}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Commercial Driver License No.</Text>
                <TextInput
                  style={styles.input}
                  value={driverLicense}
                  onChangeText={setDriverLicense}
                  placeholder="e.g. ETH-CDL-4410"
                  placeholderTextColor={THEME.colors.textDim}
                  autoCapitalize="characters"
                />
              </View>
            </>
          )}

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>
              {role === 'DRIVER' ? 'Phone Number' : 'Email or Phone Number'}
            </Text>
            <TextInput
              style={styles.input}
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              placeholder={role === 'DRIVER' ? '091 123 4567' : 'transporter@tradeflow.et'}
              placeholderTextColor={THEME.colors.textDim}
              autoCapitalize="none"
              keyboardType={role === 'DRIVER' ? 'phone-pad' : 'email-address'}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={THEME.colors.textDim}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Feather
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={15}
                  color={THEME.colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Primary Action Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.submitBtnText}>
              {mode === 'LOGIN'
                ? `Sign In as ${role === 'TRANSPORTER' ? 'Transporter' : 'Driver'}`
                : `Complete ${role === 'TRANSPORTER' ? 'Carrier' : 'Driver'} Registration`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Demo Access (One-Tap Testing) */}
        <View style={styles.demoSection}>
          <View style={styles.demoDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ONE-TAP DEMO ACCESS</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.demoButtons}>
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => handleQuickDemo('TRANSPORTER')}
              activeOpacity={0.7}
            >
              <Feather name="truck" size={14} color={THEME.colors.primary} />
              <View style={styles.demoBtnTextGroup}>
                <Text style={styles.demoBtnTitle}>Demo Transporter</Text>
                <Text style={styles.demoBtnSub}>Rift Valley Logistics • Verified</Text>
              </View>
              <Feather name="chevron-right" size={14} color={THEME.colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => handleQuickDemo('DRIVER')}
              activeOpacity={0.7}
            >
              <Feather name="navigation" size={14} color={THEME.colors.blue} />
              <View style={styles.demoBtnTextGroup}>
                <Text style={styles.demoBtnTitle}>Demo Driver</Text>
                <Text style={styles.demoBtnSub}>Abebe Kebede • Truck 3-AA-98214</Text>
              </View>
              <Feather name="chevron-right" size={14} color={THEME.colors.textMuted} />
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
    paddingTop: Platform.OS === 'ios' ? 24 : 16,
    paddingBottom: 40,
  },
  brandBox: {
    marginBottom: 20,
  },
  brandTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandTagline: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  roleSelector: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    padding: 3,
    marginBottom: 16,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  roleTabActive: {
    backgroundColor: THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  roleTabText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  roleTabTextActive: {
    color: THEME.colors.textPrimary,
    fontWeight: '700',
  },
  modeTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.cardBorder,
    marginBottom: 16,
  },
  modeTab: {
    paddingVertical: 8,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  modeTabActive: {
    borderBottomColor: THEME.colors.primary,
  },
  modeTabText: {
    color: THEME.colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  modeTabTextActive: {
    color: THEME.colors.textPrimary,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    padding: 16,
    marginBottom: 24,
  },
  field: {
    marginBottom: 14,
  },
  fieldLabel: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: THEME.colors.textPrimary,
    fontSize: 13,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: THEME.colors.textPrimary,
    fontSize: 13,
  },
  eyeBtn: {
    padding: 10,
  },
  submitBtn: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    color: THEME.colors.primaryText,
    fontSize: 13.5,
    fontWeight: '700',
  },
  demoSection: {
    marginTop: 4,
  },
  demoDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: THEME.colors.cardBorder,
  },
  dividerText: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginHorizontal: 10,
    fontFamily: THEME.typography.mono,
  },
  demoButtons: {
    gap: 10,
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    padding: 12,
    borderRadius: 10,
    gap: 12,
  },
  demoBtnTextGroup: {
    flex: 1,
  },
  demoBtnTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  demoBtnSub: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
});
