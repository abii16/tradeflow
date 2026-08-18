// TradeFlow Mobile — Offline Queue Modal
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { OfflineAction } from '../types/cargo';

interface Props {
  visible: boolean;
  items: OfflineAction[];
  syncing: boolean;
  onSync: () => void;
  onClose: () => void;
}

const ACTION_LABELS: Record<string, string> = {
  SUBMIT_BID: 'Bid Submission',
  ACCEPT_LOAD: 'Load Acceptance',
  WAYPOINT_CHECKIN: 'Waypoint Check-in',
};

const STATUS_STYLES: Record<string, { color: string; label: string }> = {
  pending: { color: '#fbbf24', label: 'Pending' },
  synced: { color: '#4ade80', label: 'Synced' },
  failed: { color: '#f87171', label: 'Failed' },
};

function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export default function OfflineQueueModal({
  visible,
  items,
  syncing,
  onSync,
  onClose,
}: Props) {
  const pendingCount = items.filter((i) => i.status === 'pending').length;

  const renderItem = ({ item }: { item: OfflineAction }) => {
    const statusStyle = STATUS_STYLES[item.status] ?? STATUS_STYLES.pending;
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(item.payload);
    } catch {
      // ignore
    }

    return (
      <View style={styles.queueItem}>
        <View style={styles.queueItemLeft}>
          <Text style={styles.queueAction}>
            {ACTION_LABELS[item.actionType] ?? item.actionType}
          </Text>
          {payload.cargoId && (
            <Text style={styles.queueDetail}>{String(payload.cargoId)}</Text>
          )}
          <Text style={styles.queueTime}>{formatTime(item.createdAt)}</Text>
        </View>
        <View style={styles.queueItemRight}>
          <Text style={[styles.queueStatus, { color: statusStyle.color }]}>
            {statusStyle.label}
          </Text>
          {item.retryCount > 0 && (
            <Text style={styles.retryCount}>×{item.retryCount}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Offline Queue</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Queue list */}
          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No queued actions</Text>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderItem}
              style={styles.list}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}

          {/* Footer actions */}
          <View style={styles.footer}>
            <Text style={styles.footerCount}>
              {pendingCount} pending action{pendingCount !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity
              style={[styles.syncBtn, (syncing || pendingCount === 0) && styles.syncBtnDisabled]}
              onPress={onSync}
              activeOpacity={0.7}
              disabled={syncing || pendingCount === 0}
            >
              {syncing ? (
                <ActivityIndicator size="small" color="#f1f5f9" />
              ) : (
                <Text style={styles.syncText}>Sync Now</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  closeBtn: {
    fontSize: 16,
    color: '#94a3b8',
    paddingHorizontal: 4,
  },
  list: {
    maxHeight: 300,
  },
  queueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  queueItemLeft: {
    flex: 1,
  },
  queueAction: {
    fontSize: 13,
    fontWeight: '500',
    color: '#e2e8f0',
  },
  queueDetail: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  queueTime: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  queueItemRight: {
    alignItems: 'flex-end',
  },
  queueStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  retryCount: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#334155',
    marginHorizontal: 16,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  footerCount: {
    fontSize: 12,
    color: '#94a3b8',
  },
  syncBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#475569',
    minWidth: 90,
    alignItems: 'center',
  },
  syncBtnDisabled: {
    opacity: 0.4,
  },
  syncText: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: '600',
  },
});
