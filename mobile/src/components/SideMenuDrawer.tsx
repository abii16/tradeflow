// TradeFlow Mobile — Side Menu Drawer (Dynamic Dark & Light Mode)
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AuthUser } from '../types/auth';
import { useTheme } from '../context/ThemeContext';

interface Props {
  visible: boolean;
  currentUser?: AuthUser | null;
  pendingCount: number;
  onOpenQueue: () => void;
  onSignOut?: () => void;
  onClose: () => void;
  activeRole?: 'transporter' | 'driver';
  onSelectRole?: (role: 'transporter' | 'driver') => void;
}

export default function SideMenuDrawer({
  visible,
  currentUser,
  pendingCount,
  onOpenQueue,
  onSignOut,
  onClose,
  activeRole,
  onSelectRole,
}: Props) {
  const { isDarkMode, setDarkMode, theme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<'EN' | 'AM'>('EN');

  const handleToggleTheme = (val: boolean) => {
    setDarkMode(val);
  };

  const handleToggleLanguage = () => {
    const next = selectedLanguage === 'EN' ? 'AM' : 'EN';
    setSelectedLanguage(next);
    Alert.alert('Language', next === 'AM' ? 'ቋንቋ ወደ አማርኛ ተቀይሯል' : 'Language set to English');
  };

  const handleLogoutPress = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to log out of TradeFlow?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            onClose();
            if (onSignOut) {
              onSignOut();
            }
          },
        },
      ]
    );
  };

  const isDriver = currentUser?.role === 'DRIVER';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Drawer Panel */}
        <View
          style={[
            styles.drawer,
            {
              backgroundColor: theme.colors.surface,
              borderRightColor: theme.colors.cardBorder,
            },
          ]}
        >
          {/* Top Profile Header */}
          <View style={[styles.drawerHeader, { borderBottomColor: theme.colors.cardBorder }]}>
            <View style={styles.profileRow}>
              <View
                style={[
                  styles.avatarBox,
                  {
                    backgroundColor: isDriver ? theme.colors.blueSubtle : theme.colors.primarySubtle,
                    borderColor: isDriver ? theme.colors.blueBorder : theme.colors.primaryBorder,
                  },
                ]}
              >
                <Feather
                  name={isDriver ? 'navigation' : 'truck'}
                  size={18}
                  color={isDriver ? theme.colors.blue : theme.colors.primary}
                />
              </View>

              <View style={styles.profileDetails}>
                <View style={styles.profileNameRow}>
                  <Text
                    style={[styles.profileName, { color: theme.colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {currentUser?.fullName || (isDriver ? 'Driver Console' : 'Transporter')}
                  </Text>
                  <View
                    style={[
                      styles.roleBadge,
                      {
                        backgroundColor: isDriver ? theme.colors.blueSubtle : theme.colors.primarySubtle,
                        borderColor: isDriver ? theme.colors.blueBorder : theme.colors.primaryBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleBadgeText,
                        { color: isDriver ? theme.colors.blue : theme.colors.primary },
                      ]}
                    >
                      {isDriver ? 'DRIVER' : 'CARRIER'}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[styles.profileSub, { color: theme.colors.textMuted }]}
                  numberOfLines={1}
                >
                  {currentUser?.companyName ||
                    (currentUser?.licensePlate
                      ? `Plate ${currentUser.licensePlate}`
                      : currentUser?.phone || 'TradeFlow User')}
                </Text>
              </View>

              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.drawerBody}
          >
            {/* ── Console Mode / Role Switcher ── */}
            {Boolean(onSelectRole) && (
              <View style={styles.section}>
                <Text style={[styles.sectionHeader, { color: theme.colors.textMuted }]}>
                  CONSOLE MODE
                </Text>

                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor:
                        activeRole === 'transporter'
                          ? theme.colors.primary
                          : theme.colors.cardBorder,
                    },
                    activeRole === 'transporter' && {
                      backgroundColor: theme.colors.primarySubtle,
                    },
                  ]}
                  onPress={() => {
                    onClose();
                    onSelectRole?.('transporter');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemLeft}>
                    <View
                      style={[
                        styles.menuIconContainer,
                        {
                          backgroundColor:
                            activeRole === 'transporter'
                              ? theme.colors.primarySubtle
                              : theme.colors.surfaceElevated,
                        },
                      ]}
                    >
                      <Feather
                        name="truck"
                        size={15}
                        color={
                          activeRole === 'transporter'
                            ? theme.colors.primary
                            : theme.colors.textSecondary
                        }
                      />
                    </View>
                    <View>
                      <Text style={[styles.menuItemTitle, { color: theme.colors.textPrimary }]}>
                        Transporter
                      </Text>
                      <Text style={[styles.menuItemSub, { color: theme.colors.textMuted }]}>
                        Freight & load marketplace
                      </Text>
                    </View>
                  </View>

                  {activeRole === 'transporter' && (
                    <Feather name="check" size={16} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor:
                        activeRole === 'driver'
                          ? theme.colors.blue
                          : theme.colors.cardBorder,
                      marginTop: 8,
                    },
                    activeRole === 'driver' && {
                      backgroundColor: theme.colors.blueSubtle,
                    },
                  ]}
                  onPress={() => {
                    onClose();
                    onSelectRole?.('driver');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemLeft}>
                    <View
                      style={[
                        styles.menuIconContainer,
                        {
                          backgroundColor:
                            activeRole === 'driver'
                              ? theme.colors.blueSubtle
                              : theme.colors.surfaceElevated,
                        },
                      ]}
                    >
                      <Feather
                        name="navigation"
                        size={15}
                        color={
                          activeRole === 'driver'
                            ? theme.colors.blue
                            : theme.colors.textSecondary
                        }
                      />
                    </View>
                    <View>
                      <Text style={[styles.menuItemTitle, { color: theme.colors.textPrimary }]}>
                        Driver Console
                      </Text>
                      <Text style={[styles.menuItemSub, { color: theme.colors.textMuted }]}>
                        Waypoint check-ins & POD
                      </Text>
                    </View>
                  </View>

                  {activeRole === 'driver' && (
                    <Feather name="check" size={16} color={theme.colors.blue} />
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* ── Appearance / Dark Mode & Light Mode ── */}
            <View style={styles.section}>
              <Text style={[styles.sectionHeader, { color: theme.colors.textMuted }]}>
                APPEARANCE
              </Text>

              <View
                style={[
                  styles.menuItem,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.cardBorder,
                  },
                ]}
              >
                <View style={styles.menuItemLeft}>
                  <View
                    style={[
                      styles.menuIconContainer,
                      { backgroundColor: theme.colors.surfaceElevated },
                    ]}
                  >
                    <Feather
                      name={isDarkMode ? 'moon' : 'sun'}
                      size={15}
                      color={isDarkMode ? theme.colors.blue : theme.colors.amber}
                    />
                  </View>
                  <View>
                    <Text style={[styles.menuItemTitle, { color: theme.colors.textPrimary }]}>
                      {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                    </Text>
                    <Text style={[styles.menuItemSub, { color: theme.colors.textMuted }]}>
                      {isDarkMode ? 'Corridor night mode' : 'Daylight high contrast'}
                    </Text>
                  </View>
                </View>

                <Switch
                  value={isDarkMode}
                  onValueChange={handleToggleTheme}
                  trackColor={{
                    false: theme.colors.cardBorder,
                    true: theme.isDark ? '#1D3B2A' : '#A7F3D0',
                  }}
                  thumbColor={isDarkMode ? theme.colors.primary : '#FFFFFF'}
                  style={styles.switch}
                />
              </View>
            </View>

            {/* ── Settings Section ── */}
            <View style={styles.section}>
              <Text style={[styles.sectionHeader, { color: theme.colors.textMuted }]}>
                SETTINGS
              </Text>

              {/* Notifications Toggle */}
              <View
                style={[
                  styles.menuItem,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.cardBorder,
                  },
                ]}
              >
                <View style={styles.menuItemLeft}>
                  <View
                    style={[
                      styles.menuIconContainer,
                      { backgroundColor: theme.colors.surfaceElevated },
                    ]}
                  >
                    <Feather name="bell" size={15} color={theme.colors.textSecondary} />
                  </View>
                  <View>
                    <Text style={[styles.menuItemTitle, { color: theme.colors.textPrimary }]}>
                      Notifications
                    </Text>
                    <Text style={[styles.menuItemSub, { color: theme.colors.textMuted }]}>
                      Load bids & waypoints
                    </Text>
                  </View>
                </View>

                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{
                    false: theme.colors.cardBorder,
                    true: theme.isDark ? '#1D3B2A' : '#A7F3D0',
                  }}
                  thumbColor={notificationsEnabled ? theme.colors.primary : '#888888'}
                  style={styles.switch}
                />
              </View>

              {/* Language Selector */}
              <TouchableOpacity
                style={[
                  styles.menuItem,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.cardBorder,
                  },
                ]}
                onPress={handleToggleLanguage}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <View
                    style={[
                      styles.menuIconContainer,
                      { backgroundColor: theme.colors.surfaceElevated },
                    ]}
                  >
                    <Feather name="globe" size={15} color={theme.colors.textSecondary} />
                  </View>
                  <View>
                    <Text style={[styles.menuItemTitle, { color: theme.colors.textPrimary }]}>
                      Language
                    </Text>
                    <Text style={[styles.menuItemSub, { color: theme.colors.textMuted }]}>
                      {selectedLanguage === 'EN' ? 'English' : 'አማርኛ (Amharic)'}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.langPill,
                    { backgroundColor: theme.colors.surfaceElevated },
                  ]}
                >
                  <Text
                    style={[
                      styles.langPillText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {selectedLanguage}
                  </Text>
                  <Feather name="chevron-right" size={13} color={theme.colors.textMuted} />
                </View>
              </TouchableOpacity>

              {/* Offline Queue */}
              <TouchableOpacity
                style={[
                  styles.menuItem,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.cardBorder,
                  },
                ]}
                onPress={() => {
                  onClose();
                  onOpenQueue();
                }}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <View
                    style={[
                      styles.menuIconContainer,
                      { backgroundColor: theme.colors.surfaceElevated },
                    ]}
                  >
                    <Feather name="layers" size={15} color={theme.colors.textSecondary} />
                  </View>
                  <View>
                    <Text style={[styles.menuItemTitle, { color: theme.colors.textPrimary }]}>
                      Offline Queue
                    </Text>
                    <Text style={[styles.menuItemSub, { color: theme.colors.textMuted }]}>
                      Local SQLite storage
                    </Text>
                  </View>
                </View>

                {pendingCount > 0 ? (
                  <View
                    style={[
                      styles.badgePill,
                      {
                        backgroundColor: theme.colors.amberSubtle,
                        borderColor: 'rgba(245, 158, 11, 0.3)',
                      },
                    ]}
                  >
                    <Text style={[styles.badgePillText, { color: theme.colors.amber }]}>
                      {pendingCount} queued
                    </Text>
                  </View>
                ) : (
                  <Feather name="chevron-right" size={13} color={theme.colors.textMuted} />
                )}
              </TouchableOpacity>

              {/* App Info */}
              <View
                style={[
                  styles.menuItem,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.cardBorder,
                  },
                ]}
              >
                <View style={styles.menuItemLeft}>
                  <View
                    style={[
                      styles.menuIconContainer,
                      { backgroundColor: theme.colors.surfaceElevated },
                    ]}
                  >
                    <Feather name="info" size={15} color={theme.colors.textSecondary} />
                  </View>
                  <View>
                    <Text style={[styles.menuItemTitle, { color: theme.colors.textPrimary }]}>
                      TradeFlow Mobile
                    </Text>
                    <Text style={[styles.menuItemSub, { color: theme.colors.textMuted }]}>
                      v1.0.4 • Djibouti Corridor
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* ── Logout Button at Bottom ── */}
          <View style={[styles.drawerFooter, { borderTopColor: theme.colors.cardBorder }]}>
            <TouchableOpacity
              style={[
                styles.logoutBtn,
                {
                  backgroundColor: theme.colors.redSubtle,
                  borderColor: theme.colors.redBorder,
                },
              ]}
              onPress={handleLogoutPress}
              activeOpacity={0.7}
            >
              <Feather name="log-out" size={16} color={theme.colors.red} />
              <Text style={[styles.logoutBtnText, { color: theme.colors.red }]}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  drawer: {
    width: '82%',
    maxWidth: 320,
    borderRightWidth: 1,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },

  // ── Profile Header ──
  drawerHeader: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  profileDetails: {
    flex: 1,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  profileSub: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  roleBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },

  // ── Body ──
  drawerBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 18,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    marginBottom: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  menuIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  menuItemSub: {
    fontSize: 11,
    marginTop: 1,
  },
  switch: {
    transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }],
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  langPillText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
  badgePill: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },

  // ── Footer / Logout ──
  drawerFooter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    paddingVertical: 11,
    borderRadius: 8,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
