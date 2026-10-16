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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Waypoint, IncidentReportPayload, PodPayload, OfflineAction } from '../types/cargo';
import { AuthUser } from '../types/auth';
import {
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
import OfflineQueueModal from '../components/OfflineQueueModal';
import { THEME } from '../styles/theme';

const INITIAL_WAYPOINTS: Waypoint[] = [
  {
    id: 'WP-1',
    name: 'Djibouti Port — Container Terminal Gate 4',
    corridorLeg: 'Origin Hub (Red Sea)',
    kmFromOrigin: 0,
    status: 'completed',
    timestamp: 'Today, 06:15 AM',
    lat: 11.595,
    lng: 43.148,
  },
  {
    id: 'WP-2',
    name: 'Galafi Border Crossing',
    corridorLeg: 'Ethiopia–Djibouti Customs Checkpoint',
    kmFromOrigin: 110,
    status: 'completed',
    timestamp: 'Today, 10:45 AM',
    lat: 11.716,
    lng: 41.838,
  },
  {
    id: 'WP-3',
    name: 'Semera Corridor Depot & Rest Stop',
    corridorLeg: 'Afar Region Hub (A1 Highway)',
    kmFromOrigin: 310,
    status: 'current',
    lat: 11.792,
    lng: 41.006,
  },
  {
    id: 'WP-4',
    name: 'Awash Arba Junction',
    corridorLeg: 'Oromia / Rift Valley Transit Point',
    kmFromOrigin: 680,
    status: 'upcoming',
    lat: 8.983,
    lng: 40.167,
  },
  {
    id: 'WP-5',
    name: 'Modjo Dry Port Inland Terminal',
    corridorLeg: 'Final Destination Hub',
    kmFromOrigin: 910,
    status: 'upcoming',
    lat: 8.598,
    lng: 39.123,
  },
];

const INCIDENT_TYPES = [
  { key: 'FUEL', label: 'Fuel Station Queue', icon: 'droplet' as const },
  { key: 'ROAD_BLOCK', label: 'Road Obstruction', icon: 'alert-triangle' as const },
  { key: 'BREAKDOWN', label: 'Mechanical Issue', icon: 'tool' as const },
  { key: 'CUSTOMS_HOLD', label: 'Customs Hold', icon: 'file-text' as const },
];

interface Props {
  currentUser?: AuthUser | null;
  onSignOut?: () => void;
}

export default function DriverScreen({ currentUser, onSignOut }: Props) {
  const [waypoints, setWaypoints] = useState<Waypoint[]>(INITIAL_WAYPOINTS);
  const [tripCompleted, setTripCompleted] = useState(false);
  const [isOnline, setIsOnline] = useState(getNetworkStatus());
  const [pendingCount, setPendingCount] = useState(0);

  // Modals
  const [incidentModalVisible, setIncidentModalVisible] = useState(false);
  const [selectedIncidentType, setSelectedIncidentType] = useState('FUEL');
  const [incidentNotes, setIncidentNotes] = useState('');
  const [podModalVisible, setPodModalVisible] = useState(false);
  const [receiverName, setReceiverName] = useState('');
  const [waybillNumber, setWaybillNumber] = useState('TF-WB-9102');

  // Queue Modal
  const [queueModalVisible, setQueueModalVisible] = useState(false);
  const [queueItems, setQueueItems] = useState<OfflineAction[]>([]);
  const [syncing, setSyncing] = useState(false);

  const refreshCount = useCallback(async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  }, []);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

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
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setWaypoints((prev) => {
      const idx = prev.findIndex((item) => item.id === wp.id);
      return prev.map((item, i) => {
        if (i === idx) {
          return { ...item, status: 'completed', timestamp: `Today, ${nowTime}` };
        }
        if (i === idx + 1) {
          return { ...item, status: 'current' };
        }
        return item;
      });
    });

    const payload = {
      tripId: 'TF-LOAD-8805',
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

    const payload: IncidentReportPayload = {
      tripId: 'TF-LOAD-8805',
      type: selectedIncidentType,
      location: currentWaypoint ? currentWaypoint.name : 'A1 Corridor',
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

    const payload: PodPayload = {
      tripId: 'TF-LOAD-8805',
      receiverName: receiverName.trim(),
      waybillNumber: waybillNumber.trim(),
      signatureDate: new Date().toISOString(),
    };

    await enqueueOfflineAction('PROOF_OF_DELIVERY', payload);
    await updateLocalCargoStatus('TF-LOAD-8805', 'delivered');

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

  return (
    <View style={styles.screen}>
      <ConnectivityHeader
        isOnline={isOnline}
        pendingCount={pendingCount}
        onToggleNetwork={handleToggleNetwork}
        onOpenQueue={handleOpenQueue}
        currentUser={currentUser}
        onSignOut={onSignOut}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Active Trip Header */}
        <View style={styles.tripCard}>
          <View style={styles.tripTopRow}>
            <View style={styles.tripTag}>
              <Text style={styles.tripTagText}>
                {tripCompleted ? 'Completed' : 'Active Trip'}
              </Text>
            </View>
            <Text style={styles.truckPlate}>
              Truck: {currentUser?.licensePlate || '3-AA-98214'}
            </Text>
          </View>

          <Text style={styles.tripTitle}>Structural Steel (40T)</Text>
          <Text style={styles.tripSubtitle}>
            TF-LOAD-8805
          </Text>

          {/* Progress Strip */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressText}>
                {completedCount} of {waypoints.length} Stops ({progressPercent}%)
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercent}%` },
                  tripCompleted && { backgroundColor: THEME.colors.primary },
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
              <Feather name="alert-circle" size={14} color={THEME.colors.amber} />
              <Text style={styles.incidentBtnText}>Report Delay</Text>
            </TouchableOpacity>

            {completedCount >= 4 && !tripCompleted && (
              <TouchableOpacity
                style={styles.podBtn}
                onPress={() => setPodModalVisible(true)}
                activeOpacity={0.7}
              >
                <Feather name="check-square" size={14} color={THEME.colors.primaryText} />
                <Text style={styles.podBtnText}>Proof of Delivery</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Corridor Waypoint Timeline */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Waypoints</Text>
          <Text style={styles.sectionSub}>Djibouti – Modjo (910 km)</Text>
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
                      isDone && styles.nodeCircleDone,
                      isCurrent && styles.nodeCircleCurrent,
                    ]}
                  >
                    {isDone ? (
                      <Feather name="check" size={11} color={THEME.colors.primaryText} />
                    ) : (
                      <Text
                        style={[
                          styles.nodeIndex,
                          isCurrent && styles.nodeIndexCurrent,
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
                        isDone && styles.connectorLineDone,
                      ]}
                    />
                  )}
                </View>

                <View
                  style={[
                    styles.waypointCard,
                    isCurrent && styles.waypointCardCurrent,
                  ]}
                >
                  <View style={styles.wpHeader}>
                    <Text style={styles.wpName}>{wp.name}</Text>
                    <Text style={styles.wpKm}>{wp.kmFromOrigin} km</Text>
                  </View>

                  <Text style={styles.wpLeg}>{wp.corridorLeg}</Text>

                  {isDone && (
                    <View style={styles.verifiedRow}>
                      <Feather name="check-circle" size={12} color={THEME.colors.primary} />
                      <Text style={styles.verifiedText}>Verified: {wp.timestamp}</Text>
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
                          Check In
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
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
          <View style={styles.modalContent}>
            <View style={styles.dragHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Delay</Text>
              <TouchableOpacity
                onPress={() => setIncidentModalVisible(false)}
                style={styles.modalClose}
              >
                <Feather name="x" size={18} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.incidentChips}>
              {INCIDENT_TYPES.map((type) => {
                const active = selectedIncidentType === type.key;
                return (
                  <TouchableOpacity
                    key={type.key}
                    style={[styles.typeChip, active && styles.typeChipActive]}
                    onPress={() => setSelectedIncidentType(type.key)}
                    activeOpacity={0.7}
                  >
                    <Feather
                      name={type.icon}
                      size={12}
                      color={active ? THEME.colors.amber : THEME.colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.typeChipText,
                        active && styles.typeChipTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.notesLabel}>Notes</Text>
            <TextInput
              style={styles.notesInput}
              value={incidentNotes}
              onChangeText={setIncidentNotes}
              placeholder="Describe delay reason..."
              placeholderTextColor={THEME.colors.textDim}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIncidentModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitIncidentBtn,
                  !incidentNotes.trim() && { opacity: 0.4 },
                ]}
                onPress={handleSubmitIncident}
                disabled={!incidentNotes.trim()}
              >
                <Text style={styles.submitIncidentBtnText}>Submit</Text>
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
          <View style={styles.modalContent}>
            <View style={styles.dragHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Proof of Delivery</Text>
              <TouchableOpacity
                onPress={() => setPodModalVisible(false)}
                style={styles.modalClose}
              >
                <Feather name="x" size={18} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.notesLabel}>Receiver Name</Text>
              <TextInput
                style={styles.textInput}
                value={receiverName}
                onChangeText={setReceiverName}
                placeholder="Receiver name"
                placeholderTextColor={THEME.colors.textDim}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.notesLabel}>Waybill Reference</Text>
              <TextInput
                style={styles.textInput}
                value={waybillNumber}
                onChangeText={setWaybillNumber}
                placeholder="e.g. TF-WB-9102"
                placeholderTextColor={THEME.colors.textDim}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setPodModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitPodBtn,
                  !receiverName.trim() && { opacity: 0.4 },
                ]}
                onPress={handleConfirmPod}
                disabled={!receiverName.trim()}
              >
                <Text style={styles.submitPodBtnText}>Sign & Complete</Text>
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
    backgroundColor: THEME.colors.surfaceElevated,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  cancelBtnText: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
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
});
