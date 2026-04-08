import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Switch, Pressable, PermissionsAndroid, Platform } from 'react-native';
import { Network, Bluetooth, Wifi, ShieldAlert, Radio } from 'lucide-react-native';
import { getSessionUserIdOrThrow } from '../services/authSession';
import { triggerSos, startMeshService, stopMeshService, isMeshModuleAvailable, bindCurrentUser } from '../services/meshNative';

export const ConnectScreen = () => {
  const [isMeshActive, setIsMeshActive] = useState(false);
  const [statusText, setStatusText] = useState('Idle');

  const moduleAvailable = useMemo(() => isMeshModuleAvailable(), []);

  const requestAndroidPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      setStatusText('Android only feature');
      return false;
    }

    const required = [
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.FOREGROUND_SERVICE,
    ];

    const result = await PermissionsAndroid.requestMultiple(required);
    const allGranted = required.every((p) => result[p] === PermissionsAndroid.RESULTS.GRANTED);
    if (!allGranted) {
      setStatusText('Required permissions denied');
    }
    return allGranted;
  };

  const handleToggleMesh = async (nextValue: boolean) => {
    if (!moduleAvailable) {
      setStatusText('Native mesh module not linked');
      return;
    }

    if (nextValue) {
      const granted = await requestAndroidPermissions();
      if (!granted) return;

      try {
        const userId = await getSessionUserIdOrThrow();
        await bindCurrentUser(userId);
        await startMeshService();
        setIsMeshActive(true);
        setStatusText(`Mesh active for user ${userId}`);
      } catch (error: any) {
        setStatusText(`Mesh start failed: ${error?.message || 'unknown error'}`);
      }
      return;
    }

    try {
      await stopMeshService();
      setIsMeshActive(false);
      setStatusText('Mesh service stopped');
    } catch (error: any) {
      setStatusText(`Stop failed: ${error?.message || 'unknown error'}`);
    }
  };

  const handleTriggerSOS = async () => {
    if (!moduleAvailable) {
      setStatusText('Native mesh module not linked');
      return;
    }

    const granted = await requestAndroidPermissions();
    if (!granted) return;

    try {
      const userId = await getSessionUserIdOrThrow();
      await bindCurrentUser(userId);
      await triggerSos();
      setStatusText('SOS triggered. Check Logcat for sent/received/forwarded logs.');
    } catch (error: any) {
      setStatusText(`SOS failed: ${error?.message || 'unknown error'}`);
    }
  };

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
          <Switch value={isMeshActive} onValueChange={handleToggleMesh} />
        </View>
      </View>

      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>Network Status</Text>
        <View style={styles.statusRow}>
          <Wifi size={20} color="#10b981" />
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      </View>

      <Pressable style={styles.sosButton} onPress={handleTriggerSOS}>
        <ShieldAlert size={20} color="#fff" />
        <Text style={styles.sosText}>Trigger Real SOS</Text>
      </Pressable>

      <View style={styles.meshLogs}>
        <Text style={styles.sectionTitle}>Mesh Traffic</Text>
        <View style={styles.emptyLogs}>
          <Radio size={18} color="#64748b" />
          <Text style={styles.emptyText}>Use Logcat tag SOSMeshService for sent/received/forwarded events.</Text>
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
  iconBox: { backgroundColor: '#eef2ff', borderRadius: 15, padding: 12 },
  info: { flex: 1, marginLeft: 15 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  cardSub: { fontSize: 12, color: '#64748b' },
  statusSection: { marginTop: 30 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ecfdf5', padding: 15, borderRadius: 15 },
  statusText: { color: '#065f46', fontWeight: 'bold' },
  sosButton: {
    marginTop: 20,
    backgroundColor: '#dc2626',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sosText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  meshLogs: { marginTop: 30, flex: 1 },
  emptyLogs: { flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.7, gap: 10, paddingHorizontal: 20 },
  emptyText: { color: '#64748b', textAlign: 'center' }
});
