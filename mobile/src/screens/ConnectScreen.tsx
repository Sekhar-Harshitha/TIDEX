import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, FlatList } from 'react-native';
import { Network, Bluetooth, Wifi } from 'lucide-react-native';

export const ConnectScreen = () => {
  const [isMeshActive, setIsMeshActive] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Network size={32} color="#6366f1" />
        <Text style={styles.title}>Connectivity</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconBox}>
            <Bluetooth size={24} color="#6366f1" />
          </View>
          <View style={styles.info}>
            <Text style={styles.cardTitle}>Bluetooth Mesh</Text>
            <Text style={styles.cardSub}>Offline communication fallback</Text>
          </View>
          <Switch value={isMeshActive} onValueChange={setIsMeshActive} />
        </View>
      </View>

      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>Network Status</Text>
        <View style={styles.statusRow}>
          <Wifi size={20} color="#10b981" />
          <Text style={styles.statusText}>Online (4G/LTE)</Text>
        </View>
      </View>

      <View style={styles.meshLogs}>
        <Text style={styles.sectionTitle}>Mesh Traffic</Text>
        <View style={styles.emptyLogs}>
          <Text style={styles.emptyText}>No mesh traffic detected.</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 25, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { p: 10, backgroundColor: '#eef2ff', borderRadius: 15, padding: 12 },
  info: { flex: 1, marginLeft: 15 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  cardSub: { fontSize: 12, color: '#64748b' },
  statusSection: { marginTop: 30 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ecfdf5', padding: 15, borderRadius: 15 },
  statusText: { color: '#065f46', fontWeight: 'bold' },
  meshLogs: { marginTop: 30, flex: 1 },
  emptyLogs: { flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.5 },
  emptyText: { color: '#64748b' }
});
