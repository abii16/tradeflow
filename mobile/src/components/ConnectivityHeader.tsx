// TradeFlow Mobile — Top Header (Production Logistics Look)
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { THEME } from '../styles/theme';
import { AuthUser } from '../types/auth';
import SideMenuDrawer from './SideMenuDrawer';

interface Props {
  isOnline: boolean;
  pendingCount: number;
  onToggleNetwork: () => void;
  onOpenQueue: () => void;
  currentUser?: AuthUser | null;
  onSignOut?: () => void;
}

export default function ConnectivityHeader({
  isOnline,
  pendingCount,
  onToggleNetwork,
  onOpenQueue,
  currentUser,
  onSignOut,
}: Props) {
  const [drawerVisible, setDrawerVisible] = useState(false);

  return (
    <>
      <View style={styles.header}>
        {/* Left Side: Hamburger Menu & Status Chips */}
        <View style={styles.leftGroup}>
          <TouchableOpacity
            style={styles.hamburgerBtn}
            onPress={() => setDrawerVisible(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="menu" size={20} color={THEME.colors.textPrimary} />
          </TouchableOpacity>

          {!isOnline && (
            <TouchableOpacity
              style={styles.offlineBadge}
              onPress={onToggleNetwork}
              activeOpacity={0.7}
            >
              <Feather name="cloud-off" size={11} color={THEME.colors.amber} />
              <Text style={styles.offlineBadgeText}>Offline</Text>
            </TouchableOpacity>
          )}

          {pendingCount > 0 && (
            <TouchableOpacity
              style={styles.pendingBadge}
              onPress={onOpenQueue}
              activeOpacity={0.7}
            >
              <View style={styles.pendingDot} />
              <Text style={styles.pendingText}>{pendingCount} queued</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Right Side: TradeFlow Brand, Role Badge & Entity Details */}
        <View style={styles.brandGroupRight}>
          <View style={styles.nameRowRight}>
            {Boolean(currentUser) && (
              <View
                style={[
                  styles.userBadge,
                  currentUser?.role === 'DRIVER' && styles.userBadgeDriver,
                ]}
              >
                <Text
                  style={[
                    styles.userBadgeText,
                    currentUser?.role === 'DRIVER' && styles.userBadgeTextDriver,
                  ]}
                >
                  {currentUser?.role === 'TRANSPORTER' ? 'CARRIER' : 'DRIVER'}
                </Text>
              </View>
            )}
            <Text style={styles.brandName}>TradeFlow</Text>
          </View>

          <Text style={styles.brandSubRight} numberOfLines={1}>
            {currentUser?.companyName ||
              currentUser?.fullName ||
              (currentUser?.role === 'DRIVER'
                ? `Truck ${currentUser.licensePlate || '3-AA-98214'}`
                : 'Transporter')}
          </Text>
        </View>
      </View>

      {/* Slide-out Menu Drawer */}
      <SideMenuDrawer
        visible={drawerVisible}
        currentUser={currentUser}
        pendingCount={pendingCount}
        onOpenQueue={onOpenQueue}
        onSignOut={onSignOut}
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
    backgroundColor: THEME.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.cardBorder,
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
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandGroupRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  nameRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandName: {
    color: THEME.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  brandSubRight: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'right',
  },
  userBadge: {
    backgroundColor: THEME.colors.primarySubtle,
    borderWidth: 1,
    borderColor: THEME.colors.primaryBorder,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  userBadgeDriver: {
    backgroundColor: THEME.colors.blueSubtle,
    borderColor: THEME.colors.blueBorder,
  },
  userBadgeText: {
    color: THEME.colors.primary,
    fontSize: 9,
    fontWeight: '700',
    fontFamily: THEME.typography.mono,
  },
  userBadgeTextDriver: {
    color: THEME.colors.blue,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.amberSubtle,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.amber,
  },
  pendingText: {
    color: THEME.colors.amber,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: THEME.typography.mono,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: THEME.colors.amberSubtle,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  offlineBadgeText: {
    color: THEME.colors.amber,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: THEME.typography.mono,
  },
});
