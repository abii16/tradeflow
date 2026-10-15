// TradeFlow Mobile — Connectivity Header (Web UniversalTopBar Look)
import React from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
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
    <View style={styles.container}>
      {/* Top brand row */}
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Ionicons name="flash" size={14} color={THEME.colors.emerald} />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.brandTitle}>TRADEFLOW</Text>
              <View style={styles.portalTag}>
                <Text style={styles.portalTagText}>CARRIER</Text>
              </View>
            </View>
            <Text style={styles.corridorSubtitle}>Addis – Djibouti Corridor Hub</Text>
          </View>
        </View>

        {pendingCount > 0 ? (
          <TouchableOpacity
            style={styles.queueButton}
            onPress={onOpenQueue}
            activeOpacity={0.8}
          >
            <Feather name="layers" size={12} color={THEME.colors.amber} />
            <Text style={styles.queueButtonText}>{pendingCount} queued</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.queueButtonSynced}
            onPress={onOpenQueue}
            activeOpacity={0.8}
          >
            <Feather name="check" size={12} color={THEME.colors.emerald} />
            <Text style={styles.queueButtonTextSynced}>Queue Synced</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Connectivity Banner / Toggle */}
      <View style={[styles.networkBanner, !isOnline && styles.networkBannerOffline]}>
        <View style={styles.networkLeft}>
          <View
            style={[
              styles.statusPulse,
              isOnline ? styles.statusPulseOnline : styles.statusPulseOffline,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                isOnline ? styles.statusDotOnline : styles.statusDotOffline,
              ]}
            />
          </View>
          <View>
            <Text style={styles.networkTitle}>
              {isOnline ? 'Corridor Network Active' : 'Dead-Zone Mode (Offline)'}
            </Text>
            <Text style={styles.networkDesc}>
              {isOnline
                ? 'Direct telemetry & bid synchronization'
                : 'Auto-queuing in local SQLite storage'}
            </Text>
          </View>
        </View>

        <View style={styles.toggleWrapper}>
          <Text style={styles.toggleLabel}>{isOnline ? 'LIVE' : 'SIM'}</Text>
          <Switch
            value={isOnline}
            onValueChange={onToggleNetwork}
            trackColor={{ false: '#3E2424', true: '#1A3828' }}
            thumbColor={isOnline ? THEME.colors.emerald : '#EF4444'}
            style={styles.switch}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.backgroundSurface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: THEME.colors.emeraldGlow,
    borderWidth: 1,
    borderColor: 'rgba(62, 207, 142, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  portalTag: {
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  portalTagText: {
    color: THEME.colors.emerald,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  corridorSubtitle: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
  queueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: THEME.colors.amberGlow,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  queueButtonText: {
    color: THEME.colors.amber,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: THEME.typography.fontMono,
  },
  queueButtonSynced: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  queueButtonTextSynced: {
    color: THEME.colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  networkBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1B241E',
    borderWidth: 1,
    borderColor: 'rgba(62, 207, 142, 0.25)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  networkBannerOffline: {
    backgroundColor: '#241B1B',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  networkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  statusPulse: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPulseOnline: {
    backgroundColor: 'rgba(62, 207, 142, 0.2)',
  },
  statusPulseOffline: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotOnline: {
    backgroundColor: THEME.colors.emerald,
  },
  statusDotOffline: {
    backgroundColor: '#EF4444',
  },
  networkTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  networkDesc: {
    color: THEME.colors.textMuted,
    fontSize: 10,
  },
  toggleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleLabel: {
    color: THEME.colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: THEME.typography.fontMono,
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
});
