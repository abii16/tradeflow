// TradeFlow Mobile — Cargo Feed Screen (Production Logistics Design)
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
import { Feather } from '@expo/vector-icons';
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
import { AuthUser } from '../types/auth';
import { THEME } from '../styles/theme';
import { useTheme } from '../context/ThemeContext';

const ROUTE_FILTERS = ['All', 'Djibouti', 'Modjo', 'Dire Dawa', 'Addis Ababa'];

interface Props {
  currentUser?: AuthUser | null;
  onSignOut?: () => void;
  activeRole?: 'transporter' | 'driver';
  onSelectRole?: (role: 'transporter' | 'driver') => void;
}

export default function CargoFeedScreen({
  currentUser,
  onSignOut,
  activeRole,
  onSelectRole,
}: Props) {
  const { theme } = useTheme();
  const [cargo, setCargo] = useState<CargoLoad[]>([]);
  const [activeTab, setActiveTab] = useState<'available' | 'my_bids'>('available');
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

  useEffect(() => {
    (async () => {
      await initDatabase();
      setDbReady(true);
    })();
  }, []);

  const loadCargo = useCallback(async () => {
    if (!dbReady) return;
    const filter = activeRoute === 'All' ? undefined : activeRoute;
    const items = await getCachedCargo(search, filter);
    setCargo(items);
    const count = await getPendingCount();
    setPendingCount(count);
  }, [dbReady, search, activeRoute]);

  useEffect(() => {
    loadCargo();
  }, [loadCargo]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (isOnline) {
      await processQueue();
    }
    await loadCargo();
    setRefreshing(false);
  }, [isOnline, loadCargo]);

  const handleToggleNetwork = () => {
    const newStatus = toggleNetworkStatus();
    setIsOnline(newStatus);
  };

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

    // Save to local SQLite
    await enqueueOfflineAction('SUBMIT_BID', payload);
    await updateLocalCargoStatus(cargoId, 'bid_placed');

    if (isOnline) {
      await processQueue();
    }

    await loadCargo();

    Alert.alert(
      isOnline ? 'Bid Submitted' : 'Bid Saved Offline',
      isOnline
        ? `Your bid of ${amountETB.toLocaleString()} ETB for truck ${licensePlate} has been placed.`
        : `You are currently offline. Your bid was saved to your device and will be submitted once connected.`
    );
  };

  const handleOpenQueue = async () => {
    const items = await getAllQueueItems();
    setQueueItems(items);
    setQueueModalVisible(true);
  };

  const handleSyncNow = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Connect to network before syncing.');
      return;
    }
    setSyncing(true);
    const result = await processQueue();
    setSyncing(false);

    const items = await getAllQueueItems();
    setQueueItems(items);
    await loadCargo();

    Alert.alert(
      'Sync Complete',
      `Synchronized: ${result.succeeded} of ${result.processed} actions.`
    );
  };

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
        <Text style={styles.loadingText}>Loading loads...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ConnectivityHeader
        isOnline={isOnline}
        pendingCount={pendingCount}
        onToggleNetwork={handleToggleNetwork}
        onOpenQueue={handleOpenQueue}
        currentUser={currentUser}
        onSignOut={onSignOut}
        activeRole={activeRole}
        onSelectRole={onSelectRole}
      />

      {/* Segmented Tab Bar */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.cardBorder,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'available' && { borderBottomColor: theme.colors.primary },
          ]}
          onPress={() => setActiveTab('available')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'available' ? theme.colors.textPrimary : theme.colors.textMuted },
              activeTab === 'available' && styles.tabTextActive,
            ]}
          >
            Available ({cargo.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'my_bids' && { borderBottomColor: theme.colors.primary },
          ]}
          onPress={() => setActiveTab('my_bids')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'my_bids' ? theme.colors.textPrimary : theme.colors.textMuted },
              activeTab === 'my_bids' && styles.tabTextActive,
            ]}
          >
            My Bids ({myBidsCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search & Filter Controls */}
      <View style={styles.filterSection}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.cardBorder,
            },
          ]}
        >
          <Feather
            name="search"
            size={15}
            color={theme.colors.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.textPrimary }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Search loads..."
            placeholderTextColor={theme.colors.textMuted}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
              <Feather name="x" size={14} color={theme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Route Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.routeChips}
        >
          {ROUTE_FILTERS.map((route) => {
            const active = activeRoute === route;
            return (
              <TouchableOpacity
                key={route}
                style={[
                  styles.routeChip,
                  active
                    ? {
                        backgroundColor: theme.colors.primarySubtle,
                        borderColor: theme.colors.primary,
                      }
                    : {
                        backgroundColor: theme.colors.card,
                        borderColor: theme.colors.cardBorder,
                      },
                ]}
                onPress={() => setActiveRoute(route)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.routeChipText,
                    { color: active ? theme.colors.primary : theme.colors.textMuted },
                    active && styles.routeChipTextActive,
                  ]}
                >
                  {route}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Cargo Feed */}
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
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
              {activeTab === 'my_bids' ? 'No active bids' : 'No loads found'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
              {activeTab === 'my_bids'
                ? 'Your placed bids will appear here.'
                : 'Try adjusting your corridor filter.'}
            </Text>
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
        onToggleNetwork={handleToggleNetwork}
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
  },
  loadingText: {
    color: THEME.colors.textMuted,
    fontSize: 13,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.cardBorder,
    paddingHorizontal: 16,
  },
  tabItem: {
    paddingVertical: 12,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: THEME.colors.primary,
  },
  tabText: {
    color: THEME.colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  tabTextActive: {
    color: THEME.colors.textPrimary,
    fontWeight: '700',
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    borderRadius: 8,
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
  routeChips: {
    gap: 8,
  },
  routeChip: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  routeChipActive: {
    backgroundColor: THEME.colors.surfaceElevated,
    borderColor: THEME.colors.primary,
  },
  routeChipText: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  routeChipTextActive: {
    color: THEME.colors.primary,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
