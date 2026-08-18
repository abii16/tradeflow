// TradeFlow Mobile — Bid Modal
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CargoLoad } from '../types/cargo';

interface Props {
  visible: boolean;
  cargo: CargoLoad | null;
  onSubmit: (cargoId: string, amountETB: number, licensePlate: string, estimatedArrival: string) => void;
  onClose: () => void;
}

export default function BidModal({ visible, cargo, onSubmit, onClose }: Props) {
  const [amount, setAmount] = useState('');
  const [plate, setPlate] = useState('');
  const [eta, setEta] = useState('');

  const handleSubmit = () => {
    if (!cargo) return;
    const numAmount = parseInt(amount, 10);
    if (!numAmount || !plate.trim()) return;
    onSubmit(cargo.id, numAmount, plate.trim(), eta.trim() || 'TBD');
    setAmount('');
    setPlate('');
    setEta('');
    onClose();
  };

  const canSubmit = amount.trim().length > 0 && plate.trim().length > 0;

  if (!cargo) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Place Bid</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Cargo summary */}
          <View style={styles.summary}>
            <Text style={styles.summaryId}>{cargo.id}</Text>
            <Text style={styles.summaryTitle}>{cargo.title}</Text>
            <Text style={styles.summaryRoute}>
              {cargo.origin} → {cargo.destination}
            </Text>
            <Text style={styles.summaryRate}>
              Listed rate: {cargo.rateETB.toLocaleString('en-US')} ETB
            </Text>
          </View>

          {/* Form fields */}
          <View style={styles.field}>
            <Text style={styles.label}>Bid Amount (ETB)</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="e.g. 330000"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>License Plate</Text>
            <TextInput
              style={styles.input}
              value={plate}
              onChangeText={setPlate}
              placeholder="e.g. 3-AA-12345"
              placeholderTextColor="#64748b"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Estimated Arrival</Text>
            <TextInput
              style={styles.input}
              value={eta}
              onChangeText={setEta}
              placeholder="e.g. 2026-08-22 14:00"
              placeholderTextColor="#64748b"
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.7}
              disabled={!canSubmit}
            >
              <Text style={styles.submitText}>Submit Bid</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  closeBtn: {
    fontSize: 16,
    color: '#94a3b8',
    paddingHorizontal: 4,
  },
  summary: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  summaryId: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 2,
  },
  summaryRoute: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 2,
  },
  summaryRate: {
    fontSize: 12,
    color: '#64748b',
  },
  field: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  label: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f1f5f9',
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 4,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#475569',
  },
  cancelText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#475569',
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitText: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: '600',
  },
});
