// TradeFlow Mobile — Top Header (Production Logistics Look)
import React from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { THEME } from '../styles/theme';

interface Props {
  isOnline: boolean;
  pendingCount: number;
  onToggleNetwork: () => void;
  onOpenQueue: () => void;
}

export default function ConnectivityHeader({
  isOnline,
  pendingCount,
  onToggleNetwork,
  onOpenQueue,
}: Props) {
  return (
    <View style={styles.header}>
      {/* Brand title */}
      <View style={styles.brandGroup}>
        <Text style={styles.brandName}>TradeFlow</Text>
        <Text style={styles.brandSub}>Transporter</Text>
      </View>

      {/* Network toggle & Pending actions */}
      <View style={styles.controlsGroup}>
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
