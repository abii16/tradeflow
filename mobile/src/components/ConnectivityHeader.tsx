// TradeFlow Mobile — Connectivity Header
import React from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  isOnline: boolean;
  pendingCount: number;
  onToggleNetwork: () => void;
  onOpenQueue: () => void;
}

export default function ConnectivityHeader({
  isOnline,
  pendingCount,
  onToggleNetwork,
  onOpenQueue,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={[styles.dot, isOnline ? styles.dotOnline : styles.dotOffline]} />
        <Text style={styles.statusText}>
          {isOnline ? 'Online' : 'Offline'}
        </Text>
        <Switch
          value={isOnline}
          onValueChange={onToggleNetwork}
          trackColor={{ false: '#475569', true: '#334155' }}
          thumbColor={isOnline ? '#22c55e' : '#94a3b8'}
          style={styles.toggle}
        />
      </View>

      {pendingCount > 0 && (
        <TouchableOpacity style={styles.queueBadge} onPress={onOpenQueue} activeOpacity={0.7}>
          <Text style={styles.queueText}>
            {pendingCount} pending
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOnline: {
    backgroundColor: '#22c55e',
  },
  dotOffline: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    color: '#cbd5e1',
    fontSize: 13,
  },
  toggle: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  queueBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#475569',
  },
  queueText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '500',
  },
});
