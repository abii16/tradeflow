// TradeFlow Mobile — Top Header (Production Logistics Look)
import React from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { THEME } from '../styles/theme';

import { AuthUser } from '../types/auth';

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
  return (
    <View style={styles.header}>
      {/* Brand title */}
      <View style={styles.brandGroup}>
        <View>
          <View style={styles.nameRow}>
            <Text style={styles.brandName}>TradeFlow</Text>
            {Boolean(currentUser) && (
              <View style={styles.userBadge}>
                <Text style={styles.userBadgeText}>
                  {currentUser?.role === 'TRANSPORTER' ? 'CARRIER' : 'DRIVER'}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.brandSub} numberOfLines={1}>
            {currentUser?.companyName || currentUser?.fullName || (currentUser?.role === 'DRIVER' ? `Truck ${currentUser.licensePlate || '3-AA-98214'}` : 'Transporter')}
          </Text>
        </View>
      </View>

      {/* Network toggle, Pending actions & Sign out */}
      <View style={styles.controlsGroup}>
        {Boolean(onSignOut) && (
          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={onSignOut}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="log-out" size={13} color={THEME.colors.textMuted} />
          </TouchableOpacity>
        )}
        {pendingCount > 0 ? (
          <TouchableOpacity
            style={styles.pendingBadge}
            onPress={onOpenQueue}
            activeOpacity={0.7}
          >
            <View style={styles.pendingDot} />
            <Text style={styles.pendingText}>{pendingCount} queued</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.queueButton}
            onPress={onOpenQueue}
            activeOpacity={0.7}
          >
            <Feather name="layers" size={14} color={THEME.colors.textMuted} />
          </TouchableOpacity>
        )}

        <View style={styles.connectionToggle}>
          <View
            style={[
              styles.statusIndicator,
              isOnline ? styles.indicatorOnline : styles.indicatorOffline,
            ]}
          />
          <Text style={styles.statusLabel}>{isOnline ? 'Online' : 'Offline'}</Text>
          <Switch
            value={isOnline}
            onValueChange={onToggleNetwork}
            trackColor={{ false: '#3A3A3A', true: '#244533' }}
            thumbColor={isOnline ? THEME.colors.primary : '#888888'}
            style={styles.switch}
          />
        </View>
      </View>
    </View>
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
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  brandName: {
    color: THEME.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  brandSub: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  controlsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userBadge: {
    backgroundColor: THEME.colors.primarySubtle,
    borderWidth: 1,
    borderColor: THEME.colors.primaryBorder,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  userBadgeText: {
    color: THEME.colors.primary,
    fontSize: 9,
    fontWeight: '700',
    fontFamily: THEME.typography.mono,
  },
  signOutBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  queueButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: THEME.colors.surface,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.amberSubtle,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  connectionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.surface,
    paddingLeft: 8,
    paddingRight: 2,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  indicatorOnline: {
    backgroundColor: THEME.colors.primary,
  },
  indicatorOffline: {
    backgroundColor: THEME.colors.red,
  },
  statusLabel: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  switch: {
    transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }],
  },
});
