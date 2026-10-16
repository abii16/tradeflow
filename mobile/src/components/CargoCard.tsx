import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CargoLoad } from '../types/cargo';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { formatPickupWindow, formatPickupDetails, formatTimeAgo } from '../utils/ethiopianCalendar';

interface Props {
  item: CargoLoad;
  onBid: (item: CargoLoad) => void;
}

function formatETB(amount: number): string {
  return amount.toLocaleString('en-US');
}

export default function CargoCard({ item, onBid }: Props) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const pickup = formatPickupDetails(item.pickupWindow, language);
  const isBidPlaced = item.status === 'bid_placed';
  const isUrgent = item.urgency === 'urgent';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.cardBorder,
        },
      ]}
    >
      {/* Top header row: Commodity and Rate */}
      <View style={styles.topRow}>
        <View style={styles.cargoInfo}>
          <Text style={[styles.commodity, { color: theme.colors.textPrimary }]}>
            {item.cargoType}
          </Text>
          <Text style={[styles.loadId, { color: theme.colors.textMuted }]}>
            {item.id} • {formatTimeAgo(item.postedAt, language)}
          </Text>
        </View>

        <View style={styles.rateBlock}>
          <Text style={[styles.rateAmount, { color: theme.colors.primary }]}>
            {formatETB(item.rateETB)}
          </Text>
          <Text style={[styles.rateCurrency, { color: theme.colors.textMuted }]}>ETB</Text>
        </View>
      </View>

      {/* Route Section */}
      <View
        style={[
          styles.routeContainer,
          { backgroundColor: theme.colors.surfaceElevated },
        ]}
      >
        <View style={styles.timeline}>
          <View
            style={[
              styles.timelineDotStart,
              { backgroundColor: theme.colors.primary },
            ]}
          />
          <View
            style={[
              styles.timelineLine,
              { backgroundColor: theme.colors.cardBorder },
            ]}
          />
          <View
            style={[
              styles.timelineDotEnd,
              { backgroundColor: theme.colors.blue },
            ]}
          />
        </View>

        <View style={styles.routeDetails}>
          <View style={styles.locationStop}>
            <Text style={[styles.cityText, { color: theme.colors.textPrimary }]}>
              {item.origin}
            </Text>
            <Text style={[styles.distanceText, { color: theme.colors.textMuted }]}>
              {item.distanceKm} km
            </Text>
          </View>

          <View style={styles.locationStop}>
            <Text style={[styles.cityText, { color: theme.colors.textPrimary }]}>
              {item.destination}
            </Text>
          </View>

          {/* Pickup Window */}
          <View
            style={[
              styles.pickupBar,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.cardBorder,
              },
            ]}
          >
            <Feather
              name="calendar"
              size={12}
              color={language === 'AM' ? theme.colors.primary : theme.colors.blue}
            />
            <Text
              style={[
                styles.pickupBarText,
                { color: theme.colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              <Text style={{ color: theme.colors.textMuted, fontWeight: '700' }}>
                {t('pickup')}:{' '}
              </Text>
              {language === 'AM' ? (
                <>
                  <Text style={{ color: theme.colors.textPrimary, fontWeight: '600' }}>
                    {pickup.ecDatePlain}
                  </Text>
                  <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>
                    {' '}({pickup.ecTime})
                  </Text>
                </>
              ) : (
                <>
                  <Text style={{ color: theme.colors.textPrimary, fontWeight: '600' }}>
                    {pickup.gcDatePlain}
                  </Text>
                  <Text style={{ color: theme.colors.blue, fontWeight: '700' }}>
                    {' '}• {pickup.gcTime}
                  </Text>
                </>
              )}
            </Text>
          </View>
        </View>
      </View>

      {/* Load Specs strip */}
      <View
        style={[
          styles.specsRow,
          { borderColor: theme.colors.cardBorder },
        ]}
      >
        <View style={styles.specItem}>
          <Text style={[styles.specLabel, { color: theme.colors.textMuted }]}>{t('weight')}</Text>
          <Text style={[styles.specValue, { color: theme.colors.textPrimary }]}>
            {item.weightTons} {t('tons')}
          </Text>
        </View>

        <View
          style={[
            styles.specDivider,
            { backgroundColor: theme.colors.cardBorder },
          ]}
        />

        <View style={styles.specItem}>
          <Text style={[styles.specLabel, { color: theme.colors.textMuted }]}>{t('corridor_leg')}</Text>
          <Text style={[styles.specValue, { color: theme.colors.textPrimary }]}>
            {item.distanceKm > 500 ? t('long_haul') : t('regional')}
          </Text>
        </View>

        <View
          style={[
            styles.specDivider,
            { backgroundColor: theme.colors.cardBorder },
          ]}
        />

        <View style={styles.specItem}>
          <Text style={[styles.specLabel, { color: theme.colors.textMuted }]}>Status</Text>
          <Text
            style={[
              styles.specValue,
              { color: isBidPlaced ? theme.colors.amber : theme.colors.primary },
            ]}
          >
            {isBidPlaced ? t('bid_placed') : t('available')}
          </Text>
        </View>
      </View>

      {/* Footer / Action */}
      <View style={styles.footer}>
        {isUrgent ? (
          <View
            style={[
              styles.urgentBadge,
              {
                backgroundColor: theme.colors.redSubtle,
                borderColor: theme.colors.redBorder,
              },
            ]}
          >
            <Text style={[styles.urgentText, { color: theme.colors.red }]}>
              {t('urgent_dispatch')}
            </Text>
          </View>
        ) : (
          <Text style={[styles.titleText, { color: theme.colors.textMuted }]} numberOfLines={1}>
            {item.title}
          </Text>
        )}

        {item.status === 'open' ? (
          <TouchableOpacity
            style={[
              styles.bidButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => onBid(item)}
            activeOpacity={0.7}
          >
            <Text style={[styles.bidButtonText, { color: theme.colors.primaryText }]}>
              {t('place_bid')}
            </Text>
          </TouchableOpacity>
        ) : (
          <View
            style={[
              styles.bidPlacedBadge,
              {
                backgroundColor: theme.colors.amberSubtle,
                borderColor: 'rgba(245, 158, 11, 0.3)',
              },
            ]}
          >
            <Feather name="check" size={13} color={theme.colors.amber} />
            <Text style={[styles.bidPlacedText, { color: theme.colors.amber }]}>
              {t('bid_submitted')}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
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
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  loadId: {
    fontSize: 12,
  },
  rateBlock: {
    alignItems: 'flex-end',
  },
  rateAmount: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  rateCurrency: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: -2,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
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
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  timelineDotEnd: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
    fontSize: 13,
    fontWeight: '600',
  },
  distanceText: {
    fontSize: 11,
  },
  pickupBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 5,
  },
  pickupBarText: {
    fontSize: 11.5,
    flex: 1,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  specItem: {
    flex: 1,
    alignItems: 'center',
  },
  specLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  specValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  specDivider: {
    width: 1,
    height: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleText: {
    flex: 1,
    fontSize: 12,
  },
  urgentBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  urgentText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bidButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bidButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  bidPlacedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  bidPlacedText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
});
