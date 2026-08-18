// TradeFlow Mobile — Cargo Feed Screen
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
} from 'react-native';
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

const ROUTE_FILTERS = ['All', 'Djibouti', 'Modjo', 'Dire Dawa', 'Addis Ababa'];

export default function CargoFeedScreen() {
  const [cargo, setCargo] = useState<CargoLoad[]>([]);
  const [search, setSearch] = useState('');
  const [activeRoute, setActiveRoute] = useState('All');
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

  // ── Init DB ──
  useEffect(() => {
    (async () => {
      await initDatabase();
      setDbReady(true);
    })();
  }, []);

  // ── Load cargo from SQLite ──
  const loadCargo = useCallback(async () => {
    if (!dbReady) return;
    const items = await getCachedCargo(search, activeRoute);
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

  // ── Network toggle ──
  const handleToggleNetwork = () => {
    const newStatus = toggleNetworkStatus();
    setIsOnline(newStatus);
  };

  // ── Open bid modal ──
  const handleOpenBid = (item: CargoLoad) => {
    setSelectedCargo(item);
    setBidModalVisible(true);
  };

  // ── Submit bid ──
  const handleSubmitBid = async (
    cargoId: string,
    amountETB: number,
    licensePlate: string,
    estimatedArrival: string
  ) => {
    const payload = { cargoId, amountETB, licensePlate, estimatedArrival };

    // Always enqueue to SQLite first (offline-first)
    await enqueueOfflineAction('SUBMIT_BID', payload);

    // Optimistically update local state
    await updateLocalCargoStatus(cargoId, 'bid_placed');

    // If online, try to sync immediately
    if (isOnline) {
      await processQueue();
    }

    await loadCargo();

    Alert.alert(
      isOnline ? 'Bid Submitted' : 'Bid Queued',
      isOnline
        ? `Your bid of ${amountETB.toLocaleString()} ETB has been submitted.`
        : `You are offline. Your bid has been saved locally and will sync when connected.`
    );
  };

  // ── Open queue modal ──
  const handleOpenQueue = async () => {
    const items = await getAllQueueItems();
    setQueueItems(items);
    setQueueModalVisible(true);
  };

  // ── Sync now ──
  const handleSyncNow = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Connect to the network before syncing.');
      return;
    }
    setSyncing(true);
    const result = await processQueue();
    setSyncing(false);

    // Refresh queue items and cargo
    const items = await getAllQueueItems();
    setQueueItems(items);
    await loadCargo();

    Alert.alert(
      'Sync Complete',
      `Processed: ${result.processed}, Succeeded: ${result.succeeded}, Failed: ${result.failed}`
    );
  };

  // ── Route filter chips ──
  const renderFilterChip = (route: string) => {
    const active = activeRoute === route;
    return (
      <TouchableOpacity
        key={route}
        style={[styles.chip, active && styles.chipActive]}
        onPress={() => setActiveRoute(route)}
        activeOpacity={0.7}
      >
        <Text style={[styles.chipText, active && styles.chipTextActive]}>
          {route}
        </Text>
      </TouchableOpacity>
    );
  };

  // ── Empty state ──
  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No loads found</Text>
      <Text style={styles.emptySubtitle}>
        {search ? 'Try a different search term' : 'Pull down to refresh'}
      </Text>
    </View>
  );

  if (!dbReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Initializing database...</Text>
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

      {/* Title bar */}
      <View style={styles.titleBar}>
        <Text style={styles.pageTitle}>Cargo Feed</Text>
        <Text style={styles.loadCount}>{cargo.length} loads</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search loads..."
          placeholderTextColor="#64748b"
        />
      </View>

      {/* Route filter chips */}
      <View style={styles.chipRow}>
        {ROUTE_FILTERS.map(renderFilterChip)}
      </View>

      {/* Cargo list */}
      <FlatList
        data={cargo}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CargoCard item={item} onBid={handleOpenBid} />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#94a3b8"
            colors={['#94a3b8']}
          />
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
        syncing={syncing}
        onSync={handleSyncNow}
        onClose={() => setQueueModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  titleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  loadCount: {
    fontSize: 12,
    color: '#64748b',
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#f1f5f9',
    fontSize: 14,
  },
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1e293b',
  },
  chipActive: {
    backgroundColor: '#334155',
    borderColor: '#475569',
  },
  chipText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  chipTextActive: {
    color: '#f1f5f9',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyState: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#94a3b8',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
});
