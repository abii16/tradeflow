// TradeFlow Mobile — Freight Load Card (Real Production Logistics Design)
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CargoLoad } from '../types/cargo';
import { THEME } from '../styles/theme';

interface Props {
  item: CargoLoad;
  onBid: (item: CargoLoad) => void;
}

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
  const isBidPlaced = item.status === 'bid_placed';
  const isUrgent = item.urgency === 'urgent';

  return (
    <View style={styles.card}>
      {/* Top header row: Commodity and Rate */}
      <View style={styles.topRow}>
        <View style={styles.cargoInfo}>
          <Text style={styles.commodity}>{item.cargoType}</Text>
          <Text style={styles.loadId}>{item.id} • {timeAgo(item.postedAt)}</Text>
        </View>

        <View style={styles.rateBlock}>
          <Text style={styles.rateAmount}>{formatETB(item.rateETB)}</Text>
          <Text style={styles.rateCurrency}>ETB</Text>
        </View>
      </View>

      {/* Route Section */}
      <View style={styles.routeContainer}>
        <View style={styles.timeline}>
          <View style={styles.timelineDotStart} />
          <View style={styles.timelineLine} />
          <View style={styles.timelineDotEnd} />
        </View>

        <View style={styles.routeDetails}>
          <View style={styles.locationStop}>
            <Text style={styles.cityText}>{item.origin}</Text>
            <Text style={styles.windowText}>Pickup: {item.pickupWindow}</Text>
          </View>

          <View style={styles.locationStop}>
            <Text style={styles.cityText}>{item.destination}</Text>
            <Text style={styles.distanceText}>{item.distanceKm} km</Text>
          </View>
        </View>
      </View>

      {/* Load Specs strip */}
      <View style={styles.specsRow}>
        <View style={styles.specItem}>
          <Text style={styles.specLabel}>Weight</Text>
          <Text style={styles.specValue}>{item.weightTons} tons</Text>
        </View>

        <View style={styles.specDivider} />

        <View style={styles.specItem}>
          <Text style={styles.specLabel}>Corridor Leg</Text>
          <Text style={styles.specValue}>
            {item.distanceKm > 500 ? 'Long Haul' : 'Regional'}
          </Text>
        </View>

        <View style={styles.specDivider} />

        <View style={styles.specItem}>
          <Text style={styles.specLabel}>Status</Text>
          <Text
            style={[
              styles.specValue,
              isBidPlaced ? styles.statusBidPlaced : styles.statusOpen,
            ]}
          >
            {isBidPlaced ? 'Bid Placed' : 'Available'}
          </Text>
        </View>
      </View>

      {/* Footer / Action */}
      <View style={styles.footer}>
        {isUrgent ? (
          <View style={styles.urgentBadge}>
            <Text style={styles.urgentText}>Urgent Dispatch</Text>
          </View>
        ) : (
          <Text style={styles.titleText} numberOfLines={1}>
            {item.title}
          </Text>
        )}

        {item.status === 'open' ? (
          <TouchableOpacity
            style={styles.bidButton}
            onPress={() => onBid(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.bidButtonText}>Place Bid</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.bidPlacedBadge}>
            <Feather name="check" size={13} color={THEME.colors.amber} />
            <Text style={styles.bidPlacedText}>Bid Submitted</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    padding: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cargoInfo: {
    flex: 1,
    marginRight: 12,
  },
  commodity: {
    color: THEME.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  loadId: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontFamily: THEME.typography.mono,
  },
  rateBlock: {
    alignItems: 'flex-end',
  },
  rateAmount: {
    color: THEME.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    fontFamily: THEME.typography.mono,
    letterSpacing: -0.5,
  },
  rateCurrency: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: -2,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: THEME.colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  timeline: {
    width: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginRight: 10,
  },
  timelineDotStart: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.primary,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: THEME.colors.cardBorder,
    marginVertical: 4,
  },
  timelineDotEnd: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.blue,
  },
  routeDetails: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 8,
  },
  locationStop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cityText: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  windowText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
  },
  distanceText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontFamily: THEME.typography.mono,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: THEME.colors.cardBorder,
    marginBottom: 12,
  },
  specItem: {
    flex: 1,
    alignItems: 'center',
  },
  specLabel: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  specValue: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: THEME.typography.mono,
  },
  statusOpen: {
    color: THEME.colors.primary,
  },
  statusBidPlaced: {
    color: THEME.colors.amber,
  },
  specDivider: {
    width: 1,
    height: 20,
    backgroundColor: THEME.colors.cardBorder,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    flex: 1,
    marginRight: 10,
  },
  urgentBadge: {
    backgroundColor: THEME.colors.redSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  urgentText: {
    color: THEME.colors.red,
    fontSize: 11,
    fontWeight: '600',
  },
  bidButton: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  bidButtonText: {
    color: THEME.colors.primaryText,
    fontSize: 13,
    fontWeight: '700',
  },
  bidPlacedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.colors.amberSubtle,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  bidPlacedText: {
    color: THEME.colors.amber,
    fontSize: 12,
    fontWeight: '600',
  },
});
