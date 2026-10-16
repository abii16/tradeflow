// TradeFlow Mobile — Offline Queue Modal (Clean, Functional UI)
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
import { Feather } from '@expo/vector-icons';
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

const ACTION_DESCRIPTIONS: Record<string, string> = {
  SUBMIT_BID: 'Bid Submission',
  ACCEPT_LOAD: 'Load Acceptance',
  WAYPOINT_CHECKIN: 'Waypoint Check-in',
};

function formatTime(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(item.payload);
    } catch {
      // ignore
    }

    const isPending = item.status === 'pending';
    const isSynced = item.status === 'synced';

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <View>
            <Text style={styles.actionTitle}>
              {ACTION_DESCRIPTIONS[item.actionType] ?? item.actionType}
            </Text>
            <Text style={styles.itemTime}>{formatTime(item.createdAt)}</Text>
          </View>

          <View
            style={[
              styles.statusChip,
              isPending ? styles.chipPending : isSynced ? styles.chipSynced : styles.chipFailed,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isPending ? styles.textPending : isSynced ? styles.textSynced : styles.textFailed,
              ]}
            >
              {isPending ? 'Pending' : isSynced ? 'Synced' : 'Failed'}
            </Text>
          </View>
        </View>

        {Boolean(payload.cargoId) && (
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Load ID:</Text>
            <Text style={styles.detailValue}>{String(payload.cargoId)}</Text>
            {Boolean(payload.amountETB) && (
              <>
                <Text style={styles.detailSeparator}>•</Text>
                <Text style={styles.detailRate}>
                  {Number(payload.amountETB).toLocaleString()} ETB
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

        <View style={styles.modalContent}>
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Offline Queue</Text>
              <Text style={styles.subtitle}>
                {items.length} {items.length === 1 ? 'action' : 'actions'} stored locally
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <Feather name="x" size={18} color={THEME.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Status banner */}
          <View
            style={[
              styles.connectionBanner,
              isOnline ? styles.bannerOnline : styles.bannerOffline,
            ]}
          >
            <Feather
              name={isOnline ? 'check-circle' : 'cloud-off'}
              size={14}
              color={isOnline ? THEME.colors.primary : THEME.colors.amber}
            />
            <Text style={styles.bannerText}>
              {isOnline ? 'Online' : 'Offline — saved locally'}
            </Text>
          </View>

          {/* List */}
          {items.length === 0 ? (
            <View style={styles.emptyBox}>
              <Feather
                name="inbox"
                size={32}
                color={THEME.colors.textMuted}
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.emptyTitle}>No queued actions</Text>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderItem}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.closeBtnFooter}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.syncBtn,
                (!isOnline || syncing || pendingCount === 0) && styles.syncBtnDisabled,
              ]}
              onPress={onSyncNow}
              disabled={!isOnline || syncing || pendingCount === 0}
              activeOpacity={0.8}
            >
              {syncing ? (
                <ActivityIndicator size="small" color={THEME.colors.primaryText} />
              ) : (
                <Text style={styles.syncBtnText}>
                  Sync {pendingCount > 0 ? `(${pendingCount})` : ''}
                </Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: THEME.colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '80%',
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.colors.cardBorder,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  title: {
    color: THEME.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: THEME.colors.surfaceElevated,
  },
  connectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  bannerOnline: {
    backgroundColor: THEME.colors.primarySubtle,
  },
  bannerOffline: {
    backgroundColor: THEME.colors.amberSubtle,
  },
  bannerText: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  list: {
    paddingBottom: 16,
  },
  itemCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    padding: 12,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  itemTime: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontFamily: THEME.typography.mono,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  chipPending: {
    backgroundColor: THEME.colors.amberSubtle,
  },
  chipSynced: {
    backgroundColor: THEME.colors.primarySubtle,
  },
  chipFailed: {
    backgroundColor: THEME.colors.redSubtle,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  textPending: {
    color: THEME.colors.amber,
  },
  textSynced: {
    color: THEME.colors.primary,
  },
  textFailed: {
    color: THEME.colors.red,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    color: THEME.colors.textMuted,
    fontSize: 11,
  },
  detailValue: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontFamily: THEME.typography.mono,
  },
  detailSeparator: {
    color: THEME.colors.textMuted,
    fontSize: 11,
  },
  detailRate: {
    color: THEME.colors.primary,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: THEME.typography.mono,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.cardBorder,
  },
  closeBtnFooter: {
    flex: 1,
    backgroundColor: THEME.colors.surfaceElevated,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeBtnText: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  syncBtn: {
    flex: 2,
    backgroundColor: THEME.colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  syncBtnDisabled: {
    opacity: 0.4,
  },
  syncBtnText: {
    color: THEME.colors.primaryText,
    fontSize: 13,
    fontWeight: '700',
  },
});
