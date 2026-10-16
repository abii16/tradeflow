// TradeFlow Mobile — Bid Bottom Sheet (Clean, Functional UI)
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
import { Feather } from '@expo/vector-icons';
import { CargoLoad } from '../types/cargo';
import { THEME } from '../styles/theme';
import { useTheme } from '../context/ThemeContext';

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
  const { theme } = useTheme();
  const [amount, setAmount] = useState('');
  const [plate, setPlate] = useState('');
  const [eta, setEta] = useState('');

  useEffect(() => {
    if (cargo) {
      setAmount(String(cargo.rateETB));
      setEta('Ready in 24 hours');
    }
  }, [cargo]);

  if (!cargo) return null;

  const handlePreset = (multiplier: number) => {
    const val = Math.round((cargo.rateETB * multiplier) / 1000) * 1000;
    setAmount(String(val));
  };

  const handleSubmit = () => {
    const cleanAmount = parseInt(amount.replace(/,/g, ''), 10);
    if (!cleanAmount || !plate.trim()) return;
    onSubmit(cargo.id, cleanAmount, plate.trim().toUpperCase(), eta.trim() || 'Ready');
    setPlate('');
    onClose();
  };

  const isValid = amount.trim().length > 0 && plate.trim().length > 0;

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

        <View
          style={[
            styles.sheet,
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

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                  Place Bid
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.colors.textMuted }]}>
                  {cargo.id} • {cargo.cargoType}
                </Text>
              </View>

              <TouchableOpacity
                onPress={onClose}
                style={[
                  styles.closeBtn,
                  { backgroundColor: theme.colors.surfaceElevated },
                ]}
                activeOpacity={0.7}
              >
                <Feather name="x" size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Load Snapshot */}
            <View
              style={[
                styles.summaryBox,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: theme.colors.cardBorder,
                },
              ]}
            >
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>
                  Route
                </Text>
                <Text style={[styles.summaryValue, { color: theme.colors.textSecondary }]}>
                  {cargo.origin} → {cargo.destination} ({cargo.distanceKm} km)
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>
                  Payload
                </Text>
                <Text style={[styles.summaryValue, { color: theme.colors.textSecondary }]}>
                  {cargo.weightTons} tons
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>
                  Listed Rate
                </Text>
                <Text style={[styles.summaryHighlight, { color: theme.colors.primary }]}>
                  {cargo.rateETB.toLocaleString('en-US')} ETB
                </Text>
              </View>
            </View>

            {/* Quick Adjustments */}
            <View style={styles.presetSection}>
              <Text style={[styles.inputLabel, { color: theme.colors.textMuted }]}>
                Adjustment
              </Text>
              <View style={styles.presetRow}>
                <TouchableOpacity
                  style={[
                    styles.presetBtn,
                    {
                      backgroundColor: theme.colors.surfaceElevated,
                      borderColor: theme.colors.cardBorder,
                    },
                  ]}
                  onPress={() => handlePreset(0.95)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.presetBtnText, { color: theme.colors.textSecondary }]}>
                    -5%
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.presetBtn,
                    {
                      backgroundColor: theme.colors.primarySubtle,
                      borderColor: theme.colors.primaryBorder,
                    },
                  ]}
                  onPress={() => handlePreset(1.0)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.presetBtnText,
                      { color: theme.colors.primary, fontWeight: '700' },
                    ]}
                  >
                    Listed Rate
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.presetBtn,
                    {
                      backgroundColor: theme.colors.surfaceElevated,
                      borderColor: theme.colors.cardBorder,
                    },
                  ]}
                  onPress={() => handlePreset(1.05)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.presetBtnText, { color: theme.colors.textSecondary }]}>
                    +5%
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Form Inputs */}
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.textMuted }]}>
                Bid (ETB)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.cardBorder,
                    color: theme.colors.textPrimary,
                  },
                ]}
                value={amount}
                onChangeText={setAmount}
                placeholder="e.g. 340000"
                placeholderTextColor={theme.colors.textDim}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.textMuted }]}>
                Truck Plate
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.cardBorder,
                    color: theme.colors.textPrimary,
                  },
                ]}
                value={plate}
                onChangeText={setPlate}
                placeholder="e.g. 3-AA-12345"
                placeholderTextColor={theme.colors.textDim}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.textMuted }]}>
                Availability
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.cardBorder,
                    color: theme.colors.textPrimary,
                  },
                ]}
                value={eta}
                onChangeText={setEta}
                placeholder="e.g. Ready in 24 hours"
                placeholderTextColor={theme.colors.textDim}
              />
            </View>

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  {
                    backgroundColor: theme.colors.redSubtle,
                    borderColor: theme.colors.redBorder,
                  },
                ]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.red }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: theme.colors.primary },
                  !isValid && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!isValid}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.submitButtonText,
                    { color: theme.colors.primaryText },
                  ]}
                >
                  Submit Bid
                </Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  sheet: {
    backgroundColor: THEME.colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '85%',
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    fontFamily: THEME.typography.mono,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: THEME.colors.surfaceElevated,
  },
  summaryBox: {
    backgroundColor: THEME.colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: THEME.colors.textMuted,
    fontSize: 12,
  },
  summaryValue: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  summaryHighlight: {
    color: THEME.colors.primary,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: THEME.typography.mono,
  },
  presetSection: {
    marginBottom: 16,
  },
  inputLabel: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  presetBtnActive: {
    borderColor: THEME.colors.primaryBorder,
    backgroundColor: THEME.colors.primarySubtle,
  },
  presetBtnText: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  presetBtnTextActive: {
    color: THEME.colors.primary,
  },
  formGroup: {
    marginBottom: 14,
  },
  input: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontFamily: THEME.typography.mono,
  },
  offlineNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    marginBottom: 16,
  },
  offlineNoteText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: THEME.colors.redSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.redBorder,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: THEME.colors.red,
    fontSize: 14,
    fontWeight: '700',
  },
  submitButton: {
    flex: 2,
    backgroundColor: THEME.colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    color: THEME.colors.primaryText,
    fontSize: 14,
    fontWeight: '700',
  },
});
