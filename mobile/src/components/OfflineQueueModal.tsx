// TradeFlow Mobile — Offline Queue Modal (Web Queue Inspector Look)
import React from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { OfflineAction } from '../types/cargo';
import { THEME } from '../styles/theme';

interface Props {
  visible: boolean;
  items: OfflineAction[];
  isOnline: boolean;
  syncing: boolean;
  onSyncNow: () => void;
  onClose: () => void;
}

const ACTION_LABELS: Record<string, { label: string; icon: keyof typeof Feather.glyphMap }> = {
  SUBMIT_BID: { label: 'Submit Carrier Tender', icon: 'send' },
  ACCEPT_LOAD: { label: 'Accept Haul Assignment', icon: 'check-circle' },
  WAYPOINT_CHECKIN: { label: 'Corridor Waypoint Check-in', icon: 'map-pin' },
};

function formatTime(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return isoStr;
  }
}

export default function OfflineQueueModal({
  visible,
  items,
  isOnline,
  syncing,
  onSyncNow,
  onClose,
}: Props) {
  const pendingCount = items.filter((i) => i.status === 'pending').length;

  const renderItem = ({ item }: { item: OfflineAction }) => {
    const actionMeta = ACTION_LABELS[item.actionType] ?? {
      label: item.actionType,
      icon: 'layers',
    };

    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(item.payload);
    } catch {
      // ignore
    }

    const isPending = item.status === 'pending';
    const isSynced = item.status === 'synced';
    const isFailed = item.status === 'failed';

    return (
      <View style={styles.queueItem}>
        <View style={styles.itemHeader}>
          <View style={styles.itemTypeRow}>
            <View style={styles.actionIconBox}>
              <Feather
                name={actionMeta.icon}
                size={13}
                color={THEME.colors.emerald}
              />
            </View>
            <View>
              <Text style={styles.queueAction}>{actionMeta.label}</Text>
              <Text style={styles.queueTime}>{formatTime(item.createdAt)}</Text>
            </View>
          </View>

          {/* Status Badge */}
          <View
            style={[
              styles.statusChip,
              isPending && styles.statusChipPending,
              isSynced && styles.statusChipSynced,
              isFailed && styles.statusChipFailed,
            ]}
          >
            <Text
              style={[
                styles.statusChipText,
                isPending && styles.statusTextPending,
                isSynced && styles.statusTextSynced,
                isFailed && styles.statusTextFailed,
              ]}
            >
              {isPending && 'PENDING'}
              {isSynced && 'SYNCED ✓'}
              {isFailed && `RETRY (${item.retryCount})`}
            </Text>
          </View>
        </View>

        {/* Payload details preview */}
        {Boolean(payload.cargoId) && (
          <View style={styles.payloadBox}>
            <Text style={styles.payloadLabel}>CARGO REF:</Text>
            <Text style={styles.payloadValue}>{String(payload.cargoId)}</Text>
            {Boolean(payload.amountETB) && (
              <>
                <Text style={styles.payloadDivider}>•</Text>
                <Text style={styles.payloadRate}>
                  {Number(payload.amountETB).toLocaleString()} ETB
                </Text>
              </>
            )}
            {Boolean(payload.licensePlate) && (
              <>
                <Text style={styles.payloadDivider}>•</Text>
                <Text style={styles.payloadPlate}>
                  {String(payload.licensePlate)}
                </Text>
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.container}>
          <View style={styles.handleBar} />

          {/* Modal Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.titleRow}>
                <Text style={styles.title}>Offline Queue Ledger</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{items.length} records</Text>
                </View>
              </View>
              <Text style={styles.subtitle}>
                SQLite local buffer for Djibouti-Ethiopia corridor dead zones
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <Feather name="x" size={18} color={THEME.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Network Status Strip */}
          <View
            style={[
              styles.networkStrip,
              isOnline ? styles.networkOnline : styles.networkOffline,
            ]}
          >
            <Ionicons
              name={isOnline ? 'wifi' : 'cloud-offline'}
              size={14}
              color={isOnline ? THEME.colors.emerald : THEME.colors.amber}
            />
            <Text style={styles.networkStripText}>
              {isOnline
                ? 'Network active — ready to dispatch buffered actions.'
                : 'Offline mode active — actions will remain safely in SQLite.'}
            </Text>
          </View>

          {/* Queue List */}
          {items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather
                name="check-circle"
                size={36}
                color={THEME.colors.emerald}
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyTitle}>All Transmissions Synchronized</Text>
              <Text style={styles.emptySub}>
                Every action taken while offline has successfully synchronized with
                the TradeFlow central server.
              </Text>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Bottom Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.closeFooterBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeFooterBtnText}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.syncBtn,
                (!isOnline || syncing || pendingCount === 0) &&
                  styles.syncBtnDisabled,
              ]}
              onPress={onSyncNow}
              disabled={!isOnline || syncing || pendingCount === 0}
              activeOpacity={0.8}
            >
              {syncing ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color={THEME.colors.emeraldText}
                  />
                  <Text style={styles.syncBtnText}>Syncing Ledger...</Text>
                </>
              ) : (
                <>
                  <Feather
                    name="refresh-cw"
                    size={14}
                    color={THEME.colors.emeraldText}
                  />
                  <Text style={styles.syncBtnText}>
                    Sync {pendingCount} Pending
                  </Text>
                </>
              )}
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
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  container: {
    backgroundColor: THEME.colors.backgroundSurface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    maxHeight: '85%',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.colors.borderLight,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: THEME.colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  countBadge: {
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  countBadgeText: {
    color: THEME.colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: THEME.typography.fontMono,
  },
  subtitle: {
    color: THEME.colors.textMuted,
    fontSize: 10.5,
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  networkStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    borderWidth: 1,
  },
  networkOnline: {
    backgroundColor: '#16221A',
    borderColor: 'rgba(62, 207, 142, 0.25)',
  },
  networkOffline: {
    backgroundColor: '#221D16',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  networkStripText: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  queueItem: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  actionIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: THEME.colors.emeraldGlow,
    borderWidth: 1,
    borderColor: 'rgba(62, 207, 142, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueAction: {
    color: THEME.colors.textPrimary,
    fontSize: 12.5,
    fontWeight: '700',
  },
  queueTime: {
    color: THEME.colors.textDim,
    fontSize: 9.5,
    fontFamily: THEME.typography.fontMono,
  },
  statusChip: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
    borderWidth: 1,
  },
  statusChipPending: {
    backgroundColor: THEME.colors.amberGlow,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  statusChipSynced: {
    backgroundColor: THEME.colors.emeraldGlow,
    borderColor: 'rgba(62, 207, 142, 0.35)',
  },
  statusChipFailed: {
    backgroundColor: THEME.colors.redGlow,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  statusChipText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: THEME.typography.fontMono,
  },
  statusTextPending: {
    color: THEME.colors.amber,
  },
  statusTextSynced: {
    color: THEME.colors.emerald,
  },
  statusTextFailed: {
    color: THEME.colors.red,
  },
  payloadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: THEME.colors.borderMuted,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  payloadLabel: {
    color: THEME.colors.textDim,
    fontSize: 9,
    fontWeight: '700',
    fontFamily: THEME.typography.fontMono,
  },
  payloadValue: {
    color: THEME.colors.blue,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: THEME.typography.fontMono,
  },
  payloadDivider: {
    color: THEME.colors.textDim,
    fontSize: 10,
  },
  payloadRate: {
    color: THEME.colors.emerald,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: THEME.typography.fontMono,
  },
  payloadPlate: {
    color: THEME.colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    fontFamily: THEME.typography.fontMono,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    marginBottom: 10,
  },
  emptyTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySub: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  closeFooterBtn: {
    flex: 1,
    backgroundColor: '#242424',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeFooterBtnText: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  syncBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: THEME.colors.emerald,
    paddingVertical: 12,
    borderRadius: 10,
  },
  syncBtnDisabled: {
    opacity: 0.4,
  },
  syncBtnText: {
    color: THEME.colors.emeraldText,
    fontSize: 13,
    fontWeight: '800',
  },
});
