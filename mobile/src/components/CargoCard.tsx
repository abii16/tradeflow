// TradeFlow Mobile — Cargo Card (Web LoadBoard Look)
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
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

// Generate realistic AI Match score like web LoadBoard
function getAiMatchScore(id: string): number {
  const num = parseInt(id.replace(/\D/g, ''), 10) || 88;
  return 92 + (num % 7);
}

export default function CargoCard({ item, onBid }: Props) {
  const statusConfig = THEME.colors.status[item.status] ?? THEME.colors.status.open;
  const canBid = item.status === 'open';
  const matchScore = getAiMatchScore(item.id);

  return (
    <View style={styles.card}>
      {/* Top Row: AI Match Pill + Commodity Badge */}
      <View style={styles.headerRow}>
        <View style={styles.matchPill}>
          <Ionicons name="sparkles" size={11} color={THEME.colors.emerald} />
          <Text style={styles.matchText}>{matchScore}% AI Match</Text>
        </View>

        <View style={styles.commodityBadge}>
          <Text style={styles.commodityText} numberOfLines={1}>
            {item.cargoType.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Consignment Title & ID */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.cargoId}>{item.id}</Text>
      </View>

      {/* Corridor Route Visualizer (Djibouti -> Modjo) */}
      <View style={styles.corridorContainer}>
        <View style={styles.routePoint}>
          <View style={styles.originDot} />
          <View style={styles.routeTextGroup}>
            <Text style={styles.routeCity}>{item.origin}</Text>
            <Text style={styles.routeRole}>Origin Hub</Text>
          </View>
        </View>

        <View style={styles.corridorDivider}>
          <View style={styles.dottedLine} />
          <View style={styles.distanceBadge}>
            <Feather name="navigation" size={9} color={THEME.colors.blue} />
            <Text style={styles.distanceText}>{item.distanceKm} km</Text>
          </View>
          <View style={styles.dottedLine} />
        </View>

        <View style={styles.routePoint}>
          <View style={styles.destDot} />
          <View style={styles.routeTextGroup}>
            <Text style={styles.routeCity}>{item.destination}</Text>
            <Text style={styles.routeRole}>Destination Hub</Text>
          </View>
        </View>
      </View>

      {/* Cargo Metrics Grid (Weight, Pickup, Listed Rate) */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>PAYLOAD</Text>
          <View style={styles.metricValRow}>
            <MaterialCommunityIcons
              name="weight"
              size={14}
              color={THEME.colors.textSecondary}
            />
            <Text style={styles.metricValue}>{item.weightTons} T</Text>
          </View>
        </View>

        <View style={styles.metricSeparator} />

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>PICKUP WINDOW</Text>
          <View style={styles.metricValRow}>
            <Feather name="clock" size={13} color={THEME.colors.textSecondary} />
            <Text style={styles.metricValueSmall} numberOfLines={1}>
              {item.pickupWindow.split(' ')[0]}
            </Text>
          </View>
        </View>

        <View style={styles.metricSeparator} />

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>TARGET RATE</Text>
          <Text style={styles.rateValue}>{formatETB(item.rateETB)}</Text>
          <Text style={styles.currencyCode}>ETB</Text>
        </View>
      </View>

      {/* Bottom Footer: Status / Urgency & Actions */}
      <View style={styles.footerRow}>
        <View style={styles.footerLeft}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusConfig.bg,
                borderColor: statusConfig.border,
              },
            ]}
          >
            <Text style={[styles.statusText, { color: statusConfig.text }]}>
              {statusConfig.label}
            </Text>
          </View>

          {item.urgency === 'urgent' && (
            <View style={styles.urgentBadge}>
              <Ionicons name="flash" size={10} color={THEME.colors.red} />
              <Text style={styles.urgentText}>PRIORITY</Text>
            </View>
          )}

          <Text style={styles.timeAgoText}>{timeAgo(item.postedAt)}</Text>
        </View>

        {canBid ? (
          <TouchableOpacity
            style={styles.bidButton}
            onPress={() => onBid(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.bidButtonText}>Place Bid</Text>
            <Feather name="arrow-right" size={13} color={THEME.colors.emeraldText} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placedBadge}>
            <Feather name="check-circle" size={12} color={THEME.colors.amber} />
            <Text style={styles.placedText}>Bid Active</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  matchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: THEME.colors.emeraldGlow,
    borderWidth: 1,
    borderColor: 'rgba(62, 207, 142, 0.35)',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 20,
  },
  matchText: {
    color: THEME.colors.emerald,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  commodityBadge: {
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: THEME.colors.borderMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: '50%',
  },
  commodityText: {
    color: THEME.colors.textMuted,
    fontSize: 9.5,
    fontWeight: '700',
    fontFamily: THEME.typography.fontMono,
    letterSpacing: 0.5,
  },
  titleSection: {
    marginBottom: 12,
  },
  title: {
    color: THEME.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 2,
  },
  cargoId: {
    color: THEME.colors.textDim,
    fontSize: 10,
    fontFamily: THEME.typography.fontMono,
    letterSpacing: 0.5,
  },
  corridorContainer: {
    backgroundColor: '#181818',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.borderMuted,
    padding: 12,
    marginBottom: 12,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  originDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: THEME.colors.emerald,
    borderWidth: 2,
    borderColor: 'rgba(62, 207, 142, 0.4)',
  },
  destDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: THEME.colors.blue,
    borderWidth: 2,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  routeTextGroup: {
    flex: 1,
  },
  routeCity: {
    color: THEME.colors.textPrimary,
    fontSize: 12.5,
    fontWeight: '700',
  },
  routeRole: {
    color: THEME.colors.textDim,
    fontSize: 9.5,
    fontWeight: '500',
  },
  corridorDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    paddingLeft: 4,
  },
  dottedLine: {
    flex: 1,
    height: 1,
    backgroundColor: THEME.colors.border,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#222222',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  distanceText: {
    color: THEME.colors.blue,
    fontSize: 9.5,
    fontWeight: '700',
    fontFamily: THEME.typography.fontMono,
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: THEME.colors.borderMuted,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    color: THEME.colors.textMuted,
    fontSize: 8.5,
    fontWeight: '700',
    fontFamily: THEME.typography.fontMono,
    marginBottom: 3,
    letterSpacing: 0.5,
  },
  metricValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    color: THEME.colors.textPrimary,
    fontSize: 12.5,
    fontWeight: '700',
    fontFamily: THEME.typography.fontMono,
  },
  metricValueSmall: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: THEME.typography.fontMono,
  },
  rateValue: {
    color: THEME.colors.emerald,
    fontSize: 13,
    fontWeight: '800',
    fontFamily: THEME.typography.fontMono,
  },
  currencyCode: {
    color: THEME.colors.textMuted,
    fontSize: 8.5,
    fontWeight: '600',
    fontFamily: THEME.typography.fontMono,
  },
  metricSeparator: {
    width: 1,
    height: 26,
    backgroundColor: THEME.colors.borderMuted,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: THEME.colors.redGlow,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  urgentText: {
    color: THEME.colors.red,
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeAgoText: {
    color: THEME.colors.textDim,
    fontSize: 9.5,
  },
  bidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: THEME.colors.emerald,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9,
    shadowColor: THEME.colors.emerald,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 2,
  },
  bidButtonText: {
    color: THEME.colors.emeraldText,
    fontSize: 12,
    fontWeight: '800',
  },
  placedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.colors.amberGlow,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  placedText: {
    color: THEME.colors.amber,
    fontSize: 11,
    fontWeight: '700',
  },
});
