// TradeFlow Mobile — Cargo Card Component
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CargoLoad } from '../types/cargo';

interface Props {
  item: CargoLoad;
  onBid: (item: CargoLoad) => void;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  open: { bg: '#1a2e1a', text: '#4ade80', label: 'Open' },
  bid_placed: { bg: '#2e2a1a', text: '#fbbf24', label: 'Bid Placed' },
  in_transit: { bg: '#1a2335', text: '#60a5fa', label: 'In Transit' },
  delivered: { bg: '#1e293b', text: '#94a3b8', label: 'Delivered' },
};

function formatETB(amount: number): string {
  return amount.toLocaleString('en-US');
}

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function CargoCard({ item, onBid }: Props) {
  const statusStyle = STATUS_COLORS[item.status] ?? STATUS_COLORS.open;
  const canBid = item.status === 'open';

  return (
    <View style={styles.card}>
      {/* Top row: ID + status */}
      <View style={styles.topRow}>
        <Text style={styles.loadId}>{item.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {statusStyle.label}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>{item.title}</Text>

      {/* Route */}
      <View style={styles.routeRow}>
        <Text style={styles.routeLabel}>{item.origin}</Text>
        <Text style={styles.routeArrow}>→</Text>
        <Text style={styles.routeLabel}>{item.destination}</Text>
      </View>

      {/* Specs row */}
      <View style={styles.specsRow}>
        <View style={styles.specItem}>
          <Text style={styles.specValue}>{item.weightTons}T</Text>
          <Text style={styles.specLabel}>Weight</Text>
        </View>
        <View style={styles.specDivider} />
        <View style={styles.specItem}>
          <Text style={styles.specValue}>{item.distanceKm} km</Text>
          <Text style={styles.specLabel}>Distance</Text>
        </View>
        <View style={styles.specDivider} />
        <View style={styles.specItem}>
          <Text style={styles.specValue}>{formatETB(item.rateETB)} ETB</Text>
          <Text style={styles.specLabel}>Rate</Text>
        </View>
      </View>

      {/* Bottom row: pickup + urgency + bid button */}
      <View style={styles.bottomRow}>
        <View style={styles.metaCol}>
          <Text style={styles.metaText}>Pickup: {item.pickupWindow}</Text>
          <View style={styles.metaBottom}>
            <Text style={styles.timeAgo}>{timeAgo(item.postedAt)}</Text>
            {item.urgency === 'urgent' && (
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentText}>Urgent</Text>
              </View>
            )}
          </View>
        </View>
        {canBid && (
          <TouchableOpacity
            style={styles.bidButton}
            onPress={() => onBid(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.bidButtonText}>Place Bid</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  loadId: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  routeLabel: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  routeArrow: {
    fontSize: 13,
    color: '#64748b',
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    marginBottom: 10,
  },
  specItem: {
    flex: 1,
    alignItems: 'center',
  },
  specValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  specLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  specDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#334155',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  metaCol: {
    flex: 1,
  },
  metaText: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  metaBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeAgo: {
    fontSize: 11,
    color: '#64748b',
  },
  urgentBadge: {
    backgroundColor: '#3b1a1a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#f87171',
  },
  bidButton: {
    backgroundColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#475569',
  },
  bidButtonText: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: '600',
  },
});
