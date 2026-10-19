// TradeFlow Mobile — Driver Console (Corridor Waypoint Check-ins & Incident Reporting)
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  Platform,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Waypoint, IncidentReportPayload, PodPayload, OfflineAction, CargoLoad } from '../types/cargo';
import { AuthUser } from '../types/auth';
import {
  enqueueOfflineAction,
  updateLocalCargoStatus,
  getPendingCount,
  getAllQueueItems,
  getActiveDriverTrip,
} from '../services/database';
import {
  getNetworkStatus,
  toggleNetworkStatus,
  processQueue,
} from '../services/syncService';
import ConnectivityHeader from '../components/ConnectivityHeader';
import OfflineQueueModal from '../components/OfflineQueueModal';
import { THEME } from '../styles/theme';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  formatWaypointTimestamp,
  toEthiopianTime,
} from '../utils/ethiopianCalendar';

interface Props {
  currentUser?: AuthUser | null;
  onSignOut?: () => void;
  activeRole?: 'transporter' | 'driver';
  onSelectRole?: (role: 'transporter' | 'driver') => void;
}

export default function DriverScreen({
  currentUser,
  onSignOut,
  activeRole,
  onSelectRole,
}: Props) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const [activeTrip, setActiveTrip] = useState<CargoLoad | null>(null);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [tripCompleted, setTripCompleted] = useState(false);
  const [isOnline, setIsOnline] = useState(getNetworkStatus());
  const [pendingCount, setPendingCount] = useState(0);

  // Modals
  const [incidentModalVisible, setIncidentModalVisible] = useState(false);
  const [selectedIncidentType, setSelectedIncidentType] = useState('FUEL');
  const [incidentNotes, setIncidentNotes] = useState('');
  const [podModalVisible, setPodModalVisible] = useState(false);
  const [receiverName, setReceiverName] = useState('');
  const [waybillNumber, setWaybillNumber] = useState('');

  // Queue Modal
  const [queueModalVisible, setQueueModalVisible] = useState(false);
  const [queueItems, setQueueItems] = useState<OfflineAction[]>([]);
  const [syncing, setSyncing] = useState(false);

  const loadDriverTrip = useCallback(async () => {
    const trip = await getActiveDriverTrip();
    setActiveTrip(trip);
    if (trip) {
      setWaybillNumber(`TF-WB-${trip.id.replace(/\D/g, '') || '01'}`);
      setWaypoints([
        {
          id: `${trip.id}-WP1`,
          name: `${trip.origin} Dispatch Hub`,
          corridorLeg: 'Origin Checkpoint',
          kmFromOrigin: 0,
          status: 'completed',
          lat: 8.948,
          lng: 38.746,
        },
        {
          id: `${trip.id}-WP2`,
          name: `${trip.destination} Terminal`,
          corridorLeg: 'Final Destination Hub',
          kmFromOrigin: trip.distanceKm,
          status: 'current',
          lat: 7.062,
          lng: 38.476,
        },
      ]);
    } else {
      setWaypoints([]);
      setWaybillNumber('');
    }
  }, []);

  const refreshCount = useCallback(async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  }, []);

  useEffect(() => {
    refreshCount();
    loadDriverTrip();
  }, [refreshCount, loadDriverTrip]);

  const handleToggleNetwork = () => {
    const newStatus = toggleNetworkStatus();
    setIsOnline(newStatus);
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
    await refreshCount();

    Alert.alert(
      'Sync Complete',
      `Synchronized: ${result.succeeded} of ${result.processed} actions.`
    );
  };

  const currentWaypoint = waypoints.find((w) => w.status === 'current');
  const completedCount = waypoints.filter((w) => w.status === 'completed').length;
  const progressPercent = Math.round((completedCount / waypoints.length) * 100);

  // ── Handle Check-in at Current Waypoint ──
  const handleCheckin = async (wp: Waypoint) => {
    const now = new Date();
    const ethTime = toEthiopianTime(now.getHours(), now.getMinutes());
    const displayTimestamp =
      language === 'AM'
        ? ethTime.ethTimeStr
        : `Today, ${ethTime.gcTimeStr}`;

    setWaypoints((prev) => {
      const idx = prev.findIndex((item) => item.id === wp.id);
      return prev.map((item, i) => {
        if (i === idx) {
          return { ...item, status: 'completed', timestamp: displayTimestamp };
        }
        if (i === idx + 1) {
          return { ...item, status: 'current' };
        }
        return item;
      });
    });

    const tripId = activeTrip?.id || 'ACTIVE-TRIP';
    const payload = {
      tripId,
      waypointId: wp.id,
      waypointName: wp.name,
      lat: wp.lat,
      lng: wp.lng,
      timestamp: new Date().toISOString(),
    };

    await enqueueOfflineAction('WAYPOINT_CHECKIN', payload);

    if (isOnline) {
      await processQueue();
    }
    await refreshCount();

    Alert.alert(
      isOnline ? 'Check-in Verified' : 'Check-in Saved Offline',
      isOnline
        ? `Waypoint "${wp.name}" recorded and broadcast to central dispatch.`
        : `Cellular signal offline. Check-in at "${wp.name}" safely stored on device. Will auto-sync.`
    );
  };

  // ── Submit Incident ──
  const handleSubmitIncident = async () => {
    if (!incidentNotes.trim()) return;

    const tripId = activeTrip?.id || 'ACTIVE-TRIP';
    const payload: IncidentReportPayload = {
      tripId,
      type: selectedIncidentType,
      location: currentWaypoint
        ? currentWaypoint.name
        : activeTrip
        ? `${activeTrip.origin} – ${activeTrip.destination}`
        : 'Corridor Transit Leg',
      notes: incidentNotes.trim(),
      timestamp: new Date().toISOString(),
    };

    await enqueueOfflineAction('REPORT_INCIDENT', payload);

    if (isOnline) {
      await processQueue();
    }
    await refreshCount();

    setIncidentNotes('');
    setIncidentModalVisible(false);

    Alert.alert(
      isOnline ? 'Incident Dispatched' : 'Incident Queued Offline',
      isOnline
        ? 'Dispatcher has been notified of the corridor delay.'
        : 'Report saved to local database. Will transmit when signal returns.'
    );
  };

  // ── Proof of Delivery Submission ──
  const handleConfirmPod = async () => {
    if (!receiverName.trim()) return;

    const tripId = activeTrip?.id || 'ACTIVE-TRIP';
    const payload: PodPayload = {
      tripId,
      receiverName: receiverName.trim(),
      waybillNumber: waybillNumber.trim(),
      signatureDate: new Date().toISOString(),
    };

    await enqueueOfflineAction('PROOF_OF_DELIVERY', payload);
    if (activeTrip?.id) {
      await updateLocalCargoStatus(activeTrip.id, 'delivered');
    }

    if (isOnline) {
      await processQueue();
    }
    await refreshCount();

    setTripCompleted(true);
    setPodModalVisible(false);

    Alert.alert(
      'Delivery Confirmed',
      `Consignment signed by ${receiverName}. Waybill ${waybillNumber} filed. Trip marked delivered!`
    );
  };

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (isOnline) {
      await processQueue();
    }
    await Promise.all([refreshCount(), loadDriverTrip()]);
    setRefreshing(false);
  }, [isOnline, refreshCount, loadDriverTrip]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
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

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.blue}
            colors={[theme.colors.blue]}
          />
        }
      >
        {!activeTrip || waypoints.length === 0 ? (
          <View
            style={[
              styles.emptyContainer,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.cardBorder,
              },
            ]}
          >
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: theme.colors.surfaceElevated },
              ]}
            >
              <Feather name="navigation" size={28} color={theme.colors.blue} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
              No Active Dispatches
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
              There are currently no active corridor trips assigned to vehicle{' '}
              <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>
                {currentUser?.licensePlate || 'your truck'}
              </Text>
              . When a transporter assigns a corridor load, your route checkpoints and waypoints will appear here in real time.
            </Text>
          </View>
        ) : (
          <>
            {/* Active Trip Header */}
            <View
              style={[
                styles.tripCard,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.cardBorder,
                },
              ]}
            >
              <View style={styles.tripTopRow}>
                <View style={styles.tripTag}>
                  <Text style={styles.tripTagText}>
                    {tripCompleted ? t('completed_trip') : t('active_trip')}
                  </Text>
                </View>
                <Text style={[styles.truckPlate, { color: theme.colors.textMuted }]}>
                  {t('truck')}: {currentUser?.licensePlate || '3-AA-98214'}
                </Text>
              </View>

              <Text style={[styles.tripTitle, { color: theme.colors.textPrimary }]}>
                {activeTrip.title}
              </Text>
              <Text style={[styles.tripSubtitle, { color: theme.colors.textMuted }]}>
                {activeTrip.id} • {activeTrip.cargoType} ({activeTrip.weightTons}T)
              </Text>

          {/* Progress Strip */}
          <View
            style={[
              styles.progressContainer,
              { backgroundColor: theme.colors.surfaceElevated },
            ]}
          >
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: theme.colors.textMuted }]}>{t('progress')}</Text>
              <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
                {completedCount} / {waypoints.length} {t('stops')} ({progressPercent}%)
              </Text>
            </View>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: theme.colors.cardBorder },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercent}%` },
                  tripCompleted
                    ? { backgroundColor: theme.colors.primary }
                    : { backgroundColor: theme.colors.blue },
                ]}
              />
            </View>
          </View>

          {/* Action strip: Report incident & Finalize POD */}
          <View style={styles.tripActions}>
            <TouchableOpacity
              style={styles.incidentBtn}
              onPress={() => setIncidentModalVisible(true)}
              activeOpacity={0.7}
            >
              <Feather name="alert-circle" size={14} color={theme.colors.amber} />
              <Text style={styles.incidentBtnText}>{t('report_delay')}</Text>
            </TouchableOpacity>

            {completedCount >= 4 && !tripCompleted && (
              <TouchableOpacity
                style={styles.podBtn}
                onPress={() => setPodModalVisible(true)}
                activeOpacity={0.7}
              >
                <Feather name="check-square" size={14} color={theme.colors.primaryText} />
                <Text style={styles.podBtnText}>{t('proof_of_delivery')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Corridor Waypoint Timeline */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>{t('waypoints')}</Text>
          <Text style={[styles.sectionSub, { color: theme.colors.textMuted }]}>
            {activeTrip.origin} – {activeTrip.destination} ({activeTrip.distanceKm} km)
          </Text>
        </View>

        <View style={styles.timelineList}>
          {waypoints.map((wp, index) => {
            const isDone = wp.status === 'completed';
            const isCurrent = wp.status === 'current';
            const isLast = index === waypoints.length - 1;

            return (
              <View key={wp.id} style={styles.timelineItem}>
                <View style={styles.indicatorCol}>
                  <View
                    style={[
                      styles.nodeCircle,
                      isDone
                        ? {
                            backgroundColor: theme.colors.primary,
                            borderColor: theme.colors.primary,
                          }
                        : isCurrent
                        ? {
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.blue,
                          }
                        : {
                            backgroundColor: theme.colors.surfaceElevated,
                            borderColor: theme.colors.cardBorder,
                          },
                    ]}
                  >
                    {isDone ? (
                      <Feather name="check" size={11} color={theme.colors.primaryText} />
                    ) : (
                      <Text
                        style={[
                          styles.nodeIndex,
                          isCurrent
                            ? { color: theme.colors.blue }
                            : { color: theme.colors.textMuted },
                        ]}
                      >
                        {index + 1}
                      </Text>
                    )}
                  </View>
                  {!isLast && (
                    <View
                      style={[
                        styles.connectorLine,
                        isDone
                          ? { backgroundColor: theme.colors.primary }
                          : { backgroundColor: theme.colors.cardBorder },
                      ]}
                    />
                  )}
                </View>

                <View
                  style={[
                    styles.waypointCard,
                    isCurrent
                      ? {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.blue,
                        }
                      : {
                          backgroundColor: theme.colors.card,
                          borderColor: theme.colors.cardBorder,
                        },
                  ]}
                >
                  <View style={styles.wpHeader}>
                    <Text style={[styles.wpName, { color: theme.colors.textPrimary }]}>
                      {wp.name}
                    </Text>
                    <Text style={[styles.wpKm, { color: theme.colors.textMuted }]}>
                      {wp.kmFromOrigin} km
                    </Text>
                  </View>

                  <Text style={[styles.wpLeg, { color: theme.colors.textMuted }]}>
                    {wp.corridorLeg}
                  </Text>

                  {isDone && (
                    <View style={styles.verifiedRow}>
                      <Feather name="check-circle" size={12} color={theme.colors.primary} />
                      <Text style={[styles.verifiedText, { color: theme.colors.primary }]}>
                        {t('verified')}: {formatWaypointTimestamp(wp.timestamp || '', language)}
                      </Text>
                    </View>
                  )}

                  {isCurrent && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.checkinButton}
                        onPress={() => handleCheckin(wp)}
                        activeOpacity={0.7}
                      >
                        <Feather
                          name="map-pin"
                          size={13}
                          color="#FFFFFF"
                        />
                        <Text style={styles.checkinButtonText}>
                          {t('check_in')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </>
    )}
  </ScrollView>

      {/* Report Incident Modal */}
      <Modal
        visible={incidentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIncidentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIncidentModalVisible(false)}
          />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.cardBorder,
              },
            ]}
          >
            <View
              style={[
                styles.dragHandle,
                { backgroundColor: theme.colors.cardBorder },
              ]}
            />

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                {t('report_delay')}
              </Text>
              <TouchableOpacity
                onPress={() => setIncidentModalVisible(false)}
                style={styles.modalClose}
              >
                <Feather name="x" size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.incidentChips}>
              {[
                { key: 'FUEL', label: t('incident_fuel'), icon: 'droplet' as const },
                { key: 'ROAD_BLOCK', label: t('incident_roadblock'), icon: 'alert-triangle' as const },
                { key: 'BREAKDOWN', label: t('incident_breakdown'), icon: 'tool' as const },
                { key: 'CUSTOMS_HOLD', label: t('incident_customs'), icon: 'file-text' as const },
              ].map((type) => {
                const active = selectedIncidentType === type.key;
                return (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: active
                          ? theme.colors.amberSubtle
                          : theme.colors.surfaceElevated,
                        borderColor: active
                          ? theme.colors.amber
                          : theme.colors.cardBorder,
                      },
                    ]}
                    onPress={() => setSelectedIncidentType(type.key)}
                    activeOpacity={0.7}
                  >
                    <Feather
                      name={type.icon}
                      size={12}
                      color={active ? theme.colors.amber : theme.colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.typeChipText,
                        {
                          color: active
                            ? theme.colors.amber
                            : theme.colors.textSecondary,
                        },
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.notesLabel, { color: theme.colors.textMuted }]}>
              {t('notes')}
            </Text>
            <TextInput
              style={[
                styles.notesInput,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: theme.colors.cardBorder,
                  color: theme.colors.textPrimary,
                },
              ]}
              value={incidentNotes}
              onChangeText={setIncidentNotes}
              placeholder={t('describe_delay')}
              placeholderTextColor={theme.colors.textDim}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.cancelBtn,
                  {
                    backgroundColor: theme.colors.redSubtle,
                    borderColor: theme.colors.redBorder,
                  },
                ]}
                onPress={() => setIncidentModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: theme.colors.red }]}>
                  {t('cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitIncidentBtn,
                  { backgroundColor: theme.colors.amber },
                  !incidentNotes.trim() && { opacity: 0.4 },
                ]}
                onPress={handleSubmitIncident}
                disabled={!incidentNotes.trim()}
              >
                <Text style={styles.submitIncidentBtnText}>{t('submit')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Proof of Delivery Modal */}
      <Modal
        visible={podModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPodModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setPodModalVisible(false)}
          />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.cardBorder,
              },
            ]}
          >
            <View
              style={[
                styles.dragHandle,
                { backgroundColor: theme.colors.cardBorder },
              ]}
            />

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                {t('proof_of_delivery')}
              </Text>
              <TouchableOpacity
                onPress={() => setPodModalVisible(false)}
                style={styles.modalClose}
              >
                <Feather name="x" size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.notesLabel, { color: theme.colors.textMuted }]}>
                {t('receiver_name')}
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.cardBorder,
                    color: theme.colors.textPrimary,
                  },
                ]}
                value={receiverName}
                onChangeText={setReceiverName}
                placeholder={t('receiver_name')}
                placeholderTextColor={theme.colors.textDim}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.notesLabel, { color: theme.colors.textMuted }]}>
                {t('waybill_ref')}
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.cardBorder,
                    color: theme.colors.textPrimary,
                  },
                ]}
                value={waybillNumber}
                onChangeText={setWaybillNumber}
                placeholder="e.g. TF-WB-9102"
                placeholderTextColor={theme.colors.textDim}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.cancelBtn,
                  {
                    backgroundColor: theme.colors.redSubtle,
                    borderColor: theme.colors.redBorder,
                  },
                ]}
                onPress={() => setPodModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: theme.colors.red }]}>
                  {t('cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitPodBtn,
                  { backgroundColor: theme.colors.primary },
                  !receiverName.trim() && { opacity: 0.4 },
                ]}
                onPress={handleConfirmPod}
                disabled={!receiverName.trim()}
              >
                <Text
                  style={[
                    styles.submitPodBtnText,
                    { color: theme.colors.primaryText },
                  ]}
                >
                  {t('sign_complete')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Offline Queue Modal */}
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
  screen: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 32,
  },
  tripCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    padding: 16,
    marginBottom: 20,
  },
  tripTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tripTag: {
    backgroundColor: THEME.colors.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tripTagText: {
    color: THEME.colors.primary,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: THEME.typography.mono,
  },
  truckPlate: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: THEME.typography.mono,
  },
  tripTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  tripSubtitle: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    marginBottom: 14,
    fontFamily: THEME.typography.mono,
  },
  progressContainer: {
    backgroundColor: THEME.colors.surface,
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    color: THEME.colors.textMuted,
    fontSize: 11,
  },
  progressText: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: THEME.typography.mono,
  },
  progressBar: {
    height: 4,
    backgroundColor: THEME.colors.cardBorder,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: THEME.colors.blue,
  },
  tripActions: {
    flexDirection: 'row',
    gap: 8,
  },
  incidentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    paddingVertical: 9,
    borderRadius: 6,
  },
  incidentBtnText: {
    color: THEME.colors.amber,
    fontSize: 12,
    fontWeight: '700',
  },
  podBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: THEME.colors.primary,
    paddingVertical: 9,
    borderRadius: 6,
  },
  podBtnText: {
    color: THEME.colors.primaryText,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  sectionSub: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  timelineList: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 10,
  },
  indicatorCol: {
    width: 28,
    alignItems: 'center',
    marginRight: 10,
  },
  nodeCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: THEME.colors.surfaceElevated,
    borderWidth: 2,
    borderColor: THEME.colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  nodeCircleDone: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  nodeCircleCurrent: {
    borderColor: THEME.colors.blue,
    backgroundColor: THEME.colors.surface,
  },
  nodeIndex: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  nodeIndexCurrent: {
    color: THEME.colors.blue,
  },
  connectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: THEME.colors.cardBorder,
    marginVertical: 2,
  },
  connectorLineDone: {
    backgroundColor: THEME.colors.primary,
  },
  waypointCard: {
    flex: 1,
    backgroundColor: THEME.colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    padding: 12,
  },
  waypointCardCurrent: {
    borderColor: THEME.colors.blue,
    backgroundColor: THEME.colors.surface,
  },
  wpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  wpName: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  wpKm: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontFamily: THEME.typography.mono,
  },
  wpLeg: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginBottom: 6,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  verifiedText: {
    color: THEME.colors.primary,
    fontSize: 11,
    fontWeight: '500',
  },
  actionRow: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.cardBorder,
    paddingTop: 8,
  },
  checkinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: THEME.colors.blue,
    paddingVertical: 8,
    borderRadius: 6,
  },
  checkinButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  modalClose: {
    padding: 6,
  },
  modalDesc: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    marginBottom: 14,
  },
  incidentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
  },
  typeChipActive: {
    borderColor: THEME.colors.amber,
    backgroundColor: THEME.colors.amberSubtle,
  },
  typeChipText: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  typeChipTextActive: {
    color: THEME.colors.amber,
    fontWeight: '600',
  },
  notesLabel: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  notesInput: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    borderRadius: 8,
    padding: 10,
    color: THEME.colors.textPrimary,
    fontSize: 13,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  textInput: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: THEME.colors.textPrimary,
    fontSize: 13,
    marginBottom: 14,
  },
  formGroup: {
    marginBottom: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: THEME.colors.redSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.redBorder,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: THEME.colors.red,
    fontSize: 13,
    fontWeight: '700',
  },
  submitIncidentBtn: {
    flex: 2,
    backgroundColor: THEME.colors.amber,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitIncidentBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
  submitPodBtn: {
    flex: 2,
    backgroundColor: THEME.colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitPodBtnText: {
    color: THEME.colors.primaryText,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 52,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});
