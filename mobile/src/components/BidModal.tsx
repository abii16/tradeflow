// TradeFlow Mobile — Bid Modal (Web Drawer Look)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { CargoLoad } from '../types/cargo';
import { THEME } from '../styles/theme';

interface Props {
  visible: boolean;
  cargo: CargoLoad | null;
  onSubmit: (
    cargoId: string,
    amountETB: number,
    licensePlate: string,
    estimatedArrival: string
  ) => void;
  onClose: () => void;
}

export default function BidModal({ visible, cargo, onSubmit, onClose }: Props) {
  const [amount, setAmount] = useState('');
  const [plate, setPlate] = useState('');
  const [eta, setEta] = useState('');

  // Auto-fill default rate when modal opens
  useEffect(() => {
    if (cargo) {
      setAmount(String(cargo.rateETB));
      setEta('24 Hours');
    }
  }, [cargo]);

  if (!cargo) return null;

  const handleApplyPreset = (multiplier: number) => {
    const val = Math.round((cargo.rateETB * multiplier) / 1000) * 1000;
    setAmount(String(val));
  };

  const handleSubmit = () => {
    const numAmount = parseInt(amount.replace(/,/g, ''), 10);
    if (!numAmount || !plate.trim()) return;
    onSubmit(cargo.id, numAmount, plate.trim().toUpperCase(), eta.trim() || '24h');
    setPlate('');
    onClose();
  };

  const canSubmit = amount.trim().length > 0 && plate.trim().length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <View style={styles.titleRow}>
                  <Text style={styles.headerTitle}>Submit Haul Tender</Text>
                  <View style={styles.liveTag}>
                    <Text style={styles.liveTagText}>DIRECT BID</Text>
                  </View>
                </View>
                <Text style={styles.headerSub}>
                  Corridor Carrier Allocation • {cargo.id}
                </Text>
              </View>

              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <Feather name="x" size={18} color={THEME.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Cargo Quick Summary Banner */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryTop}>
                <Text style={styles.summaryTitle} numberOfLines={1}>
                  {cargo.title}
                </Text>
                <Text style={styles.summaryWeight}>{cargo.weightTons} T Payload</Text>
              </View>

              <View style={styles.summaryRouteRow}>
                <Text style={styles.summaryCity}>{cargo.origin}</Text>
                <Feather name="arrow-right" size={12} color={THEME.colors.textMuted} />
                <Text style={styles.summaryCity}>{cargo.destination}</Text>
                <Text style={styles.summaryKm}>({cargo.distanceKm} km)</Text>
              </View>

              <View style={styles.rateRefRow}>
                <Text style={styles.rateRefLabel}>Shipper's Benchmark Rate:</Text>
                <Text style={styles.rateRefValue}>
                  {cargo.rateETB.toLocaleString('en-US')} ETB
                </Text>
              </View>
            </View>

            {/* Preset Rate Chips */}
            <View style={styles.presetSection}>
              <Text style={styles.sectionLabel}>QUICK BID BENCHMARKS</Text>
              <View style={styles.presetRow}>
                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => handleApplyPreset(0.95)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.presetChipText}>-5% Competitive</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.presetChip, styles.presetChipActive]}
                  onPress={() => handleApplyPreset(1.0)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.presetChipText, styles.presetChipTextActive]}>
                    Target Rate
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => handleApplyPreset(1.05)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.presetChipText}>+5% Premium</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Form Fields */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>PROPOSED RATE (ETB)</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputPrefix}>ETB</Text>
                <TextInput
                  style={styles.input}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="e.g. 340000"
                  placeholderTextColor={THEME.colors.textDim}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>ASSIGNED TRUCK PLATE</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="truck"
                  size={16}
                  color={THEME.colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={plate}
                  onChangeText={setPlate}
                  placeholder="e.g. 3-AA-98214"
                  placeholderTextColor={THEME.colors.textDim}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>ESTIMATED PICKUP TO DISPATCH</Text>
              <View style={styles.inputWrapper}>
                <Feather
                  name="clock"
                  size={14}
                  color={THEME.colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={eta}
                  onChangeText={setEta}
                  placeholder="e.g. 24 Hours / Ready at 06:00"
                  placeholderTextColor={THEME.colors.textDim}
                />
              </View>
            </View>

            {/* Offline-First Notice Banner */}
            <View style={styles.offlineNotice}>
              <Ionicons
                name="shield-checkmark"
                size={14}
                color={THEME.colors.emerald}
              />
              <Text style={styles.offlineNoticeText}>
                Offline Protected: If cell reception drops, your bid is instantly
                secured in local SQLite and auto-syncs when online.
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit}
                activeOpacity={0.8}
              >
                <Text style={styles.submitBtnText}>Confirm Bid</Text>
                <Feather
                  name="check"
                  size={15}
                  color={THEME.colors.emeraldText}
                />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  sheet: {
    backgroundColor: THEME.colors.backgroundSurface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '90%',
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.colors.borderLight,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  liveTag: {
    backgroundColor: THEME.colors.emeraldGlow,
    borderWidth: 1,
    borderColor: 'rgba(62, 207, 142, 0.35)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  liveTagText: {
    color: THEME.colors.emerald,
    fontSize: 9,
    fontWeight: '700',
  },
  headerSub: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontFamily: THEME.typography.fontMono,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
  },
  summaryWeight: {
    color: THEME.colors.blue,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: THEME.typography.fontMono,
  },
  summaryRouteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  summaryCity: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  summaryKm: {
    color: THEME.colors.textDim,
    fontSize: 11,
    fontFamily: THEME.typography.fontMono,
  },
  rateRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderMuted,
    paddingTop: 8,
  },
  rateRefLabel: {
    color: THEME.colors.textMuted,
    fontSize: 11,
  },
  rateRefValue: {
    color: THEME.colors.emerald,
    fontSize: 12.5,
    fontWeight: '700',
    fontFamily: THEME.typography.fontMono,
  },
  presetSection: {
    marginBottom: 14,
  },
  sectionLabel: {
    color: THEME.colors.textMuted,
    fontSize: 9.5,
    fontWeight: '700',
    fontFamily: THEME.typography.fontMono,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChip: {
    flex: 1,
    backgroundColor: '#222222',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  presetChipActive: {
    backgroundColor: THEME.colors.emeraldGlow,
    borderColor: 'rgba(62, 207, 142, 0.4)',
  },
  presetChipText: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  presetChipTextActive: {
    color: THEME.colors.emerald,
    fontWeight: '700',
  },
  field: {
    marginBottom: 14,
  },
  fieldLabel: {
    color: THEME.colors.textMuted,
    fontSize: 9.5,
    fontWeight: '700',
    fontFamily: THEME.typography.fontMono,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputPrefix: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: THEME.typography.fontMono,
    marginRight: 8,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: THEME.colors.textPrimary,
    fontSize: 14,
    paddingVertical: 10,
    fontFamily: THEME.typography.fontMono,
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16221A',
    borderWidth: 1,
    borderColor: 'rgba(62, 207, 142, 0.25)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 18,
  },
  offlineNoticeText: {
    color: THEME.colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 15,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#242424',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: THEME.colors.emerald,
    paddingVertical: 13,
    borderRadius: 10,
    shadowColor: THEME.colors.emerald,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    color: THEME.colors.emeraldText,
    fontSize: 13,
    fontWeight: '800',
  },
});
