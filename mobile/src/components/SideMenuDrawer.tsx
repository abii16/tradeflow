// TradeFlow Mobile — Side Menu Drawer (Hamburger Menu)
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
import { THEME } from '../styles/theme';

interface Props {
  visible: boolean;
  currentUser?: AuthUser | null;
  pendingCount: number;
  onOpenQueue: () => void;
  onSignOut?: () => void;
  onClose: () => void;
}

export default function SideMenuDrawer({
  visible,
  currentUser,
  pendingCount,
  onOpenQueue,
  onSignOut,
  onClose,
}: Props) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<'EN' | 'AM'>('EN');

  const handleToggleTheme = (val: boolean) => {
    setIsDarkMode(val);
    Alert.alert(
      val ? 'Dark Mode' : 'Light Mode',
      val
        ? 'Corridor night mode active for low-light driver eye strain.'
        : 'Daylight mode active.'
    );
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
        <View style={styles.drawer}>
          {/* Top Profile Header */}
          <View style={styles.drawerHeader}>
            <View style={styles.profileRow}>
              <View
                style={[
                  styles.avatarBox,
                  isDriver ? styles.avatarBoxDriver : styles.avatarBoxCarrier,
                ]}
              >
                <Feather
                  name={isDriver ? 'navigation' : 'truck'}
                  size={18}
                  color={isDriver ? THEME.colors.blue : THEME.colors.primary}
                />
              </View>

              <View style={styles.profileDetails}>
                <View style={styles.profileNameRow}>
                  <Text style={styles.profileName} numberOfLines={1}>
                    {currentUser?.fullName || (isDriver ? 'Driver Console' : 'Transporter')}
                  </Text>
                  <View
                    style={[
                      styles.roleBadge,
                      isDriver ? styles.roleBadgeDriver : styles.roleBadgeCarrier,
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleBadgeText,
                        isDriver ? styles.roleBadgeTextDriver : styles.roleBadgeTextCarrier,
                      ]}
                    >
                      {isDriver ? 'DRIVER' : 'CARRIER'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.profileSub} numberOfLines={1}>
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
                <Feather name="x" size={18} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.drawerBody}
          >
            {/* ── Appearance / Dark Mode & Light Mode ── */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>APPEARANCE</Text>

              <View style={styles.menuItem}>
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconContainer}>
                    <Feather
                      name={isDarkMode ? 'moon' : 'sun'}
                      size={15}
                      color={isDarkMode ? THEME.colors.blue : THEME.colors.amber}
                    />
                  </View>
                  <View>
                    <Text style={styles.menuItemTitle}>
                      {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                    </Text>
                    <Text style={styles.menuItemSub}>
                      {isDarkMode ? 'Corridor night mode' : 'Daylight contrast'}
                    </Text>
                  </View>
                </View>

                <Switch
                  value={isDarkMode}
                  onValueChange={handleToggleTheme}
                  trackColor={{ false: '#3A3A3A', true: '#1D3B2A' }}
                  thumbColor={isDarkMode ? THEME.colors.primary : '#FFFFFF'}
                  style={styles.switch}
                />
              </View>
            </View>

            {/* ── Settings Section ── */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>SETTINGS</Text>

              {/* Notifications Toggle */}
              <View style={styles.menuItem}>
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconContainer}>
                    <Feather name="bell" size={15} color={THEME.colors.textSecondary} />
                  </View>
                  <View>
                    <Text style={styles.menuItemTitle}>Notifications</Text>
                    <Text style={styles.menuItemSub}>Load bids & waypoints</Text>
                  </View>
                </View>

                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#3A3A3A', true: '#1D3B2A' }}
                  thumbColor={notificationsEnabled ? THEME.colors.primary : '#888888'}
                  style={styles.switch}
                />
              </View>

              {/* Language Selector */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleToggleLanguage}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconContainer}>
                    <Feather name="globe" size={15} color={THEME.colors.textSecondary} />
                  </View>
                  <View>
                    <Text style={styles.menuItemTitle}>Language</Text>
                    <Text style={styles.menuItemSub}>
                      {selectedLanguage === 'EN' ? 'English' : 'አማርኛ (Amharic)'}
                    </Text>
                  </View>
                </View>

                <View style={styles.langPill}>
                  <Text style={styles.langPillText}>{selectedLanguage}</Text>
                  <Feather name="chevron-right" size={13} color={THEME.colors.textMuted} />
                </View>
              </TouchableOpacity>

              {/* Offline Queue */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  onOpenQueue();
                }}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconContainer}>
                    <Feather name="layers" size={15} color={THEME.colors.textSecondary} />
                  </View>
                  <View>
                    <Text style={styles.menuItemTitle}>Offline Queue</Text>
                    <Text style={styles.menuItemSub}>Local SQLite storage</Text>
                  </View>
                </View>

                {pendingCount > 0 ? (
                  <View style={styles.badgePill}>
                    <Text style={styles.badgePillText}>{pendingCount} queued</Text>
                  </View>
                ) : (
                  <Feather name="chevron-right" size={13} color={THEME.colors.textMuted} />
                )}
              </TouchableOpacity>

              {/* App Info */}
              <View style={styles.menuItem}>
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconContainer}>
                    <Feather name="info" size={15} color={THEME.colors.textSecondary} />
                  </View>
                  <View>
                    <Text style={styles.menuItemTitle}>TradeFlow Mobile</Text>
                    <Text style={styles.menuItemSub}>v1.0.4 • Djibouti Corridor</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* ── Logout Button at Bottom ── */}
          <View style={styles.drawerFooter}>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogoutPress}
              activeOpacity={0.7}
            >
              <Feather name="log-out" size={16} color={THEME.colors.red} />
              <Text style={styles.logoutBtnText}>Log Out</Text>
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
    backgroundColor: THEME.colors.surface,
    borderRightWidth: 1,
    borderRightColor: THEME.colors.cardBorder,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },

  // ── Profile Header ──
  drawerHeader: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.cardBorder,
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
  avatarBoxCarrier: {
    backgroundColor: THEME.colors.primarySubtle,
    borderColor: THEME.colors.primaryBorder,
  },
  avatarBoxDriver: {
    backgroundColor: THEME.colors.blueSubtle,
    borderColor: THEME.colors.blueBorder,
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
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  profileSub: {
    color: THEME.colors.textMuted,
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
  roleBadgeCarrier: {
    backgroundColor: THEME.colors.primarySubtle,
    borderColor: THEME.colors.primaryBorder,
  },
  roleBadgeDriver: {
    backgroundColor: THEME.colors.blueSubtle,
    borderColor: THEME.colors.blueBorder,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: THEME.typography.mono,
  },
  roleBadgeTextCarrier: {
    color: THEME.colors.primary,
  },
  roleBadgeTextDriver: {
    color: THEME.colors.blue,
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
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    fontFamily: THEME.typography.mono,
    marginBottom: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
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
    backgroundColor: THEME.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  menuItemSub: {
    color: THEME.colors.textMuted,
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
    backgroundColor: THEME.colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  langPillText: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: THEME.typography.mono,
  },
  badgePill: {
    backgroundColor: THEME.colors.amberSubtle,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgePillText: {
    color: THEME.colors.amber,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: THEME.typography.mono,
  },

  // ── Footer / Logout ──
  drawerFooter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.cardBorder,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: THEME.colors.redSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.redBorder,
    paddingVertical: 11,
    borderRadius: 8,
  },
  logoutBtnText: {
    color: THEME.colors.red,
    fontSize: 13,
    fontWeight: '700',
  },
});
