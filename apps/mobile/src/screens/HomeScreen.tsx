import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { CloudSun, Wind, Droplets } from 'lucide-react-native';

export const HomeScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chennai, India</Text>
        <Text style={styles.subtitle}>10-Day Forecast</Text>
      </View>

      <View style={styles.currentWeather}>
        <CloudSun size={64} color="#0ea5e9" />
        <Text style={styles.temp}>32°C</Text>
        <Text style={styles.condition}>Partly Cloudy</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Wind size={24} color="#94a3b8" />
          <Text style={styles.statValue}>12 km/h</Text>
          <Text style={styles.statLabel}>Wind</Text>
        </View>
        <View style={styles.statCard}>
          <Droplets size={24} color="#94a3b8" />
          <Text style={styles.statValue}>65%</Text>
          <Text style={styles.statLabel}>Humidity</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#0f172a' },
  subtitle: { fontSize: 16, color: '#64748b' },
  currentWeather: { alignItems: 'center', padding: 40 },
  temp: { fontSize: 64, fontWeight: 'bold', color: '#0f172a', marginTop: 10 },
  condition: { fontSize: 20, color: '#0ea5e9', fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 20 },
  statCard: { alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 20, width: '45%', elevation: 2 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginTop: 5 },
  statLabel: { fontSize: 12, color: '#64748b' }
});
