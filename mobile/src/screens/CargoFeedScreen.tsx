// TradeFlow Mobile — Cargo Feed Screen (Web CarrierPortal / LoadBoard Look)
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { CargoLoad, OfflineAction } from '../types/cargo';
import {
  initDatabase,
  getCachedCargo,
  enqueueOfflineAction,
  updateLocalCargoStatus,
  getPendingCount,
  getAllQueueItems,
} from '../services/database';
import {
  getNetworkStatus,
  toggleNetworkStatus,
  processQueue,
} from '../services/syncService';
import ConnectivityHeader from '../components/ConnectivityHeader';
import CargoCard from '../components/CargoCard';
import BidModal from '../components/BidModal';
import OfflineQueueModal from '../components/OfflineQueueModal';
import { THEME } from '../styles/theme';

const ROUTE_FILTERS = ['All Routes', 'Djibouti', 'Modjo', 'Dire Dawa', 'Addis Ababa'];

export default function CargoFeedScreen() {
  const [cargo, setCargo] = useState<CargoLoad[]>([]);
  const [activeTab, setActiveTab] = useState<'available' | 'my_bids'>('available');
  const [search, setSearch] = useState('');
  const [activeRoute, setActiveRoute] = useState('All Routes');
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(getNetworkStatus());
  const [pendingCount, setPendingCount] = useState(0);
  const [dbReady, setDbReady] = useState(false);

  // Modals
  const [bidModalVisible, setBidModalVisible] = useState(false);
  const [selectedCargo, setSelectedCargo] = useState<CargoLoad | null>(null);
  const [queueModalVisible, setQueueModalVisible] = useState(false);
  const [queueItems, setQueueItems] = useState<OfflineAction[]>([]);
  const [syncing, setSyncing] = useState(false);

  // ── Init SQLite DB ──
  useEffect(() => {
    (async () => {
      await initDatabase();
      setDbReady(true);
    })();
  }, []);

  // ── Load Cargo from Local SQLite ──
  const loadCargo = useCallback(async () => {
    if (!dbReady) return;
    const filterArg = activeRoute === 'All Routes' ? undefined : activeRoute;
    const items = await getCachedCargo(search, filterArg);
    setCargo(items);
    const count = await getPendingCount();
    setPendingCount(count);
  }, [dbReady, search, activeRoute]);

  useEffect(() => {
    loadCargo();
  }, [loadCargo]);

  // ── Pull to refresh ──
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (isOnline) {
      await processQueue();
    }
    await loadCargo();
    setRefreshing(false);
  }, [isOnline, loadCargo]);

  // ── Toggle Network Simulation ──
  const handleToggleNetwork = () => {
    const newStatus = toggleNetworkStatus();
    setIsOnline(newStatus);
  };

  // ── Bid Flow ──
  const handleOpenBid = (item: CargoLoad) => {
    setSelectedCargo(item);
    setBidModalVisible(true);
  };

  const handleSubmitBid = async (
    cargoId: string,
    amountETB: number,
    licensePlate: string,
    estimatedArrival: string
  ) => {
    const payload = { cargoId, amountETB, licensePlate, estimatedArrival };

    // Always enqueue to SQLite first (offline-first architecture)
    await enqueueOfflineAction('SUBMIT_BID', payload);

    // Optimistically update local cargo state
    await updateLocalCargoStatus(cargoId, 'bid_placed');

    // If online, immediately synchronize with remote
    if (isOnline) {
      await processQueue();
    }

    await loadCargo();

    Alert.alert(
      isOnline ? 'Tender Transmitted' : 'Bid Saved in Offline Queue',
      isOnline
        ? `Your carrier bid of ${amountETB.toLocaleString()} ETB for truck ${licensePlate} was transmitted to TradeFlow dispatch.`
        : `Cellular connection is offline. Your tender has been locked in local SQLite storage and will automatically dispatch upon corridor reconnection.`
    );
  };

  // ── Queue Management ──
  const handleOpenQueue = async () => {
    const items = await getAllQueueItems();
    setQueueItems(items);
    setQueueModalVisible(true);
  };

  const handleSyncNow = async () => {
    if (!isOnline) {
      Alert.alert(
        'Corridor Disconnected',
        'Toggle network online to dispatch buffered transmissions.'
      );
      return;
    }
    setSyncing(true);
    const result = await processQueue();
    setSyncing(false);

    const items = await getAllQueueItems();
    setQueueItems(items);
    await loadCargo();

    Alert.alert(
      'Ledger Synchronization',
      `Processed: ${result.processed} items\nConfirmed: ${result.succeeded}\nPending/Failed: ${result.failed}`
    );
  };

  // Filter list based on Sub-Tab
  const displayedCargo = cargo.filter((item) => {
    if (activeTab === 'my_bids') {
      return item.status === 'bid_placed' || item.status === 'in_transit';
    }
    return true;
  });

  const myBidsCount = cargo.filter(
    (c) => c.status === 'bid_placed' || c.status === 'in_transit'
  ).length;

  if (!dbReady) {
    return (
      <View style={styles.loadingContainer}>
        <Feather name="loader" size={24} color={THEME.colors.emerald} />
        <Text style={styles.loadingText}>Loading TradeFlow Corridor Ledger...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ConnectivityHeader
        isOnline={isOnline}
        pendingCount={pendingCount}
        onToggleNetwork={handleToggleNetwork}
        onOpenQueue={handleOpenQueue}
      />

      {/* Corridor Quick Metrics Strip (Web style) */}
      <View style={styles.metricsStrip}>
        <View style={styles.metricsItem}>
          <Text style={styles.metricsLabel}>CORRIDOR SPOT</Text>
          <Text style={styles.metricsVal}>340K ETB</Text>
        </View>
        <View style={styles.metricsDivider} />
        <View style={styles.metricsItem}>
          <Text style={styles.metricsLabel}>ACTIVE ROUTE</Text>
          <Text style={styles.metricsVal}>Djibouti ⇄ Modjo</Text>
        </View>
        <View style={styles.metricsDivider} />
        <View style={styles.metricsItem}>
          <Text style={styles.metricsLabel}>SECURITY RADAR</Text>
          <View style={styles.radarStatus}>
            <View style={styles.radarDot} />
            <Text style={styles.radarText}>Low Risk</Text>
          </View>
        </View>
      </View>

      {/* Sub Tabs: Available Consignments vs My Active Bids */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'available' && styles.tabButtonActive]}
          onPress={() => setActiveTab('available')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'available' && styles.tabButtonTextActive,
            ]}
          >
            Available Loads
          </Text>
          <View
            style={[
              styles.tabBadge,
              activeTab === 'available' && styles.tabBadgeActive,
            ]}
          >
            <Text
              style={[
                styles.tabBadgeText,
                activeTab === 'available' && styles.tabBadgeTextActive,
              ]}
            >
              {cargo.length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'my_bids' && styles.tabButtonActive]}
          onPress={() => setActiveTab('my_bids')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'my_bids' && styles.tabButtonTextActive,
            ]}
          >
            My Bids
          </Text>
          <View
            style={[
              styles.tabBadge,
              activeTab === 'my_bids' && styles.tabBadgeActive,
            ]}
          >
            <Text
              style={[
                styles.tabBadgeText,
                activeTab === 'my_bids' && styles.tabBadgeTextActive,
              ]}
            >
              {myBidsCount}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Feather
            name="search"
            size={14}
            color={THEME.colors.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search commodity, city, or ID..."
            placeholderTextColor={THEME.colors.textDim}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
              <Feather name="x" size={14} color={THEME.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Corridor Filter Chips */}
      <View style={styles.chipsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {ROUTE_FILTERS.map((route) => {
            const active = activeRoute === route;
            return (
              <TouchableOpacity
                key={route}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setActiveRoute(route)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {route}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Cargo Cards Feed */}
      <FlatList
        data={displayedCargo}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CargoCard item={item} onBid={handleOpenBid} />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={THEME.colors.emerald}
            colors={[THEME.colors.emerald]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Ionicons
              name="cube-outline"
              size={36}
              color={THEME.colors.textDim}
              style={{ marginBottom: 10 }}
            />
            <Text style={styles.emptyTitle}>
              {activeTab === 'my_bids'
                ? 'No Active Carrier Bids'
                : 'No Matching Consignments'}
            </Text>
            <Text style={styles.emptyDesc}>
              {activeTab === 'my_bids'
                ? 'Select any open consignment from the Available Loads tab to submit your competitive haul tender.'
                : 'Adjust your search query or route filters to inspect other corridor legs.'}
            </Text>
            {search.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchBtn}
                onPress={() => setSearch('')}
                activeOpacity={0.7}
              >
                <Text style={styles.clearSearchText}>Reset Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Modals */}
      <BidModal
        visible={bidModalVisible}
        cargo={selectedCargo}
        onSubmit={handleSubmitBid}
        onClose={() => setBidModalVisible(false)}
      />

      <OfflineQueueModal
        visible={queueModalVisible}
        items={queueItems}
        isOnline={isOnline}
        syncing={syncing}
        onSyncNow={handleSyncNow}
        onClose={() => setQueueModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.background,
    gap: 12,
  },
  loadingText: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181818',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderMuted,
    paddingVertical: 7,
    paddingHorizontal: 16,
  },
  metricsItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricsLabel: {
    color: THEME.colors.textDim,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
    fontFamily: THEME.typography.fontMono,
    marginBottom: 2,
  },
  metricsVal: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: THEME.typography.fontMono,
  },
  metricsDivider: {
    width: 1,
    height: 20,
    backgroundColor: THEME.colors.borderMuted,
  },
  radarStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  radarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.emerald,
  },
  radarText: {
    color: THEME.colors.emerald,
    fontSize: 10,
    fontWeight: '700',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.backgroundSurface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: THEME.colors.emerald,
  },
  tabButtonText: {
    color: THEME.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: THEME.colors.textPrimary,
    fontWeight: '800',
  },
  tabBadge: {
    backgroundColor: '#262626',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: THEME.colors.emeraldGlow,
  },
  tabBadgeText: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: THEME.typography.fontMono,
  },
  tabBadgeTextActive: {
    color: THEME.colors.emerald,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: THEME.colors.textPrimary,
    fontSize: 13,
    paddingVertical: 9,
  },
  chipsWrapper: {
    paddingBottom: 10,
  },
  chipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#1C1C1C',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: THEME.colors.emeraldGlow,
    borderColor: 'rgba(62, 207, 142, 0.45)',
  },
  filterChipText: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: THEME.colors.emerald,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyCard: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyDesc: {
    color: THEME.colors.textMuted,
    fontSize: 11.5,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 14,
  },
  clearSearchBtn: {
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  clearSearchText: {
    color: THEME.colors.emerald,
    fontSize: 11,
    fontWeight: '700',
  },
});
