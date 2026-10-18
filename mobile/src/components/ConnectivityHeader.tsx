// TradeFlow Mobile — Top Header (Dynamic Dark & Light Mode)
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AuthUser } from '../types/auth';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import SideMenuDrawer from './SideMenuDrawer';

interface Props {
  isOnline: boolean;
  pendingCount: number;
  onToggleNetwork: () => void;
  onOpenQueue: () => void;
  currentUser?: AuthUser | null;
  onSignOut?: () => void;
  activeRole?: 'transporter' | 'driver';
  onSelectRole?: (role: 'transporter' | 'driver') => void;
}

export default function ConnectivityHeader({
  isOnline,
  pendingCount,
  onToggleNetwork,
  onOpenQueue,
  currentUser,
  onSignOut,
  activeRole,
  onSelectRole,
}: Props) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [drawerVisible, setDrawerVisible] = useState(false);

  return (
    <>
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.cardBorder,
          },
        ]}
      >
        {/* Left Side: Hamburger Menu & Status Chips */}
        <View style={styles.leftGroup}>
          <TouchableOpacity
            style={[
              styles.hamburgerBtn,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.cardBorder,
              },
            ]}
            onPress={() => setDrawerVisible(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="menu" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          {!isOnline && (
            <TouchableOpacity
              style={[
                styles.offlineBadge,
                {
                  backgroundColor: theme.colors.amberSubtle,
                  borderColor: 'rgba(245, 158, 11, 0.3)',
                },
              ]}
              onPress={onToggleNetwork}
              activeOpacity={0.7}
            >
              <Feather name="cloud-off" size={11} color={theme.colors.amber} />
              <Text style={[styles.offlineBadgeText, { color: theme.colors.amber }]}>{t('offline')}</Text>
            </TouchableOpacity>
          )}

          {pendingCount > 0 && (
            <TouchableOpacity
              style={[
                styles.pendingBadge,
                {
                  backgroundColor: theme.colors.amberSubtle,
                  borderColor: 'rgba(245, 158, 11, 0.3)',
                },
              ]}
              onPress={onOpenQueue}
              activeOpacity={0.7}
            >
              <View style={[styles.pendingDot, { backgroundColor: theme.colors.amber }]} />
              <Text style={[styles.pendingText, { color: theme.colors.amber }]}>
                {pendingCount} {t('queued')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Right Side: Clean TradeFlow Brand */}
        <View style={styles.brandGroupRight}>
          <Image
            source={require('../../assets/tradeflow-logo.png')}
            style={styles.logoSmall}
            resizeMode="contain"
          />
          <Text style={[styles.brandName, { color: theme.colors.textPrimary }]}>TradeFlow</Text>
        </View>
      </View>

      {/* Slide-out Menu Drawer */}
      <SideMenuDrawer
        visible={drawerVisible}
        currentUser={currentUser}
        pendingCount={pendingCount}
        onOpenQueue={onOpenQueue}
        onSignOut={onSignOut}
        activeRole={activeRole}
        onSelectRole={onSelectRole}
        onClose={() => setDrawerVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hamburgerBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandGroupRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-end',
  },
  logoSmall: {
    width: 26,
    height: 26,
    borderRadius: 6,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pendingText: {
    fontSize: 11,
    fontWeight: '600',
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  offlineBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
