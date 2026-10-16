// TradeFlow Mobile — Top Header (Dynamic Dark & Light Mode)
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AuthUser } from '../types/auth';
import { useTheme } from '../context/ThemeContext';
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
  const { theme } = useTheme();
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
              <Text style={[styles.offlineBadgeText, { color: theme.colors.amber }]}>Offline</Text>
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
                {pendingCount} queued
              </Text>
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
                  currentUser?.role === 'DRIVER'
                    ? {
                        backgroundColor: theme.colors.blueSubtle,
                        borderColor: theme.colors.blueBorder,
                      }
                    : {
                        backgroundColor: theme.colors.primarySubtle,
                        borderColor: theme.colors.primaryBorder,
                      },
                ]}
              >
                <Text
                  style={[
                    styles.userBadgeText,
                    {
                      color:
                        currentUser?.role === 'DRIVER'
                          ? theme.colors.blue
                          : theme.colors.primary,
                    },
                  ]}
                >
                  {currentUser?.role === 'TRANSPORTER' ? 'CARRIER' : 'DRIVER'}
                </Text>
              </View>
            )}
            <Text style={[styles.brandName, { color: theme.colors.textPrimary }]}>TradeFlow</Text>
          </View>

          <Text style={[styles.brandSubRight, { color: theme.colors.textMuted }]} numberOfLines={1}>
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
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  nameRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  brandSubRight: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'right',
  },
  userBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  userBadgeText: {
    fontSize: 9,
    fontWeight: '700',
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
