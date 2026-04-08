import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Share2, MapPin, ShieldCheck } from 'lucide-react-native';

export const SocialScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Share2 size={32} color="#6366f1" />
        <Text style={styles.title}>Social Intelligence</Text>
      </View>

      <View style={styles.alertCard}>
        <View style={styles.alertHeader}>
          <Text style={styles.alertType}>Flood Alert</Text>
          <Text style={styles.alertTime}>5m ago</Text>
        </View>
        <Text style={styles.alertLoc}>Marina Beach Area</Text>
        <Text style={styles.alertDesc}>Multiple reports of rising water levels near the lighthouse.</Text>
        <View style={styles.verifiedBadge}>
          <ShieldCheck size={14} color="#10b981" />
          <Text style={styles.verifiedText}>Verified by 12 people</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Reports</Text>
      {[1, 2, 3].map(i => (
        <View key={i} style={styles.reportItem}>
          <View style={styles.reportAvatar} />
          <View style={styles.reportContent}>
            <Text style={styles.reportUser}>Citizen {i}</Text>
            <Text style={styles.reportText}>Heavy rain causing visibility issues on the main road.</Text>
            <Text style={styles.reportMeta}>12:45 PM • Road Hazard</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  alertCard: { backgroundColor: '#fff', padding: 20, borderRadius: 25, borderLeftWidth: 5, borderLeftColor: '#ef4444', elevation: 2, marginBottom: 30 },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  alertType: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  alertTime: { fontSize: 12, color: '#94a3b8' },
  alertLoc: { fontSize: 14, fontWeight: 'bold', color: '#ef4444', marginBottom: 10 },
  alertDesc: { fontSize: 14, color: '#64748b', lineHeight: 20, marginBottom: 15 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#ecfdf5', padding: 8, borderRadius: 10, alignSelf: 'flex-start' },
  verifiedText: { fontSize: 12, color: '#059669', fontWeight: 'bold' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15 },
  reportItem: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  reportAvatar: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#e2e8f0' },
  reportContent: { flex: 1 },
  reportUser: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginBottom: 2 },
  reportText: { fontSize: 13, color: '#64748b', lineHeight: 18 },
  reportMeta: { fontSize: 11, color: '#94a3b8', marginTop: 5, fontWeight: 'bold' }
});
