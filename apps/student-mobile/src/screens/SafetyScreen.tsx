import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ShieldCheck, Flame, Waves, Wind, Zap } from 'lucide-react-native';

export const SafetyScreen = () => {
  const guides = [
    { title: 'Flood Safety', icon: <Waves size={24} color="#0ea5e9" />, color: '#e0f2fe' },
    { title: 'Fire Safety', icon: <Flame size={24} color="#f97316" />, color: '#ffedd5' },
    { title: 'Cyclone Prep', icon: <Wind size={24} color="#06b6d4" />, color: '#ecfeff' },
    { title: 'Electrical', icon: <Zap size={24} color="#eab308" />, color: '#fefce8' }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <ShieldCheck size={32} color="#10b981" />
        <Text style={styles.title}>Safety Protocols</Text>
      </View>

      <View style={styles.grid}>
        {guides.map((guide, idx) => (
          <TouchableOpacity key={idx} style={[styles.card, { backgroundColor: guide.color }]}>
            {guide.icon}
            <Text style={styles.cardTitle}>{guide.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.emergencyCard}>
        <Text style={styles.emergencyTitle}>Emergency Contacts</Text>
        <View style={styles.contactRow}>
          <Text style={styles.contactLabel}>National Emergency</Text>
          <Text style={styles.contactValue}>112</Text>
        </View>
        <View style={styles.contactRow}>
          <Text style={styles.contactLabel}>Disaster Management</Text>
          <Text style={styles.contactValue}>1070</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  card: { width: '47%', padding: 25, borderRadius: 25, alignItems: 'center', gap: 10 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  emergencyCard: { backgroundColor: '#fff', padding: 25, borderRadius: 25, marginTop: 30, elevation: 2 },
  emergencyTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 20 },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', pb: 10 },
  contactLabel: { color: '#64748b', fontSize: 14 },
  contactValue: { color: '#ef4444', fontWeight: 'bold', fontSize: 16 }
});
